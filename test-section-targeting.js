// Import the agent using ESM
import { createAgent } from './dist/server/agent.js';

/**
 * Test for section targeting functionality
 */
async function testSectionTargeting() {
  try {
    console.log('🧪 Testing section targeting functionality');
    console.log('================================================');
    
    // Set test environment
    process.env.NODE_ENV = 'test';
    
    // Create agent instance
    const agent = await createAgent();
    
    // Test cases for section targeting
    const testCases = [
      { 
        name: "Basic section targeting",
        input: "Add 'New task item' in the Tasks section of my TEST MCP page",
        expectedPhrases: ["TEST MCP", "Tasks section", "Successfully"]
      },
      { 
        name: "Under section pattern",
        input: "Add 'Important meeting tomorrow at 2pm' under the Important section in Notes page",
        expectedPhrases: ["Notes", "Important section", "Successfully"]
      },
      { 
        name: "Beneath section pattern",
        input: "Write 'Remember to follow up with client' beneath the Follow-ups section of Projects page",
        expectedPhrases: ["Projects", "Follow-ups section", "Successfully"]
      },
      {
        name: "Multi-line with section placement",
        input: "user input: add to the Goals section of my Roadmap page\n- Complete project planning\n- Schedule team meeting\n- Finalize budget",
        expectedPhrases: ["Roadmap", "Goals section", "Successfully"]
      }
    ];
    
    // Process each test case
    console.log('\n--- Testing Section Targeting ---');
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
testSectionTargeting(); 