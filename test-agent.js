import { createAgent } from './server/agent.js';

async function testVariousCommands() {
  try {
    console.log('Testing Notion Agent with different page names and commands...');
    
    // Create agent instance
    const agent = await createAgent();
    const useOpenAI = !!process.env.OPENAI_API_KEY && process.env.NODE_ENV !== 'test';
    
    console.log(`Testing in ${useOpenAI ? 'OpenAI mode' : 'test environment mode'}`);
    
    // Test cases with different page names and formats
    const testCases = [
      {
        input: 'In Notion, write "Testing generic page handling" in TEST MCP',
        expectedPage: 'TEST MCP'
      },
      {
        input: 'In Notion, write "Meeting notes for today" in Project Updates page',
        expectedPage: 'Project Updates'
      },
      {
        input: 'Write "Shopping list" in Todo List',
        expectedPage: 'Todo List'
      },
      {
        input: 'Create a new page called Weekly Tasks',
        expectedPage: 'Weekly Tasks'
      },
      {
        input: 'In the Bruh page, add "New ideas for the project"',
        expectedPage: 'Bruh'
      },
      {
        input: 'Add a new item "Buy milk" to the Shopping List',
        expectedPage: 'Shopping List'
      },
      {
        input: 'Can you write "This is a test" in my Personal Journal?',
        expectedPage: 'Personal Journal'
      },
      {
        input: 'I need to save "Remember to call John" in Reminders',
        expectedPage: 'Reminders'
      }
    ];
    
    let passedTests = 0;
    let totalTests = testCases.length;
    
    // Test each case
    for (const [index, testCase] of testCases.entries()) {
      console.log(`\n=== Test ${index + 1}: "${testCase.input}" ===`);
      
      // Use the parseAction method directly to verify parsing
      const parseAction = agent['parseAction'].bind(agent);
      const result = await parseAction(testCase.input);
      
      console.log('Parsed result:', result);
      
      // Check if the page name was correctly extracted
      if (result.pageTitle === testCase.expectedPage) {
        console.log(`✅ SUCCESS: Correctly identified "${testCase.expectedPage}" as the page name`);
        passedTests++;
      } else {
        console.log(`❌ ERROR: Expected "${testCase.expectedPage}" but got "${result.pageTitle || 'undefined'}"`);
      }
    }
    
    console.log(`\n=== Summary: ${passedTests}/${totalTests} tests passed ===`);
    
    // Now test a full request flow
    console.log('\n=== Testing full request flow ===');
    console.log('Sending request: In Notion, write "Full flow test at ' + new Date().toISOString() + '" in TEST MCP');
    
    const response = await agent.chat('In Notion, write "Full flow test at ' + new Date().toISOString() + '" in TEST MCP');
    console.log('Response:', response);
    
    if (agent.get('requireConfirm')) {
      console.log('Confirmation required, sending confirmation...');
      const confirmResponse = await agent.chat('yes');
      console.log('Confirmation response:', confirmResponse);
    }
    
    console.log('\nAll tests completed!');
  } catch (error) {
    console.error('Error during tests:', error);
  }
}

// Run the tests
testVariousCommands(); 