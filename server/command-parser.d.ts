/**
 * TypeScript declaration file for command-parser.js
 */

export interface CommandType {
  action: string;
  primaryTarget?: string;
  secondaryTarget?: string;
  content?: string;
  formatType?: string;
  sectionTarget?: string;
  oldContent?: string;
  newContent?: string;
  debug?: boolean;
  isUrl?: boolean;
  commentText?: string;
  toggleTitle?: string;
}

export interface CommandParser {
  parseCommand(input: string): Promise<CommandType>;
}

/**
 * Creates a new command parser
 * @param openAiApiKey OpenAI API key
 * @param isTestMode Whether to run in test mode
 * @returns CommandParser instance
 */
export function createCommandParser(
  openAiApiKey: string,
  isTestMode?: boolean
): Promise<CommandParser>; 