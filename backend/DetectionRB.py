# RuleBasedDetection.py
"""
Rule-Based Phishing Detection System
Catches patterns that ML features might miss
Priority: Rules execute BEFORE feature-based classification
"""

import re
from urllib.parse import urlparse

# ============================================================
# URL SHORTENER DETECTION
# ============================================================

URL_SHORTENER_DOMAINS = {
    'bit.ly', 'tinyurl.com', 'goo.gl', 'ow.ly', 't.co', 'buff.ly',
    'adf.ly', 'is.gd', 'bitly.com', 'tiny.cc', 'cli.gs', 'pic.gd',
    'short.to', 'url.ie', 'v.gd', 'tr.im', 'soo.gd', 'tiny.pl',
    's2r.co', 'clicky.me', 'budurl.com', 'bc.vc', 'git.io', 'cutt.ly',
    'rebrandly.com', 'short.io', 'bl.ink', 'lnkd.in', 'smarturl.it',
    'bit.do', 'cur.lv', 'ity.im', 'q.gs', 'po.st', 'twitthis.com',
    'u.to', 'j.mp', 'buzurl.com', 'cutt.us', 'u.bb', 'yourls.org',
    'x.co', 'prettylinkpro.com', 'scrnch.me', 'filoops.info',
    'vzturl.com', 'qr.net', '1url.com', 'tweez.me', 'link.zip',
    'shorte.st', 'go2l.ink', 'wp.me', 'amzn.to'
}

def is_url_shortener(url):
    """Check if URL uses a known URL shortening service"""
    try:
        parsed = urlparse(url.lower())
        domain = parsed.netloc.replace('www.', '')
        domain = domain.split(':')[0]  # Remove port
        
        return domain in URL_SHORTENER_DOMAINS
    except:
        return False


# ============================================================
# IP ADDRESS DETECTION
# ============================================================

def is_ip_based_url(url):
    """Check if URL uses IP address instead of domain name"""
    try:
        parsed = urlparse(url)
        host = parsed.netloc.split(':')[0]  # Remove port
        
        # IPv4 pattern
        ipv4_pattern = r'^(\d{1,3}\.){3}\d{1,3}$'
        if re.match(ipv4_pattern, host):
            return True
        
        # IPv6 pattern (basic check)
        if ':' in host and '[' in host:
            return True
            
        return False
    except:
        return False


# ============================================================
# TYPOSQUATTING / BRAND IMPERSONATION DETECTION
# ============================================================

BRAND_PATTERNS = {
    'paypal': ['paypa1', 'paypai', 'paypa1l', 'paypall', 'paypa-', 'pay-pal', 'paypa11'],
    'microsoft': ['micros0ft', 'microsft', 'micr0soft', 'microsoft-', 'micr0s0ft'],
    'google': ['g00gle', 'googel', 'gooogle', 'google-', 'goog1e', 'g00g1e'],
    'facebook': ['faceb00k', 'facebok', 'face-book', 'facebook-', 'faceb0ok'],
    'amazon': ['amaz0n', 'amazom', 'arnazon', 'amazon-', 'arnazon'],
    'apple': ['app1e', 'appl3', 'apple-', 'app-le', 'аpple'],
    'netflix': ['netfl1x', 'netflex', 'netflix-', 'netf1ix'],
    'instagram': ['instaqram', 'insta-gram', 'instagram-', 'instagrarn'],
    'twitter': ['twltter', 'twitter-', 'twiter', 'tw1tter'],
    'linkedin': ['linkedln', 'linkedin-', 'link3din', 'linkedm'],
    'chase': ['chas3', 'chase-', 'chasebank-', 'chas€'],
    'wellsfargo': ['wells-fargo', 'wellsfarg0', 'wel1sfargo'],
    'bankofamerica': ['bank-of-america', 'bankofamerica-', 'bankofam3rica'],
    'citibank': ['citi-bank', 'citibank-', 'c1tibank'],
    'dropbox': ['dr0pbox', 'dropbox-', 'dr0pb0x'],
    'adobe': ['ad0be', 'adobe-', 'ad0b3'],
    'yahoo': ['yah00', 'yahoo-', 'yah0o'],
    'ebay': ['ebay-', '3bay', 'ebay1']
}

def detect_typosquatting(url):
    """Detect typosquatting attempts on major brands"""
    try:
        parsed = urlparse(url.lower())
        domain = parsed.netloc.replace('www.', '')
        domain = domain.split(':')[0].split('.')[0]
        
        for brand, variations in BRAND_PATTERNS.items():
            for variant in variations:
                if variant in domain:
                    return True, brand
            
            if brand in domain:
                if domain != brand and any(x in domain for x in ['-', 'secure', 'login', 'verify', 'account', 'update']):
                    return True, brand
        
        return False, None
    except:
        return False, None


