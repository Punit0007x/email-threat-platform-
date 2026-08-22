import re
from typing import Dict, Any, Optional

CLOUD_PROVIDERS = [
    r"\bamazon\b", r"\baws\b", r"\bazure\b", r"\bmicrosoft corporation\b",
    r"\bgoogle cloud\b", r"\bdigitalocean\b", r"\blinode\b", r"\bakamai\b",
    r"\bhetzner\b", r"\bovh\b", r"\bvultr\b", r"\bcontabo\b", r"\bchoopa\b",
    r"\bhostinger\b", r"\brackspace\b", r"\balibaba\b", r"\btencent\b",
    r"\boracle cloud\b", r"\bleaseweb\b", r"\bscaleway\b"
]

VPN_PROXY_PROVIDERS = [
    r"\bm247\b", r"\bdatacamp\b", r"\bproton\b", r"\bnord\b", r"\bexpressvpn\b",
    r"\bmullvad\b", r"\bprivate internet access\b", r"\btunngle\b", r"\bwindscribe\b",
    r"\bipvanish\b", r"\bcyberghost\b", r"\btor exit\b", r"\bzenmate\b"
]

def analyze_infrastructure(ip: Optional[str], isp_org: Optional[str], revdns: Optional[str] = None) -> Dict[str, Any]:
    """
    Categorizes the origin IP and mail relay infrastructure into operational tiers:
    - Cloud / Data Center VPS (Common in automated phishing campaigns)
    - Commercial VPN / Anonymizer Proxy
    - Corporate / Enterprise Mail Gateway
    - Residential / Consumer ISP
    """
    target_str = f"{isp_org or ''} {revdns or ''}".lower()
    
    infra_type = "Residential / Commercial ISP"
    is_cloud = False
    is_vpn_proxy = False
    risk_level = "Low"
    details = "Standard commercial or residential internet service provider."

    if not ip or not isp_org:
        return {
            "infra_type": "Unknown",
            "is_cloud": False,
            "is_vpn_proxy": False,
            "risk_level": "Low",
            "details": "Insufficient ISP/ASN metadata for infrastructure classification."
        }

    # 1. Check VPN / Proxy
    for pat in VPN_PROXY_PROVIDERS:
        if re.search(pat, target_str):
            is_vpn_proxy = True
            infra_type = "VPN / Anonymizer Proxy"
            risk_level = "High"
            details = f"IP associated with anonymizing proxy/VPN network ({isp_org})."
            break

    # 2. Check Cloud VPS (if not already VPN)
    if not is_vpn_proxy:
        for pat in CLOUD_PROVIDERS:
            if re.search(pat, target_str):
                is_cloud = True
                infra_type = "Cloud / Hosting Provider"
                risk_level = "Medium"
                details = f"Originates from commercial cloud infrastructure ({isp_org}). Mail direct-sent from cloud VPS often indicates disposable attack servers."
                break

    return {
        "infra_type": infra_type,
        "is_cloud": is_cloud,
        "is_vpn_proxy": is_vpn_proxy,
        "risk_level": risk_level,
        "details": details
    }
