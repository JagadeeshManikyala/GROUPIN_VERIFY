import urllib.request, json

for num in ['9876543210', '8012345678', '7000000001', '9000000001', '8888888888', '7777777777']:
    req = urllib.request.Request(
        'http://127.0.0.1:8000/api/groupin/check',
        headers={'Content-Type': 'application/json'},
        data=json.dumps({'mobile_number': num}).encode('utf-8')
    )
    try:
        with urllib.request.urlopen(req) as r:
            data = json.loads(r.read().decode())
            ex = data.get('account_exists')
            name = data.get('name')
            email = data.get('email')
            dob = data.get('dob')
            loc = data.get('location')
            print(f"{num}: exists={ex}, name={name}, email={email}, dob={dob}, location={loc}")
    except urllib.error.HTTPError as e:
        print(f"{num}: HTTP {e.code}", e.read().decode()[:100])
