// Import the agent using ESM
import { createAgent } from './dist/server/agent.js';

/**
 * Test for URLs with comment text
 */
async function testUrlWithComment() {
  try {
    console.log('🧪 Testing URLs with comment text');
    console.log('================================================');
    
    // Important: Set test environment
    process.env.NODE_ENV = 'test';
    
    // Create agent instance
    const agent = await createAgent();
    
    // Test cases for URL with comment handling
    const testCases = [
      { 
        name: "URL with add text",
        input: "https://platform.openai.com/settings/organization/usage add this link as URL in personal thoughts and add a text below.. this seems interesting have to revert back and see",
        expectedPhrases: ["Personal Thoughts", "link", "https://platform.openai.com"]
      },
      { 
        name: "URL at start no add this",
        input: "https://github.com/trending in Cool Plugins with note: interesting projects to check later",
        expectedPhrases: ["Cool Plugins", "link", "https://github.com"]
      }
    ];
    
    // Process each test case
    console.log('\n--- Testing URL Pattern with Comments ---');
    let passedTests = 0;
    const totalTests = testCases.length;
    
    for (const testCase of testCases) {
      console.log(`\n## TEST: ${testCase.name}`);
      console.log(`Input: "${testCase.input}"`);
      
      try {
        // Send the command
        const initialResponse = await agent.chat(testCase.input);
        console.log('Initial response:', initialResponse.content);
        
        let finalResponse = initialResponse;
        
        // Check if confirmation is required and send it
        if (initialResponse.content.includes('CONFIRM?')) {
          console.log('Sending confirmation...');
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
testUrlWithComment(); 