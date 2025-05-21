import test from 'node:test';
import assert from 'node:assert';
import { LLMCommandParser } from './llm-command-parser.js';
import { createEnhancedMultiCommandHandler } from './enhanced-multi-command-handler.js';

// Test the LLM Command Parser directly
test('LLM Command Parser - Nested Page Structure', async (t) => {
  // Create a parser with a mock implementation
  const parser = new LLMCommandParser('dummy_key');
  
  // Override the callLLM method to avoid making actual API calls
  parser.callLLM = async () => {
    return JSON.stringify({
      commands: [{
        action: 'write',
        primaryTarget: 'Tasks',
        content: 'order pillows',
        formatType: 'to_do',
        sectionTarget: 'my day'
      }]
    });
  };
  
  // Override the API validation to always return true
  parser.validateApi = async () => true;
  
  // Test parsing a command with nested page structure
  const result = await parser.parseCommand('add order pillows as to-do in my day section in Daily Tasks page');
  
  assert.strictEqual(result.length, 1, 'Should return one command');
  assert.strictEqual(result[0].primaryTarget, 'Tasks', 'Primary target should be Tasks');
  assert.strictEqual(result[0].sectionTarget, 'my day', 'Section target should be my day');
  assert.strictEqual(result[0].content, 'order pillows', 'Content should be order pillows');
  assert.strictEqual(result[0].formatType, 'to_do', 'Format type should be to_do');
});

// Test the Enhanced Multi-Command Handler
test('Enhanced Multi-Command Handler - Multiple Commands', async (t) => {
  // Create a handler with a mocked LLM parser
  const handler = createEnhancedMultiCommandHandler('dummy_key', true);
  
  // Override the llmParser's methods to avoid API calls
  handler.llmParser.callLLM = async () => {
    return JSON.stringify({
      commands: [
        {
          action: 'write',
          primaryTarget: 'Daily Tasks',
          content: 'buy milk',
          formatType: 'to_do'
        },
        {
          action: 'write',
          primaryTarget: 'Daily Tasks',
          content: 'call mom',
          formatType: 'to_do',
          isMultiAction: true
        }
      ]
    });
  };
  
  // Override the API validation to always return true
  handler.llmParser.validateApi = async () => true;
  
  // Also override normalizeFormatType to ensure consistent results
  handler.normalizeFormatType = (format) => 'to_do';
  
  // Test parsing multiple commands
  const result = await handler.processCommand('add buy milk in checklist and add call mom in checklist too in Daily Tasks');
  
  assert.strictEqual(result.length, 2, 'Should return two commands');
  assert.strictEqual(result[0].primaryTarget, 'Daily Tasks', 'First command target should be Daily Tasks');
  assert.strictEqual(result[1].primaryTarget, 'Daily Tasks', 'Second command target should be Daily Tasks');
  assert.strictEqual(result[0].content, 'buy milk', 'First content should be buy milk');
  assert.strictEqual(result[1].content, 'call mom', 'Second content should be call mom');
  assert.strictEqual(result[0].formatType, 'to_do', 'First format should be to_do');
  assert.strictEqual(result[1].formatType, 'to_do', 'Second format should be to_do');
});

// Test nested page structures with specific section targeting
test('Enhanced Multi-Command Handler - Nested Page Structure', async (t) => {
  // Create a handler with a mocked LLM parser
  const handler = createEnhancedMultiCommandHandler('dummy_key', true);
  
  // Override the llmParser's methods to avoid API calls
  handler.llmParser.callLLM = async () => {
    return JSON.stringify({
      commands: [{
        action: 'write',
        primaryTarget: 'Tasks',
        content: 'order pillows',
        formatType: 'to_do',
        sectionTarget: 'my day'
      }]
    });
  };
  
  // Override the API validation to always return true
  handler.llmParser.validateApi = async () => true;
  
  // Also override normalizeFormatType to ensure consistent results
  handler.normalizeFormatType = (format) => 'to_do';
  
  // Test parsing a command with nested page structure
  const result = await handler.processCommand('add order pillows as to-do in my day section in Daily Tasks page');
  
  assert.strictEqual(result.length, 1, 'Should return one command');
  assert.strictEqual(result[0].primaryTarget, 'Daily Tasks', 'Primary target should be Daily Tasks');
  assert.ok(result[0].sectionTarget, 'Should have a section target');
  assert.strictEqual(result[0].sectionTarget, 'my day', 'Section target should be my day');
  assert.strictEqual(result[0].content, 'order pillows', 'Content should be order pillows');
  assert.strictEqual(result[0].formatType, 'to_do', 'Format type should be to_do');
});

// Test complex multi-command with nested page structure and section targeting
test('Complex Nested Multi-Command with Section Targeting', async (t) => {
  // Create a handler with a mocked LLM parser
  const handler = createEnhancedMultiCommandHandler('dummy_key', true);
  
  // Override the llmParser's methods to avoid API calls
  handler.llmParser.callLLM = async () => {
    return JSON.stringify({
      commands: [
        {
          action: 'write',
          primaryTarget: 'tasks',
          content: 'talk to Mooksh tomorrow at 8pm',
          formatType: 'to_do'
        }
      ]
    });
  };
  
  // Override the API validation to always return true
  handler.llmParser.validateApi = async () => true;
  
  // Also override normalizeFormatType to ensure consistent results
  handler.normalizeFormatType = (format) => 'to_do';
  
  // Test the complex command pattern
  const complexCommand = 'Add to-do to talk to Mooksh tomorrow at 8pm and add one more to-do to talk to Juhi tomorrow about why project in interestin prompt page in tasks page';
  const result = await handler.processCommand(complexCommand);
  
  assert.strictEqual(result.length, 2, 'Should return two commands');
  
  // First command assertions
  assert.strictEqual(result[0].primaryTarget, 'tasks', 'First command primaryTarget should be tasks');
  assert.strictEqual(result[0].content, 'talk to Mooksh tomorrow at 8pm', 'First content should match');
  assert.strictEqual(result[0].formatType, 'to_do', 'First format should be to_do');
  assert.strictEqual(result[0].sectionTarget, 'Interesting Prompts', 'First command should target Interesting Prompts section');
  
  // Second command assertions
  assert.strictEqual(result[1].primaryTarget, 'tasks', 'Second command primaryTarget should be tasks');
  assert.strictEqual(result[1].content, 'talk to Juhi tomorrow about why project', 'Second content should match');
  assert.strictEqual(result[1].formatType, 'to_do', 'Second format should be to_do');
  assert.strictEqual(result[1].sectionTarget, 'Interesting Prompts', 'Second command should target Interesting Prompts section');
}); 