// content.js - FINAL STABLE VERSION

// ========== INITIALIZATION ==========
let CURRENT_URL = window.location.href;
let SCAN_RESULT = null;

// ========== REQUEST SCAN ==========
function requestScan() {
    chrome.runtime.sendMessage({
        action: "scanCurrentURL",
        url: CURRENT_URL
    }, (response) => {
        if (!response) return; // Handle connection errors
        
        SCAN_RESULT = response;
        if (response.prediction === "phishing") {
            displayWarningOverlay(response);
        } else if (response.prediction === "legitimate") {
            displaySafeIndicator();
        }
    });
}

// ========== WARNING OVERLAY ==========
function displayWarningOverlay(scanResult) {
    // 1. Block page interaction
    document.body.style.filter = "blur(10px)";
    document.body.style.pointerEvents = "none";
    
    // 2. Create overlay container
    const overlay = document.createElement("div");
    overlay.id = "phish-shield-overlay";
    Object.assign(overlay.style, {
        position: "fixed",
        top: "0", left: "0",
        width: "100vw", height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.95)",
        zIndex: "999999",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "auto" // Allow clicks on the warning card itself
    });

    // 3. Create warning card with dynamic HTML
    // Fixed: Using template literals and mapping for attack types
    const threatsHtml = scanResult.attack_types.map(type => `
        <span style="background: #FEE2E2; color: #991B1B; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold;">
            ${type.replace(/_/g, " ")}
        </span>
    `).join("");

    overlay.innerHTML = `
        <div style="background: white; padding: 40px; border-radius: 16px; max-width: 600px; text-align: center; font-family: sans-serif;">
            <div style="font-size: 64px; margin-bottom: 20px;">🛡️⚠️</div>
            <h1 style="color: #DC2626; font-size: 32px; margin-bottom: 16px;">Phishing Website Detected</h1>
            <p style="color: #374151; font-size: 18px; margin-bottom: 24px;">
                PhishShield has detected that this website may be attempting to steal your information.
            </p>
            
            <div style="background: #FEE2E2; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                <div style="font-size: 14px; color: #991B1B;">Risk Score</div>
                <div style="font-size: 48px; font-weight: bold; color: #DC2626;">${scanResult.risk_score}/100</div>
                <div style="font-size: 12px; color: #7F1D1D;">
                    Confidence: ${scanResult.confidence ? scanResult.confidence.toFixed(1) : 0}%
                </div>
            </div>
            
            <div style="margin-bottom: 24px;">
                <h3 style="font-size: 16px; color: #374151; margin-bottom: 12px;">Detected Threats:</h3>
                <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;">
                    ${threatsHtml}
                </div>
            </div>
            
            <div style="display: flex; gap: 12px; justify-content: center;">
                <button id="ps-goBack" style="padding: 12px 24px; background: #DC2626; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold;">
                    ⬅️ Go Back
                </button>
                <button id="ps-continue" style="padding: 12px 24px; background: #6B7280; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
                    ⚠️ Ignore
                </button>
                <button id="ps-trust" style="padding: 12px 24px; background: #059669; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
                    ✓ Trust Site
                </button>
            </div>
            
            <div style="margin-top: 24px; padding: 16px; background: #F3F4F6; border-radius: 8px; text-align: left;">
                <p style="font-size: 14px; color: #374151; margin: 0;">
                    <strong>💡 Stay Safe:</strong> ${scanResult.prevention.advice[0] || "Be careful with your credentials."}
                </p>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // 5. Button handlers (Real JavaScript)
    document.getElementById("ps-goBack").onclick = () => {
        window.history.back();
    };

    document.getElementById("ps-continue").onclick = () => {
        chrome.runtime.sendMessage({ action: "logWarningIgnored", url: CURRENT_URL });
        overlay.remove();
        document.body.style.filter = "none";
        document.body.style.pointerEvents = "auto";
    };

    document.getElementById("ps-trust").onclick = () => {
        chrome.runtime.sendMessage({ action: "addToWhitelist", url: CURRENT_URL });
        overlay.remove();
        document.body.style.filter = "none";
        document.body.style.pointerEvents = "auto";
    };
}

// ========== SAFE INDICATOR ==========
function displaySafeIndicator() {
    const indicator = document.createElement("div");
    Object.assign(indicator.style, {
        position: "fixed",
        top: "16px",
        right: "16px",
        background: "#ECFDF5",
        border: "2px solid #059669",
        borderRadius: "8px",
        padding: "12px 16px",
        zIndex: "999999",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        transition: "opacity 0.3s"
    });

    indicator.innerHTML = `
        <span style="font-size: 20px;">✓</span>
        <span style="color: #059669; font-weight: 600; font-size: 14px;">Protected by PhishShield</span>
    `;

    document.body.appendChild(indicator);

    setTimeout(() => {
        indicator.style.opacity = "0";
        setTimeout(() => indicator.remove(), 300);
    }, 3000);
}

// ========== LISTEN FOR MESSAGES ==========
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "scanComplete") {
        SCAN_RESULT = message.result;
        if (message.result.prediction === "phishing") {
            displayWarningOverlay(message.result);
        } else {
            displaySafeIndicator();
        }
    }
});

// ========== AUTO-SCAN ON PAGE LOAD ==========
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", requestScan);
} else {
    requestScan();
}