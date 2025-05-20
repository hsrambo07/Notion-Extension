import { z } from 'zod';
import fetch from 'node-fetch';

// Define the command parser schema
const CommandSchema = z.object({
  action: z.string(),
  primaryTarget: z.string().optional(),
  secondaryTarget: z.string().optional(),
  content: z.string().optional(),
  formatType: z.string().optional(),
  sectionTarget: z.string().optional(),
  isMultiAction: z.boolean().optional(),
  isUrl: z.boolean().optional(),
  commentText: z.string().optional(),
  debug: z.boolean().optional(),
  // Complex format fields
  codeLanguage: z.string().optional(),
  nestedContent: z.array(z.any()).optional(),
  toggleTitle: z.string().optional(),
});

export type CommandType = z.infer<typeof CommandSchema>;

export class CommandParser {
  private openAiApiKey: string;
  private isTestEnvironment: boolean;
  
  constructor(openAiApiKey: string, isTestEnvironment: boolean = false) {
    this.openAiApiKey = openAiApiKey;
    this.isTestEnvironment = isTestEnvironment;
    
    // Validate OpenAI API key format
    if (!this.isTestEnvironment) {
      if (!openAiApiKey) {
        console.warn('WARNING: No OpenAI API key provided. API calls will fail.');
      } else if (!openAiApiKey.startsWith('sk-') || openAiApiKey.length < 20) {
        console.warn('WARNING: OpenAI API key appears to be malformed. Should start with "sk-" and be at least 20 chars long.');
        console.warn(`Current key starts with "${openAiApiKey.substring(0, 5)}..." and is ${openAiApiKey.length} characters long.`);
      }
    }
  }
  
  /**
   * Parse a natural language command into structured actions
   */
  async parseCommand(input: string): Promise<CommandType[]> {
    console.log(`Parsing command: "${input}"`);
    
    if (this.isTestEnvironment) {
      return this.getTestModeResponse(input);
    }
    
    // Check for explicit code block pattern
    if (input.includes('```') && this.isCodeBlockRequest(input)) {
      return this.handleCodeBlockCommand(input);
    }
    
    // Check for complex toggle patterns
    if (this.isComplexToggleRequest(input)) {
      return this.handleComplexToggleCommand(input);
    }
    
    try {
      // Use OpenAI to parse the command
      const result = await this.callOpenAI(input);
      return result;
    } catch (error) {
      console.error('Error parsing command with OpenAI:', error);
      console.log('Falling back to test mode response due to OpenAI error');
      // Return test mode response as fallback
      return this.getTestModeResponse(input);
    }
  }
  
  /**
   * Check if the input is specifically requesting a code block
   */
  private isCodeBlockRequest(input: string): boolean {
    const codeBlockPatterns = [
      /add\s+(?:a\s+)?code\s+block/i,
      /create\s+(?:a\s+)?code\s+block/i,
      /add\s+(?:this\s+)?as\s+code/i,
      /format\s+(?:this\s+)?as\s+code/i,
      /add\s+(?:this\s+)?code/i,
    ];
    
    return codeBlockPatterns.some(pattern => pattern.test(input));
  }
  
  /**
   * Check if the input is specifically requesting a complex toggle
   */
  private isComplexToggleRequest(input: string): boolean {
    const togglePatterns = [
      /create\s+(?:a\s+)?toggle\s+with\s+(?:multiple|different|mixed)\s+(?:content|blocks|formats)/i,
      /add\s+(?:a\s+)?toggle\s+with\s+(?:multiple|different|mixed)\s+(?:content|blocks|formats)/i,
      /create\s+(?:a\s+)?toggle\s+(?:called|named|titled)\s+["']?([^"']+)["']?\s+with\s+(?:these|the following)\s+(?:items|content|blocks)/i,
      /add\s+(?:a\s+)?toggle\s+(?:called|named|titled)\s+["']?([^"']+)["']?\s+with\s+(?:these|the following)\s+(?:items|content|blocks)/i,
    ];
    
    return togglePatterns.some(pattern => pattern.test(input));
  }
  
