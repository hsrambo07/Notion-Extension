import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:9000';
const TEST_PAGE = process.env.TEST_PAGE || 'TEST MCP';
const VERBOSE = process.env.VERBOSE === 'true';

// Test utilities
const log = (...args) => VERBOSE && console.log(...args);
const testResultsTable = [];
let passedTests = 0;
let failedTests = 0;

/**
 * Record test result
 */
const recordTestResult = (name, success, result, error = null) => {
  if (success) passedTests++;
  else failedTests++;
  
  testResultsTable.push({
    name,
    status: success ? '✅ PASS' : '❌ FAIL',
    result: success ? result : error
  });
  
  console.log(success ? `✅ PASSED: ${name}` : `❌ FAILED: ${name}`);
  if (error) console.error(error);
};

/**
 * Generate a test image
 */
const generateTestImage = async (width = 400, height = 300, text = 'Test Image') => {
  const svgImage = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <text x="50%" y="50%" font-family="Arial" font-size="24" text-anchor="middle" dominant-baseline="middle" fill="#333">${text}</text>
    </svg>
  `;
  
  return await sharp(Buffer.from(svgImage)).png().toBuffer();
};

/**
 * Upload test cases
 */
const runTests = async () => {
  console.log('🧪 Starting Notion MCP upload tests...');
  
  try {
    // Test 1: Basic text upload as paragraph
    await testTextUpload('Basic paragraph text', 'This is a test paragraph', 'paragraph');
    
    // Test 2: Text upload as heading
    await testTextUpload('Heading text', 'Important Test Heading', 'heading_1');
    
    // Test 3: To-do item
    await testTextUpload('To-do item', 'Complete testing suite', 'to_do');
    
    // Test 4: Bullet list item
    await testTextUpload('Bullet list item', 'First test bullet point', 'bulleted_list_item');
    
    // Test 5: Code block
    await testTextUpload('Code block', 'console.log("Testing code block");', 'code');
    
    // Test 6: Quote block
    await testTextUpload('Quote block', 'This is a quote for testing', 'quote');
    
    // Test 7: Callout block
    await testTextUpload('Callout block', 'Important test callout', 'callout');
    
    // Test 8: Auto-format detection (no format specified)
    await testTextUpload('Auto-format detection', 'Test auto-format detection');
    
    // Test 9: Text with emoji and special characters
    await testTextUpload('Text with special chars', '🚀 Testing special characters: "quotes" and emoji 👍');
    
    // Test 10: Section targeting
    await testTextUpload('Section targeting', 'Test section content', 'paragraph', 'Test Section');
    
    // Test 11: Basic image upload
    await testImageUpload('Basic image upload', 'test-image.png');
    
    // Test 12: Clipboard image upload
    await testClipboardImageUpload('Clipboard image upload');
    
    // Test 13: Mixed content (text + image)
    await testMixedContentUpload('Mixed content upload', 'Image caption text', 'test-image.png');
    
    // Test 14: Very long text
    const longText = 'This is a very long text for testing. '.repeat(100);
    await testTextUpload('Very long text', longText);
    
    // Test 15: Malformed request (missing page)
    await testErrorCase('Missing page name', async () => {
      const formData = new FormData();
      formData.append('content', 'Test content');
      // Deliberately omit pageTitle
      
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      return result.error?.includes('No page specified');
    });
    
    // Test 16: Large image upload
    await testLargeImageUpload('Large image upload');
    
    // Test 17: Multiple images upload
    await testMultipleImagesUpload('Multiple images upload');
    
    // Test 18: Empty content
    await testErrorCase('Empty content', async () => {
      const formData = new FormData();
      formData.append('pageTitle', TEST_PAGE);
      formData.append('content', '');
      
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      return result.error?.includes('No content provided');
    });
    
    // Test 19: Intelligent format detection for code
    await testTextUpload('Intelligent format - code', '```javascript\nconst test = () => console.log("Test");\n```');
    
    // Test 20: Intelligent format detection for heading
    await testTextUpload('Intelligent format - heading', '# Test Heading');
    
  } catch (error) {
    console.error('Test runner error:', error);
  } finally {
    // Print final results
    console.log('\n📊 TEST RESULTS SUMMARY:');
    console.log(`Total tests: ${passedTests + failedTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    
    console.log('\nDetailed Results:');
    console.table(testResultsTable);
  }
};

/**
 * Test text upload
 */
async function testTextUpload(testName, content, formatType = null, sectionTitle = null) {
  try {
    const formData = new FormData();
    formData.append('pageTitle', TEST_PAGE);
    formData.append('content', content);
    if (formatType) formData.append('formatType', formatType);
    if (sectionTitle) formData.append('sectionTitle', sectionTitle);
    
    log(`Testing ${testName}:`, { content, formatType, sectionTitle });
    
    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    log('Response:', result);
    
    if (response.ok && result.success) {
      recordTestResult(testName, true, `Successfully added ${formatType || 'auto-detected'} content`);
    } else {
      recordTestResult(testName, false, null, `API error: ${result.error || result.message || 'Unknown error'}`);
    }
  } catch (error) {
    recordTestResult(testName, false, null, error.toString());
  }
}

/**
 * Test image upload
 */
