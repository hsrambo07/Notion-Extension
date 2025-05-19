import { createAgent } from './server/agent.js';
import { config } from 'dotenv';

// Load environment variables
config();

// Temporarily override NODE_ENV to force live API calls
process.env.NODE_ENV = 'production';

async function runLiveTest() {
  try {
    console.log('🚀 Running LIVE Notion API test - THIS WILL MODIFY YOUR NOTION WORKSPACE');
    console.log('Time:', new Date().toISOString());
    
    // Create agent instance with live API access
    const agent = await createAgent();
    
    // Test cases to run with live API
    const testCases = [
      {
        name: 'Write to TEST MCP',
        command: `In Notion, write "LIVE API TEST: Writing to TEST MCP at ${new Date().toISOString()}" in TEST MCP`,
        expectedPage: 'TEST MCP'
      },
      {
        name: 'Write to Bruh page',
        command: `In the Bruh page, add "LIVE API TEST: Testing the Bruh page at ${new Date().toISOString()}"`,
        expectedPage: 'Bruh'
      }
    ];
    
    // Run each test case
    for (const [index, testCase] of testCases.entries()) {
      console.log(`\n===== Test ${index + 1}: ${testCase.name} =====`);
      console.log(`Command: "${testCase.command}"`);
      
      // First request will ask for confirmation
      const writeResponse = await agent.chat(testCase.command);
      console.log('Initial response:', writeResponse);
      
      // If confirmation is required, confirm it
      if (agent.get('requireConfirm')) {
        console.log('\nConfirming action to proceed with live API call...');
        const confirmResponse = await agent.chat('yes');
        console.log('Confirmation response:', confirmResponse);
        
        if (confirmResponse.content.includes('Successfully wrote') || 
            confirmResponse.content.includes('Successfully added')) {
          console.log(`\n✅ SUCCESS: Message was successfully written to your ${testCase.expectedPage} page!`);
        } else {
          console.log('\n❌ ERROR: The write operation may have failed. Please check the response above.');
        }
      }
    }
    
    console.log('\nLive tests completed! Please check your Notion workspace to verify the content was added to both pages.');
  } catch (error) {
    console.error('❌ Error during live test:', error);
  }
}

// Run the live test
runLiveTest(); 