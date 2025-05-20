/**
 * TypeScript declaration file for context-aware-handler.js
 */

import PageAnalyzer from './page-analyzer';

export default class ContextAwareHandler {
  constructor(notionApiToken: string, openAiApiKey: string);

  /**
   * Process a user command with contextual awareness
   * @param {string} input - User input/command
   * @returns {Promise<Object>} Processing result
   */
  processCommand(input: string): Promise<{
    success: boolean;
    message: string;
    result?: any;
  }>;

  /**
   * Parse a command using LLM if available, or fallback to simpler parsing
   */
  parseCommand(input: string): Promise<{
    action: string;
    primaryTarget?: string;
    content?: string;
    formatType?: string;
    sectionTarget?: string;
    [key: string]: any;
  }>;

  /**
   * Simple fallback parsing when LLM is not available
   */
  simpleFallbackParsing(input: string): {
    action: string;
    primaryTarget: string;
    content: string;
    formatType: string;
    sectionTarget: string | null;
  };

  /**
   * Execute a command with contextual awareness about the page structure
   */
  executeContextualCommand(
    command: {
      action: string;
      primaryTarget?: string;
      content?: string;
      formatType?: string;
      sectionTarget?: string;
      [key: string]: any;
    },
    pageId: string,
    pageStructure: any,
    targetSection: any
  ): Promise<{
    success: boolean;
    message: string;
    result?: any;
  }>;

  /**
   * Find a page ID by page name
   */
  findPageId(pageName: string): Promise<string | null>;

  /**
   * Extract the title from a page object
   */
  extractPageTitle(page: any): string | null;

  /**
   * Get content from a page
   */
  getPageContent(pageId: string): Promise<any>;

  /**
   * Add a block after a specific position in the page
   */
  addBlockAfterPosition(
    pageId: string,
    position: number,
    blocks: Array<any>
  ): Promise<{
    success: boolean;
    message: string;
    result?: any;
  }>;

  /**
   * Append blocks to the end of a page
   */
  appendToPage(
    pageId: string,
    blocks: Array<any>
  ): Promise<{
    success: boolean;
    message: string;
    result?: any;
  }>;
} 