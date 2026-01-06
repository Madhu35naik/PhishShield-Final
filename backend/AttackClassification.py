# AttackClassification.py
"""
Complete Attack Classification & Prevention System
HYBRID: Rule-Based + Feature-Based Detection
Full Prevention & Educational Content Database
"""

from FeatureExtraction import feature_names
from datetime import datetime

# Import rule-based detection
try:
    from DetectionRB import classify_by_rules
    RULES_AVAILABLE = True
    print("✅ detection loaded successfully")
except ImportError:
    RULES_AVAILABLE = False
    print("⚠️ RuleBasedDetection.py not found - using feature-based only")


# ===============================
# FEATURE-BASED CLASSIFICATION
# ===============================

def classify_attack_type_by_features(features):
    """Feature-based classification (fallback)"""
    if not isinstance(features, (list, tuple)) or len(features) < len(feature_names):
        return ["INVALID_FEATURES"]

    feature_dict = dict(zip(feature_names, features))
    
    # Priority 1: IP-based
    if feature_dict.get('Have_IP', 0) == 1:
        return ['IP_BASED_PHISHING']
    
    # Priority 2: URL Shorteners
    if feature_dict.get('TinyURL', 0) == 1:
        return ['URL_SHORTENER_PHISHING']
    
    # Priority 3: iFrame
    if feature_dict.get('iFrame', 0) == 1:
        return ['IFRAME_OVERLAY_PHISHING']
    
    # Priority 4: Typosquatting
    if feature_dict.get('Prefix/Suffix', 0) == 1:
        return ['TYPOSQUATTING_HOMOGRAPH']
    
    # Priority 5: Fake security
    if feature_dict.get('https_Domain', 0) == 1:
        return ['FAKE_SECURITY_INDICATOR']
    
    # Priority 6: Redirects
    if feature_dict.get('Redirection', 0) == 1:
        return ['OPEN_REDIRECT_PHISHING']
    
    # Priority 7: Domain age/DNS
    if feature_dict.get('DNS_Record', 0) == 1 or feature_dict.get('Domain_Age', 0) == 1:
        return ['NEW_DOMAIN_PHISHING']
    
    # Priority 8: Social engineering
    if feature_dict.get('Mouse_Over', 0) == 1 or feature_dict.get('Right_Click', 0) == 1:
        return ['SOCIAL_ENGINEERING_PHISHING']
    
    # Multi-vector detection
    suspicious_count = sum([
        feature_dict.get('Have_IP', 0),
        feature_dict.get('TinyURL', 0),
        feature_dict.get('Prefix/Suffix', 0),
        feature_dict.get('https_Domain', 0),
        feature_dict.get('Redirection', 0),
        feature_dict.get('Domain_Age', 0),
        feature_dict.get('DNS_Record', 0),
        feature_dict.get('iFrame', 0)
    ])
    
    if suspicious_count >= 3:
        return ['SOPHISTICATED_MULTI_VECTOR_ATTACK']
    
    return ['GENERAL_PHISHING']


# ===============================
# HYBRID CLASSIFICATION
# ===============================

def classify_attack_type(features, url=None):
    """
    HYBRID classification: Rules first, then features
    """
    # Try rule-based first
    if url and RULES_AVAILABLE:
        attack_type, confidence, details = classify_by_rules(url)
        if attack_type:
            print(f"✓ Rule-based: {attack_type} ({confidence}%)")
            return [attack_type]
    
    # Fallback to feature-based
    return classify_attack_type_by_features(features)


# ===============================
# COMPLETE PREVENTION DATABASE
# ===============================

