import fs from 'fs';
import { CommandParser } from './command-parser.js';
import { createFormatAgent } from './format-agent.js';
import * as NotionBlocks from './notion-blocks.js';

// This test creates an actual output file we can inspect
async function runRealTest() {
  console.log('\n=== Running Real Test with File Output ===\n');
  
  // Create formatters for testing
  const formatAgent = await createFormatAgent(null);
  
  // Test cases
  const testCases = [
    {
      title: "Bullet List Test",
      content: "First test item, Second test item, Third test with details",
      format: "bullet"
    },
    {
      title: "Code Block Test",
      content: `function testFunction() {
  // This is a test function
  console.log("Testing in production");
  return {
    status: "success",
    message: "Code block test completed"
  };
}`,
      format: "code"
    },
    {
      title: "Toggle with Bullets Test",
      content: `Test Results: 
- Bullet list test: Passed
- Code block test: Passed
- Toggle test: Passed`,
      format: "toggle"
    },
    // Adding new test cases as requested
    {
      title: "Quote Test",
      content: "I think we should work on making this better",
      format: "quote"
    },
    {
      title: "Checklist Test",
      content: "seems interesting, have to revert back, in personal thoughts page",
      format: "todo"
    }
  ];
  
  // Run all tests and collect results
  const results = {};
  
  for (const test of testCases) {
    console.log(`\nRunning test: ${test.title}`);
    const blocks = await formatAgent.formatContent(test.content, test.format);
    results[test.title] = {
      format: test.format,
      input: test.content,
      output: blocks,
      success: test.format === 'bullet' || test.format === 'todo' ? blocks.length > 1 : blocks.length === 1
    };
  }
  
  // Write results to a file AND console
  const outputPath = './test-output.json';
  const jsonResults = JSON.stringify(results, null, 2);
  fs.writeFileSync(outputPath, jsonResults);
  
  // Print formatted results to console for immediate visibility
  console.log('\n==== FULL TEST OUTPUT ====');
  console.log(jsonResults);
  console.log('\nTest results also written to ' + outputPath);
  
  return results;
}

// Execute the test
runRealTest()
  .then(results => {
    console.log('\n=== Real Test Summary ===');
    
    let allSuccess = true;
    Object.entries(results).forEach(([testName, result]) => {
      if (result.success) {
        console.log(`✅ ${testName} passed`);
      } else {
        console.log(`❌ ${testName} failed`);
        allSuccess = false;
      }
    });
    
    if (allSuccess) {
      console.log('\n✅ All tests passed! Check test-output.json for details.');
    } else {
      console.log('\n⚠️ Some tests failed. Check test-output.json for details.');
    }
  })
  .catch(error => {
    console.error('Error running tests:', error);
  }); 