// Direct test of the MultiCommandHandler to debug our pattern detection
import { createCommandParser } from './dist/server/command-parser.js';
import { createMultiCommandHandler } from './dist/server/multi-command-handler.js';

// Test the pattern detection directly
async function testPatternDetection() {
  console.log('🧪 Testing MultiCommandHandler Pattern Detection');
  console.log('==============================================');
  
  const input = "add hey there in checklist and woohoo in checklist too in Personal thoughts";
  console.log(`Input: "${input}"`);
  
  // Access the private method through temporary function attached to prototype
  const parser = await createCommandParser('fake-key', true);
  const handler = createMultiCommandHandler(parser);
  
  // Create a test function to call the private method
  function testDetection() {
    // Direct test of the patterns
    const patterns = [
      // "X and Y" pattern
      /\b(?:add|create|write|edit)\b.*?\band\b.*?\b(?:add|create|write|edit)\b/i,
      
      // "X, then Y" pattern
      /\b(?:add|create|write|edit)\b.*?,\s*then\b.*?\b(?:add|create|write|edit)\b/i,
      
      // URL with comment indicator
      /https?:\/\/.*?\b(?:with|comment|note|saying)\b/i,
      
      // Two separate "in X" or "to Y" targets
      /\b(?:in|to)\s+['"]?([^'",.]+?)['"]?(?:\s+page)?\b.*?\b(?:in|to)\s+['"]?([^'",.]+?)['"]?(?:\s+page)?\b/i,
      
      // "Add X as Y and this as Z" pattern - specific multi-format pattern
      /\b(?:add|write)\b.*?\bas\s+(\w+).*?\band\b.*?\b(?:this|it)\b.*?\bas\s+(\w+)\b/i,
      
      // Multiple checklist items pattern (with "and")
      /\b(?:add|create|write)\b\s+.*?\s+in\s+checklist\s+and\s+.*?\s+in\s+checklist\b/i,
      
      // Comma-separated checklist items
      /\b(?:add|create|write)\b\s+.*?(?:,\s+.*?)+\s+(?:in|as)\s+checklist\b/i,
      
      // Checklist with "too" pattern
      /\b(?:add|create|write)\b\s+.*?\s+(?:in|as)\s+checklist\s+.*?\s+too\b/i
    ];
    
    console.log('\nTesting each pattern:');
    patterns.forEach((pattern, i) => {
      const matches = pattern.test(input);
      console.log(`Pattern ${i+1}: ${matches ? '✅ MATCHES' : '❌ NO MATCH'}`);
    });
    
    // Also test the multiple checklist specific patterns
    const checklistPattern = /add\s+(.*?)\s+in\s+checklist\s+and\s+(.*?)\s+in\s+checklist(?:\s+too)?(?:\s+in\s+([^,.]+))?/i;
    const checklistMatch = checklistPattern.exec(input);
    console.log('\nMultiple checklist pattern match:', !!checklistMatch);
    if (checklistMatch) {
      console.log('First item:', checklistMatch[1]);
      console.log('Second item:', checklistMatch[2]);
      console.log('Target page:', checklistMatch[3]);
    }
  }
  
  // Call the test function
  testDetection();
  
  console.log('\nNow testing full command parsing:');
  try {
    const commands = await handler.processCommand(input);
    console.log(`Detected ${commands.length} commands`);
    console.log('Commands:', JSON.stringify(commands, null, 2));
  } catch (error) {
    console.error('Error parsing command:', error);
  }
}

testPatternDetection(); 