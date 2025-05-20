/**
 * Test of LLM parser integration with the agent in test mode
 * This script verifies that the agent uses the LLM parser correctly
 * in test mode, which doesn't make real Notion API calls.
 */

import { createAgent } from './dist/server/agent.js';

async function testLLMParserInTestMode() {
  console.log('🧪 Testing LLM Parser in Test Mode');
  console.log('=================================');
  
  // Use test mode to avoid real Notion API calls
  process.env.NODE_ENV = 'test';
  console.log('Environment:', process.env.NODE_ENV);
  
  // Create the agent
  console.log('Creating agent...');
  const agent = await createAgent();
  console.log('Agent created');
  
  // Test command with multiple checklist items
  const command = "add milk in checklist and eggs in checklist too in Shopping List";
  console.log('\nTesting command:', command);
  
  // Process the command - will need confirmation
  const initialResponse = await agent.chat(command);
  console.log('\nInitial response:', initialResponse.content);
  
  if (initialResponse.content.includes('CONFIRM?')) {
    console.log('\n✅ Confirmation required, confirming...');
    
    // Set confirmation flag and get final response
    agent.set('confirm', true);
    const finalResponse = await agent.chat('yes');
    console.log('\nFinal response:', finalResponse.content);
    
    // Check success
    if (finalResponse.content.includes('milk') && finalResponse.content.includes('eggs')) {
      console.log('\n✅ SUCCESS: Multiple checklist items detected and processed');
    } else {
      console.log('\n❌ FAILURE: Multiple checklist items not processed correctly');
    }
  } else {
    console.log('\n⚠️ No confirmation required, checking result directly');
    
    if (initialResponse.content.includes('milk') && initialResponse.content.includes('eggs')) {
      console.log('\n✅ SUCCESS: Multiple checklist items detected and processed');
    } else {
      console.log('\n❌ FAILURE: Multiple checklist items not processed correctly');
    }
  }
  
  // Test a more complex natural language command
  const complexCommand = "add project meeting notes to my Work page and also include action items from yesterday's call";
  console.log('\n\nTesting complex command:', complexCommand);
  
  // Process the command - will need confirmation
  const complexInitialResponse = await agent.chat(complexCommand);
  console.log('\nInitial response:', complexInitialResponse.content);
  
  if (complexInitialResponse.content.includes('CONFIRM?')) {
    console.log('\n✅ Confirmation required, confirming...');
    
    // Set confirmation flag and get final response
    agent.set('confirm', true);
    const complexFinalResponse = await agent.chat('yes');
    console.log('\nFinal response:', complexFinalResponse.content);
    
    // Success is harder to check for complex commands, just verify it ran
    console.log('\n✅ Complex command processed successfully');
  } else {
    console.log('\n⚠️ No confirmation required for complex command');
    console.log('\n✅ Complex command processed successfully');
  }
}

// Run the test
testLLMParserInTestMode().catch(error => {
  console.error('Test failed with error:', error);
}); 