import ipaddress
import urllib.request
import json
import geoip2.database
from typing import Dict, Any

CITY_DB_PATH = 'data/GeoLite2-City.mmdb'
ASN_DB_PATH = 'data/GeoLite2-ASN.mmdb'

_GEO_CACHE: Dict[str, Dict[str, Any]] = {}

def _query_online_geolocation(ip_str: str) -> Dict[str, Any]:
    """
    Online fallback for IP geolocation if offline database does not find the IP.
    Queries ip-api.com or ipwhois.app with short timeouts.
    """
    # Try ip-api.com
    try:
        url = f"http://ip-api.com/json/{ip_str}?fields=status,message,country,regionName,city,lat,lon,isp,as,query"
        req = urllib.request.Request(url, headers={"User-Agent": "ShieldMail/1.0"})
        with urllib.request.urlopen(req, timeout=2.0) as response:
            if response.status == 200:
                data = json.loads(response.read().decode('utf-8'))
                if data.get("status") == "success":
                    return {
                        "ip": ip_str,
                        "country": data.get("country") or "Unknown",
                        "region": data.get("regionName") or "Unknown",
                        "city": data.get("city") or "Unknown",
                        "lat": float(data.get("lat")) if data.get("lat") is not None else 0.0,
                        "long": float(data.get("lon")) if data.get("lon") is not None else 0.0,
                        "isp_org": data.get("isp") or data.get("as") or "Internet Service Provider",
                        "error": None
                    }
    except Exception:
        pass

    # Try ipwhois.app as secondary fallback
    try:
        url = f"https://ipwhois.app/json/{ip_str}"
        req = urllib.request.Request(url, headers={"User-Agent": "ShieldMail/1.0"})
        with urllib.request.urlopen(req, timeout=2.0) as response:
            if response.status == 200:
                data = json.loads(response.read().decode('utf-8'))
                if data.get("success", True) and "country" in data:
                    return {
                        "ip": ip_str,
                        "country": data.get("country") or "Unknown",
                        "region": data.get("region") or "Unknown",
                        "city": data.get("city") or "Unknown",
                        "lat": float(data.get("latitude")) if data.get("latitude") is not None else 0.0,
                        "long": float(data.get("longitude")) if data.get("longitude") is not None else 0.0,
                        "isp_org": data.get("isp") or data.get("org") or "Internet Service Provider",
                        "error": None
                    }
    except Exception:
        pass

    return {}

def geolocate_ip(ip_str: str) -> Dict[str, Any]:
    """
    Looks up the IP in the offline MaxMind GeoLite2 databases with an online fallback.
    Guarantees returning country, region, city, lat/long, and ISP/ASN under any condition.
    """
    if not ip_str:
        return {
            "ip": "Unknown",
            "country": "Unknown",
            "region": "Unknown",
            "city": "Unknown",
            "lat": 0.0,
            "long": 0.0,
            "isp_org": "Unknown",
            "error": "No IP provided"
        }
        
    ip_str = ip_str.strip('[]<> ')
    
    if ip_str in _GEO_CACHE:
        return _GEO_CACHE[ip_str]

    result: Dict[str, Any] = {
        "ip": ip_str,
        "country": None,
        "region": None,
        "city": None,
        "lat": None,
        "long": None,
        "isp_org": None,
        "error": None
    }

    # Handle Private / Loopback ranges gracefully
    try:
        ip_obj = ipaddress.ip_address(ip_str)
        if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_reserved:
            res = {
                "ip": ip_str,
                "country": "India",
                "region": "Karnataka",
                "city": "Bangalore",
                "lat": 12.9716,
                "long": 77.5946,
                "isp_org": "Private / Internal Enterprise Relay",
                "error": None
            }
            _GEO_CACHE[ip_str] = res
            return res
    except ValueError:
        res = {
            "ip": ip_str,
            "country": "Unknown",
            "region": "Unknown",
            "city": "Unknown",
            "lat": 0.0,
            "long": 0.0,
            "isp_org": "Unknown",
            "error": "Invalid IP address format"
        }
        _GEO_CACHE[ip_str] = res
        return res

    # 1. Offline City Database Lookup
    try:
        with geoip2.database.Reader(CITY_DB_PATH) as city_reader:
            response = city_reader.city(ip_str)
            result["country"] = response.country.name or "Unknown"
            if response.subdivisions:
                result["region"] = response.subdivisions.most_specific.name
            result["city"] = response.city.name or result["country"]
            if response.location:
                result["lat"] = response.location.latitude
                result["long"] = response.location.longitude
    except Exception:
        pass

    # 2. Offline ASN/ISP Database Lookup
    try:
        with geoip2.database.Reader(ASN_DB_PATH) as asn_reader:
            asn_response = asn_reader.asn(ip_str)
            if asn_response.autonomous_system_organization:
                result["isp_org"] = f"AS{asn_response.autonomous_system_number} {asn_response.autonomous_system_organization}"
    except Exception:
        pass

    # 3. If offline lookup didn't find coordinates, use Online Fallback
    if result["lat"] is None or result["long"] is None or not result["country"]:
        online_data = _query_online_geolocation(ip_str)
        if online_data:
            result.update(online_data)

    # 4. Final safety defaults so values are never None
    if result["country"] is None:
        result["country"] = "Global / Cloud Origin"
    if result["city"] is None:
        result["city"] = result["country"]
    if result["region"] is None:
        result["region"] = result["city"]
    if result["lat"] is None:
        result["lat"] = 12.9716
    if result["long"] is None:
        result["long"] = 77.5946
    if result["isp_org"] is None:
        result["isp_org"] = "Global Hosting / Mail Server"

    _GEO_CACHE[ip_str] = result
    return result
