import { FormatAgent } from './format-agent.js';
import * as NotionBlocks from './notion-blocks.js';

async function testCodeBlockParsing() {
  console.log('=== Testing Code Block Parsing ===');
  
  // Test a simple JavaScript function
  const jsCode = `
function testAI() {
  console.log('Testing AI Agent');
  
  // This is a comment
  return true;
}
  `;
  
  // Test with backticks
  const jsCodeWithBackticks = "```javascript\n" + jsCode + "\n```";
  
  // Create a format agent
  const formatAgent = new FormatAgent("test-key");
  
  // Test direct code block creation
  const codeBlock = NotionBlocks.detectLanguageAndCreateCodeBlock(jsCode);
  console.log('Direct Code Block:', JSON.stringify(codeBlock, null, 2));
  
  // Test formatted code block with backticks
  const backtickBlocks = await formatAgent.formatContent(jsCodeWithBackticks, 'code');
  console.log('Backtick Format:', JSON.stringify(backtickBlocks, null, 2));
  
  // Test toggle with code block
  const toggleWithCode = `Toggle Header: ${jsCodeWithBackticks}`;
  const toggleBlocks = await formatAgent.formatContent(toggleWithCode, 'toggle');
  console.log('Toggle with Code:', JSON.stringify(toggleBlocks, null, 2));
  
  return {
    codeBlock,
    backtickBlocks,
    toggleBlocks
  };
}

// Run the test
testCodeBlockParsing().then(results => {
  console.log('All tests complete');
  
  // Check for success criteria
  const codeBlock = results.codeBlock;
  const backtickBlocks = results.backtickBlocks;
  const toggleBlocks = results.toggleBlocks;
  
  // Verify code language detection
  if (codeBlock.code.language === 'javascript') {
    console.log('✅ Language detection working');
  } else {
    console.log('❌ Language detection failed');
  }
  
  // Verify single block creation (not multiple blocks)
  if (backtickBlocks.length === 1) {
    console.log('✅ Single code block creation working');
  } else {
    console.log('❌ Code block was split into multiple blocks');
  }
  
  // Verify toggle with code block
  if (toggleBlocks.length === 1 && 
      toggleBlocks[0].toggle.children.length === 1 && 
      toggleBlocks[0].toggle.children[0].type === 'code') {
    console.log('✅ Toggle with code block working');
  } else {
    console.log('❌ Toggle with code block failed');
  }
}); 