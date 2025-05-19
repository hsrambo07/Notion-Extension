// DOM Elements
const promptInput = document.getElementById('prompt') as HTMLTextAreaElement;
const runButton = document.getElementById('run') as HTMLButtonElement;
const clearButton = document.getElementById('clear') as HTMLButtonElement;
const logOutput = document.getElementById('log') as HTMLPreElement;
const statusElement = document.getElementById('status') as HTMLParagraphElement;
const confirmationContainer = document.getElementById('confirmation-container') as HTMLDivElement;
const confirmYesButton = document.getElementById('confirm-yes') as HTMLButtonElement;
const confirmNoButton = document.getElementById('confirm-no') as HTMLButtonElement;
const statusDot = document.querySelector('.status-dot') as HTMLDivElement;

// Base URL for the API - make sure this matches your server
const API_URL = 'http://localhost:9000';

// Current context
let currentPrompt = '';
let pendingConfirmation = false;

// Handler for the Run button
runButton.addEventListener('click', async () => {
  const prompt = promptInput.value.trim();
  
  if (!prompt) {
    addToLog('Please enter a command.');
    return;
  }
  
  if (pendingConfirmation) {
    addToLog('Please respond to the confirmation first.');
    return;
  }
  
  currentPrompt = prompt;
  setButtonLoading(runButton, true);
  await sendRequest(prompt);
  setButtonLoading(runButton, false);
});

// Handler for the Clear button
clearButton.addEventListener('click', () => {
  promptInput.value = '';
  logOutput.textContent = '';
  hideConfirmation();
  setStatus('Connected to server');
  pendingConfirmation = false;
});

// Handler for the Confirm Yes button
confirmYesButton.addEventListener('click', async () => {
  hideConfirmation();
  pendingConfirmation = false;
  addToLog('Confirmed. Executing...');
  setButtonLoading(confirmYesButton, true);
  await sendRequest(currentPrompt, true);
  setButtonLoading(confirmYesButton, false);
});

// Handler for the Confirm No button
confirmNoButton.addEventListener('click', () => {
  hideConfirmation();
  pendingConfirmation = false;
  addToLog('Action cancelled.');
  setStatus('Connected to server');
});

// Function to send a request to the server
async function sendRequest(input: string, confirm: boolean = false) {
  setStatus('Processing...', true);
  addToLog(`> ${input}`);
  
  try {
    console.log(`Sending request to ${API_URL}/chat`);
    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input, confirm }),
    });
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Response data:', data);
    
    addToLog(data.response);
    
    // Check if confirmation is required
    if (data.requireConfirm) {
      pendingConfirmation = true;
      showConfirmation();
      setStatus('Awaiting confirmation', false);
    } else {
      pendingConfirmation = false;
      setStatus('Connected to server', false);
    }
    
  } catch (error) {
    console.error('Error details:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    addToLog(`Error: ${errorMessage}`);
    setStatus('Connection error', false);
    setStatusDotColor('#ff3b30'); // Red dot for error
  }
  
  // Scroll to the bottom of the log
  logOutput.scrollTop = logOutput.scrollHeight;
}

// Helper function to add text to log with proper spacing
function addToLog(message: string) {
  if (logOutput.textContent) {
    logOutput.textContent += '\n' + message;
  } else {
    logOutput.textContent = message;
  }
}

// Helper function to show confirmation UI
function showConfirmation() {
  confirmationContainer.classList.remove('hidden');
  // Add subtle animation
  confirmationContainer.style.opacity = '0';
  confirmationContainer.style.transform = 'translateY(-10px)';
  setTimeout(() => {
    confirmationContainer.style.transition = 'all 0.3s ease';
    confirmationContainer.style.opacity = '1';
    confirmationContainer.style.transform = 'translateY(0)';
  }, 10);
}

// Helper function to hide confirmation UI
function hideConfirmation() {
  confirmationContainer.style.opacity = '0';
  confirmationContainer.style.transform = 'translateY(-10px)';
  setTimeout(() => {
    confirmationContainer.classList.add('hidden');
    confirmationContainer.style.transition = '';
  }, 300);
}

// Helper function to update status
function setStatus(message: string, isLoading: boolean = false) {
  statusElement.textContent = message;
  if (isLoading) {
    statusElement.classList.add('loading');
  } else {
    statusElement.classList.remove('loading');
  }
}

// Helper to set status dot color
function setStatusDotColor(color: string) {
  statusDot.style.backgroundColor = color;
}

// Show loading state for buttons
function setButtonLoading(button: HTMLButtonElement, isLoading: boolean) {
  if (isLoading) {
    button.disabled = true;
    button.style.opacity = '0.7';
    const originalText = button.textContent || '';
    button.setAttribute('data-original-text', originalText);
    button.textContent = '...';
  } else {
    button.disabled = false;
    button.style.opacity = '1';
    const originalText = button.getAttribute('data-original-text') || '';
    button.textContent = originalText;
  }
}

// Initialize the extension
function initialize() {
  promptInput.focus();
  setStatus('Connecting...', true);
  
  // Test connection to server on startup
  fetch(`${API_URL}`)
    .then(response => {
      if (response.ok) {
        console.log('Connected to server successfully');
        setStatus('Connected to server', false);
        setStatusDotColor('#34c759'); // Green dot for connected
      } else {
        console.error('Server responded with error', response.status);
        setStatus(`Server error: ${response.status}`, false);
        setStatusDotColor('#ff9500'); // Orange dot for server error
      }
    })
    .catch(error => {
      console.error('Failed to connect to server', error);
      setStatus('Cannot connect to server', false);
      setStatusDotColor('#ff3b30'); // Red dot for connection error
    });
}

// Run the initialization when the DOM is loaded
document.addEventListener('DOMContentLoaded', initialize); 