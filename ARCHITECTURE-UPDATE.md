# Notion Extension Architecture Overview

## Core Components

The architecture consists of the following key components that work together:

### 1. NotionAgent (`agent.ts`)
- **Role**: Central orchestrator that handles all user requests
- **Responsibilities**:
  - Parses natural language commands
  - Routes commands to appropriate handlers
  - Handles multi-command processing
  - Manages confirmation for destructive actions
  - Communicates with Notion API

### 2. Command Parsing System

#### a. LLM Command Parser (`llm-command-parser.js`)
- **Role**: Primary command parser using LLM for natural language understanding
- **Capabilities**:
  - Parses complex natural language into structured commands
  - Identifies multiple commands in a single request
  - Extracts action, targets, content, and format types

#### b. Enhanced Multi-Command Handler (`enhanced-multi-command-handler.js`)
- **Role**: Processes multi-command requests with improved context handling
- **Capabilities**:
  - Identifies and separates multiple commands
  - Maintains context across commands
  - Uses the LLM Command Parser internally

#### c. Multi-Command Handler (`multi-command-handler.ts`)
- **Role**: Original handler for multi-command processing
- **Capabilities**: 
  - Basic processing of multiple commands
  - Serves as a fallback for the enhanced handler

#### d. Basic Command Parser (`command-parser.js`, `command-parser.ts`)
- **Role**: Basic rule-based command parsing
- **Capabilities**:
  - Pattern matching for common commands
  - Fallback when LLM parsing fails

### 3. Content Processing

#### a. Format Agent (`format-agent.js`, `format-agent.ts`)
- **Role**: Detects and formats content appropriately
- **Capabilities**:
  - Determines appropriate format types for content
  - Formats content for Notion blocks

#### b. Block Validator (`block-validator.js`)
- **Role**: Ensures Notion blocks are valid
- **Capabilities**:
  - Validates block structure
  - Fixes common issues in block format

#### c. Context-Aware Handler (`context-aware-handler.js`)
- **Role**: Processes commands with section targeting
- **Capabilities**:
  - Identifies target sections in pages
  - Places content in the correct section
  - Supports "in" and "below" placement types

### 4. Integration

#### a. Integrator (`integrator.js`)
- **Role**: Connects and orchestrates all components
- **Capabilities**:
  - Creates and configures the enhanced command handler
  - Provides factory functions for components
  - Ensures proper communication between components

#### b. AI Agent Network (`ai-agent-network.ts`)
- **Role**: Coordinates multiple AI agents
- **Capabilities**:
  - Routes commands to specialized agents
  - Aggregates results from multiple agents

## Command Flow

1. User provides natural language input
2. NotionAgent receives the input and tries to parse it:
   a. First using the EnhancedCommandHandler
   b. If that fails, using the LLMCommandParser directly
   c. If that fails, using the AI Agent Network
   d. If all else fails, using the basic rule-based parser
3. If multiple commands are detected, they are stored for sequential processing
4. Each command is executed with the appropriate handler
5. Results are returned to the user

## Testing Components

Several test files are available to verify component integration:

- `test-enhanced-parser.js`: Tests the enhanced parser functionality
- `test-agent-integration.js`: Tests integration between agent and Notion API
- `test-multi-todo.js`: Tests multi-command processing
- `test-robust-todo.js`: Tests error handling and recovery

## Integration with Server

The NotionAgent is integrated with a server (`server.ts`) that exposes HTTP endpoints for external applications to communicate with the agent.

## Additional Features

- Whatsapp integration through dedicated handlers
- File upload handling
- Context-aware processing for targeting specific sections
- Multi-command processing for complex requests 