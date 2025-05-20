/**
 * TypeScript declaration file for llm-command-parser.js
 */

export class LLMCommandParser {
  constructor(openAiApiKey: string);
  
  /**
   * Parse a command using the LLM
   * @param {string} input The natural language command
   * @returns {Promise<Array>} Array of parsed command objects
   */
  parseCommand(input: string): Promise<Array<{
    action: string;
    primaryTarget?: string;
    content?: string;
    oldContent?: string;
    newContent?: string;
    secondaryTarget?: string;
    formatType?: string;
    sectionTarget?: string;
    debug?: boolean;
    isUrl?: boolean;
    commentText?: string;
    urlFormat?: string;
  }>>;
  
  /**
   * Get test mode response for when the API is not available
   * @param {string} input The natural language command
   * @returns {Array} Array of parsed command objects
   */
  getTestModeResponse(input: string): Array<{
    action: string;
    primaryTarget?: string;
    content?: string;
    oldContent?: string;
    newContent?: string;
    secondaryTarget?: string;
    formatType?: string;
    sectionTarget?: string;
    debug?: boolean;
    isUrl?: boolean;
    commentText?: string;
    urlFormat?: string;
  }>;
  
  /**
   * Validate the OpenAI API key
   */
  validateApi(): Promise<boolean>;
} 