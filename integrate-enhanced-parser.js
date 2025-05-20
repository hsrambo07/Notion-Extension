/**
 * Integration test for the enhanced LLM-based command parser
 * This script shows how to integrate our enhanced parser with the existing agent system
 */

import { createAgent } from './dist/server/agent.js';
import { patchAgentWithEnhancedParser } from './server/integrator.js';

/**
 * Monkey patch the NotionAgent.parseAction method to use our enhanced handler
 */
async function monkeyPatchAgent(agent) {
  console.log('🔧 Monkey patching the agent to use our enhanced command parser...');
  
  // Store the original parseAction method
  const originalParseAction = agent.__proto__.parseAction;
  
  // Create our enhanced command handler
  await patchAgentWithEnhancedParser(agent);
  
  // Get the enhanced handler
  const enhancedHandler = agent.get('enhancedCommandHandler');
  
  if (enhancedHandler) {
    // Override the parseAction method
    agent.__proto__.parseAction = async function(input) {
      console.log('👉 Intercepted parseAction call, using enhanced parser');
      
      try {
        // Use our enhanced handler first
        const commands = await enhancedHandler.processCommand(input);
        
        if (commands && commands.length > 0) {
          console.log(`✅ Enhanced parser detected ${commands.length} command(s)`);
          
          // Store any additional commands
          if (commands.length > 1) {
            this.state.set('remainingCommands', commands.slice(1));
          }
          
          // Use the first command
          const command = commands[0];
          
          // Convert to the format expected by the agent
          return {
            action: command.action || 'unknown',
            pageTitle: command.primaryTarget,
            content: command.content,
            oldContent: command.oldContent,
            newContent: command.newContent,
            parentPage: command.secondaryTarget,
            formatType: command.formatType,
            sectionTitle: command.sectionTarget,
            debug: command.debug || false,
            isUrl: command.isUrl || false,
            commentText: command.commentText
          };
        } else {
          console.log('❌ Enhanced parser failed, falling back to original method');
        }
      } catch (error) {
        console.error('❌ Error in enhanced parser:', error);
        console.log('Falling back to original method');
      }
      
      // Fall back to the original method if our enhanced parser fails
      return originalParseAction.call(this, input);
    };
    
    console.log('✅ Agent successfully patched with enhanced parser');
  } else {
    console.warn('⚠️ Enhanced handler not found, using original parser');
  }
}

/**
 * Run the integration test
 */
async function runIntegrationTest() {
  console.log('🧪 Running integration test with enhanced parser');
  console.log('==============================================');
  
  // Set to test mode (or change to "production" for real use)
  process.env.NODE_ENV = "test";
  console.log('Environment:', process.env.NODE_ENV);
  
  // Create the agent
  console.log('Creating agent...');
  const agent = await createAgent();
  console.log('Agent created');
  
  // Patch the agent to use our enhanced parser
  await monkeyPatchAgent(agent);
  
  // Test command with multiple checklist items
  const command = "add milk in checklist and eggs in checklist too in Shopping List";
  console.log('\nTesting command:', command);
  
  // Process the command - first request will need confirmation
  const initialResponse = await agent.chat(command);
  console.log('\nInitial response:', initialResponse.content);
  
  if (initialResponse.content.includes('CONFIRM?')) {
    console.log('\n✅ Confirmation required, confirming...');
    
    // Set confirmation flag and get final response
    agent.set('confirm', true);
    const finalResponse = await agent.chat('yes');
    console.log('\nFinal response:', finalResponse.content);
    
    // Check success
    if (finalResponse.content.includes('milk') && finalResponse.content.includes('eggs')) {
      console.log('\n✅ SUCCESS: Multiple checklist items detected and processed');
    } else {
      console.log('\n❌ FAILURE: Multiple checklist items not processed correctly');
    }
  } else {
    // Not expecting this path in test mode with our command, but handle it anyway
    console.log('\n⚠️ No confirmation required, checking result directly');
    
    if (initialResponse.content.includes('milk') && initialResponse.content.includes('eggs')) {
      console.log('\n✅ SUCCESS: Multiple checklist items detected and processed');
    } else {
      console.log('\n❌ FAILURE: Multiple checklist items not processed correctly');
    }
  }
}

// Run the test
runIntegrationTest(); 