/**
 * Debug script for the LLM Parser
 * Directly tests the LLM parser to ensure it's working correctly
 */

import { LLMCommandParser } from './server/llm-command-parser.js';

async function debugLLMParser() {
  console.log('🔍 Debugging LLM Parser');
  console.log('=======================');
  
  // Get API key from environment
  const apiKey = process.env.OPENAI_API_KEY || 'sk-dummy-key';
  
  // Create the parser
  console.log('Creating LLM Parser...');
  const parser = new LLMCommandParser(apiKey);
  
  // Test commands
  const testCommands = [
    {
      name: "Multiple checklist items",
      input: "add milk in checklist and eggs in checklist too in Shopping List"
    },
    {
      name: "Complex command with multiple actions",
      input: "add project meeting notes to my Work page and also include action items from yesterday's call"
    },
    {
      name: "Create and add multiple formats",
      input: "create a new page called Weekly Status and add yesterday's tasks as a toggle and the plan for today as a checklist"
    }
  ];
  
  // Test LLM parser first (which will likely fail with dummy key)
  console.log('\n🧪 Testing LLM Parser (expected to fail with dummy key):');
  for (const test of testCommands) {
    console.log(`\nInput: "${test.input}"`);
    
    try {
      const commands = await parser.parseCommand(test.input);
      console.log(`✅ Success! Parsed ${commands.length} commands:`);
      console.log(JSON.stringify(commands, null, 2));
    } catch (error) {
      console.log(`ℹ️ LLM Parser failed as expected with dummy key`);
    }
  }
  
  // Now test the test mode fallback
  console.log('\n\n🧪 Testing Test Mode Fallback:');
  for (const test of testCommands) {
    console.log(`\nInput: "${test.input}"`);
    
    try {
      const commands = parser.getTestModeResponse(test.input);
      console.log(`✅ Success! Parsed ${commands.length} commands:`);
      console.log(JSON.stringify(commands, null, 2));
    } catch (error) {
      console.error(`❌ Error in test mode fallback:`, error);
    }
  }
}

// Run the debug
debugLLMParser().catch(error => {
  console.error('Debug script failed with error:', error);
}); 