# Notion Agent Chrome Extension

A Chrome extension that lets you control Notion with natural language commands. This extension acts as an intelligent agent between you and Notion, allowing you to create pages, add content, format text, and organize your workspace with simple language instructions.

## 🌟 Features

- 💬 **Natural Language Processing**: Send conversational commands like "Create a page called Project Notes in Work and add checklist to follow up with team"
- 📝 **Smart Content Placement**: Add content to specific sections within pages ("Add this task under Today's Priorities section")
- 🔄 **Multi-Part Commands**: Execute complex operations in a single instruction ("Create a page called Weekly Goals and add a bullet list with exercise daily, read more, meditate")
- 🔀 **Multi-Action Commands**: Execute multiple distinct actions in a single command ("Add a link to LinkedIn in Cool Plugins and add a comment to Personal Thoughts")
- ✅ **Content Formatting**: Automatically format content as checklists, bullet points, quotes, callouts, or paragraphs
- 🛡️ **Action Confirmation**: Safeguard against destructive actions with confirmation dialogs
- 🔄 **Real-time Responses**: Get instant feedback through a local server architecture

## 🏗️ System Architecture

The Notion Agent operates through a multi-component system:

```
┌───────────────────┐     ┌─────────────────┐     ┌────────────────────┐
│  Chrome Extension │     │   Agent Server  │     │     Notion API      │
│  ┌─────────────┐  │     │  ┌───────────┐  │     │  ┌──────────────┐  │
│  │   Popup UI  │  │     │  │Notion Agent│  │     │  │  Workspace   │  │
│  │   ┌─────┐   │◄─┼────►│  │  ┌─────┐   │◄─┼────►│  │  ┌────────┐  │  │
│  │   │Input│   │  │     │  │  │Parse│   │  │     │  │  │  Pages │  │  │
│  │   └─────┘   │  │ REST│  │  └─────┘   │  │ REST│  │  └────────┘  │  │
│  │   ┌─────┐   │  │ API │  │  ┌─────┐   │  │ API │  │  ┌────────┐  │  │
│  │   │Output│◄─┼──┼─────┼──┼──┤Exec │   │  │     │  │  │ Blocks │  │  │
│  │   └─────┘   │  │     │  │  └─────┘   │  │     │  │  └────────┘  │  │
│  └─────────────┘  │     │  │           │  │     │  └──────────────┘  │
└───────────────────┘     │  │  ┌─────┐   │  │     └────────────────────┘
                          │  │  │Format│   │  │
      ┌───────────────┐   │  │  │Agent │   │  │
      │  OpenAI API   │   │  │  └─────┘   │  │
      │ ┌───────────┐ │   │  └───────────┘  │
      │ │  GPT-4o   │◄┼───┼─────────────────┘
      │ └───────────┘ │   └─────────────────┘
      └───────────────┘
```

### Component Workflow
1. **User Input**: The Chrome extension accepts natural language commands through the popup UI
2. **Request Processing**: Commands are sent to the Agent Server via REST API
3. **Command Parsing**: The NotionAgent component uses OpenAI to parse the natural language into structured actions
4. **Action Planning**: The system creates a plan based on the parsed intent (create, write, edit, etc.)
5. **Format Processing**: The FormatAgent determines how content should be formatted in Notion
6. **Notion API Interaction**: Structured commands are translated into Notion API calls
7. **Response**: Results are returned to the extension for display to the user

## ⚙️ Technical Implementation

### Agents

#### 1. Notion Agent
The core component that:
- Parses natural language into structured commands
- Detects multi-part commands (e.g., "create page X and add Y")
- Processes multi-action commands (e.g., "add link to page X and add comment to page Y")
- Finds relevant pages and sections in your Notion workspace
- Executes operations through the Notion API
- Handles error conditions and retries

#### 2. Format Agent
Specializes in content formatting:
- Converts plain text into structured Notion blocks
- Supports multiple format types: paragraphs, bullets, checklists, callouts, code blocks, etc.
- Uses context to infer appropriate formatting when not explicitly specified

### Natural Language Processing
The extension uses a two-tier approach to understand commands:
1. **Primary**: OpenAI's GPT-4o model processes commands with a specialized prompt
2. **Fallback**: Regex-based pattern matching for basic command processing when API is unavailable

### Section-Based Content Placement
Content can be placed in specific sections within pages using:
1. **Two-Pass Search**: Looks for exact section matches first, then falls back to partial matches
2. **Contextual Hints**: Recognizes phrases like "under X section" or "in Y heading"
3. **Common Section Recognition**: Special handling for common section names like "My Day", "Tasks", etc.

### Multi-Part Command Processing
The system can handle compound instructions through:
1. **Command Segmentation**: Splitting instructions at logical boundaries (e.g., "and add", "and write")
2. **Intent Preservation**: Maintaining the context across command segments
3. **Sequential Execution**: Creating a page first, then adding content in the specified format

### Multi-Action Command Processing
The extension can process multiple distinct actions from a single command:

```
┌─────────────────┐
│  User Command   │
│ (Multiple       │
│  Actions)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Command Parsing│
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌─────────────────┐
│ Action          │      │   Action Array   │
│ Identification  │─────▶│  [A1, A2, A3...] │
└────────┬────────┘      └─────────┬───────┘
         │                         │
         ▼                         ▼
┌─────────────────┐      ┌─────────────────┐
│  Sequential     │      │Process Individual│
│  Execution      │─────▶│     Actions     │
└────────┬────────┘      └─────────┬───────┘
         │                         │
         ▼                         ▼
┌─────────────────┐      ┌─────────────────┐
│   Response      │      │  Combine Results │
│   Generation    │◀─────│                  │
└─────────────────┘      └─────────────────┘
```

