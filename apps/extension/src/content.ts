/// <reference types="chrome"/>

import { readGoogleMeetPageContext } from './capture/meeting-context';

// content.ts - Content Script for meet.google.com

console.log("MeetingMind content script injected.");

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'GET_MEETING_INFO') {
    try {
      sendResponse({ ...readGoogleMeetPageContext(document), url: window.location.href });
    } catch {
      sendResponse({ title: document.title.trim() || null, visible_participants: [], url: window.location.href });
    }
  }
  return false;
});
