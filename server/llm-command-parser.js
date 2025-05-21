// Advanced LLM-based command parser that intelligently handles complex command patterns
import { validateOpenAIKey } from './ai-api-validator.js';

export class LLMCommandParser {
  constructor(openAiApiKey) {
    this.openAiApiKey = openAiApiKey;
    this.apiValidated = false;
    this.systemPrompt = `You are an expert Notion command parser. Your job is to parse natural language commands into structured actions.
When given a command, identify ALL separate actions the user wants to perform and return them as a structured list.

Think of yourself as a natural language processor for Notion workspace actions.

IMPORTANT: Pay special attention to:
1. Commands with multiple items to add (separated by commas, "and", or phrases like "too")
2. Commands with different formats (checklist, toggle, quote, etc.)
3. Commands targeting different pages or sections
4. Implied actions that aren't explicitly stated
5. When parsing URL commands, carefully extract both the URL and the target page name

CRITICAL: For URL commands like "add this URL to X page", always extract the page name "X" into primaryTarget.
Look for page names after phrases like "to", "in", or "on" followed by a page name and optional word "page".

Format your response as a JSON array of command objects, each with these properties:
- action: The action to perform (write, create, delete, update, etc.)
- primaryTarget: The page or database to target
- content: The content to add or modify
- formatType: The format (paragraph, checklist, callout, code, toggle, bullet, quote, etc.)
- secondaryTarget: Optional parent page or section
- isMultiAction: True if this is part of a sequence of actions
- isUrl: True if the content is a URL
- urlFormat: Optional - can be "URL", "bookmark", or "mention" (default to "bookmark" if not specified)
- commentText: Optional comment if content is a URL

EXAMPLES:

1. Multiple checklist items:
Input: "add buy milk in checklist and call mom in checklist too in Daily Tasks"
Output:
[
  {
    "action": "write",
    "primaryTarget": "Daily Tasks",
    "content": "buy milk",
    "formatType": "checklist"
  },
  {
    "action": "write",
    "primaryTarget": "Daily Tasks",
    "content": "call mom",
    "formatType": "checklist",
    "isMultiAction": true
  }
]

2. URL handling:
Input: "add https://example.com as URL to personal thoughts page"
Output:
[
  {
    "action": "write",
    "primaryTarget": "personal thoughts",
    "content": "https://example.com",
    "isUrl": true,
    "urlFormat": "URL"
  }
]

3. URL with checklist:
Input: "https://example.com add this as URL to personal thoughts page, with a checklist to send it to Mark"
Output:
[
  {
    "action": "write",
    "primaryTarget": "personal thoughts",
    "content": "https://example.com",
    "isUrl": true,
    "urlFormat": "URL"
  },
  {
    "action": "write",
    "primaryTarget": "personal thoughts",
    "content": "send it to Mark",
    "formatType": "checklist",
    "isMultiAction": true
  }
]

4. Complex URL instructions:
Input: "add this URL to my research notes: https://research.paper.org"
Output:
[
  {
    "action": "write", 
    "primaryTarget": "research notes",
    "content": "https://research.paper.org",
    "isUrl": true,
    "urlFormat": "bookmark"
  }
]

For URL commands, ensure you:
1. Mark isUrl as true
2. Extract the actual URL into content
3. Set primaryTarget to the page name mentioned
4. Set urlFormat if specified (URL, bookmark, or mention)
5. Extract any secondary actions like "with a checklist to..."`;
  }

  /**
   * Validates the API key if not already validated
   */
  async validateApi() {
    if (this.apiValidated) return true;
    
    const result = await validateOpenAIKey(this.openAiApiKey);
    this.apiValidated = result.valid;
    
    if (!result.valid) {
      console.error('API validation failed:', result.error);
      throw new Error(`OpenAI API validation failed: ${result.error}`);
    }
    
    console.log('API key validated successfully. Using model:', result.modelName);
    return true;
  }

