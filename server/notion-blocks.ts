/**
 * Notion Blocks - Standardized block structures for the Notion API
 * This file contains factory functions for creating properly structured Notion blocks
 */

/**
 * Creates a paragraph block
 */
export function createParagraphBlock(content: string) {
  return {
    object: "block",
    type: "paragraph",
    paragraph: {
      rich_text: [
        {
          type: "text",
          text: {
            content: content
          }
        }
      ]
    }
  };
}

/**
 * Creates a heading 1 block
 */
export function createHeading1Block(content: string) {
  return {
    object: "block",
    type: "heading_1",
    heading_1: {
      rich_text: [
        {
          type: "text",
          text: {
            content: content
          }
        }
      ]
    }
  };
}

/**
 * Creates a heading 2 block
 */
export function createHeading2Block(content: string) {
  return {
    object: "block",
    type: "heading_2",
    heading_2: {
      rich_text: [
        {
          type: "text",
          text: {
            content: content
          }
        }
      ]
    }
  };
}

/**
 * Creates a heading 3 block
 */
export function createHeading3Block(content: string) {
  return {
    object: "block",
    type: "heading_3",
    heading_3: {
      rich_text: [
        {
          type: "text",
          text: {
            content: content
          }
        }
      ]
    }
  };
}

/**
 * Creates a bulleted list item block
 */
export function createBulletedListItemBlock(content: string) {
  return {
    object: "block",
    type: "bulleted_list_item",
    bulleted_list_item: {
      rich_text: [
        {
          type: "text",
          text: {
            content: content
          }
        }
      ]
    }
  };
}

/**
 * Creates a numbered list item block
 */
export function createNumberedListItemBlock(content: string) {
  return {
    object: "block",
    type: "numbered_list_item",
    numbered_list_item: {
      rich_text: [
        {
          type: "text",
          text: {
            content: content
          }
        }
      ]
    }
  };
}

/**
 * Creates a to-do (checkbox) block
 */
export function createToDoBlock(content: string, checked: boolean = false) {
  return {
    object: "block",
    type: "to_do",
    to_do: {
      rich_text: [
        {
          type: "text",
          text: {
            content: content
          }
        }
      ],
      checked: checked
    }
  };
}

/**
 * Creates a toggle block with optional children
 */
export function createToggleBlock(content: string, children: any[] = []) {
  return {
    object: "block",
    type: "toggle",
    toggle: {
      rich_text: [
        {
          type: "text",
          text: {
            content: content
          }
        }
      ],
      children: children
    }
  };
}

/**
 * Creates a code block
 */
export function createCodeBlock(content: string, language: string = "plain_text") {
  return {
    object: "block",
    type: "code",
    code: {
      rich_text: [
        {
          type: "text",
          text: {
            content: content
          }
        }
      ],
      language: language
    }
  };
}

/**
 * Creates a quote block
 */
export function createQuoteBlock(content: string) {
  return {
    object: "block",
    type: "quote",
    quote: {
      rich_text: [
        {
          type: "text",
          text: {
            content: content
          }
        }
      ]
    }
  };
}

/**
 * Creates a callout block
 */
export function createCalloutBlock(content: string, emoji: string = "💡") {
  return {
    object: "block",
    type: "callout",
    callout: {
      rich_text: [
        {
          type: "text",
          text: {
            content: content
          }
        }
      ],
      icon: {
        type: "emoji",
        emoji: emoji
      }
    }
  };
}

/**
 * Creates a bookmark block
 */
export function createBookmarkBlock(url: string) {
  return {
    object: "block",
    type: "bookmark",
    bookmark: {
      url: url
    }
  };
}

/**
 * Creates a divider block
 */
export function createDividerBlock() {
  return {
    object: "block",
    type: "divider",
    divider: {}
  };
}

/**
 * Creates multiple bullet list items from comma-separated text
 */
