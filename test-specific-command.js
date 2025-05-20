// Import the agent using ESM
import { createAgent } from './dist/server/agent.js';

/**
 * Test for the specific command that was causing issues
 */
async function testSpecificCommand() {
  try {
    console.log('🧪 Testing specific problematic command');
    console.log('================================================');
    
    // Create agent instance with explicit production mode
    process.env.NODE_ENV = 'production';
    const agent = await createAgent();
    
    // The exact command that was causing the issue
    const command = "create a page in personal thoughts named january and add how u doing as checklist";
    
    console.log(`Input: "${command}"`);
    
    // Simulate confirmation flow
    const initialResponse = await agent.chat(command);
    console.log('Initial response:', initialResponse.content);
    
    if (initialResponse.content.includes('CONFIRM?')) {
      console.log('Sending confirmation...');
      const finalResponse = await agent.chat('yes');
      console.log('Final response:', finalResponse.content);
      
      // Check for error
      if (finalResponse.content.includes('Error')) {
        console.log('❌ TEST FAILED: Error detected in response');
      } else {
        console.log('✅ TEST PASSED: Command processed successfully');
      }
    } else {
      console.log('No confirmation required, test complete');
    }
    
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
testSpecificCommand(); 