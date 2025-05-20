/**
 * Test for improved code block and complex toggle handling
 * This tests the enhanced notion-blocks module and command parser
 */
import { createCommandParser } from './server/command-parser.js';
import { createFormatAgent } from './server/format-agent.js';
import * as NotionBlocks from './server/notion-blocks.js';

// Simple mock OpenAI function for testing
const mockParser = async (input) => {
  console.log('Parsing command:', input);
  
  // Test code block detection
  if (input.includes('code block') || input.includes('```')) {
    console.log('Detected code block request');
    
    // Extract code content if present
    let codeContent = '';
    const codeMatch = input.match(/```([\w+-]+)?\s*([\s\S]*?)```/);
    
    if (codeMatch) {
      const language = codeMatch[1] || 'plain_text';
      codeContent = codeMatch[2] || '';
      
      console.log(`Language: ${language}, Content: ${codeContent.substring(0, 50)}...`);
    }
  }
  
  // Test complex toggle detection
  if (input.includes('toggle') && (input.includes('multiple') || input.includes('mixed'))) {
    console.log('Detected complex toggle request');
    
    // Extract toggle title if present
    const titleMatch = input.match(/toggle\s+(?:called|named|titled)\s+["']?([^"',.]+?)["']?/i);
    if (titleMatch && titleMatch[1]) {
      console.log(`Toggle title: ${titleMatch[1].trim()}`);
    }
  }
  
  return {
    command: {
      action: 'write',
      primaryTarget: 'TEST MCP',
      content: input
    }
  };
};

async function runCodeBlockTest() {
  console.log('\n=== Running Code Block Test ===\n');
  
  // Test JavaScript code block
  const jsCodeBlock = "```javascript\nfunction test() {\n  console.log('Hello world');\n}\n\ntest();\n```";
  const jsCommand = `Add this as a code block in TEST MCP: ${jsCodeBlock}`;
  
  const commandParser = await createCommandParser(null, true);
  const commands = await commandParser.parseCommand(jsCommand);
  
  console.log('Parsed Command:', JSON.stringify(commands, null, 2));
  
  // Test block formatting
  const formatAgent = await createFormatAgent(null);
  const blocks = await formatAgent.formatContent(jsCodeBlock, 'code');
  
  console.log('Formatted Blocks:', JSON.stringify(blocks, null, 2));
}

async function runComplexToggleTest() {
  console.log('\n=== Running Complex Toggle Test ===\n');
  
  // Test complex toggle with mixed content
  const toggleCommand = `Create a toggle called "Project Status" with the following items:
  - First item is a bullet
  - Second item is another bullet
  And include this code: 
  \`\`\`javascript
  function updateStatus(project) {
    return project.status === 'active';
  }
  \`\`\`
  Finally, add a warning that this is not final.`;
  
  const commandParser = await createCommandParser(null, true);
  const commands = await commandParser.parseCommand(toggleCommand);
  
  console.log('Parsed Command:', JSON.stringify(commands, null, 2));
  
  // Test direct complex toggle creation
  const toggleItems = [
    { type: 'bullet', content: 'First item is a bullet' },
    { type: 'bullet', content: 'Second item is another bullet' },
    { type: 'code', content: 'function updateStatus(project) {\n  return project.status === "active";\n}' },
    { type: 'callout', content: 'This is not final' }
  ];
  
  // Test block formatting
  const formatAgent = await createFormatAgent(null);
  const toggleContent = JSON.stringify(toggleItems);
  const blocks = await formatAgent.formatContent(`Project Status: ${toggleContent}`, 'complex_toggle');
  
  console.log('Formatted Blocks:', JSON.stringify(blocks, null, 2));
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