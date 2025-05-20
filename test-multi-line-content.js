// Import the agent using ESM
import { createAgent } from './dist/server/agent.js';

/**
 * Test multi-line content handling
 */
async function testMultiLineContent() {
  try {
    console.log('🧪 Testing multi-line content handling');
    console.log('================================================');
    
    // Set test environment
    process.env.NODE_ENV = 'test';
    
    // Create agent instance
    const agent = await createAgent();
    
    // Test cases for multi-line content
    const testCases = [
      { 
        name: "Multi-line with 'user input:' prefix",
        input: "user input: add \"I am thinking to work\" and in second line \"alrigh tthis is ncie\" in personal thoughts page.",
        expectedPhrases: ["personal thoughts", "content", "Successfully"]
      },
      { 
        name: "Multi-line paragraphs",
        input: "user input: add this content\nFirst paragraph with some text\nSecond paragraph with more text\nThird paragraph to finish it up\nin TEST MCP page",
        expectedPhrases: ["TEST MCP", "Successfully"]
      },
      { 
        name: "Multi-line checklist",
        input: "user input: add as checklist\n- Buy groceries\n- Clean the house\n- Call mom\nin Todo page",
        expectedPhrases: ["Todo", "checklist", "Successfully"]
      }
    ];
    
    // Process each test case
    console.log('\n--- Testing Multi-line Content Processing ---');
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
testMultiLineContent(); 