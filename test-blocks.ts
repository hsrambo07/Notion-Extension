/**
 * Test for improved code block and complex toggle handling
 * This tests the enhanced notion-blocks module and command parser
 */
import { createCommandParser, CommandType } from './server/command-parser';
import { createFormatAgent } from './server/format-agent';
import * as NotionBlocks from './server/notion-blocks';

async function runCodeBlockTest() {
  console.log('\n=== Running Code Block Test ===\n');
  
  // Test JavaScript code block
  const jsCodeBlock = "```javascript\nfunction test() {\n  console.log('Hello world');\n}\n\ntest();\n```";
  const jsCommand = `Add this as a code block in TEST MCP: ${jsCodeBlock}`;
  
  // Test direct language detection
  const codeBlock = NotionBlocks.detectLanguageAndCreateCodeBlock(jsCodeBlock);
  console.log('Detected language:', codeBlock.code.language);
  console.log('Code content length:', codeBlock.code.rich_text[0].text.content.length);
  
  // Test Python code block detection
  const pyCodeBlock = "```python\ndef test():\n    print('Hello world')\n\ntest()\n```";
  const pyBlock = NotionBlocks.detectLanguageAndCreateCodeBlock(pyCodeBlock);
  console.log('Python language detection:', pyBlock.code.language);
  
  // Test unlabeled code block with language detection
  const unlabeledCode = "```\nfunction test() {\n  console.log('Hello world');\n}\n```";
  const detectedBlock = NotionBlocks.detectLanguageAndCreateCodeBlock(unlabeledCode);
  console.log('Detected language from unlabeled code:', detectedBlock.code.language);
}

async function runComplexToggleTest() {
  console.log('\n=== Running Complex Toggle Test ===\n');
  
  // Test complex toggle creation
  const toggleItems = [
    { type: 'bullet', content: 'First item is a bullet' },
    { type: 'bullet', content: 'Second item is another bullet' },
    { type: 'code', content: 'function updateStatus(project) {\n  return project.status === "active";\n}' },
    { type: 'callout', content: 'This is not final' }
  ];
  
  const toggle = NotionBlocks.createComplexToggle('Project Status', toggleItems);
  console.log('Complex toggle structure:');
  console.log('- Title:', toggle.toggle.rich_text[0].text.content);
  console.log('- Children count:', toggle.toggle.children.length);
  
  // Test content types in the toggle
  toggle.toggle.children.forEach((child: any, index: number) => {
    console.log(`Child ${index + 1} type:`, child.type);
  });
  
  // Test toggle with code block
  const codeToggle = NotionBlocks.processContentByFormat(
    "Implementation Details: ```javascript\nfunction test() {\n  return true;\n}\n```", 
    "toggle"
  );
  
  console.log('\nToggle with code block:');
  console.log('- Title:', codeToggle[0].toggle.rich_text[0].text.content);
  console.log('- Child type:', codeToggle[0].toggle.children[0].type);
  if (codeToggle[0].toggle.children[0].type === 'code') {
    console.log('- Code language:', codeToggle[0].toggle.children[0].code.language);
  }
}

async function main() {
  console.log('Running tests for improved code block and toggle handling');
  
  await runCodeBlockTest();
  await runComplexToggleTest();
  
  console.log('\nAll tests completed');
}

main().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
}); 