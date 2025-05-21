import { NotionAgent } from '../agent.js';
import whatsappClient from './client.js';

// Store user sessions with their state
const userSessions = new Map<string, { agent: NotionAgent, pendingConfirmation?: boolean }>();

/**
 * Process an incoming WhatsApp message
 * @param from The sender's phone number
 * @param text The message text
 * @param messageId The WhatsApp message ID
 */
export async function processWhatsAppMessage(from: string, text: string, messageId: string): Promise<void> {
  console.log(`Processing WhatsApp message from ${from}: ${text}`);
  
  try {
    // Mark message as read first
    await whatsappClient.markMessageAsRead(messageId);
    
    // Get or create user session
    let session = userSessions.get(from);
    if (!session) {
      const agent = await createNewAgentInstance();
      session = { agent };
      userSessions.set(from, session);
      console.log(`Created new session for user ${from}`);
    }
    
    // Process the message using the agent - using exactly the same input
    // The agent's LLM will detect content formats like "as todo" correctly
    const response = await session.agent.chat(text);
    console.log(`Agent response: ${response.content}`);
    
    // Update session state for confirmation if needed
    if (session.agent.get('requireConfirm')) {
      session.pendingConfirmation = true;
      userSessions.set(from, session);
      
      // Send response with confirmation request
      await whatsappClient.sendTextMessage(
        from, 
        `${response.content}\n\nPlease confirm this action by typing "yes" or decline by typing "no"`
      );
    } else {
      // Send regular response
      await whatsappClient.sendTextMessage(from, response.content);
      
      // Clear any pending confirmation state
      if (session.pendingConfirmation) {
        session.pendingConfirmation = false;
        userSessions.set(from, session);
      }
    }
  } catch (error) {
    console.error('Error processing WhatsApp message:', error);
    
    // Send error message to user
    await whatsappClient.sendTextMessage(
      from, 
      "Sorry, there was an error processing your request. Please try again later."
    );
  }
}

/**
 * Create a new agent instance for a user
 */
async function createNewAgentInstance(): Promise<NotionAgent> {
  const agent = new NotionAgent();
  
  // Wait for agent initialization to complete
  let attempts = 0;
  const maxAttempts = 10;
  
  while (!agent.get('agentsInitialized') && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 500));
    attempts++;
  }
  
  if (!agent.get('agentsInitialized')) {
    console.warn('Agent initialization may not have completed');
  }
  
  return agent;
}

/**
 * Clear a user session after inactivity
 */
export function clearUserSession(from: string): void {
  userSessions.delete(from);
  console.log(`Cleared session for user ${from}`);
}

// Set up session cleanup every hour
setInterval(() => {
  // This is a simple example - in production you'd want to track last activity time
  // and only clear sessions that have been inactive for some period
  console.log(`Current active sessions: ${userSessions.size}`);
}, 60 * 60 * 1000); 