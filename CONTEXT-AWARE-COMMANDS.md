# Context-Aware Command Handling for Notion Agent

This document explains the implementation of context-aware command handling for the Notion Agent extension, which enables more natural and intelligent interaction with Notion pages, particularly when targeting specific sections within pages.

## Overview

The context-aware command handling system allows users to target specific sections within Notion pages using natural language commands. For example, a user can say:

```
Add a to-do to order pillows (those feathery ones) to my day section in a tasks page
```

The system will:
1. Understand that the command is targeting the "My Day" section
2. Find the page named "Tasks" 
3. Locate the "My Day" section within that page
4. Add the to-do at the appropriate location within that section

## Architecture

The context-aware system consists of two main components:

### 1. Page Analyzer

The `PageAnalyzer` class is responsible for:
- Analyzing the structure of a Notion page
- Identifying sections based on headings and content blocks
- Determining the page type (task list, notes, etc.)
- Finding the best section match for a user query

It works by:
1. Parsing the blocks of a Notion page to identify headings and section boundaries
2. Building a hierarchical representation of the page structure
3. Using multiple matching strategies to find the right section when given a user query

### 2. Context-Aware Handler

The `ContextAwareHandler` class is responsible for:
- Parsing natural language commands to identify user intent
- Finding the target page and retrieving its content
- Using the PageAnalyzer to understand the page structure
- Executing the command in the proper context

It handles the entire flow from command parsing to content creation in the right location.

## Integration with Existing Agent

The context-aware system has been integrated into the main `NotionAgent` class:

1. The `parseAction` method now has logic to detect section-targeting commands
2. When a section-targeting command is detected, it's routed to the context-aware handler
3. The `processAction` method handles the context-aware action type

## Benefits

This implementation provides several advantages:

1. **More Natural Commands**: Users can express their intent naturally without worrying about the exact command structure
2. **Intelligent Section Targeting**: The system can find the right section even with partial or approximate section names
3. **Contextual Understanding**: By analyzing the page structure, the system can make smart decisions about where to place content

## Examples of Supported Commands

The system can handle a variety of section-targeting commands:

- "Add a to-do to check email in my day section"
- "Create a new task in the tech tasks area"
- "Add a bullet point about design feedback in the design section"
- "Create a toggle in the resources section"
- "Add a reminder to call Mom in my daily tasks"

## Fallback Mechanisms

The system includes several fallback mechanisms to ensure robustness:

1. If the LLM parser fails, it falls back to simpler pattern matching
2. If a specific section can't be found, it tries to find a semantically similar section
3. If no matching section is found, it adds content to a reasonable default location based on content type

## Future Improvements

Potential future enhancements include:

1. Better handling of nested sections and subsections
2. Remembering user preferences for section targeting
3. Learning from user corrections to improve section matching over time
4. Supporting more complex content structures and formats 