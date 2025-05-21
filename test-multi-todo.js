// Test for multiple to-do items in one command
import fetch from 'node-fetch';
import { config } from 'dotenv';
import { createToDoBlock } from './server/notion-blocks.js';

// Load environment variables
config();

const NOTION_API_TOKEN = process.env.NOTION_API_TOKEN;
const NOTION_API_BASE_URL = 'https://api.notion.com/v1';

// Test page ID (use the same one from before)
const testPageId = '1f859d07-3086-80ba-a0cd-c76142f4685e'; 

async function testMultiToDo() {
  console.log('Testing multiple to-do items');
  
  // Create two to-do blocks
  const todoBlocks = [
    createToDoBlock('Talk to Mooksh tomorrow at 8pm', false),
    createToDoBlock('Talk to Juhi tomorrow about why project in tasks page', false)
  ];
  
  console.log('To-do blocks structure:');
  console.log(JSON.stringify(todoBlocks, null, 2));
  
  // Make sure all blocks have the required object property
  todoBlocks.forEach(block => {
    if (!block.object) {
      block.object = 'block';
    }
  });
  
  try {
    // Try to add the to-do blocks to Notion
    console.log('Sending multiple to-do blocks to Notion API');
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
          children: todoBlocks
        })
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response from Notion API:');
      console.error(JSON.stringify(errorData, null, 2));
      throw new Error(`Error adding to-do blocks: ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Success! Response from Notion API:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error testing multiple to-do blocks:', error);
  }
}

// Run the test
testMultiToDo(); 