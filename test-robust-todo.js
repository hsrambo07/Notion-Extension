// Test for robust to-do block handling with validation
import fetch from 'node-fetch';
import { config } from 'dotenv';
import * as NotionBlocks from './server/notion-blocks.js';
import { validateNotionBlock, validateToDoBlock } from './server/block-validator.js';
const { createToDoBlock } = NotionBlocks;

// Load environment variables
config();

const NOTION_API_TOKEN = process.env.NOTION_API_TOKEN;
const NOTION_API_BASE_URL = 'https://api.notion.com/v1';

// Test page ID (replace with a test page from your workspace)
const testPageId = '1f859d07-3086-80ba-a0cd-c76142f4685e'; 

async function testRobustToDoBlocks() {
  console.log('Testing robust to-do block handling with full validation');
  
  // Test cases: different forms of potentially problematic to-do blocks
  const testCases = [
    {
      name: "Basic to-do",
      block: createToDoBlock("Basic to-do item", false)
    },
    {
      name: "Missing object property",
      block: {
        type: "to_do",
        to_do: {
          rich_text: [{ type: "text", text: { content: "Missing object property" } }],
          checked: false
        }
      }
    },
    {
      name: "Malformed rich_text (not an array)",
      block: {
        object: "block",
        type: "to_do",
        to_do: {
          rich_text: { type: "text", text: { content: "Rich text is not an array" } },
          checked: false
        }
      }
    },
    {
      name: "Missing checked property",
      block: {
        object: "block",
        type: "to_do",
        to_do: {
          rich_text: [{ type: "text", text: { content: "Missing checked property" } }]
        }
      }
    },
    {
      name: "Missing text.content property",
      block: {
        object: "block",
        type: "to_do",
        to_do: {
          rich_text: [{ type: "text", text: {} }],
          checked: false
        }
      }
    },
    {
      name: "Completely empty to_do property",
      block: {
        object: "block",
        type: "to_do",
        to_do: {}
      }
    }
  ];
  
  // Validate and fix all test blocks
  for (const testCase of testCases) {
    console.log(`\n🧪 Testing case: "${testCase.name}"`);
    
    console.log("Original block:");
    console.log(JSON.stringify(testCase.block, null, 2));
    
    // Apply validation to each block
    const validatedBlock = validateNotionBlock(testCase.block);
    
    console.log("After validation:");
    console.log(JSON.stringify(validatedBlock, null, 2));
    
    try {
      // Test sending to Notion API
      console.log(`Sending "${testCase.name}" block to Notion API`);
      const response = await fetch(
        `${NOTION_API_BASE_URL}/blocks/${testPageId}/children`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${NOTION_API_TOKEN}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28'
          },
          body: JSON.stringify({
            children: [validatedBlock]
          })
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error response from Notion API:');
        console.error(JSON.stringify(errorData, null, 2));
        console.error(`Test case "${testCase.name}" FAILED`);
      } else {
        const data = await response.json();
        console.log('✅ Success! Response from Notion API:');
        console.log(`Test case "${testCase.name}" PASSED`);
      }
    } catch (error) {
      console.error(`❌ Error testing case "${testCase.name}":`, error);
    }
  }
  
  // Additional test: multiple to-do items at once
  try {
    console.log("\n🧪 Testing multiple to-do items at once");
    
    // Create several to-do items with varied formats
    const multipleBlocks = [
      validateNotionBlock(createToDoBlock("First item in batch", false)),
      validateNotionBlock({
        type: "to_do",
        to_do: {
          rich_text: [{ type: "text", text: { content: "Second item with missing object property" } }],
          checked: true
        }
      }),
      validateNotionBlock({
        object: "block",
        type: "to_do",
        to_do: {
          rich_text: { type: "text", text: { content: "Third item with rich_text not as array" } },
          checked: false
        }
      })
    ];
    
    console.log("Sending multiple blocks to Notion API");
    const response = await fetch(
      `${NOTION_API_BASE_URL}/blocks/${testPageId}/children`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${NOTION_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({
          children: multipleBlocks
        })
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error response from Notion API:');
      console.error(JSON.stringify(errorData, null, 2));
      console.error("Multiple to-do items test FAILED");
    } else {
      const data = await response.json();
      console.log('✅ Success! All multiple to-do items added');
      console.log("Multiple to-do items test PASSED");
    }
  } catch (error) {
    console.error('❌ Error testing multiple to-do items:', error);
  }
  
  console.log('\n🏁 All tests completed');
}

// Run the tests
testRobustToDoBlocks(); 