// Background service worker for Hidden Element Finder extension

const defaultSettings = {
    autoScan: true,
    highlightColor: '#40e0d0',
    maxElements: 1000,
    includeZeroSizeElements: false
};

// Gabungkan semua logic onInstalled dalam satu listener
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Hidden Element Finder installed:', details.reason);

    if (details.reason === 'install') {
        // Set up initial configuration or show welcome page
        console.log('Extension installed for the first time');
    } else if (details.reason === 'update') {
        console.log('Extension updated');
    }

    // Create context menu
    chrome.contextMenus.create({
        id: 'scan-hidden-elements',
        title: 'Scan for Hidden Elements',
        contexts: ['page']
    });

    // Initialize settings
    chrome.storage.sync.get(Object.keys(defaultSettings), (result) => {
        const settings = { ...defaultSettings, ...result };
        chrome.storage.sync.set(settings);
    });
});

// Handle extension icon click (optional, popup usually handles this)
chrome.action.onClicked.addListener((tab) => {
    // No additional action needed if popup is set in manifest
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message);

    if (message.type === 'SCAN_COMPLETE') {
        // Forward message to popup if needed
        chrome.runtime.sendMessage(message);
    }
    // Keep message channel open for async responses
    return true;
});

// Handle tab updates to clean up any temporary modifications
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        console.log('Tab updated:', tab.url);
    }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
    console.log('Hidden Element Finder extension started');
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'scan-hidden-elements') {
        chrome.tabs.sendMessage(tab.id, { type: 'FIND_HIDDEN_ELEMENTS' });
    }
});

// Handle extension suspend (lifetime event for service worker)
chrome.runtime.onSuspend.addListener(() => {
    console.log('Hidden Element Finder extension suspended');
});

// Export settings for other scripts (if needed)
function getSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(Object.keys(defaultSettings), (result) => {
            resolve({ ...defaultSettings, ...result });
        });
    });
}

console.log('Hidden Element Finder background service worker loaded');