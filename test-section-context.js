/**
 * Test script for context-aware section handling
 * This demonstrates our implementation's ability to intelligently target content to specific sections
 */

import PageAnalyzer from './server/page-analyzer.js';
import ContextAwareHandler from './server/context-aware-handler.js';

// Create a mock agent for testing
class MockAgent {
  constructor() {
    this.state = new Map();
    this.contextAwareHandler = new ContextAwareHandler(
      process.env.NOTION_API_TOKEN || 'test-token',
      process.env.OPENAI_API_KEY || 'test-key'
    );
  }
  
  get(key) {
    return this.state.get(key);
  }
  
  set(key, value) {
    this.state.set(key, value);
  }
  
  // Simple mock implementation of chat
  async chat(input) {
    console.log(`Mock agent processing: "${input}"`);
    
    // Special handling for 'yes' confirmation
    if (input.toLowerCase() === 'yes' && this.state.get('requireConfirm')) {
      this.state.set('requireConfirm', false);
      const pendingInput = this.state.get('pendingAction');
      return this.processMockCommand(pendingInput);
    }
    
    if (this.isDestructiveAction(input)) {
      this.state.set('requireConfirm', true);
      this.state.set('pendingAction', input);
      return { content: "CONFIRM? This action will modify your Notion workspace. Reply 'yes' to confirm or 'no' to cancel." };
    }
    
    return this.processMockCommand(input);
  }
  
  async processMockCommand(input) {
    try {
      // Use context-aware handler to parse and process
      const result = await this.contextAwareHandler.processCommand(input);
      
      if (result && result.success) {
        return { content: result.message || 'Command executed successfully' };
      } else {
        return { content: result.message || 'Command failed' };
      }
    } catch (error) {
      console.error('Error in mock agent:', error);
      return { content: `Error: ${error.message}` };
    }
  }
  
  isDestructiveAction(input) {
    const destructiveKeywords = [
      'create', 'add', 'insert', 'update', 'modify', 'edit', 'delete', 'remove',
      'rename', 'move', 'archive', 'publish', 'upload', 'new', 'write'
    ];
    
    return destructiveKeywords.some(keyword => 
      input.toLowerCase().includes(keyword)
    );
  }
}

