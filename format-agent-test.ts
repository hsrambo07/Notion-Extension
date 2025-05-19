import { FormatAgent, createFormatAgent } from './server/format-agent.js';
import { config } from 'dotenv';

// Load environment variables
config();

// Ensure we're using the production environment for OpenAI access
process.env.NODE_ENV = 'production';

async function testFormatAgent() {
  try {
    console.log('🧪 Testing FormatAgent for complex formatting capabilities');
    console.log('=====================================================');
    
    // Create FormatAgent instance with OpenAI integration
    const openAiApiKey = process.env.OPENAI_API_KEY || '';
    const formatAgent = await createFormatAgent(openAiApiKey);
    
    // Array of test cases to evaluate
    const testCases = [
      // Basic formatting tests
      { 
        category: "Basic formats",
        content: "This is a simple paragraph test",
        formatHint: ""
      },
      { 
        category: "Basic formats",
        content: "This is a bulleted list test",
        formatHint: "bullet"
      },
      
      // Toggle lists
      { 
        category: "Toggle lists",
        content: "This is a toggle list test",
        formatHint: "toggle"
      },
      
      // Checklists
      { 
        category: "Checklists",
        content: "First task, Second task, Third task",
        formatHint: "checklist"
      },
      {
        category: "Checklists",
        content: "- Order a jhoola first\n- Second check list\n- Order a monitor",
        formatHint: "checklist"
      },
      
      // Nested structures - the challenging part
      {
        category: "Nested structures",
        content: "Toggle title with these tasks: Order a jhoola first, Second check list, Order a monitor",
        formatHint: "checklist_in_toggle"
      },
      
      // The specific complex case that was problematic
      {
        category: "Complex cases",
        content: "Can you add a toggle list with content regarding my checklist that is to say: - Order a jhoola first - Second check list - Order a monitor to the page journal",
        formatHint: ""
      },
      
      // Additional test for natural language separators
      {
        category: "Natural language parsing",
        content: "Create a toggle called 'Shopping' with items: groceries, electronics, and household items",
        formatHint: ""
      },
      
      // Test for handling deeply nested structures
      {
        category: "Deep nesting",
        content: "Create a toggle 'Project Plan' with sub-toggles: 'Phase 1' containing tasks 'Research' and 'Design', 'Phase 2' containing tasks 'Development' and 'Testing'",
        formatHint: ""
      }
    ];
    
    // Process each test case
    let currentCategory = "";
    
    for (const testCase of testCases) {
      // Print category headers
      if (testCase.category !== currentCategory) {
        currentCategory = testCase.category;
        console.log(`\n\n## ${currentCategory.toUpperCase()} ##`);
      }
      
      console.log(`\n🔹 Content: "${testCase.content}"`);
      console.log(`  Format Hint: ${testCase.formatHint || '(none)'}`);
      
      try {
        // Format the content using the FormatAgent
        console.log('  Formatting...');
        const formattedBlocks = await formatAgent.formatContent(testCase.content, testCase.formatHint);
        
        // Display the formatted result
        console.log('  Formatted result:');
        console.log(JSON.stringify(formattedBlocks, null, 2));
        
        // Simple validation check
        if (formattedBlocks && Array.isArray(formattedBlocks) && formattedBlocks.length > 0) {
          console.log('  ✅ SUCCESS: Content successfully formatted');
          
          // Check specific format types
          if (testCase.formatHint === 'checklist_in_toggle' || 
              testCase.content.toLowerCase().includes('toggle') && 
              (testCase.content.toLowerCase().includes('checklist') || 
               testCase.content.toLowerCase().includes('tasks'))) {
            
            // Check if we have a toggle block with children
            const hasToggleWithChildren = formattedBlocks.some(block => 
              block.type === 'toggle' && 
              block.toggle && 
              block.toggle.children && 
              Array.isArray(block.toggle.children) && 
              block.toggle.children.length > 0
            );
            
            if (hasToggleWithChildren) {
              console.log('  ✅ SPECIAL SUCCESS: Properly created toggle with children');
            } else {
              console.log('  ⚠️ ISSUE: Expected a toggle with children but didn\'t find one');
            }
          }
        } else {
          console.log('  ⚠️ WARNING: Empty or invalid result returned');
        }
      } catch (error: unknown) {
        console.log(`  ❌ ERROR: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    console.log('\n\n🔍 FormatAgent Testing Complete');
    
  } catch (error) {
    console.error('Error during FormatAgent testing:', error);
  }
}

// Run the tests
testFormatAgent(); 