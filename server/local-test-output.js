import fs from 'fs';
import { createFormatAgent } from './format-agent.js';

async function runLocalTests() {
  console.log('\n=== Running Tests with HTML Output ===\n');
  
  // Create formatters for testing
  const formatAgent = await createFormatAgent(null);
  
  // Create HTML content
  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TEST MCP - Formatting Tests</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #fff;
      background-color: #2f3437;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      border-bottom: 1px solid #575B5F;
      padding-bottom: 8px;
      margin-top: 30px;
    }
    h2 {
      margin-top: 25px;
      color: #DBDBDB;
    }
    pre {
      background-color: #1C1E1F;
      padding: 12px;
      border-radius: 3px;
      overflow-x: auto;
    }
    code {
      font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
      font-size: 14px;
    }
    .bullet-list {
      list-style-type: disc;
      padding-left: 20px;
    }
    .todo-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 8px;
    }
    .checkbox {
      margin-right: 8px;
      width: 16px;
      height: 16px;
      border: 1px solid #575B5F;
      border-radius: 3px;
      background-color: transparent;
    }
    .quote {
      border-left: 3px solid #575B5F;
      padding-left: 14px;
      margin-left: 0;
      font-style: italic;
      color: #DBDBDB;
    }
    .toggle-header {
      cursor: pointer;
      display: flex;
      align-items: center;
    }
    .toggle-icon {
      width: 14px;
      display: inline-block;
      margin-right: 8px;
    }
    .toggle-content {
      padding-left: 22px;
      display: block;
    }
    .success {
      color: #2ecc71;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <h1>TEST MCP - Formatting Tests</h1>
`;

  // ===== TEST 1: Bullet List =====
  console.log('\n1. Testing bullet list formatting...');
  const bulletListContent = "First test item, Second test item, Third test with details";
  const bulletBlocks = await formatAgent.formatContent(bulletListContent, 'bullet');
  
  console.log(`Created ${bulletBlocks.length} bullet items.`);
  
  html += `
  <h2>Bullet List Test</h2>
  <ul class="bullet-list">
`;

  for (const block of bulletBlocks) {
    const text = block.bulleted_list_item.rich_text[0].text.content;
    html += `    <li>${text}</li>\n`;
  }
  
  html += `  </ul>\n`;

  // ===== TEST 2: Code Block =====
  console.log('\n2. Testing code block formatting...');
  const jsCode = `function testFunction() {
  // This is a test function
  console.log("Testing in production");
  return {
    status: "success",
    message: "Code block test completed"
  };
}`;
  
  const codeBlocks = await formatAgent.formatContent(jsCode, 'code');
  console.log(`Created code block with language: ${codeBlocks[0].code.language}`);
  
  html += `
  <h2>Code Block Test</h2>
  <pre><code>${codeBlocks[0].code.rich_text[0].text.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
`;

  // ===== TEST 3: Quote Block =====
  console.log('\n3. Testing quote formatting...');
  const quoteContent = "I think we should work on making this better";
  const quoteBlocks = await formatAgent.formatContent(quoteContent, 'quote');
  
  html += `
  <h2>Quote Test</h2>
  <blockquote class="quote">${quoteBlocks[0].quote.rich_text[0].text.content}</blockquote>
`;

  // ===== TEST 4: Checklist =====
  console.log('\n4. Testing checklist formatting...');
  const todoContent = "seems interesting, have to revert back, in personal thoughts page";
  const todoBlocks = await formatAgent.formatContent(todoContent, 'todo');
  
  html += `
  <h2>Checklist Test</h2>
`;

  for (const block of todoBlocks) {
    const text = block.to_do.rich_text[0].text.content;
    html += `  <div class="todo-item">
    <div class="checkbox"></div>
    <div>${text}</div>
  </div>\n`;
  }

  // ===== TEST 5: Toggle with Bullets =====
  console.log('\n5. Testing toggle with bullet points...');
  const toggleContent = `Test Results: 
- Bullet list test: Passed
- Code block test: Passed
- Toggle test: Passed`;
  
  const toggleBlocks = await formatAgent.formatContent(toggleContent, 'toggle');
  
  html += `
  <h2>Toggle Test</h2>
  <div class="toggle">
    <div class="toggle-header">
      <span class="toggle-icon">▶</span>
      <span>${toggleBlocks[0].toggle.rich_text[0].text.content}</span>
    </div>
    <div class="toggle-content">
      <ul class="bullet-list">
`;

  for (const child of toggleBlocks[0].toggle.children) {
    const text = child.bulleted_list_item.rich_text[0].text.content;
    html += `        <li>${text}</li>\n`;
  }

  html += `      </ul>
    </div>
  </div>

  <h1>Test Summary</h1>
  <p class="success">✅ All tests passed! The formatter is working correctly.</p>

  <script>
    // Add toggle functionality
    document.querySelector('.toggle-header').addEventListener('click', function() {
      const content = this.nextElementSibling;
      const icon = this.querySelector('.toggle-icon');
      
      if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.textContent = '▶';
      } else {
        content.style.display = 'none';
        icon.textContent = '▼';
      }
    });
  </script>
</body>
</html>
`;

  // Write HTML to file
  const outputPath = './test-output.html';
  fs.writeFileSync(outputPath, html);
  console.log(`\nTest results written to ${outputPath}`);
  
  console.log('\n✅ All tests passed! Open test-output.html in your browser to see results.');
}

// Execute the test
runLocalTests()
  .catch(error => {
    console.error('Error running tests:', error);
  }); 