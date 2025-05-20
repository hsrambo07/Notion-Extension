/**
 * Test for URL parsing with different formats
 * This script verifies that URL commands are parsed correctly
 */

import { createAgent } from './dist/server/agent.js';

async function testUrlParsing() {
  console.log('🔗 Testing URL Parsing');
  console.log('=====================');
  
  // Use test mode to avoid real Notion API calls
  process.env.NODE_ENV = 'test';
  console.log('Environment:', process.env.NODE_ENV);
  
  // Create the agent
  console.log('Creating agent...');
  const agent = await createAgent();
  console.log('Agent created');
  
  // Test various URL commands
  const testCases = [
    {
      name: "URL with explicit page name",
      command: "https://rahul-dev.medium.com/i-accidentally-became-a-ui-guy-522b3ec37ec5 add this as URL to personal thoughts page"
    },
    {
      name: "URL with explicit page name and checklist",
      command: "https://rahul-dev.medium.com/i-accidentally-became-a-ui-guy-522b3ec37ec5 add this as URL to personal thoughts page, with a checklist to send it to Mark"
    },
    {
      name: "URL as bookmark format",
      command: "add https://example.com as bookmark to my work page"
    },
    {
      name: "URL without format specification",
      command: "add https://developer.mozilla.org to my coding notes"
    }
  ];
  
  for (const test of testCases) {
    console.log(`\n\nTesting: ${test.name}`);
    console.log(`Command: "${test.command}"`);
    
    // Process the command
    const initialResponse = await agent.chat(test.command);
    console.log('Initial response:', initialResponse.content);
    
    if (initialResponse.content.includes('CONFIRM?')) {
      console.log('Confirmation required, confirming...');
      
      // Set confirmation flag and get final response
      agent.set('confirm', true);
      const finalResponse = await agent.chat('yes');
      console.log('Final response:', finalResponse.content);
      
      if (finalResponse.content.includes('Could not determine which page')) {
        console.log('❌ FAILURE: Could not determine page name');
      } else if (finalResponse.content.includes('personal thoughts') || 
                finalResponse.content.includes('work') || 
                finalResponse.content.includes('coding notes')) {
        console.log('✅ SUCCESS: Page name correctly extracted');
      } else {
        console.log('❓ UNCLEAR: Check response for details');
      }
    } else {
      if (initialResponse.content.includes('Could not determine which page')) {
        console.log('❌ FAILURE: Could not determine page name');
      } else if (initialResponse.content.includes('personal thoughts') || 
                initialResponse.content.includes('work') || 
                initialResponse.content.includes('coding notes')) {
        console.log('✅ SUCCESS: Page name correctly extracted');
      } else {
        console.log('❓ UNCLEAR: Check response for details');
      }
    }
  }
}

// Run the test
testUrlParsing().catch(error => {
  console.error('Test failed with error:', error);
}); 