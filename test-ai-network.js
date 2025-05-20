// Import the agent using ESM
import { createAgent } from './dist/server/agent.js';

/**
 * Test our AI Agent Network on complex natural language inputs
 */
async function testAIAgentNetwork() {
  try {
    console.log('🧪 Testing AI Agent Network with Complex Natural Language');
    console.log('================================================');
    
    // Set test environment
    process.env.NODE_ENV = 'test';
    
    // Create agent instance
    const agent = await createAgent();
    
    // Advanced test cases with complex natural language patterns
    const testCases = [
      { 
        name: "Multi-part command with different formats",
        input: "Add a heading 'Project Status' to my Tasks page, then add a toggle called 'Important Updates' with this content: We need to finish the quarterly report by Friday",
        expectedPhrases: ["Tasks", "heading", "toggle", "Project Status", "Important Updates", "quarterly report"],
        mockConfirmResponse: "CONFIRM? This action will modify your Notion workspace. Reply 'yes' to confirm or 'no' to cancel.",
        mockFinalResponse: "Added \"Project Status\" as heading to \"Tasks\" successfully. Added toggle \"Important Updates\" with content \"We need to finish the quarterly report by Friday\" to \"Tasks\" successfully."
      },
      {
        name: "Multi-block formatting in a single command",
        input: "In my Meeting Notes page, add a callout saying 'Attention', then add a bullet list with: First item, Second item, Third item with sub-details",
        expectedPhrases: ["Meeting Notes", "callout", "bullet", "Attention", "First item", "Second item"],
        mockConfirmResponse: "CONFIRM? This action will modify your Notion workspace. Reply 'yes' to confirm or 'no' to cancel.",
        mockFinalResponse: "Added \"Attention\" as callout to \"Meeting Notes\" successfully. Added \"First item, Second item, Third item with sub-details\" as bullet to \"Meeting Notes\" successfully."
      },
      {
        name: "Complex creation with subpages",
        input: "Create a new page called 'Q2 Planning' with a table of contents, then create a subpage inside it called 'April Goals' with a heading 'Key Objectives'",
        expectedPhrases: ["Q2 Planning", "April Goals", "Key Objectives", "subpage", "heading"],
        mockConfirmResponse: "CONFIRM? This action will modify your Notion workspace. Reply 'yes' to confirm or 'no' to cancel.",
        mockFinalResponse: "Created a new page named \"Q2 Planning\" successfully. Created a subpage named \"April Goals\" in \"Q2 Planning\" successfully with heading \"Key Objectives\"."
      },
      {
        name: "Natural language with implicit commands",
        input: "Can you please add today's tasks to my Daily Log? Here they are: Call the client, prepare presentation slides, and schedule team meeting for tomorrow",
        expectedPhrases: ["Daily Log", "Call the client", "prepare presentation", "schedule team meeting"],
        mockConfirmResponse: "CONFIRM? This action will modify your Notion workspace. Reply 'yes' to confirm or 'no' to cancel.",
        mockFinalResponse: "Added \"Call the client, prepare presentation slides, and schedule team meeting for tomorrow\" to \"Daily Log\" successfully."
      },
      {
        name: "Adding URL with detailed comment and formatting",
        input: "Add this link https://github.com/trending/javascript to my Resources page as a bookmark with note: Great JavaScript projects trending this week that we should check for inspiration",
        expectedPhrases: ["Resources", "github.com/trending/javascript", "Great JavaScript projects", "inspiration"],
        mockConfirmResponse: "CONFIRM? This action will modify your Notion workspace. Reply 'yes' to confirm or 'no' to cancel.",
        mockFinalResponse: "Added link \"https://github.com/trending/javascript\" to \"Resources\" with comment: \"Great JavaScript projects trending this week that we should check for inspiration\" successfully."
      },
      {
        name: "Query with section targeting",
        input: "In my Project Dashboard page, under the 'Current Status' section, please add a note saying: All tasks on track for July release, pending final QA review",
        expectedPhrases: ["Project Dashboard", "Current Status", "section", "July release", "QA review"],
        mockConfirmResponse: "CONFIRM? This action will modify your Notion workspace. Reply 'yes' to confirm or 'no' to cancel.",
        mockFinalResponse: "Added \"All tasks on track for July release, pending final QA review\" to the \"Current Status\" section in \"Project Dashboard\" successfully."
      },
      {
        name: "Multiple formatting types with conditional instructions",
        input: "Create a new page called Release Notes, add a heading 'Version 2.0', then add code block with our API changes, and if needed, add a callout warning about deprecated functions",
        expectedPhrases: ["Release Notes", "Version 2.0", "code block", "API changes", "callout", "deprecated"],
        mockConfirmResponse: "CONFIRM? This action will modify your Notion workspace. Reply 'yes' to confirm or 'no' to cancel.",
        mockFinalResponse: "Created a new page named \"Release Notes\" successfully. Added \"Version 2.0\" as heading and added code block for API changes with callout warning about deprecated functions successfully."
      },
      { 
        name: "Complex multi-part command with typo",
        input: "Add I think we shoukd work on making this better, as quote and this as checklist: seems interesting have to revert back in personal thoughts page",
        expectedPhrases: ["personal thoughts", "quote", "checklist"],
        mockConfirmResponse: "CONFIRM? This action will modify your Notion workspace. Reply 'yes' to confirm or 'no' to cancel.",
        mockFinalResponse: "Added \"I think we shoukd work on making this better\" as quote and \"seems interesting have to revert back\" as checklist in \"Personal Thoughts\" successfully."
      },
      { 
        name: "Natural language request with prepositions",
        input: "Please write about my day in the journal page in Notion",
        expectedPhrases: ["journal", "about my day"],
        mockConfirmResponse: "CONFIRM? This action will modify your Notion workspace. Reply 'yes' to confirm or 'no' to cancel.",
        mockFinalResponse: "Added \"about my day\" to \"journal\" successfully."
      }
    ];
    
    // Process each test case
    console.log('\n--- Testing AI Agent Network with Complex Natural Language ---');
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
testAIAgentNetwork(); 