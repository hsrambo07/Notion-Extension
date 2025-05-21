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
 * Creates an image block with an external URL with validation
 */
export function createImageBlock(url: string, caption?: string) {
  // Basic URL validation
  if (!url) {
    throw new Error('URL is required for image block');
  }
  
  if (!url.match(/^https?:\/\/.+/i)) {
    throw new Error('Invalid URL format for image block. Must be http(s)://...');
  }
  
  return {
    object: "block",
    type: "image",
    image: {
      type: "external",
      external: {
        url: url
      },
      caption: caption ? [{
        type: "text",
        text: {
          content: caption
        }
      }] : []
    }
  };
}

/**
 * Creates a file block with an external URL with validation
 */
export function createFileBlock(url: string, name: string) {
  // Basic URL and name validation
  if (!url) {
    throw new Error('URL is required for file block');
  }
  
  if (!url.match(/^https?:\/\/.+/i)) {
    throw new Error('Invalid URL format for file block. Must be http(s)://...');
  }
  
  if (!name) {
    // Generate a name from the URL if not provided
    try {
      const urlObj = new URL(url);
      name = urlObj.pathname.split('/').pop() || 'file';
    } catch (e) {
      name = 'file';
    }
  }
  
  return {
    object: "block",
    type: "file",
    file: {
      type: "external",
      external: {
        url: url
      },
      caption: [],
      name: name
    }
  };
}

/**
 * Creates an uploaded image block (internal file)
 */
export function createUploadedImageBlock(url: string, expiry_time: string, caption?: string) {
  if (!url) {
    throw new Error('URL is required for uploaded image block');
  }
  
  if (!expiry_time) {
    throw new Error('Expiry time is required for uploaded image block');
  }
  
  return {
    object: "block",
    type: "image",
    image: {
      type: "file",
      file: {
        url,
        expiry_time
      },
      caption: caption ? [{
        type: "text",
        text: {
          content: caption
        }
      }] : []
    }
  };
}

/**
 * Creates an uploaded file block (internal file)
 */
export function createUploadedFileBlock(url: string, expiry_time: string, name: string) {
  if (!url) {
    throw new Error('URL is required for uploaded file block');
  }
  
  if (!expiry_time) {
    throw new Error('Expiry time is required for uploaded file block');
  }
  
  if (!name) {
    name = 'Uploaded file';
  }
  
  return {
    object: "block",
    type: "file",
    file: {
      type: "file",
      file: {
        url,
        expiry_time
      },
      caption: [],
      name
    }
  };
}

/**
 * Validates and ensures a Notion block has all required properties
 * This helps prevent "undefined" errors when sending blocks to the Notion API
 */
