import { CommandParser } from './command-parser.js';

async function testManualComplexCommand() {
  console.log('\n=== Testing Command Parser with Manual Multi-Operation Command ===\n');

  // Create a command parser in test mode
  const commandParser = new CommandParser(null, true);

  // Test with a manually constructed multi-operation command
  const complexCommand = `Create a new page called "Complex Test" and add a bullet list with First test item, Second test item, Third test with details. Then add a code block with console.log("Testing completed successfully"); and finally add a callout saying "All tests passed!"`;

  console.log('Parsing complex command...');
  const parsedCommands = await commandParser.parseCommand(complexCommand);
  
  console.log('Parsed Commands:', JSON.stringify(parsedCommands, null, 2));
  console.log(`\nDetected ${parsedCommands.length} operations in the complex command`);

  return parsedCommands;
}

// Run the test
testManualComplexCommand().then(commands => {
  console.log('\n=== Test Results ===');
  
  if (commands.length > 1) {
    console.log(`✅ Multi-operation command parsing working (${commands.length} operations)`);
    
    // Check for specific operations
    const hasCreate = commands.some(cmd => cmd.action === 'create');
    const hasBullet = commands.some(cmd => cmd.formatType === 'bullet');
    const hasCode = commands.some(cmd => cmd.formatType === 'code');
    const hasCallout = commands.some(cmd => cmd.formatType === 'callout');
    
    if (hasCreate) console.log('✅ Page creation command detected');
    else console.log('❌ Page creation not detected');
    
    if (hasBullet) console.log('✅ Bullet list command detected');
    else console.log('❌ Bullet list not detected');
    
    if (hasCode) console.log('✅ Code block command detected');
    else console.log('❌ Code block not detected');
    
    if (hasCallout) console.log('✅ Callout command detected');
    else console.log('❌ Callout not detected');
    
  } else {
    console.log('❌ Multi-operation command parsing failed');
  }
}); 