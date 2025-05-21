 /**
 * Block Validator Module - Ensures Notion API blocks are properly formatted
 * This module helps prevent common issues with missing or invalid properties
 */

/**
 * Validates and ensures a Notion block has all required properties
 * This helps prevent "undefined" errors when sending blocks to the Notion API
 */
export function validateNotionBlock(block) {
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
    block[block.type].rich_text = block[block.type].rich_text.map((textItem) => {
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
        block.toggle.children = block.toggle.children.map((child) => validateNotionBlock(child));
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
 * Utility function to validate to-do blocks specifically 
 */
export function validateToDoBlock(block) {
  // Handle cases where we get just the content string
  if (typeof block === 'string') {
    return {
      object: 'block',
      type: 'to_do',
      to_do: {
        rich_text: [{ type: 'text', text: { content: block } }],
        checked: false
      }
    };
  }
  
  // Ensure it's a to_do type
  if (!block.type) {
    block.type = 'to_do';
  }
  
  // Ensure object property
  if (!block.object) {
    block.object = 'block';
  }
  
  // Ensure to_do property exists
  if (!block.to_do) {
    block.to_do = {};
  }
  
  // Ensure rich_text property exists and is an array
  if (!block.to_do.rich_text || !Array.isArray(block.to_do.rich_text)) {
    const content = 
      (block.to_do.rich_text?.text?.content) || 
      (typeof block.to_do.rich_text === 'string' ? block.to_do.rich_text : '');
    
    block.to_do.rich_text = [{ 
      type: 'text', 
      text: { content: content || '' } 
    }];
  }
  
  // Ensure checked property is defined
  if (block.to_do.checked === undefined) {
    block.to_do.checked = false;
  }
  
  return block;
} 