// Test script to verify the enhanced parser integration
import { createAgent } from './server/agent.js';

// Ensure we're running as an ES module
await new Promise(resolve => setTimeout(resolve, 0));

async function testEnhancedParser() {
  console.log('🔍 Testing enhanced parser integration');
  
  try {
    // Create agent with enhanced parser
    console.log('Creating agent with enhanced parser integration...');
    const agent = await createAgent();
    
    // Verify if enhancedCommandHandler was properly set
    const enhancedHandler = agent.get('enhancedCommandHandler');
    if (enhancedHandler) {
      console.log('✅ Enhanced command handler successfully integrated');
    } else {
      console.log('❌ Enhanced command handler not integrated properly');
      return;
    }
    
    // Test a multi-command scenario
    console.log('\n🧪 Testing multi-command parsing: "add milk in checklist and eggs in checklist too in Shopping"');
    const result1 = await agent.chat('add milk in checklist and eggs in checklist too in Shopping');
    console.log('Response:', result1.content);
    
    // Test a URL command scenario
    console.log('\n🧪 Testing URL parsing: "add https://example.com to Personal thoughts page"');
    const result2 = await agent.chat('add https://example.com to Personal thoughts page');
    console.log('Response:', result2.content);
    
    // Test a complex format command
    console.log('\n🧪 Testing complex format: "add meeting notes as toggle and action items as to_do in Work"');
    const result3 = await agent.chat('add meeting notes as toggle and action items as to_do in Work');
    console.log('Response:', result3.content);
    
    console.log('\n🏁 All integration tests completed');
  } catch (error) {
    console.error('❌ Error during integration testing:', error);
  }
}

// Run the test
testEnhancedParser(); 