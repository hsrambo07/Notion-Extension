/**
 * Context-Aware Command Handler
 * 
 * This handler analyzes page content and structure to make intelligent decisions
 * about how to process user commands, particularly focusing on where to place content
 * within existing page sections.
 */

import PageAnalyzer from './page-analyzer.js';
import { LLMCommandParser } from './llm-command-parser.js';

class ContextAwareHandler {
  constructor(notionApiToken, openAiApiKey) {
    this.notionApiToken = notionApiToken;
    this.openAiApiKey = openAiApiKey;
    this.pageAnalyzer = new PageAnalyzer();
    this.llmCommandParser = openAiApiKey ? new LLMCommandParser(openAiApiKey) : null;
    this.notionApiBaseUrl = 'https://api.notion.com/v1';
  }

  /**
   * Process a user command with contextual awareness
   * @param {string} input - User input/command
   * @returns {Promise<Object>} Processing result
   */
  async processCommand(input) {
    try {
      console.log(`Context-aware handler processing: "${input}"`);
      
      // Step 1: Parse the command to understand user intent
      const parsedCommand = await this.parseCommand(input);
      console.log('Parsed command:', parsedCommand);
      
      if (!parsedCommand || !parsedCommand.action) {
        return { 
          success: false, 
          message: 'Could not understand the command' 
        };
      }
      
      // Step 2: Identify the target page
      const pageId = await this.findPageId(parsedCommand.primaryTarget);
      
      if (!pageId) {
        return { 
          success: false, 
          message: `Could not find a page named "${parsedCommand.primaryTarget}"` 
        };
      }
      
      // Step 3: Get the page content for analysis
      const pageContent = await this.getPageContent(pageId);
      
      if (!pageContent || !pageContent.results) {
        return { 
          success: false, 
          message: `Could not retrieve content from "${parsedCommand.primaryTarget}" page` 
        };
      }
      
      // Step 4: Analyze the page structure to identify sections
      const pageStructure = this.pageAnalyzer.analyzePageStructure(pageContent.results);
      
      // Step 5: Determine the target section based on user request
      const targetSection = parsedCommand.sectionTarget ? 
                          this.pageAnalyzer.findTargetSection(pageStructure, parsedCommand.sectionTarget) : 
                          null;
      
      // Step 6: Execute the command with contextual awareness
      return await this.executeContextualCommand(parsedCommand, pageId, pageStructure, targetSection);
    } catch (error) {
      console.error('Error in context-aware handler:', error);
      return { 
        success: false, 
        message: `Error processing command: ${error.message}` 
      };
    }
  }
  
  /**
   * Parse a command using LLM if available, or fallback to simpler parsing
   */
  async parseCommand(input) {
    if (this.llmCommandParser) {
      try {
        // Use the LLM parser for comprehensive understanding
        const commands = await this.llmCommandParser.parseCommand(input);
        if (commands && commands.length > 0) {
          return commands[0];
        }
      } catch (error) {
        console.error('Error using LLM parser, falling back to simpler parsing:', error);
      }
    }
    
    // Simple fallback parsing - extract basic intent and targets
    return this.simpleFallbackParsing(input);
  }
  
