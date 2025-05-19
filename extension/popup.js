"use strict";
(() => {
  // extension/popup.ts
  var promptInput = document.getElementById("prompt");
  var runButton = document.getElementById("run");
  var clearButton = document.getElementById("clear");
  var logOutput = document.getElementById("log");
  var statusElement = document.getElementById("status");
  var confirmationContainer = document.getElementById("confirmation-container");
  var confirmYesButton = document.getElementById("confirm-yes");
  var confirmNoButton = document.getElementById("confirm-no");
  var API_URL = "http://localhost:8788";
  var currentPrompt = "";
  var pendingConfirmation = false;
  runButton.addEventListener("click", async () => {
    const prompt = promptInput.value.trim();
    if (!prompt) {
      logOutput.textContent = "Please enter a command.";
      return;
    }
    if (pendingConfirmation) {
      logOutput.textContent += "\nPlease respond to the confirmation first.";
      return;
    }
    currentPrompt = prompt;
    await sendRequest(prompt);
  });
  clearButton.addEventListener("click", () => {
    promptInput.value = "";
    logOutput.textContent = "";
    hideConfirmation();
    setStatus("Ready");
    pendingConfirmation = false;
  });
  confirmYesButton.addEventListener("click", async () => {
    hideConfirmation();
    pendingConfirmation = false;
    logOutput.textContent += "\nConfirmed. Executing...\n";
    await sendRequest(currentPrompt, true);
  });
  confirmNoButton.addEventListener("click", () => {
    hideConfirmation();
    pendingConfirmation = false;
    logOutput.textContent += "\nCancelled.\n";
    setStatus("Ready");
  });
  async function sendRequest(input, confirm = false) {
    setStatus("Sending request...");
    logOutput.textContent += `
> ${input}
`;
    try {
      console.log(`Sending request to ${API_URL}/chat`);
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ input, confirm })
      });
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Response data:", data);
      logOutput.textContent += `${data.response}
`;
      if (data.requireConfirm) {
        pendingConfirmation = true;
        showConfirmation();
        setStatus("Awaiting confirmation");
      } else {
        pendingConfirmation = false;
        setStatus("Ready");
      }
    } catch (error) {
      console.error("Error details:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      logOutput.textContent += `
Error: ${errorMessage}
`;
      setStatus("Error");
    }
    logOutput.scrollTop = logOutput.scrollHeight;
  }
  function showConfirmation() {
    confirmationContainer.classList.remove("hidden");
  }
  function hideConfirmation() {
    confirmationContainer.classList.add("hidden");
  }
  function setStatus(message) {
    statusElement.textContent = message;
  }
  function initialize() {
    promptInput.focus();
    setStatus("Ready");
    fetch(`${API_URL}`).then((response) => {
      if (response.ok) {
        console.log("Connected to server successfully");
        setStatus("Connected to server");
      } else {
        console.error("Server responded with error", response.status);
        setStatus(`Server error: ${response.status}`);
      }
    }).catch((error) => {
      console.error("Failed to connect to server", error);
      setStatus("Cannot connect to server");
    });
  }
  document.addEventListener("DOMContentLoaded", initialize);
})();
