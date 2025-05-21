import { Hono } from 'hono';
import getConfig from './config.js';
import { processWhatsAppMessage } from './handler.js';

// Create a router for WhatsApp webhook endpoints
const whatsappRouter = new Hono();

// Verification endpoint for WhatsApp webhook setup
whatsappRouter.get('/webhook', async (c) => {
  try {
    const config = getConfig();
    const mode = c.req.query('hub.mode');
    const token = c.req.query('hub.verify_token');
    const challenge = c.req.query('hub.challenge');
    
    // Check if a token and mode is in the query string of the request
    if (mode && token) {
      // Check the mode and token sent are correct
      if (mode === 'subscribe' && token === config.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
        // Respond with the challenge token from the request
        console.log('WEBHOOK_VERIFIED');
        return c.text(challenge || '');
      } else {
        // Respond with '403 Forbidden' if verify tokens do not match
        return c.text('Forbidden', 403);
      }
    }
    
    return c.text('Bad Request', 400);
  } catch (error) {
    console.error('Error verifying webhook:', error);
    return c.text('Server Error', 500);
  }
});

// Endpoint to receive WhatsApp webhook events
whatsappRouter.post('/webhook', async (c) => {
  try {
    const body = await c.req.json();
    
    // Parse the request body from the POST
    if (body.object) {
      // Check for WhatsApp messages
      if (body.entry && 
          body.entry[0].changes && 
          body.entry[0].changes[0] && 
          body.entry[0].changes[0].value.messages && 
          body.entry[0].changes[0].value.messages[0]) {
        
        const messageData = body.entry[0].changes[0].value.messages[0];
        
        // Handle text messages
        if (messageData.type === 'text') {
          const from = messageData.from;
          const text = messageData.text.body;
          const messageId = messageData.id;
          
          // Process message asynchronously
          processWhatsAppMessage(from, text, messageId).catch(err => {
            console.error('Error in async message processing:', err);
          });
        }
        
        // Return a 200 OK response immediately for all webhook events
        return c.text('OK');
      }
    }
    
    return c.text('Not a WhatsApp message event', 404);
  } catch (error) {
    console.error('Error processing webhook:', error);
    return c.text('Server Error', 500);
  }
});

export default whatsappRouter; 