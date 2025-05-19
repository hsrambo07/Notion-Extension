// Force production mode to use real API implementation
process.env.NODE_ENV = 'production';

import { createAgent } from './dist/server/agent.js';

async function testSectionPlacement() {
  try {
    console.log('Testing section-based content placement in Notion Agent...');
    
    // Create agent instance
    const agent = await createAgent();
    
    // Test cases with different section placement scenarios
    const testCases = [
      {
        input: 'Add "Testing My Day section placement" under My Day in journal page',
        description: 'Basic section placement with common section name (My Day)'
      },
      {
        input: 'Add "Connect with Jane at 2pm" as checklist in My Day section in journal',
        description: 'Add checklist item to My Day section'
      },
      {
        input: 'Add "Remember to bring coat tomorrow" under Important reminder in journal',
        description: 'Add to Important reminder section'
      },
      {
        input: 'Write "This is a test entry" in January page in journal',
        description: 'Write to a nested page (January in journal)'
      }
    ];
    
    // Run each test case
    for (const [index, testCase] of testCases.entries()) {
      console.log(`\n===== Test ${index + 1}: ${testCase.description} =====`);
      console.log(`Command: "${testCase.input}"`);
      
      // First request might ask for confirmation
      const response = await agent.chat(testCase.input);
      console.log('Initial response:', response);
      
      // If confirmation is required, confirm it
      if (agent.get('requireConfirm')) {
        console.log('\nConfirming action to proceed with API call...');
        const confirmResponse = await agent.chat('yes');
        console.log('Confirmation response:', confirmResponse);
        
        if (confirmResponse.content.includes('Successfully') || 
            confirmResponse.content.includes('wrote') || 
            confirmResponse.content.includes('added')) {
          console.log(`\n✅ SUCCESS: Message was processed successfully!`);
          
          // Check if section was mentioned in the response
          if (confirmResponse.content.includes('section') || 
              confirmResponse.content.includes('heading') || 
              confirmResponse.content.includes('title')) {
            console.log('✅ Section placement was recognized in the response.');
          } else {
            console.log('⚠️ Section placement was not explicitly mentioned in the response.');
          }
        } else {
          console.log('\n❌ ERROR: The operation may have failed. Please check the response above.');
        }
      } else {
        // If no confirmation required but it was a success
        if (response.content.includes('Successfully') || 
            response.content.includes('wrote') || 
            response.content.includes('added')) {
          console.log(`\n✅ SUCCESS: Message was processed successfully!`);
          
          // Check if section was mentioned in the response
          if (response.content.includes('section') || 
              response.content.includes('heading') || 
              response.content.includes('title')) {
            console.log('✅ Section placement was recognized in the response.');
          } else {
            console.log('⚠️ Section placement was not explicitly mentioned in the response.');
          }
        }
      }
      
      // Wait a bit between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n===== All tests completed =====');
    
  } catch (error) {
    console.error('Error during testing:', error);
  }
}

// Run the tests
testSectionPlacement(); 