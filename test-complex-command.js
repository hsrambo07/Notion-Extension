// Test for complex command parsing with multiple formats and nested structures
import { config } from 'dotenv';
import { createEnhancedCommandHandler } from './server/integrator.js';

// Load environment variables
config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function testComplexCommands() {
  console.log('🔍 Testing complex command handling');
  
  try {
    // Create enhanced command handler in test mode
    console.log('Creating enhanced command handler in test mode...');
    const handler = await createEnhancedCommandHandler(OPENAI_API_KEY, true);
    
    if (!handler) {
      console.error('❌ Failed to create enhanced command handler');
      return;
    }
    
    console.log('✅ Enhanced command handler created successfully');
    
    // Test complex commands with multiple formats and nested structures
    const testCases = [
      {
        name: "Multiple formats with nested structure",
        command: "Add project timeline as toggle in Planning section in Project page and add meeting notes as bullets and also add a to-do to follow up with the team by Friday"
      },
      {
        name: "Multiple to-dos in different sections",
        command: "Add to-do to review design in Design section in Project page and add to-do to update documentation in Docs section"
      },
      {
        name: "Mixed formats with complex positioning",
        command: "Add quarterly goals as heading in the Overview section in Company page and add budget details as a callout and also add progress as bullet points"
      },
      {
        name: "Three commands with different formats",
        command: "Add project requirements as toggle, add timeline as code, and also add dependencies as a callout in Development page"
      }
    ];
    
    // Run tests
    for (const testCase of testCases) {
      console.log(`\n🧪 Testing: ${testCase.name}`);
      console.log(`Command: "${testCase.command}"`);
      
      const parsedCommands = await handler.processCommand(testCase.command);
      console.log('Parsed commands:', JSON.stringify(parsedCommands, null, 2));
      
      // Analysis
      console.log('Analysis:');
      
      // 1. Check for multiple commands
      if (parsedCommands.length > 1) {
        console.log(`✅ Successfully identified ${parsedCommands.length} commands`);
        
        // 2. Check for distinct formats
        const uniqueFormats = new Set(parsedCommands.map(cmd => cmd.formatType));
        console.log(`📊 Formats detected: ${Array.from(uniqueFormats).join(', ')}`);
        
        // 3. Check for section targeting
        const hasSectionTargeting = parsedCommands.some(cmd => cmd.sectionTarget);
        if (hasSectionTargeting) {
          console.log('✅ Correctly parsed section targeting');
          
          // Show section mappings
          parsedCommands.forEach((cmd, i) => {
            if (cmd.sectionTarget) {
              console.log(`   Command ${i+1}: ${cmd.sectionTarget} section in ${cmd.primaryTarget} page`);
            }
          });
        }
      } else {
        console.log(`❌ Failed to identify multiple commands (only found ${parsedCommands.length})`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// Run the test
testComplexCommands(); 