import fetch from 'node-fetch';
import getConfig from './config.js';
import { isTestMode } from './config.js';

class WhatsAppClient {
  private apiToken: string;
  private phoneNumberId: string;
  private version: string;
  private baseUrl: string;
  private isTestMode: boolean;

  constructor() {
    this.isTestMode = isTestMode;
    const config = getConfig();
    this.apiToken = config.WHATSAPP_API_TOKEN;
    this.phoneNumberId = config.WHATSAPP_PHONE_NUMBER_ID;
    this.version = config.WHATSAPP_VERSION;
    this.baseUrl = `https://graph.facebook.com/${this.version}/${this.phoneNumberId}`;
    
    if (this.isTestMode) {
      console.log('[TEST MODE] WhatsApp client initialized in test mode');
    }
  }

  /**
   * Send a text message to a WhatsApp user
   */
  async sendTextMessage(to: string, text: string): Promise<any> {
    // In test mode, don't make actual API calls
    if (this.isTestMode) {
      console.log(`[TEST MODE] Would send to ${to}: ${text}`);
      return { success: true, message_id: 'test-message-id' };
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiToken}`
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: { body: text }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`WhatsApp API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }

  /**
   * Mark a message as read
   */
  async markMessageAsRead(messageId: string): Promise<any> {
    // In test mode, don't make actual API calls
    if (this.isTestMode) {
      console.log(`[TEST MODE] Would mark message ${messageId} as read`);
      return { success: true };
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiToken}`
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`WhatsApp API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const whatsappClient = new WhatsAppClient();
export default whatsappClient; 