// background.js - STABLE AUTOMATED VERSION WITH PERMANENT WHITELIST OVERRIDE

const API_BASE_URL = "http://localhost:5000";
const URL_CACHE = new Map();


// ========== URL SCANNING CORE ==========
async function scanURL(url, tabId) {

    try {

        // 🚀 STEP 1: Permanent Whitelist
        const storage = await chrome.storage.local.get(["PERMANENT_WHITELIST"]);
        const permanentList = storage.PERMANENT_WHITELIST || [];

        if (permanentList.includes(url)) {
            console.log("PhishShield: URL in permanent whitelist.");
            const safeData = {
                prediction: "legitimate",
                risk_score: 0,
                confidence: 100
            };

            updateBadge(safeData, tabId);
            return safeData;
        }

        // STEP 2: Skip local dashboard
        if (
            url.includes("localhost:3000") ||
            url.includes("127.0.0.1:3000")
        ) {
            chrome.action.setBadgeText({ text: "", tabId });
            return { skipped: true };
        }

        // STEP 3: Cache check
        if (URL_CACHE.has(url)) {
            const cached = URL_CACHE.get(url);

            if (Date.now() - cached.timestamp < 3600000) {
                updateBadge(cached.data, tabId);
                return cached.data;
            }
        }

        // STEP 4: Call Backend ML API
        const response = await fetch(
            `${API_BASE_URL}/api/extension/scan`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ url })
            }
        );

        // ⭐ IMPORTANT: handle bad responses
        if (!response.ok) {
            console.error("PhishShield API error:", response.status);
            return { error: "API error" };
        }

        const result = await response.json();

        // Cache result
        URL_CACHE.set(url, {
            data: result,
            timestamp: Date.now()
        });

        updateBadge(result, tabId);

        return result;

    } catch (error) {
        console.error("Auto-Scan Error:", error);

        // ⭐ CRITICAL FIX — always return something
        return { error: "Scan failed" };
    }
}


// ========== BADGE UI ==========
function updateBadge(result, tabId) {

    if (!result || !result.prediction) return;

    const text = result.prediction === "phishing" ? "⚠️" : "✓";
    const color = result.prediction === "phishing" ? "#FF0000" : "#00FF00";

    chrome.action.setBadgeText({ text, tabId });
    chrome.action.setBadgeBackgroundColor({ color, tabId });
}


// ========== AUTOMATED LISTENERS ==========
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

    if (changeInfo.status === "loading") {
        chrome.action.setBadgeText({ text: "", tabId });
    }

    if (changeInfo.url || (changeInfo.status === "loading" && tab.url)) {
        const targetUrl = changeInfo.url || tab.url;

        if (targetUrl && targetUrl.startsWith("http")) {
            scanURL(targetUrl, tabId);
        }
    }
});


chrome.tabs.onActivated.addListener((activeInfo) => {

    chrome.tabs.get(activeInfo.tabId, (tab) => {

        if (tab && tab.url && tab.url.startsWith("http")) {
            scanURL(tab.url, activeInfo.tabId);
        } else {
            chrome.action.setBadgeText({
                text: "",
                tabId: activeInfo.tabId
            });
        }
    });
});


// ========== MESSAGE LISTENER ==========
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    // ✅ Manual scan request
    if (message.action === "scanCurrentURL") {
        scanURL(message.url, sender.tab?.id)
            .then(sendResponse);
        return true;
    }

    // ✅ Clear cache
    if (message.action === "clearCache") {
        URL_CACHE.delete(message.url);
        sendResponse({ success: true });
        return true;
    }

    // ✅ Trust site
    if (message.action === "addToWhitelist") {

        URL_CACHE.set(message.url, {
            data: {
                prediction: "legitimate",
                risk_score: 0,
                confidence: 100
            },
            timestamp: Date.now() + (86400000 * 30)
        });

        chrome.storage.local.get(["PERMANENT_WHITELIST"], (result) => {
            const list = result.PERMANENT_WHITELIST || [];

            if (!list.includes(message.url)) {
                list.push(message.url);
                chrome.storage.local.set({
                    PERMANENT_WHITELIST: list
                });
            }
        });

        console.log(`PhishShield: ${message.url} whitelisted.`);
        sendResponse({ success: true });
        return true;
    }

    // ✅ Ignore warning log
    if (message.action === "logWarningIgnored") {
        console.log(`PhishShield: Warning ignored for ${message.url}`);
        sendResponse({ success: true });
        return true;
    }
});
