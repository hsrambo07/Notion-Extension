import { LLMCommandParser } from './llm-command-parser.js';

/**
 * Enhanced handler for multi-part commands that uses LLM-based parsing
 * instead of complex regex patterns for better accuracy and flexibility
 */
export class EnhancedMultiCommandHandler {
  constructor(openAiApiKey, isTestMode = false) {
    this.llmParser = new LLMCommandParser(openAiApiKey);
    this.isTestMode = isTestMode;
  }
  
  /**
   * Process a command using the LLM-based parser
   * @returns Array of separate commands to be executed sequentially
   */
  async processCommand(input) {
    try {
      console.log(`EnhancedMultiCommandHandler processing: "${input}"`);
      
      // Step 1: Try to parse with the LLM command parser
      if (!this.llmParser) {
        throw new Error('LLM Command Parser is not initialized');
      }
      
      const llmResult = await this.llmParser.parseCommand(input);
      console.log('LLM parser identified', llmResult.length, 'commands');
      
      // ENHANCEMENT 1: Pre-process input to detect comma-separated commands
      // Example: "Add X as Y, add Z as W" -> multiple commands
      if (llmResult.length === 1 && 
          input.match(/add\s+.*?,\s*add\s+/i)) {
        console.log('Detected comma-separated commands');
        
        // Split by ", add " and process each part as a separate command
        const parts = input.split(/,\s*add\s+/i);
        if (parts.length > 1) {
          const firstPart = parts[0].trim();
          
          // Keep processing the first command normally
          // For the remaining parts, create new commands
          for (let i = 1; i < parts.length; i++) {
            const content = parts[i].trim();
            
            // Extract format if specified
            let format = 'paragraph';
            let extractedContent = content;
            
            const formatMatch = content.match(/^(.*?)\s+as\s+(.*?)(?:\s+(?:in|to|on)\s+|$)/i);
            if (formatMatch) {
              extractedContent = formatMatch[1].trim();
              format = formatMatch[2].trim();
            }
            
            // Extract target page if specified in this part
            let target = llmResult[0].primaryTarget;
            const targetMatch = content.match(/(?:in|to|on)\s+(.*?)(?:\s+page|$)/i);
            if (targetMatch) {
              target = targetMatch[1].trim();
            }
            
            console.log(`Created command from comma part: "${extractedContent}" (${format}) in ${target}`);
            
            // Create new command
            const newCmd = {
              action: 'write',
              primaryTarget: target,
              content: extractedContent,
              formatType: format,
              isMultiAction: true
            };
            
            // Copy section targeting if applicable
            if (llmResult[0].sectionTarget) {
              newCmd.sectionTarget = llmResult[0].sectionTarget;
            }
            
            llmResult.push(newCmd);
          }
        }
      }
      
      // ENHANCEMENT 2: Detect multi-commands based on "and add" pattern
      // This is a general pattern that works for any block type
      if (llmResult.length === 1 && 
          input.toLowerCase().includes(' and add ')) {
        const cmd = llmResult[0];
        
        // Check for "and add" in the content field, suggesting a missed second command
        if (cmd.content && cmd.content.toLowerCase().includes(' and add ')) {
          console.log('Detected multi-command pattern with "and add"');
          
          // Split the content at "and add"
          const parts = cmd.content.split(/\s+and\s+add\s+/i);
          if (parts.length > 1) {
            const firstContent = parts[0].trim();
            const secondContent = parts[1].trim();
            
            console.log(`Splitting into multiple commands: "${firstContent}" and "${secondContent}"`);
            
            // Update the first command's content
            cmd.content = firstContent;
            
            // Create a second command
            const secondCmd = {
              action: cmd.action || 'write',
              primaryTarget: cmd.primaryTarget,
              content: secondContent,
              formatType: cmd.formatType || 'paragraph',
              isMultiAction: true
            };
            
            // Add the second command
            llmResult.push(secondCmd);
          }
        }
      }
      
      // ENHANCEMENT 3: Handle multi-commands based on general patterns
      if (llmResult.length === 1) {
        // Look for patterns like "add X as [format] and Y as [format]"
        // This works for any block type like bullet, toggle, callout, etc.
        const multiCommandPattern = /add\s+(.*?)(?:\s+as\s+(.*?))?\s+and\s+(?:add\s+)?(.*?)(?:\s+as\s+(.*?))?(?:\s+(?:in|to|on)\s+|$)/i;
        
        if (input.match(multiCommandPattern)) {
          console.log('Detected general multi-command pattern');
          
          const matches = input.match(multiCommandPattern);
          if (matches && matches.length >= 3) {
            const firstContent = matches[1].trim();
            const firstFormat = matches[2] ? this.normalizeFormatType(matches[2].trim()) : (llmResult[0].formatType || 'paragraph');
            const secondContent = matches[3].trim();
            const secondFormat = matches[4] ? this.normalizeFormatType(matches[4].trim()) : (llmResult[0].formatType || 'paragraph');
            
            console.log(`Extracted multi-commands: "${firstContent}" (${firstFormat}) and "${secondContent}" (${secondFormat})`);
            
            // Update first command content and format
            if (llmResult[0].content !== firstContent) {
              llmResult[0].content = firstContent;
            }
            llmResult[0].formatType = firstFormat;
            
            // Create second command
            const secondCmd = {
              action: llmResult[0].action || 'write',
              primaryTarget: llmResult[0].primaryTarget,
              content: secondContent,
              formatType: secondFormat,
              isMultiAction: true
            };
            
            // Copy any section targeting
            if (llmResult[0].sectionTarget) {
              secondCmd.sectionTarget = llmResult[0].sectionTarget;
            }
            if (llmResult[0].secondaryTarget) {
              secondCmd.secondaryTarget = llmResult[0].secondaryTarget;
            }
            
            // Add the second command
            llmResult.push(secondCmd);
          }
        }
        
        // Specific case handling for "to-do" pattern as a fallback
        else if (input.toLowerCase().match(/add\s+to-?do\s+.*?\s+and\s+.*?\s+to-?do\s+/i)) {
          console.log('Detected to-do specific multi-command pattern');
          
          // Try to extract both todos with better content matching
          const matches = input.match(/add\s+to-?do\s+(?:to\s+)?(.*?)(?:\s+(?:in|to)\s+.*?)?\s+and\s+(?:add\s+(?:one\s+more\s+)?to-?do\s+(?:to\s+)?)(.*?)(?:\s+(?:in|to|about)\s+|$)/i);
          
          if (matches && matches.length >= 3) {
            const firstContent = matches[1].trim();
            const secondContent = matches[2].trim();
            
            console.log(`Extracted multi-todos: "${firstContent}" and "${secondContent}"`);
            
            // Update first command
            if (llmResult[0].content !== firstContent) {
              llmResult[0].content = firstContent;
            }
            llmResult[0].formatType = 'to_do';
            
            // Create second command
            const secondCmd = {
              action: llmResult[0].action || 'write',
              primaryTarget: llmResult[0].primaryTarget,
              content: secondContent,
              formatType: 'to_do',
              isMultiAction: true
            };
            
            // Copy any section targeting
            if (llmResult[0].sectionTarget) {
              secondCmd.sectionTarget = llmResult[0].sectionTarget;
            }
            if (llmResult[0].secondaryTarget) {
              secondCmd.secondaryTarget = llmResult[0].secondaryTarget;
            }
            
            // Add the second command
            llmResult.push(secondCmd);
          }
        }
        
        // Detect multiple content items separated by "and also" pattern
        else if (input.toLowerCase().includes(' and also ')) {
          console.log('Detected "and also" multi-command pattern');
          
          const parts = input.split(/\s+and\s+also\s+/i);
          if (parts.length > 1) {
            // Try to extract the second content part
            const secondActionMatch = parts[1].match(/(?:add\s+)?(.*?)(?:\s+(?:in|to|on)\s+|$)/i);
            if (secondActionMatch) {
              const secondContent = secondActionMatch[1].trim();
              
              // Detect format type from input
              let secondFormat = this.detectFormatType(parts[1]) || llmResult[0].formatType || 'paragraph';
              secondFormat = this.normalizeFormatType(secondFormat);
              
              console.log(`Extracted additional command: "${secondContent}" (${secondFormat})`);
              
              // Create second command
              const secondCmd = {
                action: llmResult[0].action || 'write',
                primaryTarget: llmResult[0].primaryTarget,
                content: secondContent,
                formatType: secondFormat,
                isMultiAction: true
              };
              
              // Copy any section targeting
              if (llmResult[0].sectionTarget) {
                secondCmd.sectionTarget = llmResult[0].sectionTarget;
              }
              if (llmResult[0].secondaryTarget) {
                secondCmd.secondaryTarget = llmResult[0].secondaryTarget;
              }
              
              // Add the second command
              llmResult.push(secondCmd);
            }
          }
        }
      }
      
      // ENHANCEMENT 4: Clean up format types for all commands
      for (let i = 0; i < llmResult.length; i++) {
        if (llmResult[i].formatType) {
          llmResult[i].formatType = this.normalizeFormatType(llmResult[i].formatType);
        }
      }
      
      // ENHANCEMENT 5: Process nested page structures consistently for all commands
      for (let i = 0; i < llmResult.length; i++) {
        const cmd = llmResult[i];
        
        // Process "in X page in Y page" pattern
        if (cmd.primaryTarget && !cmd.sectionTarget && input.toLowerCase().includes(' page in ')) {
          const nestedMatch = input.match(/in\s+(.*?)\s+page\s+in\s+(.*?)\s+page/i);
          if (nestedMatch) {
            const section = nestedMatch[1].trim();
            const page = nestedMatch[2].trim(); 
            
            console.log(`Detected nested page structure: Section "${section}" in Page "${page}"`);
            
            // Set the correct targets
            cmd.primaryTarget = page;
            cmd.sectionTarget = section;
            
            // For added compatibility
            if (!cmd.secondaryTarget) {
              cmd.secondaryTarget = section;
            }
          }
        }
        
        // Process "in section X in page Y" pattern
        else if (cmd.primaryTarget && input.toLowerCase().match(/in\s+(?:section|part|area)\s+.*?\s+in\s+.*?\s+page/i)) {
          const nestedMatch = input.match(/in\s+(?:section|part|area)\s+(.*?)\s+in\s+(.*?)\s+page/i);
          if (nestedMatch) {
            const section = nestedMatch[1].trim();
            const page = nestedMatch[2].trim(); 
            
            console.log(`Detected section/page structure: Section "${section}" in Page "${page}"`);
            
            // Set the correct targets
            cmd.primaryTarget = page;
            cmd.sectionTarget = section;
            
            // For added compatibility
            if (!cmd.secondaryTarget) {
              cmd.secondaryTarget = section;
            }
          }
        }
        
        // Process "in X section in Y page" pattern
        else if (cmd.primaryTarget && input.toLowerCase().match(/in\s+.*?\s+(?:section|part|area)\s+in\s+.*?\s+page/i)) {
          const nestedMatch = input.match(/in\s+(.*?)\s+(?:section|part|area)\s+in\s+(.*?)\s+page/i);
          if (nestedMatch) {
            const section = nestedMatch[1].trim();
            const page = nestedMatch[2].trim(); 
            
            console.log(`Detected alternative section/page structure: Section "${section}" in Page "${page}"`);
            
            // Set the correct targets
            cmd.primaryTarget = page;
            cmd.sectionTarget = section;
            
            // For added compatibility
            if (!cmd.secondaryTarget) {
              cmd.secondaryTarget = section;
            }
          }
        }
        
        // Special case for "Design section in Project page" pattern
        else if (cmd.primaryTarget && cmd.secondaryTarget && cmd.secondaryTarget.includes('section')) {
          // Extract section from secondaryTarget if it contains "section"
          const section = cmd.secondaryTarget.replace(/\s+section$/i, '').trim();
          console.log(`Converting secondaryTarget "${cmd.secondaryTarget}" to sectionTarget "${section}"`);
          
          cmd.sectionTarget = section;
        }
      }
      
      // Handle test mode by returning the result directly
      if (this.isTestMode) {
        return llmResult;
      }
      
      return llmResult;
    } catch (error) {
      console.error('Error in enhanced multi-command handler:', error);
      
      // If in test mode, use the test mode response
      if (this.isTestMode) {
        return this.llmParser.getTestModeResponse(input);
      }
      
      // Otherwise, fallback to traditional commands if available
      if (this.fallbackHandler) {
        console.log('Falling back to traditional command handling');
        return this.fallbackHandler.processCommand(input);
      }
      
      throw error;
    }
  }
  
