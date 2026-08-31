import json
from app.parsers.geolocation import geolocate_ip

def test_geo():
    test_ips = [
        "8.8.8.8",         # Google Public DNS (known public IP)
        "89.123.45.67",    # Arbitrary European IP
        "192.168.1.100",   # Private IP
        "invalid_ip"       # Error handling
    ]
    
    for ip in test_ips:
        print(f"Testing IP: {ip}")
        print(json.dumps(geolocate_ip(ip), indent=2))
        print("-" * 40)

if __name__ == "__main__":
    test_geo()
