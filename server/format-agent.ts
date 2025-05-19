import fetch from 'node-fetch';

/**
 * Format Agent - Converts natural language content requests into Notion-compatible block structures
 * This agent handles the transformation of content into the appropriate Notion block format
 */
export class FormatAgent {
  private openAiApiKey: string;
  
  constructor(openAiApiKey: string) {
    this.openAiApiKey = openAiApiKey;
  }
  
  /**
   * Converts natural language content into Notion blocks
   * @param content The user's content description
   * @param formatHint Optional hint about the desired format (e.g., "toggle", "checklist")
   * @returns Array of Notion block objects
   */
  async formatContent(content: string, formatHint?: string): Promise<any[]> {
    console.log(`Formatting content with hint "${formatHint || 'none'}": "${content}"`);
    
    // For testing or if OpenAI key not available
    if (!this.openAiApiKey) {
      console.log('No OpenAI key available, using fallback formatting');
      return this.fallbackFormatting(content, formatHint);
    }
    
    try {
      const systemPrompt = `
        You are a helper that converts natural language content descriptions into proper Notion API block structures.
        
        Given a content description and optional format hint, generate the appropriate Notion API blocks.
        Common Notion block types include:
        - paragraph
        - heading_1, heading_2, heading_3
        - bulleted_list_item
        - numbered_list_item
        - to_do (checklist items)
        - toggle (collapsible content)
        - quote
        - code
        - callout
        
        For each block, provide the proper Notion API structure. For example:
        - A toggle with to-do items inside should be a toggle block with children that are to_do blocks
        - A bulleted list should be multiple bulleted_list_item blocks
        
        Pay special attention to content that:
        1. Contains hyphens or dashes (-) which likely indicate list items
        2. Mentions "checklist" or "to-do" which should become to_do blocks
        3. References "toggle" which should become toggle blocks with appropriate children
        
        IMPORTANT RULES:
        1. When the content includes phrases like "checklist" and "toggle" together, the user likely wants a toggle list that CONTAINS checklist/to-do items
        2. In these cases, split the content into individual to-do items and place them as children of the toggle
        3. Always look for natural item separators like dashes or new lines to identify individual items
        4. Be careful with commas - they don't always separate list items. For example, in "add hey, let's connect as checklist", this should be treated as ONE item, not two separate items
        5. For a request like "add a toggle list with content regarding my checklist that is to say: - Item1 - Item2 - Item3", create a toggle with to-do items inside, NOT a plain paragraph
        6. Pay special attention to content after a colon (:) as it often contains the items to include
        7. When the format is specified as "checklist" or "to-do" and there are no clear separators like dashes, treat the entire content as a single checklist item unless explicitly instructed otherwise
        8. When a request contains "as checklist" followed by location information like "under X section" or "in Y page", focus on creating the checklist item first. Do NOT convert it to a heading just because it mentions a section or title

        For example, with "add hey, let's connect as checklist under My Day title section in journal page", create:
        [
          {
            "object": "block",
            "type": "to_do",
            "to_do": {
              "rich_text": [{"type": "text", "text": {"content": "hey, let's connect"}}],
              "checked": false
            }
          }
        ]

        Example structure for a toggle containing to-do items:
        [
          {
            "object": "block",
            "type": "toggle",
            "toggle": {
              "rich_text": [{"type": "text", "text": {"content": "Checklist"}}],
              "children": [
                {
                  "object": "block",
                  "type": "to_do",
                  "to_do": {
                    "rich_text": [{"type": "text", "text": {"content": "Item 1"}}],
                    "checked": false
                  }
                },
                {
                  "object": "block",
                  "type": "to_do",
                  "to_do": {
                    "rich_text": [{"type": "text", "text": {"content": "Item 2"}}],
                    "checked": false
                  }
                }
              ]
            }
          }
        ]

        For phrases like "add a toggle list with content regarding my checklist that is to say: - Order a jhoola first - Second check list - Order a monitor", always create a toggle with to-do children like:
        [
          {
            "object": "block",
            "type": "toggle",
            "toggle": {
              "rich_text": [{"type": "text", "text": {"content": "Checklist"}}],
              "children": [
                {
                  "object": "block",
                  "type": "to_do",
                  "to_do": {
                    "rich_text": [{"type": "text", "text": {"content": "Order a jhoola first"}}],
                    "checked": false
                  }
                },
                {
                  "object": "block",
                  "type": "to_do",
                  "to_do": {
                    "rich_text": [{"type": "text", "text": {"content": "Second check list"}}],
                    "checked": false
                  }
                },
                {
                  "object": "block",
                  "type": "to_do",
                  "to_do": {
                    "rich_text": [{"type": "text", "text": {"content": "Order a monitor"}}],
                    "checked": false
                  }
                }
              ]
            }
          }
        ]
        
        Return only valid JSON that can be directly used with the Notion API.
        The format should be an array of block objects.
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
            { role: "system", content: systemPrompt },
            { role: "user", content: `Format this content for Notion: "${content}" ${formatHint ? `(Format hint: ${formatHint})` : ''}` }
          ],
          temperature: 0,
          response_format: { type: "json_object" }
        })
      });
      
      if (!response.ok) {
        console.error(`OpenAI API error: ${response.status} ${response.statusText}`);
        return this.fallbackFormatting(content, formatHint);
      }
      
      const data = await response.json() as {
        choices: Array<{
          message: {
            content: string;
          }
        }>
      };
      
      try {
        const parsedContent = JSON.parse(data.choices[0].message.content);
        console.log('Formatted blocks:', JSON.stringify(parsedContent, null, 2));
        
        // Ensure we have a blocks array
        if (parsedContent.blocks && Array.isArray(parsedContent.blocks)) {
          return parsedContent.blocks;
        } else if (Array.isArray(parsedContent)) {
          return parsedContent;
        } else if (parsedContent.object === 'block') {
          // Handle case where AI returns a single block object instead of an array
          return [parsedContent];
        } else {
          console.error('Invalid format returned from AI formatter');
          
          // If the content mentions toggle and checklist/tasks, try special parsing
          if (content.toLowerCase().includes('toggle') && 
              (content.toLowerCase().includes('checklist') || 
               content.toLowerCase().includes('task'))) {
            console.log('Attempting special parsing for toggle with checklist items');
            return this.createToggleWithChecklist(content);
          }
          
          return this.fallbackFormatting(content, formatHint);
        }
      } catch (parseError) {
        console.error('Error parsing AI formatter response:', parseError);
        return this.fallbackFormatting(content, formatHint);
      }
    } catch (error) {
      console.error('Error using AI formatter:', error);
      return this.fallbackFormatting(content, formatHint);
    }
  }
  
  /**
   * Fallback formatting logic when AI formatting is unavailable
   * @param content Content to format
   * @param formatHint Optional format hint
   * @returns Array of Notion blocks
   */
  private fallbackFormatting(content: string, formatHint?: string): any[] {
    // Default to paragraph if no hint is provided
    if (!formatHint) {
      return [{
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content } }]
        }
      }];
    }
    
    // Handle common format types
    switch (formatHint.toLowerCase()) {
      case 'toggle':
        return [{
          object: 'block',
          type: 'toggle',
          toggle: {
            rich_text: [{ type: 'text', text: { content } }]
          }
        }];
        
      case 'checklist':
      case 'to-do':
      case 'todo':
        // Check if content has explicit list item markers like dashes
        if (content.includes('-')) {
          // Split content into items by dashes
          const items = content
            .split(/\s+-\s+/)
            .filter(item => item.trim().length > 0)
            .map(item => item.trim());
            
          // Multiple items
          if (items.length > 1) {
            return items.map(item => ({
              object: 'block',
              type: 'to_do',
              to_do: {
                rich_text: [{ type: 'text', text: { content: item } }],
                checked: false
              }
            }));
          }
        }
        
        // If we get here, it means we don't have clear dash separators
        // and should NOT split the content by commas as that could split natural language incorrectly
        // Example: "hey, let's connect" should be one item
        
        // Single to-do item with the entire content
        return [{
          object: 'block',
          type: 'to_do',
          to_do: {
            rich_text: [{ type: 'text', text: { content } }],
            checked: false
          }
        }];
        
      case 'checklist_in_toggle':
        // For a toggle containing checklist items
        const listItems = content.includes('-') 
          ? content.split(/\s+-\s+/).filter(item => item.trim().length > 0)
          : content.split(/,\s*/).filter(item => item.trim().length > 0);
        
        // Create a toggle with to-do children
        return [{
          object: 'block',
          type: 'toggle',
          toggle: {
            rich_text: [{ type: 'text', text: { content: 'Checklist' } }],
            children: listItems.map(item => ({
              object: 'block',
              type: 'to_do',
              to_do: {
                rich_text: [{ type: 'text', text: { content: item.trim() } }],
                checked: false
              }
            }))
          }
        }];
        
      case 'bullet':
      case 'bulleted':
        const bulletItems = content.includes('-') 
          ? content.split(/\s+-\s+/).filter(item => item.trim().length > 0)
          : content.split(/,\s*/).filter(item => item.trim().length > 0);
        
        if (bulletItems.length <= 1) {
          return [{
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ type: 'text', text: { content } }]
            }
          }];
        } else {
          return bulletItems.map(item => ({
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ type: 'text', text: { content: item.trim() } }]
            }
          }));
        }
        
      default:
        // Default to paragraph for unknown format types
        return [{
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content } }]
          }
        }];
    }
  }
  
  /**
   * Special method to create a toggle with checklist items
   * Used when the AI formatter fails but we detect toggle + checklist patterns
   * @param content The user's content description 
   * @returns Array with a toggle block containing to-do items
   */
  private createToggleWithChecklist(content: string): any[] {
    console.log('Creating toggle with checklist for: ', content);
    
    // Extract a reasonable title for the toggle
    let toggleTitle = 'Checklist';
    
    // Try to extract a better title from the content
    const titleMatch = content.match(/toggle\s+(called|named|titled|with title)?\s*['"]([^'"]+)['"]/i);
    if (titleMatch && titleMatch[2]) {
      toggleTitle = titleMatch[2];
    } else if (content.includes(':')) {
      // Use text before the colon as title
      const parts = content.split(':');
      if (parts[0].toLowerCase().includes('toggle')) {
        toggleTitle = parts[0].replace(/.*toggle\s+(list|block)?/i, '').trim();
        if (!toggleTitle) toggleTitle = 'Checklist';
      }
    }
    
    // Extract checklist items
    let items: string[] = [];
    
    // Check for items after a colon
    if (content.includes(':')) {
      const afterColon = content.split(':')[1].trim();
      
      // Try to extract items separated by dashes
      if (afterColon.includes('-')) {
        items = afterColon
          .split('-')
          .filter(item => item.trim().length > 0)
          .map(item => item.trim());
        
        // Remove any "to the page" or similar trailing text from the last item
        if (items.length > 0) {
          const lastItem = items[items.length - 1];
          const pageMatch = lastItem.match(/(.*?)(?:\s+to\s+the\s+page|in\s+the\s+page|in\s+page)\s+.*/i);
          if (pageMatch) {
            items[items.length - 1] = pageMatch[1].trim();
          }
        }
      } 
      // Try to extract items separated by clear list indicator patterns
      else if (afterColon.includes(',') && 
               (afterColon.match(/,\s*and\b/) || // "item1, item2, and item3"
                afterColon.match(/\d+\s*[.,:)]\s*\w+/g) || // "1. item 2. item"
                afterColon.match(/\b(first|second|third|next|finally|lastly)\b/gi))) { // "first X, second Y"
        
        items = afterColon
          .split(/,\s*(?=\d+\s*[.,:)]|\b(?:and|first|second|third|next|finally|lastly)\b)/i)
          .filter(item => item.trim().length > 0)
          .map(item => item.trim());
        
        // Clean up the last item if it has "and" prefix
        if (items.length > 0) {
          const lastItem = items[items.length - 1];
          if (lastItem.startsWith('and ')) {
            items[items.length - 1] = lastItem.substring(4).trim();
          }
        }
      }
      // Single item case
      else {
        items = [afterColon.trim()];
      }
    } 
    // If no colon, check for explicit checklist patterns
    else if (content.match(/\s+as\s+checklist\b/i) || content.match(/\s+as\s+to-?do\b/i)) {
      // This is likely a request for a single checklist item with natural language
      // Example: "add hey, let's connect as checklist"
      const itemMatch = content.match(/\badd\s+(.+?)(?:\s+as\s+(?:checklist|to-?do)\b)/i);
      if (itemMatch && itemMatch[1]) {
        items = [itemMatch[1].trim()];
      } else {
        // Try another pattern: extract content before "as checklist"
        const altMatch = content.match(/(.+?)\s+as\s+(?:checklist|to-?do)\b/i);
        if (altMatch && altMatch[1]) {
          items = [altMatch[1].trim()];
        } else {
          // Default to the whole content
          items = [content.trim()];
        }
      }
    }
    // Check for "with items" pattern
    else {
      // Try to find items after "with items" or similar phrases
      const itemsMatch = content.match(/with\s+items:?\s+(.*)/i);
      if (itemsMatch) {
        const itemsText = itemsMatch[1];
        
        // Only split by commas if clear list indicators are present
        if (itemsText.includes(',') && 
            (itemsText.match(/,\s*and\b/) || 
             itemsText.match(/\d+\s*[.,:)]\s*\w+/g) || 
             itemsText.match(/\b(first|second|third|next|finally|lastly)\b/gi))) {
          
          items = itemsText
            .split(/,\s*(?=\d+\s*[.,:)]|\b(?:and|first|second|third|next|finally|lastly)\b)/i)
            .filter(item => item.trim().length > 0)
            .map(item => item.trim());
          
          // Clean up the last item if it has "and" prefix
          if (items.length > 0) {
            const lastItem = items[items.length - 1];
            if (lastItem.startsWith('and ')) {
              items[items.length - 1] = lastItem.substring(4).trim();
            }
          }
        } else {
          items = [itemsText.trim()];
        }
      }
    }
    
    // If we still don't have items, look for words that might be tasks
    if (items.length === 0) {
      // Extract words or phrases that look like tasks
      const taskMatches = content.match(/\b(order|buy|get|call|email|write|create|update|check|review)\b\s+[^,.;]+/gi);
      if (taskMatches) {
        items = taskMatches.map(task => task.trim());
      }
    }
    
    // If we still don't have items, default to a simple note
    if (items.length === 0) {
      items = ['Item 1'];
    }
    
    // Create the toggle with to-do children
    return [{
      object: 'block',
      type: 'toggle',
      toggle: {
        rich_text: [{ type: 'text', text: { content: toggleTitle } }],
        children: items.map(item => ({
          object: 'block',
          type: 'to_do',
          to_do: {
            rich_text: [{ type: 'text', text: { content: item } }],
            checked: false
          }
        }))
      }
    }];
  }
}

/**
 * Creates a new format agent
 * @param openAiApiKey OpenAI API key
 * @returns FormatAgent instance
 */
export async function createFormatAgent(openAiApiKey: string): Promise<FormatAgent> {
  return new FormatAgent(openAiApiKey);
} 