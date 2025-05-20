import fetch from 'node-fetch';
import { CommandParser } from './command-parser.js';
import { createFormatAgent } from './format-agent.js';
import * as NotionBlocks from './notion-blocks.js';

// Create a simpler direct test that doesn't require actual API keys
// This will just test our formatting logic in a simulated production environment

// Set page name for testing
const TEST_PAGE = "TEST MCP";

/**
 * Run a simulated production test for formatting
 */
async function runProductionTest() {
  console.log('\n=== Running Production-like Test on TEST MCP ===\n');
  
  // Create formatters for testing
  const formatAgent = await createFormatAgent(null);
  const commandParser = new CommandParser(null, true);
  
  // Test 1: Bullet list formatting
  console.log('\n1. Testing bullet list formatting...');
  const bulletListContent = "First test item, Second test item, Third test with details";
  const bulletBlocks = await formatAgent.formatContent(bulletListContent, 'bullet');
  
  console.log(`Created ${bulletBlocks.length} bullet items:`);
  bulletBlocks.forEach((block, index) => {
    console.log(`  ${index + 1}. ${block.bulleted_list_item.rich_text[0].text.content}`);
  });
  
  // Test 2: Code block formatting
  console.log('\n2. Testing code block formatting...');
  const jsCode = `function testFunction() {
  // This is a test function
  console.log("Testing in production");
  return {
    status: "success",
    message: "Code block test completed"
  };
}`;
  
  const codeBlocks = await formatAgent.formatContent(jsCode, 'code');
  console.log(`Created code block with language: ${codeBlocks[0].code.language}`);
  console.log('Code content:');
  console.log(codeBlocks[0].code.rich_text[0].text.content);
  
  // Test 3: Toggle with bullet points
  console.log('\n3. Testing toggle with bullet points...');
  const toggleContent = `Test Results: 
- Bullet list test: Passed
- Code block test: Passed
- Toggle test: Passed`;
  
  const toggleBlocks = await formatAgent.formatContent(toggleContent, 'toggle');
  console.log(`Created toggle with title: "${toggleBlocks[0].toggle.rich_text[0].text.content}"`);
  console.log(`Toggle has ${toggleBlocks[0].toggle.children.length} child items`);
  
  // Test 4: Test multi-format command parsing
  console.log('\n4. Testing complex command parsing...');
  const complexCommand = `Create a new page called "Test Results" and add a bullet list with First item, Second item, Third item`;
  
  const parsedCommands = await commandParser.parseCommand(complexCommand);
  console.log(`Parsed into ${parsedCommands.length} commands`);
  console.log('Command details:', JSON.stringify(parsedCommands, null, 2));
  
  return {
    bulletSuccess: bulletBlocks.length === 3,
    codeSuccess: codeBlocks.length === 1 && codeBlocks[0].code.language === 'javascript',
    toggleSuccess: toggleBlocks.length === 1 && toggleBlocks[0].toggle.children.length === 3,
    commandSuccess: parsedCommands.length > 1
  };
}

// Execute the test
runProductionTest()
  .then(results => {
    console.log('\n=== Production Test Summary ===');
    
    if (results.bulletSuccess) {
      console.log('✅ Bullet list formatting works correctly');
    } else {
      console.log('❌ Bullet list formatting failed');
    }
    
    if (results.codeSuccess) {
      console.log('✅ Code block formatting works correctly');
    } else {
      console.log('❌ Code block formatting failed');
    }
    
    if (results.toggleSuccess) {
      console.log('✅ Toggle with bullet points works correctly');
    } else {
      console.log('❌ Toggle formatting failed');
    }
    
    if (results.commandSuccess) {
      console.log('✅ Complex command parsing works');
    } else {
      console.log('❌ Complex command parsing needs improvement');
    }
    
    const allSuccess = results.bulletSuccess && results.codeSuccess && results.toggleSuccess;
    if (allSuccess) {
      console.log('\n✅ Core formatting functionality works correctly and is ready for production use!');
    } else {
      console.log('\n⚠️ Some formatting issues need to be fixed before production use.');
    }
  })
  .catch(error => {
    console.error('Error running production tests:', error);
  }); 