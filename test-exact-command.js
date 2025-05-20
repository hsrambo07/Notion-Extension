/**
 * Test for the exact command example provided by the user
 */

import { createAgent } from './dist/server/agent.js';

async function testExactCommand() {
  console.log('🎯 Testing Exact Command Example');
  console.log('==============================');
  
  // Use test mode to avoid real Notion API calls
  process.env.NODE_ENV = 'test';
  console.log('Environment:', process.env.NODE_ENV);
  
  // Create the agent
  console.log('Creating agent...');
  const agent = await createAgent();
  console.log('Agent created');
  
  // The exact example command
  const command = "> https://rahul-dev.medium.com/i-accidentally-became-a-ui-guy-522b3ec37ec5 add this as URL to personal thoughts page, with a checklist to send it to Mark";
  console.log('\nTesting command:', command);
  
  // Process the command
  const initialResponse = await agent.chat(command);
  console.log('\nInitial response:', initialResponse.content);
  
  if (initialResponse.content.includes('CONFIRM?')) {
    console.log('\nConfirmation required, confirming...');
    
    // Set confirmation flag and get final response
    agent.set('confirm', true);
    const finalResponse = await agent.chat('yes');
    console.log('\nFinal response:', finalResponse.content);
    
    // Validate the command was processed correctly
    if (finalResponse.content.includes('Could not determine which page')) {
      console.log('\n❌ FAILURE: Could not determine page name');
    } else if (finalResponse.content.includes('personal thoughts')) {
      console.log('\n✅ SUCCESS: Page name correctly extracted');
      
      if (finalResponse.content.includes('send it to Mark') && 
          finalResponse.content.includes('checklist')) {
        console.log('\n✅ SUCCESS: Checklist item correctly extracted');
      } else {
        console.log('\n❌ FAILURE: Checklist item not extracted');
      }
    } else {
      console.log('\n❓ UNCLEAR: Check response for details');
    }
  } else {
    // Direct response without confirmation
    if (initialResponse.content.includes('Could not determine which page')) {
      console.log('\n❌ FAILURE: Could not determine page name');
    } else if (initialResponse.content.includes('personal thoughts')) {
      console.log('\n✅ SUCCESS: Page name correctly extracted');
      
      if (initialResponse.content.includes('send it to Mark') && 
          initialResponse.content.includes('checklist')) {
        console.log('\n✅ SUCCESS: Checklist item correctly extracted');
      } else {
        console.log('\n❌ FAILURE: Checklist item not extracted');
      }
    } else {
      console.log('\n❓ UNCLEAR: Check response for details');
    }
  }
}

// Run the test
testExactCommand().catch(error => {
  console.error('Test failed with error:', error);
}); 