import { createAgent } from './server/agent.js';
import { config } from 'dotenv';

// Load environment variables
config();

// Ensure we're using the OpenAI integration
process.env.NODE_ENV = 'production';

async function testLLMParsing() {
  try {
    console.log('🧪 Testing LLM request parsing capabilities');
    console.log('==========================================');
    
    // Create agent instance with OpenAI integration
    const agent = await createAgent();
    // Access the internal parseAction method directly
    const parseAction = agent['parseAction'].bind(agent);
    
    // Array of test cases to evaluate
    const testCases = [
      // Standard formats
      { 
        category: "Standard formats",
        input: 'In Notion, write "Meeting notes for product team" in Project Updates'
      },
      { 
        category: "Standard formats",
        input: 'Write "Shopping list" in Todo page'
      },
      
      // Complex page names
      { 
        category: "Complex page names",
        input: 'Write "Monthly goals" in Q3 2025 Planning & Strategy'
      },
      { 
        category: "Complex page names",
        input: 'Add "Bug fixes" to Product Roadmap v2.0'
      },
      
      // Ambiguous commands
      { 
        category: "Ambiguous commands",
        input: 'Add the meeting agenda to the page'
      },
      { 
        category: "Ambiguous commands",
        input: 'In my Notion workspace, update the weekly status'
      },
      
      // Mixed commands
      { 
        category: "Mixed commands", 
        input: 'Add "Call John about project" to my To-Do list and remind me on Friday'
      },
      
      // Multiple operations
      { 
        category: "Multiple operations",
        input: 'Create a new page called Project Timeline and write "Timeline for Q3" in it'
      },
      
      // Alternative phrasing
      { 
        category: "Alternative phrasing",
        input: 'Can you please jot down "Ideas for next sprint" in my Brainstorming page?'
      },
      { 
        category: "Alternative phrasing",
        input: 'I need to save "Login flow improvements" in my Product Backlog'
      },
      
      // Edge cases
      { 
        category: "Edge cases",
        input: 'In page "Meeting Notes", write ""Double quoted content with "nested" quotes""'
      },
      { 
        category: "Edge cases",
        input: 'Create a page with a very very very very very very very very very very very very very long name that might exceed some character limits'
      },
      
      // Special characters
      { 
        category: "Special characters",
        input: 'Write "Special symbols: @#$%^&*()!?" in Test Page'
      },
      
      // Multi-line content
      { 
        category: "Multi-line content",
        input: 'Write "Line 1\nLine 2\nLine 3" in Notes'
      },
      
      // ADDITIONAL CHALLENGING CASES
      
      // Extremely complex commands
      {
        category: "Extremely complex commands",
        input: 'In my Weekly Planner, create a section for Monday, add "Team meeting at 10am" and "Follow up with clients" then remind me tomorrow'
      },
      {
        category: "Extremely complex commands",
        input: 'Find my project notes from last week and move the section about UI improvements to Design System page'
      },
      
      // Mixed page/content references
      {
        category: "Mixed references",
        input: 'Write notes about the "Project Timeline" page in my Meeting Minutes'
      },
      {
        category: "Mixed references",
        input: 'In the page about databases, add "How to create a linked database in Notion"'
      },
      
      // Unusual sentence structures
      {
        category: "Unusual structures",
        input: 'My shopping list needs milk, eggs, and bread added to it in Notion'
      },
      {
        category: "Unusual structures",
        input: 'Quickly jot down these meeting notes somewhere: "Discussed Q4 goals, agreed on timelines"'
      },
      
      // Vague/incomplete requests
      {
        category: "Vague requests",
        input: 'Update my Notion'
      },
      {
        category: "Vague requests",
        input: 'Add something to the page'
      },
      
      // Multiple pages in one command
      {
        category: "Multiple pages",
        input: 'Copy "Project status" from Weekly Report to Monthly Summary'
      },
      {
        category: "Multiple pages",
        input: 'Move the action items from Meeting Notes to Todo List page'
      },
      
      // Conversational style
      {
        category: "Conversational style",
        input: 'Hey, could you maybe add something like "Remember to send invoice" to my work tasks or whatever? Thanks!'
      },
      {
        category: "Conversational style",
        input: 'I was thinking about adding some notes from yesterday\'s call to that page we created last week... the one about marketing strategy'
      },
      
      // Non-English characters
      {
        category: "International content",
        input: 'Write "Café meeting with François to discuss résumé" in International Clients'
      },
      {
        category: "International content",
        input: 'Add "Überprüfen Sie die deutsche Übersetzung" to Localization page'
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
      
      console.log(`\n🔹 Input: "${testCase.input}"`);
      
      try {
        // Parse the input using the LLM
        console.log('  Parsing...');
        const parsed = await parseAction(testCase.input);
        
        // Display the parsed result with formatting
        console.log('  Parsed result:');
        console.log(`    • Action: ${parsed.action || 'unknown'}`);
        console.log(`    • Page: ${parsed.pageTitle || 'not identified'}`);
        if (parsed.content) console.log(`    • Content: "${parsed.content}"`);
        if (parsed.oldContent) console.log(`    • Old content: "${parsed.oldContent}"`);
        if (parsed.newContent) console.log(`    • New content: "${parsed.newContent}"`);
        if (parsed.debug) console.log(`    • Debug mode: ${parsed.debug}`);
        
        // Evaluation
        const hasPageTitle = !!parsed.pageTitle;
        const hasAction = parsed.action && parsed.action !== 'unknown';
        const hasContent = !!parsed.content;
        
        // Print assessment
        if (hasPageTitle && hasAction) {
          if ((parsed.action === 'write' || parsed.action === 'edit') && !hasContent) {
            console.log('  ⚠️ PARTIAL: Action and page identified but content missing');
          } else {
            console.log('  ✅ SUCCESS: Request fully parsed');
          }
        } else if (hasAction) {
          console.log('  ⚠️ PARTIAL: Action identified but page missing');
        } else if (hasPageTitle) {
          console.log('  ⚠️ PARTIAL: Page identified but action unclear');
        } else {
          console.log('  ❌ FAILED: Could not identify action or page');
        }
      } catch (error) {
        console.log(`  ❌ ERROR: ${error.message}`);
      }
    }
    
    console.log('\n\n🔍 LLM Parse Testing Complete');
    
  } catch (error) {
    console.error('Error during LLM testing:', error);
  }
}

// Run the tests
testLLMParsing(); 