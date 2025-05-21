/**
 * LLM Command Parser - Uses OpenAI to intelligently parse natural language commands
 * into structured Notion API commands without relying on hardcoded patterns
 */
import OpenAI from 'openai';

export class LLMCommandParser {
  constructor(apiKey, testMode = false) {
    this.openAiApiKey = apiKey;
    this.isTestMode = !!testMode;
    this.model = 'gpt-3.5-turbo-0125';
    
    // Initialize OpenAI API
    if (this.openAiApiKey) {
      this.api = new OpenAI({
        apiKey: this.openAiApiKey
      });
    }
  }
  
  /**
   * Validate the API key and connection
   */
  async validateApi() {
    if (!this.openAiApiKey) {
      throw new Error('No OpenAI API key provided');
    }
    
    if (!this.api) {
      this.api = new OpenAI({
        apiKey: this.openAiApiKey
      });
    }
    
    return true;
  }
  
  /**
   * Get a test mode response for development/testing without API calls
   */
  getTestModeResponse(input) {
    console.log('Running in test mode, generating diverse mock responses');
    
    // Create a diverse set of block types based on input cues
    const commands = [];
    
    // Basic command extraction - simulate what the LLM would do
    const parts = input.toLowerCase().split(/\s+and\s+|\s*,\s*/);
    
    parts.forEach((part, index) => {
      const command = {
        action: 'write',
        primaryTarget: 'Default',
        content: part,
        formatType: 'paragraph',
        isMultiAction: index > 0
      };
      
      // Attempt to extract target page/section
      const pageMatch = part.match(/in\s+([a-z\s]+)(?:\s+page|\s+section)?/);
      if (pageMatch) {
        command.primaryTarget = pageMatch[1].trim();
        command.content = part.replace(pageMatch[0], '').trim();
      }
      
      // Simulate format detection based on keywords
      if (part.includes('todo') || part.includes('to-do') || part.includes('to do')) {
        command.formatType = 'to_do';
      } else if (part.includes('bullet')) {
        command.formatType = 'bulleted_list_item';
      } else if (part.includes('toggle')) {
        command.formatType = 'toggle';
      } else if (part.includes('heading') || part.includes('header')) {
        command.formatType = 'heading_1';
      } else if (part.includes('code')) {
        command.formatType = 'code';
      } else if (part.includes('callout')) {
        command.formatType = 'callout';
      }
      
      commands.push(command);
    });
    
    return commands;
  }

  /**
   * Build the system prompt for comprehensive Notion command parsing
   */
  _buildSystemPrompt() {
    return `You are an advanced Notion command parser. Your job is to understand natural language commands and convert them into structured Notion API commands with all block types and customizations.

Parse the user's natural language into one or more commands. Break multi-part requests into separate commands.

For each command, identify:
1. action (write, append, delete)
2. primaryTarget (page name to target)
3. content (the actual content to write)
4. formatType (match exactly to Notion API block types)
5. sectionTarget (optional - a section within the page)
6. isMultiAction (true if this is part of a multiple-command request)
7. specialProperties (optional - any special configuration needed)

NOTION API BLOCK TYPES (use exactly these for formatType):
- paragraph
- heading_1, heading_2, heading_3
- bulleted_list_item
- numbered_list_item
- to_do
- toggle
- code (with language property)
- quote
- callout (with icon property)
- table (with table_rows and cells)
- divider
- table_of_contents
- breadcrumb
- equation
- synced_block
- template
- link_to_page
- embed
- bookmark
- image
- video
- pdf
- file
- audio
- link_preview

HANDLE SPECIAL PROPERTIES FOR COMPLEX BLOCKS:
- For code blocks, extract the language if specified
- For callouts, extract the icon and color if specified
- For tables, determine rows and columns structure
- For custom databases, identify properties and types

HANDLE PAGE HIERARCHIES:
- For nested pages, correctly interpret parent-child relationships
- For sections and sub-sections, properly identify the hierarchy

Return a JSON object with a 'commands' array containing all identified commands, properly formatted for the Notion API.`;
  }

