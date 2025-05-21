/**
 * Test script for the Page Discovery utility
 * 
 * Run with: node server/test-page-discovery.js
 */

import PageDiscovery from './page-discovery.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testPageDiscovery() {
  console.log('🧪 Testing Page Discovery utility...');
  
  try {
    const notionApiToken = process.env.NOTION_API_TOKEN;
    
    if (!notionApiToken) {
      console.error('ERROR: NOTION_API_TOKEN environment variable must be set');
      process.exit(1);
    }
    
    const pageDiscovery = new PageDiscovery(notionApiToken);
    
    // Get and list all pages
    console.log('\n📄 Listing all available pages...');
    const allPages = await pageDiscovery.getAllPages();
    
    allPages.forEach((page, index) => {
      console.log(`${index + 1}. "${page.title}" (ID: ${page.id})`);
    });
    
    // Test some specific queries
    const testQueries = [
      { query: "Tasks", create: false, description: "Exact match for existing page" },
      { query: "Shopping List", create: false, description: "Non-existent page without creation" },
      { query: "Shopping List", create: true, description: "Non-existent page with creation" },
      { query: "tsk", create: false, description: "Fuzzy match for 'Tasks'" },
      { query: "TEST MCP", create: false, description: "Case-insensitive match" }
    ];
    
    for (const test of testQueries) {
      console.log(`\n==== Testing: "${test.query}" (${test.description}) ====`);
      console.log(`Create if not found: ${test.create}`);
      
      const result = await pageDiscovery.findBestMatchingPage(test.query, test.create);
      
      console.log('\nResult:');
      console.log(`- Found: ${result.found}`);
      console.log(`- Message: ${result.message}`);
      
      if (result.pageId) {
        console.log(`- Page ID: ${result.pageId}`);
        console.log(`- Page Name: ${result.pageName}`);
      }
      
      if (result.created) {
        console.log(`- Created new page: Yes`);
      }
      
      if (result.suggestions && result.suggestions.length > 0) {
        console.log('\nSuggestions:');
        result.suggestions.forEach((page, index) => {
          console.log(`  ${index + 1}. "${page.title}" (ID: ${page.id})`);
        });
      }
      
      if (result.otherSuggestions && result.otherSuggestions.length > 0) {
        console.log('\nOther similar pages:');
        result.otherSuggestions.forEach((page, index) => {
          console.log(`  ${index + 1}. "${page.title}" (ID: ${page.id})`);
        });
      }
    }
    
    console.log('\n✅ All tests completed');
    
  } catch (error) {
    console.error('❌ Error in page discovery test:', error);
  }
}

// Run the test
testPageDiscovery(); 