export function createBulletedList(itemsText: string): any[] {
  // Split by commas, unless there's already line breaks
  const separator = itemsText.includes('\n') ? '\n' : ',';
  
  // For comma-separated items, clean up properly
  const items = itemsText
    .split(separator)
    .map(item => item.trim())
    .filter(item => item.length > 0);
  
  // Create a separate bullet item for each entry
  return items.map(item => createBulletedListItemBlock(item));
}

/**
 * Creates multiple to-do items from comma-separated text
 */
export function createToDoList(itemsText: string): any[] {
  // Split by commas, unless there's already line breaks
  const separator = itemsText.includes('\n') ? '\n' : ',';
  const items = itemsText
    .split(separator)
    .map(item => item.trim())
    .filter(item => item.length > 0);
  
  return items.map(item => createToDoBlock(item));
}

/**
 * Creates a toggle with to-do items
 */
export function createToggleWithToDoItems(toggleTitle: string, itemsText: string): any {
  // Split by commas or line breaks
  const separator = itemsText.includes('\n') ? '\n' : ',';
  const items = itemsText
    .split(separator)
    .map(item => item.trim())
    .filter(item => item.length > 0);
  
  const todoItems = items.map(item => createToDoBlock(item));
  
  return createToggleBlock(toggleTitle, todoItems);
}

// Map of programming language aliases to Notion language codes
const LANGUAGE_ALIASES: { [key: string]: string } = {
  // JavaScript variants
  'js': 'javascript',
  'javascript': 'javascript',
  'jsx': 'javascript',
  'ts': 'typescript',
  'typescript': 'typescript',
  'tsx': 'typescript',
  // Python variants
  'py': 'python',
  'python': 'python',
  'python3': 'python',
  // Web technologies
  'html': 'html',
  'css': 'css',
  'sass': 'sass',
  'scss': 'sass',
  // Shell/CLI
  'bash': 'bash',
  'sh': 'bash',
  'shell': 'bash',
  'zsh': 'bash',
  'powershell': 'powershell',
  'ps': 'powershell',
  'cmd': 'batch',
  'batch': 'batch',
  // Common languages
  'java': 'java',
  'c': 'c',
  'cpp': 'c++',
  'c++': 'c++',
  'csharp': 'c#',
  'c#': 'c#',
  'cs': 'c#',
  'go': 'go',
  'ruby': 'ruby',
  'rb': 'ruby',
  'rust': 'rust',
  'rs': 'rust',
  'php': 'php',
  'swift': 'swift',
  'kotlin': 'kotlin',
  'scala': 'scala',
  // Data/config formats
  'json': 'json',
  'yaml': 'yaml',
  'yml': 'yaml',
  'xml': 'xml',
  'sql': 'sql',
  'markdown': 'markdown',
  'md': 'markdown',
};

/**
 * Improved code block detector with better language inference
 */