  /**
   * Parse a command using the LLM
   * @param {string} input The natural language command
   * @returns {Promise<Array>} Array of parsed command objects
   */
  async parseCommand(input) {
    try {
      console.log(`LLM command parser processing: "${input}"`);
      
      // Validate the API key
      if (!this.openAiApiKey) {
        throw new Error('No API key provided for LLM Command Parser');
      }
      
      // Prepare the prompt for the LLM with the instructions
      const prompt = this.createPrompt(input);
      
      // Make the API call to the LLM
      const response = await this.callLLM(prompt);
      
      // Parse the LLM response
      const parsedCommands = this.parseResponse(response, input);
      
      // ENHANCEMENT: Post-process the commands to handle nested page structures
      if (parsedCommands && parsedCommands.length > 0) {
        for (let i = 0; i < parsedCommands.length; i++) {
          const cmd = parsedCommands[i];
          
          // Handle "X page in Y page" pattern for better section/page targeting
          if (cmd.primaryTarget && cmd.primaryTarget.toLowerCase().includes(' page in ')) {
            const parts = cmd.primaryTarget.split(' page in ');
            if (parts.length === 2) {
              // The part after "in" is the main page
              const mainPage = parts[1].replace(' page', '').trim();
              // The part before "in" is the section
              const section = parts[0].trim();
              
              console.log(`Detected nested page structure: Section "${section}" in Page "${mainPage}"`);
              
              // Update the command with the corrected page and section targets
              cmd.primaryTarget = mainPage;
              cmd.sectionTarget = section;
              
              // For added compatibility, also set secondaryTarget
              if (!cmd.secondaryTarget) {
                cmd.secondaryTarget = section;
              }
            }
          }
          
          // Also check for "X in Y page" pattern
          else if (cmd.primaryTarget && cmd.primaryTarget.toLowerCase().includes(' in ')) {
            const parts = cmd.primaryTarget.split(' in ');
            if (parts.length === 2 && parts[1].toLowerCase().includes('page')) {
              // The part after "in" is the main page
              const mainPage = parts[1].replace(' page', '').trim();
              // The part before "in" is the section
              const section = parts[0].trim();
              
              console.log(`Detected alt nested page structure: Section "${section}" in Page "${mainPage}"`);
              
              // Update the command with the corrected page and section targets
              cmd.primaryTarget = mainPage;
              cmd.sectionTarget = section;
              
              // For added compatibility, also set secondaryTarget
              if (!cmd.secondaryTarget) {
                cmd.secondaryTarget = section;
              }
            }
          }
        }
      }
      
      console.log(`LLM parser identified ${parsedCommands.length} commands:`, parsedCommands);
      return parsedCommands;
    } catch (error) {
      console.error('Error in LLM command parser:', error);
      throw error;
    }
  }

