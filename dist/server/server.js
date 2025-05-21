import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { config } from 'dotenv';
import { spawn } from 'child_process';
import { validateChatRequest, createAgent } from './agent.js';
import { rateLimit } from './middleware/rate-limit.js';
import { serve } from '@hono/node-server';
// Remove the problematic import and use raw request handling instead
// Import the WhatsApp router
import { whatsappRouter } from './whatsapp/index.js';
// Load environment variables
config();
// Validate OpenAI API key
function validateOpenAIKey() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error('❌ ERROR: No OpenAI API key found in environment variables.');
        console.error('Please set OPENAI_API_KEY in your .env file.');
        return false;
    }
    if (!apiKey.startsWith('sk-')) {
        console.error('❌ ERROR: Invalid OpenAI API key format. Key should start with "sk-".');
        console.error(`Current key starts with "${apiKey.substring(0, 5)}..."`);
        return false;
    }
    if (apiKey.length < 30) {
        console.error('❌ ERROR: OpenAI API key appears to be truncated or malformed.');
        console.error(`Key length: ${apiKey.length} characters (expected at least 30)`);
        return false;
    }
    // Test for common errors in the key
    if (apiKey.includes(' ') || apiKey.includes('\n') || apiKey.includes('\r')) {
        console.error('❌ ERROR: OpenAI API key contains whitespace characters.');
        return false;
    }
    console.log('✅ OpenAI API key format appears valid.');
    return true;
}
// Debug environment variables
console.log('Server environment variables:', {
    nodeEnv: process.env.NODE_ENV,
    notionApiToken: process.env.NOTION_API_TOKEN ? 'Set (length: ' + process.env.NOTION_API_TOKEN.length + ')' : 'Not set',
    openAiApiKey: process.env.OPENAI_API_KEY ? 'Set (length: ' + process.env.OPENAI_API_KEY.length + ')' : 'Not set',
    port: process.env.PORT || '9000',
    mcpNotionPort: process.env.MCP_NOTION_PORT || '3333',
    // Log WhatsApp config status
    whatsappApiToken: process.env.WHATSAPP_API_TOKEN ? 'Set (length: ' + process.env.WHATSAPP_API_TOKEN.length + ')' : 'Not set',
    whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ? 'Set' : 'Not set',
    whatsappWebhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ? 'Set' : 'Not set'
});
// Run API key validation
validateOpenAIKey();
// Create a shared agent instance
let agentInstance = null;
async function getAgentInstance() {
    if (!agentInstance) {
        console.log('Creating new agent instance');
        agentInstance = await createAgent();
    }
    return agentInstance;
}
// Start MCP Notion server if not already running in dev mode
const startMcpServer = () => {
    if (process.env.NODE_ENV !== 'test') {
        const mcpServer = spawn('npx', ['@suekou/mcp-notion-server'], {
            env: {
                ...process.env,
                MCP_NOTION_PORT: process.env.MCP_NOTION_PORT || '3333'
            },
            stdio: 'inherit'
        });
        mcpServer.on('error', (err) => {
            console.error('Failed to start MCP Notion server:', err);
        });
        process.on('exit', () => {
            mcpServer.kill();
        });
    }
};
// Initialize the Hono app
const app = new Hono();
// Apply middleware
app.use('*', logger());
app.use('*', cors({
    origin: ['chrome-extension://anbjagmgodjejmpbdfiikmllmkobhmji', 'http://localhost:*'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
    maxAge: 86400,
    credentials: true,
}));
app.use('*', rateLimit({ limit: 30, window: 60000 })); // 30 requests per minute
// Health check endpoint
app.get('/', (c) => c.text('Notion Agent API'));
// Chat endpoint
app.post('/chat', async (c) => {
    try {
        console.log('Received chat request');
        const body = await c.req.json();
        console.log('Request body:', body);
        const validatedRequest = await validateChatRequest(body);
        console.log('Validated request:', validatedRequest);
        // Get the shared agent instance
        const agent = await getAgentInstance();
        // Set confirmation flag if provided
        if (validatedRequest.confirm) {
            agent.set('confirm', true);
        }
        // Process the request using the agent
        const response = await agent.chat(validatedRequest.input);
        console.log('Chat result:', response);
        // Return the agent's response with confirmation state
        return c.json({
            response: response.content,
            requireConfirm: agent.get('requireConfirm') || false
        });
    }
    catch (error) {
        console.error('Error processing chat request:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        if (error instanceof Error && error.name === 'ZodError') {
            return c.json({ error: 'Invalid request format', details: error.errors }, 400);
        }
        return c.json({ error: 'Failed to process request' }, 500);
    }
});
// Enhanced upload endpoint for mixed content
app.post('/upload', async (c) => {
    try {
        console.log('Received mixed content upload request');
        // Get request content type to determine how to parse the body
        const contentType = c.req.header('content-type') || '';
        // Check if it's multipart form-data
        if (!contentType.includes('multipart/form-data')) {
            return c.json({
                error: 'Invalid request format',
                message: 'Expected multipart/form-data'
            }, 400);
        }
        // Since we're on Node.js environment, we can use Request directly
        const formData = await c.req.raw.formData();
        const fields = {};
        const files = [];
        // Process form data entries
        for (const [key, value] of formData.entries()) {
            if (typeof value === 'string') {
                fields[key] = value;
            }
            else if (value instanceof Blob) {
                // This is a file - convert to buffer
                const arrayBuffer = await value.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                files.push({
                    name: value.name || 'unnamed',
                    type: value.type || 'application/octet-stream',
                    buffer
                });
            }
        }
        console.log('Received fields:', fields);
        console.log('Received files:', files.map((f) => ({ name: f.name, type: f.type })));
        // Get the target page title and content details
        const pageTitle = fields.pageTitle || 'TEST MCP';
        const textContent = fields.content || '';
        let formatType = fields.formatType;
        const sectionTitle = fields.sectionTitle;
        // Get the shared agent instance
        const agent = await getAgentInstance();
        const results = [];
        // Process text content if present
        if (textContent) {
            console.log('Processing text content:', { textContent, formatType });
            // If no format type specified, let the agent detect it
            if (!formatType) {
                // Create the command in a way that our existing agents can understand
                const command = `add "${textContent}" ${sectionTitle ? `to ${sectionTitle} section in ` : 'to '}${pageTitle}`;
                console.log('Using intelligent format detection with command:', command);
                const textResponse = await agent.chat(command);
                results.push({
                    type: 'text',
                    content: textContent,
                    success: true,
                    message: textResponse.content
                });
            }
            else {
                // Use specified format type
                const textResponse = await agent.chat('', {
                    pageTitle,
                    content: textContent,
                    formatType,
                    sectionTitle
                });
                results.push({
                    type: 'text',
                    content: textContent,
                    format: formatType,
                    success: true,
                    message: textResponse.content
                });
            }
        }
        // Process files (including clipboard data and screenshots)
        for (const file of files) {
            console.log('Processing file:', { name: file.name, type: file.type });
            // Handle clipboard data (usually without filename)
            const isClipboardData = !file.name || file.name === 'clipboard';
            const fileExt = file.type.split('/')[1] || 'png';
            const fileName = isClipboardData ?
                `clipboard_${new Date().toISOString().replace(/[:.]/g, '-')}.${fileExt}` :
                file.name;
            // Process the file using the agent
            const response = await agent.chat('', {
                pageTitle,
                sectionTitle,
                file: {
                    buffer: file.buffer,
                    originalname: fileName,
                    mimetype: file.type
                }
            });
            results.push({
                type: 'file',
                filename: fileName,
                isClipboardData,
                success: true,
                message: response.content
            });
        }
        // If no content was processed at all
        if (results.length === 0) {
            return c.json({
                error: 'No content provided',
                message: 'Please provide either text content or files to upload'
            }, 400);
        }
        return c.json({
            success: true,
            pageTitle,
            sectionTitle: sectionTitle || 'No specific section',
            results
        });
    }
    catch (error) {
        console.error('Error processing mixed content upload:', error);
        return c.json({
            error: 'Failed to process upload request',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});
// Mount WhatsApp webhook routes
app.route('/whatsapp', whatsappRouter);
// Start the server
const PORT = parseInt(process.env.PORT || '9000', 10);
if (process.env.NODE_ENV !== 'test') {
    startMcpServer();
    serve({
        fetch: app.fetch,
        port: PORT,
    }, (info) => {
        console.log(`🚀 Server running on http://localhost:${info.port}`);
        console.log(`📝 MCP Notion server running on port ${process.env.MCP_NOTION_PORT || 3333}`);
        console.log(`📱 WhatsApp webhook available at http://localhost:${info.port}/whatsapp/webhook`);
    });
}
export default app;
//# sourceMappingURL=server.js.map