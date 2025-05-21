import fetch from 'node-fetch';

/**
 * AI Agent Network - A collection of specialized AI agents that work together
 * to intelligently parse and execute natural language commands
 */
export class AIAgentNetwork {
  private openAiApiKey: string;
  private isTestEnvironment: boolean;
  private specializedAgents: Map<string, SpecializedAgent>;
  
  constructor(openAiApiKey: string, isTestEnvironment: boolean = false) {
    this.openAiApiKey = openAiApiKey;
    this.isTestEnvironment = isTestEnvironment;
    this.specializedAgents = new Map();
    
    // Validate OpenAI API key format
    if (!this.isTestEnvironment) {
      if (!openAiApiKey) {
        console.warn('WARNING: No OpenAI API key provided. API calls will fail.');
      } else if (!openAiApiKey.startsWith('sk-') || openAiApiKey.length < 20) {
        console.warn('WARNING: OpenAI API key appears to be malformed. Should start with "sk-" and be at least 20 chars long.');
        console.warn(`Current key starts with "${openAiApiKey.substring(0, 5)}..." and is ${openAiApiKey.length} characters long.`);
      }
    }
    
    // Initialize the specialized agents
    this.initializeAgents();
  }
  
  /**
   * Initialize specialized agents for different tasks
   */
  private initializeAgents(): void {
    // Command parser agent - identifies the basic command structure
    this.specializedAgents.set('commandParser', new SpecializedAgent(
      this.openAiApiKey,
      'commandParser',
      `You are an expert command parser. Your job is to identify the basic command structure from natural language.
       Identify the main action, target page, and any content to be added or modified.
       Focus on accuracy over completeness - if you're not sure about a field, leave it blank.`
    ));
    
    // Format detector agent - specializes in detecting content formatting
    this.specializedAgents.set('formatDetector', new SpecializedAgent(
      this.openAiApiKey,
      'formatDetector',
      `You are an expert format detector for Notion content formatting. Your job is to analyze a command and determine how content should be formatted.
       Common formats include: paragraph, bullet, toggle, quote, code, callout, to_do, heading, subheading.
       
       CRITICAL RULES:
       1. For any todo-like patterns, you MUST return EXACTLY "to_do" (not "todo" or "checklist" or "task")
       2. This includes:
          - "as todo" -> "to_do"
          - "as checklist" -> "to_do"
          - "as task" -> "to_do"
          - "in todo" -> "to_do"
          - "in checklist" -> "to_do"
       3. The string "to_do" must be exact - no variations allowed
       
       Return ONLY the format type string and nothing else.`
    ));
    
    // Multi-command detector - specializes in detecting and parsing multi-part commands
    this.specializedAgents.set('multiCommandDetector', new SpecializedAgent(
      this.openAiApiKey,
      'multiCommandDetector',
      `You are an expert in detecting multi-part commands. Your job is to analyze if a command contains multiple actions.
       Look for patterns like:
       - "add X as Y and this as Z"
       - "do X then do Y" 
       - "add X to Y and Z to W"
       - "create X, then add Y"
       - "add X, then add Y with Z"
       If multiple commands are detected, split them into separate commands.`
    ));
    
    // URL detector - specializes in parsing URLs and associated comments
    this.specializedAgents.set('urlDetector', new SpecializedAgent(
      this.openAiApiKey,
      'urlDetector',
      `You are an expert URL detector. Your job is to extract URLs and any associated comments or descriptions.
       Look for URLs followed by text that might be a comment about the URL.
       Return the URL and the comment separately.`
    ));
    
    // Section targeting detector - specializes in identifying target sections within pages
    this.specializedAgents.set('sectionDetector', new SpecializedAgent(
      this.openAiApiKey,
      'sectionDetector',
      `You are an expert section detector. Your job is to identify when a user wants to add content to a specific section within a page.
       Look for patterns like:
       - "In the X section of Y page"
       - "Under the X heading in Y"
       - "To the X part of Y page"
       - "Below the X section in Y"
       Return both the section name and the page name.`
    ));
    
    // Complex format detector - specializes in detecting multiple formats within a single command
    this.specializedAgents.set('complexFormatDetector', new SpecializedAgent(
      this.openAiApiKey,
      'complexFormatDetector',
      `You are an expert in detecting complex formatting patterns. Your job is to identify when a command involves multiple formatting types.
       Examples:
       - "Add a heading X, then add a bullet list with Y, Z"
       - "Create a toggle called X with content Y"
       - "Add a callout saying X, then add code block with Y"
       Return all format types detected and their associated content.`
    ));
  }
  
