/// <reference types="chrome"/>

// content.ts - Content Script for meet.google.com

console.log("MeetingMind content script injected.");

// Example: Scrape the meeting title
function getMeetingTitle(): string {
  // Google Meet title is typically in a data-meeting-title attribute or standard DOM nodes
  const titleElement = document.querySelector('[data-meeting-title]');
  if (titleElement && titleElement.textContent) {
    return titleElement.textContent;
  }
  return document.title || 'Untitled Meeting';
}

// Optional: listen for messages from the popup asking for page info
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'GET_MEETING_INFO') {
    sendResponse({
      title: getMeetingTitle(),
      url: window.location.href,
    });
  }
  return true;
});