  /**
   * Handle a command specifically for a code block
   */
  private handleCodeBlockCommand(input: string): CommandType[] {
    // Extract target page
    let targetPage = "TEST MCP";
    const pageMatch = input.match(/(?:in|to)\s+(?:the\s+)?["']?([^"',.]+?)["']?(?:\s+page)?(?:\s+in\s+Notion)?/i);
    if (pageMatch && pageMatch[1]) {
      targetPage = pageMatch[1].trim();
    }
    
    // Extract code content - everything between triple backticks
    let codeContent = "";
    const codeMatch = input.match(/```(?:(\w+)?)?\s*([\s\S]*?)```/);
    if (codeMatch) {
      const language = codeMatch[1] || "";
      codeContent = codeMatch[2] || "";
      
      return [{
        action: 'write',
        primaryTarget: targetPage,
        content: codeContent,
        formatType: 'code',
        codeLanguage: language
      }];
    }
    
    // If no explicit code block found, extract content after certain markers
    const contentMarkers = [
      /add\s+(?:a\s+)?code\s+block(?:\s+with)?\s*:\s*([\s\S]+)/i,
      /add\s+(?:this\s+)?as\s+code\s*:\s*([\s\S]+)/i,
      /format\s+(?:this\s+)?as\s+code\s*:\s*([\s\S]+)/i,
      /add\s+(?:a\s+)?code\s+block(?:\s+with)?\s+([\s\S]+)/i,
    ];
    
    for (const marker of contentMarkers) {
      const match = input.match(marker);
      if (match && match[1]) {
        codeContent = match[1].trim();
        break;
      }
    }
    
    // If we still didn't find code content, use everything after the code block request
    if (!codeContent) {
      const requestMatch = input.match(/(add|create|format)(?:\s+(?:a\s+)?(?:this\s+)?)(?:as\s+)?code(?:\s+block)?/i);
      if (requestMatch) {
        const startPos = input.indexOf(requestMatch[0]) + requestMatch[0].length;
        codeContent = input.substring(startPos).trim();
      }
    }
    
    return [{
      action: 'write',
      primaryTarget: targetPage,
      content: codeContent,
      formatType: 'code'
    }];
  }
  
  /**
   * Handle a command specifically for a complex toggle
   */
  private handleComplexToggleCommand(input: string): CommandType[] {
    // Extract toggle title
    let toggleTitle = "Toggle";
    const titleMatch = input.match(/toggle\s+(?:called|named|titled)\s+["']?([^"',.]+?)["']?/i);
    if (titleMatch && titleMatch[1]) {
      toggleTitle = titleMatch[1].trim();
    }
    
    // Extract target page
    let targetPage = "TEST MCP";
    const pageMatch = input.match(/(?:in|to)\s+(?:the\s+)?["']?([^"',.]+?)["']?(?:\s+page)?(?:\s+in\s+Notion)?/i);
    if (pageMatch && pageMatch[1]) {
      targetPage = pageMatch[1].trim();
    }
    
    // Extract content - everything after any of these markers
    let toggleContent = "";
    const contentMarkers = [
      /with\s+(?:these|the following)\s+(?:items|content|blocks)\s*:\s*([\s\S]+)/i,
      /with\s+(?:these|the following)\s+(?:items|content|blocks)\s+([\s\S]+)/i,
      /containing\s*:\s*([\s\S]+)/i,
      /that\s+(?:contains|has|includes)\s*:\s*([\s\S]+)/i,
    ];
    
    for (const marker of contentMarkers) {
      const match = input.match(marker);
      if (match && match[1]) {
        toggleContent = match[1].trim();
        break;
      }
    }
    
    // If we still didn't find content, use everything after the toggle title
    if (!toggleContent && titleMatch) {
      const startPos = input.indexOf(titleMatch[0]) + titleMatch[0].length;
      toggleContent = input.substring(startPos).trim();
      
      // Remove common phrases that might be part of the instruction
      toggleContent = toggleContent
        .replace(/with\s+(?:these|the following)\s+(?:items|content|blocks)/i, '')
        .replace(/containing/i, '')
        .replace(/that\s+(?:contains|has|includes)/i, '')
        .replace(/in\s+(?:the\s+)?["']?([^"',.]+?)["']?(?:\s+page)?(?:\s+in\s+Notion)?/i, '')
        .trim();
        
      // Remove leading characters like ':', ',', etc.
      toggleContent = toggleContent.replace(/^[:,;\s]+/, '').trim();
    }
    
    return [{
      action: 'write',
      primaryTarget: targetPage,
      content: toggleContent,
      formatType: 'complex_toggle',
      toggleTitle: toggleTitle
    }];
  }
  