# ============================================================
# FAKE SECURITY INDICATOR DETECTION
# ============================================================

SECURITY_KEYWORDS = ['https', 'ssl', 'secure', 'verify', 'login', 'account', 'update', 'confirm']

def has_fake_security_indicator(url):
    """Check if domain contains security keywords"""
    try:
        parsed = urlparse(url.lower())
        domain = parsed.netloc.replace('www.', '')
        domain = domain.split(':')[0]
        
        domain_parts = domain.replace('.', '-').split('-')
        
        for keyword in SECURITY_KEYWORDS:
            if keyword in domain_parts:
                return True, keyword
                
        return False, None
    except:
        return False, None


# ============================================================
# SUSPICIOUS TLD DETECTION
# ============================================================

SUSPICIOUS_TLDS = [
    '.tk', '.ml', '.ga', '.cf', '.gq',
    '.xyz', '.top', '.work', '.click',
    '.loan', '.zip', '.review'
]

def has_suspicious_tld(url):
    """Check if URL uses commonly abused TLD"""
    try:
        parsed = urlparse(url.lower())
        domain = parsed.netloc
        
        for tld in SUSPICIOUS_TLDS:
            if domain.endswith(tld):
                return True, tld
                
        return False, None
    except:
        return False, None


# ============================================================
# SUBDOMAIN DEPTH ANALYSIS
# ============================================================

def has_excessive_subdomains(url, threshold=3):
    """Check if URL has too many subdomains"""
    try:
        parsed = urlparse(url.lower())
        domain = parsed.netloc.split(':')[0]
        
        subdomain_count = domain.count('.')
        
        if subdomain_count >= threshold:
            return True, subdomain_count
            
        return False, 0
    except:
        return False, 0


# ============================================================
# MAIN RULE-BASED CLASSIFIER
# ============================================================

def classify_by_rules(url):
    """
    Apply rule-based classification to URL
    Returns: (attack_type, confidence, details) or (None, 0, None)
    
    Priority Order:
    1. IP-based URLs
    2. URL Shorteners
    3. Typosquatting/Brand Impersonation
    4. Fake Security Indicators
    5. Suspicious characteristics
    """
    
    # Rule 1: IP Address Detection
    if is_ip_based_url(url):
        return 'IP_BASED_PHISHING', 95, {'reason': 'IP address in URL'}
    
    # Rule 2: URL Shortener Detection
    if is_url_shortener(url):
        return 'URL_SHORTENER_PHISHING', 90, {'reason': 'Known URL shortening service'}
    
    # Rule 3: Typosquatting Detection
    is_typo, brand = detect_typosquatting(url)
    if is_typo:
        return 'TYPOSQUATTING_HOMOGRAPH', 95, {'reason': f'Typosquatting on: {brand}'}
    
    # Rule 4: Fake Security Indicator
    has_fake_sec, keyword = has_fake_security_indicator(url)
    if has_fake_sec:
        return 'FAKE_SECURITY_INDICATOR', 75, {'reason': f'Security keyword: {keyword}'}
    
    # Rule 5: Suspicious TLD
    has_sus_tld, tld = has_suspicious_tld(url)
    if has_sus_tld:
        return 'GENERAL_PHISHING', 60, {'reason': f'Suspicious TLD: {tld}'}
    
    # Rule 6: Excessive Subdomains
    has_subdomains, count = has_excessive_subdomains(url)
    if has_subdomains:
        return 'GENERAL_PHISHING', 55, {'reason': f'Excessive subdomains: {count}'}
    
    # No rules matched
    return None, 0, None


# ============================================================
# TESTING FUNCTION
# ============================================================

def test_rules():
    """Test the rule-based detection system"""
    test_urls = [
        'http://192.168.1.1/login',
        'https://bit.ly/abc123',
        'https://paypa1.com',
        'https://secure-paypal-login.com',
        'https://microsoft-update.tk',
        'https://login.verify.account.example.com',
        'https://google.com'
    ]
    
    print("=" * 70)
    print("RULE-BASED DETECTION TEST")
    print("=" * 70)
    
    for url in test_urls:
        attack_type, confidence, details = classify_by_rules(url)
        
        print(f"\nURL: {url}")
        if attack_type:
            print(f"  ✓ DETECTED: {attack_type}")
            print(f"  Confidence: {confidence}%")
            print(f"  Reason: {details.get('reason', 'N/A')}")
        else:
            print(f"  ✗ No rules matched")
        print("-" * 70)


if __name__ == "__main__":
    test_rules()