ENHANCED_PREVENTION = {
    
    'IP_BASED_PHISHING': {
        'severity': 'HIGH',
        'risk_score': 85,
        'warning': '🛑 IP Address Detected in URL - High Risk!',
        
        'technical_details': {
            'description': 'The URL uses a raw IP address (e.g., 192.168.1.1) instead of a proper domain name. Legitimate websites always use registered domain names.',
            'why_dangerous': 'Attackers use IP addresses to evade domain-based security filters, avoid domain registration costs, hide ownership details, and bypass reputation systems.',
            'common_targets': 'Banking portals, e-commerce sites, corporate SSO, cloud services, email providers',
            'attack_vector': 'Direct IP access bypasses DNS filtering and traditional URL analysis.',
            'prevalence': '8-12% of phishing attacks use IP addresses'
        },
        
        'advice': [
            '🚫 NEVER enter credentials on IP-based URLs',
            '✅ Legitimate services ALWAYS use domain names (example.com)',
            '⚠️ Close page immediately without clicking anything',
            '📧 Mark as phishing if received via email',
            '🔒 Access services through official domains only',
            '🛡️ Enable two-factor authentication on all accounts'
        ],
        
        'how_to_identify': [
            'URL contains numbers and dots: http://203.0.113.45/login',
            'Format like http://192.168.1.1 or https://10.0.0.5',
            'Often uses HTTP instead of HTTPS',
            'Browser shows "Not Secure" warning',
            'No recognizable company name in address'
        ],
        
        'real_examples': [
            'http://203.0.113.45/paypal-login/verify',
            'https://198.51.100.10/chase-banking/secure',
            'http://192.168.1.1/microsoft-account',
            'https://172.16.254.1/amazon-payment'
        ],
        
        'prevention_techniques': [
            'Deploy DNS filtering to block IP access',
            'Use browser extensions that warn about IPs',
            'Configure email gateways to flag IP links',
            'Train users: "Numbers and dots = danger"',
            'Implement web proxy IP blocking rules'
        ],
        
        'if_clicked': [
            '1. Close browser tab immediately (Ctrl+W)',
            '2. DO NOT interact with page elements',
            '3. Clear browser cache and cookies',
            '4. Run antivirus scan',
            '5. If credentials entered: Change passwords IMMEDIATELY',
            '6. Enable 2FA if not already active',
            '7. Monitor accounts for unauthorized access',
            '8. Report to IT security with URL and timestamp'
        ]
    },
    
    'TYPOSQUATTING_HOMOGRAPH': {
        'severity': 'CRITICAL',
        'risk_score': 95,
        'warning': '🚨 Brand Impersonation Detected - Critical!',
        
        'technical_details': {
            'description': 'Domain mimics legitimate brands using character substitutions (paypa1.com) or visually similar characters from different alphabets.',
            'why_dangerous': 'Extremely effective - users see familiar brands and miss subtle differences. 45% click-through rate.',
            'common_targets': 'Banks, tech companies (Google, Microsoft), payment processors (PayPal, Stripe), social media',
            'attack_vector': 'Visual deception exploiting reading patterns and brand trust.',
            'prevalence': '30-40% of all phishing attacks'
        },
        
        'advice': [
            '🚨 CRITICAL: This is NOT the official website',
            '🔍 Examine EACH character in domain name carefully',
            '⚠️ Look for: I vs l, 0 vs O, rn vs m',
            '🔖 Always use bookmarks or direct search',
            '🛡️ Use password managers - they detect mismatches',
            '📱 Report to real company\'s abuse team'
        ],
        
        'how_to_identify': [
            'Character swaps: paypa1.com (1→l), micr0soft.com (0→o)',
            'Letter combos: arnazon.com (rn→m)',
            'Extra hyphens: paypal-secure.com',
            'Wrong TLD: paypal.net instead of .com',
            'Added prefixes: secure-apple.com',
            'Homographs: аррӏе.com (Cyrillic letters)'
        ],
        
        'real_examples': [
            'paypa1.com (reported 2,500+ times)',
            'arnazon.com (major 2018 campaign)',
            'micros0ft.com (active phishing)',
            'faceb00k.com (zeros for o\'s)',
            'g00gle-login.com'
        ],
        
        'prevention_techniques': [
            'Use password managers (auto-fill only on correct domains)',
            'Enable browser homograph protection',
            'Deploy DNS security with brand protection',
            'Implement email filtering for lookalikes',
            'Bookmark official sites - never type manually',
            'Train users with real examples'
        ],
        
        'if_clicked': [
            '🚨 DO NOT ENTER ANY INFORMATION',
            '1. Close page using keyboard (Ctrl+W)',
            '2. Take screenshot for reporting',
            '3. Clear all browser data',
            '4. If credentials entered:',
            '   a. Change password IMMEDIATELY on official site',
            '   b. Enable 2FA urgently',
            '   c. Check account activity',
            '   d. Monitor for suspicious transactions',
            '5. If financial info entered: Contact bank immediately',
            '6. Report to brand\'s abuse team',
            '7. File report with Anti-Phishing Working Group'
        ]
    },
    
    'URL_SHORTENER_PHISHING': {
        'severity': 'MEDIUM',
        'risk_score': 60,
        'warning': '⚠️ URL Shortener Detected - Hidden Destination',
        
        'technical_details': {
            'description': 'Uses link shortening services (bit.ly, tinyurl.com) to hide true destination.',
            'why_dangerous': 'Prevents evaluation before clicking, bypasses URL blacklists, enables tracking.',
            'common_targets': 'Social media users, SMS recipients, email campaigns',
            'attack_vector': 'Social engineering with URL obfuscation.',
            'prevalence': '15-20% of phishing campaigns'
        },
        
        'advice': [
            '⚠️ Never click shortened links in unsolicited messages',
            '🔍 Use URL expander tools (CheckShortURL.com)',
            '✉️ Verify sender through alternative channels',
            '🛡️ Use browser extensions that auto-expand URLs',
            '📱 Be extra cautious with urgent language'
        ],
        
        'how_to_identify': [
            'Domains: bit.ly, tinyurl.com, goo.gl, t.co',
            'Short random strings: bit.ly/3xK9mPq',
            'In unsolicited messages',
            'Combined with urgency: "Click now!"',
            'No destination preview'
        ],
        
        'real_examples': [
            'http://bit.ly/3xK9mPq → fake Microsoft login',
            'https://tinyurl.com/paypal-verify',
            'http://t.co/abc123 → credential harvester'
        ],
        
        'prevention_techniques': [
            'Deploy filtering that expands shortened URLs',
            'Use security tools following redirect chains',
            'Block high-risk shortener domains',
            'Implement time-of-click protection',
            'Train users to verify shortened URLs'
        ],
        
        'if_clicked': [
            '1. Check final destination carefully',
            '2. Look for SSL warnings',
            '3. Close if asking for credentials',
            '4. Report to shortening service',
            '5. Clear browser data',
            '6. If credentials entered: change passwords'
        ]
    },
    
    'FAKE_SECURITY_INDICATOR': {
        'severity': 'MEDIUM',
        'risk_score': 60,
        'warning': '⚠️ Fake Security Term in Domain',
        
        'technical_details': {
            'description': 'Domain contains security keywords (https, ssl, secure) to create false trust.',
            'why_dangerous': 'Exploits trust in security terminology. "https" in name ≠ secure site.',
            'common_targets': 'Security-conscious users, enterprise employees',
            'attack_vector': 'Psychological manipulation using security terms.',
            'prevalence': '10-15% of phishing attempts'
        },
        
        'advice': [
            '🔒 Check ACTUAL padlock icon in browser',
            '🔍 Click padlock to view real SSL certificate',
            '⚠️ "https" in domain name ≠ secure website',
            '✅ Real security = valid SSL/TLS certificate',
            '🚫 Legitimate sites don\'t need "secure" in domain'
        ],
        
        'how_to_identify': [
            'Contains: https-, ssl-, secure-, verify-',
            'Examples: https-paypal.com, secure-banking.com',
            'Often with brand names: secure-chase.com',
            'May have valid HTTPS but wrong certificate'
        ],
        
        'real_examples': [
            'https-www-paypal-verify.com',
            'secure-chase-online-banking.com',
            'ssl-microsoft-account.net'
        ],
        
        'prevention_techniques': [
            'User education: "Security is in certificate, not name"',
            'Browser extensions highlighting suspicious keywords',
            'Email filtering for security term domains',
            'Train users to check SSL indicators'
        ],
        
        'if_clicked': [
            '1. Click padlock to check certificate',
            '2. Verify certificate organization',
            '3. Check for "Not Secure" warnings',
            '4. Close if certificate invalid',
            '5. If credentials entered: change immediately'
        ]
    },
    
    'SOPHISTICATED_MULTI_VECTOR_ATTACK': {
        'severity': 'CRITICAL',
        'risk_score': 100,
        'warning': '☢️ ADVANCED ATTACK - Maximum Threat',
        
        'technical_details': {
            'description': 'Combines 3+ techniques simultaneously. Indicates professional, targeted campaign.',
            'why_dangerous': 'Multiple techniques bypass layered defenses. Often APT or nation-state actors.',
            'common_targets': 'C-suite, CFOs, admins, government officials',
            'attack_vector': 'Layered deception with multiple evasion techniques.',
            'prevalence': '<5% of attacks but 60%+ of successful breaches'
        },
        
        'advice': [
            '☢️ CRITICAL: Highly sophisticated attack',
            '🚨 Disconnect from network immediately',
            '📞 Contact IT security urgently',
            '🛑 DO NOT interact with page',
            '📸 Document everything',
            '💼 May be targeted spear-phishing'
        ],
        
        'how_to_identify': [
            'Combines IP + brand impersonation',
            'Uses shorteners + new domains',
            'Multiple redirects + harvesting',
            'High-quality site replicas',
            'Personalized information'
        ],
        
        'real_examples': [
            'IP + brand + shortener combination',
            'New TLD + brand + redirect chain',
            'Spear-phishing with wire transfer requests'
        ],
        
        'prevention_techniques': [
            'Deploy AI-based email security',
            'Implement zero-trust architecture',
            'Use threat intelligence feeds',
            'Enable MFA on ALL accounts',
            'Deploy deception technology',
            'Conduct executive security training'
        ],
        
        'if_clicked': [
            '⚠️ INCIDENT RESPONSE PROTOCOL:',
            '1. ISOLATE: Disconnect from networks',
            '2. PRESERVE: Screenshots, URLs, headers',
            '3. REPORT: Incident response team immediately',
            '4. DO NOT use device for other tasks',
            '5. If credentials entered: Force reset from clean device',
            '6. Follow breach notification procedures',
            '7. Consider identity protection services'
        ]
    },
    
    'IFRAME_OVERLAY_PHISHING': {
        'severity': 'HIGH',
        'risk_score': 75,
        'warning': '⚠️ Hidden iFrame Detected',
        
        'technical_details': {
            'description': 'Uses invisible iFrames to overlay malicious forms on legitimate-looking pages.',
            'why_dangerous': 'Users see trusted site but interact with attacker forms.',
            'common_targets': 'Banking, email providers, social networks',
            'attack_vector': 'Visual overlay with transparent iFrames.',
            'prevalence': '5-8% of phishing attacks'
        },
        
        'advice': [
            '🔍 Inspect page source if suspicious',
            '⚠️ Look for multiple scroll bars',
            '🖱️ Try clicking around forms',
            '🛠️ Use browser dev tools (F12)',
            '⚙️ Password managers won\'t fill hidden forms'
        ],
        
        'how_to_identify': [
            'Right-click shows different menu',
            'Page source reveals hidden iFrames',
            'Login form doesn\'t match design',
            'iFrames with opacity:0 or position:absolute'
        ],
        
        'real_examples': [
            'Fake PayPal overlay on blogs',
            'Banking forms on news sites',
            'Gmail lookalike overlays'
        ],
        
        'prevention_techniques': [
            'Browser extensions detecting hidden iFrames',
            'Implement CSP headers',
            'Deploy script analysis tools',
            'Use password managers'
        ],
        
        'if_clicked': [
            '1. Check if credentials entered',
            '2. If yes: change immediately',
            '3. Clear all browser data',
            '4. Run malware scan',
            '5. Review browser extensions'
        ]
    },
    
    'OPEN_REDIRECT_PHISHING': {
        'severity': 'MEDIUM',
        'risk_score': 55,
        'warning': '⚠️ Multiple Redirects Detected',
        
        'technical_details': {
            'description': 'Abuses legitimate site redirects to hide final destination.',
            'why_dangerous': 'Exploits trust in legitimate domains.',
            'common_targets': 'Users of blogs, forums, compromised sites',
            'attack_vector': 'Redirect chain obfuscation.',
            'prevalence': '12-18% of campaigns'
        },
        
        'advice': [
            '🔍 Check final URL in address bar',
            '⚠️ Legitimate redirects stay within organization',
            '🚫 Be suspicious of different domains',
            '📧 Look for ?redirect=, ?url= parameters'
        ],
        
        'how_to_identify': [
            'Parameters: ?redirect=, ?url=, ?next=',
            'Multiple domain changes',
            'Final domain unrelated to initial'
        ],
        
        'real_examples': [
            'blog.com/?redirect=phishing-site.com',
            'forum.com/go/?url=malicious.com'
        ],
        
        'prevention_techniques': [
            'Implement strict redirect validation',
            'Use whitelist for destinations',
            'Deploy filters following chains',
            'Regular security testing'
        ],
        
        'if_clicked': [
            '1. Note final destination',
            '2. Close if suspicious',
            '3. Report redirect to site security',
            '4. Clear cookies from all domains'
        ]
    },
    
    'NEW_DOMAIN_PHISHING': {
        'severity': 'MEDIUM',
        'risk_score': 70,
        'warning': '⚠️ Recently Registered Domain',
        
        'technical_details': {
            'description': 'Domain registered very recently (< 6 months).',
            'why_dangerous': 'Indicates disposable infrastructure.',
            'common_targets': 'Time-sensitive scams, holiday phishing',
            'attack_vector': 'Rapid deployment and abandonment.',
            'prevalence': '70-80% of phishing uses new domains'
        },
        
        'advice': [
            '⚠️ New domains need extra verification',
            '📞 Verify through alternative methods',
            '🔍 Check for reviews and social presence',
            '💼 Look for established business info'
        ],
        
        'how_to_identify': [
            'Domain age tools show recent creation',
            'No web archive history',
            'Limited search results',
            'No social media presence'
        ],
        
        'real_examples': [
            'Domain registered yesterday for tax scams',
            'Holiday shopping scam sites',
            'Fake COVID relief domains'
        ],
        
        'prevention_techniques': [
            'Block domains under 30 days old',
            'Use reputation services with age weighting',
            'Train users about domain age',
            'Monitor similar registrations to your brand'
        ],
        
        'if_clicked': [
            '1. Verify through independent sources',
            '2. Check HTTPS and SSL',
            '3. Look for contact info',
            '4. If uncertain, avoid interaction'
        ]
    },
    
    'SOCIAL_ENGINEERING_PHISHING': {
        'severity': 'MEDIUM',
        'risk_score': 50,
        'warning': '⚠️ Page Manipulation Detected',
        
        'technical_details': {
            'description': 'Uses JavaScript tricks to manipulate behavior.',
            'why_dangerous': 'Psychological manipulation bypasses technical defenses.',
            'common_targets': 'All users, especially less tech-savvy',
            'attack_vector': 'UI/UX deception.',
            'prevalence': 'Very common in scam sites'
        },
        
        'advice': [
            'Use keyboard shortcuts (Ctrl+W)',
            'Be suspicious of countdown timers',
            'Never bypass browser warnings',
            'Trust your instincts'
        ],
        
        'how_to_identify': [
            'Right-click disabled',
            'Address bar hidden',
            'Fake security warnings',
            'Countdown timers',
            'Mouse trapping'
        ],
        
        'real_examples': [
            'Fake virus scans',
            'Countdown timer offers',
            'Pages that prevent leaving'
        ],
        
        'prevention_techniques': [
            'Use browser security extensions',
            'Disable JavaScript for unknown sites',
            'Train on social engineering tactics',
            'Use isolated browsing'
        ],
        
        'if_clicked': [
            '1. Force close browser',
            '2. Use Task Manager if unresponsive',
            '3. Clear browser data',
            '4. Report to security teams'
        ]
    },
    
    'GENERAL_PHISHING': {
        'severity': 'MEDIUM',
        'risk_score': 50,
        'warning': '⚠️ Phishing Characteristics Detected',
        
        'technical_details': {
            'description': 'Exhibits phishing characteristics but doesn\'t match specific patterns.',
            'why_dangerous': 'May be evolving attack methods.',
            'common_targets': 'General population',
            'attack_vector': 'Various techniques.',
            'prevalence': 'Common'
        },
        
        'advice': [
            'Exercise caution',
            'Verify through independent channels',
            'Check sender legitimacy',
            'Look for errors and poor design'
        ],
        
        'how_to_identify': [
            'ML model flags as suspicious',
            'Multiple minor characteristics',
            'Patterns similar to known phishing'
        ],
        
        'real_examples': [
            'Evolving phishing techniques',
            'Less common brand impersonations'
        ],
        
        'prevention_techniques': [
            'Layered security defenses',
            'Behavior-based detection',
            'Regular ML model updates',
            'Continuous training'
        ],
        
        'if_clicked': [
            '1. Assess page carefully',
            '2. Look for trust indicators',
            '3. Verify with known sources',
            '4. Report false positives'
        ]
    },
    
    'LEGITIMATE': {
        'severity': 'LOW',
        'risk_score': 0,
        'warning': '✅ Site Appears Safe',
        
        'technical_details': {
            'description': 'URL passes security checks with no phishing indicators.',
            'why_safe': 'Proper registration, established reputation, valid certificates.',
            'verification_method': 'Multi-factor analysis.'
        },
        
        'advice': [
            'This URL appears legitimate',
            'Continue to verify correct site',
            'Look for HTTPS and valid certificates',
            'Even legitimate sites can be compromised'
        ],
        
        'how_to_identify': [
            'Established domain (> 6 months)',
            'Valid SSL from trusted CA',
            'Consistent branding',
            'Clear contact information',
            'Positive reputation'
        ],
        
        'best_practices': [
            'Enable two-factor authentication',
            'Use password managers',
            'Keep software updated',
            'Review account activity regularly',
            'Use official apps'
        ]
    }
}


