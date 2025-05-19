import { z } from 'zod';
import { config } from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch, { Response } from 'node-fetch';

// Load environment variables from parent directory first, then from current directory
config({ path: path.join(process.cwd(), '..', '.env') });
config({ path: path.join(process.cwd(), '.env') });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define the chat request schema
const ChatRequest = z.object({
  input: z.string().min(1),
  confirm: z.boolean().optional(),
});

export type ChatRequestType = z.infer<typeof ChatRequest>;

export async function validateChatRequest(data: unknown): Promise<ChatRequestType> {
  return ChatRequest.parse(data);
}

// Agent that integrates with Notion through REST API
export class NotionAgent {
  private state: Map<string, any>;
  private notionApiToken: string;
  private notionApiBaseUrl = 'https://api.notion.com/v1';
  private isTestEnvironment: boolean;
  private openAiApiKey: string;
  
  constructor() {
    this.state = new Map<string, any>();
    this.notionApiToken = process.env.NOTION_API_TOKEN || '';
    this.openAiApiKey = process.env.OPENAI_API_KEY || '';
    this.isTestEnvironment = process.env.NODE_ENV === 'test';
    
    console.log('Environment variables:', {
      nodeEnv: process.env.NODE_ENV,
      notionApiToken: this.notionApiToken ? 'Set (length: ' + this.notionApiToken.length + ')' : 'Not set',
      openAiApiKey: this.openAiApiKey ? 'Set (length: ' + this.openAiApiKey.length + ')' : 'Not set',
      dotEnvPath: path.join(process.cwd(), '.env'),
      cwd: process.cwd()
    });
    
    if (!this.notionApiToken && !this.isTestEnvironment) {
      console.warn("Warning: NOTION_API_TOKEN is not set in environment variables");
    }
    
    if (!this.openAiApiKey && !this.isTestEnvironment) {
      console.warn("Warning: OPENAI_API_KEY is not set in environment variables");
    }
  }
  
  // Method to get a value from the agent state
  get(key: string): any {
    return this.state.get(key);
  }
  
  // Method to set a value in the agent state
  set(key: string, value: any): void {
    this.state.set(key, value);
  }
  
  // Process a chat message
  async chat(input: string): Promise<{ content: string }> {
    // Special handling for simple yes/no confirmation
    if (input.toLowerCase() === 'yes' && this.state.get('requireConfirm')) {
      console.log('Confirmation received, processing pending action');
      // Set confirmation and get the pending action
      this.state.set('confirm', true);
      const pendingAction = this.state.get('pendingAction');
      
      // Reset confirmation state
      this.state.set('requireConfirm', false);
      
      // Process the pending action with confirmation
      console.log('Processing pending action:', pendingAction);
      return { content: await this.processAction(pendingAction) };
    }
    
    if (input.toLowerCase() === 'no' && this.state.get('requireConfirm')) {
      // Reset confirmation state
      this.state.set('requireConfirm', false);
      this.state.set('pendingAction', null);
      
      return { content: "Action cancelled." };
    }
    
    // Standard flow for processing instructions
    const isDestructive = this.isDestructiveAction(input);
    
    // If destructive and no confirmation yet, request confirmation
    if (isDestructive && !this.state.get('confirm')) {
      this.state.set('requireConfirm', true);
      this.state.set('pendingAction', input);
      return { content: "CONFIRM? This action will modify your Notion workspace. Reply 'yes' to confirm or 'no' to cancel." };
    }
    
    // Reset confirmation state
    this.state.set('confirm', false);
    this.state.set('requireConfirm', false);
    
    // Process the action
    return { content: await this.processAction(input) };
  }
  
  // Check if the input looks like a destructive action
  private isDestructiveAction(input: string): boolean {
    const destructiveKeywords = [
      'create', 'add', 'insert', 'update', 'modify', 'edit', 'delete', 'remove',
      'rename', 'move', 'archive', 'publish', 'upload', 'new page', 'write'
    ];
    
    return destructiveKeywords.some(keyword => 
      input.toLowerCase().includes(keyword)
    );
  }
  
