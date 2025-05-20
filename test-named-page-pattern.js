// Import the agent using ESM
import { createAgent } from './dist/server/agent.js';

/**
 * Test for the specific "create a page in X named Y and add Z" pattern
 */
async function testNamedPagePattern() {
  try {
    console.log('🧪 Testing "create a page in X named Y and add Z" pattern');
    console.log('================================================');
    
    // Set test environment
    process.env.NODE_ENV = 'test';
    
    // Create agent instance
    const agent = await createAgent();
    
    // Test cases specifically for this pattern
    const testCases = [
      { 
        name: "Basic named page and add content",
        input: "create a page in personal thoughts named january and add how u doing as checklist",
        expectedPhrases: ["personal thoughts", "january", "successfully"]
      },
      { 
        name: "Without format type",
        input: "create a page in work named Q1 Report and add meeting notes for discussion",
        expectedPhrases: ["work", "Q1 Report", "successfully"]
      },
      { 
        name: "With explicit format type",
        input: "create a page in projects named Website Redesign and add research competitor sites as bullet",
        expectedPhrases: ["projects", "Website Redesign", "successfully"]
      }
    ];
    
    // Process each test case
    console.log('\n--- Testing Named Page Pattern ---');
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
        
        // Also verify we don't have an error message
        if (finalResponse.content.toLowerCase().includes('error processing your request')) {
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
testNamedPagePattern(); 