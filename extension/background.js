// Valid JavaScript for background.js

const API_BASE_URL = "http://localhost:5000";
let AUTH_TOKEN = null;
const URL_CACHE = new Map();

// ========== AUTHENTICATION ==========
async function authenticate(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();
            AUTH_TOKEN = data.token;
            chrome.storage.local.set({ AUTH_TOKEN });
            return { success: true, user: data.user };
        } else {
            return { success: false, error: "Invalid credentials" };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ========== URL SCANNING ==========
async function scanURL(url, tabId) {
    // 1. Check Cache
    if (URL_CACHE.has(url)) {
        const cached = URL_CACHE.get(url);
        if (Date.now() - cached.timestamp < 3600000) {
            return cached.data;
        }
    }

    // 2. API Call to Hybrid Backend
    try {
        const response = await fetch(`${API_BASE_URL}/api/scan`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: url })
        });

        if (response.ok) {
            const result = await response.json();
            
            // Cache result
            URL_CACHE.set(url, { data: result, timestamp: Date.now() });

            // Update Badge based on prediction
            const text = result.prediction === "phishing" ? "⚠️" : "✓";
            const color = result.prediction === "phishing" ? "#FF0000" : "#00FF00";
            
            chrome.action.setBadgeText({ text, tabId });
            chrome.action.setBadgeBackgroundColor({ color, tabId });

            return result;
        }
    } catch (error) {
        console.error("Scan Error:", error);
    }
}

// ========== LISTENERS ==========
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url && tab.url.startsWith("http")) {
        scanURL(tab.url, tabId);
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "login") {
        authenticate(message.email, message.password).then(sendResponse);
        return true; // Keep channel open
    }
    
    if (message.action === "scanCurrentURL") {
        scanURL(message.url, sender.tab.id).then(sendResponse);
        return true;
    }
});