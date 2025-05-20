import { CommandParser, type CommandType } from './command-parser.js';

/**
 * Handler for multi-part commands to properly split and execute complex user instructions
 */
export class MultiCommandHandler {
  private commandParser: CommandParser;
  
  constructor(commandParser: CommandParser) {
    this.commandParser = commandParser;
  }
  
  /**
   * Process a potentially multi-part command
   * @returns Array of separate commands to be executed sequentially
   */
  async processCommand(input: string): Promise<CommandType[]> {
    console.log(`MultiCommandHandler processing: "${input}"`);
    
    // Detect common multi-part command patterns
    const hasMultipleActions = this.detectMultipleActions(input);
    
    if (!hasMultipleActions) {
      // If it's a single command, just parse it normally
      return await this.commandParser.parseCommand(input);
    }
    
    console.log('Multi-action command detected, handling separately');
    
    // Use the command parser to get structured commands
    const commands = await this.commandParser.parseCommand(input);
    
    // Check if the LLM correctly identified multiple commands
    if (commands.length > 1) {
      console.log(`LLM identified ${commands.length} separate commands`);
      return commands;
    }
    
    // If LLM didn't identify multiple commands but we detected them
    // Try to parse again with explicit instructions
    return this.fallbackParsing(input);
  }
  
  /**
   * Detect if the input contains multiple actions to perform
   */
  private detectMultipleActions(input: string): boolean {
    const multiActionPatterns = [
      // "X and Y" pattern
      /\b(?:add|create|write|edit)\b.*?\band\b.*?\b(?:add|create|write|edit)\b/i,
      
      // "X, then Y" pattern
      /\b(?:add|create|write|edit)\b.*?,\s*then\b.*?\b(?:add|create|write|edit)\b/i,
      
      // URL with comment indicator
      /https?:\/\/.*?\b(?:with|comment|note|saying)\b/i,
      
      // Two separate "in X" or "to Y" targets
      /\b(?:in|to)\s+['"]?([^'",.]+?)['"]?(?:\s+page)?\b.*?\b(?:in|to)\s+['"]?([^'",.]+?)['"]?(?:\s+page)?\b/i,
      
      // "Add X as Y and this as Z" pattern - specific multi-format pattern
      /\b(?:add|write)\b.*?\bas\s+(\w+).*?\band\b.*?\b(?:this|it)\b.*?\bas\s+(\w+)\b/i,
      
      // Multiple checklist items pattern (with "and")
      /\b(?:add|create|write)\b\s+.*?\s+in\s+checklist\s+and\s+.*?\s+in\s+checklist\b/i,
      
      // Comma-separated checklist items
      /\b(?:add|create|write)\b\s+.*?(?:,\s+.*?)+\s+(?:in|as)\s+checklist\b/i,
      
      // Checklist with "too" pattern
      /\b(?:add|create|write)\b\s+.*?\s+(?:in|as)\s+checklist\s+.*?\s+too\b/i
    ];
    
    return multiActionPatterns.some(pattern => pattern.test(input));
  }
  