# ===============================
# RISK SCORING & CONTENT
# ===============================

def calculate_risk_score(features, attack_types):
    """Calculate risk score (0-100)"""
    base_score = 0
    
    for attack in attack_types:
        info = ENHANCED_PREVENTION.get(attack, ENHANCED_PREVENTION['GENERAL_PHISHING'])
        base_score = max(base_score, info.get('risk_score', 50))
    
    return int(base_score)


def generate_educational_content(attack_types, features):
    """Generate educational content"""
    primary_attack = attack_types[0] if attack_types else "GENERAL_PHISHING"
    info = ENHANCED_PREVENTION.get(primary_attack, ENHANCED_PREVENTION['GENERAL_PHISHING'])
    
    return {
        'threat_overview': {
            'attack_type': primary_attack.replace('_', ' ').title(),
            'description': info.get('technical_details', {}).get('description', ''),
            'severity': info.get('severity', 'MEDIUM')
        },
        'identification_tips': info.get('how_to_identify', []),
        'real_world_examples': info.get('real_examples', []),
        'prevention_steps': info.get('prevention_techniques', []),
        'incident_response': info.get('if_clicked', [])
    }


# ===============================
# MAIN ANALYSIS FUNCTION
# ===============================

# ===============================
# MAIN ANALYSIS FUNCTION (FIXED)
# ===============================

