import { createAgent } from './dist/server/agent.js';

/**
 * Simple test for the agent to verify basic functionality
 */
async function testAgentBasics() {
  try {
    console.log('🧪 Testing basic agent functionality');
    console.log('================================================');
    
    // Set test environment
    process.env.NODE_ENV = 'test';
    
    // Create agent instance
    const agent = await createAgent();
    
    // Basic tests to verify agent is working
    const testCases = [
      { 
        name: "Debug info",
        input: "debug"
      },
      { 
        name: "Simple create page",
        input: "create a page called Test Page"
      },
      { 
        name: "Simple write",
        input: "write \"Hello World\" in TEST MCP"
      }
    ];
    
    // Run each test
    for (const testCase of testCases) {
      console.log(`\n## TEST: ${testCase.name}`);
      console.log(`Input: "${testCase.input}"`);
      
      try {
        // Send the command
        const response = await agent.chat(testCase.input);
        console.log('Response:', response.content);
        
        if (response.content && !response.content.includes('Error')) {
          console.log("✅ TEST PASSED");
        } else {
          console.log("❌ TEST FAILED");
        }
      } catch (error) {
        console.error("❌ ERROR:", error);
      }
    }
    
  } catch (error) {
    console.error('Error during tests:', error);
  }
}

// Run the test
testAgentBasics(); 