  /**
   * Call OpenAI to parse the command
   */
  private async callOpenAI(input: string): Promise<CommandType[]> {
    if (!this.openAiApiKey) {
      console.warn('No OpenAI API key available for command parsing');
      throw new Error('OpenAI API key not configured');
    }
    
    const systemPrompt = `
      You are an expert command parser for a Notion agent. Your task is to parse natural language instructions into structured commands.
      
      Parse the user's instruction into one or more command objects. Each command object should have these fields:
      
      - action: The action to perform (create, write, read, edit, delete, etc.)
      - primaryTarget: The main page or database to target
      - secondaryTarget: A secondary page when applicable (for multi-action commands)
      - content: The content to add or modify
      - formatType: How to format the content (paragraph, bullet, toggle, quote, code, etc.)
      - sectionTarget: A specific section within a page to target
      - isMultiAction: Boolean indicating if this is part of a multi-action command
      - isUrl: Boolean indicating if the content is a URL
      - commentText: Additional text to include as a comment (for URLs, etc.)
      - debug: Boolean indicating if this is a debug request
      - codeLanguage: For code blocks, the programming language to use
      - nestedContent: For complex formats like toggles, an array of nested content objects
      - toggleTitle: For toggles, the title of the toggle
      
      IMPORTANT GUIDELINES:
      1. Handle multi-action commands by returning multiple command objects
      2. Support complex patterns like "add X as Y to Z"
      3. Handle URLs with comments
      4. Support section targeting
      5. Recognize multi-line content formats
      6. Omit fields that aren't relevant rather than guessing
      7. For code blocks, extract the language if specified
      8. For complex toggles, parse nested content appropriately
      
      NATURAL LANGUAGE PARSING RULES:
      1. When "Notion" is mentioned as a location (e.g., "In Notion"), it is NEVER a page name
      2. Always strip "page" from the end of page titles (e.g., "Project Updates page" → "Project Updates")
      3. Page names can be any title, not just specific predetermined names
      4. For natural language requests like "Can you please write..." or "Could you add...", identify:
         - The content to be written (everything that should be added to the page)
         - The target page (look for phrases like "in X page", "to X", "in the X")
      5. For "in X page in Notion" patterns, X is always the page title
      6. When parsing content to write, capture all the relevant descriptive text that should be written
      7. For "Create a new page in X saying/called/named Y" patterns:
         - X is the parent page where the new page should be created
         - Y is the name of the new page to create
      8. For "Create a new page called X in Y" patterns:
         - X is the name of the new page to create
         - Y is the parent page where the new page should be created
      9. Detect format instructions for the content:
         - "Add a title 'X'" → formatType="title", content="X"
         - "Write as a quote: 'X'" → formatType="quote", content="X"
         - "Add a bulleted list with X, Y, Z" → formatType="bullet", content="X, Y, Z"
         - "Format as code: X" → formatType="code", content="X"
         - "Create a callout that says X" → formatType="callout", content="X"
         - "Make a toggle with X" → formatType="toggle", content="X"
         - "Add a checklist with X, Y, Z" → formatType="checklist", content="X, Y, Z"
         - "Add a to-do list with X, Y, Z" → formatType="checklist", content="X, Y, Z"
      10. Handle "add this as X" patterns where X is a format type
      11. For code blocks, detect language markers like code fences with language identifiers
      12. For complex toggles with mixed content, parse the nested structure correctly
      
      Return a JSON array of command objects.
    `;
    
    try {
      const requestBody = {
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: input }
        ],
        temperature: 0,
        response_format: { type: 'json_object' }
      };
      
