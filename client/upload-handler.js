/**
 * Notion MCP Upload Handler
 * Handles various types of uploads including clipboard images, files, and text content
 */

class NotionUploadHandler {
  constructor(options = {}) {
    this.apiUrl = options.apiUrl || 'http://localhost:9000';
    this.defaultPageTitle = options.defaultPageTitle || 'TEST MCP';
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.debug = options.debug || false;
    
    // Bind methods
    this.uploadContent = this.uploadContent.bind(this);
    this.uploadFile = this.uploadFile.bind(this);
    this.uploadClipboardData = this.uploadClipboardData.bind(this);
    this.handlePaste = this.handlePaste.bind(this);
    
    // Initialize
    this.log('Notion Upload Handler initialized');
  }
  
  /**
   * Console logging with debug mode check
   */
  log(...args) {
    if (this.debug) {
      console.log('[Notion Upload]', ...args);
    }
  }
  
  /**
   * Upload text content to Notion
   */
  async uploadContent(content, options = {}) {
    if (!content) {
      throw new Error('Content is required');
    }
    
    const pageTitle = options.pageTitle || this.defaultPageTitle;
    const formatType = options.formatType || null;
    const sectionTitle = options.sectionTitle || null;
    
    this.log('Uploading content:', { content, pageTitle, formatType, sectionTitle });
    
    const formData = new FormData();
    formData.append('pageTitle', pageTitle);
    formData.append('content', content);
    
    if (formatType) {
      formData.append('formatType', formatType);
    }
    
    if (sectionTitle) {
      formData.append('sectionTitle', sectionTitle);
    }
    
    return this.sendRequest(formData, options);
  }
  
  /**
   * Upload a file (image, document, etc.) to Notion
   */
  async uploadFile(file, options = {}) {
    if (!file) {
      throw new Error('File is required');
    }
    
    const pageTitle = options.pageTitle || this.defaultPageTitle;
    const sectionTitle = options.sectionTitle || null;
    const caption = options.caption || null;
    
    this.log('Uploading file:', { 
      fileName: file.name, 
      fileType: file.type, 
      fileSize: file.size,
      pageTitle, 
      sectionTitle 
    });
    
    const formData = new FormData();
    formData.append('pageTitle', pageTitle);
    formData.append('file', file);
    
    if (sectionTitle) {
      formData.append('sectionTitle', sectionTitle);
    }
    
    if (caption) {
      formData.append('content', caption);
    }
    
    return this.sendRequest(formData, options);
  }
  
  /**
   * Upload multiple files at once
   */
  async uploadMultipleFiles(files, options = {}) {
    if (!files || files.length === 0) {
      throw new Error('Files are required');
    }
    
    const pageTitle = options.pageTitle || this.defaultPageTitle;
    const sectionTitle = options.sectionTitle || null;
    
    this.log('Uploading multiple files:', { 
      fileCount: files.length,
      pageTitle, 
      sectionTitle 
    });
    
    const formData = new FormData();
    formData.append('pageTitle', pageTitle);
    
    // Add each file to the form data
    Array.from(files).forEach(file => {
      formData.append('file', file);
    });
    
    if (sectionTitle) {
      formData.append('sectionTitle', sectionTitle);
    }
    
    if (options.caption) {
      formData.append('content', options.caption);
    }
    
    return this.sendRequest(formData, options);
  }
  
  /**
   * Upload clipboard data (handles both text and images)
   */
  async uploadClipboardData(clipboardData, options = {}) {
    if (!clipboardData) {
      throw new Error('Clipboard data is required');
    }
    
    const pageTitle = options.pageTitle || this.defaultPageTitle;
    const sectionTitle = options.sectionTitle || null;
    
    this.log('Processing clipboard data');
    
    const formData = new FormData();
    formData.append('pageTitle', pageTitle);
    
    if (sectionTitle) {
      formData.append('sectionTitle', sectionTitle);
    }
    
    // Process text content
    const text = clipboardData.getData('text/plain');
    if (text) {
      this.log('Clipboard contains text:', text);
      formData.append('content', text);
    }
    
    // Process images
    const hasImage = clipboardData.types.some(type => 
      type === 'Files' || type.startsWith('image/')
    );
    
    if (hasImage) {
      this.log('Clipboard contains image');
      
      // Get files from clipboard
      const files = clipboardData.files;
      if (files && files.length > 0) {
        // Add all clipboard files
        Array.from(files).forEach(file => {
          formData.append('file', file);
        });
      } else {
        // Try to get image data from clipboard items
        try {
          const items = clipboardData.items;
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.kind === 'file' && item.type.startsWith('image/')) {
              const blob = item.getAsFile();
              formData.append('file', blob, 'clipboard');
            }
          }
        } catch (error) {
          this.log('Error processing clipboard image:', error);
        }
      }
    }
    
    // If no content was added, throw error
    if (!text && !hasImage) {
      throw new Error('No valid content found in clipboard data');
    }
    
    return this.sendRequest(formData, options);
  }
  
  /**
   * Handle paste event (for clipboard support)
   */
  handlePaste(event, options = {}) {
    if (!event) {
      throw new Error('Event is required');
    }
    
    event.preventDefault();
    
    this.log('Paste event detected');
    return this.uploadClipboardData(event.clipboardData, options);
  }
  
  /**
   * Send request to the server with retries
   */
  async sendRequest(formData, options = {}) {
    const maxRetries = options.maxRetries || this.maxRetries;
    let retryCount = 0;
    let lastError = null;
    
    // Add retry logic
    while (retryCount <= maxRetries) {
      try {
        this.log(`Sending request (attempt ${retryCount + 1}/${maxRetries + 1})`);
        
        const response = await fetch(`${this.apiUrl}/upload`, {
          method: 'POST',
          body: formData
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || result.message || `Server returned ${response.status}`);
        }
        
        this.log('Upload successful:', result);
        return result;
      } catch (error) {
        lastError = error;
        retryCount++;
        
        if (retryCount <= maxRetries) {
          const delay = this.retryDelay * Math.pow(2, retryCount - 1);
          this.log(`Upload failed, retrying in ${delay}ms:`, error);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          this.log('Upload failed after maximum retries:', error);
          throw error;
        }
      }
    }
    
    throw lastError || new Error('Failed to upload after retries');
  }
}

/**
 * Initialize clipboard handling on specified elements
 */
function initClipboardHandlers(selector, options = {}) {
  const elements = document.querySelectorAll(selector);
  const uploader = new NotionUploadHandler(options);
  
  elements.forEach(element => {
    element.addEventListener('paste', (event) => {
      uploader.handlePaste(event, {
        pageTitle: element.dataset.pageTitle || options.defaultPageTitle,
        sectionTitle: element.dataset.sectionTitle || null
      })
      .then(result => {
        if (options.onSuccess) {
          options.onSuccess(result, element);
        }
      })
      .catch(error => {
        if (options.onError) {
          options.onError(error, element);
        } else {
          console.error('Clipboard upload error:', error);
        }
      });
    });
  });
  
  return uploader;
}

// Export for browser and module environments
if (typeof window !== 'undefined') {
  window.NotionUploadHandler = NotionUploadHandler;
  window.initClipboardHandlers = initClipboardHandlers;
}

export { NotionUploadHandler, initClipboardHandlers }; 