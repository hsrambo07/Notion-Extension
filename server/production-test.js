/**
 * PRODUCTION TEST SCRIPT
 * Tests the LLM parser with real API calls against complex scenarios
 * 
 * Run with: node server/production-test.js
 */

import { createEnhancedMultiCommandHandler } from './enhanced-multi-command-handler.js';
import dotenv from 'dotenv';

// Load environment variables - ensure OPENAI_API_KEY is set
dotenv.config();

// Use real API calls (no test mode)
const isTestMode = false;
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error('ERROR: OPENAI_API_KEY environment variable must be set');
  console.error('Create a .env file with OPENAI_API_KEY=your_key or set it in your environment');
  process.exit(1);
}

// Test scenarios - each designed to test specific capabilities
const testScenarios = [
  {
    name: "Multiple Commands (5+)",
    command: "Add a to-do for team meeting tomorrow, create a toggle for quarterly goals, add a bullet point about budget updates, insert code snippet for React component, and add a callout warning about the deadline"
  },
  {
    name: "Deeply Nested Pages",
    command: "Add a note about project timeline in Development section of Product Roadmap page in Q3 Planning page"
  },
  {
    name: "Multiple Block Types",
    command: "Create a page called Weekly Update with a heading Level 1 saying 'Week Overview', bullet points for key metrics, a toggle for additional details, and a to-do list for follow-ups"
  },
  {
    name: "Media and Embeds",
    command: "Add an image placeholder for team photo, embed a YouTube video about product demo, and insert a link to the documentation site"
  },
  {
    name: "Complex Tables and Formatting",
    command: "Create a 3x4 table with Q1-Q3 quarters as columns and revenue, costs, and profit as rows, then add a divider and a bulleted summary below it"
  },
  {
    name: "Typos and Informal Language",
    command: "hey can u pls add sum stuf bout marketing in da stratgy page n also put a todolist for da team meetin tmrw thx"
  },
  {
    name: "Section Targeting with Typos",
    command: "Add a task to review project in intetesting promts section and also create a toggle with meeting notes in weeky update section"
  },
  {
    name: "Mixed Command Types",
    command: "Delete the outdated metrics section, then add a new heading called 'Current Metrics' with three bullet points for KPIs, and update the status in the project overview"
  }
];

async function runProductionTests() {
  console.log('=== RUNNING PRODUCTION TESTS WITH LIVE API CALLS ===\n');
  
  // Create the enhanced multi-command handler with real API access
  const handler = createEnhancedMultiCommandHandler(apiKey, isTestMode);
  
  // Test each scenario
  for (const [index, scenario] of testScenarios.entries()) {
    console.log(`\n${index + 1}. ${scenario.name} TEST`);
    console.log(`Command: "${scenario.command}"`);
    
    try {
      console.log('\nParsing...');
      const startTime = Date.now();
      const result = await handler.processCommand(scenario.command);
      const elapsed = Date.now() - startTime;
      
      console.log(`\n=== RESULTS (${elapsed}ms) ===`);
      console.log('Commands detected:', result.length);
      
      result.forEach((cmd, cmdIndex) => {
        console.log(`\nCommand ${cmdIndex + 1}:`);
        console.log(`- Action: ${cmd.action || 'write'}`);
        console.log(`- Primary Target: ${cmd.primaryTarget || 'Default'}`);
        console.log(`- Content: ${cmd.content || 'Empty'}`);
        console.log(`- Format Type: ${cmd.formatType || 'paragraph'}`);
        
        if (cmd.sectionTarget) {
          console.log(`- Section Target: ${cmd.sectionTarget}`);
        }
        
        // Print any special properties
        if (cmd.specialProperties) {
          console.log('- Special Properties:');
          Object.entries(cmd.specialProperties).forEach(([key, value]) => {
            console.log(`  - ${key}: ${JSON.stringify(value)}`);
          });
        }
        
        if (cmd.isMultiAction) {
          console.log(`- Is Multi-Action: ${cmd.isMultiAction}`);
        }
      });
      
      console.log(`\n✅ ${scenario.name} TEST PASSED`);
    } catch (error) {
      console.error(`\n❌ ERROR: ${error.message}`);
      console.error('Test failed for scenario:', scenario.name);
    }
  }
  
  console.log('\n=== ALL PRODUCTION TESTS COMPLETE ===');
}

// Run the tests
runProductionTests().catch(err => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
}); 