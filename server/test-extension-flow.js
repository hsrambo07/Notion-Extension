/**
 * TEST SCRIPT - Mimics the extension's command flow for debugging
 * 
 * Run with: node server/test-extension-flow.js
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Server endpoint - adjust if your server is running on a different port
const SERVER_URL = 'http://localhost:9000/chat';

async function testExtensionFlow() {
  console.log('🧪 Testing extension command flow...');
  
  // Define test command
  const testCommand = "Add a to-do to review code tomorrow in Tasks page";
  
  try {
    console.log(`Sending command: "${testCommand}"`);
    
    // Step 1: Send initial request (confirmation step)
    const confirmResponse = await fetch(SERVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: testCommand,
        confirm: false
      })
    });
    
    if (!confirmResponse.ok) {
      throw new Error(`Server returned ${confirmResponse.status}: ${confirmResponse.statusText}`);
    }
    
    const confirmData = await confirmResponse.json();
    console.log('\n🔍 Confirmation response:');
    console.log(confirmData);
    
    // Step 2: Send confirmation
    console.log('\nSending confirmation...');
    const executeResponse = await fetch(SERVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: testCommand,
        confirm: true
      })
    });
    
    if (!executeResponse.ok) {
      throw new Error(`Server returned ${executeResponse.status}: ${executeResponse.statusText}`);
    }
    
    const executeData = await executeResponse.json();
    console.log('\n✅ Execution response:');
    console.log(executeData);
    
    console.log('\n🏁 Test completed successfully');
    
  } catch (error) {
    console.error('❌ Error in test:', error);
  }
}

// Run the test
testExtensionFlow(); 