// Direct test of the command parser
import { createCommandParser } from './dist/server/command-parser.js';

async function testCommandParser() {
  console.log('🧪 Testing Command Parser directly');
  console.log('====================================');

  // The test input with multiple checklist items
  const input = "add hey there in checklist and woohoo in checklist too in Personal thoughts";
  
  // Test in test mode
  console.log('\n--- TEST MODE ---');
  const testParser = await createCommandParser("fake-key", true);
  try {
    const testCommands = await testParser.parseCommand(input);
    console.log(`Commands detected: ${testCommands.length}`);
    console.log('Commands:', JSON.stringify(testCommands, null, 2));
    
    if (testCommands.length > 1) {
      console.log('✅ TEST MODE SUCCESS: Multiple commands detected');
    } else {
      console.log('❌ TEST MODE FAILED: Only one command detected');
    }
  } catch (error) {
    console.error('❌ TEST MODE ERROR:', error);
  }
  
  // Test in production mode with fallback
  console.log('\n--- PRODUCTION MODE WITH FALLBACK ---');
  // Create a parser with the real API key but that will fall back to test mode
  // when OpenAI fails or for specific patterns
  const prodParser = await createCommandParser(process.env.OPENAI_API_KEY, false);
  try {
    const prodCommands = await prodParser.parseCommand(input);
    console.log(`Commands detected: ${prodCommands.length}`);
    console.log('Commands:', JSON.stringify(prodCommands, null, 2));
    
    if (prodCommands.length > 1) {
      console.log('✅ PRODUCTION MODE SUCCESS: Multiple commands detected');
    } else {
      console.log('❌ PRODUCTION MODE FAILED: Only one command detected');
    }
  } catch (error) {
    console.error('❌ PRODUCTION MODE ERROR:', error);
  }
}

testCommandParser(); 