  /**
   * Detect format type from text input
   */
  detectFormatType(input) {
    const text = input.toLowerCase();
    if (text.includes('to-do') || text.includes('todo') || text.includes('checklist')) return 'to_do';
    if (text.includes('toggle')) return 'toggle';
    if (text.includes('bullet')) return 'bulleted_list_item';
    if (text.includes('numbered')) return 'numbered_list_item';
    if (text.includes('code')) return 'code';
    if (text.includes('quote')) return 'quote';
    if (text.includes('callout')) return 'callout';
    if (text.includes('heading')) {
      if (text.includes('heading 1') || text.includes('h1')) return 'heading_1';
      if (text.includes('heading 2') || text.includes('h2')) return 'heading_2';
      if (text.includes('heading 3') || text.includes('h3')) return 'heading_3';
      return 'heading_1';
    }
    return 'paragraph';
  }
  
  /**
   * Normalize format type to Notion API compatible values
   */
  normalizeFormatType(format) {
    if (!format) return 'paragraph';
    
    const text = format.toLowerCase();
    
    // Handle common format cases
    if (text.includes('bullet')) return 'bulleted_list_item';
    if (text.includes('todo') || text.includes('to-do') || text.includes('checklist')) return 'to_do';
    if (text.includes('toggle')) return 'toggle';
    if (text.includes('callout')) return 'callout';
    if (text.includes('quote')) return 'quote';
    if (text.includes('code')) return 'code';
    if (text.includes('numbered')) return 'numbered_list_item';
    
    // Handle headings
    if (text.includes('heading') || text.includes('header')) {
      if (text.includes('1') || text.includes('h1')) return 'heading_1';
      if (text.includes('2') || text.includes('h2')) return 'heading_2';
      if (text.includes('3') || text.includes('h3')) return 'heading_3';
      return 'heading_1';
    }
    
    // Clean up format strings that contain extra text
    if (text.includes('as ')) {
      const cleaned = text.split('as ')[1].trim();
      return this.normalizeFormatType(cleaned);
    }
    
    // Handle comma contamination (e.g., "toggle, add timeline as code")
    if (text.includes(',')) {
      const firstPart = text.split(',')[0].trim();
      return this.normalizeFormatType(firstPart);
    }
    
    return 'paragraph';
  }
}

/**
 * Creates a new enhanced multi-command handler
 * @param openAiApiKey OpenAI API key
 * @param isTestMode Whether to run in test mode
 * @returns EnhancedMultiCommandHandler instance
 */
export function createEnhancedMultiCommandHandler(
  openAiApiKey,
  isTestMode = false
) {
  return new EnhancedMultiCommandHandler(openAiApiKey, isTestMode);
} 