// Import the agent using ESM
import { createAgent } from './dist/server/agent.js';

/**
 * Test for multi-part commands with different formats
 */
async function testMultiPartCommands() {
  try {
    console.log('🧪 Testing multi-part commands');
    console.log('================================================');
    
    // Set production environment to avoid using the test mocks
    process.env.NODE_ENV = 'production';
    
    // Create agent instance
    const agent = await createAgent();
    
    // Test cases for multi-part commands
    const testCases = [
      { 
        name: "Quote to page and checklist",
        input: "I think we should work on making this better, add this as quote to personal thoughts page and add this as checklist: seems interesting have to revert back and see",
        expectedPhrases: ["personal thoughts", "Successfully"]
      },
      { 
        name: "Basic add as format to page",
        input: "add this as bullet to TEST MCP page",
        expectedPhrases: ["TEST MCP", "Successfully"]
      },
      { 
        name: "Add content with specific format",
        input: "Daily plan for today, add this as toggle to Notes page",
        expectedPhrases: ["Notes", "Successfully"]
      }
    ];
    
    // Process each test case
    console.log('\n--- Testing Multi-part Commands ---');
    let passedTests = 0;
    const totalTests = testCases.length;
    
    for (const testCase of testCases) {
      console.log(`\n## TEST: ${testCase.name}`);
      console.log(`Input: "${testCase.input}"`);
      
      try {
        // Send the command
        const initialResponse = await agent.chat(testCase.input);
        console.log('Response:', initialResponse.content);
        
        let finalResponse = initialResponse;
        
        // Check if confirmation is required and send it
        if (initialResponse.content.includes('CONFIRM?')) {
          console.log('Confirmation required, sending "yes"');
          finalResponse = await agent.chat('yes');
          console.log('Final response:', finalResponse.content);
        }
        
        // Validate results
        let passed = true;
        let errors = [];
        
        // Check for expected phrases in the response
        for (const phrase of testCase.expectedPhrases) {
          if (!finalResponse.content.toLowerCase().includes(phrase.toLowerCase())) {
            passed = false;
            errors.push(`- Missing expected phrase: "${phrase}"`);
          }
        }
        
        // Check for errors
        if (finalResponse.content.toLowerCase().includes('error')) {
          passed = false;
          errors.push('- Response contains an error message');
        }
        
        if (passed) {
          console.log("✅ TEST PASSED");
          passedTests++;
        } else {
          console.log("❌ TEST FAILED:");
          errors.forEach(error => console.log(error));
        }
      } catch (error) {
        console.error("❌ ERROR:", error);
      }
    }
    
    // Print summary
    console.log(`\n--- SUMMARY: ${passedTests}/${totalTests} tests passed ---`);
    
  } catch (error) {
    console.error('Error during tests:', error);
  }
}

// Run the test
testMultiPartCommands(); 