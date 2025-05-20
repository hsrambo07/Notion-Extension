/**
 * Direct test for Notion Blocks functionality
 */
import * as NotionBlocks from './server/notion-blocks.js';

// Test code block detection with language inference
function testCodeBlockDetection() {
  console.log('\n=== Testing Code Block Detection ===\n');
  
  const codeExamples = [
    {
      name: 'JavaScript with backticks',
      code: '```javascript\nfunction test() {\n  console.log("Hello");\n}\n```'
    },
    {
      name: 'Python with backticks',
      code: '```python\ndef test():\n  print("Hello")\n```'
    },
    {
      name: 'Unlabeled JavaScript',
      code: 'function test() {\n  console.log("Hello");\n}\n'
    },
    {
      name: 'Unlabeled Python',
      code: 'def test():\n  print("Hello")\n'
    },
    {
      name: 'HTML',
      code: '<div>Hello</div>'
    },
    {
      name: 'CSS',
      code: '.class { color: red; }'
    },
    {
      name: 'Java',
      code: 'public class Test {\n  public static void main(String[] args) {\n    System.out.println("Hello");\n  }\n}'
    },
    {
      name: 'SQL',
      code: 'SELECT * FROM users WHERE name = "John"'
    }
  ];
  
  for (const example of codeExamples) {
    // Test direct code language detection
    console.log(`${example.name}:`);
    
    // This uses the private helper function that should now be accessible
    let language;
    try {
      // First try the direct language detection function
      language = NotionBlocks.detectCodeLanguage(example.code);
      console.log(`  - Direct Language Detection: ${language}`);
    } catch (e) {
      console.log(`  - Direct Language Detection failed: ${e.message}`);
    }
    
    // Then test the full code block creator
    const block = NotionBlocks.detectLanguageAndCreateCodeBlock(example.code);
    console.log(`  - Full Block Language: ${block.code.language}`);
    console.log(`  - Content Length: ${block.code.rich_text[0].text.content.length} chars`);
    console.log(`  - Content Preview: ${block.code.rich_text[0].text.content.substring(0, 30)}...`);
    console.log();
  }
}

// Test complex toggle creation with mixed content types
function testComplexToggle() {
  console.log('\n=== Testing Complex Toggle Creation ===\n');
  
  const toggleItems = [
    { type: 'paragraph', content: 'This is a paragraph inside a toggle' },
    { type: 'bullet', content: 'This is a bullet point inside a toggle' },
    { type: 'code', content: 'function test() {\n  return true;\n}' },
    { type: 'callout', content: 'This is a callout inside a toggle' }
  ];
  
  const toggle = NotionBlocks.createComplexToggle('Complex Toggle Test', toggleItems);
  
  console.log('Toggle Title:', toggle.toggle.rich_text[0].text.content);
  console.log('Number of Children:', toggle.toggle.children.length);
  
  toggle.toggle.children.forEach((child, index) => {
    console.log(`\nChild ${index + 1}:`);
    console.log(`  - Type: ${child.type}`);
    
    // For code blocks, also show the language
    if (child.type === 'code') {
      console.log(`  - Language: ${child.code.language}`);
    }
    
    // Show a preview of the content
    const contentPath = `${child.type}.rich_text[0].text.content`;
    const content = child[child.type]?.rich_text?.[0]?.text?.content || 'No content';
    console.log(`  - Content Preview: ${content.substring(0, 30)}...`);
  });
}

// Test toggle with code blocks
function testToggleWithCode() {
  console.log('\n=== Testing Toggle with Code Blocks ===\n');
  
  // Create a toggle block manually to test the specific issue
  const header = 'Manual Toggle Test';
  const codeContent = 'function test() {\n  console.log("Hello");\n}';
  const codeBlock = NotionBlocks.createCodeBlock(codeContent, 'javascript');
  const manualToggle = NotionBlocks.createToggleBlock(header, [codeBlock]);
  
  console.log('Manual Toggle Test:');
  console.log('- Title:', manualToggle.toggle.rich_text[0].text.content);
  console.log('- First Child Type:', manualToggle.toggle.children[0].type);
  console.log('- Code Language:', manualToggle.toggle.children[0].code.language);
  
  // Testing pure content with backticks
  console.log('\nPure Code Block Test:');
  const pureCode = "```javascript\nfunction test() {\n  console.log('test');\n}\n```";
  const pureCodeBlock = NotionBlocks.detectLanguageAndCreateCodeBlock(pureCode);
  console.log('- Language:', pureCodeBlock.code.language);
  console.log('- Content:', pureCodeBlock.code.rich_text[0].text.content.substring(0, 30) + '...');
  
  // Testing proper toggle creation
  console.log('\nPure Toggle Creation:');
  const toggleTitle = "Manual Title";
  const toggleWithCode = NotionBlocks.createToggleBlock(
    toggleTitle,
    [NotionBlocks.createCodeBlock("function manualTest() { return true; }", "javascript")]
  );
  console.log('- Toggle Title:', toggleWithCode.toggle.rich_text[0].text.content);
  console.log('- First Child Type:', toggleWithCode.toggle.children[0].type);
  console.log('- Code Language:', toggleWithCode.toggle.children[0].code.language);
}

function main() {
  console.log('Starting Notion Blocks Tests');
  
  testCodeBlockDetection();
  testComplexToggle();
  testToggleWithCode();
  
  console.log('\nAll tests completed!');
}

main(); 