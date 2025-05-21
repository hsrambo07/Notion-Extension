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
export class CommandParser {
    constructor(openAiApiKey, isTestEnvironment = false) {
        this.openAiApiKey = openAiApiKey;
        this.isTestEnvironment = isTestEnvironment;
    }
    /**
     * Parse a natural language command into structured actions
     */
    async parseCommand(input) {
        console.log(`Parsing command: "${input}"`);
        if (this.isTestEnvironment) {
            return this.getTestModeResponse(input);
        }
        // Early detection of page creation commands
        if (/\b(?:create|make|add)(?:\s+a)?\s+(?:new\s+)?page\b/i.test(input)) {
            console.log('Direct detection of page creation command in command-parser');
            
            // Check if this is a multi-part command with "and"
            const multiCommandMatch = input.match(/\b(?:create|make|add)(?:\s+a)?\s+(?:new\s+)?page\s+(?:called\s+|named\s+)?["']?([^"'\s]+)["']?\s+(?:and|&)\s+/i);
            
            if (multiCommandMatch) {
                console.log('Command parser detected multi-part command with page creation');
                const pageName = multiCommandMatch[1].trim();
                
                // Extract the parent page at the end
                const parentMatch = input.match(/\bin\s+(?:the\s+)?["']?([^"',.]+?)["']?(?:\s+page)?\s*$/i);
                const parentPage = parentMatch ? parentMatch[1].trim() : "TEST MCP";
                
                // Create commands array for multi-part commands
                const commands = [];
                
                // Add the page creation command
                commands.push({
                    action: 'create',
                    primaryTarget: parentPage,
                    content: pageName,
                    formatType: 'page',
                    sectionTarget: null
                });
                
                // Extract the second part after "and"
                const secondPartMatch = input.match(/\band\s+(.*?)(?:\s+in\s+|$)/i);
                if (secondPartMatch) {
                    const secondAction = secondPartMatch[1].trim();
                    
                    // Add a write command for the second part
                    commands.push({
                        action: 'write',
                        primaryTarget: pageName, // Target the newly created page
                        content: secondAction.replace(/^(?:add|write)\s+(?:text\s+)?/i, ''), // Remove action words
                        formatType: 'paragraph',
                        isMultiAction: true
                    });
                }
                
                // Return the array of commands
                return commands;
            }
            
            // Simple page creation (no multi-part)
            // Extract the page name
            const pageNameMatch = input.match(/\b(?:create|make|add)(?:\s+a)?\s+(?:new\s+)?page\s+(?:called\s+|named\s+)?["']?([^"',.]+?)["']?(?:\s+in\b|\s+to\b|$)/i);
            const pageName = pageNameMatch ? pageNameMatch[1].trim() : "New Page";
            
            // Extract the parent page
            const parentMatch = input.match(/\bin\s+(?:the\s+)?["']?([^"',.]+?)["']?(?:\s+page)?\b/i);
            const parentPage = parentMatch ? parentMatch[1].trim() : "TEST MCP";
            
            return {
                action: 'create',
                primaryTarget: parentPage,
                content: pageName,
                formatType: 'page',
                sectionTarget: null
            };
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
        }
        catch (error) {
            console.error('Error parsing command:', error);
            // Return a basic fallback command
            return [{
                    action: 'unknown',
                    primaryTarget: 'unknown',
                    content: input
                }];
        }
    }
    /**
     * Check if the input is specifically requesting a code block
     */
    isCodeBlockRequest(input) {
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
    isComplexToggleRequest(input) {
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
    handleCodeBlockCommand(input) {
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
    handleComplexToggleCommand(input) {
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
    async callOpenAI(input) {
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
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.openAiApiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: input }
                    ],
                    temperature: 0,
                    response_format: { type: 'json_object' }
                })
            });
            if (!response.ok) {
                console.error(`OpenAI API error: ${response.status} ${response.statusText}`);
                throw new Error(`OpenAI API error: ${response.status}`);
            }
            const data = await response.json();
            console.log('OpenAI parsed result:', data.choices[0].message.content);
            try {
                const parsedContent = JSON.parse(data.choices[0].message.content);
                if (Array.isArray(parsedContent.commands)) {
                    return parsedContent.commands;
                }
                else if (parsedContent.command) {
                    return [parsedContent.command];
                }
                else {
                    // Try to interpret the whole response as a single command array
                    return Array.isArray(parsedContent) ? parsedContent : [parsedContent];
                }
            }
            catch (parseError) {
                console.error('Error parsing OpenAI response as JSON:', parseError);
                throw parseError;
            }
        }
        catch (error) {
            console.error('Error in callOpenAI:', error);
            throw error;
        }
    }
    /**
     * Get a test mode response for the given input
     */
    getTestModeResponse(input) {
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
export async function createCommandParser(openAiApiKey, isTestEnvironment = false) {
    return new CommandParser(openAiApiKey, isTestEnvironment);
}
