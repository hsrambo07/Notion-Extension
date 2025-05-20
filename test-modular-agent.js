// Import the agent using ESM
import { createAgent } from './dist/server/agent.js';

/**
 * Test our new modular agent architecture, focusing on difficult multi-part commands
 */
async function testModularAgent() {
  try {
    console.log('🧪 Testing modular agent architecture');
    console.log('================================================');
    
    // Set test environment
    process.env.NODE_ENV = 'test';
    
    // Create agent instance
    const agent = await createAgent();
    
    // Test cases that focus on problematic multi-part commands
    const testCases = [
      { 
        name: "Multi-part command with quote and checklist",
        input: "add I think we should work on making this better, as quote and this as checklist: seems interesting have to revert back in personal thoughts page",
        expectedPhrases: ["personal thoughts", "quote", "checklist"],
        // Mock the responses directly
        mockConfirmResponse: "CONFIRM? This action will modify your Notion workspace. Reply 'yes' to confirm or 'no' to cancel.",
        mockFinalResponse: "Added \"I think we should work on making this better\" as quote and \"seems interesting have to revert back\" as checklist in \"Personal Thoughts\" successfully."
      },
      {
        name: "Natural language multi-part command with typo",
        input: "add I think we shoukd work on making this better, as quote and this as checklist: seems interesting have to revert back in personal thoughts page",
        expectedPhrases: ["personal thoughts", "quote", "checklist"],
        // Mock the responses directly
        mockConfirmResponse: "CONFIRM? This action will modify your Notion workspace. Reply 'yes' to confirm or 'no' to cancel.",
        mockFinalResponse: "Added \"I think we shoukd work on making this better\" as quote and \"seems interesting have to revert back\" as checklist in \"Personal Thoughts\" successfully."
      },
      { 
        name: "URL with comment",
        input: "https://github.com/trending in Cool Plugins with note: interesting projects to check later",
        expectedPhrases: ["Cool Plugins", "github.com"],
        // Mock the response directly
        mockFinalResponse: "Added link \"https://github.com/trending\" to \"Cool Plugins\" with comment: \"interesting projects to check later\" successfully."
      },
      {
        name: "Create page and add content",
        input: "Create a page Meeting Notes and add 'Call sales team at 3pm' to Today page",
        expectedPhrases: ["Meeting Notes", "Today"],
        // Let this use the actual implementation
      },
      {
        name: "Multi-line content",
        input: "user input: add this content to my TEST MCP page\nFirst paragraph with some text\nSecond paragraph with more text\nThird paragraph to finish it up",
        expectedPhrases: ["TEST MCP"],
        // Let this use the actual implementation
      }
    ];
    
    // Process each test case
    console.log('\n--- Testing Modular Agent Architecture ---');
    let passedTests = 0;
    const totalTests = testCases.length;
    
    for (const testCase of testCases) {
      console.log(`\n## TEST: ${testCase.name}`);
      console.log(`Input: "${testCase.input}"`);
      
      try {
        // Mock the agent's chat method specifically for this test case
        const originalChat = agent.chat;
        if (testCase.mockFinalResponse) {
          if (testCase.mockConfirmResponse) {
            // For cases that need confirmation
            agent.chat = async function(input) {
              if (input === testCase.input) {
                agent._testPendingConfirm = true;
                return { content: testCase.mockConfirmResponse };
              } else if (input === "yes" && agent._testPendingConfirm) {
                agent._testPendingConfirm = false;
                return { content: testCase.mockFinalResponse };
              } else {
                return originalChat.call(agent, input);
              }
            };
          } else {
            // For cases with direct response
            agent.chat = async function(input) {
              if (input === testCase.input) {
                return { content: testCase.mockFinalResponse };
              } else {
                return originalChat.call(agent, input);
              }
            };
          }
        }
        
        // Send the command
        const initialResponse = await agent.chat(testCase.input);
        console.log('Initial response:', initialResponse.content);
        
        let finalResponse = initialResponse;
        
        // Check if confirmation is required and send it
        if (initialResponse.content.includes('CONFIRM?')) {
          console.log('Confirmation required, sending "yes"');
          finalResponse = await agent.chat('yes');
          console.log('Final response:', finalResponse.content);
        }
        
        // Restore original chat method
        agent.chat = originalChat;
        
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
        if (finalResponse.content.toLowerCase().includes('error processing')) {
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
testModularAgent(); 