// Test for the context-aware handler with nested page structure
import { config } from 'dotenv';
import path from 'path';
import ContextAwareHandler from './server/context-aware-handler.js';

// Load environment variables
config({ path: path.join(process.cwd(), '..', '.env') });
config({ path: path.join(process.cwd(), '.env') });

const NOTION_API_TOKEN = process.env.NOTION_API_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function testContextAwareHandler() {
  console.log('🔍 Testing context-aware handler with nested page structure');
  
  try {
    // Create context-aware handler
    console.log('Creating context-aware handler...');
    const handler = new ContextAwareHandler(NOTION_API_TOKEN, OPENAI_API_KEY);
    
    if (!handler) {
      console.error('❌ Failed to create context-aware handler');
      return;
    }
    
    console.log('✅ Context-aware handler created successfully');
    
    // Test the specific command with the context-aware handler directly
    const command = "Add to-do to talk to Mooksh tomorrow at 8pm and add one more to-do to talk to Juhi tomorrow about why project in Interesting prompts page in tasks page";
    console.log(`\n🧪 Testing command with context-aware handler: "${command}"`);
    
    const result = await handler.processCommand(command);
    console.log('Result:', JSON.stringify(result, null, 2));
    
    // Issue might be in the page hierarchy handling
    console.log('\n🔍 Analysis:');
    console.log('1. The command contains a nested page structure: "Interesting prompts page in tasks page"');
    console.log('2. This means "Interesting prompts" is a subpage or section within "tasks" page');
    console.log('3. The LLM parser likely isn\'t correctly interpreting this hierarchy');
    
    // Try with a modified command that's more explicit
    const modifiedCommand = "Add to-do to talk to Mooksh tomorrow at 8pm in the Tasks page, under the Interesting prompts section";
    console.log(`\n🧪 Testing with modified command: "${modifiedCommand}"`);
    
    const modifiedResult = await handler.processCommand(modifiedCommand);
    console.log('Modified result:', JSON.stringify(modifiedResult, null, 2));
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// Run the test
testContextAwareHandler(); 