  /**
   * Simple fallback parsing when LLM is not available
   */
  simpleFallbackParsing(input) {
    const lowerInput = input.toLowerCase();
    
    // Extract action type
    let action = 'write'; // Default action
    if (lowerInput.includes('add') || lowerInput.includes('create')) {
      action = 'write';
    } else if (lowerInput.includes('edit') || lowerInput.includes('update')) {
      action = 'update';
    } else if (lowerInput.includes('delete') || lowerInput.includes('remove')) {
      action = 'delete';
    }
    
    // Extract content type
    let formatType = 'paragraph'; // Default format
    if (lowerInput.includes('to-do') || lowerInput.includes('todo') || lowerInput.includes('task')) {
      formatType = 'to_do';
    } else if (lowerInput.includes('bullet')) {
      formatType = 'bulleted_list_item';
    } else if (lowerInput.includes('toggle')) {
      formatType = 'toggle';
    }
    
    // Extract target section
    let sectionTarget = null;
    const sectionMatch = input.match(/(?:in|to)\s+(?:the\s+)?(?:["']?)([\w\s]+?)(?:["']?)\s+section/i);
    if (sectionMatch && sectionMatch[1]) {
      sectionTarget = sectionMatch[1].trim();
    }
    
    // Extract page name
    let primaryTarget = 'TEST MCP'; // Default page
    const pageMatch = input.match(/(?:in|to)\s+(?:a|the\s+)?(?:["']?)([\w\s]+?)(?:["']?)\s+page/i);
    if (pageMatch && pageMatch[1]) {
      primaryTarget = pageMatch[1].trim();
    }
    
    // Extract content - everything before "in" or "to" is likely content
    let content = input;
    const contentMatch = input.match(/(?:add|create|write)\s+(.*?)(?:\s+(?:in|to|as)\s+)/i);
    if (contentMatch && contentMatch[1]) {
      content = contentMatch[1].trim();
    }
    
    return {
      action,
      primaryTarget,
      content,
      formatType,
      sectionTarget
    };
  }
  
  /**
   * Execute a command with contextual awareness about the page structure
   */
  async executeContextualCommand(command, pageId, pageStructure, targetSection) {
    // Set default format type based on page structure if not specified
    if (!command.formatType && pageStructure && pageStructure.structure) {
      command.formatType = pageStructure.structure.primaryContentType || 'paragraph';
    }
    
    console.log(`Executing ${command.action} command for content: "${command.content}"`);
    console.log(`Target section: ${targetSection ? targetSection.title : 'None specified'}`);
    
    // For writing tasks and todos
    if ((command.action === 'write' || command.action === 'add') && 
        (command.formatType === 'to_do' || command.content.toLowerCase().includes('todo') || 
         command.content.toLowerCase().includes('task'))) {
      
      // Create the to-do block
      const todoBlock = {
        object: 'block',
        type: 'to_do',
        to_do: {
          rich_text: [{
            type: 'text',
            text: { content: command.content }
          }],
          checked: false
        }
      };
      
      // Determine where to add the block
      if (targetSection) {
        // If target section exists, add it after the section heading
        return await this.addBlockAfterPosition(pageId, targetSection.startIndex, [todoBlock]);
      } else {
        // Look for an appropriate section based on context
        const taskSections = pageStructure.sections.filter(section => 
          section.title.toLowerCase().includes('task') || 
          section.title.toLowerCase().includes('todo') ||
          section.title.toLowerCase().includes('my day')
        );
        
        if (taskSections.length > 0) {
          // Use the first task section found
          return await this.addBlockAfterPosition(pageId, taskSections[0].startIndex, [todoBlock]);
        } else {
          // No task section found, add to the end of the page
          return await this.appendToPage(pageId, [todoBlock]);
        }
      }
    }
    
    // For standard writing to a page
    if (command.action === 'write' || command.action === 'add') {
      // Create the appropriate block based on format type
      let block;
      
      switch (command.formatType) {
        case 'bulleted_list_item':
          block = {
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{
                type: 'text',
                text: { content: command.content }
              }]
            }
          };
          break;
          
        case 'toggle':
          block = {
            object: 'block',
            type: 'toggle',
            toggle: {
              rich_text: [{
                type: 'text',
                text: { content: command.content }
              }]
            }
          };
          break;
          
        case 'to_do':
          block = {
            object: 'block',
            type: 'to_do',
            to_do: {
              rich_text: [{
                type: 'text',
                text: { content: command.content }
              }],
              checked: false
            }
          };
          break;
          
        default:
          block = {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [{
                type: 'text',
                text: { content: command.content }
              }]
            }
          };
      }
      
      if (targetSection) {
        // Add to the specific target section
        return await this.addBlockAfterPosition(pageId, targetSection.startIndex, [block]);
      } else {
        // Add to the end of the page
        return await this.appendToPage(pageId, [block]);
      }
    }
    
    // For actions not specifically handled
    return {
      success: false,
      message: `Action ${command.action} not currently supported in context-aware mode`
    };
  }
  
  /**
   * Find a page ID by page name
   */
  async findPageId(pageName) {
    if (!pageName) return null;
    
    try {
      const response = await fetch(`${this.notionApiBaseUrl}/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.notionApiToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: pageName,
          filter: {
            value: 'page',
            property: 'object'
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error searching for page: ${response.status}`);
      }
      
      const searchData = await response.json();
      
      if (!searchData.results || searchData.results.length === 0) {
        return null;
      }
      
      // Find the best matching page
      for (const page of searchData.results) {
        const title = this.extractPageTitle(page);
        if (title && title.toLowerCase().includes(pageName.toLowerCase())) {
          return page.id;
        }
      }
      
      // If no good match, return the first result
      return searchData.results[0].id;
    } catch (error) {
      console.error('Error finding page by name:', error);
      return null;
    }
  }
  
  /**
   * Extract the title from a page object
   */
  extractPageTitle(page) {
    if (!page) return null;
    
    // For database items
    if (page.properties && page.properties.title) {
      const titleProp = page.properties.title;
      
      if (Array.isArray(titleProp.title)) {
        return titleProp.title.map(t => t.plain_text || '').join('');
      }
      
      if (typeof titleProp === 'string') {
        return titleProp;
      }
    }
    
    // For non-database pages
    if (page.title) {
      if (Array.isArray(page.title)) {
        return page.title.map(t => t.plain_text || '').join('');
      }
      return page.title.toString();
    }
    
    return null;
  }
  
  /**
   * Get content from a page
   */
  async getPageContent(pageId) {
    try {
      const response = await fetch(`${this.notionApiBaseUrl}/blocks/${pageId}/children?page_size=100`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.notionApiToken}`,
          'Notion-Version': '2022-06-28'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get page content: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting page content:', error);
      throw error;
    }
  }
  
  /**
   * Add a block after a specific position in the page
   */
  async addBlockAfterPosition(pageId, position, blocks) {
    try {
      // Get all blocks in the page
      const pageContent = await this.getPageContent(pageId);
      
      if (!pageContent || !pageContent.results || position >= pageContent.results.length) {
        // If position is invalid, append to the end
        return await this.appendToPage(pageId, blocks);
      }
      
      // Get the block ID at the specified position
      const blockId = pageContent.results[position].id;
      
      // Add blocks after the specified block
      const response = await fetch(`${this.notionApiBaseUrl}/blocks/${blockId}/children`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.notionApiToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          children: blocks
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add blocks after position: ${response.status}`);
      }
      
      const result = await response.json();
      
      return {
        success: true,
        message: `Added content after "${pageContent.results[position].type}" block`,
        result
      };
    } catch (error) {
      console.error('Error adding block after position:', error);
      return {
        success: false,
        message: `Error adding content: ${error.message}`
      };
    }
  }
  
  /**
   * Append blocks to the end of a page
   */
  async appendToPage(pageId, blocks) {
    try {
      const response = await fetch(`${this.notionApiBaseUrl}/blocks/${pageId}/children`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.notionApiToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          children: blocks
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to append to page: ${response.status}`);
      }
      
      const result = await response.json();
      
      return {
        success: true,
        message: 'Added content to page',
        result
      };
    } catch (error) {
      console.error('Error appending to page:', error);
      return {
        success: false,
        message: `Error adding content: ${error.message}`
      };
    }
  }
}

export default ContextAwareHandler; 