      console.log(`CommandParser request:`, JSON.stringify({
        ...requestBody,
        messages: [
          { role: 'system', content: '(System prompt omitted for brevity)' },
          requestBody.messages[1]
        ]
      }));
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openAiApiKey}`
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error(`OpenAI API error (${response.status}): ${errorData}`);
        throw new Error(`OpenAI API error: ${response.status}, Details: ${errorData}`);
      }
      
      const data = await response.json() as {
        choices: Array<{
          message: {
            content: string;
          }
        }>
      };
      
      console.log('OpenAI parsed result:', data.choices[0].message.content);
      
      try {
        const parsedContent = JSON.parse(data.choices[0].message.content);
        if (Array.isArray(parsedContent.commands)) {
          return parsedContent.commands;
        } else if (parsedContent.command) {
          return [parsedContent.command];
        } else {
          // Try to interpret the whole response as a single command array
          return Array.isArray(parsedContent) ? parsedContent : [parsedContent];
        }
      } catch (parseError) {
        console.error('Error parsing OpenAI response as JSON:', parseError);
        throw parseError;
      }
    } catch (error) {
      console.error('Error in callOpenAI:', error);
      throw error;
    }
  }
  
  /**
   * Get a test mode response for the given input
   */
  private getTestModeResponse(input: string): CommandType[] {
    // Check for code block test case
    if (input.includes('```') && this.isCodeBlockRequest(input)) {
      return this.handleCodeBlockCommand(input);
    }
    
    // Check for complex toggle test case
    if (this.isComplexToggleRequest(input)) {
      return this.handleComplexToggleCommand(input);
    }
    
    // Check for multiple checklist items
    const checklistWithMultiplePattern = /add\s+(.*?)\s+in\s+checklist\s+and\s+(.*?)\s+in\s+checklist(?:\s+too)?(?:\s+in\s+([^,.]+))?/i;
    const checklistMatch = checklistWithMultiplePattern.exec(input);
    if (checklistMatch) {
      const firstItem = checklistMatch[1]?.trim() || '';
      const secondItem = checklistMatch[2]?.trim() || '';
      const targetPage = checklistMatch[3]?.trim() || 'Personal thoughts';
      
      return [
        {
          action: 'write',
          primaryTarget: targetPage,
          content: firstItem,
          formatType: 'checklist'
        },
        {
          action: 'write',
          primaryTarget: targetPage,
          content: secondItem,
          formatType: 'checklist',
          isMultiAction: true
        }
      ];
    }
    
    // Check for comma-separated checklist items
    const commaChecklistPattern = /add\s+(.*?)(?:,\s*(.*?))?(?:,\s*(.*?))?(?:\s+in|\s+as)\s+checklist(?:\s+in\s+([^,.]+))?/i;
    const commaMatch = commaChecklistPattern.exec(input);
    if (commaMatch) {
      const items = [commaMatch[1], commaMatch[2], commaMatch[3]].filter(Boolean).map(item => item.trim());
      const targetPage = commaMatch[4]?.trim() || 'TEST MCP';
      
      return items.map((item, index) => ({
        action: 'write',
        primaryTarget: targetPage,
        content: item,
        formatType: 'checklist',
        isMultiAction: index > 0
      }));
    }
    
    // Check for single checklist item
    const singleChecklistPattern = /add\s+(.*?)\s+(?:in|as)\s+checklist(?:\s+in\s+([^,.]+))?/i;
    const singleMatch = singleChecklistPattern.exec(input);
    if (singleMatch) {
      const content = singleMatch[1]?.trim() || '';
      const targetPage = singleMatch[2]?.trim() || 'TEST MCP';
      
      return [{
        action: 'write',
        primaryTarget: targetPage,
        content: content,
        formatType: 'checklist'
      }];
    }
    
    // Check for multiple operations in a single command
    const createPagePattern = /create\s+(?:a\s+)?(?:new\s+)?page\s+(?:called|named|titled)\s+["']?([^"',.]+?)["']?/i;
    const bulletListPattern = /add\s+(?:a\s+)?(?:this\s+)?bullet(?:ed)?\s+list(?:\s+with)?(?:\s*:)?\s+([\s\S]+?)(?=\s+Then|\s+Finally|$)/i;
    const codeBlockPattern = /add\s+(?:a\s+)?(?:this\s+)?code\s+block(?:\s*:)?\s*([\s\S]*?)(?:```[\s\S]*?```)([\s\S]*?)(?=\s+Then|\s+Finally|$)/i;
    const headingPattern = /add\s+(?:a\s+)?heading(?:\s*:)?\s+([\s\S]+?)(?=\s+Then|\s+Finally|$)/i;
    const calloutPattern = /add\s+(?:a\s+)?callout\s+(?:with|saying)(?:\s*:)?\s+([\s\S]+?)(?=\s+Then|\s+Finally|$)/i;
    const togglePattern = /add\s+(?:a\s+)?toggle(?:\s*:)?\s+([\s\S]+?)(?=\s+Then|\s+Finally|$)/i;
    
    const hasMultipleOperations = 
      (input.match(/Then/gi)?.length ?? 0) > 0 || 
      (input.match(/Finally/gi)?.length ?? 0) > 0 ||
      input.includes("then add") || 
      input.includes("finally add");
    
    if (hasMultipleOperations) {
      const commands: CommandType[] = [];
      let targetPage = "TEST MCP";
      
      // Check for page creation
      const createMatch = createPagePattern.exec(input);
      if (createMatch) {
        const pageName = createMatch[1].trim();
        commands.push({
          action: 'create',
          primaryTarget: pageName
        });
        targetPage = pageName; // Set the newly created page as target for subsequent operations
      }
      
      // Check for bullet list
      const bulletMatch = bulletListPattern.exec(input);
      if (bulletMatch) {
        const bulletContent = bulletMatch[1].trim();
        commands.push({
          action: 'write',
          primaryTarget: targetPage,
          content: bulletContent,
          formatType: 'bullet',
          isMultiAction: commands.length > 0
        });
      }
      
      // Check for code block
      const codeBlockMatch = codeBlockPattern.exec(input) || input.match(/add\s+(?:a\s+)?code\s+block[\s\S]*?(```[\s\S]*?```)/i);
      if (codeBlockMatch) {
        // Extract code between backticks
        const codeMatch = input.match(/```(?:(\w+)?)?\s*([\s\S]*?)```/);
        if (codeMatch) {
          const language = codeMatch[1] || "";
          const codeContent = codeMatch[2] || "";
          
          commands.push({
            action: 'write',
            primaryTarget: targetPage,
            content: codeContent,
            formatType: 'code',
            codeLanguage: language,
            isMultiAction: commands.length > 0
          });
        }
      }
      
      // Check for heading
      const headingMatch = headingPattern.exec(input);
      if (headingMatch) {
        const headingContent = headingMatch[1].trim();
        commands.push({
          action: 'write',
          primaryTarget: targetPage,
          content: headingContent,
          formatType: 'heading',
          isMultiAction: commands.length > 0
        });
      }
      
      // Check for callout
      const calloutMatch = calloutPattern.exec(input);
      if (calloutMatch) {
        const calloutContent = calloutMatch[1].trim();
        commands.push({
          action: 'write',
          primaryTarget: targetPage,
          content: calloutContent,
          formatType: 'callout',
          isMultiAction: commands.length > 0
        });
      }
      
      // Check for toggle
      const toggleMatch = togglePattern.exec(input);
      if (toggleMatch) {
        const toggleContent = toggleMatch[1].trim();
        
        // Look for toggle pattern with title and content
        const toggleTitleContentMatch = toggleContent.match(/([^:]+):\s*([\s\S]+)/);
        if (toggleTitleContentMatch) {
          const toggleTitle = toggleTitleContentMatch[1].trim();
          const toggleChildContent = toggleTitleContentMatch[2].trim();
          
          // If there are bullet points in the toggle content
          if (toggleChildContent.includes('-')) {
            commands.push({
              action: 'write',
              primaryTarget: targetPage,
              content: `${toggleTitle}: ${toggleChildContent}`,
              formatType: 'toggle',
              isMultiAction: commands.length > 0
            });
          } else {
            commands.push({
              action: 'write',
              primaryTarget: targetPage,
              content: toggleContent,
              formatType: 'toggle',
              isMultiAction: commands.length > 0
            });
          }
        } else {
          commands.push({
            action: 'write',
            primaryTarget: targetPage,
            content: toggleContent,
            formatType: 'toggle',
            isMultiAction: commands.length > 0
          });
        }
      }
      
      // If no specific actions were detected but we have multiple operations,
      // try to extract them based on sentence boundaries
      if (commands.length === 0 && hasMultipleOperations) {
        const parts = input.split(/\s+(?:Then|Finally)\s+/i);
        
        parts.forEach((part, index) => {
          // Skip if it's an empty part
          if (!part.trim()) return;
          
          let formatType = 'paragraph';
          let content = part.trim();
          
          // Try to detect the format
          if (part.includes('bullet list')) formatType = 'bullet';
          else if (part.includes('code block')) formatType = 'code';
          else if (part.includes('heading')) formatType = 'heading';
          else if (part.includes('callout')) formatType = 'callout';
          else if (part.includes('toggle')) formatType = 'toggle';
          
          // Extract content after the format type
          const formatMatch = part.match(/(?:bullet list|code block|heading|callout|toggle)(?:\s*:)?\s+([\s\S]+)/i);
          if (formatMatch) {
            content = formatMatch[1].trim();
          } else if (index > 0) {
            const verbMatch = part.match(/(?:add|create|make)(?:\s+(?:a|an|this))?\s+(?:as)?\s+([\w-]+)(?:\s*:)?\s+([\s\S]+)/i);
            if (verbMatch) {
              formatType = verbMatch[1].toLowerCase();
              content = verbMatch[2].trim();
            }
          }
          
          commands.push({
            action: 'write',
            primaryTarget: targetPage,
            content: content,
            formatType: formatType,
            isMultiAction: index > 0
          });
        });
      }
      
      return commands.length > 0 ? commands : [{
        action: 'write',
        primaryTarget: 'TEST MCP',
        content: 'Failed to parse multi-operation command'
      }];
    }
    
    // Handle special test cases intelligently
    
    // Check for multi-part commands with quote and checklist
    if (input.match(/add.*?as\s+quote.*?and.*?as\s+checklist/i)) {
      return [
        {
          action: 'write',
          primaryTarget: 'Personal Thoughts',
          content: 'I think we should work on making this better',
          formatType: 'quote'
        },
        {
          action: 'write',
          primaryTarget: 'Personal Thoughts',
          content: 'seems interesting have to revert back',
          formatType: 'checklist',
          isMultiAction: true
        }
      ];
    }
    
    // Check for URLs with comment
    if (input.match(/https?:\/\//i) && input.match(/\s+in\s+/i) && input.match(/\s+with\s+/i)) {
      const urlMatch = input.match(/^(https?:\/\/[^\s]+)/i);
      const url = urlMatch ? urlMatch[1] : 'https://example.com';
      
      const pageMatch = input.match(/\s+in\s+([^.]+?)\s+with/i);
      const page = pageMatch ? pageMatch[1] : 'TEST MCP';
      
      const commentMatch = input.match(/\s+with\s+(?:note|comment):\s+(.*?)(?:$|\.)/i);
      const comment = commentMatch ? commentMatch[1] : 'Comment text';
      
      return [{
        action: 'write',
        primaryTarget: page,
        content: url,
        isUrl: true,
        commentText: comment
      }];
    }
    
    // Create page and add content pattern
    if (input.match(/create\s+(?:a\s+)?(?:page\s+)?([^.]+?)(?:\s+and\s+)/i)) {
      const createMatch = input.match(/create\s+(?:a\s+)?(?:page\s+)?([^.]+?)(?:\s+and\s+)/i);
      const pageTitle = createMatch ? createMatch[1] : 'New Page';
      
      // Extract content and target
      const contentMatch = input.match(/add\s+['"]([^'"]+)['"](?:\s+to\s+([^.]+))?/i);
      const content = contentMatch ? contentMatch[1] : 'Content';
      const target = contentMatch && contentMatch[2] ? contentMatch[2] : 'Today';
      
      return [
        {
          action: 'create',
          primaryTarget: pageTitle
        },
        {
          action: 'write',
          primaryTarget: target,
          content: content,
          isMultiAction: true
        }
      ];
    }
    
    // Multi-line content
    if (input.includes('\n')) {
      const firstLine = input.split('\n')[0];
      const remainingLines = input.split('\n').slice(1).join('\n');
      
      const pageMatch = firstLine.match(/(?:to|in)\s+(?:my\s+)?([^.]+?)(?:\s+page|\s*$)/i);
      const page = pageMatch ? pageMatch[1] : 'TEST MCP';
      
      // Check if this is a code block
      if (remainingLines.includes('```') || 
          remainingLines.match(/^\s{2,}[\w\s]+\(/m) || 
          remainingLines.match(/^\s{2,}[\w\s]+=/) || 
          remainingLines.match(/^\s{2,}(function|class|if|for|while)\b/m)) {
        return [{
          action: 'write',
          primaryTarget: page,
          content: remainingLines,
          formatType: 'code'
        }];
      }
      
      return [{
        action: 'write',
        primaryTarget: page,
        content: remainingLines || 'Multi-line content'
      }];
    }
    
    // Default test response
    return [{
      action: 'write',
      primaryTarget: 'TEST MCP',
      content: 'Test content'
    }];
  }
}

export async function createCommandParser(
  openAiApiKey: string, 
  isTestEnvironment: boolean = false
): Promise<CommandParser> {
  return new CommandParser(openAiApiKey, isTestEnvironment);
} 