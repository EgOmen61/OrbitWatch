import requests
import json

session = requests.Session()
login_data = {
    'identity': 'etebabapiros@gmail.com',
    'password': 'ETE-babapiros2026'
}
session.post('https://www.space-track.org/ajaxauth/login', data=login_data, timeout=15)

url = "https://www.space-track.org/basicspacedata/query/class/satcat/CURRENT/Y/OBJECT_TYPE/PAYLOAD/format/json"
print("Fetching satcat payloads...")
resp = session.get(url, timeout=30)
if resp.status_code == 200:
    data = resp.json()
    print("Total:", len(data))
    
    op_codes = {}
    for d in data:
        code = d.get('OPERATIONAL_STATUS_CODE')
        op_codes[code] = op_codes.get(code, 0) + 1
    print("Status codes:", op_codes)
else:
    print("Failed: ", resp.status_code, resp.text)
