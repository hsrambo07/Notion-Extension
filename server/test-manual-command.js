import { FormatAgent } from './format-agent.js';

async function testMultiFormatCommand() {
  console.log('\n=== Testing Multi-Format Commands ===\n');

  // Create a format agent
  const formatAgent = new FormatAgent(null);

  // Test bullet list formatting
  const bulletListContent = "First test item, Second test item, Third test with details";
  console.log('Formatting bullet list...');
  const bulletBlocks = await formatAgent.formatContent(bulletListContent, 'bullet');
  console.log('Bullet List Blocks:', JSON.stringify(bulletBlocks, null, 2));

  // Test code block formatting
  const codeContent = `
function testComplex() {
  console.log('Testing complex commands');
  return {
    success: true,
    message: 'All operations completed'
  };
}`;
  console.log('\nFormatting code block...');
  const codeBlocks = await formatAgent.formatContent(codeContent, 'code');
  console.log('Code Blocks:', JSON.stringify(codeBlocks, null, 2));

  // Test toggle with bullet points
  const toggleContent = `Test Summary: 
- All tests passed successfully
- Performance improved by 25%
- Code coverage increased to 95%`;
  console.log('\nFormatting toggle with bullets...');
  const toggleBlocks = await formatAgent.formatContent(toggleContent, 'toggle');
  console.log('Toggle Blocks:', JSON.stringify(toggleBlocks, null, 2));

  // Test callout
  const calloutContent = "✅ All tests passed with flying colors!";
  console.log('\nFormatting callout...');
  const calloutBlocks = await formatAgent.formatContent(calloutContent, 'callout');
  console.log('Callout Blocks:', JSON.stringify(calloutBlocks, null, 2));

  return {
    bulletBlocks,
    codeBlocks,
    toggleBlocks,
    calloutBlocks
  };
}

// Run the test
testMultiFormatCommand().then(results => {
  console.log('\n=== Test Results ===');
  
  // Check bullet list formatting
  if (results.bulletBlocks.length > 0 && 
      results.bulletBlocks[0].type === "bulleted_list_item") {
    console.log('✅ Bullet list formatting working');
    
    // Check if multiple bullets are created when comma-separated
    if (results.bulletBlocks.length === 3) {
      console.log('✅ Multiple bullet items created correctly');
    } else {
      console.log('❌ Failed to create multiple bullet items');
    }
  } else {
    console.log('❌ Bullet list formatting failed');
  }
  
  // Check code block formatting
  if (results.codeBlocks.length === 1 && 
      results.codeBlocks[0].type === "code") {
    console.log('✅ Code block formatting working');
    
    if (results.codeBlocks[0].code.language === 'javascript') {
      console.log('✅ Code language detection working');
    } else {
      console.log('❌ Code language detection failed');
    }
  } else {
    console.log('❌ Code block formatting failed');
  }
  
  // Check toggle formatting
  if (results.toggleBlocks.length === 1 && 
      results.toggleBlocks[0].type === "toggle") {
    console.log('✅ Toggle formatting working');
    
    if (results.toggleBlocks[0].toggle.children && 
        results.toggleBlocks[0].toggle.children.length > 0) {
      console.log('✅ Toggle with children working');
    } else {
      console.log('❌ Toggle children not created properly');
    }
  } else {
    console.log('❌ Toggle formatting failed');
  }
  
  // Check callout formatting
  if (results.calloutBlocks.length === 1 && 
      results.calloutBlocks[0].type === "callout") {
    console.log('✅ Callout formatting working');
  } else {
    console.log('❌ Callout formatting failed');
  }
}); 