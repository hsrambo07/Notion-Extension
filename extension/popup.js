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
  var statusDot = document.querySelector(".status-dot");
  var API_URL = "http://localhost:9000";
  var currentPrompt = "";
  var pendingConfirmation = false;
  runButton.addEventListener("click", async () => {
    const prompt = promptInput.value.trim();
    if (!prompt) {
      addToLog("Please enter a command.");
      return;
    }
    if (pendingConfirmation) {
      addToLog("Please respond to the confirmation first.");
      return;
    }
    currentPrompt = prompt;
    setButtonLoading(runButton, true);
    await sendRequest(prompt);
    setButtonLoading(runButton, false);
  });
  clearButton.addEventListener("click", () => {
    promptInput.value = "";
    logOutput.textContent = "";
    hideConfirmation();
    setStatus("Connected to server");
    pendingConfirmation = false;
  });
  confirmYesButton.addEventListener("click", async () => {
    hideConfirmation();
    pendingConfirmation = false;
    addToLog("Confirmed. Executing...");
    setButtonLoading(confirmYesButton, true);
    await sendRequest(currentPrompt, true);
    setButtonLoading(confirmYesButton, false);
  });
  confirmNoButton.addEventListener("click", () => {
    hideConfirmation();
    pendingConfirmation = false;
    addToLog("Action cancelled.");
    setStatus("Connected to server");
  });
  async function sendRequest(input, confirm = false) {
    setStatus("Processing...", true);
    addToLog(`> ${input}`);
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
      addToLog(data.response);
      if (data.requireConfirm) {
        pendingConfirmation = true;
        showConfirmation();
        setStatus("Awaiting confirmation", false);
      } else {
        pendingConfirmation = false;
        setStatus("Connected to server", false);
      }
    } catch (error) {
      console.error("Error details:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      addToLog(`Error: ${errorMessage}`);
      setStatus("Connection error", false);
      setStatusDotColor("#ff3b30");
    }
    logOutput.scrollTop = logOutput.scrollHeight;
  }
  function addToLog(message) {
    if (logOutput.textContent) {
      logOutput.textContent += "\n" + message;
    } else {
      logOutput.textContent = message;
    }
  }
  function showConfirmation() {
    confirmationContainer.classList.remove("hidden");
    confirmationContainer.style.opacity = "0";
    confirmationContainer.style.transform = "translateY(-10px)";
    setTimeout(() => {
      confirmationContainer.style.transition = "all 0.3s ease";
      confirmationContainer.style.opacity = "1";
      confirmationContainer.style.transform = "translateY(0)";
    }, 10);
  }
  function hideConfirmation() {
    confirmationContainer.style.opacity = "0";
    confirmationContainer.style.transform = "translateY(-10px)";
    setTimeout(() => {
      confirmationContainer.classList.add("hidden");
      confirmationContainer.style.transition = "";
    }, 300);
  }
  function setStatus(message, isLoading = false) {
    statusElement.textContent = message;
    if (isLoading) {
      statusElement.classList.add("loading");
    } else {
      statusElement.classList.remove("loading");
    }
  }
  function setStatusDotColor(color) {
    statusDot.style.backgroundColor = color;
  }
  function setButtonLoading(button, isLoading) {
    if (isLoading) {
      button.disabled = true;
      button.style.opacity = "0.7";
      const originalText = button.textContent || "";
      button.setAttribute("data-original-text", originalText);
      button.textContent = "...";
    } else {
      button.disabled = false;
      button.style.opacity = "1";
      const originalText = button.getAttribute("data-original-text") || "";
      button.textContent = originalText;
    }
  }
  function initialize() {
    promptInput.focus();
    setStatus("Connecting...", true);
    fetch(`${API_URL}`).then((response) => {
      if (response.ok) {
        console.log("Connected to server successfully");
        setStatus("Connected to server", false);
        setStatusDotColor("#34c759");
      } else {
        console.error("Server responded with error", response.status);
        setStatus(`Server error: ${response.status}`, false);
        setStatusDotColor("#ff9500");
      }
    }).catch((error) => {
      console.error("Failed to connect to server", error);
      setStatus("Cannot connect to server", false);
      setStatusDotColor("#ff3b30");
    });
  }
  document.addEventListener("DOMContentLoaded", initialize);
})();
