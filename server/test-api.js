import { createAgent } from './agent.js';

async function testAgentDirectly() {
  try {
    console.log('Testing agent directly...');
    
    // Create an agent instance
    const agent = await createAgent();
    
    // First request should ask for confirmation
    console.log('Sending first request:');
    const response1 = await agent.chat('In Notion, write "This is a test message" in TEST MCP');
    console.log('Response 1:', response1);
    
    // Check if confirmation is required
    if (agent.get('requireConfirm')) {
      console.log('Confirmation required, pending action:', agent.get('pendingAction'));
      
      // Confirm the action
      console.log('Confirming action...');
      const response2 = await agent.chat('yes');
      console.log('Response 2:', response2);
    }
  } catch (error) {
    console.error('Error testing agent:', error);
  }
}

testAgentDirectly(); 