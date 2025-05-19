import { z } from 'zod';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Define the chat request schema
const ChatRequest = z.object({
    input: z.string().min(1),
    confirm: z.boolean().optional(),
});
export async function validateChatRequest(data) {
    return ChatRequest.parse(data);
}
// Agent that integrates with Notion through REST API
export class NotionAgent {
    state;
    notionApiToken;
    notionApiBaseUrl = 'https://api.notion.com/v1';
    constructor() {
        this.state = new Map();
        this.notionApiToken = process.env.NOTION_API_TOKEN || '';
        if (!this.notionApiToken) {
            console.warn("Warning: NOTION_API_TOKEN is not set in environment variables");
        }
    }
    // Method to get a value from the agent state
    get(key) {
        return this.state.get(key);
    }
    // Method to set a value in the agent state
    set(key, value) {
        this.state.set(key, value);
    }
    // Process a chat message
    async chat(input) {
        // Check if a destructive action is detected in the input
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
    isDestructiveAction(input) {
        const destructiveKeywords = [
            'create', 'add', 'insert', 'update', 'modify', 'edit', 'delete', 'remove',
            'rename', 'move', 'archive', 'publish', 'upload', 'new page', 'write'
        ];
        return destructiveKeywords.some(keyword => input.toLowerCase().includes(keyword));
    }
    // Parse the natural language input to determine what action to take
    parseAction(input) {
        const lowerInput = input.toLowerCase();
        console.log(`Parsing action from: "${input}"`);
        // First, extract potential page names
        const pageCandidates = this.extractPageCandidates(input);
        console.log(`Extracted page candidates: ${JSON.stringify(pageCandidates)}`);
        // Edit detection
        if (lowerInput.includes('edit')) {
            // Try to match quoted content
            let match = input.match(/edit\s+["']([^"']+)["']\s+to\s+["']([^"']+)["']/i);
            // If no match with quotes, try without quotes
            if (!match) {
                match = input.match(/edit\s+(.+?)\s+to\s+(.+?)(?:\s+in\s+|$)/i);
            }
            if (match) {
                return {
                    action: 'edit',
                    oldContent: match[1],
                    newContent: match[2],
                    pageTitle: pageCandidates.length > 0 ? pageCandidates[0] : 'TEST MCP'
                };
            }
        }
        // Write detection with more flexibility
        if (lowerInput.includes('write')) {
            // Try with quotes
            let match = input.match(/write\s+["']([^"']+)["']/i);
            let content = '';
            // If no quotes, try to extract content between "write" and "in"
            if (!match) {
                const writeIndex = lowerInput.indexOf('write');
                if (writeIndex >= 0) {
                    const afterWrite = input.substring(writeIndex + 5).trim();
                    // Find "in" after "write"
                    const inIndex = afterWrite.toLowerCase().indexOf(' in ');
                    if (inIndex >= 0) {
                        content = afterWrite.substring(0, inIndex).trim();
                    }
                    else {
                        content = afterWrite;
                    }
                }
            }
            else {
                content = match[1];
            }
            if (content) {
                return {
                    action: 'write',
                    content: content,
                    pageTitle: pageCandidates.length > 0 ? pageCandidates[0] : 'TEST MCP'
                };
            }
        }
        // Default action if we can't detect anything specific
        return { action: 'unknown' };
    }
    // Extract potential page names from input using various algorithms
    extractPageCandidates(input) {
        console.log(`Extracting page candidates from: "${input}"`);
        const candidates = [];
        const lowerInput = input.toLowerCase();
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
        // Priority order for specific cases
        if (lowerInput.includes('bruh')) {
            candidates.unshift('Bruh');
            console.log(`Prioritizing: "Bruh"`);
        }
        if (lowerInput.includes('test mcp')) {
            candidates.unshift('TEST MCP');
            console.log(`Prioritizing: "TEST MCP"`);
        }
        // Remove duplicates and return
        return [...new Set(candidates)];
    }
    // Create and execute an action plan to work with Notion
    async createActionPlan(action, params) {
        console.log(`Creating action plan for: ${action}`, params);
        try {
            // Step 1: Find the target page
            let pageId = null;
            let pageName = params.pageTitle || 'TEST MCP';
            let originalPageName = pageName; // Store the original request for error messages
            console.log(`Step 1: Finding page "${pageName}"`);
            pageId = await this.findPageByName(pageName);
            // If not found and this is "Bruh", try an explicit search
            if (!pageId && (pageName === 'Bruh' || pageName.includes('Bruh'))) {
                console.log(`Special case: trying explicit search for "Bruh" page`);
                const allPages = await this.getAllPages();
                const bruhPage = allPages.find(page => page.title && page.title.toLowerCase() === 'bruh');
                if (bruhPage) {
                    pageId = bruhPage.id;
                    pageName = bruhPage.title;
                    console.log(`Found Bruh page explicitly: ${pageId}`);
                }
                else {
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
                    }
                    else {
                        console.log(`Best match "${bestMatch.title}" has low score (${bestMatch.score}), not using it`);
                        return {
                            success: false,
                            result: null,
                            message: `Could not find a page matching "${originalPageName}". Please check you have access to this page and that it exists.`
                        };
                    }
                }
                else {
                    return {
                        success: false,
                        result: null,
                        message: `Could not find a page with name "${originalPageName}". Please check if this page exists in your Notion workspace.`
                    };
                }
            }
            // Step 2: Execute the specific action
            if (action === 'write') {
                console.log(`Step 2: Writing content to page ${pageId} (${pageName})`);
                const content = params.content;
                const result = await this.writeToPage(pageId, content);
                return {
                    success: true,
                    result,
                    message: `Successfully wrote "${content}" to "${pageName}"`
                };
            }
            else if (action === 'edit') {
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
            }
            return {
                success: false,
                result: null,
                message: `Unknown action "${action}"`
            };
        }
        catch (error) {
            console.error('Error executing action plan:', error);
            // Provide more helpful error messages
            if (error instanceof Error) {
                if (error.message.includes('Could not find page')) {
                    return {
                        success: false,
                        result: null,
                        message: `The page "${params.pageTitle}" doesn't exist or your integration doesn't have access to it. Check your Notion API token permissions.`
                    };
                }
                else if (error.message.includes('Unauthorized') || error.message.includes('401')) {
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
    // Find a page by name using direct API call
    async findPageByName(name) {
        console.log(`Searching for page with exact name: "${name}"`);
        try {
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
                throw new Error(`Notion API search failed: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
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
        }
        catch (error) {
            console.error('Error in findPageByName:', error);
            return null;
        }
    }
    // Broader search for pages that might match
    async searchPages(query) {
        console.log(`Performing broader search for: "${query}"`);
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
            const data = await response.json();
            console.log(`Found ${data.results.length} pages total`);
            // Calculate similarity scores for all pages
            const scoredPages = [];
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
        }
        catch (error) {
            console.error('Error in searchPages:', error);
            return [];
        }
    }
    // Helper to extract page title from Notion API response
    extractPageTitle(page) {
        if (page.properties?.title?.title) {
            return page.properties.title.title.map((t) => t.plain_text).join('');
        }
        else if (page.properties?.Name?.title) {
            return page.properties.Name.title.map((t) => t.plain_text).join('');
        }
        else if (page.properties?.name?.title) {
            return page.properties.name.title.map((t) => t.plain_text).join('');
        }
        else if (page.title) {
            return page.title.map((t) => t.plain_text).join('');
        }
        return null;
    }
    // Find the best matching page from a list of candidates
    findBestPageMatch(pages, query) {
        // If we have an exact match for "Bruh", prioritize it
        if (query.toLowerCase() === 'bruh') {
            const bruhPage = pages.find(p => p.title.toLowerCase() === 'bruh');
            if (bruhPage) {
                console.log(`Found exact match for "Bruh": "${bruhPage.title}" (${bruhPage.id})`);
                return { ...bruhPage, score: 1.0 };
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
    async writeToPage(pageId, content) {
        console.log(`Writing "${content}" to page ${pageId}`);
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
    async updateBlock(blockId, content) {
        console.log(`Updating block ${blockId} with "${content}"`);
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
    async findBlocksWithContent(pageId, searchContent) {
        try {
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
            const data = await response.json();
            console.log(`Searching ${data.results.length} blocks for content containing "${searchContent}"`);
            // Find blocks containing the search text
            const matchingBlockIds = [];
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
        }
        catch (error) {
            console.error('Error finding blocks:', error);
            return [];
        }
    }
    // Calculate similarity between two strings (0-1 scale)
    calculateSimilarity(str1, str2) {
        // Exact match
        if (str1 === str2)
            return 1;
        // One string contains the other
        if (str1.includes(str2))
            return 0.9;
        if (str2.includes(str1))
            return 0.8;
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
    // Process the action with real Notion API
    async processAction(input) {
        try {
            if (!this.notionApiToken) {
                return "Error: Notion API token is not configured. Please set NOTION_API_TOKEN in your environment variables.";
            }
            // Parse the input to identify what we need to do
            const action = this.parseAction(input);
            console.log('Parsed action:', action);
            // Create and execute an action plan
            if (action.action === 'write') {
                const plan = await this.createActionPlan('write', {
                    pageTitle: action.pageTitle,
                    content: action.content
                });
                return plan.message;
            }
            else if (action.action === 'edit') {
                const plan = await this.createActionPlan('edit', {
                    pageTitle: action.pageTitle,
                    oldContent: action.oldContent,
                    newContent: action.newContent
                });
                return plan.message;
            }
            // Default fallback if we can't determine the action
            return `Processed request "${input}" but no specific action was taken. This is a test implementation.`;
        }
        catch (error) {
            console.error('Error calling Notion API:', error);
            return `Error processing your request: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    }
    // Get a list of all pages the integration has access to
    async getAllPages() {
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
            const data = await response.json();
            const pages = data.results.map(page => {
                const title = this.extractPageTitle(page) || 'Untitled';
                return { id: page.id, title };
            });
            console.log(`Found ${pages.length} accessible pages in workspace`);
            pages.forEach(page => console.log(`- "${page.title}" (${page.id})`));
            return pages;
        }
        catch (error) {
            console.error('Error getting all pages:', error);
            return [];
        }
    }
}
// Create a new agent instance
export async function createAgent() {
    return new NotionAgent();
}
// Process a chat message with the agent
export async function processChat(input, confirm = false) {
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
//# sourceMappingURL=agent.js.map