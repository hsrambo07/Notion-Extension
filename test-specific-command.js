// Test for the specific multi-command case
import { config } from 'dotenv';
import { createEnhancedCommandHandler } from './server/integrator.js';

// Load environment variables
config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function testSpecificCommand() {
  console.log('🔍 Testing specific multi-command case');
  
  try {
    // Create enhanced command handler with test mode enabled
    console.log('Creating enhanced command handler in test mode...');
    const handler = await createEnhancedCommandHandler(OPENAI_API_KEY, true);
    
    if (!handler) {
      console.error('❌ Failed to create enhanced command handler');
      return;
    }
    
    console.log('✅ Enhanced command handler created successfully');
    
    // Test the specific command
    const command = "Add to-do to talk to Mooksh tomorrow at 8pm and add one more to-do to talk to Juhi tomorrow about why project in Interesting prompts page in tasks page";
    console.log(`\n🧪 Testing command: "${command}"`);
    
    // Manual regex parsing to verify our pattern matching approach
    console.log('\n📋 Manual regex analysis:');
    
    // 1. Check for multi-todo pattern with improved content matching
    const multiTodoMatch = command.match(/add\s+to-?do\s+(?:to\s+)?(.*?)(?:\s+(?:in|to)\s+.*?)?\s+and\s+(?:add\s+(?:one\s+more\s+)?to-?do\s+(?:to\s+)?)(.*?)(?:\s+(?:in|to|about)\s+|$)/i);
    
    if (multiTodoMatch && multiTodoMatch.length >= 3) {
      console.log('✅ Successfully detected multi-todo pattern');
      console.log(`First todo: "${multiTodoMatch[1].trim()}"`);
      console.log(`Second todo: "${multiTodoMatch[2].trim()}"`);
    } else {
      console.log('❌ Failed to detect multi-todo pattern');
    }
    
    // 2. Check for nested page pattern
    const nestedPageMatch = command.match(/in\s+(.*?)\s+page\s+in\s+(.*?)\s+page/i);
    
    if (nestedPageMatch && nestedPageMatch.length >= 3) {
      console.log('✅ Successfully detected nested page pattern');
      console.log(`Section: "${nestedPageMatch[1].trim()}"`);
      console.log(`Main page: "${nestedPageMatch[2].trim()}"`);
    } else {
      console.log('❌ Failed to detect nested page pattern');
    }
    
    // Now test the actual handler
    console.log('\n🧪 Testing with enhanced command handler:');
    const parsedCommands = await handler.processCommand(command);
    console.log('Parsed commands:', JSON.stringify(parsedCommands, null, 2));
    
    // Analyze why the command targeting might be failing
    if (parsedCommands && parsedCommands.length > 0) {
      console.log('\n📋 Command Analysis:');
      
      parsedCommands.forEach((cmd, index) => {
        console.log(`\nCommand ${index + 1}:`);
        console.log(`- Action: ${cmd.action}`);
        console.log(`- Primary Target: ${cmd.primaryTarget}`);
        console.log(`- Content: ${cmd.content}`);
        console.log(`- Format Type: ${cmd.formatType}`);
        
        // Check for nested page structure interpretation
        if (cmd.primaryTarget && cmd.primaryTarget.includes('in')) {
          console.log(`⚠️ POSSIBLE ISSUE: The target "${cmd.primaryTarget}" contains 'in', suggesting nested page confusion`);
        }
        
        // Check for section targeting
        if (cmd.sectionTarget) {
          console.log(`- Section Target: ${cmd.sectionTarget}`);
        } else {
          console.log(`⚠️ POSSIBLE ISSUE: No section target identified for a command that should target a section`);
        }
      });
      
      // Additional suggestion for the specific command
      console.log('\n🔍 Diagnosis:');
      if (parsedCommands.length < 2) {
        console.log(`❌ Failed to identify this as a multi-command request (only found ${parsedCommands.length} commands)`);
      } else {
        console.log(`✅ Successfully identified as a multi-command request (found ${parsedCommands.length} commands)`);
      }
      
      const lastCmd = parsedCommands[parsedCommands.length - 1];
      if (lastCmd && lastCmd.primaryTarget) {
        if (lastCmd.primaryTarget.includes('Interesting prompts') && lastCmd.primaryTarget.includes('tasks')) {
          console.log('❌ Parser interpreted "Interesting prompts page in tasks page" as a single target rather than a nested path');
        } else if (lastCmd.primaryTarget === 'tasks' && lastCmd.sectionTarget === 'Interesting prompts') {
          console.log('✅ Correctly parsed page and section targets');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// Run the test
testSpecificCommand(); 