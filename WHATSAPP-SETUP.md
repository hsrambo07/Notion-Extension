# WhatsApp Integration Setup

This guide covers how to set up and test the WhatsApp integration for the Notion Agent.

## Quick Start (Local Testing)

To test the WhatsApp integration locally without actual WhatsApp API credentials:

1. Make sure you have the necessary environment variables for the Notion Agent (NOTION_API_TOKEN and OPENAI_API_KEY).

2. Run the WhatsApp test script:
   ```bash
   pnpm test:whatsapp
   ```

3. Type commands as if you were sending them via WhatsApp and see how the agent processes them.

## Production Setup

### Environment Variables

Add the following to your `.env` file:

```
# WhatsApp Business API Configuration
WHATSAPP_API_TOKEN=your-whatsapp-api-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_VERSION=v17.0
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-custom-webhook-verify-token
```

### WhatsApp Business API Setup

1. Create a Meta App in the [Meta Developer Portal](https://developers.facebook.com/)
2. Set up WhatsApp Business API access for your app
3. Configure a phone number for your WhatsApp Business account
4. Generate a Permanent Access Token for the WhatsApp API

### Server Deployment

1. Deploy your server to a publicly accessible URL
2. Start the server:
   ```bash
   pnpm dev
   ```

3. Configure your webhook in the Meta Developer Portal:
   - Webhook URL: `https://your-server-url/whatsapp/webhook`
   - Verify Token: Same as your `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
   - Subscribe to the `messages` field

### Test with ngrok During Development

To test with a real WhatsApp integration during development:

1. Install ngrok: `npm install -g ngrok`
2. Start your server: `pnpm dev`
3. Start ngrok: `ngrok http 9000` (or whatever port your server runs on)
4. Use the ngrok URL for your webhook in the Meta Developer Portal
5. Send a message to your WhatsApp Business number to test the integration

## System Architecture

The WhatsApp integration consists of the following components:

1. **WhatsApp Business API**: Handles message sending/receiving through Meta's API
2. **Webhook Controller**: Processes incoming webhook events from WhatsApp
3. **Message Handler**: Manages user sessions and invokes the Notion Agent
4. **Notion Agent**: The same agent used by the Chrome extension

## Troubleshooting

If you encounter issues with the WhatsApp integration:

1. Check that your environment variables are set correctly
2. Ensure your server is running and accessible via the webhook URL
3. Verify that your WhatsApp Business API credentials are valid
4. Check the server logs for any errors during message processing

For development testing without WhatsApp API credentials, use the local test script:
```bash
pnpm test:whatsapp
```
