/**
 * Manual test file for LLM-based Notion command parser
 * Run with: node server/test-complex-command.js
 */

import { createEnhancedMultiCommandHandler } from './enhanced-multi-command-handler.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Set test mode to true to avoid needing a real API key
const isTestMode = true;
const apiKey = process.env.OPENAI_API_KEY || 'test_key';

// Test commands - variety of natural language inputs with different structures
const testCommands = [
  // Original complex case
  'Add to-do to talk to Mooksh tomorrow at 8pm and add one more to-do to talk to Juhi tomorrow about why project in interestin prompt page in tasks page',
  
  // Different phrasing with the same intent
  'Create a to-do item for reaching out to Sarah about the design project and also make a note about client feedback in Projects section',
  
  // Multiple item types
  'Add a bullet point about revenue growth and a toggle for product roadmap in Strategy page',
  
  // Nested page structures 
  'Add meeting notes from yesterday in Meeting Minutes section in Work page',
  
  // Multiple formats with unclear boundaries
  'Create a callout saying Important! and below it add code snippet for the React component',
  
  // Spelling mistakes and informal language
  'Put a todo bout buying flowers and another bout calling mom in my personal section',
  
  // Mixed formats with section targeting
  'Put heading "Q3 Goals" and bullet points for each objective in quarterly planning section of goals page'
];

async function testCommandParser() {
  console.log('==== TESTING LLM COMMAND PARSER ====');
  console.log('Using test mode:', isTestMode);
  
  // Create the enhanced multi-command handler
  const handler = createEnhancedMultiCommandHandler(apiKey, isTestMode);
  
  // Test each command
  for (const command of testCommands) {
    console.log('\n\n=== TESTING COMMAND ===');
    console.log(`"${command}"`);
    
    try {
      const result = await handler.processCommand(command);
      
      console.log('\n=== RESULTS ===');
      console.log('Number of commands detected:', result.length);
      
      result.forEach((cmd, index) => {
        console.log(`\nCommand ${index + 1}:`);
        console.log(`- Action: ${cmd.action}`);
        console.log(`- Primary Target: ${cmd.primaryTarget || 'Default'}`);
        console.log(`- Content: ${cmd.content}`);
        console.log(`- Format Type: ${cmd.formatType || 'paragraph'}`);
        
        if (cmd.sectionTarget) {
          console.log(`- Section Target: ${cmd.sectionTarget}`);
        }
        
        if (cmd.isMultiAction) {
          console.log(`- Is Multi-Action: ${cmd.isMultiAction}`);
        }
      });
      
      console.log('\n=== COMMAND TEST COMPLETE ===');
    } catch (error) {
      console.error(`Error processing command "${command}":`, error);
    }
  }
}

// Run the tests
testCommandParser().then(() => {
  console.log('\n==== ALL TESTS COMPLETE ====');
}); 