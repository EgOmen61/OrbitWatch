import requests
import json

session = requests.Session()
login_data = {
    'identity': 'etebabapiros@gmail.com',
    'password': 'ETE-babapiros2026'
}
session.post('https://www.space-track.org/ajaxauth/login', data=login_data, timeout=15)
# fetch active status
url = "https://www.space-track.org/basicspacedata/query/class/satcat/limit/10/format/json"
print("Fetching satcat limited...")
resp = session.get(url, timeout=15)
if resp.status_code == 200:
    data = resp.json()
    print("Keys:", data[0].keys())
    print("Example:", data[0].get('OBJECT_NAME'), "Status:", data[0].get('OPERATIONAL_STATUS_CODE'), "Decay:", data[0].get('DECAY_DATE'))
else:
    print("Failed: ", resp.status_code, resp.text)
