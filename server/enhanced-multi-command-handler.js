import { LLMCommandParser } from './llm-command-parser.js';

/**
 * Enhanced handler for natural language commands using LLM parsing
 * No hardcoded patterns or format-specific logic - fully adaptable to Notion's range
 */
export class EnhancedMultiCommandHandler {
  constructor(apiKey, isTestMode = false) {
    this.llmParser = new LLMCommandParser(apiKey, isTestMode);
    this.isTestMode = isTestMode;
    this.fallbackHandler = null;
  }
  
  /**
   * Process natural language command using the LLM-based parser
   * @returns Array of separate commands to be executed sequentially
   */
  async processCommand(input) {
    try {
    console.log(`EnhancedMultiCommandHandler processing: "${input}"`);
    
      // Step 1: Try to parse with the LLM command parser
      if (!this.llmParser) {
        throw new Error('LLM Command Parser is not initialized');
    }
    
      // Let the LLM do all the heavy lifting - no pattern matching needed
      const commands = await this.llmParser.parseCommand(input);
      console.log('LLM parser identified', commands.length, 'commands');
      
      // Return the commands directly - no post-processing needed
        return commands;
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
}

/**
 * Creates a new enhanced multi-command handler
 * @param apiKey OpenAI API key
 * @param isTestMode Whether to run in test mode
 * @returns EnhancedMultiCommandHandler instance
 */
export function createEnhancedMultiCommandHandler(
  apiKey,
  isTestMode = false
) {
  return new EnhancedMultiCommandHandler(apiKey, isTestMode);
} 