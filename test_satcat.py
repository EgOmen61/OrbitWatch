import requests
session = requests.Session()
login_data = {
    'identity': 'etebabapiros@gmail.com',
    'password': 'ETE-babapiros2026'
}
session.post('https://www.space-track.org/ajaxauth/login', data=login_data, timeout=15)
# fetch active status
url = "https://www.space-track.org/basicspacedata/query/class/satcat/CURRENT/Y/OPERATIONAL_STATUS_CODE/%2B/orderby/NORAD_CAT_ID/format/json"
print("Fetching satcat...")
resp = session.get(url, timeout=15)
if resp.status_code == 200:
    data = resp.json()
    print(f"Total operational: {len(data)}")
else:
    print("Failed: ", resp.status_code)
