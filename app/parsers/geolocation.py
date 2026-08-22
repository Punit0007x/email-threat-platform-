import ipaddress
import geoip2.database
from typing import Dict, Any

CITY_DB_PATH = 'data/GeoLite2-City.mmdb'
ASN_DB_PATH = 'data/GeoLite2-ASN.mmdb'

def geolocate_ip(ip_str: str) -> Dict[str, Any]:
    """
    Looks up the IP in the offline MaxMind GeoLite2 databases.
    Returns country, region, city, lat/long, and ISP/ASN if available.
    """
    result = {
        "ip": ip_str,
        "country": None,
        "region": None,
        "city": None,
        "lat": None,
        "long": None,
        "isp_org": None,
        "error": None
    }
    
    if not ip_str:
        result["error"] = "No IP provided"
        return result
        
    try:
        ip_obj = ipaddress.ip_address(ip_str)
        if ip_obj.is_private:
            result["error"] = "Private range \u2014 cannot geolocate"
            return result
    except ValueError:
        result["error"] = "Invalid IP address format"
        return result
        
    # 1. City Database Lookup
    try:
        with geoip2.database.Reader(CITY_DB_PATH) as city_reader:
            response = city_reader.city(ip_str)
            
            result["country"] = response.country.name
            if response.subdivisions:
                result["region"] = response.subdivisions.most_specific.name
            result["city"] = response.city.name
            if response.location:
                result["lat"] = response.location.latitude
                result["long"] = response.location.longitude
                
    except FileNotFoundError:
        result["error"] = "City DB not found. Run setup to download GeoLite2."
        return result
    except geoip2.errors.AddressNotFoundError:
        result["error"] = "IP address not found in City database"
        return result
    except Exception as e:
        result["error"] = f"City Geolocation failed: {str(e)}"
        return result
        
    # 2. ASN/ISP Database Lookup
    try:
        with geoip2.database.Reader(ASN_DB_PATH) as asn_reader:
            asn_response = asn_reader.asn(ip_str)
            # Combine ASN number and Organization Name
            if asn_response.autonomous_system_organization:
                result["isp_org"] = f"AS{asn_response.autonomous_system_number} {asn_response.autonomous_system_organization}"
    except FileNotFoundError:
        # Don't fail the whole request if ASN DB is missing, just skip ISP
        pass
    except geoip2.errors.AddressNotFoundError:
        pass
    except Exception as e:
        pass # Ignore ASN lookup errors silently to prefer returning City data
        
    return result
