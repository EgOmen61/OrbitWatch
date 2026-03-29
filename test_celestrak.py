import requests

url = "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json"
print("Fetching from Celestrak...")
resp = requests.get(url, timeout=10)
if resp.status_code == 200:
    data = resp.json()
    print(f"Total: {len(data)}")
    print("First item keys: ", data[0].keys())
    print("Example name: ", data[0].get('OBJECT_NAME'))
else:
    print("Failed: ", resp.status_code)
