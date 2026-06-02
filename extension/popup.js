// popup.js - FINAL STABLE VERSION (NO AUTH VERSION)


// ========== INITIALIZE ==========
document.addEventListener("DOMContentLoaded", async () => {
    // Directly load popup ✅
    loadPopup();
});


// ========== GET CURRENT TAB ==========
async function getCurrentTab() {
    let queryOptions = { active: true, currentWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}


// ========== LOAD POPUP DATA ==========
async function loadPopup() {
    const currentTab = await getCurrentTab();
    const content = document.getElementById("content");

    if (!currentTab || !currentTab.url.startsWith("http")) {
        content.innerHTML = `<div class="status">Navigate to a website to scan.</div>`;
        return;
    }

    chrome.runtime.sendMessage({
        action: "scanCurrentURL",
        url: currentTab.url
    }, (result) => {

        if (chrome.runtime.lastError || !result) {
            content.innerHTML = `<div class="status">Unable to scan this page.</div>`;
        } else {
            displayResult(result, currentTab.url);
        }
    });
}


// ========== DISPLAY RESULT ==========
function displayResult(result, currentTabUrl) {
    const content = document.getElementById("content");

    const domain = new URL(currentTabUrl).hostname;
    const timestamp = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    if (!result || result.error) {
        content.innerHTML = `<div class="status">Error analyzing website.</div>`;
        return;
    }

    // ===== PHISHING VIEW =====
    if (result.prediction === "phishing") {

        const threatsHtml = (result.attack_types || []).map(type => `
            <span style="background:#FEE2E2;color:#991B1B;padding:4px 8px;border-radius:4px;font-size:11px;border:1px solid #FECACA;">
                ${type.replace(/_/g, " ")}
            </span>
        `).join("");

        content.innerHTML = `
            <div class="bento-card">
                <div class="status-badge danger">⚠️ THREAT DETECTED</div>
                <div class="info-label">Target Domain</div>
                <div class="info-value">${domain}</div>
            </div>

            <div class="bento-card" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <div>
                    <div class="info-label">Risk Score</div>
                    <div class="info-value" style="color:#DC2626;font-size:20px;">
                        ${result.risk_score}/100
                    </div>
                </div>
                <div>
                    <div class="info-label">Last Scanned</div>
                    <div class="info-value">${timestamp}</div>
                </div>
            </div>

            <div class="bento-card">
                <div class="info-label">Detected Indicators</div>
                <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">
                    ${threatsHtml || "Suspicious Patterns"}
                </div>
            </div>

            <button id="viewDetails" class="button primary">
                View Full Forensic Report
            </button>
        `;
    }

    // ===== SAFE VIEW =====
    else {
        content.innerHTML = `
            <div class="bento-card">
                <div class="status-badge safe">✓ SITE VERIFIED SAFE</div>
                <div class="info-label">Currently Scanning</div>
                <div class="info-value">${domain}</div>
            </div>

            <div class="bento-card">
                <div class="info-label">Security Check Status</div>
                <div class="info-value" style="color:#059669;">
                    No malicious patterns found
                </div>
                <div style="font-size:11px;color:#6B7280;margin-top:4px;">
                    Last check: ${timestamp}
                </div>
            </div>

            <button id="scanAgain" class="button primary">
                🔄 Refresh Analysis
            </button>
        `;
    }

    setupButtonHandlers(currentTabUrl);
}


// ========== BUTTON HANDLERS ==========
function setupButtonHandlers(urlToReport) {

    const btnMap = {

        viewDetails: () => {
            const encodedUrl = encodeURIComponent(urlToReport);
            chrome.tabs.create({
                url: `http://localhost:3000/report?url=${encodedUrl}`
            });
        },

        scanAgain: () => {
            const content = document.getElementById("content");

            // Loading UI
            content.innerHTML = `
                <div style="padding:40px;text-align:center;color:#6B7280;">
                    <div style="font-size:40px;margin-bottom:16px;animation:pulse 1.5s infinite;">🔄</div>
                    <div style="font-weight:600;">Re-scanning URL...</div>
                    <div style="font-size:12px;margin-top:4px;">Refreshing threat analysis</div>
                </div>
                <style>
                    @keyframes pulse {
                        0% { transform:scale(1); opacity:1; }
                        50% { transform:scale(1.1); opacity:0.7; }
                        100% { transform:scale(1); opacity:1; }
                    }
                </style>
            `;

            chrome.runtime.sendMessage(
                { action: "clearCache", url: urlToReport },
                () => loadPopup()
            );
        }
    };

    Object.keys(btnMap).forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.onclick = btnMap[id];
    });
}
