// Test script for the enhanced LLM-based command parser
import { createEnhancedMultiCommandHandler } from './server/enhanced-multi-command-handler.js';
import { validateOpenAIKey } from './server/ai-api-validator.js';

// Get API key from environment
const apiKey = process.env.OPENAI_API_KEY;

async function testEnhancedCommandParser() {
  console.log('🧪 Testing Enhanced LLM-based Command Parser');
  console.log('=========================================');
  
  // First validate the API key
  console.log('Validating API key...');
  try {
    const validationResult = await validateOpenAIKey(apiKey);
    if (!validationResult.valid) {
      console.error('❌ API key validation failed:', validationResult.error);
      console.log('Continuing in test mode...');
    } else {
      console.log('✅ API key is valid. Model:', validationResult.modelName);
    }
  } catch (error) {
    console.error('❌ Error validating API key:', error);
    console.log('Continuing in test mode...');
  }
  
  // Create the handler
  const handler = createEnhancedMultiCommandHandler(
    apiKey,
    !apiKey // Use test mode if no API key
  );
  
  // Test inputs
  const testInputs = [
    {
      name: "Multiple checklist items with 'and'",
      input: "add hey there in checklist and woohoo in checklist too in Personal thoughts"
    },
    {
      name: "Comma-separated checklist items",
      input: "add item one, item two, item three in checklist in Daily Tasks"
    },
    {
      name: "Multiple actions with different formats",
      input: "add meeting notes as toggle and this as quote: Important discussion points"
    }
  ];
  
  // Run tests
  for (const test of testInputs) {
    console.log(`\n=== Testing: ${test.name} ===`);
    console.log(`Input: "${test.input}"`);
    
    try {
      const commands = await handler.processCommand(test.input);
      console.log(`Commands detected: ${commands.length}`);
      console.log('Commands:', JSON.stringify(commands, null, 2));
      
      if (commands.length > 1) {
        console.log('✅ SUCCESS: Multiple commands detected');
      } else {
        console.log('⚠️ NOTE: Only one command detected');
      }
    } catch (error) {
      console.error('❌ ERROR:', error);
    }
  }
}

// Run the tests
testEnhancedCommandParser(); 