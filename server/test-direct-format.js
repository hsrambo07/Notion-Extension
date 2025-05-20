import { FormatAgent } from './format-agent.js';
import * as NotionBlocks from './notion-blocks.js';

/**
 * Test function for direct format operations
 */
async function testFormatOperations() {
  console.log('\n=== Testing Direct Format Operations ===\n');
  
  // Create the format agent
  const formatAgent = new FormatAgent(null);
  
  // Test case 1: Bullet list with comma-separated items
  const bulletListContent = "First test item, Second test item, Third test with details";
  
  console.log('Testing bullet list formatting...');
  const bulletBlocks = await formatAgent.formatContent(bulletListContent, 'bullet');
  
  console.log(`Created ${bulletBlocks.length} bullet items:`);
  bulletBlocks.forEach((block, index) => {
    console.log(`  ${index + 1}. ${block.bulleted_list_item.rich_text[0].text.content}`);
  });
  
  // Test case 2: JavaScript code block
  const jsCode = `function testFunction() {
  // This is a JavaScript function
  console.log("Testing Notion Agent");
  return {
    success: true,
    message: "All operations completed successfully"
  };
}`;
  
  console.log('\nTesting code block formatting...');
  const codeBlocks = await formatAgent.formatContent(jsCode, 'code');
  
  console.log(`Created code block with language: ${codeBlocks[0].code.language}`);
  
  // Test case 3: Toggle with bullet points
  const toggleContent = `Test Summary: 
- All tests passed successfully
- Performance improved by 25%
- Code coverage increased to 95%`;
  
  console.log('\nTesting toggle with bullet points...');
  const toggleBlocks = await formatAgent.formatContent(toggleContent, 'toggle');
  
  console.log(`Created toggle with ${toggleBlocks[0].toggle.children.length} child items`);
  
  return {
    bulletBlocks,
    codeBlocks,
    toggleBlocks
  };
}

// Run the tests and display summary
testFormatOperations().then(results => {
  console.log('\n=== Test Summary ===');
  
  if (results.bulletBlocks.length === 3) {
    console.log('✅ Bullet list correctly split into 3 separate items');
  } else {
    console.log(`❌ Bullet list incorrectly split into ${results.bulletBlocks.length} items`);
  }
  
  if (results.codeBlocks.length === 1 && 
      results.codeBlocks[0].code.language === 'javascript') {
    console.log('✅ Code block correctly formatted with JavaScript language detection');
  } else {
    console.log('❌ Code block formatting failed');
  }
  
  if (results.toggleBlocks.length === 1 && 
      results.toggleBlocks[0].toggle.children.length === 3) {
    console.log('✅ Toggle with bullet points correctly formatted');
  } else {
    console.log('❌ Toggle formatting failed');
  }
}); 