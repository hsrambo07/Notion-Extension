# Notion Agent Chrome Extension

A Chrome extension that lets you control Notion with natural language commands using SpinAI and MCP Notion Server.

## Features

- 💬 Send natural language commands to Notion through a simple UI
- ✅ Confirmation for destructive actions before execution
- 🔄 Real-time responses from a local server

## Prerequisites

- Node.js v18 or newer
- pnpm package manager
- A Notion integration token
- OpenAI API key

## Setup

1. Clone this repository:
```bash
git clone <repository-url>
cd notion-agent-extension
```

2. Install dependencies:
```bash
pnpm install
```

3. Create a `.env` file in the root directory based on `.env.example`:
```
NOTION_API_TOKEN=your_notion_integration_token
OPENAI_API_KEY=your_openai_api_key
PORT=8787
MCP_NOTION_PORT=3333
```

### Getting a Notion Integration Token

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Give it a name and select the workspace
4. Copy the "Internal Integration Token" and add it to your `.env` file
5. In your Notion workspace, share the pages/databases you want to access with your integration

## Development

Start the development server:

```bash
pnpm dev
```

This will start:
- MCP Notion server on port 3333
- Backend API server on port 8787

## Loading the Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top-right corner)
3. Click "Load unpacked" and select the `extension` folder
4. The Notion Agent extension should now appear in your extensions list 

## Usage

1. Click on the Notion Agent extension icon in your browser
2. Type a natural language command in the textarea (e.g., "Create a new TODO page called 'Hello World'")
3. Click "Run" to send the command
4. If the action requires confirmation, you'll see a prompt to confirm or cancel
5. After confirmation, the action will be executed in your Notion workspace

## Testing

Run the test suite with:

```bash
pnpm test
```

## Troubleshooting

### CORS Issues
- Make sure the server is running on the expected port (8787)
- Check that the content security policy in `manifest.json` includes the correct server URL

### Authentication Errors
- Verify your Notion token and OpenAI API key in the `.env` file
- Ensure your Notion integration has access to the pages/databases you're trying to modify

### Mixed Content Errors
- The extension should connect to localhost over HTTP, which is allowed in the content security policy

## License

ISC 