export function validateNotionBlock(block: any): any {
  if (!block) {
    // Create a default paragraph block if none exists
    return {
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [{ type: "text", text: { content: "" } }]
      }
    };
  }

  // Ensure the block has the object property
  if (!block.object) {
    block.object = "block";
  }

  // Ensure the block has a type
  if (!block.type) {
    console.warn('Block missing type property, defaulting to paragraph');
    block.type = "paragraph";
    block.paragraph = {
      rich_text: [{ type: "text", text: { content: "" } }]
    };
    return block;
  }

  // Make sure the block has the corresponding property for its type
  if (!block[block.type]) {
    console.warn(`Block of type ${block.type} missing corresponding property, adding default`);
    block[block.type] = {};
  }

  // Ensure rich_text array exists for text-based blocks
  const textBasedTypes = [
    'paragraph', 'heading_1', 'heading_2', 'heading_3', 
    'bulleted_list_item', 'numbered_list_item', 'to_do', 
    'toggle', 'quote', 'callout', 'code'
  ];

  if (textBasedTypes.includes(block.type)) {
    if (!block[block.type].rich_text) {
      console.warn(`Block of type ${block.type} missing rich_text property, adding default`);
      block[block.type].rich_text = [{ type: "text", text: { content: "" } }];
    } else if (!Array.isArray(block[block.type].rich_text)) {
      // Convert to array if not already
      const content = block[block.type].rich_text;
      block[block.type].rich_text = [{ type: "text", text: { content: content?.toString() || "" } }];
    }
    
    // Ensure each rich_text entry has proper structure
    block[block.type].rich_text = block[block.type].rich_text.map((textItem: any) => {
      if (!textItem.type) {
        textItem.type = "text";
      }
      
      if (!textItem.text) {
        textItem.text = { content: "" };
      } else if (typeof textItem.text === 'string') {
        textItem.text = { content: textItem.text };
      } else if (!textItem.text.content && textItem.text.content !== '') {
        textItem.text.content = "";
      }
      
      return textItem;
    });
  }

  // Handle specific block types that need additional properties
  switch (block.type) {
    case 'to_do':
      if (block.to_do.checked === undefined) {
        block.to_do.checked = false;
      }
      break;
    
    case 'toggle':
      // Handle children property for toggles
      if (block.toggle.children) {
        if (!Array.isArray(block.toggle.children)) {
          block.toggle.children = [block.toggle.children];
        }
        
        // Validate each child block
        block.toggle.children = block.toggle.children.map((child: any) => validateNotionBlock(child));
      }
      break;
    
    case 'code':
      if (!block.code.language) {
        block.code.language = "plain_text";
      }
      break;
    
    case 'callout':
      if (!block.callout.icon) {
        block.callout.icon = { type: "emoji", emoji: "💡" };
      }
      break;
    
    case 'image':
      // Ensure image has type and source properties
      if (!block.image) {
        block.image = { type: "external", external: { url: "" } };
      } else if (!block.image.type) {
        block.image.type = block.image.file ? "file" : "external";
      }
      
      if (block.image.type === "external" && !block.image.external) {
        block.image.external = { url: "" };
      }
      
      if (block.image.type === "file" && !block.image.file) {
        block.image.file = { url: "", expiry_time: new Date(Date.now() + 24*60*60*1000).toISOString() };
      }
      
      // Fix caption format if it exists but is in wrong format
      if (block.image.caption && !Array.isArray(block.image.caption)) {
        const caption = block.image.caption.toString();
        block.image.caption = [{ type: "text", text: { content: caption } }];
      }
      break;
    
    case 'file':
      // Ensure file has type and source properties
      if (!block.file) {
        block.file = { type: "external", external: { url: "" } };
      } else if (!block.file.type) {
        block.file.type = block.file.file ? "file" : "external";
      }
      
      if (block.file.type === "external" && !block.file.external) {
        block.file.external = { url: "" };
      }
      
      if (block.file.type === "file" && !block.file.file) {
        block.file.file = { url: "", expiry_time: new Date(Date.now() + 24*60*60*1000).toISOString() };
      }
      
      // Ensure name exists
      if (!block.file.name) {
        block.file.name = "Unnamed file";
      }
      
      // Fix caption format if it exists but is in wrong format
      if (block.file.caption && !Array.isArray(block.file.caption)) {
        const caption = block.file.caption.toString();
        block.file.caption = [{ type: "text", text: { content: caption } }];
      }
      break;
  }

  return block;
}

/**
 * Process content into proper block format based on format type
 * Enhanced with validation and type detection
 */
