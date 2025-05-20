// Test script to check multiple checklist items functionality in production mode
import fetch from 'node-fetch';

async function testProductionChecklist() {
  console.log('🧪 Testing multiple checklist items in production mode');
  console.log('=====================================================');
  
  const serverUrl = 'http://localhost:9001/chat';
  
  // Test cases for multiple checklist items
  const testCases = [
    {
      name: 'Multiple items with "and" pattern',
      input: 'add hey there in checklist and woohoo in checklist too in Personal thoughts',
      expectedItems: ['hey there', 'woohoo']
    },
    {
      name: 'Comma-separated checklist items',
      input: 'add item1, item2, item3 in checklist in My Tasks',
      expectedItems: ['item1', 'item2', 'item3']
    },
    {
      name: 'Single checklist item',
      input: 'add remember to buy milk in checklist in Shopping List',
      expectedItems: ['remember to buy milk']
    }
  ];
  
  // Run each test case
  for (const testCase of testCases) {
    console.log(`\n📝 Testing: ${testCase.name}`);
    console.log(`Input: "${testCase.input}"`);
    
    try {
      const response = await fetch(serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: testCase.input
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Server response:', data);
      
      // Basic validation of response
      if (data.response) {
        console.log('✅ Received valid response from server');
        
        // For more detailed validation, we'd need to check the actual Notion operations
        // This is just a basic check of the response format
        console.log(`Response: ${data.response.substring(0, 100)}${data.response.length > 100 ? '...' : ''}`);
      } else {
        console.log('❌ Invalid response format');
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
  }
  
  console.log('\n🏁 Test completed');
}

// Run the test
testProductionChecklist().catch(error => {
  console.error('Error in test script:', error);
}); 