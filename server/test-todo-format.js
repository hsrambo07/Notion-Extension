import { createAIAgentNetwork } from './ai-agent-network.ts';
import { processContentByFormat, createToDoBlock } from './notion-blocks.js';

// Test inputs to verify to-do detection works in all cases
const testInputs = [
  "add order phone as checklist in tasks page",
  "add buy milk as todo in tasks page",
  "add call mom as to-do in tasks page",
  "add finish report as a task in tasks page",
  "add oreder phone as checklist in tasks page", // Intentional typo
];

// Regular expression for detecting to-do patterns
const todoPattern = /\bas\s+(?:a\s+)?(todo|to-?do|checklist|task)\b/i;

// Direct test of the block creation
function testDirectFormatting() {
  console.log("\n=== Testing Direct Block Formatting ===");
  
  for (const input of testInputs) {
    console.log(`\n--- Testing input: "${input}" ---`);
    
    // 1. Extract content (simulate command parser)
    const contentMatch = input.match(/add\s+(.*?)\s+as\s+(?:a\s+)?(?:todo|to-?do|checklist|task)(?:\s+in\s+([^,.]+))?/i);
    
    if (contentMatch) {
      const content = contentMatch[1]?.trim() || '';
      console.log(`Extracted content: "${content}"`);
      
      // 2. Detect format type
      const formatType = 'to_do'; // Force format type for test
      console.log(`Format type: ${formatType}`);
      
      // 3. Create blocks
      console.log("Creating blocks...");
      const blocks = processContentByFormat(content, formatType);
      console.log("Generated blocks:", JSON.stringify(blocks, null, 2));
      
      // 4. Check block type
      const isToDo = blocks.some(block => block.type === 'to_do');
      console.log(`Block type check: ${isToDo ? 'TO-DO BLOCK CREATED ✓' : 'NOT A TO-DO BLOCK ✗'}`);
    } else {
      console.log(`⚠️ Could not extract content from input: "${input}"`);
    }
  }
}

// Test the regex directly
function testRegexDetection() {
  console.log("\n=== Testing Regex Pattern Detection ===");
  
  for (const input of testInputs) {
    const hasMatch = todoPattern.test(input);
    console.log(`"${input}" - ${hasMatch ? '✓ MATCHED' : '✗ NOT MATCHED'}`);
    
    if (hasMatch) {
      const match = input.match(todoPattern);
      console.log(`  Match: "${match?.[0]}"`);
    }
  }
}

// Run the tests
testRegexDetection();
testDirectFormatting();

console.log("\n=== Test Complete ==="); 