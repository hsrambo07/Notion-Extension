// Simple demo of multiple checklist items working correctly
import { createAgent } from './dist/server/agent.js';

async function demoMultipleChecklist() {
  console.log('🧪 Demonstrating Multiple Checklist Items Working Correctly');
  console.log('=======================================================');
  
  // Use test mode
  process.env.NODE_ENV = "test";
  
  const agent = await createAgent();
  
  const testCases = [
    {
      name: "Multiple checklist items with 'and'",
      input: "add hey there in checklist and woohoo in checklist too in Personal thoughts"
    },
    {
      name: "Comma-separated checklist items",
      input: "add item one, item two, item three in checklist in Daily Tasks"
    }
  ];
  
  for (const test of testCases) {
    console.log(`\n=== Testing: ${test.name} ===`);
    console.log(`Input: "${test.input}"`);
    
    // Reset confirmation state
    agent.set('confirm', false);
    
    // First request (might need confirmation)
    const initialResponse = await agent.chat(test.input);
    console.log("Initial response:", initialResponse.content);
    
    let finalResponse = initialResponse;
    
    // If confirmation needed, confirm and get final response
    if (initialResponse.content.includes('CONFIRM?')) {
      console.log("Confirming action...");
      agent.set('confirm', true);
      finalResponse = await agent.chat('yes');
      console.log("Final response:", finalResponse.content);
    }
    
    // Check if the result mentions multiple checklist items
    if (finalResponse.content.includes(" and ") || 
        finalResponse.content.match(/added.+?added/i) || 
        (finalResponse.content.includes("item one") && finalResponse.content.includes("item two"))) {
      console.log("✅ SUCCESS: Multiple checklist items were processed!");
    } else {
      console.log("❌ FAILED: Only one checklist item was processed.");
    }
  }
}

demoMultipleChecklist(); 