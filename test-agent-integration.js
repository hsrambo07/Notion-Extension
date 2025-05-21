// End-to-end test for the agent with enhanced parser integration
import fetch from 'node-fetch';
import { config } from 'dotenv';
import path from 'path';
import { createEnhancedCommandHandler } from './server/integrator.js';
import { validateNotionBlock } from './server/block-validator.js';
import { createToDoBlock } from './server/notion-blocks.js';

// Load environment variables from both parent directory and current directory
config({ path: path.join(process.cwd(), '..', '.env') });
config({ path: path.join(process.cwd(), '.env') });

const NOTION_API_TOKEN = process.env.NOTION_API_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const NOTION_API_BASE_URL = 'https://api.notion.com/v1';

// Test page ID - use the same as other tests
const TEST_PAGE_ID = '1f859d07-3086-80ba-a0cd-c76142f4685e';

async function testAgentIntegration() {
  console.log('🔍 Testing agent integration with enhanced parser and Notion API');
  
  try {
    // Create enhanced command handler
    console.log('Creating enhanced command handler...');
    const enhancedHandler = await createEnhancedCommandHandler(OPENAI_API_KEY, false);
    
    if (!enhancedHandler) {
      console.log('❌ Failed to create enhanced command handler');
      return;
    }
    
    console.log('✅ Enhanced command handler created successfully');
    
    // Test multi-command parsing
    console.log('\n🧪 Testing multi-command: "add learn TypeScript in checklist and practice React in checklist too in Daily Tasks"');
    const commands = await enhancedHandler.processCommand('add learn TypeScript in checklist and practice React in checklist too in Daily Tasks');
    console.log('Parsed commands:', JSON.stringify(commands, null, 2));
    
    // Convert the commands to Notion blocks
    const blocks = commands.map(command => {
      if (command.formatType === 'checklist' || command.formatType === 'to_do') {
        return validateNotionBlock(createToDoBlock(command.content, false));
      }
      return null;
    }).filter(block => block !== null);
    
    console.log('Notion blocks:', JSON.stringify(blocks, null, 2));
    
    // Send the blocks to Notion API
    console.log('Sending blocks to Notion API...');
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
          children: blocks
        })
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response from Notion API:', JSON.stringify(errorData, null, 2));
      throw new Error(`Error adding blocks: ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Success! Response from Notion API:', JSON.stringify(data, null, 2));
    
    console.log('\n🏁 Integration test completed successfully');
  } catch (error) {
    console.error('❌ Error during integration testing:', error);
    console.error(error.stack);
  }
}

// Run the test
testAgentIntegration(); 