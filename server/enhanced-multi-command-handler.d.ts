/**
 * TypeScript declaration file for enhanced-multi-command-handler.ts
 */

import { CommandType } from './command-parser';

export class EnhancedMultiCommandHandler {
  constructor(openAiApiKey: string, isTestMode?: boolean);
  
  /**
   * Process a command using the LLM-based parser
   * @returns Array of separate commands to be executed sequentially
   */
  processCommand(input: string): Promise<CommandType[]>;
}

/**
 * Creates a new enhanced multi-command handler
 * @param openAiApiKey OpenAI API key
 * @param isTestMode Whether to run in test mode
 * @returns EnhancedMultiCommandHandler instance
 */
export function createEnhancedMultiCommandHandler(
  openAiApiKey: string,
  isTestMode?: boolean
): EnhancedMultiCommandHandler; 