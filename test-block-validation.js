// Test for block validation and to-do creation
import fetch from 'node-fetch';
import { config } from 'dotenv';
import path from 'path';
import { validateNotionBlock, validateToDoBlock } from './server/block-validator.js';
import { createToDoBlock } from './server/notion-blocks.js';

// Load environment variables
config({ path: path.join(process.cwd(), '..', '.env') });
config({ path: path.join(process.cwd(), '.env') });

const NOTION_API_TOKEN = process.env.NOTION_API_TOKEN;
const NOTION_API_BASE_URL = 'https://api.notion.com/v1';

// Test page ID - use the same as other tests
const TEST_PAGE_ID = '1f859d07-3086-80ba-a0cd-c76142f4685e';

async function testToDoBlockCreation() {
  console.log('🔍 Testing to-do block creation and validation');
  
  try {
    // Create a to-do block using different methods
    console.log('Creating to-do blocks using different methods:');
    
    // Method 1: Using the block-validator directly
    const block1 = validateToDoBlock('Talk to Mooksh tomorrow at 8pm');
    console.log('\nMethod 1 (validateToDoBlock):');
    console.log(JSON.stringify(block1, null, 2));
    
    // Method 2: Using the notion-blocks.js creator
    const block2 = createToDoBlock('Talk to Juhi tomorrow about why project', false);
    console.log('\nMethod 2 (createToDoBlock):');
    console.log(JSON.stringify(block2, null, 2));
    
    // Method 3: Using validateNotionBlock on a basic structure
    const block3 = validateNotionBlock({
      type: 'to_do',
      to_do: {
        rich_text: [{ text: { content: 'Fix the Notion extension' } }],
        checked: false
      }
    });
    console.log('\nMethod 3 (validateNotionBlock):');
    console.log(JSON.stringify(block3, null, 2));
    
    // Try to add these blocks to a Notion page to see if they work
    console.log('\nSending blocks to Notion API...');
    const response = await fetch(
      `${NOTION_API_BASE_URL}/blocks/${TEST_PAGE_ID}/children`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${NOTION_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({
          children: [block1, block2, block3]
        })
      }
    );
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Successfully added blocks to Notion!');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Error from Notion API:');
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(data, null, 2));
    }
    
    console.log('\n🔍 Diagnosis:');
    console.log('1. The issue with your command is likely due to how the complex location is parsed');
    console.log('2. "Interesting prompts page in tasks page" is being interpreted incorrectly');
    console.log('3. The block validation might be failing when the multi-command handler processes your request');
    console.log('\n🛠 Recommendation:');
    console.log('Try using this alternative format: "Add to-do to talk to Mooksh tomorrow at 8pm to Tasks, in the Interesting prompts section"');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// Run the test
testToDoBlockCreation(); 