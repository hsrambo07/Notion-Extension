/**
 * Page Discovery Utility for Notion Integration
 * 
 * Provides smart page discovery to find the closest matching page
 * or create a new page if requested
 */

import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

class PageDiscovery {
  constructor(notionApiToken) {
    if (!notionApiToken) {
      throw new Error('Notion API token is required');
    }
    
    this.notion = new Client({ auth: notionApiToken });
  }
  
  /**
   * Find the best matching page for a given query
   * 
   * @param {string} pageQuery - The name of the page to find
   * @param {boolean} createIfNotFound - Whether to create the page if not found
   * @returns {Promise<Object>} The result with page details or suggestions
   */
  async findBestMatchingPage(pageQuery, createIfNotFound = false) {
    if (!pageQuery) {
      return {
        found: false,
        message: 'No page name provided',
        suggestions: []
      };
    }
    
    console.log(`🔍 Searching for page matching: "${pageQuery}"`);
    
    // Normalize the query
    const normalizedQuery = pageQuery.trim().toLowerCase();
    
    try {
      // First search for existing pages
      const existingPages = await this.searchPages(normalizedQuery);
      
      // If no pages found
      if (existingPages.length === 0) {
        console.log(`No pages found matching "${normalizedQuery}"`);
        
        if (createIfNotFound) {
          // Create a new page
          const newPageId = await this.createNewPage(pageQuery);
          return {
            found: true,
            created: true,
            message: `Created new page "${pageQuery}"`,
            pageId: newPageId,
            pageName: pageQuery
          };
        } else {
          // Get all pages to suggest alternatives
          const allPages = await this.getAllPages();
          return {
            found: false,
            message: `Could not find a page named "${pageQuery}"`,
            suggestions: allPages.slice(0, 5) // Suggest up to 5 existing pages
          };
        }
      }
      
      // If exact match found
      const exactMatch = existingPages.find(page => 
        page.title.toLowerCase() === normalizedQuery
      );
      
      if (exactMatch) {
        console.log(`Found exact match: "${exactMatch.title}" (${exactMatch.id})`);
        return {
          found: true,
          message: `Found page "${exactMatch.title}"`,
          pageId: exactMatch.id,
          pageName: exactMatch.title
        };
      }
      
      // If partial matches found, return best match
      const bestMatch = existingPages[0];
      console.log(`Found best match: "${bestMatch.title}" (${bestMatch.id})`);
      
      return {
        found: true,
        message: `Found closest matching page "${bestMatch.title}"`,
        pageId: bestMatch.id,
        pageName: bestMatch.title,
        isExactMatch: false,
        otherSuggestions: existingPages.slice(1, 4) // Provide other match options
      };
    } catch (error) {
      console.error('Error finding matching page:', error);
      return {
        found: false,
        message: `Error searching for pages: ${error.message}`,
        error: true
      };
    }
  }
  
  /**
   * Search for pages matching a query
   */
  async searchPages(query) {
    const response = await this.notion.search({
      query,
      filter: {
        property: 'object',
        value: 'page'
      }
    });
    
    return response.results.map(page => {
      return {
        id: page.id,
        title: this.extractPageTitle(page),
        url: page.url
      };
    });
  }
  
  /**
   * Get all pages in the workspace
   */
  async getAllPages() {
    const response = await this.notion.search({
      filter: {
        property: 'object',
        value: 'page'
      }
    });
    
    return response.results.map(page => {
      return {
        id: page.id,
        title: this.extractPageTitle(page),
        url: page.url
      };
    });
  }
  
  /**
   * Create a new page
   */
  async createNewPage(title) {
    // Find the user's workspace
    const user = await this.notion.users.me();
    const workspaceId = user.workspace_id;
    
    // Create the page
    const response = await this.notion.pages.create({
      parent: {
        type: 'workspace',
        workspace: true
      },
      properties: {
        title: {
          title: [
            {
              text: {
                content: title
              }
            }
          ]
        }
      }
    });
    
    return response.id;
  }
  
  /**
   * Extract the title from a page object
   */
  extractPageTitle(page) {
    if (!page) return "Untitled";
    
    // For database items
    if (page.properties && page.properties.title) {
      const titleProp = page.properties.title;
      
      if (Array.isArray(titleProp.title)) {
        return titleProp.title.map(t => t.plain_text || '').join('');
      }
    }
    
    // For non-database pages
    if (page.title) {
      if (Array.isArray(page.title)) {
        return page.title.map(t => t.plain_text || '').join('');
      }
      return page.title.toString();
    }
    
    return "Untitled";
  }
}

// Test the page discovery
async function testPageDiscovery() {
  try {
    const notionApiToken = process.env.NOTION_API_TOKEN;
    
    if (!notionApiToken) {
      console.error('ERROR: NOTION_API_TOKEN environment variable must be set');
      process.exit(1);
    }
    
    const pageDiscovery = new PageDiscovery(notionApiToken);
    
    // Test some queries
    const testQueries = [
      { query: "Tasks", create: false },
      { query: "Shopping List", create: false },
      { query: "Shopping List", create: true },
      { query: "tsk", create: false },  // Fuzzy match for "Tasks"
      { query: "TEST MCP", create: false }
    ];
    
    for (const test of testQueries) {
      console.log(`\n==== Testing: "${test.query}" (create: ${test.create}) ====`);
      const result = await pageDiscovery.findBestMatchingPage(test.query, test.create);
      console.log(result);
    }
    
  } catch (error) {
    console.error('Error in page discovery test:', error);
  }
}

// Check if this file is being run directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  testPageDiscovery();
}

// Export the PageDiscovery class
export default PageDiscovery; 