  /**
   * Create a prompt for the LLM with instructions
   */
  createPrompt(input) {
    return {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: input }
      ],
      temperature: 0,
      response_format: { type: 'json_object' }
    };
  }

  /**
   * Call the LLM with the provided prompt
   */
  async callLLM(prompt) {
    // Validate API key first
    await this.validateApi();
  
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openAiApiKey}`
      },
      body: JSON.stringify(prompt)
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error(`OpenAI API error (${response.status}): ${errorData}`);
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Parse the LLM response into structured commands
   */
  parseResponse(content, originalInput) {
    try {
      const parsedContent = JSON.parse(content);
      
      // Handle different response structures
      let commands = [];
      
      // Case 1: Direct array of commands
      if (Array.isArray(parsedContent)) {
        commands = parsedContent;
      }
      // Case 2: Object with 'commands' property
      else if (parsedContent.commands && Array.isArray(parsedContent.commands)) {
        commands = parsedContent.commands;
      }
      // Case 3: Object with 'actions' property (complex multi-part command)
      else if (parsedContent.actions && Array.isArray(parsedContent.actions)) {
        commands = parsedContent.actions;
      }
      // Case 4: Nested actions inside a single command
      else if (parsedContent.action && parsedContent.actions && Array.isArray(parsedContent.actions)) {
        commands = parsedContent.actions;
      }
      // Case 5: Single command object
      else if (parsedContent.action || parsedContent.primaryTarget) {
        commands = [parsedContent];
      }
      // Case 6: Nested actions in the first array element
      else if (Array.isArray(parsedContent) && 
               parsedContent.length > 0 && 
               parsedContent[0].actions && 
               Array.isArray(parsedContent[0].actions)) {
        commands = parsedContent[0].actions;
      }
      
      return commands;
    } catch (error) {
      console.error('Error parsing LLM response:', error);
      console.error('Raw content:', content);
      return [{
        action: 'write',
        primaryTarget: 'TEST',
        content: 'Failed to parse command: ' + originalInput,
        error: true
      }];
    }
  }

  /**
   * Get a fallback parse result for test mode
   */
  getTestModeResponse(input) {
    console.log('Using test mode fallback for input:', input);
    
    // Check for checklist patterns
    if (input.includes('checklist')) {
      if (input.includes(' and ') || input.includes(',')) {
        // Multiple checklist items
        const items = [];
        
        // Extract comma-separated items
        if (input.includes(',')) {
          const commaMatch = input.match(/add\s+(.*?)(?:,\s*(.*?))?(?:,\s*(.*?))?(?:\s+in|\s+as)\s+checklist/i);
          if (commaMatch) {
            items.push(...[commaMatch[1], commaMatch[2], commaMatch[3]].filter(Boolean).map(item => item.trim()));
          }
        } 
        // Extract "and"-separated items
        else if (input.includes(' and ')) {
          const andMatch = input.match(/add\s+(.*?)\s+in\s+checklist\s+and\s+(.*?)\s+in\s+checklist/i);
          if (andMatch) {
            items.push(andMatch[1]?.trim() || '', andMatch[2]?.trim() || '');
          }
        }
        
        // Extract target page
        const pageMatch = input.match(/\bin\s+(?:the\s+)?['"]?([^'",.]+?)['"]?(?:\s+page)?\b/i);
        const targetPage = pageMatch ? pageMatch[1]?.trim() : 'TEST';
        
        // Create a command for each item
        return items.map((item, index) => ({
          action: 'write',
          primaryTarget: targetPage,
          content: item,
          formatType: 'checklist',
          isMultiAction: index > 0
        }));
      }
    }
    
    // Check for multiple formats pattern
    if (input.includes(' as ') && input.includes(' and this as ')) {
      const formatMatch = input.match(/add\s+(.*?)\s+as\s+(.*?)\s+and\s+this\s+as\s+(.*?)(?::|$)/i);
      if (formatMatch) {
        const firstContent = formatMatch[1]?.trim() || 'Content';
        const firstFormat = formatMatch[2]?.trim() || 'paragraph';
        const secondFormat = formatMatch[3]?.trim() || 'paragraph';
        
        // Extract second content if it exists after a colon
        let secondContent = 'Second content';
        const colonMatch = input.match(/this\s+as\s+.*?:\s*(.*?)(?:$|\.)/i);
        if (colonMatch) {
          secondContent = colonMatch[1]?.trim();
        }
        
        // Extract target page if mentioned
        const pageMatch = input.match(/\bin\s+(?:the\s+)?['"]?([^'",.]+?)['"]?(?:\s+page)?\b/i);
        const targetPage = pageMatch ? pageMatch[1]?.trim() : 'TEST';
        
        return [
          {
            action: 'write',
            primaryTarget: targetPage,
            content: firstContent,
            formatType: firstFormat
          },
          {
            action: 'write',
            primaryTarget: targetPage,
            content: secondContent,
            formatType: secondFormat,
            isMultiAction: true
          }
        ];
      }
    }
    
    // Check for complex pattern with multiple formats 
    if (input.match(/add\s+.*?\s+as\s+.*?\s+and\s+.*?\s+as\s+.*?\s+in\s+/i)) {
      // Extract information using a more general pattern
      const matches = input.match(/add\s+(.*?)\s+as\s+(.*?)\s+and\s+(.*?)\s+as\s+(.*?)\s+in\s+(.*?)(?:$|\.)/i);
      if (matches) {
        const firstContent = matches[1]?.trim() || 'Content 1';
        const firstFormat = matches[2]?.trim() || 'paragraph';
        const secondContent = matches[3]?.trim() || 'Content 2';
        const secondFormat = matches[4]?.trim() || 'paragraph';
        const targetPage = matches[5]?.trim() || 'TEST';
        
        return [
          {
            action: 'write',
            primaryTarget: targetPage,
            content: firstContent,
            formatType: firstFormat
          },
          {
            action: 'write',
            primaryTarget: targetPage,
            content: secondContent,
            formatType: secondFormat,
            isMultiAction: true
          }
        ];
      }
    }
    
    // Check for create page with "called" or "named" pattern - high priority
    const createPageMatch = input.match(/create\s+(?:a\s+)?(?:new\s+)?(?:page\s+)?(?:called|named)\s+['"]?(.*?)['"]?(?:\s+and|\s*$)/i);
    if (createPageMatch) {
      const pageTitle = createPageMatch[1]?.trim();
      console.log(`Detected create page with title: ${pageTitle}`);
      
      // Check for the toggle and checklist pattern
      if (input.includes(' as a toggle') && input.includes(' as a checklist')) {
        const toggleMatch = input.match(/add\s+(.*?)\s+as\s+a\s+toggle/i);
        const checklistMatch = input.match(/add\s+(.*?)\s+as\s+a\s+checklist/i);
        
        const toggleContent = toggleMatch ? toggleMatch[1]?.trim() : "yesterday's tasks";
        const checklistContent = checklistMatch ? checklistMatch[1]?.trim() : 'plan for today';
        
        return [
          {
            action: 'create',
            primaryTarget: pageTitle
          },
          {
            action: 'write',
            primaryTarget: pageTitle,
            content: toggleContent,
            formatType: 'toggle',
            isMultiAction: true
          },
          {
            action: 'write',
            primaryTarget: pageTitle,
            content: checklistContent,
            formatType: 'checklist',
            isMultiAction: true
          }
        ];
      }
      
      // Try to extract multiple content items
      const contentMatches = input.match(/add\s+(.*?)\s+as\s+(.*?)\s+and\s+(.*?)\s+as\s+(.*?)(?:$|\.)/i);
      
      if (contentMatches) {
        const firstContent = contentMatches[1]?.trim() || 'Content 1';
        const firstFormat = contentMatches[2]?.trim() || 'paragraph';
        const secondContent = contentMatches[3]?.trim() || 'Content 2';
        const secondFormat = contentMatches[4]?.trim() || 'paragraph';
        
        return [
          {
            action: 'create',
            primaryTarget: pageTitle
          },
          {
            action: 'write',
            primaryTarget: pageTitle,
            content: firstContent,
            formatType: firstFormat,
            isMultiAction: true
          },
          {
            action: 'write',
            primaryTarget: pageTitle,
            content: secondContent,
            formatType: secondFormat,
            isMultiAction: true
          }
        ];
      } else {
        // Simpler pattern with just one content item
        const contentMatch = input.match(/add\s+(.*?)(?:\s+as\s+(.*?))?(?:$|\.)/i);
        const content = contentMatch ? contentMatch[1]?.trim() : 'Content';
        const format = contentMatch && contentMatch[2] ? contentMatch[2]?.trim() : 'paragraph';
        
        return [
          {
            action: 'create',
            primaryTarget: pageTitle
          },
          {
            action: 'write',
            primaryTarget: pageTitle,
            content: content,
            formatType: format,
            isMultiAction: true
          }
        ];
      }
    }
    
    // Handle complex natural language - extract target page and notes/items
    if (input.match(/add\s+.*?\s+to\s+.*?\s+(?:page|notebook)\s+and\s+(?:also\s+)?include/i)) {
      const pageMatch = input.match(/to\s+(?:my|the)?\s+['"]?(.*?)['"]?\s+(?:page|notebook)/i);
      const targetPage = pageMatch ? pageMatch[1]?.trim() : 'Work';
      
      // Extract notes and action items
      const notesMatch = input.match(/add\s+(.*?)\s+to\s+/i);
      const itemsMatch = input.match(/include\s+(.*?)(?:$|\.)/i);
      
      const notesContent = notesMatch ? notesMatch[1]?.trim() : 'project meeting notes';
      const itemsContent = itemsMatch ? itemsMatch[1]?.trim() : 'action items';
      
      return [
        {
          action: 'write',
          primaryTarget: targetPage,
          content: notesContent,
          formatType: 'paragraph'
        },
        {
          action: 'write',
          primaryTarget: targetPage,
          content: itemsContent,
          formatType: 'bullet',
          isMultiAction: true
        }
      ];
    }
    
    // Default test response with intelligent format detection
    return [{
      action: 'write',
      primaryTarget: 'TEST',
      content: 'Test content',
      formatType: this.detectFormatType(input)
    }];
  }

  /**
   * Detect the format type from the input text
   */
  detectFormatType(input) {
    if (input.includes('checklist')) return 'checklist';
    if (input.includes('bullet')) return 'bullet';
    if (input.includes('toggle')) return 'toggle';
    if (input.includes('quote')) return 'quote';
    if (input.includes('code')) return 'code';
    if (input.includes('callout')) return 'callout';
    if (input.includes('heading')) return 'heading';
    return 'paragraph';
  }
} 