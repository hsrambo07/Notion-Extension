// Test production mode checklist functionality
import { createAgent } from './dist/server/agent.js';
import { createCommandParser } from './dist/server/command-parser.js';
import { createMultiCommandHandler } from './dist/server/multi-command-handler.js';

async function testMultiChecklistProduction() {
  // Allow OpenAI API usage but enable fallback
  process.env.NODE_ENV = "development";
  
  try {
    console.log("=== First, directly verify MultiCommandHandler ===");
    const parser = await createCommandParser('fake-key', true);
    const handler = createMultiCommandHandler(parser);
    
    const input = "add hey there in checklist and woohoo in checklist too in Personal thoughts";
    console.log(`Processing input directly with MultiCommandHandler: "${input}"`);
    
    const handlerCommands = await handler.processCommand(input);
    console.log(`MultiCommandHandler detected: ${handlerCommands.length} commands`);
    console.log('Commands:', JSON.stringify(handlerCommands, null, 2));
    
    console.log("\n=== Now testing with the full Agent ===");
    console.log("Creating agent...");
    const agent = await createAgent();
    console.log("Agent created successfully");
    
    // Skip confirmation by setting the confirm flag
    agent.set('confirm', true);
    
    console.log(`\nTesting full agent workflow with: "${input}"`);
    console.log("Processing command...");
    const result = await agent.chat(input);
    console.log("Result:", JSON.stringify(result, null, 2));
    
    // Get the remainingCommands from agent state
    const remainingCommands = agent.get('remainingCommands');
    if (remainingCommands && remainingCommands.length > 0) {
      console.log(`✅ SUCCESS: Found ${remainingCommands.length + 1} separate commands`);
      console.log("First command already executed, remaining commands:");
      remainingCommands.forEach((cmd, i) => {
        console.log(`Command ${i+1}:`, JSON.stringify(cmd, null, 2));
      });
    } else {
      console.log("❌ FAILED: Did not detect multiple checklist items");
      console.log("No remainingCommands found in agent state");
      
      // Let's also try to process a second command with the fallback patterns
      console.log("\n=== Trying one more time with NODE_ENV=test ===");
      process.env.NODE_ENV = "test";
      
      const testAgent = await createAgent();
      testAgent.set('confirm', true);
      
      // Direct test with a new MultiCommandHandler
      const testParser = await createCommandParser('fake-key', true);
      const testHandler = createMultiCommandHandler(testParser);
      console.log("Testing MultiCommandHandler in test mode directly...");
      const testDirectCommands = await testHandler.processCommand(input);
      console.log(`Test handler detected: ${testDirectCommands.length} commands`);
      console.log('Commands:', JSON.stringify(testDirectCommands, null, 2));
      
      console.log("\nNow testing with test agent:");
      const testResult = await testAgent.chat(input);
      console.log("Test mode result:", JSON.stringify(testResult, null, 2));
      
      const testRemainingCommands = testAgent.get('remainingCommands');
      if (testRemainingCommands && testRemainingCommands.length > 0) {
        console.log(`✅ SUCCESS in test mode: Found ${testRemainingCommands.length + 1} separate commands`);
        console.log("Remaining commands:", JSON.stringify(testRemainingCommands, null, 2));
      } else {
        console.log("❌ FAILED in test mode too");
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the test
testMultiChecklistProduction(); 