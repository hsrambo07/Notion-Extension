/**
 * Test script to check .env loading
 */

import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('Current working directory:', process.cwd());
console.log('Script directory:', __dirname);

// Try loading from multiple locations
console.log('Trying to load .env files...');

// Load from current directory
config({ path: path.join(process.cwd(), '.env') });
console.log('After loading from current directory');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? `Set (length: ${process.env.OPENAI_API_KEY.length})` : 'Not set');

// Load from parent directory
config({ path: path.join(process.cwd(), '..', '.env') });
console.log('After loading from parent directory');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? `Set (length: ${process.env.OPENAI_API_KEY.length})` : 'Not set');

// Try absolute path
const absolutePath = '/Users/harshsinghal/Desktop/Vibe Coding/Random Tools/Notion Extension/.env';
config({ path: absolutePath });
console.log(`After loading from ${absolutePath}`);
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? `Set (length: ${process.env.OPENAI_API_KEY.length})` : 'Not set');

// Check all environment variables
console.log('\nAll environment variables:');
console.log(process.env); 