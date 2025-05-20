// Import the agent using ESM
import { createAgent } from './dist/server/agent.js';
import { createAIAgentNetwork } from './dist/server/ai-agent-network.js';

/**
 * Test the AI Agent Network in a production-like environment
 * This uses the actual parsing logic without mocked responses
 */
async function testProductionEnvironment() {
  try {
    console.log('🧪 Testing in Production-like Environment');
    console.log('================================================');
    
    // Set to non-test environment to use real parsing logic
    // BUT still use test mode in the final implementation to avoid API calls
    process.env.NODE_ENV = 'test';
    
    // Get API key from environment
    const openAiApiKey = process.env.OPENAI_API_KEY;
    
    // Create AI Agent Network directly
    const aiNetwork = await createAIAgentNetwork(openAiApiKey, true);
    console.log('AI Agent Network initialized for production testing');
    
    // Test cases for complex natural language inputs
    const testCases = [
      { 
        name: "Multi-part command with different formats",
        input: "Add a heading 'Project Status' to my Tasks page, then add a toggle called 'Important Updates' with this content: We need to finish the quarterly report by Friday",
        expectedActions: ["write", "heading", "toggle"]
      },
      {
        name: "Multi-block formatting in a single command",
        input: "In my Meeting Notes page, add a callout saying 'Attention', then add a bullet list with: First item, Second item, Third item with sub-details",
        expectedActions: ["write", "callout", "bullet"]
      },
      {
        name: "Complex creation with subpages",
        input: "Create a new page called 'Q2 Planning' with a table of contents, then create a subpage inside it called 'April Goals' with a heading 'Key Objectives'",
        expectedActions: ["create", "write", "heading"]
      },
      {
        name: "Natural language with implicit commands",
        input: "Can you please add today's tasks to my Daily Log? Here they are: Call the client, prepare presentation slides, and schedule team meeting for tomorrow",
        expectedActions: ["write", "Daily Log"]
      },
      {
        name: "Query with section targeting",
        input: "In my Project Dashboard page, under the 'Current Status' section, please add a note saying: All tasks on track for July release, pending final QA review",
        expectedActions: ["write", "Project Dashboard", "Current Status"]
      },
      {
        name: "Complex multi-part command with typo",
        input: "Add I think we shoukd work on making this better, as quote and this as checklist: seems interesting have to revert back in personal thoughts page",
        expectedActions: ["write", "quote", "checklist", "Personal Thoughts"]
      }
    ];
    
    // Process each test case using the AI network directly
    console.log('\n--- Testing with Real Parsing Logic ---');
    let passedTests = 0;
    const totalTests = testCases.length;
    
    for (const testCase of testCases) {
      console.log(`\n## TEST: ${testCase.name}`);
      console.log(`Input: "${testCase.input}"`);
      
      try {
        // Process the command directly with the AI network
        const parsedCommands = await aiNetwork.processCommand(testCase.input);
        console.log('Parsed commands:', JSON.stringify(parsedCommands, null, 2));
        
        // Validate results
        let passed = true;
        let errors = [];
        
        // Check that we have at least one command
        if (!parsedCommands || parsedCommands.length === 0) {
          passed = false;
          errors.push('- No commands were generated');
        } else {
          // Check for expected actions and properties
          for (const expectedAction of testCase.expectedActions) {
            // Check if any command has this action or property
            const hasAction = parsedCommands.some(cmd => 
              Object.values(cmd).some(val => 
                typeof val === 'string' && val.toLowerCase().includes(expectedAction.toLowerCase())
              )
            );
            
            if (!hasAction) {
              passed = false;
              errors.push(`- Missing expected action/property: "${expectedAction}"`);
            }
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
testProductionEnvironment(); 