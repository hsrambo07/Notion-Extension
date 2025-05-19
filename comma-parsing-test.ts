import { createFormatAgent } from './server/format-agent.js';
import { config } from 'dotenv';

// Load environment variables
config();

// Ensure we're using the production environment for OpenAI access
process.env.NODE_ENV = 'production';

async function testCommaHandling() {
  try {
    console.log('🧪 Testing FormatAgent Comma Handling');
    console.log('====================================');
    
    // Create FormatAgent instance with OpenAI integration
    const openAiApiKey = process.env.OPENAI_API_KEY || '';
    const formatAgent = await createFormatAgent(openAiApiKey);
    
    // Test cases for comma parsing
    const testCases = [
      { 
        name: "Natural language with commas",
        content: "add hey, let's connect as checklist",
        formatHint: "checklist"
      },
      { 
        name: "Actual list with commas",
        content: "First item, Second item, and Third item",
        formatHint: "checklist"
      },
      {
        name: "Mixed case - natural language with commas but actually multiple items",
        content: "buy milk, pick up dry cleaning, call mom",
        formatHint: "checklist"
      },
      {
        name: "Toggle with natural language items",
        content: "Create a toggle with content: hey, let's connect",
        formatHint: "toggle"
      },
      {
        name: "Exact image example",
        content: "add hey, let's connect as checklist under My Day title section in journal page",
        formatHint: "checklist"
      }
    ];
    
    // Process each test case
    for (const testCase of testCases) {
      console.log(`\n## TEST: ${testCase.name} ##`);
      console.log(`Content: "${testCase.content}"`);
      console.log(`Format Hint: ${testCase.formatHint}`);
      
      try {
        // Format the content using the FormatAgent
        console.log('Formatting...');
        const formattedBlocks = await formatAgent.formatContent(testCase.content, testCase.formatHint);
        
        // Display the formatted result
        console.log('Formatted result:');
        console.log(JSON.stringify(formattedBlocks, null, 2));
        
        // Check how many items were created
        let itemCount = 0;
        let firstItem = 'None';
        
        if (testCase.formatHint === 'checklist') {
          if (formattedBlocks[0].type === 'to_do') {
            itemCount = formattedBlocks.length;
            firstItem = formattedBlocks[0].to_do.rich_text[0].text.content;
          } else if (formattedBlocks[0].type === 'toggle' && formattedBlocks[0].toggle.children) {
            itemCount = formattedBlocks[0].toggle.children.length;
            firstItem = formattedBlocks[0].toggle.children[0].to_do.rich_text[0].text.content;
          }
        }
        
        console.log(`Number of items created: ${itemCount}`);
        console.log(`First item content: "${firstItem}"`);
        
        // Success/failure assessment
        if (testCase.name === "Natural language with commas" && itemCount === 1) {
          console.log('✅ SUCCESS: Natural language with commas was NOT split');
        } else if (testCase.name === "Actual list with commas" && itemCount > 1) {
          console.log('✅ SUCCESS: List items were correctly split');
        } else if (testCase.name === "Natural language with commas" && itemCount > 1) {
          console.log('❌ FAILURE: Natural language was incorrectly split at commas');
        }
        
      } catch (error: unknown) {
        console.log(`❌ ERROR: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    console.log('\n🔍 Comma Handling Test Complete');
    
  } catch (error) {
    console.error('Error during testing:', error);
  }
}

// Run the tests
testCommaHandling(); 