async function testImageUpload(testName, imageName, sectionTitle = null) {
  try {
    // Create test images directory if it doesn't exist
    const testImagesDir = path.join(__dirname, 'test-images');
    if (!fs.existsSync(testImagesDir)) {
      fs.mkdirSync(testImagesDir, { recursive: true });
    }
    
    // Generate a test image if it doesn't exist
    const imagePath = path.join(testImagesDir, imageName);
    if (!fs.existsSync(imagePath)) {
      const imageBuffer = await generateTestImage(400, 300, testName);
      fs.writeFileSync(imagePath, imageBuffer);
    }
    
    const formData = new FormData();
    formData.append('pageTitle', TEST_PAGE);
    formData.append('file', fs.createReadStream(imagePath), { filename: imageName, contentType: 'image/png' });
    if (sectionTitle) formData.append('sectionTitle', sectionTitle);
    
    log(`Testing ${testName}:`, { imageName, sectionTitle });
    
    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    log('Response:', result);
    
    if (response.ok && result.success) {
      recordTestResult(testName, true, `Successfully uploaded image`);
    } else {
      recordTestResult(testName, false, null, `API error: ${result.error || result.message || 'Unknown error'}`);
    }
  } catch (error) {
    recordTestResult(testName, false, null, error.toString());
  }
}

/**
 * Test clipboard image upload
 */
async function testClipboardImageUpload(testName, sectionTitle = null) {
  try {
    // Generate a test image to represent clipboard content
    const imageBuffer = await generateTestImage(400, 300, 'Clipboard Image');
    
    const formData = new FormData();
    formData.append('pageTitle', TEST_PAGE);
    formData.append('file', imageBuffer, { filename: 'clipboard', contentType: 'image/png' });
    if (sectionTitle) formData.append('sectionTitle', sectionTitle);
    
    log(`Testing ${testName}:`, { sectionTitle });
    
    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    log('Response:', result);
    
    if (response.ok && result.success) {
      recordTestResult(testName, true, `Successfully uploaded clipboard image`);
    } else {
      recordTestResult(testName, false, null, `API error: ${result.error || result.message || 'Unknown error'}`);
    }
  } catch (error) {
    recordTestResult(testName, false, null, error.toString());
  }
}

/**
 * Test mixed content upload (text + image)
 */
async function testMixedContentUpload(testName, content, imageName, sectionTitle = null) {
  try {
    // Create test images directory if it doesn't exist
    const testImagesDir = path.join(__dirname, 'test-images');
    if (!fs.existsSync(testImagesDir)) {
      fs.mkdirSync(testImagesDir, { recursive: true });
    }
    
    // Generate a test image if it doesn't exist
    const imagePath = path.join(testImagesDir, imageName);
    if (!fs.existsSync(imagePath)) {
      const imageBuffer = await generateTestImage(400, 300, testName);
      fs.writeFileSync(imagePath, imageBuffer);
    }
    
    const formData = new FormData();
    formData.append('pageTitle', TEST_PAGE);
    formData.append('content', content);
    formData.append('file', fs.createReadStream(imagePath), { filename: imageName, contentType: 'image/png' });
    if (sectionTitle) formData.append('sectionTitle', sectionTitle);
    
    log(`Testing ${testName}:`, { content, imageName, sectionTitle });
    
    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    log('Response:', result);
    
    if (response.ok && result.success) {
      recordTestResult(testName, true, `Successfully uploaded mixed content`);
    } else {
      recordTestResult(testName, false, null, `API error: ${result.error || result.message || 'Unknown error'}`);
    }
  } catch (error) {
    recordTestResult(testName, false, null, error.toString());
  }
}

/**
 * Test large image upload
 */
async function testLargeImageUpload(testName, sectionTitle = null) {
  try {
    // Generate a large test image
    const imageBuffer = await generateTestImage(2000, 2000, 'Large Test Image');
    
    const formData = new FormData();
    formData.append('pageTitle', TEST_PAGE);
    formData.append('file', imageBuffer, { filename: 'large-image.png', contentType: 'image/png' });
    if (sectionTitle) formData.append('sectionTitle', sectionTitle);
    
    log(`Testing ${testName}:`, { sectionTitle });
    
    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    log('Response:', result);
    
    if (response.ok && result.success) {
      recordTestResult(testName, true, `Successfully uploaded large image`);
    } else {
      recordTestResult(testName, false, null, `API error: ${result.error || result.message || 'Unknown error'}`);
    }
  } catch (error) {
    recordTestResult(testName, false, null, error.toString());
  }
}

/**
 * Test multiple images upload
 */
async function testMultipleImagesUpload(testName, sectionTitle = null) {
  try {
    // Generate multiple test images
    const image1 = await generateTestImage(400, 300, 'Test Image 1');
    const image2 = await generateTestImage(400, 300, 'Test Image 2');
    const image3 = await generateTestImage(400, 300, 'Test Image 3');
    
    const formData = new FormData();
    formData.append('pageTitle', TEST_PAGE);
    formData.append('file', image1, { filename: 'image1.png', contentType: 'image/png' });
    formData.append('file', image2, { filename: 'image2.png', contentType: 'image/png' });
    formData.append('file', image3, { filename: 'image3.png', contentType: 'image/png' });
    if (sectionTitle) formData.append('sectionTitle', sectionTitle);
    
    log(`Testing ${testName}:`, { sectionTitle });
    
    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    log('Response:', result);
    
    if (response.ok && result.success) {
      recordTestResult(testName, true, `Successfully uploaded multiple images`);
    } else {
      recordTestResult(testName, false, null, `API error: ${result.error || result.message || 'Unknown error'}`);
    }
  } catch (error) {
    recordTestResult(testName, false, null, error.toString());
  }
}

/**
 * Test error cases
 */
async function testErrorCase(testName, testFn) {
  try {
    log(`Testing error case: ${testName}`);
    
    const expectationMet = await testFn();
    
    if (expectationMet) {
      recordTestResult(testName, true, 'Error handled correctly');
    } else {
      recordTestResult(testName, false, null, 'Error not handled as expected');
    }
  } catch (error) {
    recordTestResult(testName, false, null, error.toString());
  }
}

// Run the tests
runTests().catch(console.error); 