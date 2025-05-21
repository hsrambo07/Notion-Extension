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
      console.log('No page structure or sections provided for matching');
      return null;
    }
    
    const { sections } = pageStructure;
    console.log(`Finding target section: "${sectionName}" in ${sections.length} sections`);
    
    // Print all available sections for debugging
    sections.forEach(section => {
      console.log(`Available section: "${section.title}" (level ${section.level})`);
    });
    
    // Handle empty query
    if (!sectionName) {
      console.log('No section name provided, returning null');
      return null;
    }
    
    // Normalize the section name for matching
    const normalizedQuery = sectionName.toLowerCase().trim();
    console.log(`Normalized section query: "${normalizedQuery}"`);
    
    // NEW: Handle common typos and partial matches first
    if (normalizedQuery.includes('interestin') || normalizedQuery.includes('prompt')) {
      console.log('Detected potential typo or partial match for "Interesting Prompts"');
      const promptSection = sections.find(section => 
        section.title.toLowerCase().includes('prompt') ||
        section.title.toLowerCase().includes('interesting')
      );
      
      if (promptSection) {
        console.log(`Found section matching "Interesting Prompts": "${promptSection.title}"`);
        return promptSection;
      }
    }
    
    // ENHANCED MATCHING: First try exact match (case insensitive)
    const exactMatch = sections.find(section => 
      section.title.toLowerCase() === normalizedQuery
    );
    
    if (exactMatch) {
      console.log(`Found exact match section: "${exactMatch.title}"`);
      return exactMatch;
    }
    
    // Special handling for "my day" - most common case
    if (normalizedQuery === 'my day' || 
        normalizedQuery === 'day' || 
        normalizedQuery.includes('day section') ||
        normalizedQuery.includes('my day section')) {
      console.log('Special handling for "my day" section');
      
      // First look for exact "My Day" section
      const myDayExact = sections.find(section => 
        section.title.toLowerCase() === 'my day'
      );
      
      if (myDayExact) {
        console.log(`Found exact "My Day" section: "${myDayExact.title}"`);
        return myDayExact;
      }
      
      // Then look for sections containing "day" with various forms
      const dayPatterns = ['day', 'daily', 'today'];
      const daySection = sections.find(section => {
        const title = section.title.toLowerCase();
        return dayPatterns.some(pattern => title.includes(pattern));
      });
      
      if (daySection) {
        console.log(`Found day-related section: "${daySection.title}"`);
        return daySection;
      }
    }
    
    // NEW: Advanced fuzzy matching using Levenshtein distance for typo tolerance
    const findBestFuzzyMatch = (query, candidates, threshold = 0.7) => {
      // Simple character-based similarity score (higher is better)
      const similarityScore = (str1, str2) => {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        // Count matching characters
        let matches = 0;
        for (let i = 0; i < shorter.length; i++) {
          if (longer.includes(shorter[i])) {
            matches++;
          }
        }
        
        return matches / longer.length;
      };
      
      let bestMatch = null;
      let highestScore = 0;
      
      candidates.forEach(candidate => {
        const score = similarityScore(query, candidate.title.toLowerCase());
        console.log(`Fuzzy match score for "${candidate.title}": ${score.toFixed(2)}`);
        
        if (score > threshold && score > highestScore) {
          highestScore = score;
          bestMatch = candidate;
        }
      });
      
      return bestMatch;
    };
    
    // Try fuzzy matching with common section name corrections
    const correctedQueries = [
      normalizedQuery,
      // Common corrections
      normalizedQuery.replace('interestin', 'interesting'),
      normalizedQuery.replace('prompt', 'prompts'),
      // If there's "prompt" anywhere, try "interesting prompts"
      normalizedQuery.includes('prompt') ? 'interesting prompts' : null
    ].filter(Boolean); // Remove null values
    
    for (const query of correctedQueries) {
      const fuzzyMatch = findBestFuzzyMatch(query, sections);
      if (fuzzyMatch) {
        console.log(`Found fuzzy match with corrected query "${query}": "${fuzzyMatch.title}"`);
        return fuzzyMatch;
      }
    }
    
    // ENHANCED: Improved fuzzy matching for all section names
    // Check for partial matches, allowing for variations in wording
    const partialMatch = sections.find(section => {
      const sectionTitle = section.title.toLowerCase();
      // Check if the section name contains the query or the query contains the section name
      return sectionTitle.includes(normalizedQuery) || normalizedQuery.includes(sectionTitle);
    });
    
    if (partialMatch) {
      console.log(`Found partial match section: "${partialMatch.title}"`);
      return partialMatch;
    }
    
    // Common section name synonyms - extended for better matching
    const sectionSynonyms = {
      'my day': ['today', 'daily', 'day', 'my day', 'today\'s tasks', 'today\'s', 'for today'],
      'tasks': ['to-do', 'todo', 'to do', 'checklist', 'task list', 'task', 'tasks', 'to dos', 'to-dos', 'todos'],
      'tech': ['technology', 'technical', 'programming', 'development', 'dev', 'tech tasks', 'code', 'tech task'],
      'design': ['ui', 'ux', 'interface', 'layout', 'design tasks', 'mockup', 'visual', 'design task'],
      'interesting prompts': ['interestin prompt', 'prompt', 'prompts', 'interesting prompt', 'interestn prompts']
    };
    
    // Try synonym matching with improved logging
    for (const [sectionKey, synonyms] of Object.entries(sectionSynonyms)) {
      // Check if the query matches this synonym group
      const queryMatchesGroup = synonyms.includes(normalizedQuery) || normalizedQuery.includes(sectionKey);
      
      if (queryMatchesGroup) {
        console.log(`Query "${normalizedQuery}" matches synonym group "${sectionKey}"`);
        
        // Look for a section with this key or any of its synonyms
        const synonymMatch = sections.find(section => {
          const sectionTitle = section.title.toLowerCase();
          const isMatch = sectionTitle.includes(sectionKey) || 
                   synonyms.some(syn => sectionTitle.includes(syn));
          
          // Log matching attempts for debugging
          if (isMatch) {
            console.log(`Found synonym match: "${section.title}" matches "${sectionKey}" group`);
          }
          
          return isMatch;
        });
        
        if (synonymMatch) {
          return synonymMatch;
        }
      }
    }
    
    // Enhanced partial matching - now with word-level matching and improved scoring
    const partialMatches = sections.filter(section => {
      const sectionTitle = section.title.toLowerCase();
      
      // Check if any words in the query match any words in the section title
      const queryWords = normalizedQuery.split(/\s+/);
      const titleWords = sectionTitle.split(/\s+/);
      
      // More precise word matching - check for full word matches and substring matches
      const hasExactWordMatch = queryWords.some(qWord => 
        titleWords.some(tWord => tWord === qWord)
      );
      
      const hasPartialWordMatch = queryWords.some(qWord => 
        titleWords.some(tWord => tWord.includes(qWord) || qWord.includes(tWord))
      );
      
      const hasPartialMatch = sectionTitle.includes(normalizedQuery) || 
                             normalizedQuery.includes(sectionTitle);
      
      const matched = hasExactWordMatch || hasPartialWordMatch || hasPartialMatch;
      if (matched) {
        console.log(`Partial match found: "${section.title}" matches "${normalizedQuery}"`);
        if (hasExactWordMatch) console.log(`- Has exact word match`);
        if (hasPartialWordMatch) console.log(`- Has partial word match`);
        if (hasPartialMatch) console.log(`- Has substring match`);
      }
      
      return matched;
    });
    
    if (partialMatches.length > 0) {
      console.log(`Found ${partialMatches.length} partial matches`);
      
      // Return the closest match based on a weighted scoring system
      const bestMatch = partialMatches.reduce((best, current) => {
        const bestTitle = best.title.toLowerCase();
        const currentTitle = current.title.toLowerCase();
        
        // Count matching words between query and titles
        const queryWords = normalizedQuery.split(/\s+/);
        
        // Score exact word matches higher than partial matches
        const bestExactMatches = queryWords.filter(word => 
          bestTitle.split(/\s+/).includes(word)
        ).length * 2;
        
        const currentExactMatches = queryWords.filter(word => 
          currentTitle.split(/\s+/).includes(word)
        ).length * 2;
        
        // Score partial word matches
        const bestPartialMatches = queryWords.filter(word => 
          bestTitle.split(/\s+/).some(w => w.includes(word) || word.includes(w))
        ).length;
        
        const currentPartialMatches = queryWords.filter(word => 
          currentTitle.split(/\s+/).some(w => w.includes(word) || word.includes(w))
        ).length;
        
        // Calculate total score
        const bestScore = bestExactMatches + bestPartialMatches;
        const currentScore = currentExactMatches + currentPartialMatches;
        
        console.log(`Score for "${best.title}": ${bestScore} (${bestExactMatches} exact, ${bestPartialMatches} partial)`);
        console.log(`Score for "${current.title}": ${currentScore} (${currentExactMatches} exact, ${currentPartialMatches} partial)`);
        
        // If one has a higher score, prefer it
        if (currentScore > bestScore) return current;
        if (bestScore > currentScore) return best;
        
        // If scores are equal, use length difference
        const bestDiff = Math.abs(bestTitle.length - normalizedQuery.length);
        const currentDiff = Math.abs(currentTitle.length - normalizedQuery.length);
        return currentDiff < bestDiff ? current : best;
      });
      
      console.log(`Best partial match: "${bestMatch.title}"`);
      return bestMatch;
    }
    
    // Case-insensitive search for "My Day" when "day" is mentioned
    if (normalizedQuery.includes('day')) {
      const daySection = sections.find(section => 
        section.title.toLowerCase().includes('day')
      );
      
      if (daySection) {
        console.log(`Found "day" section: "${daySection.title}"`);
        return daySection;
      }
    }
    
    // If still no match, try matching against common section keywords
    const keywordMatch = sections.find(section => {
      const sectionTitle = section.title.toLowerCase();
      return Object.keys(sectionSynonyms).some(key => sectionTitle.includes(key));
    });
    
    if (keywordMatch) {
      console.log(`Found keyword match: "${keywordMatch.title}"`);
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
        console.log(`Found task-related section: "${taskSection.title}"`);
        return taskSection;
      }
    }
    
    // As a last resort, if we can't find any matching section but there's a "My Day" section,
    // we'll use that for day-related tasks, which is a common default
    if (normalizedQuery.includes('task') || normalizedQuery.includes('todo') || normalizedQuery.includes('to-do')) {
      const daySection = sections.find(section => 
        section.title.toLowerCase().includes('day') || 
        section.title.toLowerCase().includes('daily')
      );
      
      if (daySection) {
        console.log(`Using "My Day" as default task section: "${daySection.title}"`);
        return daySection;
      }
    }
    
    console.log('No matching section found, defaulting to first section if available');
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