# WhatsApp Integration for Notion Agent

This integration allows you to interact with your Notion workspace through WhatsApp messages, using the same natural language processing capabilities as the Chrome extension.

## Overview

The WhatsApp integration lets you send commands via WhatsApp messages that get processed by the same agent system that powers the Chrome extension. This provides an alternative interface for controlling your Notion workspace from your mobile device without needing to install a browser extension.

```
┌───────────────┐     ┌───────────────┐     ┌─────────────────┐     ┌────────────────────┐
│   WhatsApp    │     │ WhatsApp      │     │   Agent Server  │     │     Notion API      │
│   ┌─────────┐ │     │ Business API  │     │  ┌───────────┐  │     │  ┌──────────────┐  │
│   │ User    │ │     │ ┌───────────┐ │     │  │Notion Agent│  │     │  │  Workspace   │  │
│   │ Message │ │────►│ │ Webhook   │ │────►│  │  ┌─────┐   │◄─┼────►│  │  ┌────────┐  │  │
│   └─────────┘ │     │ └───────────┘ │     │  │  │Parse│   │  │     │  │  │  Pages │  │  │
│               │     │               │     │  │  └─────┘   │  │     │  │  └────────┘  │  │
│   ┌─────────┐ │     │ ┌───────────┐ │     │  │  ┌─────┐   │  │     │  │  ┌────────┐  │  │
│   │ Response│◄┼─────┤ │ API       │◄┼─────┤  │  │Exec │   │  │     │  │  │ Blocks │  │  │
│   └─────────┘ │     │ └───────────┘ │     │  │  └─────┘   │  │     │  │  └────────┘  │  │
└───────────────┘     └───────────────┘     │  └───────────┘  │     └────────────────────┘
                                            └─────────────────┘
```

## Features

- 💬 **Same Natural Language Processing**: Send the same natural language commands as you would through the extension
- 👤 **User Session Management**: Each WhatsApp number maintains its own session with the agent
- ✅ **Action Confirmation**: Destructive actions still require confirmation, just like in the extension
- 📱 **Mobile-First Experience**: Access your Notion workspace from anywhere using just WhatsApp

## Setup

### Prerequisites

- A Meta Developer account
- A WhatsApp Business Account or access to the WhatsApp Business API
- A publicly accessible server to receive webhook events (or use a tool like ngrok for development)
- A Notion integration token and OpenAI API key (same as for the extension)

### WhatsApp Business API Setup

1. Create a Meta App in the [Meta Developer Portal](https://developers.facebook.com/)
2. Set up the WhatsApp Business API for your app
3. Configure a phone number for your WhatsApp Business account
4. Generate a Permanent Access Token for the WhatsApp API

### Server Configuration

1. Add the following environment variables to your `.env` file:

```
# WhatsApp Business API Configuration
WHATSAPP_API_TOKEN=your-whatsapp-api-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_VERSION=v17.0
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-custom-webhook-verify-token
```

2. Start the server with the WhatsApp integration:

```bash
pnpm dev
```

3. Configure your webhook in the Meta Developer Portal:
   - Webhook URL: `https://your-server-url/whatsapp/webhook`
   - Verify Token: Same as your `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
   - Subscribe to the `messages` field

### Webhook Setup with ngrok (for development)

If you're developing locally, you can use ngrok to expose your local server:

1. Install ngrok: `npm install -g ngrok`
2. Start your server: `pnpm dev`
3. Create an ngrok tunnel: `ngrok http 9000` (or whatever port your server runs on)
4. Use the ngrok URL for your webhook: `https://your-ngrok-url/whatsapp/webhook`

## Usage

Once set up, you can send the same types of commands you would use in the Chrome extension:

- "Create a new page called Project Ideas"
- "Add a bullet list with meeting notes to Weekly Summary"
- "Find deadlines in my Project Status page" 

The agent will process your command and send back a response through WhatsApp.

## Limitations

- **Attachment Handling**: Currently only text messages are supported
- **Rich Formatting**: WhatsApp's message format doesn't support the same rich text display as the Chrome extension
- **Immediate Feedback**: Due to the asynchronous nature of WhatsApp, there might be slight delays in processing

## Troubleshooting

### Common Issues

- **Webhook Verification Failed**: Double-check your verify token in both the Meta Developer Portal and your server
- **Message Not Received**: Ensure your webhook is subscribed to the `messages` field
- **Server Not Responding**: Check your server logs for any errors in processing

### Debugging

- Check the server logs for any errors during message processing
- Verify webhook events are being received by the server
- Ensure the WhatsApp client can send messages using your access token 