export function detectLanguageAndCreateCodeBlock(codeContent: string): any {
  let language = "plain_text";
  let cleanedContent = codeContent;
  
  // First, try to extract language from fenced code blocks
  const fencedCodeMatch = codeContent.match(/```([\w+-]+)?\s*([\s\S]*?)```/s);
  
  if (fencedCodeMatch) {
    const langTag = fencedCodeMatch[1]?.trim().toLowerCase();
    const codeBody = fencedCodeMatch[2]?.trim();
    
    // If we have a language specified in the code fence
    if (langTag && langTag.length > 0) {
      language = LANGUAGE_ALIASES[langTag] || langTag;
    }
    
    // Use the code within the fences
    if (codeBody && codeBody.length > 0) {
      cleanedContent = codeBody;
    } else {
      // Remove fences if no content was detected
      cleanedContent = codeContent.replace(/```([\w+-]+)?/g, '').replace(/```/g, '').trim();
    }
  } else {
    // Remove any stray fences
    cleanedContent = codeContent.replace(/```/g, '').trim();
  }
  
  // If no language was explicitly defined, try to detect from content
  if (language === "plain_text") {
    // JavaScript detection - do this first since it's most common
    if (cleanedContent.includes('function ') || 
        cleanedContent.match(/const\s+|let\s+|var\s+/) ||
        cleanedContent.includes('console.log') ||
        cleanedContent.match(/\(\s*\)\s*=>\s*{/) ||
        cleanedContent.match(/}\s*\(\s*\)\s*;/) ||
        (cleanedContent.match(/\/\/.*?[\r\n]/) && (cleanedContent.includes('{') || cleanedContent.includes('}'))) ||
        (cleanedContent.includes('{') && cleanedContent.includes('}') && 
         cleanedContent.includes('(') && cleanedContent.includes(')'))) {
      
      // TypeScript detection
      if (cleanedContent.includes('interface ') || 
          cleanedContent.match(/:\s*(?:string|number|boolean|any)/) ||
          cleanedContent.includes('<T>')) {
        language = "typescript";
      } else {
        language = "javascript";
      }
    }
    // Python detection
    else if (cleanedContent.includes('def ') || 
             cleanedContent.match(/import\s+[\w.]+/) ||
             cleanedContent.includes('print(') ||
             cleanedContent.match(/:\s*[\r\n]/) ||
             cleanedContent.match(/#.*?[\r\n]/)) {
      language = "python";
    }
    // HTML detection
    else if (cleanedContent.match(/<html>|<body>|<div>|<span>|<p>/i) ||
             cleanedContent.match(/<[a-z]+>.*?<\/[a-z]+>/i) ||
             cleanedContent.includes('<!DOCTYPE')) {
      language = "html";
    }
    // Java detection - do this before CSS because it can have similar syntax
    else if (cleanedContent.includes('public class ') || 
             cleanedContent.includes('public static void main') ||
             cleanedContent.match(/\w+\s+\w+\s*=\s*new\s+\w+/) ||
             cleanedContent.includes('System.out.println') ||
             (cleanedContent.match(/class\s+\w+/) && !cleanedContent.match(/[\w\s.#-]+\s*{[\s\S]*?}/))) {
      language = "java";
    }
    // CSS detection - after Java
    else if (cleanedContent.match(/[\w\s.#-]+\s*{[\s\S]*?}/) &&
             (cleanedContent.includes(':') || cleanedContent.includes(';'))) {
      language = "css";
    }
    // C# detection
    else if (cleanedContent.includes('using System') || 
             cleanedContent.match(/namespace\s+[\w.]+/) ||
             cleanedContent.includes('Console.WriteLine')) {
      language = "c#";
    }
    // C/C++ detection
    else if (cleanedContent.match(/#include\s+[<"][\w.]+[>"]/) ||
             cleanedContent.match(/int\s+main\s*\(/) ||
             cleanedContent.match(/\b(?:int|void|float|double|char)\s+\w+\s*\(/)) {
      language = "c++";
    }
    // SQL detection
    else if (cleanedContent.match(/SELECT\s+|CREATE\s+TABLE|INSERT\s+INTO|UPDATE\s+|DELETE\s+FROM/i) ||
             cleanedContent.match(/FROM\s+\w+\s+WHERE/i)) {
      language = "sql";
    }
    // Shell script detection
    else if (cleanedContent.match(/^\s*\$/) ||
             cleanedContent.match(/^\s*#!\/bin\/(?:ba)?sh/) ||
             cleanedContent.match(/\b(?:cd|ls|mkdir|rm|cp|mv|echo|cat)\b/)) {
      language = "bash";
    }
    // JSON detection
    else if (cleanedContent.match(/^\s*{[\s\S]*?}$/) && 
             cleanedContent.includes('"') && 
             cleanedContent.includes(':')) {
      language = "json";
    }
    // YAML detection
    else if (cleanedContent.match(/^\s*[\w-]+:\s*\w+/) &&
             !cleanedContent.includes('{') && !cleanedContent.includes('}')) {
      language = "yaml";
    }
  }
  
  // Ensure we're treating the entire code as a single block, not splitting by lines
  return createCodeBlock(cleanedContent, language);
}

/**
 * Handle nested toggle blocks with mixed content types
 */
export function createComplexToggle(toggleTitle: string, contentItems: Array<{type: string, content: string}>): any {
  // Convert each content item to the appropriate block type
  const childBlocks = contentItems.map(item => {
    switch (item.type.toLowerCase()) {
      case 'paragraph':
        return createParagraphBlock(item.content);
      case 'bullet':
      case 'bulleted':
        if (item.content.includes(',') || item.content.includes('\n')) {
          return createBulletedList(item.content);
        }
        return createBulletedListItemBlock(item.content);
      case 'todo':
      case 'checklist':
        if (item.content.includes(',') || item.content.includes('\n')) {
          return createToDoList(item.content);
        }
        return createToDoBlock(item.content);
      case 'code':
        return detectLanguageAndCreateCodeBlock(item.content);
      case 'quote':
        return createQuoteBlock(item.content);
      case 'callout':
        return createCalloutBlock(item.content);
      default:
        return createParagraphBlock(item.content);
    }
  }).flat(); // Flatten in case any of the block creators return arrays
  
  return createToggleBlock(toggleTitle, childBlocks);
}

/**
 * Process content into appropriate blocks based on format type
 */
export function processContentByFormat(content: string, formatType?: string): any[] {
  if (!formatType) {
    // Auto-detect
    if (content.match(/^https?:\/\//i)) {
      return [createBookmarkBlock(content.trim())];
    }
    
    if (content.includes('```')) {
      return [detectLanguageAndCreateCodeBlock(content)];
    }
    
    // Default to paragraph(s)
    if (content.includes('\n')) {
      return content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => createParagraphBlock(line));
    }
    
    return [createParagraphBlock(content)];
  }
  
  const format = formatType.toLowerCase();
  
  // Handle special case: Toggle with header format
  const toggleRegex = /^(.*?):\s*([\s\S]*)$/;
  if (format === 'toggle' && toggleRegex.test(content)) {
    const match = content.match(toggleRegex);
    if (match) {
      const toggleHeader = match[1].trim();
      const toggleContent = match[2].trim();
      
      // Special handling for code blocks in toggles
      if (toggleContent.includes('```')) {
        // Create a single code block for the toggle content
        return [createToggleBlock(toggleHeader, [detectLanguageAndCreateCodeBlock(toggleContent)])];
      }
      
      // If it looks like there are items inside (comma-separated, bullet points, etc)
      if (toggleContent.includes('-') || toggleContent.includes(',') || 
          toggleContent.includes('\n')) {
        let childBlocks = [];
        
        if (toggleContent.includes('-')) {
          // Process as bullet list
          childBlocks = toggleContent
            .split('-')
            .map(item => item.trim())
            .filter(item => item.length > 0)
            .map(item => createBulletedListItemBlock(item));
        } else if (toggleContent.includes('\n')) {
          // Check if this looks like a code block without explicit markers
          if ((toggleContent.match(/\n\s{2,}[\w(]/m) || toggleContent.match(/\n\t+[\w(]/m)) && 
              (toggleContent.includes('{') || toggleContent.includes('function') || 
               toggleContent.includes('def ') || toggleContent.includes('class '))) {
            
            // Treat this as a code block
            childBlocks = [detectLanguageAndCreateCodeBlock(toggleContent)];
          } else {
            // Process as paragraphs
            childBlocks = toggleContent
              .split('\n')
              .map(item => item.trim())
              .filter(item => item.length > 0)
              .map(item => createParagraphBlock(item));
          }
        } else {
          // Process as comma-separated paragraphs
          childBlocks = toggleContent
            .split(',')
            .map(item => item.trim())
            .filter(item => item.length > 0)
            .map(item => createParagraphBlock(item));
        }
        
        return [createToggleBlock(toggleHeader, childBlocks)];
      }
      
      // Simple toggle with just content
      return [createToggleBlock(toggleHeader, [createParagraphBlock(toggleContent)])];
    }
  }
  
  // Regular format processing
  switch (format) {
    case 'heading':
    case 'heading_1':
    case 'heading1':
    case 'h1':
    case 'title':
      return [createHeading1Block(content)];
      
    case 'heading_2':
    case 'heading2':
    case 'h2':
    case 'subheading':
    case 'subtitle':
      return [createHeading2Block(content)];
      
    case 'heading_3':
    case 'heading3':
    case 'h3':
      return [createHeading3Block(content)];
      
    case 'bullet':
    case 'bulleted':
    case 'bulleted_list_item':
    case 'bulleted_list':
    case 'list':
      if (content.includes(',') || content.includes('\n')) {
        return createBulletedList(content);
      }
      return [createBulletedListItemBlock(content)];
      
    case 'numbered':
    case 'numbered_list_item':
    case 'numbered_list':
    case 'ordered':
    case 'ordered_list':
      return [createNumberedListItemBlock(content)];
      
    case 'todo':
    case 'to-do':
    case 'to_do':
    case 'checklist':
    case 'task':
    case 'tasks':
      if (content.includes(',') || content.includes('\n')) {
        return createToDoList(content);
      }
      return [createToDoBlock(content)];
      
    case 'toggle':
    case 'dropdown':
    case 'collapsible':
      return [createToggleBlock(content)];
      
    case 'quote':
    case 'blockquote':
      return [createQuoteBlock(content)];
      
    case 'code':
    case 'codeblock':
    case 'code_block':
    case 'snippet':
      return [detectLanguageAndCreateCodeBlock(content)];
      
    case 'callout':
    case 'note':
    case 'alert':
    case 'warning':
      return [createCalloutBlock(content)];
      
    case 'bookmark':
    case 'url':
    case 'link':
    case 'website':
      return [createBookmarkBlock(content)];
      
    case 'divider':
    case 'separator':
    case 'hr':
    case 'line':
      return [createDividerBlock()];
      
    default:
      // If format is unrecognized, default to paragraph
      return [createParagraphBlock(content)];
  }
}

/**
 * Helper function to detect language from code content
 * This is a simplified version of detectLanguageAndCreateCodeBlock that just returns the language string
 */
export function detectCodeLanguage(codeContent: string): string {
  // JavaScript detection
  if (codeContent.includes('function ') || 
      codeContent.match(/const\s+|let\s+|var\s+/) ||
      codeContent.includes('console.log') ||
      (codeContent.includes('{') && codeContent.includes('}') && 
       codeContent.includes('(') && codeContent.includes(')'))) {
    
    // TypeScript detection
    if (codeContent.includes('interface ') || 
        codeContent.match(/:\s*(?:string|number|boolean|any)/) ||
        codeContent.includes('<T>')) {
      return "typescript";
    }
    return "javascript";
  }
  
  // Python detection
  if (codeContent.includes('def ') || 
      codeContent.match(/import\s+[\w.]+/) ||
      codeContent.includes('print(') ||
      codeContent.match(/:\s*[\r\n]/) ||
      codeContent.match(/#.*?[\r\n]/)) {
    return "python";
  }
  
  // HTML detection
  if (codeContent.match(/<html>|<body>|<div>|<span>|<p>/i) ||
      codeContent.match(/<[a-z]+>.*?<\/[a-z]+>/i) ||
      codeContent.includes('<!DOCTYPE')) {
    return "html";
  }
  
  // Java detection
  if (codeContent.includes('public class ') || 
      codeContent.includes('public static void main') ||
      codeContent.match(/\w+\s+\w+\s*=\s*new\s+\w+/) ||
      (codeContent.match(/class\s+\w+/) && 
       !codeContent.match(/[\w\s.#-]+\s*{[\s\S]*?}/))) {
    return "java";
  }
  
  // CSS detection
  if (codeContent.match(/[\w\s.#-]+\s*{[\s\S]*?}/) &&
      (codeContent.includes(':') || codeContent.includes(';'))) {
    return "css";
  }
  
  // Default if no specific language detected
  return "plain_text";
} 