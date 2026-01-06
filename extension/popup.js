// popup.js - FINAL STABLE VERSION

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

    // Request scan result from background.js
    chrome.runtime.sendMessage({
        action: "scanCurrentURL",
        url: currentTab.url
    }, (result) => {
        if (chrome.runtime.lastError) {
            displayResult({ error: "Cannot connect to PhishShield Backend." });
        } else {
            displayResult(result);
        }
    });
}

// ========== DISPLAY RESULT ==========
function displayResult(result) {
    const content = document.getElementById("content");

    // 1. Handle Errors
    if (!result || result.error) {
        content.innerHTML = `
            <div class="status" style="background: #FEF3C7; border: 2px solid #F59E0B; padding: 20px; border-radius: 8px;">
                <div style="font-size: 32px;">⚠️</div>
                <div style="font-weight: 600; margin-top: 8px;">Error</div>
                <div style="font-size: 12px; color: #92400E; margin-top: 4px;">
                    ${result?.error || "Unknown Error"}
                </div>
            </div>
        `;
        return;
    }

    // 2. Handle Phishing Detection
    if (result.prediction === "phishing") {
        const threatsHtml = result.attack_types.map(type => `
            <span style="background: #FEE2E2; color: #991B1B; padding: 4px 8px; border-radius: 4px; font-size: 11px;">
                ${type.replace(/_/g, " ")}
            </span>
        `).join("");

        content.innerHTML = `
            <div class="status danger" style="text-align: center; padding: 20px;">
                <div style="font-size: 48px;">⚠️</div>
                <div style="font-weight: 600; font-size: 18px; color: #DC2626; margin-top: 8px;">
                    Phishing Threat Detected
                </div>
                <div style="font-size: 32px; font-weight: bold; color: #DC2626; margin-top: 12px;">
                    ${result.risk_score}/100
                </div>
                <div style="font-size: 12px; color: #7F1D1D; margin-top: 4px;">
                    Confidence: ${result.confidence ? result.confidence.toFixed(1) : 0}%
                </div>
            </div>
            <div style="padding: 0 20px;">
                <h3 style="font-size: 14px; margin-bottom: 8px;">Detected Threats:</h3>
                <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px;">
                    ${threatsHtml}
                </div>
                <button id="viewDetails" class="button primary">View Full Report</button>
                <button id="reportFalse" class="button" style="background: #6B7280; color: white;">Report False Positive</button>
            </div>
        `;
        setupButtonHandlers();
    } else {
        // 3. Handle Safe Site
        content.innerHTML = `
            <div class="status safe" style="text-align: center; padding: 20px;">
                <div style="font-size: 48px; color: #059669;">✓</div>
                <div style="font-weight: 600; font-size: 18px; color: #059669; margin-top: 8px;">
                    This Site is Safe
                </div>
                <div style="font-size: 12px; color: #065F46; margin-top: 8px;">
                    No threats detected by Hybrid Engine
                </div>
            </div>
            <div style="padding: 0 20px;">
                <button id="scanAgain" class="button primary">🔄 Scan Again</button>
                <button id="viewHistory" class="button" style="background: #10B981; color: white;">📊 View Scan History</button>
                <button id="openSettings" class="button" style="background: #6B7280; color: white;">⚙️ Settings</button>
            </div>
        `;
        setupButtonHandlers();
    }
}

// ========== BUTTON HANDLERS ==========
function setupButtonHandlers() {
    const btnMap = {
        "viewDetails": () => chrome.tabs.create({ url: "http://localhost:3000" }),
        "scanAgain": () => loadPopup(),
        "viewHistory": () => chrome.tabs.create({ url: "http://localhost:3000/reports" }),
        "openSettings": () => chrome.runtime.openOptionsPage()
    };

    Object.keys(btnMap).forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.onclick = btnMap[id];
    });
}

// ========== INITIALIZE ==========
document.addEventListener("DOMContentLoaded", loadPopup);