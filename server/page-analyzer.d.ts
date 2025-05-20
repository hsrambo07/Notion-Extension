/**
 * TypeScript declaration file for page-analyzer.js
 */

export default class PageAnalyzer {
  /**
   * Analyze page content to identify sections and their structure
   * @param {Array} blocks - The blocks of content from a Notion page
   * @returns {Object} Analyzed page structure with sections
   */
  analyzePageStructure(blocks: Array<any>): {
    sections: Array<{
      title: string;
      startIndex: number;
      endIndex: number;
      level: number;
      children: Array<{
        index: number;
        type: string;
        text: string;
        block: any;
      }>;
    }>;
    structure: {
      type: string;
      primaryContentType: string;
    };
  };

  /**
   * Identify sections within a page based on headings and block types
   */
  identifySections(blocks: Array<any>): Array<{
    title: string;
    startIndex: number;
    endIndex: number;
    level: number;
    children: Array<{
      index: number;
      type: string;
      text: string;
      block: any;
    }>;
  }>;

  /**
   * Determine the page type based on its structure (task list, notes, etc.)
   */
  determinePageType(blocks: Array<any>, sections: Array<any>): {
    type: string;
    primaryContentType: string;
  };

  /**
   * Find the best section to add content based on a user query
   * @param {Object} pageStructure - The analyzed page structure
   * @param {String} sectionName - The section name from user query
   * @returns {Object|null} The matching section or null if not found
   */
  findTargetSection(
    pageStructure: {
      sections: Array<{
        title: string;
        startIndex: number;
        endIndex: number;
        level: number;
        children: Array<{
          index: number;
          type: string;
          text: string;
          block: any;
        }>;
      }>;
    },
    sectionName: string
  ): {
    title: string;
    startIndex: number;
    endIndex: number;
    level: number;
    children: Array<{
      index: number;
      type: string;
      text: string;
      block: any;
    }>;
  } | null;

  /**
   * Extract text from a block
   * @param {Object} block - A Notion block
   * @returns {String} The text content
   */
  getBlockText(block: any): string;
} 