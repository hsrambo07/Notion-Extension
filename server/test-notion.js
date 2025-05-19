// Simple script to test Notion API connection
import { createAgent } from './agent.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from both locations
config({ path: path.join(__dirname, '..', '.env') });
config({ path: path.join(__dirname, '.env') });

console.log('NOTION_API_TOKEN:', process.env.NOTION_API_TOKEN ? 'Set (length: ' + process.env.NOTION_API_TOKEN.length + ')' : 'Not set');

async function testNotionAPI() {
    try {
        const agent = await createAgent();
        console.log('Agent created');
        
        const response = await fetch('https://api.notion.com/v1/users/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.NOTION_API_TOKEN}`,
                'Notion-Version': '2022-06-28'
            }
        });
        
        if (!response.ok) {
            console.error('Notion API error:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Error details:', errorText);
            return;
        }
        
        const data = await response.json();
        console.log('Notion API response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error testing Notion API:', error);
    }
}

testNotionAPI(); 