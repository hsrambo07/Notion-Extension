# Notion MCP Media Upload

This document explains how to use the media and file upload functionality in Notion MCP.

## Features

- Upload images, files, and other media to Notion pages
- Support for clipboard images (screenshots, copied images)
- Mixed content uploads (text + media in one request)
- Intelligent format detection for text content
- Section targeting for precise content placement
- Robust error handling and retry mechanisms

## Server-side API

### Upload Endpoint

```
POST /upload
```

Parameters (multipart/form-data):

| Parameter | Description | Required |
|-----------|-------------|----------|
| pageTitle | Title of the target Notion page | Yes |
| content | Text content to add | No |
| formatType | Format type for the text (paragraph, heading_1, to_do, etc.) | No |
| sectionTitle | Section name to target within the page | No |
| file | File(s) to upload (can include multiple file fields) | No |

At least one of `content` or `file` must be provided.

### Response

```json
{
  "success": true,
  "pageTitle": "Page Name",
  "sectionTitle": "Section Name (if specified)",
  "results": [
    {
      "type": "text",
      "content": "Text that was uploaded",
      "success": true,
      "message": "Success message"
    },
    {
      "type": "file",
      "filename": "image.png",
      "success": true,
      "message": "Success message"
    }
  ]
}
```

## Client-side Usage

### Basic Upload

```javascript
// Upload text content
const formData = new FormData();
formData.append('pageTitle', 'My Page');
formData.append('content', 'This is some text content');
formData.append('formatType', 'paragraph');

fetch('http://localhost:9000/upload', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(result => console.log('Success:', result))
.catch(error => console.error('Error:', error));
```

### Image Upload

```javascript
// Upload an image file
const formData = new FormData();
formData.append('pageTitle', 'My Page');
formData.append('file', imageFile);

fetch('http://localhost:9000/upload', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(result => console.log('Success:', result))
.catch(error => console.error('Error:', error));
```

### Mixed Content Upload

```javascript
// Upload text and image together
const formData = new FormData();
formData.append('pageTitle', 'My Page');
formData.append('content', 'Image caption');
formData.append('file', imageFile);

fetch('http://localhost:9000/upload', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(result => console.log('Success:', result))
.catch(error => console.error('Error:', error));
```

### Section Targeting

```javascript
// Add content to a specific section
const formData = new FormData();
formData.append('pageTitle', 'My Page');
formData.append('content', 'This will go into the specified section');
formData.append('sectionTitle', 'My Section');

fetch('http://localhost:9000/upload', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(result => console.log('Success:', result))
.catch(error => console.error('Error:', error));
```

### Multiple Files Upload

```javascript
// Upload multiple files
const formData = new FormData();
formData.append('pageTitle', 'My Page');
formData.append('file', file1);
formData.append('file', file2);
formData.append('file', file3);

fetch('http://localhost:9000/upload', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(result => console.log('Success:', result))
.catch(error => console.error('Error:', error));
```

## Using the NotionUploadHandler

The `NotionUploadHandler` class provides an easy way to interact with the upload API:

```javascript
// Create an instance of the uploader
const uploader = new NotionUploadHandler({
  apiUrl: 'http://localhost:9000',
  defaultPageTitle: 'My Page',
  debug: true
});

// Upload text content
uploader.uploadContent('This is some text', {
  formatType: 'paragraph',
  sectionTitle: 'My Section'
})
.then(result => console.log('Success:', result))
.catch(error => console.error('Error:', error));

// Upload a file
uploader.uploadFile(fileObject, {
  caption: 'Optional caption',
  sectionTitle: 'My Section'
})
.then(result => console.log('Success:', result))
.catch(error => console.error('Error:', error));

// Upload multiple files
uploader.uploadMultipleFiles(fileList, {
  caption: 'These are my files'
})
.then(result => console.log('Success:', result))
.catch(error => console.error('Error:', error));
```

## Clipboard Integration

The library provides clipboard integration for easily pasting images and text:

```javascript
// Initialize clipboard handlers on elements
initClipboardHandlers('.paste-area', {
  defaultPageTitle: 'My Page',
  onSuccess: (result, element) => {
    console.log('Upload success:', result);
  },
  onError: (error, element) => {
    console.error('Upload error:', error);
  }
});
```

HTML:

```html
<div 
  class="paste-area" 
  contenteditable="true" 
  data-page-title="My Page" 
  data-section-title="My Section">
  Paste content here...
</div>
```

## Testing

To test the upload functionality:

1. Start the Notion MCP server
2. Run the tests with `./test-upload.sh`
3. Open the demo page at `client/clipboard-demo.html` in a browser
4. Copy images or text and paste into the designated areas

## Troubleshooting

- **404 Not Found:** Make sure the server is running on the correct port
- **Invalid page:** Check that the specified page exists in your Notion workspace
- **Upload failed:** Verify that your Notion API token has proper permissions
- **Repeated errors:** Try increasing the retry count or delay settings 