  /**
   * Process a natural language command using the AI agent network
   */
  async processCommand(input: string): Promise<any> {
    console.log(`AI Agent Network processing: "${input}"`);
    
    if (this.isTestEnvironment) {
      return this.getTestModeResponse(input);
    }
    
    // Log input for debugging
    console.log(`DEBUG: Processing input: "${input}"`);
    
    // FIRST: Check for todo patterns before anything else
    const todoPattern = /add\s+(.*?)\s+(?:(?:in|as)\s+(?:a\s+)?(?:to-?do|todo|to\s+do|checklist|task)(?:\s+item)?|\s+in\s+todo)(?:\s+(?:in|to)\s+(?:my\s+)?([^\s]+(?:\s+[^\s]+)*)\s*page)?/i;
    const todoMatch = input.match(todoPattern);
    
    if (todoMatch) {
      console.log('DEBUG: Direct todo pattern match:', todoMatch);
      const content = todoMatch[1]?.trim();
      const targetPage = todoMatch[2]?.trim() || 'TEST MCP';
      
      if (content) {
        console.log('DEBUG: Creating todo command with content:', content);
        console.log('DEBUG: Target page:', targetPage);
        return [{
          action: 'write',
          primaryTarget: targetPage,
          content: content,
          formatType: 'to_do'
        }];
      }
    }
    
    try {
      // Handle multi-command case
      if (input.includes(' and ')) {
        const commands = await this.splitMultiCommands(input);
        return commands.map(cmd => {
          if (cmd.formatType && /(todo|to-?do|task|checklist)/i.test(cmd.formatType)) {
            console.log(`DEBUG: Normalizing format type from "${cmd.formatType}" to "to_do"`);
            cmd.formatType = 'to_do';
          }
          return cmd;
        });
      }
      
      // 2. Check if this is a URL with comment
      const urlInfo = await this.specializedAgents.get('urlDetector')?.detect(input);
      if (urlInfo && urlInfo.isUrl) {
        console.log('URL detected:', urlInfo);
        return [{
          action: 'write',
          primaryTarget: urlInfo.targetPage || 'TEST MCP',
          content: urlInfo.url,
          isUrl: true,
          commentText: urlInfo.comment
        }];
      }
      
      // 3. Check for complex formatting within a single command
      const complexFormatInfo = await this.specializedAgents.get('complexFormatDetector')?.detect(input);
      if (complexFormatInfo && complexFormatInfo.hasMultipleFormats) {
        console.log('Complex formatting detected:', complexFormatInfo);
        
        // If multiple formats but a single action, create separate commands
        if (Array.isArray(complexFormatInfo.formats) && complexFormatInfo.formats.length > 1) {
          const commands = complexFormatInfo.formats.map((format: {type?: string; content?: string}, index: number) => ({
            action: 'write',
            primaryTarget: complexFormatInfo.targetPage || 'TEST MCP',
            content: format.content || '',
            formatType: format.type || 'paragraph',
            isMultiAction: index > 0 // Mark subsequent commands as part of a multi-action
          }));
          
          return commands;
        }
      }
      
      // 4. Check for section targeting
      const sectionInfo = await this.specializedAgents.get('sectionDetector')?.detect(input);
      if (sectionInfo && sectionInfo.sectionName) {
        console.log('Section targeting detected:', sectionInfo);
        
        // 5. Parse basic command structure
        const baseCommand = await this.specializedAgents.get('commandParser')?.parse(input);
        
        if (baseCommand) {
          // Add section information to the command
          baseCommand.sectionTarget = sectionInfo.sectionName;
          baseCommand.primaryTarget = sectionInfo.pageName || baseCommand.primaryTarget;
          
          return [baseCommand];
        }
      }
      
      // 6. Parse basic command structure
      const baseCommand = await this.specializedAgents.get('commandParser')?.parse(input);
      
      // 7. Detect format if applicable
      if (baseCommand && baseCommand.action === 'write' && !baseCommand.formatType) {
        const formatInfo = await this.specializedAgents.get('formatDetector')?.detect(input);
        if (formatInfo && formatInfo.formatType) {
          baseCommand.formatType = formatInfo.formatType;
        }
      }
      
      // Normalize format type
      if (baseCommand && baseCommand.formatType && /(todo|to-?do|task|checklist)/i.test(baseCommand.formatType)) {
        console.log(`DEBUG: Normalizing format type from "${baseCommand.formatType}" to "to_do"`);
        baseCommand.formatType = 'to_do';
      }

      return [baseCommand];
    } catch (error) {
      console.error('Error in AI Agent Network processCommand:', error);
      return this.getTestModeResponse(input);
    }
  }
  