#### Key Components:
1. **LLM-Powered Parsing**: Uses GPT-4o to identify multiple actions within a single instruction
2. **Action Extraction**: Separates combined commands into individual, structured actions
3. **Sequential Processing**: Executes each action in the intended order
4. **Result Aggregation**: Combines results into a coherent response

#### Common Use Cases:
- **Cross-page actions**: "Add LinkedIn profile to Resources and add a note about it to Follow-ups"
- **Combined creation/addition**: "Create a new page Meeting Notes and add agenda items to it"
- **Multi-database operations**: "Add a new tool to Cool Plugins and add the same link to Resources Gallery"

## 🛠️ Setup

### Prerequisites

- Node.js v18 or newer
- pnpm package manager
- A Notion integration token
- OpenAI API key

### Installation

1. Clone this repository:
```bash
git clone <repository-url>
cd notion-agent-extension
```

2. Install dependencies:
```bash
pnpm install
```

3. Create a `.env` file in the root directory based on `.env.example`:
```
NOTION_API_TOKEN=your_notion_integration_token
OPENAI_API_KEY=your_openai_api_key
PORT=8787
MCP_NOTION_PORT=3333
```

### Notion Integration Setup

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Give it a name and select the workspace
4. Copy the "Internal Integration Token" and add it to your `.env` file
5. In your Notion workspace, share the pages/databases you want to access with your integration
   - Open a page in your workspace
   - Click "Share" in the top right
   - Click "Invite" and select your integration from the list

## 💻 Development

Start the development server:

```bash
pnpm dev
```

This will start:
- MCP Notion server on port 3333
- Backend API server on port 8787

## 📲 Loading the Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top-right corner)
3. Click "Load unpacked" and select the `extension` folder
4. The Notion Agent extension should now appear in your extensions list 

## 🚀 Usage Examples

### Basic Commands

- **Create a page**: "Create a new page called Weekly Tasks"
- **Add content**: "Add 'Meeting with Alex at 3pm' to my Today page"
- **Format content**: "Add a bullet list with apples, oranges, bananas to Shopping List"

### Advanced Usage

- **Multi-part commands**: "Create a page called Q3 Goals in Work and add checklist to finish project, hire new developer, update documentation"
- **Section-specific placement**: "Add 'Call accountant' under Important section in Tasks page"
- **Content formatting**: "Add as toggle 'Project Details: Launching in September with initial beta access for partners'"
- **Multi-action commands**: "Add LinkedIn profile https://linkedin.com/in/user to Cool Plugins and add 'Check this profile later' to Personal Thoughts"

## 🧪 Testing

Run the test suite with:

```bash
pnpm test
```

For testing specific components:

```bash
# Test multi-part command handling
NODE_ENV=production node test-multipart-commands.js

# Test section placement functionality
NODE_ENV=production node test-section-placement.js

# Test multi-action command handling
NODE_ENV=production node test-multi-action-commands.js
```

## 🔍 Troubleshooting

### CORS Issues
- Make sure the server is running on the expected port (8787)
- Check that the content security policy in `manifest.json` includes the correct server URL

### Authentication Errors
- Verify your Notion token and OpenAI API key in the `.env` file
- Ensure your Notion integration has access to the pages/databases you're trying to modify

### Section Placement Issues
- Check that section names match exactly (including capitalization)
- Try using more specific section names if you have similar headings

### Multi-part Commands
- Make sure commands have a clear separation ("and add", "and write")
- For checklists, include "to" before the action (e.g., "add checklist to read books")

### Multi-action Commands
- Ensure each action has clear and complete information (page names, content)
- Use "and" to separate distinct actions

## 🔄 Workflow Internals

```
┌──────────────┐
│ User Request │
└───────┬──────┘
        ▼
┌───────────────────┐     ┌─────────────────┐
│ Parse Action       │────►  Is Destructive? │
└───────┬───────────┘     └────────┬────────┘
        │                          │
        │                          ▼
        │                   ┌─────────────┐
        │                   │ Confirmation│
        │                   └──────┬──────┘
        │                          │
        ▼                          ▼
┌───────────────────┐     ┌───────────────┐
│ Create Action Plan│◄────┤ User Confirms │
└───────┬───────────┘     └───────────────┘
        │
        ▼
┌───────────────────┐     ┌───────────────┐
│ Process Multi-part│────►│ Create Page   │
│ Commands          │     └───────┬───────┘
└───────────────────┘             │
        │                         ▼
        │                ┌─────────────────┐
        │                │ Process Multiple │
        │                │ Actions          │
        │                └────────┬────────┘
        │                         │
        │                         ▼
        └───────────────►│ Add Content     │
                         └───────┬─────────┘
                                 │
                                 ▼
                        ┌─────────────────────┐
                        │ Format Content      │
                        │ (Checklist, Bullet, │
                        │  Toggle, etc.)      │
                        └───────┬─────────────┘
                                │
                                ▼
                        ┌─────────────────────┐
                        │ Place in Section    │
                        │ (if specified)      │
                        └───────┬─────────────┘
                                │
                                ▼
                        ┌─────────────────────┐
                        │ Return Response     │
                        └─────────────────────┘
```

## 📝 Supported Command Types

| Command Type | Example | Description |
|--------------|---------|-------------|
| Create | "Create a page called Project Notes" | Creates a new page |
| Write | "Write 'Meeting notes from today' in Work Journal" | Adds content to an existing page |
| Edit | "Edit 'old text' to 'new text' in Notes" | Modifies existing content |
| Multiple Actions | "Add a link to LinkedIn in Cool Plugins and add a comment to Project Notes" | Performs multiple separate actions |

## 🔗 License

ISC 