def analyze_phishing_attack(features, prediction, confidence, url=None):
    """
    Complete hybrid analysis with Shortener Persistence.
    🚀 FIXED: Intercepts and forces phishing for shorteners even if ML is tricked.
    """
    # 1. Feature mapping
    feature_dict = dict(zip(feature_names, features))
    
    # 🚀 STEP 1: HYBRID OVERRIDE
    # Check if the shortener bit is active (Flagged by original URL in app.py)
    is_shortener = feature_dict.get('TinyURL', 0) == 1

    if is_shortener:
        # If it was a shortener, we Categorize it as Phishing regardless of ML result
        prediction = 1
        attack_types = ['URL_SHORTENER_PHISHING']
        # We use the ML confidence from the expanded URL, but label it correctly
        final_confidence = confidence 
    else:
        # Standard logic: Use ML prediction to decide if we classify an attack
        attack_types = classify_attack_type(features, url) if prediction == 1 else ["LEGITIMATE"]
        final_confidence = confidence
    
    primary_attack = attack_types[0]
    info = ENHANCED_PREVENTION.get(primary_attack, ENHANCED_PREVENTION['GENERAL_PHISHING'])
    
    # 2. Calculate risk
    risk_score = calculate_risk_score(features, attack_types)
    
    # 3. Generate content
    educational_content = generate_educational_content(attack_types, features)
    
    # 4. Filter features for frontend
    detected_features = {k: bool(v) for k, v in feature_dict.items() if v == 1}

    return {
        "prediction": "phishing" if prediction == 1 else "legitimate",
        "confidence": final_confidence, # 🚀 Real variable score from expanded destination
        "attack_types": attack_types,
        "risk_score": risk_score,
        "prevention": {
            "severity": info.get('severity', 'MEDIUM'),
            "risk_score": risk_score,
            "warnings": [info.get('warning', '')],
            "advice": info.get('advice', []),
            "technical_details": info.get('technical_details', {}),
            "if_clicked": info.get('if_clicked', [])
        },
        "educational_content": educational_content,
        "timestamp": datetime.utcnow().isoformat(),
        "features": detected_features
    }