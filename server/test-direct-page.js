/**
 * TEST SCRIPT - List all Notion pages and add content to Tasks page
 * 
 * Run with: node server/test-direct-page.js
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

async function listAllPages() {
  console.log('🔍 Listing all available Notion pages...');
  
  try {
    const response = await notion.search({
      filter: {
        property: 'object',
        value: 'page'
      }
    });
    
    if (response.results.length === 0) {
      console.log('No pages found in your Notion workspace');
      return null;
    }
    
    // Display all pages
    console.log(`Found ${response.results.length} pages:`);
    
    response.results.forEach((page, index) => {
      let title = "Untitled";
      
      // Extract title from various possible formats
      if (page.properties && page.properties.title) {
        const titleProp = page.properties.title;
        if (Array.isArray(titleProp.title)) {
          title = titleProp.title.map(t => t.plain_text || '').join('');
        }
      } else if (page.title) {
        if (Array.isArray(page.title)) {
          title = page.title.map(t => t.plain_text || '').join('');
        } else {
          title = page.title.toString();
        }
      }
      
      console.log(`${index + 1}. "${title}" (ID: ${page.id})`);
    });
    
    // Look for Tasks page specifically
    const tasksPage = response.results.find(page => {
      let title = "";
      
      if (page.properties && page.properties.title) {
        const titleProp = page.properties.title;
        if (Array.isArray(titleProp.title)) {
          title = titleProp.title.map(t => t.plain_text || '').join('');
        }
      } else if (page.title) {
        if (Array.isArray(page.title)) {
          title = page.title.map(t => t.plain_text || '').join('');
        } else {
          title = page.title.toString();
        }
      }
      
      return title.toLowerCase() === 'tasks';
    });
    
    return tasksPage ? tasksPage.id : null;
  } catch (error) {
    console.error('Error listing Notion pages:', error);
    return null;
  }
}

async function addContentToTasksPage(pageId) {
  if (!pageId) {
    console.error('❌ No Tasks page found. Please create a page named "Tasks" in your Notion workspace.');
    return;
  }
  
  console.log(`🔍 Adding test content to Tasks page (${pageId})...`);
  
  try {
    // Add a to-do item
    const todoResponse = await notion.blocks.children.append({
      block_id: pageId,
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

    console.log('✅ Success! To-do item added to Tasks page');
    
  } catch (error) {
    console.error('❌ Error adding content to Tasks page:', error);
    if (error.code === 'object_not_found') {
      console.error('📌 The page ID you provided might be incorrect or you don\'t have access to it.');
    }
  }
}

// Run the test
async function runTest() {
  const tasksPageId = await listAllPages();
  if (tasksPageId) {
    await addContentToTasksPage(tasksPageId);
  }
}

runTest().catch(console.error); 