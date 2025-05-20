import fetch from 'node-fetch';
import * as NotionBlocks from './notion-blocks.js';
/**
 * Format Agent - Converts natural language content requests into Notion-compatible block structures
 * This agent handles the transformation of content into the appropriate Notion block format
 */
export class FormatAgent {
    constructor(openAiApiKey) {
        this.openAiApiKey = openAiApiKey;
    }
    /**
     * Converts natural language content into Notion blocks
     * @param content The user's content description
     * @param formatHint Optional hint about the desired format (e.g., "toggle", "checklist")
     * @returns Array of Notion block objects
     */
    async formatContent(content, formatHint) {
        console.log(`Formatting content with hint "${formatHint || 'none'}": "${content}"`);
        // Check if content contains multiple lines or distinct elements that should be batched
        const hasMultipleLines = content.includes('\n');
        // Special case: Toggle with complex content
        if (formatHint === 'toggle' && content.includes(':')) {
            const parts = content.split(':');
            if (parts.length >= 2) {
                const toggleName = parts[0].trim();
                const toggleContent = parts.slice(1).join(':').trim();
                // Check for code blocks in toggle content
                if (toggleContent.includes('```')) {
                    return [NotionBlocks.createToggleBlock(toggleName, [NotionBlocks.detectLanguageAndCreateCodeBlock(toggleContent)])];
                }
                // If it looks like there are items inside (comma-separated, bullet points, etc)
                if (toggleContent.includes(',') || toggleContent.includes('-') || toggleContent.includes('\n')) {
                    return [NotionBlocks.createToggleBlock(toggleName, this.detectContentBlocks(toggleContent))];
                }
                else {
                    // Simple toggle with content
                    return [NotionBlocks.createToggleBlock(toggleName, [NotionBlocks.createParagraphBlock(toggleContent)])];
                }
            }
        }
        // Handle complex nested toggles with mixed content types
        if (formatHint === 'complex_toggle' && content.includes(':')) {
            const parts = content.split(':');
            if (parts.length >= 2) {
                const toggleName = parts[0].trim();
                const toggleContent = parts.slice(1).join(':').trim();
                try {
                    // Try to parse toggle content as JSON describing nested blocks
                    const contentItems = JSON.parse(toggleContent);
                    if (Array.isArray(contentItems)) {
                        return [NotionBlocks.createComplexToggle(toggleName, contentItems)];
                    }
                }
                catch (e) {
                    // If not valid JSON, handle as regular toggle
                    return [NotionBlocks.createToggleBlock(toggleName, this.detectContentBlocks(toggleContent))];
                }
            }
        }
        // Check for code blocks with language markers
        if (content.includes('```') || formatHint === 'code') {
            return [NotionBlocks.detectLanguageAndCreateCodeBlock(content)];
        }
        // For testing or if OpenAI key not available
        if (!this.openAiApiKey) {
            console.log('No OpenAI key available, using direct block formatting');
            return this.directBlockFormatting(content, formatHint, hasMultipleLines);
        }
        try {
            // Try parsing with LLM first
            const parsedBlocks = await this.parseWithLLM(content, formatHint);
            if (parsedBlocks && parsedBlocks.length > 0) {
                return parsedBlocks;
            }
            // Fall back to direct formatting if LLM parsing fails
            return this.directBlockFormatting(content, formatHint, hasMultipleLines);
        }
        catch (error) {
            console.error('Error in formatContent:', error);
            return this.directBlockFormatting(content, formatHint, hasMultipleLines);
        }
    }
    /**
     * Parse content with LLM to get properly formatted blocks
     */
    async parseWithLLM(content, formatHint) {
        // If the format is explicitly known and simple, use direct formatting
        if (formatHint &&
            ['paragraph', 'heading', 'h1', 'h2', 'h3', 'bullet', 'quote', 'callout'].includes(formatHint.toLowerCase())) {
            return NotionBlocks.processContentByFormat(content, formatHint);
        }
        const systemPrompt = `
      You are a formatter that converts content into Notion API blocks. Return valid JSON with an array of properly structured Notion blocks.
      
      Rules to follow:
      1. Always return a proper JSON array of Notion blocks
      2. Make sure all blocks follow the Notion API structure
      3. Handle multi-line content correctly
      4. For code blocks, detect the language and preserve formatting
      5. For toggles, the header should be in the toggle's rich_text and content inside children
      6. For complex nested structures, ensure parent-child relationships are preserved
      7. When a toggle contains mixed content types, structure each child appropriately
      
      DO NOT add any explanation, just return the JSON array.
    `;
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.openAiApiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: `Format this content for Notion: "${content}" ${formatHint ? `(Format hint: ${formatHint})` : ''}` }
                    ],
                    temperature: 0,
                    response_format: { type: "json_object" }
                })
            });
            if (!response.ok) {
                console.error(`OpenAI API error: ${response.status} ${response.statusText}`);
                return [];
            }
            const data = await response.json();
            try {
                const parsedContent = JSON.parse(data.choices[0].message.content);
                // Check if the response has blocks property or is an array itself
                if (Array.isArray(parsedContent.blocks)) {
                    return parsedContent.blocks;
                }
                else if (Array.isArray(parsedContent)) {
                    return parsedContent;
                }
                // Handle case where we got a single block
                if (parsedContent.object === 'block') {
                    return [parsedContent];
                }
                // Handle case where we got a complex toggle structure
                if (parsedContent.type === 'complex_toggle' &&
                    parsedContent.title &&
                    Array.isArray(parsedContent.content)) {
                    return [NotionBlocks.createComplexToggle(parsedContent.title, parsedContent.content)];
                }
                console.log('Unrecognized LLM response format, using direct formatting');
                return [];
            }
            catch (error) {
                console.error('Error parsing LLM response:', error);
                return [];
            }
        }
        catch (error) {
            console.error('Error calling OpenAI API:', error);
            return [];
        }
    }
    /**
     * Format content directly into Notion blocks without using LLM
     */
    directBlockFormatting(content, formatHint, hasMultipleLines = false) {
        console.log(`Using direct block formatting with hint "${formatHint || 'none'}" and hasMultipleLines=${hasMultipleLines}`);
        // Use our specialized block processing functions
        return NotionBlocks.processContentByFormat(content, formatHint);
    }
    /**
     * Detect the most appropriate blocks for content
     */
    detectContentBlocks(content) {
        // Code block detection - check this first to prioritize it
        if (content.includes('```')) {
            return [NotionBlocks.detectLanguageAndCreateCodeBlock(content)];
        }
        
        // URL detection
        if (content.match(/^https?:\/\//i)) {
            return [NotionBlocks.createBookmarkBlock(content.trim())];
        }
        
        // Look for patterns that suggest code blocks
        if ((content.match(/\n\s{2,}/) || content.match(/\n\t+/)) && 
            (content.includes('{') || content.includes('function') || 
             content.includes('def ') || content.includes('class '))) {
          return [NotionBlocks.detectLanguageAndCreateCodeBlock(content)];
        }
        
        // Bulleted list detection
        if (content.includes('-')) {
            return content
                .split('-')
                .map(item => item.trim())
                .filter(item => item.length > 0)
                .map(item => NotionBlocks.createBulletedListItemBlock(item));
        }
        
        // Comma-separated list detection
        if (content.includes(',')) {
            // Check if this looks like a to-do list
            if (content.toLowerCase().includes('todo') ||
                content.toLowerCase().includes('to do') ||
                content.toLowerCase().includes('to-do') ||
                content.toLowerCase().includes('checklist') ||
                content.toLowerCase().includes('task')) {
                return NotionBlocks.createToDoList(content);
            }
            // Check if it explicitly mentions bullets
            if (content.toLowerCase().includes('bullet') ||
                content.toLowerCase().includes('list items')) {
                return NotionBlocks.createBulletedList(content);
            }
            // Default to paragraphs for comma-separated content
            return content
                .split(',')
                .map(item => item.trim())
                .filter(item => item.length > 0)
                .map(item => NotionBlocks.createParagraphBlock(item));
        }
        
        // Multi-line content detection
        if (content.includes('\n')) {
            // Default to paragraphs for multi-line content
            return content
                .split('\n')
                .map(item => item.trim())
                .filter(item => item.length > 0)
                .map(item => NotionBlocks.createParagraphBlock(item));
        }
        
        // Default to single paragraph
        return [NotionBlocks.createParagraphBlock(content)];
    }
}
/**
 * Creates a new format agent
 * @param openAiApiKey OpenAI API key
 * @returns FormatAgent instance
 */
export async function createFormatAgent(openAiApiKey) {
    return new FormatAgent(openAiApiKey);
}
