// Test for multi-format command parsing
import { config } from 'dotenv';
import { createEnhancedCommandHandler } from './server/integrator.js';

// Load environment variables
config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function testMultiFormatCommands() {
  console.log('🔍 Testing multi-format command handling');
  
  try {
    // Create enhanced command handler in test mode
    console.log('Creating enhanced command handler in test mode...');
    const handler = await createEnhancedCommandHandler(OPENAI_API_KEY, true);
    
    if (!handler) {
      console.error('❌ Failed to create enhanced command handler');
      return;
    }
    
    console.log('✅ Enhanced command handler created successfully');
    
    // Test various multi-format commands
    const testCases = [
      {
        name: "Bullet and toggle format",
        command: "Add meeting notes as bullet points and add action items as a toggle in Project page"
      },
      {
        name: "Code and callout format",
        command: "Add this snippet as code: console.log('hello') and add a reminder as callout in Dev Notes page"
      },
      {
        name: "Heading and quote format",
        command: "Add 'Weekly Summary' as heading and add 'Team is making good progress' as quote in Meeting Notes page"
      },
      {
        name: "Multiple todo items",
        command: "Add to-do to review PR and add to-do to deploy changes in Tasks page"
      },
      {
        name: "And also pattern",
        command: "Add customer feedback in Research page and also add a follow-up task as a to-do"
      },
      {
        name: "Nested page structure",
        command: "Add design mockups as toggle in Design section in Project page"
      }
    ];
    
    // Run tests
    for (const testCase of testCases) {
      console.log(`\n🧪 Testing: ${testCase.name}`);
      console.log(`Command: "${testCase.command}"`);
      
      const parsedCommands = await handler.processCommand(testCase.command);
      console.log('Parsed commands:', JSON.stringify(parsedCommands, null, 2));
      
      // Validation
      console.log('Analysis:');
      if (parsedCommands.length > 1) {
        console.log(`✅ Successfully identified as multi-command (${parsedCommands.length} commands)`);
      } else {
        console.log(`❌ Failed to identify as multi-command (only ${parsedCommands.length} command)`);
      }
      
      // Check for section/page targeting in nested structure test
      if (testCase.name === "Nested page structure") {
        const hasCorrectTargeting = parsedCommands.some(cmd => 
          cmd.primaryTarget === "Project" && cmd.sectionTarget === "Design"
        );
        
        if (hasCorrectTargeting) {
          console.log('✅ Correctly parsed nested page structure');
        } else {
          console.log('❌ Failed to correctly parse nested page structure');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// Run the test
testMultiFormatCommands(); 