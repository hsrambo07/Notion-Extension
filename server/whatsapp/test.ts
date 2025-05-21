/**
 * Test script for WhatsApp integration
 * 
 * This script simulates incoming WhatsApp messages without requiring
 * an actual WhatsApp Business API connection.
 */

// Set test mode flag for WhatsApp API
process.argv.push('--test-whatsapp');

import readline from 'readline';
import { processWhatsAppMessage } from './handler.js';

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Mock WhatsApp client for testing
import whatsappClient from './client.js';

// Override both API methods for testing - this is backup in case the client detection doesn't work
const originalSendTextMessage = whatsappClient.sendTextMessage;
const originalMarkMessageAsRead = whatsappClient.markMessageAsRead;

// Mock sendTextMessage
whatsappClient.sendTextMessage = async (to: string, text: string) => {
  console.log('\n📱 WhatsApp Response:');
  console.log('--------------------');
  console.log(`${text}`);
  console.log('--------------------\n');
  return { success: true, message_id: 'test-message-id' };
};

// Mock markMessageAsRead
whatsappClient.markMessageAsRead = async (messageId: string) => {
  console.log(`[TEST] Marking message ${messageId} as read`);
  return { success: true };
};

// Mock user data
const TEST_USER_PHONE = '123456789';
const TEST_MESSAGE_ID_PREFIX = 'test-message-';
let messageIdCounter = 1;

// Main test loop
async function startTestLoop() {
  console.log('\n🤖 WhatsApp Notion Agent Test Console 🤖');
  console.log('-------------------------------------');
  console.log('Type your messages as if you were sending them through WhatsApp.');
  console.log('Type "exit" to quit the test.\n');
  
  askForInput();
}

function askForInput() {
  rl.question('📝 You: ', async (input) => {
    if (input.toLowerCase() === 'exit') {
      console.log('\nExiting test console...');
      rl.close();
      return;
    }
    
    try {
      // Generate a unique message ID for this test message
      const messageId = `${TEST_MESSAGE_ID_PREFIX}${messageIdCounter++}`;
      
      // Process the message as if it came from WhatsApp
      await processWhatsAppMessage(TEST_USER_PHONE, input, messageId);
      
      // Continue the loop
      setTimeout(askForInput, 500);
    } catch (error) {
      console.error('Error processing test message:', error);
      askForInput();
    }
  });
}

// Add cleanup to restore original methods on exit
process.on('exit', () => {
  whatsappClient.sendTextMessage = originalSendTextMessage;
  whatsappClient.markMessageAsRead = originalMarkMessageAsRead;
});

// Start the test loop
startTestLoop().catch(error => {
  console.error('Test script error:', error);
  process.exit(1);
}); 