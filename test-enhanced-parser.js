// Test the enhanced parser integration
import fetch from 'node-fetch';
import { config } from 'dotenv';
import { createEnhancedCommandHandler } from './server/integrator.js';

// Load environment variables
config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function testEnhancedParser() {
  console.log('🔍 Testing enhanced parser integration');
  
  try {
    // Create enhanced command handler
    console.log('Creating enhanced command handler...');
    const handler = await createEnhancedCommandHandler(OPENAI_API_KEY, false);
    
    if (!handler) {
      console.error('❌ Failed to create enhanced command handler');
      return;
    }
    
    console.log('✅ Enhanced command handler created successfully');
    
    // Test parsing a multi-command
    console.log('\n🧪 Testing multi-command parsing: "add milk in checklist and eggs in checklist too in Shopping"');
    const multiCommands = await handler.processCommand('add milk in checklist and eggs in checklist too in Shopping');
    console.log('Parsed commands:', JSON.stringify(multiCommands, null, 2));
    
    // Test parsing a URL command
    console.log('\n🧪 Testing URL parsing: "add https://example.com to Personal thoughts page"');
    const urlCommand = await handler.processCommand('add https://example.com to Personal thoughts page');
    console.log('Parsed URL command:', JSON.stringify(urlCommand, null, 2));
    
    // Test parsing a complex format
    console.log('\n🧪 Testing complex format: "add meeting notes as toggle and action items as to_do in Work"');
    const formatCommand = await handler.processCommand('add meeting notes as toggle and action items as to_do in Work');
    console.log('Parsed format command:', JSON.stringify(formatCommand, null, 2));
    
    console.log('\n🏁 All parser tests completed');
  } catch (error) {
    console.error('❌ Error during enhanced parser testing:', error);
  }
}

// Run the test
testEnhancedParser(); 