export function processContentByFormat(content: string, formatType: string): any[] {
  if (!content) {
    throw new Error('Content is required');
  }
  
  // Normalize format type and handle variations in naming
  const normalizedFormat = (formatType || '').toLowerCase().trim();
  
  // Create a block based on format type
  let block;
  
  // Add intelligent format detection if none specified
  if (!formatType || formatType === 'auto') {
    if (content.startsWith('# ')) {
      block = createHeading1Block(content.substring(2).trim());
    } else if (content.startsWith('## ')) {
      block = createHeading2Block(content.substring(3).trim());
    } else if (content.startsWith('### ')) {
      block = createHeading3Block(content.substring(4).trim());
    } else if (content.match(/^```[\s\S]*```$/)) {
      // Extract code and language from markdown code block
      const match = content.match(/^```(\w+)?\s*([\s\S]*?)```$/);
      const language = match?.[1] || 'plain_text';
      const code = match?.[2]?.trim() || content;
      block = createCodeBlock(code, language);
    } else if (content.match(/^>\s+.*$/m)) {
      block = createQuoteBlock(content.replace(/^>\s+/m, '').trim());
    } else if (content.match(/^-\s+\[\s*\]\s+.*$/m)) {
      block = createToDoBlock(content.replace(/^-\s+\[\s*\]\s+/m, '').trim(), false);
    } else if (content.match(/^-\s+\[x\]\s+.*$/mi)) {
      block = createToDoBlock(content.replace(/^-\s+\[x\]\s+/mi, '').trim(), true);
    } else if (content.match(/^-\s+.*$/m)) {
      block = createBulletedListItemBlock(content.replace(/^-\s+/m, '').trim());
    } else if (content.match(/^💡\s+.*$/m)) {
      block = createCalloutBlock(content.replace(/^💡\s+/m, '').trim());
    } else {
      // Default to paragraph if no patterns match
      block = createParagraphBlock(content);
    }
  } else {
    // If format type is specified, use appropriate block creator
    switch (normalizedFormat) {
      case 'paragraph':
      case 'text':
      case 'plain':
        block = createParagraphBlock(content);
        break;
        
    case 'heading':
    case 'heading1':
      case 'heading_1':
    case 'h1':
    case 'title':
        block = createHeading1Block(content);
        break;
      
    case 'heading2':
      case 'heading_2':
    case 'h2':
    case 'subtitle':
        block = createHeading2Block(content);
        break;
      
    case 'heading3':
      case 'heading_3':
    case 'h3':
        block = createHeading3Block(content);
        break;
      
    case 'bullet':
    case 'bulleted':
    case 'bulleted_list':
      case 'bulleted_list_item':
    case 'list':
        block = createBulletedListItemBlock(content);
        break;
        
      case 'number':
    case 'numbered':
    case 'numbered_list':
      case 'numbered_list_item':
    case 'ordered_list':
        block = createNumberedListItemBlock(content);
        break;
      
    case 'todo':
    case 'to_do':
      case 'to-do':
    case 'checklist':
    case 'task':
        block = createToDoBlock(content, false);
        break;
      
    case 'toggle':
    case 'dropdown':
        block = createToggleBlock(content);
        break;
      
    case 'code':
    case 'codeblock':
    case 'code_block':
        block = createCodeBlock(content);
        break;
        
      case 'quote':
      case 'blockquote':
        block = createQuoteBlock(content);
        break;
      
    case 'callout':
    case 'note':
      case 'notification':
        block = createCalloutBlock(content);
        break;
      
    default:
        console.warn(`Unknown format type: ${formatType}, defaulting to paragraph`);
        block = createParagraphBlock(content);
        break;
  }
  }
  
  // Return the block as an array to match the expected type, ensuring validation
  return [validateNotionBlock(block)];
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

// Add an explicit export for the validation function at the end of the file
// Create a new validated version of createToDoBlock
export function createValidatedToDoBlock(content: string, checked: boolean = false): any {
  const block = createToDoBlock(content, checked);
  
  // Ensure the block has the object property
  if (!block.object) {
    block.object = "block";
  }
  
  // Ensure checked property is defined
  if (block.to_do.checked === undefined) {
    block.to_do.checked = false;
  }
  
  // Ensure rich_text is properly structured
  if (!block.to_do.rich_text || !Array.isArray(block.to_do.rich_text)) {
    block.to_do.rich_text = [{ 
      type: "text", 
      text: { content: content || "" } 
    }];
  }
  
  return block;
} 