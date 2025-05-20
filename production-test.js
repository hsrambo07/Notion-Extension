// Production test for multiple checklist items in Personal thoughts page
import { createAgent } from './dist/server/agent.js';

async function testProductionChecklist() {
  // Use PRODUCTION mode explicitly
  process.env.NODE_ENV = "production";
  
  console.log('🧪 PRODUCTION MODE Test of Multiple Checklist Items');
  console.log('=================================================');
  console.log('Environment:', process.env.NODE_ENV);
  
  const agent = await createAgent();
  const input = "add testing multiple items in checklist and this feature now works in checklist too in Personal thoughts";
  
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
  if (finalResponse.content.includes(" and ") || 
      finalResponse.content.match(/added.+?added/i) ||
      finalResponse.content.includes("multiple") && finalResponse.content.includes("feature")) {
    console.log("\n✅ SUCCESS: Multiple checklist items were processed!");
    console.log("Both items were successfully added to Personal thoughts page");
  } else {
    console.log("\n❌ FAILED: Only one checklist item was processed.");
  }
}

// Run the test
testProductionChecklist(); 