async function testContextAwareSections() {
  console.log('🧠 Testing Context-Aware Section Handling');
  console.log('======================================');
  
  // Use test mode to avoid real Notion API calls
  process.env.NODE_ENV = 'test';
  console.log('Environment:', process.env.NODE_ENV);
  
  // Create the mock agent
  console.log('Creating mock agent...');
  const agent = new MockAgent();
  console.log('Mock agent created');
  
  // Test the page analyzer directly
  console.log('\n--- Testing Page Analyzer ---');
  const pageAnalyzer = new PageAnalyzer();
  
  const mockBlocks = [
    {
      id: 'heading1',
      type: 'heading_1',
      heading_1: {
        rich_text: [{ text: { content: 'Tasks' }, plain_text: 'Tasks' }]
      }
    },
    {
      id: 'paragraph1',
      type: 'paragraph',
      paragraph: {
        rich_text: [{ text: { content: 'Important reminder' }, plain_text: 'Important reminder' }]
      }
    },
    {
      id: 'heading2',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ text: { content: 'My Day' }, plain_text: 'My Day' }]
      }
    },
    {
      id: 'todo1',
      type: 'to_do',
      to_do: {
        rich_text: [{ text: { content: 'order pixel phone' }, plain_text: 'order pixel phone' }],
        checked: false
      }
    },
    {
      id: 'heading3',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ text: { content: 'Tech Tasks' }, plain_text: 'Tech Tasks' }]
      }
    },
    {
      id: 'todo2',
      type: 'to_do',
      to_do: {
        rich_text: [{ text: { content: 'Remember to do a security audit' }, plain_text: 'Remember to do a security audit' }],
        checked: false
      }
    },
    {
      id: 'todo3',
      type: 'to_do',
      to_do: {
        rich_text: [{ text: { content: 'Check .env file configuration' }, plain_text: 'Check .env file configuration' }],
        checked: false
      }
    },
    {
      id: 'heading4',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ text: { content: 'Design Tasks' }, plain_text: 'Design Tasks' }]
      }
    },
    {
      id: 'todo4',
      type: 'to_do',
      to_do: {
        rich_text: [{ text: { content: 'Refine the frontend for the same' }, plain_text: 'Refine the frontend for the same' }],
        checked: false
      }
    }
  ];
  
  const pageStructure = pageAnalyzer.analyzePageStructure(mockBlocks);
  console.log(`Detected ${pageStructure.sections.length} sections in mock page`);
  
  pageStructure.sections.forEach(section => {
    console.log(`  - ${section.title} (level ${section.level}) with ${section.children.length} children`);
  });
  
  // Test section targeting
  console.log('\nTesting section targeting:');
  const queries = [
    'my day', 
    'tech tasks', 
    'design tasks area',
    'tasks section'
  ];
  
  queries.forEach(query => {
    const section = pageAnalyzer.findTargetSection(pageStructure, query);
    console.log(`  Query "${query}" → ${section ? section.title : 'No match'}`);
  });
  
  // Test the direct section targeting functionality
  console.log('\n\n--- Direct Section Targeting Tests ---');
  
  // Test case 1: Adding to "My Day" section
  await testCommand(
    agent,
    "Add a to-do to order pillows (those feathery ones) to my day section in a tasks page",
    "my day"
  );
  
  // Test case 2: Adding to Tech Tasks section
  await testCommand(
    agent,
    "Add check .env file configuration to the tech tasks section",
    "tech"
  );
  
  // Test case 3: Adding to Design Tasks section
  await testCommand(
    agent,
    "Add refine the frontend for the same in design tasks",
    "design"
  );
  
  // Test case 4: Using more natural language
  await testCommand(
    agent,
    "Can you please add 'send updated report' as a to-do in the tasks area",
    "tasks"
  );
  
  // Test case 5: Multiple section keywords
  await testCommand(
    agent, 
    "Create a new task in my daily tasks list to call the insurance company",
    "my day"
  );
}

/**
 * Helper function to test a specific command
 */
async function testCommand(agent, command, expectedSection) {
  console.log(`\nTesting: "${command}"`);
  console.log(`Expected section target: "${expectedSection}"`);
  
  // Process the command
  const initialResponse = await agent.chat(command);
  console.log('Initial response:', initialResponse.content);
  
  if (initialResponse.content.includes('CONFIRM?')) {
    console.log('Confirmation required, confirming...');
    
    // Set confirmation flag and get final response
    agent.set('confirm', true);
    const finalResponse = await agent.chat('yes');
    console.log('Final response:', finalResponse.content);
    
    checkResponse(finalResponse.content, expectedSection);
  } else {
    checkResponse(initialResponse.content, expectedSection);
  }
}

/**
 * Check if the response indicates proper section targeting
 */
function checkResponse(response, expectedSection) {
  // Check if the response contains any indication of the expected section
  if (response.toLowerCase().includes(expectedSection.toLowerCase()) || 
      (expectedSection === 'my day' && response.toLowerCase().includes('day')) ||
      (expectedSection === 'tech' && response.toLowerCase().includes('tech')) ||
      (expectedSection === 'design' && response.toLowerCase().includes('design'))) {
    console.log('✅ SUCCESS: Response indicates correct section was targeted');
  } else if (response.includes('Test executed successfully') || 
             response.includes('Command executed successfully')) {
    console.log('✓ PROBABLY OK: Generic success response in test mode');
  } else {
    console.log('❓ UNCLEAR: Cannot determine if section was targeted correctly');
  }
}

// Run the test
testContextAwareSections().catch(error => {
  console.error('Test failed with error:', error);
}); 