import { CommandParser } from './command-parser.js';
import { FormatAgent } from './format-agent.js';
import * as NotionBlocks from './notion-blocks.js';

async function createCommandParser(apiKey, isTestEnv = true) {
  return new CommandParser(apiKey, isTestEnv);
}

async function createFormatAgent(apiKey) {
  return new FormatAgent(apiKey);
}

async function testComplexCommands() {
  console.log('\n=== Running Complex Command Test ===\n');
  
  // Create test instances
  const commandParser = await createCommandParser(null, true);
  const formatAgent = await createFormatAgent(null);
  
  // Test 1: Multi-operation command with bullet points, code block, and a page creation
  const complexCommand = 
    `Create a new page called "Complex Test" then add this bullet list: 
     First test item, Second test item, Third test with details 
     
     Then add this code block:
     
     \`\`\`javascript
     function testComplex() {
       console.log('Testing complex commands');
       return {
         success: true,
         message: 'All operations completed'
       };
     }
     \`\`\`
     
     Finally add a callout with: Important summary of test results`;
  
  console.log('Parsing complex command...');
  const parsedCommands = await commandParser.parseCommand(complexCommand);
  console.log('Parsed Commands:', JSON.stringify(parsedCommands, null, 2));
  
  // Verify that we got multiple operations from a single command
  console.log(`\nDetected ${parsedCommands.length} operations in the complex command`);
  
  // Test each part of the command
  for(const cmd of parsedCommands) {
    console.log(`\nProcessing operation: ${cmd.action} on ${cmd.primaryTarget}`);
    
    if (cmd.action === 'write' && cmd.formatType) {
      const blocks = await formatAgent.formatContent(cmd.content, cmd.formatType);
      console.log(`Formatted ${cmd.formatType} content:`, JSON.stringify(blocks, null, 2));
    }
  }
  
  // Test 2: Complex formatting with big test and well-formatted summary
  const complexFormat = 
    `Add a heading: Complex Test Results
     
     Then add a toggle: Test Summary with this summary:
     - All tests passed successfully
     - Performance improved by 25%
     - Code coverage increased to 95%
     
     Then add this code block:
     
     \`\`\`javascript
     // Test results object
     const testResults = {
       totalTests: 24,
       passed: 24,
       failed: 0,
       skipped: 0,
       performance: {
         before: 120,
         after: 90,
         improvement: '25%'
       }
     };
     
     console.log('Test suite completed successfully!');
     \`\`\`
     
     Finally add a callout with: ✅ All tests passed with flying colors!`;
  
  console.log('\nParsing second complex command...');
  const parsedCommands2 = await commandParser.parseCommand(complexFormat);
  console.log('Parsed Commands 2:', JSON.stringify(parsedCommands2, null, 2));
  
  // Verify operations
  console.log(`\nDetected ${parsedCommands2.length} operations in the second complex command`);
  
  return {
    complexCommandOperations: parsedCommands.length,
    complexFormatOperations: parsedCommands2.length
  };
}

// Run the tests
testComplexCommands().then(results => {
  console.log('\n=== Test Results ===');
  
  if (results.complexCommandOperations > 1) {
    console.log(`✅ Complex command parsing working (${results.complexCommandOperations} operations)`);
  } else {
    console.log('❌ Complex command parsing failed');
  }
  
  if (results.complexFormatOperations > 1) {
    console.log(`✅ Complex formatting working (${results.complexFormatOperations} operations)`);
  } else {
    console.log('❌ Complex formatting failed');
  }
}); 