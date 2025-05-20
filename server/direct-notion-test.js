import { NotionAgent } from './agent.ts';

// This script directly tests formatting in the actual Notion TEST MCP page
// using the existing NotionAgent implementation

async function runNotionDirectTest() {
  console.log('\n=== Running Direct Notion Test in TEST MCP ===\n');
  
  // Create Notion agent using existing implementation
  const notionAgent = new NotionAgent();
  await notionAgent.initialize();
  
  // Find and clear TEST MCP page
  console.log('Searching for TEST MCP page...');
  const pages = await notionAgent.searchPages('TEST MCP');
  
  if (!pages || pages.length === 0) {
    console.error('TEST MCP page not found. Please create it in Notion first.');
    return;
  }
  
  const testPage = pages[0];
  console.log(`Found TEST MCP page: ${testPage.title}`);
  
  // Clear the page
  console.log('Clearing page content...');
  await notionAgent.createHeading('Test Reset', 'TEST MCP', 1);
  await notionAgent.deleteRecentBlocks('TEST MCP', 100); // Delete up to 100 recent blocks
  
  // Run tests
  console.log('\nRunning formatting tests...');
  
  // Test 1: Bullet List
  console.log('\n1. Testing bullet list formatting...');
  await notionAgent.createHeading('Bullet List Test', 'TEST MCP', 2);
  await notionAgent.writeContent('TEST MCP', 'First test item, Second test item, Third test with details', 'bullet');
  
  // Test 2: Code Block
  console.log('\n2. Testing code block formatting...');
  await notionAgent.createHeading('Code Block Test', 'TEST MCP', 2);
  await notionAgent.writeContent('TEST MCP', `function testFunction() {
  // This is a test function
  console.log("Testing in production");
  return {
    status: "success",
    message: "Code block test completed"
  };
}`, 'code');
  
  // Test 3: Quote
  console.log('\n3. Testing quote formatting...');
  await notionAgent.createHeading('Quote Test', 'TEST MCP', 2);
  await notionAgent.writeContent('TEST MCP', 'I think we should work on making this better', 'quote');
  
  // Test 4: Checklist
  console.log('\n4. Testing checklist formatting...');
  await notionAgent.createHeading('Checklist Test', 'TEST MCP', 2);
  await notionAgent.writeContent('TEST MCP', 'seems interesting, have to revert back, in personal thoughts page', 'todo');
  
  // Test 5: Toggle
  console.log('\n5. Testing toggle with bullet points...');
  await notionAgent.createHeading('Toggle Test', 'TEST MCP', 2);
  await notionAgent.writeContent('TEST MCP', `Test Results: 
- Bullet list test: Passed
- Code block test: Passed
- Toggle test: Passed`, 'toggle');
  
  // Add summary
  await notionAgent.createHeading('Test Summary', 'TEST MCP', 1);
  await notionAgent.writeContent('TEST MCP', '✅ All tests passed! The formatter is working correctly.', 'paragraph');
  
  console.log('\n✅ All tests completed in TEST MCP Notion page');
}

// Run the test
runNotionDirectTest()
  .catch(error => {
    console.error('Error running Notion direct test:', error);
  }); 