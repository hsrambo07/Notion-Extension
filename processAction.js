import { createAgent } from './dist/server/agent.js';

async function testCommand() {
  // Set test environment
  process.env.NODE_ENV = 'test';
  console.log('Running in test environment');
  
  // Create agent instance
  const agent = await createAgent();
  
  const input = `user input: add this content to my TEST MCP page
First paragraph with some text
Second paragraph with more text
Third paragraph to finish it up`;
  
  const response = await agent.chat(input);
  console.log('Response:', response.content);
}

testCommand(); 