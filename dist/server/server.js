import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { config } from 'dotenv';
import { spawn } from 'child_process';
import { validateChatRequest, processChat } from './agent.js';
import { rateLimit } from './middleware/rate-limit.js';
import { serve } from '@hono/node-server';
config();
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
        const body = await c.req.json();
        const validatedRequest = await validateChatRequest(body);
        const result = await processChat(validatedRequest.input, validatedRequest.confirm);
        return c.json(result);
    }
    catch (error) {
        console.error('Error processing chat request:', error);
        if (error instanceof Error && error.name === 'ZodError') {
            return c.json({ error: 'Invalid request format', details: error.errors }, 400);
        }
        return c.json({ error: 'Failed to process request' }, 500);
    }
});
// Start the server
const PORT = parseInt(process.env.PORT || '8787', 10);
if (process.env.NODE_ENV !== 'test') {
    startMcpServer();
    serve({
        fetch: app.fetch,
        port: PORT,
    }, (info) => {
        console.log(`🚀 Server running on http://localhost:${info.port}`);
        console.log(`📝 MCP Notion server running on port ${process.env.MCP_NOTION_PORT || 3333}`);
    });
}
export default app;
//# sourceMappingURL=server.js.map