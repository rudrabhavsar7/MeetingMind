import httpx

for url in ["http://127.0.0.1:8000/api/v1/auth/bootstrap-status", "http://localhost:8000/api/v1/auth/bootstrap-status"]:
    try:
        r = httpx.get(url)
        print(f"URL: {url} -> Status: {r.status_code}, JSON: {r.json()}")
    except Exception as e:
        print(f"URL: {url} -> Error: {e}")