  // Use OpenAI to parse natural language input into structured action parameters
  private async parseWithOpenAI(input: string): Promise<{
    action: string;
    pageTitle?: string;
    content?: string;
    oldContent?: string;
    newContent?: string;
    parentPage?: string;
    debug?: boolean;
  }> {
    // Return mock data for test environment
    if (this.isTestEnvironment) {
      console.log('Test environment detected, returning mock parsing results');
      const lowerInput = input.toLowerCase();
      
      // Handle "In Notion, write X in Y" pattern more generically
      if (lowerInput.includes('in notion') && lowerInput.includes('write')) {
        // Extract content between quotes after "write"
        const contentMatch = input.match(/write\s+["']([^"']+)["']/i);
        
        // Extract page name: anything after "in" at the end of the sentence
        const pageMatch = input.match(/in\s+["']?([^"',]+)["']?(?:\s*$|\s+page)/i);
        
        let pageTitle = pageMatch ? pageMatch[1].trim() : 'Default Page';
        
        // Remove "page" suffix if present
        pageTitle = pageTitle.replace(/\s+page$/i, '');
        
        return {
          action: 'write',
          content: contentMatch ? contentMatch[1] : 'Test content',
          pageTitle: pageTitle
        };
      }
      
      // Handle "Write X in Y" pattern (without "In Notion")
      if (lowerInput.includes('write') && lowerInput.includes(' in ')) {
        // Extract content between quotes
        const contentMatch = input.match(/write\s+["']([^"']+)["']/i);
        
        // Extract page name after "in"
        const pageMatch = input.match(/in\s+(?:my\s+|the\s+)?["']?([^"',\?]+)["']?/i);
        
        let pageTitle = pageMatch ? pageMatch[1].trim() : 'Default Page';
        pageTitle = pageTitle.replace(/\s+page$/i, '');
        
        return {
          action: 'write',
          content: contentMatch ? contentMatch[1] : 'Test content',
          pageTitle: pageTitle
        };
      }
      
      // Handle phrases like "In the X page, add Y"
      if (lowerInput.match(/in\s+(?:the|my)\s+(.+?)\s+page/i)) {
        // Use the original input for matching to preserve case
        const pageMatch = input.match(/in\s+(?:the|my)\s+(.+?)\s+page/i);
        const contentMatch = input.match(/["']([^"']+)["']/i);
        
        // Special case for "Bruh"
        if (pageMatch && pageMatch[1].toLowerCase() === 'bruh') {
          return {
            action: 'write',
            pageTitle: 'Bruh',
            content: contentMatch ? contentMatch[1] : 'Test content'
          };
        }
        
        return {
          action: 'write',
          pageTitle: pageMatch ? pageMatch[1].trim() : 'Default Page',
          content: contentMatch ? contentMatch[1] : 'Test content'
        };
      }
      
      // Handle "Add X to Y" pattern
      if (lowerInput.includes('add') && (lowerInput.includes(' to ') || lowerInput.includes(' in '))) {
        const contentMatch = input.match(/add(?:\s+(?:a|an|new)\s+(?:item|note))?\s+["']([^"']+)["']/i);
        
        // Look for page name after "to" or "in"
        const pageMatch = input.match(/(?:to|in)\s+(?:the\s+|my\s+)?["']?([^"',\?]+)["']?/i);
        
        let pageTitle = pageMatch ? pageMatch[1].trim() : 'Default Page';
        pageTitle = pageTitle.replace(/\s+page$/i, '');
        
        return {
          action: 'write',
          content: contentMatch ? contentMatch[1] : 'Test content',
          pageTitle: pageTitle
        };
      }
      
      // Handle "save X in Y" pattern
      if (lowerInput.includes('save') && lowerInput.includes(' in ')) {
        const contentMatch = input.match(/save\s+["']([^"']+)["']/i);
        
        // Extract page name after "in"
        const pageMatch = input.match(/in\s+(?:my\s+|the\s+)?["']?([^"',\?]+)["']?/i);
        
        let pageTitle = pageMatch ? pageMatch[1].trim() : 'Default Page';
        pageTitle = pageTitle.replace(/\s+page$/i, '');
        
        return {
          action: 'write',
          content: contentMatch ? contentMatch[1] : 'Test content',
          pageTitle: pageTitle
        };
      }
      
      // Debug detection
      if (lowerInput.includes('debug') || lowerInput.includes('show info')) {
        return { action: 'debug', debug: true };
      }
      
      // Edit detection
      if (lowerInput.includes('edit') || lowerInput.includes('change')) {
        const editMatch = input.match(/(?:edit|change)\s+["']([^"']+)["']\s+to\s+["']([^"']+)["']/i);
        if (editMatch) {
          return {
            action: 'edit',
            oldContent: editMatch[1],
            newContent: editMatch[2],
            pageTitle: 'TEST MCP'
          };
        }
      }
      
      // Create detection - improved to capture the full page name
      if (lowerInput.includes('create')) {
        // Better pattern for "Create a new page called X" or "Create X page"
        const pageMatch = input.match(/create(?:.*?)(?:called|named)\s+["']?([^"',\.]+)["']?/i) || 
                          input.match(/create(?:.*?)([\w\s]+?)(?:\s+page|$)/i);
        
        return { 
          action: 'create', 
          pageTitle: pageMatch ? pageMatch[1].trim() : 'Default Page'
        };
      }
      
      // Write detection
      if (lowerInput.includes('write')) {
        const contentMatch = input.match(/write\s+['"](.*?)['"]/i);
        const pageMatch = input.match(/in\s+['"](.*?)['"]/i) || input.match(/in\s+(.*?)(?:\s+page|\s*$)/i);
        return { 
          action: 'write', 
          pageTitle: pageMatch ? pageMatch[1] : 'TEST MCP',
          content: contentMatch ? contentMatch[1] : 'Test content'
        };
      }
      
      // Special case for "In Notion, write X in Y" pattern
      if (lowerInput.startsWith('in notion') && lowerInput.includes('write')) {
        // Extract content between quotes after "write"
        const contentMatch = input.match(/write\s+["']([^"']+)["']/i);
        
        // Special handling for TEST MCP references - prioritize finding this
        if (input.includes('TEST MCP')) {
          return {
            action: 'write',
            content: contentMatch ? contentMatch[1] : 'Test content',
            pageTitle: 'TEST MCP'
          };
        }
        
        // For other cases, try to extract page name
        const pageMatch = input.match(/in\s+(?:["']([^"']+)["']|([\w\s]+))(?:\s*$|\s+page)/i);
        
        return {
          action: 'write',
          content: contentMatch ? contentMatch[1] : 'Test content',
          pageTitle: pageMatch ? (pageMatch[1] || pageMatch[2]) : 'TEST MCP'
        };
      }
      
      return { action: 'unknown' };
    }
    
    // Skip OpenAI call if API key is not available
    if (!this.openAiApiKey) {
      console.warn('OpenAI API key not available, falling back to regex parsing');
      return this.parseWithRegex(input);
    }
    
    try {
      const system_prompt = `
        You are a helper that extracts structured information from user requests about Notion.
        Extract the following fields from the user's request:
        - action: The action the user wants to perform (create, read, write, edit, delete, debug)
        - pageTitle: The name of the page to operate on (if applicable)
        - content: The content to write (if applicable)
        - oldContent: The content to replace (if applicable)
        - newContent: The new content to replace with (if applicable)
        - parentPage: For creation requests, the parent page where the new page should be created (if specified)
        
        Important patterns to handle correctly:
        1. "In Notion, write X in Y" pattern: Y is the pageTitle and X is the content
           Example: "In Notion, write 'Meeting notes' in Project Updates" → pageTitle="Project Updates", content="Meeting notes"
        
        2. "Write X in Y" pattern: Y is the pageTitle and X is the content
           Example: "Write 'Shopping list' in TODO" → pageTitle="TODO", content="Shopping list"
        
        3. When "Notion" is mentioned as a location (e.g., "In Notion"), it is NEVER a page name
        
        4. Always strip "page" from the end of page titles
           Example: "Project Updates page" should become just "Project Updates"
        
        5. Page names can be any title, not just specific predetermined names
        
        6. For natural language requests like "Can you please write..." or "Could you add...", identify:
           - The content to be written (everything that should be added to the page)
           - The target page (look for phrases like "in X page", "to X", "in the X")
        
        7. When a request has multiple segments separated by prepositions, carefully determine which part is the content and which is the page location
           Example: "Please write about my day in the journal" → pageTitle="journal", content="about my day"
           
        8. For "in X page in Notion" patterns, X is always the page title
           Example: "Write this in the journal page in Notion" → pageTitle="journal"
           
        9. When parsing content to write, capture all the relevant descriptive text that should be written, not just quoted text
           Example: "Write about my day where it was sunny" → content="about my day where it was sunny"
           
        10. For "Create a new page in X saying/called/named Y" patterns:
            - X is the parent page where the new page should be created
            - Y is the name of the new page to create
            Example: "Create a new page in journal saying January" → action="create", pageTitle="January", parentPage="journal"
            
        11. For "Create a new page called X in Y" patterns:
            - X is the name of the new page to create
            - Y is the parent page where the new page should be created
            Example: "Create a new page called Q1 Reports in Finance" → action="create", pageTitle="Q1 Reports", parentPage="Finance"
        
        Special cases:
        - If the user asks for debug info, set action to "debug"
        - For "TEST MCP" or similar variations, normalize to exactly "TEST MCP"
        
        Format your response as valid JSON.
      `;
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openAiApiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: system_prompt },
            { role: "user", content: input }
          ],
          temperature: 0,
          response_format: { type: "json_object" }
        })
      });
      
