// Import the agent using ESM
import { createAgent } from './dist/server/agent.js';

/**
 * Test multi-part commands like "create page X and add checklist Y"
 */
async function testMultiPartCommands() {
  try {
    console.log('🧪 Testing multi-part command handling capabilities');
    console.log('================================================');
    
    // Create agent instance
    const agent = await createAgent();
    
    // Access the internal parseAction method directly for testing
    const parseAction = agent['parseAction'].bind(agent);
    
    // Test cases specifically for multi-part commands
    const testCases = [
      { 
        name: "Create and add checklist",
        input: "add a page book notes in personal thoughts, and add checklist to read start with why",
        expectedAction: "create",
        expectedPage: "book notes",
        expectedParentPage: "personal thoughts",
        expectedContent: "to read start with why",
        expectedFormatType: "checklist"
      },
      { 
        name: "Create and write",
        input: "create a meeting notes page and write summary of today's discussion",
        expectedAction: "create",
        expectedPage: "meeting notes",
        expectedContent: "summary of today's discussion"
      },
      { 
        name: "Create with section and checklist",
        input: "create a page Project Tasks in work and add checklist to contact clients",
        expectedAction: "create",
        expectedPage: "Project Tasks",
        expectedParentPage: "work",
        expectedContent: "to contact clients",
        expectedFormatType: "checklist"
      },
      { 
        name: "Create and add with quoted content",
        input: 'create a reading list page and add "The Great Gatsby, 1984, Brave New World"',
        expectedAction: "create",
        expectedPage: "reading list",
        expectedContent: "The Great Gatsby, 1984, Brave New World"
      }
    ];
    
    // Process each test case
    console.log('\n--- Testing Parser ---');
    let passedTests = 0;
    const totalTests = testCases.length;
    
    for (const testCase of testCases) {
      console.log(`\n## TEST: ${testCase.name}`);
      console.log(`Input: "${testCase.input}"`);
      
      try {
        // Parse the action
        const parsedAction = await parseAction(testCase.input);
        console.log('Parsed action:', JSON.stringify(parsedAction, null, 2));
        
        // Validate results
        let passed = true;
        let errors = [];
        
        if (parsedAction.action !== testCase.expectedAction) {
          passed = false;
          errors.push(`- Action mismatch: expected "${testCase.expectedAction}", got "${parsedAction.action}"`);
        }
        
        if (parsedAction.pageTitle !== testCase.expectedPage) {
          passed = false;
          errors.push(`- Page title mismatch: expected "${testCase.expectedPage}", got "${parsedAction.pageTitle}"`);
        }
        
        if (testCase.expectedParentPage && parsedAction.parentPage !== testCase.expectedParentPage) {
          passed = false;
          errors.push(`- Parent page mismatch: expected "${testCase.expectedParentPage}", got "${parsedAction.parentPage}"`);
        }
        
        if (testCase.expectedContent && !parsedAction.content) {
          passed = false;
          errors.push(`- Missing content: expected "${testCase.expectedContent}", got nothing`);
        } else if (testCase.expectedContent && !parsedAction.content.includes(testCase.expectedContent)) {
          passed = false;
          errors.push(`- Content mismatch: expected to contain "${testCase.expectedContent}", got "${parsedAction.content}"`);
        }
        
        if (testCase.expectedFormatType && parsedAction.formatType !== testCase.expectedFormatType) {
          passed = false;
          errors.push(`- Format type mismatch: expected "${testCase.expectedFormatType}", got "${parsedAction.formatType}"`);
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
    
    // Try a real full chat flow if in production environment
    if (process.env.NODE_ENV === 'production') {
      console.log("\n--- Testing full chat flow ---");
      console.log("This will attempt to create a real page in your Notion workspace.");
      
      const testInput = "add a page test-multipart in workspace, and add checklist to verify this works";
      console.log(`Sending: "${testInput}"`);
      
      // First chat should ask for confirmation
      const response1 = await agent.chat(testInput);
      console.log("Response:", response1);
      
      if (agent.get('requireConfirm')) {
        console.log("Confirmation required, sending 'yes'");
        // Confirm the action
        const response2 = await agent.chat("yes");
        console.log("Confirmation response:", response2);
      }
    }
    
  } catch (error) {
    console.error('Error during tests:', error);
  }
}

// Run the test
testMultiPartCommands(); 