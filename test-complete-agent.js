// End-to-end test for the agent with enhanced parser integration
import { config } from 'dotenv';
import path from 'path';

// Load environment variables from both parent directory and current directory
config({ path: path.join(process.cwd(), '..', '.env') });
config({ path: path.join(process.cwd(), '.env') });

// Test page ID - use the same as other tests
const TEST_PAGE_ID = '1f859d07-3086-80ba-a0cd-c76142f4685e';

// Dynamically import and test the agent
async function testCompleteAgent() {
  console.log('🔍 End-to-end test for agent with enhanced parser integration');
  
  try {
    // Use dynamic import since agent uses TypeScript
    const { createAgent } = await import('./server/agent.js');
    
    console.log('Creating agent with all components...');
    const agent = await createAgent();
    
    // Check if enhanced command handler is integrated
    const enhancedHandler = agent.get('enhancedCommandHandler');
    if (enhancedHandler) {
      console.log('✅ Enhanced command handler successfully integrated with agent');
    } else {
      console.log('❌ Enhanced command handler not found in agent');
      return;
    }
    
    // Test multi-command handling through agent's chat method
    console.log('\n🧪 Testing agent chat with multi-command: "add learn TypeScript in checklist and practice React in checklist too in Daily Tasks"');
    const result1 = await agent.chat(
      'add learn TypeScript in checklist and practice React in checklist too in Daily Tasks'
    );
    console.log('Response:', result1.content);
    
    // Test URL handling through agent's chat method
    console.log('\n🧪 Testing agent chat with URL: "add https://reactjs.org/ to Personal thoughts"');
    const result2 = await agent.chat(
      'add https://reactjs.org/ to Personal thoughts'
    );
    console.log('Response:', result2.content);
    
    console.log('\n🏁 End-to-end tests completed successfully');
  } catch (error) {
    console.error('❌ Error during end-to-end testing:', error);
    console.error(error.stack);
  }
}

// Run the test
testCompleteAgent(); 