// Import the agent using ESM
import { createAgent } from './dist/server/agent.js';

/**
 * Test the AI Agent Network with real production Notion changes to TEST MCP page
 */
async function testRealProduction() {
  try {
    console.log('🧪 Testing with Real Production Changes to TEST MCP');
    console.log('================================================');
    
    // Set to production-like environment but still be careful
    // We'll only modify TEST MCP page which is safe for testing
    process.env.NODE_ENV = 'production';
    
    // Create agent instance
    const agent = await createAgent();
    console.log('Agent created and initialized for real production testing');
    
    // Test cases focused on TEST MCP page with real changes
    const testCases = [
      { 
        name: "Multi-format content to TEST MCP",
        input: "Add a heading 'Production Test Results' to TEST MCP page, then add a toggle called 'Test Details' with this content: This is a real production test of the AI Agent Network",
        expectedPhrases: ["Added", "heading", "TEST MCP", "toggle"]
      },
      {
        name: "Multiple block formats to TEST MCP",
        input: "In my TEST MCP page, add a callout saying 'Important Notice', then add a bullet list with: First test item, Second test item, Third test with details",
        expectedPhrases: ["Added", "callout", "bullet", "TEST MCP"]
      },
      {
        name: "Code block with comments to TEST MCP",
        input: "Add this code to TEST MCP page: ```javascript\n// Test function\nfunction testAI() {\n  console.log('Testing AI Agent');\n}\n```",
        expectedPhrases: ["Added", "code", "TEST MCP"]
      },
      {
        name: "Natural language request to TEST MCP",
        input: "Could you please add a note to TEST MCP that says we tested the AI Agent Network on this date?",
        expectedPhrases: ["Added", "TEST MCP"]
      }
    ];
    
    // Process each test case
    console.log('\n--- Testing with Real Changes to TEST MCP ---');
    let passedTests = 0;
    const totalTests = testCases.length;
    
    for (const testCase of testCases) {
      console.log(`\n## TEST: ${testCase.name}`);
      console.log(`Input: "${testCase.input}"`);
      
      try {
        // First send the command
        const initialResponse = await agent.chat(testCase.input);
        console.log('Initial response:', initialResponse.content);
        
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
        
        // Check for error messages
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
        
        // Sleep for 2 seconds between tests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error("❌ ERROR:", error);
      }
    }
    
    // Print summary
    console.log(`\n--- SUMMARY: ${passedTests}/${totalTests} tests passed ---`);
    
    // Finally, add a cleanup message
    console.log("\nNOTE: Test content has been added to your TEST MCP page. You may want to clean it up manually.");
    
  } catch (error) {
    console.error('Error during tests:', error);
  }
}

// Run the real production test
testRealProduction(); 