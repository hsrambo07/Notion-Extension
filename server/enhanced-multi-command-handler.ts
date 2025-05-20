import { CommandType } from './command-parser.js';
import { LLMCommandParser } from './llm-command-parser.js';

/**
 * Enhanced handler for multi-part commands that uses LLM-based parsing
 * instead of complex regex patterns for better accuracy and flexibility
 */
export class EnhancedMultiCommandHandler {
  private llmParser: LLMCommandParser;
  private isTestMode: boolean;
  
  constructor(openAiApiKey: string, isTestMode: boolean = false) {
    this.llmParser = new LLMCommandParser(openAiApiKey);
    this.isTestMode = isTestMode;
  }
  
  /**
   * Process a command using the LLM-based parser
   * @returns Array of separate commands to be executed sequentially
   */
  async processCommand(input: string): Promise<CommandType[]> {
    console.log(`EnhancedMultiCommandHandler processing: "${input}"`);
    
    if (this.isTestMode) {
      // In test mode, use the basic test mode response
      return this.llmParser.getTestModeResponse(input);
    }
    
    try {
      // Use the LLM parser to parse the command
      const commands = await this.llmParser.parseCommand(input);
      
      if (commands.length > 0) {
        console.log(`LLM parser identified ${commands.length} commands`);
        return commands;
      }
      
      // If no commands were parsed, return a default command
      return [{
        action: 'write',
        primaryTarget: 'TEST MCP',
        content: input,
        formatType: 'paragraph'
      }];
    } catch (error) {
      console.error('Error in EnhancedMultiCommandHandler:', error);
      
      // If there's an API error, fall back to a simple test mode response
      return this.llmParser.getTestModeResponse(input);
    }
  }
}

/**
 * Creates a new enhanced multi-command handler
 * @param openAiApiKey OpenAI API key
 * @param isTestMode Whether to run in test mode
 * @returns EnhancedMultiCommandHandler instance
 */
export function createEnhancedMultiCommandHandler(
  openAiApiKey: string, 
  isTestMode: boolean = false
): EnhancedMultiCommandHandler {
  return new EnhancedMultiCommandHandler(openAiApiKey, isTestMode);
} 