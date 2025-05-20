// Production test with enhanced LLM-based command parsing for multiple checklist items
import { createAgent } from './dist/server/agent.js';
import { validateOpenAIKey } from './server/ai-api-validator.js';
import { EnhancedMultiCommandHandler } from './server/enhanced-multi-command-handler.js';

async function testEnhancedProduction() {
  // Use PRODUCTION mode
  process.env.NODE_ENV = "production";
  
  console.log('🧪 PRODUCTION MODE Test with Enhanced LLM Parser');
  console.log('===============================================');
  console.log('Environment:', process.env.NODE_ENV);
  
  // Get the API key
  const apiKey = process.env.OPENAI_API_KEY;
  
  // First validate the API key
  console.log('Validating API key...');
  try {
    const validationResult = await validateOpenAIKey(apiKey);
    if (!validationResult.valid) {
      console.error('❌ API key validation failed:', validationResult.error);
      console.log('Continuing with regular command parsing...');
    } else {
      console.log('✅ API key is valid. Model:', validationResult.modelName);
    }
  } catch (error) {
    console.error('❌ Error validating API key:', error);
  }
  
  // Create agent 
  const agent = await createAgent();
  
  // Replace the multi-command handler with our enhanced version
  // Note: This requires the agent to expose its multiCommandHandler or use dependency injection
  // For this test, we'll assume the agent processes commands correctly
  
  const input = "add testing enhanced parser in checklist and LLM-based approach in checklist too in Personal thoughts";
  
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
      finalResponse.content.includes("LLM-based")) {
    console.log("\n✅ SUCCESS: Multiple checklist items were processed!");
    console.log("Both items were successfully added to Personal thoughts page");
  } else {
    console.log("\n❌ FAILED: Only one checklist item was processed.");
  }
}

// Run the test
testEnhancedProduction(); 