// DOM Elements
const promptInput = document.getElementById('prompt');
const runButton = document.getElementById('run');
const clearButton = document.getElementById('clear');
const logOutput = document.getElementById('log');
const statusElement = document.getElementById('status');
const confirmationContainer = document.getElementById('confirmation-container');
const confirmYesButton = document.getElementById('confirm-yes');
const confirmNoButton = document.getElementById('confirm-no');
// Base URL for the API - make sure this matches your server
const API_URL = 'http://localhost:9000';
// Current context
let currentPrompt = '';
let pendingConfirmation = false;
// Handler for the Run button
runButton.addEventListener('click', async () => {
    const prompt = promptInput.value.trim();
    if (!prompt) {
        logOutput.textContent = 'Please enter a command.';
        return;
    }
    if (pendingConfirmation) {
        logOutput.textContent += '\nPlease respond to the confirmation first.';
        return;
    }
    currentPrompt = prompt;
    await sendRequest(prompt);
});
// Handler for the Clear button
clearButton.addEventListener('click', () => {
    promptInput.value = '';
    logOutput.textContent = '';
    hideConfirmation();
    setStatus('Ready');
    pendingConfirmation = false;
});
// Handler for the Confirm Yes button
confirmYesButton.addEventListener('click', async () => {
    hideConfirmation();
    pendingConfirmation = false;
    logOutput.textContent += '\nConfirmed. Executing...\n';
    await sendRequest(currentPrompt, true);
});
// Handler for the Confirm No button
confirmNoButton.addEventListener('click', () => {
    hideConfirmation();
    pendingConfirmation = false;
    logOutput.textContent += '\nCancelled.\n';
    setStatus('Ready');
});
// Function to send a request to the server
async function sendRequest(input, confirm = false) {
    setStatus('Sending request...');
    logOutput.textContent += `\n> ${input}\n`;
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
        logOutput.textContent += `${data.response}\n`;
        // Check if confirmation is required
        if (data.requireConfirm) {
            pendingConfirmation = true;
            showConfirmation();
            setStatus('Awaiting confirmation');
        }
        else {
            pendingConfirmation = false;
            setStatus('Ready');
        }
    }
    catch (error) {
        console.error('Error details:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        logOutput.textContent += `\nError: ${errorMessage}\n`;
        setStatus('Error');
    }
    // Scroll to the bottom of the log
    logOutput.scrollTop = logOutput.scrollHeight;
}
// Helper function to show confirmation UI
function showConfirmation() {
    confirmationContainer.classList.remove('hidden');
}
// Helper function to hide confirmation UI
function hideConfirmation() {
    confirmationContainer.classList.add('hidden');
}
// Helper function to update status
function setStatus(message) {
    statusElement.textContent = message;
}
// Initialize the extension
function initialize() {
    promptInput.focus();
    setStatus('Ready');
    // Test connection to server on startup
    fetch(`${API_URL}`)
        .then(response => {
        if (response.ok) {
            console.log('Connected to server successfully');
            setStatus('Connected to server');
        }
        else {
            console.error('Server responded with error', response.status);
            setStatus(`Server error: ${response.status}`);
        }
    })
        .catch(error => {
        console.error('Failed to connect to server', error);
        setStatus('Cannot connect to server');
    });
}
// Run the initialization when the DOM is loaded
document.addEventListener('DOMContentLoaded', initialize);
export {};
//# sourceMappingURL=popup.js.map