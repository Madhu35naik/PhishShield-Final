// content.js - FINAL STABLE VERSION WITH SHADOW DOM FIX (WORKING)

// ========== INITIALIZATION ==========
let CURRENT_URL = window.location.href;
let SCAN_RESULT = null;


// ========== REQUEST SCAN ==========
function requestScan() {

    if (
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
    ) {
        console.log("PhishShield: Skipping scan for local development dashboard.");
        return;
    }

    chrome.runtime.sendMessage({
        action: "scanCurrentURL",
        url: CURRENT_URL
    }, (response) => {

        if (!response || response.error) {
            console.log("PhishShield: Scan unavailable or backend not reachable.");
            return;
        }

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

    // ✅ CRITICAL FIX — wait until BODY exists
    if (!document.body) {
        window.addEventListener("DOMContentLoaded", () => {
            displayWarningOverlay(scanResult);
        }, { once: true });
        return;
    }

    // Remove existing overlay
    const existingHost = document.getElementById("phish-shield-host");
    if (existingHost) existingHost.remove();

    // Create host
    const host = document.createElement("div");
    host.id = "phish-shield-host";

    Object.assign(host.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100vw",
        height: "100vh",
        zIndex: "2147483647",
        pointerEvents: "none"
    });

    document.documentElement.appendChild(host);

    // Shadow DOM
    const shadow = host.attachShadow({ mode: "open" });

    // Blur page
    document.body.style.filter = "blur(10px)";
    document.body.style.pointerEvents = "none";

    const threatsHtml = (scanResult.attack_types || []).map(type => `
        <span style="background:#FEE2E2;color:#991B1B;padding:6px 12px;border-radius:6px;font-size:12px;font-weight:bold;margin:2px;">
            ${type.replace(/_/g, " ")}
        </span>
    `).join("");

    // Overlay UI
    shadow.innerHTML = `
        <style>
            .overlay {
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.95);
                display: flex;
                align-items: center;
                justify-content: center;
                pointer-events: auto;
                font-family: sans-serif;
            }

            .modal {
                background: white;
                padding: 40px;
                border-radius: 16px;
                max-width: 500px;
                width: 90%;
                text-align: center;
                box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3);
            }

            .btn-stack {
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin-top: 24px;
            }

            .btn-row {
                display: flex;
                gap: 10px;
            }

            button {
                padding: 12px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: bold;
                font-size: 14px;
            }

            #goBack { background:#DC2626;color:white;font-size:16px; }
            #ignore { background:#6B7280;color:white;flex:1; }
            #trust { background:#059669;color:white;flex:1; }
        </style>

        <div class="overlay">
            <div class="modal">
                <div style="font-size:64px;margin-bottom:20px;">🛡️⚠️</div>

                <h1 style="color:#DC2626;margin-bottom:16px;">
                    Phishing Detected
                </h1>

                <p style="color:#374151;margin-bottom:24px;">
                    PhishShield has flagged this site. What would you like to do?
                </p>

                <div style="background:#FEE2E2;padding:15px;border-radius:8px;margin-bottom:20px;">
                    <div style="font-size:12px;color:#991B1B;">Risk Score</div>
                    <div style="font-size:32px;font-weight:bold;color:#DC2626;">
                        ${scanResult.risk_score || 0}/100
                    </div>
                </div>

                <div style="margin-bottom:20px;display:flex;flex-wrap:wrap;justify-content:center;">
                    ${threatsHtml}
                </div>

                <div class="btn-stack">
                    <button id="goBack">⬅️ Get Me Out of Here</button>
                    <div class="btn-row">
                        <button id="ignore">⚠️ Ignore</button>
                        <button id="trust">✓ Trust Site</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Buttons
    shadow.getElementById("goBack").onclick = () => window.history.back();

    shadow.getElementById("ignore").onclick = () => {
        chrome.runtime.sendMessage({
            action: "logWarningIgnored",
            url: CURRENT_URL
        });
        removeWarning();
    };

    shadow.getElementById("trust").onclick = () => {
        chrome.runtime.sendMessage({
            action: "addToWhitelist",
            url: CURRENT_URL
        });
        removeWarning();
    };
}


// ========== REMOVE WARNING ==========
function removeWarning() {
    const host = document.getElementById("phish-shield-host");
    if (host) host.remove();

    if (document.body) {
        document.body.style.filter = "none";
        document.body.style.pointerEvents = "auto";
    }
}


// ========== SAFE INDICATOR ==========
function displaySafeIndicator() {

    if (document.getElementById("phish-shield-host")) return;

    const indicator = document.createElement("div");

    Object.assign(indicator.style, {
        position: "fixed",
        top: "16px",
        right: "16px",
        background: "#ECFDF5",
        border: "2px solid #059669",
        borderRadius: "8px",
        padding: "12px 16px",
        zIndex: "2147483647",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        transition: "opacity 0.3s"
    });

    indicator.innerHTML = `
        <span style="font-size:20px;">✓</span>
        <span style="color:#059669;font-weight:600;font-size:14px;">
            Protected by PhishShield
        </span>
    `;

    document.body.appendChild(indicator);

    setTimeout(() => {
        indicator.style.opacity = "0";
        setTimeout(() => indicator.remove(), 300);
    }, 3000);
}


// ========== INITIALIZATION ==========
if (document.readyState === "complete") {
    requestScan();
} else {
    window.addEventListener("load", requestScan);
}