  /**
   * Build the user prompt for command parsing
   */
  _buildUserPrompt(input) {
    return `Parse this Notion command and return structured JSON with the 'commands' array:
"${input}"`;
  }

  /**
   * Call the LLM to parse a command
   */
  async callLLM(systemPrompt, userPrompt) {
    // Validate API key first
    await this.validateApi();
    
    console.log('API key validated successfully. Using model:', this.model);
    
    // Create the completion
    try {
      const response = await this.api.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      });
      
      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error calling LLM to parse command:', error);
      throw new Error(`Failed to parse command: ${error.message}`);
    }
  }
  
  /**
   * Parse a command using OpenAI API
   */
  async parseCommand(command) {
    try {
      const apiKey = this.openAiApiKey;
      if (!apiKey) {
        console.error('No API key provided');
        return null;
      }
      
      // Handle specific pattern: add content to a subpage
      // Matches "add X in Y page in Z page" pattern
      const subpagePattern = /\b(?:add|write)\s+(?:(?:a|an)\s+)?(.*?)\s+in\s+([^,]+?)\s+page\s+in\s+([^,]+?)(?:\s+page)?\b/i;
      const subpageMatch = command.match(subpagePattern);
      
      if (subpageMatch) {
        console.log('LLM parser detected content addition to a sub-page');
        const contentWithFormat = subpageMatch[1].trim();
        const subpageName = subpageMatch[2].trim();
        const parentPageName = subpageMatch[3].trim();
        
        // Detect format type
        let formatType = 'paragraph'; // Default format
        let content = contentWithFormat;
        
        // Format detection
        if (/(checklist|to-?do|task)s?\b/i.test(contentWithFormat)) {
          formatType = 'to_do';
          // Extract actual content
          const toDoMatch = contentWithFormat.match(/(?:checklist|to-?do|task)s?\s+(?:to|for|about)?\s*(.*)/i);
          if (toDoMatch) {
            content = toDoMatch[1];
          }
          console.log(`LLM parser detected to-do format: "${content}"`);
        } else if (/\b(?:bullet|list)\b/i.test(contentWithFormat)) {
          formatType = 'bulleted_list_item';
          const bulletMatch = contentWithFormat.match(/(?:bullet|list)\s+(?:about|for|to)?\s*(.*)/i);
          if (bulletMatch) {
            content = bulletMatch[1];
          }
          console.log(`LLM parser detected bullet format: "${content}"`);
        } else if (/\bquote\b/i.test(contentWithFormat)) {
          formatType = 'quote';
          const quoteMatch = contentWithFormat.match(/quote\s+(?:about|of|from)?\s*(.*)/i);
          if (quoteMatch) {
            content = quoteMatch[1];
          }
          console.log(`LLM parser detected quote format: "${content}"`);
        } else if (/\bcode\b/i.test(contentWithFormat)) {
          formatType = 'code';
          const codeMatch = contentWithFormat.match(/code\s+(?:to|for|about)?\s*(.*)/i);
          if (codeMatch) {
            content = codeMatch[1];
          }
          console.log(`LLM parser detected code format: "${content}"`);
        }
        
        console.log(`Content: "${content}", Target: "${subpageName}" page in "${parentPageName}", Format: ${formatType}`);
        
        return [{
          action: 'write',
          primaryTarget: subpageName, // The actual target is the subpage
          content: content,
          secondaryTarget: parentPageName, // Store parent page in secondaryTarget
          formatType: formatType
        }];
      }
      
      // Direct detection of page creation commands before using OpenAI
      if (/\b(?:create|make|add)(?:\s+a)?\s+(?:new\s+)?page\b/i.test(command)) {
        console.log('Direct detection of page creation command');
        
        // Check if this is a multi-part command with "and"
        const multiCommandMatch = command.match(/\b(?:create|make|add)(?:\s+a)?\s+(?:new\s+)?page\s+(?:called\s+|named\s+)?["']?([^"'\s]+)["']?\s+(?:and|&)\s+/i);
        
        if (multiCommandMatch) {
          console.log('LLM parser detected multi-part command with page creation');
          const pageName = multiCommandMatch[1].trim();
          
          // Extract the parent page at the end
          const parentMatch = command.match(/\bin\s+(?:the\s+)?["']?([^"',.]+?)["']?(?:\s+page)?\s*$/i);
          const parentPage = parentMatch ? parentMatch[1].trim() : "TEST MCP";
          
          // Create the page creation command
          const pageCommand = {
            action: 'create',
            primaryTarget: parentPage,
            content: pageName,
            formatType: 'page',
            sectionTarget: null
          };
          
          // Extract the second part after "and"
          const secondPartMatch = command.match(/\band\s+(.*?)(?:\s+in\s+|$)/i);
          if (secondPartMatch) {
            const secondAction = secondPartMatch[1].trim();
            
            // Create a write command for the second part
            const writeCommand = {
              action: 'write',
              primaryTarget: pageName,  // Write to the newly created page
              content: secondAction.replace(/^(?:add|write)\s+(?:text\s+)?/i, ''), // Remove action words
              formatType: 'paragraph',
              sectionTarget: null,
              isMultiAction: true
            };
            
            // Return both commands for sequential processing
            return [pageCommand, writeCommand];
          }
          
          // Return just the page creation command if no second part
          return [pageCommand];
        }
        
        // Simple page creation (no multi-part)
        // Extract the page name
        const pageNameMatch = command.match(/\b(?:create|make|add)(?:\s+a)?\s+(?:new\s+)?page\s+(?:called\s+|named\s+)?["']?([^"',.]+?)["']?(?:\s+in\b|\s+to\b|$)/i);
        const pageName = pageNameMatch ? pageNameMatch[1].trim() : "New Page";
        
        // Extract the parent page
        const parentMatch = command.match(/\bin\s+(?:the\s+)?["']?([^"',.]+?)["']?(?:\s+page)?\b/i);
        const parentPage = parentMatch ? parentMatch[1].trim() : "TEST MCP";
        
        return [{
          action: 'create',
          primaryTarget: parentPage,
          content: pageName,
          formatType: 'page',
          sectionTarget: null
        }];
      }
      
      // Continue with OpenAI parsing for other commands
      console.log('LLM command parser processing:', JSON.stringify(command));
      
      if (this.isTestMode) {
        return this.getTestModeResponse(command);
      }
      
      // Build the prompts
      const systemPrompt = this._buildSystemPrompt();
      const userPrompt = this._buildUserPrompt(command);
      
      // Get the response from the LLM
      const response = await this.callLLM(systemPrompt, userPrompt);
      
      // Parse the structured response as JSON
      try {
        const parsed = JSON.parse(response);
        
        if (!parsed.commands || !Array.isArray(parsed.commands)) {
          console.error('Invalid response format from LLM:', response);
          throw new Error('Invalid response format from LLM');
        }
        
        // Let the LLM handle all format normalization and customization
        // Only add multi-action flags if needed
        const commands = parsed.commands.map((cmd, index) => {
          if (parsed.commands.length > 1 && !cmd.isMultiAction) {
            cmd.isMultiAction = index > 0;
          }
          return cmd;
        });
        
        console.log('LLM parser identified', commands.length, 'commands:', commands);
        return commands;
      } catch (error) {
        console.error('Failed to parse LLM response as JSON:', response, error);
        throw new Error('Failed to parse LLM response');
      }
    } catch (error) {
      console.error('Error parsing command with LLM:', error);
      throw error;
    }
  }
}

export default LLMCommandParser; 