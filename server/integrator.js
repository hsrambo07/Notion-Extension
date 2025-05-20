/**
 * Integration module for LLM-based command parsing
 * 
 * This file shows how to integrate our enhanced LLM-based command parsing 
 * approach with the existing agent system.
 */

import { validateOpenAIKey } from './ai-api-validator.js';
import { createEnhancedMultiCommandHandler } from './enhanced-multi-command-handler.js';

/**
 * Creates an enhanced command handler that can be used by the main agent
 * 
 * @param {string} openAiApiKey - The OpenAI API key
 * @param {boolean} isTestMode - Whether to run in test mode
 * @returns {Object} An enhanced command handler that matches the interface expected by the agent
 */
export async function createEnhancedCommandHandler(openAiApiKey, isTestMode = false) {
  console.log('Creating enhanced command handler...');
  
  // First validate the API key
  let validApiKey = openAiApiKey;
  let useTestMode = isTestMode;
  
  try {
    if (openAiApiKey) {
      const validationResult = await validateOpenAIKey(openAiApiKey);
      if (!validationResult.valid) {
        console.warn(`⚠️ API key validation failed: ${validationResult.error}`);
        console.warn('Falling back to test mode');
        useTestMode = true;
      } else {
        console.log('✅ API key validated successfully');
      }
    } else {
      console.warn('⚠️ No API key provided, using test mode');
      useTestMode = true;
    }
  } catch (error) {
    console.error('❌ Error validating API key:', error);
    console.warn('Falling back to test mode');
    useTestMode = true;
  }
  
  // Create the enhanced command handler
  const handler = createEnhancedMultiCommandHandler(validApiKey, useTestMode);
  
  // Create a wrapper that matches the interface expected by NotionAgent
  return {
    // The processCommand method is what the agent calls
    async processCommand(input) {
      try {
        console.log(`Enhanced command handler processing: "${input}"`);
        const commands = await handler.processCommand(input);
        
        if (commands && commands.length > 0) {
          return commands;
        }
        
        return [{
          action: 'write',
          primaryTarget: 'TEST',
          content: input,
          formatType: 'paragraph'
        }];
      } catch (error) {
        console.error('Error in enhanced command handler:', error);
        return [{
          action: 'write',
          primaryTarget: 'TEST',
          content: 'Error processing command: ' + input,
          error: true
        }];
      }
    }
  };
}

/**
 * Integration function to patch the NotionAgent class
 * to use our enhanced parser instead of the existing ones
 * 
 * @param {NotionAgent} agent - The agent instance to patch
 * @returns {Promise<void>}
 */
export async function patchAgentWithEnhancedParser(agent) {
  console.log('Patching agent with enhanced parser...');
  
  // Get the OpenAI API key from the agent
  const openAiApiKey = agent.get('openAiApiKey') || process.env.OPENAI_API_KEY;
  const isTestMode = agent.get('isTestEnvironment') || process.env.NODE_ENV === 'test';
  
  // Create the enhanced command handler
  const enhancedHandler = await createEnhancedCommandHandler(openAiApiKey, isTestMode);
  
  // Override the agent's parseAction method or just set the enhanced handler
  // This depends on the agent implementation
  if (typeof agent.set === 'function') {
    agent.set('enhancedCommandHandler', enhancedHandler);
  }
  
  console.log('✅ Agent patched with enhanced command parser');
}

/**
 * Usage example:
 * 
 * import { createAgent } from './agent.js';
 * import { patchAgentWithEnhancedParser } from './integrator.js';
 * 
 * async function main() {
 *   // Create the agent
 *   const agent = await createAgent();
 *   
 *   // Patch the agent with our enhanced parser
 *   await patchAgentWithEnhancedParser(agent);
 *   
 *   // Use the agent as normal - it will now use our enhanced parser
 *   const result = await agent.chat('add milk in checklist and eggs in checklist too in Shopping');
 * }
 */ 