  /**
   * Apply fallback parsing for multi-part commands when the LLM doesn't separate them correctly
   */
  private async fallbackParsing(input: string): Promise<CommandType[]> {
    // First check specific patterns
    
    // Multiple checklist items pattern - high priority
    const checklistPattern = /add\s+(.*?)\s+in\s+checklist\s+and\s+(.*?)\s+in\s+checklist(?:\s+too)?(?:\s+in\s+([^,.]+))?/i;
    const checklistMatch = checklistPattern.exec(input);
    if (checklistMatch) {
      console.log('Detected multiple checklist items with "and" pattern');
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
    
    // Comma-separated checklist items
    const commaChecklistPattern = /add\s+(.*?)(?:,\s*(.*?))?(?:,\s*(.*?))?(?:\s+in|\s+as)\s+checklist(?:\s+in\s+([^,.]+))?/i;
    const commaMatch = commaChecklistPattern.exec(input);
    if (commaMatch) {
      console.log('Detected comma-separated checklist items pattern');
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
    
    // Special pattern: "add X as quote and this as checklist" 
    const formatPatternMatch = input.match(/\b(?:add|write)\b\s+(.*?)\s*,?\s*as\s+(\w+).*?\band\b.*?\b(?:this|it)\b.*?\bas\s+(\w+)/i);
    if (formatPatternMatch) {
      const firstContent = formatPatternMatch[1]?.trim() || '';
      const firstFormat = formatPatternMatch[2]?.trim().toLowerCase() || 'paragraph';
      const secondFormat = formatPatternMatch[3]?.trim().toLowerCase() || 'paragraph';
      
      // Extract target page
      const pageMatch = input.match(/\bin\s+(?:the\s+)?['"]?([^'",.]+?)['"]?(?:\s+page)?\b/i);
      const targetPage = pageMatch ? pageMatch[1]?.trim() : 'TEST MCP';
      
      // Extract second content after "this as X: content"
      let secondContent = '';
      const colonMatch = input.match(new RegExp(`as\\s+${secondFormat}\\s*:\\s*(.*?)(?:$|\\.)`, 'i'));
      if (colonMatch) {
        secondContent = colonMatch[1]?.trim() || '';
      } else {
        // Try to extract content after the pattern or use default
        const afterPattern = input.substring(input.indexOf(secondFormat) + secondFormat.length);
        secondContent = afterPattern.trim() || 'Second content';
      }
      
      return [
        {
          action: 'write',
          primaryTarget: targetPage,
          content: firstContent,
          formatType: firstFormat
        },
        {
          action: 'write',
          primaryTarget: targetPage,
          content: secondContent,
          formatType: secondFormat,
          isMultiAction: true
        }
      ];
    }
    
    // URL with comment pattern
    if (input.match(/^https?:\/\//i) && input.match(/\b(?:with|comment|note|saying)\b/i)) {
      const url = input.match(/^(https?:\/\/[^\s]+)/i)?.[1] || '';
      const target = this.extractTarget(input) || 'Personal Thoughts';
      
      // Extract the comment part
      let commentText = '';
      const commentMatch = input.match(/\b(?:with|comment|note|saying)[:\s]+(.+?)(?:$|\.)/i);
      if (commentMatch) {
        commentText = commentMatch[1].trim();
      }
      
      return [{
        action: 'write',
        primaryTarget: target,
        content: url,
        isUrl: true,
        commentText
      }];
    }
    
    // Special pattern: "add X as Y to Z and add this as W" 
    if (input.match(/add\s+.*?\s+as\s+.*?\s+to\s+.*?\s+and\s+add\s+.*?\s+as\s/i)) {
      // First part: add X as Y to Z
      const firstPartMatch = input.match(/add\s+(.*?)\s+as\s+(.*?)\s+to\s+(.*?)(?:\s+and\s+|\s*$)/i);
      const firstContent = firstPartMatch?.[1] || '';
      const firstFormat = firstPartMatch?.[2] || 'paragraph';
      const firstTarget = firstPartMatch?.[3] || 'TEST MCP';
      
      // Second part: add this as W
      const secondPartMatch = input.match(/and\s+add\s+.*?\s+as\s+(.*?)(?:\s+to\s+(.*?))?(?:\s*:|$)/i);
      const secondFormat = secondPartMatch?.[1] || 'paragraph';
      const secondTarget = secondPartMatch?.[2] || firstTarget; // Reuse first target if not specified
      
      // Content for the second part could be explicit or implicit
      let secondContent = '';
      const explicitSecondContent = input.match(/and\s+add\s+(.*?)\s+as\s/i);
      if (explicitSecondContent && explicitSecondContent[1].toLowerCase() !== 'this') {
        secondContent = explicitSecondContent[1];
      } else {
        // If using "this", find any content after "as X" and ":"
        const impliedContent = input.match(/as\s+.*?:\s+(.*?)(?:$|\.)/i);
        secondContent = impliedContent?.[1] || 'Second part content';
      }
      
      return [
        {
          action: 'write',
          primaryTarget: firstTarget.replace(/\s+page$/i, ''),
          content: firstContent,
          formatType: firstFormat
        },
        {
          action: 'write',
          primaryTarget: secondTarget.replace(/\s+page$/i, ''),
          content: secondContent,
          formatType: secondFormat,
          isMultiAction: true
        }
      ];
    }
    
    // Create page and add content pattern
    if (input.match(/create\s+.*?\s+and\s+add\s/i)) {
      const createMatch = input.match(/create\s+(?:a\s+)?(?:page\s+)?['"](.*?)['"]?(?:\s+in\s+(.*?))?(?:\s+and\s+|\s*$)/i) ||
                         input.match(/create\s+(?:a\s+)?(?:page\s+)?(.*?)(?:\s+in\s+(.*?))?(?:\s+and\s+|\s*$)/i);
      
      const pageTitle = createMatch?.[1] || 'New Page';
      const parentPage = createMatch?.[2];
      
      // Extract content to add
      const contentMatch = input.match(/add\s+['"](.*?)['"](?:\s+to\s+(.*?))?(?:$|\.)/i) ||
                          input.match(/add\s+(.*?)(?:\s+to\s+(.*?))?(?:$|\.)/i);
      
      const content = contentMatch?.[1] || '';
      const target = contentMatch?.[2] || pageTitle; // Default to adding to the new page
      
      return [
        {
          action: 'create',
          primaryTarget: pageTitle,
          secondaryTarget: parentPage
        },
        {
          action: 'write',
          primaryTarget: target,
          content: content,
          isMultiAction: true
        }
      ];
    }
    
    // Default approach: just try to parse as a single command
    const fallbackCommand = await this.commandParser.parseCommand(input);
    return fallbackCommand;
  }
  
  /**
   * Extract target page name from input
   */
  private extractTarget(input: string): string | null {
    const targetPatterns = [
      // "to X page" pattern
      /\bto\s+['"]?([^'",.]+?)['"]?(?:\s+page)?\b/i,
      
      // "in X page" pattern
      /\bin\s+['"]?([^'",.]+?)['"]?(?:\s+page)?\b/i,
    ];
    
    for (const pattern of targetPatterns) {
      const match = input.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return null;
  }
}

export function createMultiCommandHandler(commandParser: CommandParser): MultiCommandHandler {
  return new MultiCommandHandler(commandParser);
} 