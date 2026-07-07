/// <reference types="chrome"/>

// background.ts - Service Worker

chrome.runtime.onInstalled.addListener(() => {
  console.log("MeetingMind Extension Installed");
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message:", message, "from", sender);
  
  if (message.type === 'START_CAPTURE') {
    // In a full implementation, we would use chrome.tabCapture here
    // and establish a WebSocket connection to the backend.
    sendResponse({ status: 'started' });
  }
  
  if (message.type === 'STOP_CAPTURE') {
    sendResponse({ status: 'stopped' });
  }
  
  return true;
});
