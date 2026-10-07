import urllib.request, json

for num in ['7659955053', '8012345678', '9876543210']:
    req = urllib.request.Request(
        'http://127.0.0.1:8000/api/groupin/check',
        headers={'Content-Type': 'application/json'},
        data=json.dumps({'mobile_number': num}).encode('utf-8')
    )
    with urllib.request.urlopen(req) as r:
        data = json.loads(r.read().decode())
        print(f"\n--- {num} ---")
        print(f"  exists   : {data['account_exists']}")
        print(f"  name     : {data['name']}")
        print(f"  email    : {data['email']}")
        print(f"  dob      : {data['dob']}")
        print(f"  location : {data['location']}")
        print(f"  about    : {data['about']}")
        print(f"  verified : {data['verified']}")
