import { createAIAgentNetwork } from './ai-agent-network.ts';
import { processContentByFormat } from './notion-blocks.js';

const TEST_CASES = [
  // Basic todo patterns
  { 
    input: "add buy milk as todo in tasks page",
    expect: { content: "buy milk", formatType: "to_do", page: "tasks" }
  },
  { 
    input: "add call mom as to-do",
    expect: { content: "call mom", formatType: "to_do", page: "TEST MCP" }
  },
  { 
    input: "add finish report as checklist in work page",
    expect: { content: "finish report", formatType: "to_do", page: "work" }
  },
  { 
    input: "add review PR as a task",
    expect: { content: "review PR", formatType: "to_do", page: "TEST MCP" }
  },
  
  // Complex patterns with extra words
  { 
    input: "please add send email to John as a todo item in my tasks page",
    expect: { content: "send email to John", formatType: "to_do", page: "tasks" }
  },
  { 
    input: "could you add prepare presentation slides as a checklist item",
    expect: { content: "prepare presentation slides", formatType: "to_do", page: "TEST MCP" }
  },
  
  // Edge cases with special characters
  { 
    input: "add test (high priority) as todo in tasks page",
    expect: { content: "test (high priority)", formatType: "to_do", page: "tasks" }
  },
  { 
    input: "add review PR #123 - urgent! as checklist",
    expect: { content: "review PR #123 - urgent!", formatType: "to_do", page: "TEST MCP" }
  },
  
  // Multiple words in page names
  { 
    input: "add buy groceries as todo in shopping list page",
    expect: { content: "buy groceries", formatType: "to_do", page: "shopping list" }
  },
  
  // Common typos and variations
  { 
    input: "add oreder food as todo",
    expect: { content: "oreder food", formatType: "to_do", page: "TEST MCP" }
  },
  { 
    input: "add send emails as to do",
    expect: { content: "send emails", formatType: "to_do", page: "TEST MCP" }
  },
  
  // Multiple items
  { 
    input: "add milk, eggs, bread as checklist in shopping page",
    expect: { 
      content: ["milk", "eggs", "bread"],
      formatType: "to_do", 
      page: "shopping",
      isMultiBlock: true
    }
  },
  
  // "in todo" patterns
  { 
    input: "add order phone in todo",
    expect: { content: "order phone", formatType: "to_do", page: "TEST MCP" }
  },
  { 
    input: "add order phone in todo and order badminton in todo",
    expect: { content: "order phone", formatType: "to_do", page: "TEST MCP" }
  },
  
  // Multi-command with different page targets
  { 
    input: "add order phone as todo in tasks page and order badminton as todo in shopping page",
    expect: { content: "order phone", formatType: "to_do", page: "tasks" }
  }
];

async function runProductionTests() {
  console.log("=== Starting Production-Level Tests ===\n");
  
  // Create agent network in test mode
  const agentNetwork = await createAIAgentNetwork("test-api-key", true);
  let passCount = 0;
  let failCount = 0;
  
  for (const testCase of TEST_CASES) {
    console.log(`Testing: "${testCase.input}"`);
    
    try {
      // Test agent network processing
      const commands = await agentNetwork.processCommand(testCase.input);
      const command = commands[0];
      
      // Verify command structure
      const commandValid = command && 
        command.action === 'write' &&
        command.formatType === 'to_do' &&
        (testCase.expect.isMultiBlock ? 
          command.content === testCase.expect.content[0] : // For multi-block, check first item
          command.content.trim() === testCase.expect.content) &&
        command.primaryTarget.toLowerCase().includes(testCase.expect.page.toLowerCase());
      
      if (!commandValid) {
        console.log('❌ Command structure test failed:');
        console.log('Expected:', testCase.expect);
        console.log('Got:', command);
        failCount++;
        continue;
      }
      
      // Test block creation
      const blocks = processContentByFormat(command.content, command.formatType);
      
      if (testCase.expect.isMultiBlock) {
        // For multi-block tests, verify each block
        const blocksValid = blocks.length === testCase.expect.content.length &&
          blocks.every((block, i) => 
            block.type === 'to_do' &&
            block.to_do.rich_text[0].text.content === testCase.expect.content[i]);
        
        if (!blocksValid) {
          console.log('❌ Multi-block creation test failed:');
          console.log('Expected blocks with content:', testCase.expect.content);
          console.log('Got blocks:', blocks);
          failCount++;
          continue;
        }
      } else {
        // Single block test
        const block = blocks[0];
        const blockValid = block && 
          block.type === 'to_do' &&
          block.to_do.rich_text[0].text.content === testCase.expect.content;
        
        if (!blockValid) {
          console.log('❌ Block creation test failed:');
          console.log('Expected to_do block with content:', testCase.expect.content);
          console.log('Got:', block);
          failCount++;
          continue;
        }
      }
      
      console.log('✅ Test passed\n');
      passCount++;
      
    } catch (error) {
      console.log('❌ Test failed with error:', error);
      failCount++;
    }
  }
  
  // Print summary
  console.log("=== Test Summary ===");
  console.log(`Total tests: ${TEST_CASES.length}`);
  console.log(`Passed: ${passCount} ✅`);
  console.log(`Failed: ${failCount} ❌`);
  console.log(`Success rate: ${((passCount / TEST_CASES.length) * 100).toFixed(1)}%`);
  
  // Exit with failure if any tests failed
  if (failCount > 0) {
    process.exit(1);
  }
}

// Run the tests
runProductionTests().catch(error => {
  console.error("Test suite failed:", error);
  process.exit(1);
}); 