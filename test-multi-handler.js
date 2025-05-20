// Test for MultiCommandHandler
import { createCommandParser } from './dist/server/command-parser.js';
import { createMultiCommandHandler } from './dist/server/multi-command-handler.js';

async function testMultiCommandHandler() {
  console.log('🧪 Testing MultiCommandHandler directly');
  console.log('======================================');

  // The test input with multiple checklist items
  const input = "add hey there in checklist and woohoo in checklist too in Personal thoughts";
  
  // Create a command parser in test mode
  const parser = await createCommandParser("fake-key", true);
  
  // Create the multi-command handler
  const handler = createMultiCommandHandler(parser);
  
  // Test the handler
  console.log(`Processing input: "${input}"`);
  try {
    const commands = await handler.processCommand(input);
    console.log(`Commands detected: ${commands.length}`);
    console.log('Commands:', JSON.stringify(commands, null, 2));
    
    if (commands.length > 1) {
      console.log('✅ SUCCESS: Multiple commands detected by MultiCommandHandler');
    } else {
      console.log('❌ FAILED: Only one command detected by MultiCommandHandler');
    }
  } catch (error) {
    console.error('❌ ERROR:', error);
  }
  
  // Now test with a real parser (that should fall back to test mode)
  console.log('\n--- Testing with production parser (with fallback) ---');
  const prodParser = await createCommandParser(process.env.OPENAI_API_KEY, false);
  const prodHandler = createMultiCommandHandler(prodParser);
  
  try {
    const prodCommands = await prodHandler.processCommand(input);
    console.log(`Commands detected: ${prodCommands.length}`);
    console.log('Commands:', JSON.stringify(prodCommands, null, 2));
    
    if (prodCommands.length > 1) {
      console.log('✅ SUCCESS: Multiple commands detected by MultiCommandHandler in production mode');
    } else {
      console.log('❌ FAILED: Only one command detected by MultiCommandHandler in production mode');
    }
  } catch (error) {
    console.error('❌ ERROR in production mode:', error);
  }
}

testMultiCommandHandler(); 