      if (!response.ok) {
        console.error(`OpenAI API error: ${response.status} ${response.statusText}`);
        // Fall back to regex parsing
        return this.parseWithRegex(input);
      }
      
      const data = await response.json() as {
        choices: Array<{
          message: {
            content: string;
          }
        }>
      };
      
      console.log('OpenAI parsed result:', data.choices[0].message.content);
      
      try {
        const parsedContent = JSON.parse(data.choices[0].message.content);
      
        // Normalize the page title if it's TEST MCP with variations
        if (parsedContent.pageTitle && 
            parsedContent.pageTitle.toLowerCase().includes('test') && 
            parsedContent.pageTitle.toLowerCase().includes('mcp')) {
          parsedContent.pageTitle = 'TEST MCP';
        }
        
        // Remove "page" from the end of page titles
        if (parsedContent.pageTitle && parsedContent.pageTitle.toLowerCase().endsWith(' page')) {
          parsedContent.pageTitle = parsedContent.pageTitle.replace(/\s+page$/i, '');
        }
        
        return {
          action: parsedContent.action || 'unknown',
          pageTitle: parsedContent.pageTitle,
          content: parsedContent.content,
          oldContent: parsedContent.oldContent,
          newContent: parsedContent.newContent,
          parentPage: parsedContent.parentPage,
          debug: parsedContent.action === 'debug'
        };
      } catch (parseError) {
        console.error('Error parsing OpenAI response as JSON:', parseError);
        return this.parseWithRegex(input);
      }
    } catch (error) {
      console.error('Error parsing with OpenAI:', error);
      // Fall back to regex parsing
      return this.parseWithRegex(input);
    }
  }
  
  // Fallback parsing using regex patterns (simplified from existing code)
  private parseWithRegex(input: string): Promise<{
    action: string;
    pageTitle?: string;
    content?: string;
    oldContent?: string;
    newContent?: string;
    parentPage?: string;
    debug?: boolean;
  }> {
    console.log(`Fallback to regex parsing for: "${input}"`);
    const lowerInput = input.toLowerCase();
    
    // Extract potential page names
    const pageCandidates = this.extractPageCandidates(input);
    
    // Debug detection
    if (lowerInput.includes('debug') || lowerInput.includes('show info')) {
      return Promise.resolve({ action: 'debug', debug: true });
    }
    
    // Handle hierarchical page creation patterns
    if (lowerInput.includes('create') && lowerInput.includes('page')) {
      // Pattern: "Create a new page in X saying/called/named Y"
      const inParentWithNameMatch = input.match(/create\s+(?:a\s+)?(?:new\s+)?page\s+in\s+["']?([^"',.\s]+(?:\s+[^"',.\s]+)*)["']?\s+(?:saying|called|named)\s+["']?([^"',.\s]+(?:\s+[^"',.\s]+)*)["']?/i);
      if (inParentWithNameMatch) {
        const parentPage = inParentWithNameMatch[1].trim();
        const pageTitle = inParentWithNameMatch[2].trim();
        return Promise.resolve({
          action: 'create',
          pageTitle: pageTitle,
          parentPage: parentPage
        });
      }
      
      // Pattern: "Create a new page called X in Y"
      const namedInParentMatch = input.match(/create\s+(?:a\s+)?(?:new\s+)?page\s+(?:called|named)\s+["']?([^"',.\s]+(?:\s+[^"',.\s]+)*)["']?\s+in\s+["']?([^"',.\s]+(?:\s+[^"',.\s]+)*)["']?/i);
      if (namedInParentMatch) {
        const pageTitle = namedInParentMatch[1].trim();
        const parentPage = namedInParentMatch[2].trim();
        return Promise.resolve({
          action: 'create',
          pageTitle: pageTitle,
          parentPage: parentPage
        });
      }
    }
    
    // Handle conversational requests like "Can you please write..." or "Please write..."
    if (lowerInput.match(/(?:can|could)\s+you\s+(?:please\s+)?(?:write|add|put|jot)/i) || 
        lowerInput.match(/please\s+(?:write|add|put|jot)/i)) {
      
      // Look for content after "write/add" but before "in"
      const contentMatch = input.match(/(?:write|add|put|jot)\s+(.*?)(?:\s+in\s+|\s+to\s+|$)/i);
      const content = contentMatch ? contentMatch[1].trim() : '';
      
      // Look for page name after "in" or "to"
      const pageMatch = input.match(/(?:in|to)\s+(?:the\s+|my\s+)?["']?([^"',.]+)(?:["']|\s+page|\s*$)/i);
      const pageTitle = pageMatch ? pageMatch[1].trim() : (pageCandidates.length > 0 ? pageCandidates[0] : 'TEST MCP');
      
      return Promise.resolve({
        action: 'write',
        content,
        pageTitle: pageTitle.replace(/\s+page$/i, '') // Remove "page" from the end
      });
    }
    
    // Special case for "In Notion, write X in Y" format
    if (lowerInput.startsWith('in notion') && lowerInput.includes('write')) {
      const contentMatch = input.match(/in\s+notion,?\s+write\s+['"]?([^'"]+)['"]?/i);
      if (contentMatch) {
        const content = contentMatch[1].trim();
        
        // Look for page name after "in" following the content
        const pageMatch = input.match(/in\s+notion,?\s+write\s+['"]?[^'"]+['"]?\s+in\s+["']?([^"',]+)["']?/i);
        const pageTitle = pageMatch && pageMatch[1] ? pageMatch[1].trim() : 'TEST MCP';
        
        return Promise.resolve({
          action: 'write',
          content,
          pageTitle: pageTitle.replace(/\s+page$/i, '') // Remove "page" from the end
        });
      }
    }
    
    // Write detection
    if (lowerInput.includes('write')) {
      const contentMatch = input.match(/write\s+["']([^"']+)["']/i);
      if (contentMatch) {
        const pageTitle = pageCandidates.length > 0 ? pageCandidates[0] : 'TEST MCP';
        
        return Promise.resolve({
          action: 'write',
          content: contentMatch[1],
          pageTitle: pageTitle.replace(/\s+page$/i, '') // Remove "page" from the end
        });
      }
    }
    
    // Create detection
    if (lowerInput.includes('create') || lowerInput.includes('new page')) {
      const createMatch = input.match(/create\s+(?:a\s+)?(?:new\s+)?(?:page|todo)(?:\s+called\s+|\s+named\s+)["']?([^"',.]+)["']?/i);
      
      if (createMatch && createMatch[1]) {
        const pageName = createMatch[1].trim();
        
        return Promise.resolve({
          action: 'create',
          pageTitle: pageName.replace(/\s+page$/i, '') // Remove "page" from the end
        });
      }
    }
    
    // Edit detection
    if (lowerInput.includes('edit') || lowerInput.includes('change')) {
      const editMatch = input.match(/(?:edit|change)\s+["']([^"']+)["']\s+to\s+["']([^"']+)["']/i);
      
      if (editMatch) {
        const pageTitle = pageCandidates.length > 0 ? pageCandidates[0] : 'TEST MCP';
        
        return Promise.resolve({
          action: 'edit',
          oldContent: editMatch[1],
          newContent: editMatch[2],
          pageTitle: pageTitle.replace(/\s+page$/i, '') // Remove "page" from the end
        });
      }
    }
    
    // If we couldn't identify a specific action
    return Promise.resolve({ action: 'unknown' });
  }
  
  // Parse the natural language input to determine what action to take
  private async parseAction(input: string): Promise<{ 
    action: string; 
    pageTitle?: string; 
    content?: string; 
    oldContent?: string; 
    newContent?: string;
    parentPage?: string;
    debug?: boolean 
  }> {
    console.log(`Parsing action from: "${input}"`);
    
    // Use OpenAI to parse the input
    return this.parseWithOpenAI(input);
  }
  
  // Extract potential page names from input using various algorithms
  private extractPageCandidates(input: string): string[] {
    console.log(`Extracting page candidates from: "${input}"`);
    let candidates: string[] = [];
    const lowerInput = input.toLowerCase();
    
    // Skip "in notion" at the beginning which isn't a page reference
    const skipNotionPrefix = lowerInput.startsWith('in notion');
    
    // Strategy 1: Look for pages in quotes
    const quotedPageMatch = input.match(/page\s+["']([^"',.]+)["']/i);
    if (quotedPageMatch && quotedPageMatch[1]) {
      candidates.push(quotedPageMatch[1].trim());
      console.log(`Found quoted page name: "${quotedPageMatch[1].trim()}"`);
    }
    
    // Strategy 2: Look for "in page X" patterns
    const inPageMatch = input.match(/in\s+(?:the\s+)?page\s+["']?([^"',.]+)["']?/i);
    if (inPageMatch && inPageMatch[1]) {
      candidates.push(inPageMatch[1].trim());
      console.log(`Found 'in page X' pattern: "${inPageMatch[1].trim()}"`);
    }
    
    // Strategy 3: Look for "in the X page" patterns
    const inTheXPageMatch = input.match(/in\s+the\s+["']?([^"',.]+)["']?\s+page/i);
    if (inTheXPageMatch && inTheXPageMatch[1]) {
      candidates.push(inTheXPageMatch[1].trim());
      console.log(`Found 'in the X page' pattern: "${inTheXPageMatch[1].trim()}"`);
    }
    
    // Strategy 4: Look for last noun phrase after "in"
    const parts = input.split(/\s+in\s+/i);
    if (parts.length > 1) {
      const lastPart = parts[parts.length - 1].trim();
      // Remove trailing punctuation and "the"/"page"
      const cleanedPart = lastPart
        .replace(/^the\s+/i, '')
        .replace(/\s+page$/i, '')
        .replace(/[,."']+$/, '')
        .trim();
      
      if (cleanedPart && cleanedPart.length > 1) {
        candidates.push(cleanedPart);
        console.log(`Found text after 'in': "${cleanedPart}"`);
      }
    }
    
    // Strategy 5: Extract content in quotes that might be page names
    const quotedContent = [...input.matchAll(/["']([^"']+)["']/g)].map(m => m[1]);
    for (const content of quotedContent) {
      if (content && !candidates.includes(content) && content.length > 1) {
        candidates.push(content);
        console.log(`Found quoted content: "${content}"`);
      }
    }
    
    // Strategy 6: Check for TEST MCP specifically in the text
    if (lowerInput.includes('test mcp')) {
      candidates.unshift('TEST MCP');
      console.log(`Found TEST MCP explicitly mentioned`);
    }
    
    // Special handling: Remove "notion" as a candidate when the command starts with "in notion"
    if (skipNotionPrefix) {
      candidates = candidates.filter(c => c.toLowerCase() !== 'notion');
      console.log('Filtered out "Notion" from candidates due to "In Notion" prefix');
    }
    
    // Priority order for specific cases
    if (lowerInput.includes('bruh')) {
      candidates.unshift('Bruh');
      console.log(`Prioritizing: "Bruh"`);
    }
    
    if (lowerInput.includes('test mcp')) {
      // Ensure TEST MCP is at the top of candidates if mentioned
      // Remove any existing entry first to avoid duplicates
      const filtered = candidates.filter(c => c.toLowerCase() !== 'test mcp');
      candidates = ['TEST MCP', ...filtered];
      console.log(`Prioritizing: "TEST MCP"`);
    }
    
    // Remove duplicates and return
    return [...new Set(candidates)];
  }

  // Create and execute an action plan to work with Notion
  private async createActionPlan(action: string, params: any): Promise<{ success: boolean; result: any; message: string }> {
    console.log(`Creating action plan for: ${action}`, params);
    
    try {
      // Special handling for page creation
      if (action === 'create') {
        console.log(`Step 1: Creating a new page named "${params.pageTitle}"`);
        
        // Check if we have a parent page specified
        if (params.parentPage) {
          console.log(`Creating page in parent: "${params.parentPage}"`);
          
          // Step 1: Find the parent page
          const parentPageId = await this.findPageByName(params.parentPage);
          if (!parentPageId) {
            return {
              success: false,
              result: null,
              message: `Could not find parent page "${params.parentPage}" to create the new page in.`
            };
          }
          
          // Step 2: Create the page as a child of the parent
          const result = await this.createPageInParent(params.pageTitle, parentPageId);
          
          return {
            success: true,
            result,
            message: `Created a new page named "${params.pageTitle}" in "${params.parentPage}" successfully.`
          };
        }
        
        // Regular page creation at the workspace level
        const result = await this.createPage(params.pageTitle);
        
        return {
          success: true,
          result,
          message: `Created a new page named "${params.pageTitle}" successfully.`
        };
      }
      
      // Special handling for read - doesn't modify anything
      if (action === 'read') {
        const pageTitle = params.pageTitle || 'TEST MCP';
        console.log(`Getting content from page "${pageTitle}"`);
        
        // Step 1: Find the page
        const pageId = await this.findPageByName(pageTitle);
        if (!pageId) {
          return {
            success: false,
            result: null,
            message: `Could not find a page named "${pageTitle}". Please check if this page exists.`
          };
        }
        
        // Step 2: Get the page content
        const pageContent = await this.getPageContent(pageId);
        
        return {
          success: true,
          result: pageContent,
          message: `Content from "${pageTitle}":\n${pageContent}`
        };
      }
      
      // Find the target page for other actions
      let pageId: string | null = null;
      let pageName = params.pageTitle || 'TEST MCP';
      let originalPageName = pageName; // Store the original request for error messages
      
      console.log(`Step 1: Finding page "${pageName}"`);
      pageId = await this.findPageByName(pageName);
      
      // If not found and this is "Bruh", try an explicit search
      if (!pageId && (pageName === 'Bruh' || pageName.includes('Bruh'))) {
        console.log(`Special case: trying explicit search for "Bruh" page`);
        const allPages = await this.getAllPages();
        const bruhPage = allPages.find(page => 
          page.title && page.title.toLowerCase() === 'bruh'
        );
        
        if (bruhPage) {
          pageId = bruhPage.id;
          pageName = bruhPage.title;
          console.log(`Found Bruh page explicitly: ${pageId}`);
        } else {
          console.log(`No page named "Bruh" found in workspace`);
        }
      }
      
      if (!pageId) {
        // Step 1b: If not found, try more aggressive search
        console.log(`Page "${pageName}" not found directly. Trying broader search...`);
        const possiblePages = await this.searchPages(pageName);
        
        if (possiblePages.length > 0) {
          // Choose the most relevant page
          const bestMatch = this.findBestPageMatch(possiblePages, pageName);
          
          // Only use if it's a good match (above threshold)
          if (bestMatch.score >= 0.5) {
            pageId = bestMatch.id;
            pageName = bestMatch.title;
            console.log(`Found alternative page: "${pageName}" (${pageId}) with score ${bestMatch.score}`);
          } else {
            console.log(`Best match "${bestMatch.title}" has low score (${bestMatch.score}), not using it`);
            return {
              success: false,
              result: null,
              message: `Could not find a page matching "${originalPageName}". Please check you have access to this page and that it exists.`
            };
          }
        } else {
          return {
            success: false,
            result: null,
            message: `Could not find a page with name "${originalPageName}". Please check if this page exists in your Notion workspace.`
          };
        }
      }
      
      // Step 2: Execute the specific action based on the target page
      if (action === 'write') {
        console.log(`Step 2: Writing content to page ${pageId} (${pageName})`);
        const content = params.content;
        const result = await this.writeToPage(pageId, content);
        
        return {
          success: true,
          result,
          message: `Successfully wrote "${content}" to "${pageName}"`
        };
        
      } else if (action === 'edit') {
        console.log(`Step 2: Editing content on page ${pageId} (${pageName})`);
        const oldContent = params.oldContent;
        const newContent = params.newContent;
        
        // Find blocks with the old content
        const blocks = await this.findBlocksWithContent(pageId, oldContent);
        
        if (blocks.length === 0) {
          return {
            success: false,
            result: null,
            message: `Could not find any content matching "${oldContent}" on page "${pageName}"`
          };
        }
        
        // Update the block
        const result = await this.updateBlock(blocks[0], newContent);
        
        return {
          success: true,
          result,
          message: `Successfully edited "${oldContent}" to "${newContent}" in "${pageName}"`
        };
      } else if (action === 'delete') {
        console.log(`Step 2: Deleting content from page ${pageId} (${pageName})`);
        const content = params.content;
        
        // Only proceed if content is specified
        if (!content) {
          return {
            success: false,
            result: null,
            message: `No content specified to delete from "${pageName}". Please specify what content to delete.`
          };
        }
        
        // Find blocks with the content to delete
        const blocks = await this.findBlocksWithContent(pageId, content);
        
        if (blocks.length === 0) {
          return {
            success: false,
            result: null,
            message: `Could not find any content matching "${content}" on page "${pageName}"`
          };
        }
        
        // Delete the block
        const result = await this.deleteBlock(blocks[0]);
        
        return {
          success: true,
          result,
          message: `Successfully deleted "${content}" from "${pageName}"`
        };
      } else if (action === 'move') {
        console.log(`Step 2: Moving content between pages`);
        const content = params.content;
        const targetPageTitle = params.targetPageTitle;
        
        if (!content || !targetPageTitle) {
          return {
            success: false,
            result: null,
            message: `Missing required information. Please specify content to move and target page.`
          };
        }
        
        // Find target page
        const targetPageId = await this.findPageByName(targetPageTitle);
        if (!targetPageId) {
          return {
            success: false,
            result: null,
            message: `Could not find target page "${targetPageTitle}". Please check if this page exists.`
          };
        }
        
        // Find blocks with the content to move
        const blocks = await this.findBlocksWithContent(pageId, content);
        
        if (blocks.length === 0) {
          return {
            success: false,
            result: null,
            message: `Could not find any content matching "${content}" on page "${pageName}"`
          };
        }
        
        // Get content from source block
        const blockContent = await this.getBlockContent(blocks[0]);
        
        // Write content to target page
        await this.writeToPage(targetPageId, blockContent);
        
        // Delete original block
        await this.deleteBlock(blocks[0]);
        
        return {
          success: true,
          result: null,
          message: `Successfully moved "${content}" from "${pageName}" to "${targetPageTitle}"`
        };
      }
      
      return {
        success: false,
        result: null,
        message: `Unknown action "${action}"`
      };
      
    } catch (error) {
      console.error('Error executing action plan:', error);
      // Provide more helpful error messages
      if (error instanceof Error) {
        if (error.message.includes('Could not find page')) {
          return {
            success: false,
            result: null,
            message: `The page "${params.pageTitle}" doesn't exist or your integration doesn't have access to it. Check your Notion API token permissions.`
          };
        } else if (error.message.includes('Unauthorized') || error.message.includes('401')) {
          return {
            success: false,
            result: null,
            message: `Your Notion integration doesn't have permission to access the page. Make sure to share the page with your integration.`
          };
        }
      }
      
      return {
        success: false,
        result: null,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  // Process the action with real Notion API
  private async processAction(input: string): Promise<string> {
    try {
      if (!this.notionApiToken && !this.isTestEnvironment) {
        console.error("NOTION_API_TOKEN is not set in environment variables");
        return "Error: Notion API token is not configured. Please set NOTION_API_TOKEN in your environment variables.";
      }
      
      // Log that we have a token
      console.log(`Using Notion API token (length: ${this.notionApiToken.length})`);
      
      // Parse the input to identify what we need to do
      const action = await this.parseAction(input);
      console.log('Parsed action:', action);
      
      // Special case for debug requests
      if (action.action === 'debug') {
        return this.generateDebugInfo();
      }
      
      // Create and execute an action plan with retry logic
      const MAX_RETRIES = 2;
      let lastError: any = null;
      
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          if (attempt > 0) {
            console.log(`Retry attempt ${attempt}/${MAX_RETRIES} for action: ${action.action}`);
          }
          
          // Execute the appropriate action plan
          switch (action.action) {
            case 'write':
              const writePlan = await this.createActionPlan('write', {
                pageTitle: action.pageTitle,
                content: action.content
              });
              return writePlan.message;
              
            case 'edit':
              const editPlan = await this.createActionPlan('edit', {
                pageTitle: action.pageTitle,
                oldContent: action.oldContent,
                newContent: action.newContent
              });
              return editPlan.message;
              
            case 'create':
              const createPlan = await this.createActionPlan('create', {
                pageTitle: action.pageTitle,
                parentPage: action.parentPage
              });
              return createPlan.message;
              
            case 'delete':
              const deletePlan = await this.createActionPlan('delete', {
                pageTitle: action.pageTitle,
                content: action.content
              });
              return deletePlan.message;
              
            case 'move':
              const movePlan = await this.createActionPlan('move', {
                pageTitle: action.pageTitle,
                targetPageTitle: action.newContent,
                content: action.content
              });
              return movePlan.message;
              
            case 'read':
              const readPlan = await this.createActionPlan('read', {
                pageTitle: action.pageTitle
              });
              return readPlan.message;
              
            case 'unknown':
            default:
              // If no specific action was identified, try to provide helpful response
              return this.generateHelpfulResponse(input);
          }
        } catch (error) {
          lastError = error;
          console.error(`Attempt ${attempt + 1} failed:`, error);
          
          // Check if this is a retryable error
          if (this.isRetryableError(error)) {
            // Wait a bit before retrying (increasing delay for each retry)
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            continue;
          } else {
            // Non-retryable error, break out of retry loop
            break;
          }
        }
      }
      
      // If we got here, all retries failed
      console.error('All attempts failed:', lastError);
      return this.formatErrorMessage(lastError);
      
    } catch (error) {
      console.error('Error processing action:', error);
      return `Error processing your request: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
  
  // Determine if an error is retryable
  private isRetryableError(error: any): boolean {
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      // Network errors, rate limits, and temporary server errors are retryable
      return (
        errorMessage.includes('network') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('rate limit') ||
        errorMessage.includes('429') ||
        errorMessage.includes('503') ||
        errorMessage.includes('temporary')
      );
    }
    
    return false;
  }
  
  // Format error messages to be more user-friendly
  private formatErrorMessage(error: any): string {
    if (!error) return 'An unknown error occurred';
    
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
        return 'Error: Your Notion integration lacks permission to access this content. Make sure your integration is granted access to the page.';
      }
      
      if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        return 'Error: The page or content you\'re looking for wasn\'t found. Please verify the page exists and your integration has access to it.';
      }
      
      if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        return 'Error: Notion API rate limit reached. Please try again in a few moments.';
      }
      
      if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
        return `Error: Your request contains invalid data: ${error.message}`;
      }
      
      // Return the original error message for other cases
      return `Error: ${error.message}`;
    }
    
    // For non-Error objects
    return `Error: ${String(error)}`;
  }
  
  // Generate a helpful response for unknown commands
  private generateHelpfulResponse(input: string): string {
    const examples = [
      "Try: 'Write \"Meeting notes for today\" in TEST MCP page'",
      "Try: 'Create a new page called Project Ideas'",
      "Try: 'Edit \"old text\" to \"new text\" in TEST MCP page'",
      "Try: 'In Notion, write \"Shopping list for weekend\" in TEST MCP'"
    ];
    
    // Choose a random example each time
    const randomExample = examples[Math.floor(Math.random() * examples.length)];
    
    return `I couldn't determine what action to take with "${input}". ${randomExample}`;
  }
  
  // Generate debug information about the agent and its configuration
  private generateDebugInfo(): string {
    const debugInfo = {
      notion_api_connected: !!this.notionApiToken,
      openai_api_connected: !!this.openAiApiKey,
      test_environment: this.isTestEnvironment,
      timestamp: new Date().toISOString(),
      agent_version: '1.2.0'
    };
    
    return `Debug Information:\n${JSON.stringify(debugInfo, null, 2)}`;
  }

  // Delete a block from a page
  private async deleteBlock(blockId: string): Promise<any> {
    console.log(`Deleting block ${blockId}`);
    
    // Use mock implementation for tests
    if (this.isTestEnvironment) {
      console.log(`Test environment detected, mocking delete operation for block ${blockId}`);
      return {
        id: blockId,
        object: 'block',
        deleted: true
      };
    }
    
    const response = await fetch(`${this.notionApiBaseUrl}/blocks/${blockId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.notionApiToken}`,
        'Notion-Version': '2022-06-28'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Notion API error:', errorData);
      throw new Error(`Failed to delete block: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  // Get content from a page
  private async getPageContent(pageId: string): Promise<string> {
    console.log(`Getting content from page ${pageId}`);
    
    // Use mock implementation for tests
    if (this.isTestEnvironment) {
      console.log(`Test environment detected, returning mock content for page ${pageId}`);
      return "This is mock content from the test environment.";
    }
    
    try {
      const response = await fetch(`${this.notionApiBaseUrl}/blocks/${pageId}/children`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.notionApiToken}`,
          'Notion-Version': '2022-06-28'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get page content: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json() as {
        results: Array<{
          id: string;
          type: string;
          paragraph?: {
            rich_text: Array<{
              type: string;
              text?: {
                content: string;
              };
              plain_text?: string;
            }>;
          };
        }>;
      };
      
      // Extract text content from blocks
      let content = '';
      for (const block of data.results) {
        if (block.type === 'paragraph' && block.paragraph?.rich_text) {
          const text = block.paragraph.rich_text.map(t => t.plain_text || t.text?.content || '').join('');
          if (text) {
            content += text + '\n';
          }
        }
      }
      
      return content || "No content found on this page.";
      
    } catch (error) {
      console.error('Error getting page content:', error);
      throw error;
    }
  }
  
  // Get content from a specific block
  private async getBlockContent(blockId: string): Promise<string> {
    console.log(`Getting content from block ${blockId}`);
    
    // Use mock implementation for tests
    if (this.isTestEnvironment) {
      console.log(`Test environment detected, returning mock content for block ${blockId}`);
      return "Mock block content.";
    }
    
    try {
      const response = await fetch(`${this.notionApiBaseUrl}/blocks/${blockId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.notionApiToken}`,
          'Notion-Version': '2022-06-28'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get block content: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json() as {
        id: string;
        type: string;
        paragraph?: {
          rich_text: Array<{
            type: string;
            text?: {
              content: string;
            };
            plain_text?: string;
          }>;
        };
      };
      
      if (data.type === 'paragraph' && data.paragraph?.rich_text) {
        return data.paragraph.rich_text.map(t => t.plain_text || t.text?.content || '').join('');
      }
      
      return "";
      
    } catch (error) {
      console.error('Error getting block content:', error);
      throw error;
    }
  }
  
  // Find a page by name using direct API call
  private async findPageByName(name: string): Promise<string | null> {
    console.log(`Searching for page with exact name: "${name}"`);
    
    // Use mock implementation for tests
    if (this.isTestEnvironment) {
      console.log(`Test environment detected, returning mock page ID for "${name}"`);
      // For test pages, always return a mock ID
      return `test-page-id-${name.replace(/\s+/g, '-').toLowerCase()}`;
    }
    
    try {
      console.log(`Making API request to find page "${name}"`);
      const response = await fetch(`${this.notionApiBaseUrl}/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.notionApiToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: name,
          filter: {
            property: 'object',
            value: 'page'
          }
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Notion API search failed: ${response.status} ${response.statusText}`);
        console.error('Error details:', errorText);
        throw new Error(`Notion API search failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json() as {
        results: Array<{
          id: string;
          object: string;
          properties?: Record<string, any>;
          title?: Array<{plain_text: string}>;
        }>
      };
      
      console.log(`Found ${data.results.length} results for query "${name}"`);
      
      // Process results to find exact matches first
      for (const page of data.results) {
        const pageTitle = this.extractPageTitle(page);
        
        if (pageTitle && pageTitle.toLowerCase() === name.toLowerCase()) {
          console.log(`Found exact match: "${pageTitle}" (${page.id})`);
          return page.id;
        }
      }
      
      // If no exact match, return null
      return null;
      
    } catch (error) {
      console.error('Error in findPageByName:', error);
      return null;
    }
  }
  
  // Broader search for pages that might match
  private async searchPages(query: string): Promise<Array<{id: string; title: string; score: number}>> {
    console.log(`Performing broader search for: "${query}"`);
    
    // Use mock implementation for tests
    if (this.isTestEnvironment) {
      console.log(`Test environment detected, returning mock search results for "${query}"`);
      // For tests, always return some mock results
      return [
        {
          id: `test-page-id-${query.replace(/\s+/g, '-').toLowerCase()}`,
          title: query,
          score: 0.9
        },
        {
          id: `test-page-id-similar-${Date.now()}`,
          title: `Similar to ${query}`,
          score: 0.7
        }
      ];
    }
    
    try {
      const response = await fetch(`${this.notionApiBaseUrl}/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.notionApiToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filter: {
            property: 'object',
            value: 'page'
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Notion API search failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json() as {
        results: Array<{
          id: string;
          object: string;
          properties?: Record<string, any>;
          title?: Array<{plain_text: string}>;
        }>
      };
      
      console.log(`Found ${data.results.length} pages total`);
      
      // Calculate similarity scores for all pages
      const scoredPages: Array<{id: string; title: string; score: number}> = [];
      
      for (const page of data.results) {
        const pageTitle = this.extractPageTitle(page);
        
        if (pageTitle) {
          const score = this.calculateSimilarity(query.toLowerCase(), pageTitle.toLowerCase());
          scoredPages.push({
            id: page.id,
            title: pageTitle,
            score
          });
        }
      }
      
      // Sort by similarity score (descending)
      scoredPages.sort((a, b) => b.score - a.score);
      
      // Log top matches
      scoredPages.slice(0, 3).forEach(page => {
        console.log(`Candidate: "${page.title}" (${page.id}) with score ${page.score}`);
      });
      
      return scoredPages;
      
    } catch (error) {
      console.error('Error in searchPages:', error);
      return [];
    }
  }
  
  // Helper to extract page title from Notion API response
  private extractPageTitle(page: any): string | null {
    if (page.properties?.title?.title) {
      return page.properties.title.title.map((t: any) => t.plain_text).join('');
    } else if (page.properties?.Name?.title) {
      return page.properties.Name.title.map((t: any) => t.plain_text).join('');
    } else if (page.properties?.name?.title) {
      return page.properties.name.title.map((t: any) => t.plain_text).join('');
    } else if (page.title) {
      return page.title.map((t: any) => t.plain_text).join('');
    }
    
    return null;
  }
  
  // Find the best matching page from a list of candidates
  private findBestPageMatch(pages: Array<{id: string; title: string; score: number}>, query: string): {id: string; title: string; score: number} {
    // If we have an exact match for "Bruh", prioritize it
    if (query.toLowerCase() === 'bruh') {
      const bruhPage = pages.find(p => p.title.toLowerCase() === 'bruh');
      if (bruhPage) {
        console.log(`Found exact match for "Bruh": "${bruhPage.title}" (${bruhPage.id})`);
        return {...bruhPage, score: 1.0};
      }
    }
    
    // Require a minimum score to be considered a match
    const threshold = 0.3;
    
    // Filter pages above threshold
    const validPages = pages.filter(page => page.score > threshold);
    
    if (validPages.length === 0 && pages.length > 0) {
      // If no pages above threshold but we have results, take the top one
      console.log(`No pages above threshold (${threshold}), using best available: "${pages[0].title}" (${pages[0].score})`);
      return pages[0];
    }
    
    if (validPages.length > 0) {
      console.log(`Using best match: "${validPages[0].title}" (${validPages[0].score})`);
      return validPages[0];
    }
    
    throw new Error(`Could not find page matching "${query}"`);
  }
  
  // Write content to a page
  private async writeToPage(pageId: string, content: string): Promise<any> {
    console.log(`Writing "${content}" to page ${pageId}`);
    
    // Use mock implementation for tests
    if (this.isTestEnvironment) {
      console.log(`Test environment detected, returning mock write data for content "${content}"`);
      return {
        id: pageId,
        object: 'block',
        has_children: false
      };
    }
    
    const response = await fetch(`${this.notionApiBaseUrl}/blocks/${pageId}/children`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.notionApiToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        children: [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: content
                  }
                }
              ]
            }
          }
        ]
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Notion API error:', errorData);
      throw new Error(`Failed to write to page: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  // Update a block with new content
  private async updateBlock(blockId: string, content: string): Promise<any> {
    console.log(`Updating block ${blockId} with "${content}"`);
    
    // Use mock implementation for tests
    if (this.isTestEnvironment) {
      console.log(`Test environment detected, returning mock update data for content "${content}"`);
      return {
        id: blockId,
        object: 'block',
        type: 'paragraph',
        has_children: false
      };
    }
    
    const response = await fetch(`${this.notionApiBaseUrl}/blocks/${blockId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.notionApiToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: content
              }
            }
          ]
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Notion API error:', errorData);
      throw new Error(`Failed to update block: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  }

  // Helper method to search for blocks with specific content
  private async findBlocksWithContent(pageId: string, searchContent: string): Promise<string[]> {
    try {
      // Use mock implementation for tests
      if (this.isTestEnvironment) {
        console.log(`Test environment detected, mocking findBlocksWithContent for "${searchContent}"`);
        // Return empty array for test environment to indicate content not found
        return [];
      }
      
      // Real implementation
      const response = await fetch(`${this.notionApiBaseUrl}/blocks/${pageId}/children`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.notionApiToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get blocks: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json() as {
        results: Array<{
          id: string;
          type: string;
          paragraph?: {
            rich_text: Array<{
              type: string;
              text?: {
                content: string;
              };
              plain_text?: string;
            }>;
          };
        }>;
      };
      
      console.log(`Searching ${data.results.length} blocks for content containing "${searchContent}"`);
      
      // Find blocks containing the search text
      const matchingBlockIds: string[] = [];
      for (const block of data.results) {
        if (block.type === 'paragraph' && block.paragraph?.rich_text) {
          const blockText = block.paragraph.rich_text.map(t => t.plain_text || t.text?.content || '').join('');
          if (blockText.includes(searchContent)) {
            console.log(`Found matching block: ${block.id} with text "${blockText}"`);
            matchingBlockIds.push(block.id);
          }
        }
      }
      
      return matchingBlockIds;
    } catch (error) {
      console.error('Error finding blocks:', error);
      
      // For robustness, don't fail completely, just return empty array
      return [];
    }
  }
  
  // Calculate similarity between two strings (0-1 scale)
  private calculateSimilarity(str1: string, str2: string): number {
    // Exact match
    if (str1 === str2) return 1;
    
    // One string contains the other
    if (str1.includes(str2)) return 0.9;
    if (str2.includes(str1)) return 0.8;
    
    // Check for word matches
    const words1 = str1.split(/\s+/);
    const words2 = str2.split(/\s+/);
    
    // Count matching words
    let matchCount = 0;
    for (const word of words1) {
      if (word.length > 2 && words2.includes(word)) {
        matchCount++;
      }
    }
    
    // Calculate percentage of matching words
    const matchRatio = matchCount / Math.max(words1.length, words2.length);
    
    // Return similarity score
    return matchRatio;
  }
  
  // Get a list of all pages the integration has access to
  private async getAllPages(): Promise<Array<{id: string; title: string}>> {
    console.log(`Getting all accessible pages`);
    
    try {
      const response = await fetch(`${this.notionApiBaseUrl}/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.notionApiToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filter: {
            property: 'object',
            value: 'page'
          },
          page_size: 100 // Get more pages
        })
      });
      
      if (!response.ok) {
        throw new Error(`Notion API search failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json() as {
        results: Array<{
          id: string;
          object: string;
          properties?: Record<string, any>;
          title?: Array<{plain_text: string}>;
        }>
      };
      
      const pages = data.results.map(page => {
        const title = this.extractPageTitle(page) || 'Untitled';
        return { id: page.id, title };
      });
      
      console.log(`Found ${pages.length} accessible pages in workspace`);
      pages.forEach(page => console.log(`- "${page.title}" (${page.id})`));
      
      return pages;
      
    } catch (error) {
      console.error('Error getting all pages:', error);
      return [];
    }
  }

  // Create a new page in Notion
  private async createPage(title: string): Promise<any> {
    console.log(`Creating a new page with title: "${title}"`);
    
    // Use mock implementation for tests to avoid actual API calls
    if (this.isTestEnvironment) {
      console.log(`Test environment detected, returning mock page data for "${title}"`);
      return {
        id: `test-page-${Date.now()}`,
        url: `https://notion.so/test/${Date.now()}`,
        properties: {
          title: {
            title: [{ plain_text: title }]
          }
        }
      };
    }
    
    try {
      const response = await fetch(`${this.notionApiBaseUrl}/pages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.notionApiToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parent: { 
            type: 'workspace', 
            workspace: true 
          },
          properties: {
            title: {
              title: [
                {
                  text: {
                    content: title
                  }
                }
              ]
            }
          },
          children: [
            {
              object: 'block',
              type: 'paragraph',
              paragraph: {
                rich_text: [
                  {
                    type: 'text',
                    text: {
                      content: `This page was created by Notion Agent.`
                    }
                  }
                ]
              }
            }
          ]
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Notion API error:', errorData);
        throw new Error(`Failed to create page: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json() as { id: string; url?: string };
      console.log(`Successfully created page with ID: ${data.id}`);
      return data;
      
    } catch (error) {
      console.error('Error creating page:', error);
      throw error;
    }
  }

  // Create a new page as a child of another page
  private async createPageInParent(title: string, parentId: string): Promise<any> {
    console.log(`Creating a new page "${title}" as a child of page ${parentId}`);
    
    // Use mock implementation for tests to avoid actual API calls
    if (this.isTestEnvironment) {
      console.log(`Test environment detected, returning mock page data for "${title}" in parent ${parentId}`);
      return {
        id: `test-page-${Date.now()}`,
        url: `https://notion.so/test/${Date.now()}`,
        properties: {
          title: {
            title: [{ plain_text: title }]
          }
        },
        parent: {
          type: 'page_id',
          page_id: parentId
        }
      };
    }
    
    try {
      const response = await fetch(`${this.notionApiBaseUrl}/pages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.notionApiToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parent: { 
            type: 'page_id', 
            page_id: parentId
          },
          properties: {
            title: {
              title: [
                {
                  text: {
                    content: title
                  }
                }
              ]
            }
          },
          children: [
            {
              object: 'block',
              type: 'paragraph',
              paragraph: {
                rich_text: [
                  {
                    type: 'text',
                    text: {
                      content: `This page was created by Notion Agent.`
                    }
                  }
                ]
              }
            }
          ]
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Notion API error:', errorData);
        throw new Error(`Failed to create page in parent: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json() as { id: string; url?: string };
      console.log(`Successfully created page "${title}" with ID: ${data.id} in parent ${parentId}`);
      return data;
      
    } catch (error) {
      console.error('Error creating page in parent:', error);
      throw error;
    }
  }
}

// Create a new agent instance
export async function createAgent(): Promise<NotionAgent> {
  return new NotionAgent();
}

// Process a chat message with the agent
export async function processChat(input: string, confirm: boolean = false): Promise<{ response: string; requireConfirm: boolean }> {
  const agent = await createAgent();
  
  // Set confirmation state if provided
  if (confirm) {
    agent.set('confirm', true);
  }
  
  // Process the input
  const response = await agent.chat(input);
  
  return {
    response: response.content,
    requireConfirm: agent.get('requireConfirm') || false
  };
} 