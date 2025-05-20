// Production test for comma-separated checklist items in Personal thoughts page
import { createAgent } from './dist/server/agent.js';

async function testCommaChecklist() {
  // Use PRODUCTION mode explicitly
  process.env.NODE_ENV = "production";
  
  console.log('🧪 PRODUCTION MODE Test of Comma-separated Checklist Items');
  console.log('========================================================');
  console.log('Environment:', process.env.NODE_ENV);
  
  const agent = await createAgent();
  const input = "add item one, item two, item three in checklist in Personal thoughts";
  
  console.log(`\nTesting command: "${input}"`);
  
  // First get confirmation
  const initialResponse = await agent.chat(input);
  console.log("Initial response:", initialResponse.content);
  
  if (!initialResponse.content.includes('CONFIRM?')) {
    console.log("❌ ERROR: Missing confirmation prompt!");
    return;
  }
  
  // Confirm the action
  console.log("\nConfirming action...");
  agent.set('confirm', true);
  const finalResponse = await agent.chat('yes');
  
  console.log("\nFinal response:", finalResponse.content);
  
  // Check if the result mentions multiple items
  if (finalResponse.content.includes("item one") && 
      finalResponse.content.includes("item two") && 
      finalResponse.content.includes("item three")) {
    console.log("\n✅ SUCCESS: All three checklist items were processed!");
    console.log("All comma-separated items were successfully added to Personal thoughts page");
  } else if (finalResponse.content.match(/added.+?added/i)) {
    console.log("\n⚠️ PARTIAL SUCCESS: Some checklist items were processed");
    console.log("Not all three items were detected in the response");
  } else {
    console.log("\n❌ FAILED: Only one checklist item was processed.");
  }
}

// Run the test
testCommaChecklist(); 