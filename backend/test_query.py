import requests

url='http://127.0.0.1:8000/query'
body={"question":"Is this a test?","doc_ids":[],"top_k":2}
resp=requests.post(url,json=body,timeout=60)
print(resp.status_code)
print(resp.text)
