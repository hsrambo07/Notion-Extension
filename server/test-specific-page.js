/**
 * TEST SCRIPT - Adds content to a specific Notion page
 * 
 * Run with: node server/test-specific-page.js
 */

import { Client } from '@notionhq/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const notionApiToken = process.env.NOTION_API_TOKEN;

if (!notionApiToken) {
  console.error('ERROR: NOTION_API_TOKEN environment variable must be set');
  process.exit(1);
}

// Initialize Notion client
const notion = new Client({ auth: notionApiToken });

// IMPORTANT: Replace this with a page ID from your Notion workspace
// You can find a page ID by opening the page in browser and copying the ID from the URL
// Example URL: https://www.notion.so/myworkspace/My-Page-83c75a3075f94f2580f5439971e9c0c0
// Page ID would be: 83c75a3075f94f2580f5439971e9c0c0
const TEST_PAGE_ID = 'YOUR_PAGE_ID_HERE'; // ⚠️ REPLACE THIS ⚠️

async function addTestContent() {
  try {
    console.log('🔍 Adding test content to Notion page...');
    
    // Add a to-do item
    const todoResponse = await notion.blocks.children.append({
      block_id: TEST_PAGE_ID,
      children: [
        {
          object: 'block',
          type: 'to_do',
          to_do: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: 'Test to-do added by direct API test ' + new Date().toLocaleString()
                }
              }
            ],
            checked: false
          }
        }
      ]
    });

    console.log('✅ Success! To-do item added to page');
    console.log('API Response:', JSON.stringify(todoResponse, null, 2));
    
  } catch (error) {
    console.error('❌ Error adding content to Notion:', error);
    if (error.code === 'object_not_found') {
      console.error('📌 The page ID you provided might be incorrect or you don\'t have access to it.');
      console.error('Try finding a different page ID from your Notion workspace.');
    }
  }
}

// Run the test
addTestContent().catch(console.error); 