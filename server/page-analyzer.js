/**
 * Page Analyzer - Identifies sections and structure within Notion pages
 * Used to determine the correct location to add content based on user requests
 */

class PageAnalyzer {
  /**
   * Analyze page content to identify sections and their structure
   * @param {Array} blocks - The blocks of content from a Notion page
   * @returns {Object} Analyzed page structure with sections 
   */
  analyzePageStructure(blocks) {
    if (!blocks || !Array.isArray(blocks)) {
      console.error('Invalid blocks provided for analysis');
      return { sections: [], structure: 'unknown' };
    }

    const sections = this.identifySections(blocks);
    const structure = this.determinePageType(blocks, sections);
    
    console.log(`Analyzed page with ${sections.length} sections, structure type: ${structure.type}`);
    
    return {
      sections,
      structure
    };
  }
  
  /**
   * Identify sections within a page based on headings and block types
   */
  identifySections(blocks) {
    const sections = [];
    let currentSection = null;
    
    // First pass - identify all heading blocks as section markers
    blocks.forEach((block, index) => {
      const blockType = block.type;
      const isHeading = blockType.startsWith('heading_') || 
                       blockType === 'toggle' ||
                       blockType === 'callout';
      
      // Get block text content
      const blockText = this.getBlockText(block);
      
      if (isHeading) {
        // Start a new section
        currentSection = {
          title: blockText,
          startIndex: index,
          endIndex: null,
          level: blockType === 'heading_1' ? 1 : 
                 blockType === 'heading_2' ? 2 : 
                 blockType === 'heading_3' ? 3 : 4,
          children: []
        };
        sections.push(currentSection);
      } else if (currentSection) {
        // Add content to current section
        currentSection.children.push({
          index,
          type: blockType,
          text: blockText,
          block
        });
      }
    });
    
    // Second pass - set end indices for sections
    for (let i = 0; i < sections.length; i++) {
      if (i < sections.length - 1) {
        sections[i].endIndex = sections[i + 1].startIndex - 1;
      } else {
        sections[i].endIndex = blocks.length - 1;
      }
    }
    
    return sections;
  }
  
  /**
   * Determine the page type based on its structure (task list, notes, etc.)
   */
  determinePageType(blocks, sections) {
    // Count different block types to determine page structure
    const typeCounts = {};
    
    blocks.forEach(block => {
      const type = block.type;
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    // Check for task/to-do list structure
    const todoCount = typeCounts['to_do'] || 0;
    const paragraphCount = typeCounts['paragraph'] || 0;
    const bulletCount = typeCounts['bulleted_list_item'] || 0;
    
    // Look for section titles that suggest tasks
    const taskSectionKeywords = ['task', 'todo', 'to-do', 'to do', 'my day', 'checklist'];
    const hasTaskSection = sections.some(section => 
      taskSectionKeywords.some(keyword => 
        section.title.toLowerCase().includes(keyword)
      )
    );
    
    if (todoCount > 3 || hasTaskSection) {
      return { 
        type: 'task_list',
        primaryContentType: 'to_do'
      };
    }
    
    if (bulletCount > paragraphCount) {
      return {
        type: 'bullet_notes',
        primaryContentType: 'bulleted_list_item'
      };
    }
    
    return {
      type: 'note_page',
      primaryContentType: 'paragraph'
    };
  }
  
  /**
   * Find the best section to add content based on a user query
   * @param {Object} pageStructure - The analyzed page structure
   * @param {String} sectionName - The section name from user query
   * @returns {Object|null} The matching section or null if not found
   */
  findTargetSection(pageStructure, sectionName) {
    if (!pageStructure || !pageStructure.sections) {
      return null;
    }
    
    const { sections } = pageStructure;
    
    // Normalize the section name for matching
    const normalizedQuery = sectionName.toLowerCase().trim();
    
    // Common section name synonyms
    const sectionSynonyms = {
      'my day': ['today', 'daily', 'day'],
      'tasks': ['to-do', 'todo', 'to do', 'checklist', 'task list'],
      'tech': ['technology', 'technical', 'programming', 'development', 'dev'],
      'design': ['ui', 'ux', 'interface', 'layout']
    };
    
    // First try exact match
    const exactMatch = sections.find(section => 
      section.title.toLowerCase() === normalizedQuery
    );
    
    if (exactMatch) {
      return exactMatch;
    }
    
    // Try synonym matching
    for (const [sectionKey, synonyms] of Object.entries(sectionSynonyms)) {
      if (synonyms.includes(normalizedQuery) || normalizedQuery.includes(sectionKey)) {
        // Look for a section with this key or any of its synonyms
        const synonymMatch = sections.find(section => {
          const sectionTitle = section.title.toLowerCase();
          return sectionTitle.includes(sectionKey) || 
                 synonyms.some(syn => sectionTitle.includes(syn));
        });
        
        if (synonymMatch) {
          return synonymMatch;
        }
      }
    }
    
    // Try partial matching
    const partialMatches = sections.filter(section => {
      const sectionTitle = section.title.toLowerCase();
      return sectionTitle.includes(normalizedQuery) || 
             normalizedQuery.includes(sectionTitle);
    });
    
    if (partialMatches.length > 0) {
      // Return the closest match based on length difference
      return partialMatches.reduce((best, current) => {
        const bestDiff = Math.abs(best.title.length - normalizedQuery.length);
        const currentDiff = Math.abs(current.title.length - normalizedQuery.length);
        return currentDiff < bestDiff ? current : best;
      });
    }
    
    // If still no match, try matching against common section keywords
    const keywordMatch = sections.find(section => {
      const sectionTitle = section.title.toLowerCase();
      return Object.keys(sectionSynonyms).some(key => sectionTitle.includes(key));
    });
    
    if (keywordMatch) {
      return keywordMatch;
    }
    
    // If no section found and it's a task request, look for a general task section
    if (normalizedQuery.includes('task') || normalizedQuery.includes('todo') || normalizedQuery.includes('to-do')) {
      const taskSection = sections.find(section => {
        const sectionTitle = section.title.toLowerCase();
        return sectionTitle.includes('task') || 
               sectionTitle.includes('todo') || 
               sectionTitle.includes('to-do') ||
               sectionTitle.includes('to do');
      });
      
      if (taskSection) {
        return taskSection;
      }
    }
    
    // Fallback: Return first section if any exist
    return sections.length > 0 ? sections[0] : null;
  }
  
  /**
   * Extract text from a block
   * @param {Object} block - A Notion block
   * @returns {String} The text content
   */
  getBlockText(block) {
    if (!block) return '';
    
    const blockType = block.type;
    if (!block[blockType]) return '';
    
    const richText = block[blockType].rich_text;
    if (!richText || !Array.isArray(richText)) return '';
    
    return richText.map(text => 
      text.plain_text || (text.text && text.text.content) || ''
    ).join('');
  }
}

export default PageAnalyzer; 