  /**
   * Split a multi-command input into separate commands
   */
  private async splitMultiCommands(input: string): Promise<any[]> {
    // Use a more specialized prompt for splitting multi-commands
    const systemPrompt = `
      You are an expert at parsing multi-part Notion commands. Split this into individual commands:
      "${input}"
      
      Return a JSON array of command objects with these fields:
      - action: The action to perform (create, write, read, edit, delete, etc.)
      - primaryTarget: The main page to target
      - content: The content to add
      - formatType: Content format (paragraph, bullet, quote, etc.)
      
      For "X as Y and this as Z" patterns, create two separate commands.
    `;
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openAiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: input }
          ],
          temperature: 0,
          response_format: { type: 'json_object' }
        })
      });
      
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }
      
      const data = await response.json() as {
        choices: Array<{
          message: {
            content: string;
          }
        }>
      };
      const content = data.choices[0].message.content;
      
      try {
        const parsedContent = JSON.parse(content);
        return Array.isArray(parsedContent.commands) 
          ? parsedContent.commands 
          : [parsedContent];
      } catch (error) {
        console.error('Error parsing multi-command response:', error);
        return [{ action: 'write', content: input }];
      }
    } catch (error) {
      console.error('Error splitting multi-commands:', error);
      return [{ action: 'write', content: input }];
    }
  }
  
  /**
   * Get a test mode response for the given input
   */
  private getTestModeResponse(input: string): any[] {
    console.log('Using AIAgentNetwork test mode response');
    
    // FIRST: Check for todo patterns before anything else
    const todoPattern = /add\s+(.*?)\s+as\s+(?:a\s+)?(?:to-?do|todo|to\s+do|checklist|task)(?:\s+(?:item\s+)?(?:in|to)\s+(?:my\s+)?([^\s]+(?:\s+[^\s]+)*)\s*page)?/i;
    const todoMatch = input.match(todoPattern);
    
    if (todoMatch || input.includes('as to do')) {
      console.log('DEBUG: Direct todo pattern match:', todoMatch);
      let content, targetPage;
      
      if (todoMatch) {
        content = todoMatch[1]?.trim();
        targetPage = todoMatch[2]?.trim() || 'TEST MCP';
      } else {
        // Handle "as to do" case separately
        const altMatch = input.match(/add\s+(.*?)\s+as\s+to\s+do(?:\s+(?:in|to)\s+(?:my\s+)?([^\s]+(?:\s+[^\s]+)*)\s*page)?/i);
        if (altMatch) {
          content = altMatch[1]?.trim();
          targetPage = altMatch[2]?.trim() || 'TEST MCP';
        }
      }
      
      if (content) {
        console.log('DEBUG: Creating todo command with content:', content);
        console.log('DEBUG: Target page:', targetPage);
        return [{
          action: 'write',
          primaryTarget: targetPage,
          content: content,
          formatType: 'to_do'
        }];
      }
    }
    
    // Check for multiple checklist items
    const checklistWithMultiplePattern = /add\s+(.*?)\s+in\s+checklist\s+and\s+(.*?)\s+in\s+checklist(?:\s+too)?(?:\s+in\s+([^,.]+))?/i;
    const checklistMatch = checklistWithMultiplePattern.exec(input);
    if (checklistMatch) {
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
    
    // Check for comma-separated checklist items
    const commaChecklistPattern = /add\s+(.*?)(?:,\s*(.*?))?(?:,\s*(.*?))?(?:\s+in|\s+as)\s+checklist(?:\s+in\s+([^,.]+))?/i;
    const commaMatch = commaChecklistPattern.exec(input);
    if (commaMatch) {
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
    
    // Check for single checklist item
    const singleChecklistPattern = /add\s+(.*?)\s+(?:in|as)\s+checklist(?:\s+in\s+([^,.]+))?/i;
    const singleMatch = singleChecklistPattern.exec(input);
    if (singleMatch) {
      const content = singleMatch[1]?.trim() || '';
      const targetPage = singleMatch[2]?.trim() || 'TEST MCP';
      
      return [{
        action: 'write',
        primaryTarget: targetPage,
        content: content,
        formatType: 'checklist'
      }];
    }
    
    // Handle URL with comment
    if (input.match(/https?:\/\//i) && input.match(/\s+in\s+/i) && input.match(/\s+with\s+/i)) {
      const urlMatch = input.match(/^(https?:\/\/[^\s]+)/i);
      const url = urlMatch ? urlMatch[1] : 'https://example.com';
      
      const pageMatch = input.match(/\s+in\s+([^.]+?)\s+with/i);
      const page = pageMatch ? pageMatch[1] : 'TEST MCP';
      
      const commentMatch = input.match(/\s+with\s+(?:note|comment):\s+(.*?)(?:$|\.)/i);
      const comment = commentMatch ? commentMatch[1] : 'Comment text';
      
      return [{
        action: 'write',
        primaryTarget: page,
        content: url,
        isUrl: true,
        commentText: comment
      }];
    }
    
    // Default response with a basic command
    return [{
      action: 'write',
      primaryTarget: 'TEST MCP',
      content: input,
      formatType: 'paragraph'
    }];
  }
}

/**
 * Specialized agent that focuses on a specific aspect of natural language processing
 */
class SpecializedAgent {
  private openAiApiKey: string;
  private agentType: string;
  private systemPrompt: string;
  
  constructor(openAiApiKey: string, agentType: string, systemPrompt: string) {
    this.openAiApiKey = openAiApiKey;
    this.agentType = agentType;
    this.systemPrompt = systemPrompt;
  }
  
  /**
   * Parse a command using this specialized agent
   */
  async parse(input: string): Promise<any> {
    try {
      // Modify system prompt to include 'json' word when using json_object response format
      let enhancedPrompt = this.systemPrompt;
      if (!enhancedPrompt.includes('json')) {
        enhancedPrompt = `${enhancedPrompt}\nRespond with a valid JSON object.`;
      }
      
      const requestBody = {
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: enhancedPrompt },
          { role: 'user', content: input }
        ],
        temperature: 0,
        response_format: { type: 'json_object' }
      };
      
      console.log(`${this.agentType} request:`, JSON.stringify(requestBody));
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openAiApiKey}`
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error(`OpenAI API error (${response.status}): ${errorData}`);
        throw new Error(`OpenAI API error: ${response.status}, Details: ${errorData}`);
      }
      
      const data = await response.json() as {
        choices: Array<{
          message: {
            content: string;
          }
        }>
      };
      const content = data.choices[0].message.content;
      
      try {
        return JSON.parse(content);
      } catch (error) {
        console.error(`Error parsing ${this.agentType} response:`, error);
        return null;
      }
    } catch (error) {
      console.error(`Error in ${this.agentType}:`, error);
      return null;
    }
  }
  
  /**
   * Detect a specific pattern or information using this specialized agent
   */
  async detect(input: string): Promise<any> {
    return this.parse(input);
  }
}

/**
 * Create an AI Agent Network
 */
export async function createAIAgentNetwork(
  openAiApiKey: string, 
  isTestEnvironment: boolean = false
): Promise<AIAgentNetwork> {
  return new AIAgentNetwork(openAiApiKey, isTestEnvironment);
} 