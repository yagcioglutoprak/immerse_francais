export default defineBackground(() => {
  // Set up review reminder alarm (every 4 hours)
  chrome.alarms.create('review-reminder', { periodInMinutes: 240 });

  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name !== 'review-reminder') return;

    // Check for due words by sending message to any open tab
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'CHECK_DUE_WORDS' }, (response) => {
          if (response?.dueCount > 0) {
            chrome.notifications.create('review-due', {
              type: 'basic',
              iconUrl: chrome.runtime.getURL('/icon/128.png'),
              title: 'ImmerseFrançais',
              message: `You have ${response.dueCount} words due for review!`,
            });
          }
        });
      }
    } catch {
      // Tab might not exist
    }
  });

  // Handle messages from content script
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'OPEN_DASHBOARD') {
      chrome.tabs.create({ url: chrome.runtime.getURL('/newtab.html') });
      sendResponse({ ok: true });
    }
    if (message.type === 'OPEN_OPTIONS') {
      chrome.runtime.openOptionsPage();
      sendResponse({ ok: true });
    }
    return true;
  });

  // On install, open onboarding
  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
      chrome.tabs.create({ url: chrome.runtime.getURL('/onboarding.html') });
    }
  });
});
