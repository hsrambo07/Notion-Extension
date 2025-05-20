/**
 * TypeScript declaration file for multi-command-handler.js
 */

import { CommandType, CommandParser } from './command-parser';

export interface MultiCommandHandler {
  processCommand(input: string): Promise<CommandType[]>;
}

/**
 * Creates a new multi-command handler
 * @param commandParser The command parser to use
 * @returns MultiCommandHandler instance
 */
export function createMultiCommandHandler(
  commandParser: CommandParser
): MultiCommandHandler; 