import os
import json
import urllib.request
import dotenv

# Load secrets securely from backend/.env instead of hardcoding
env_path = os.path.join(os.path.dirname(__file__), '.env')
env_vars = dotenv.dotenv_values(env_path) if os.path.exists(env_path) else {}

api_key = env_vars.get('GROUPS_API_KEY') or env_vars.get('CONTACTS_API_KEY') or os.getenv('GROUPS_API_KEY', '')
base = env_vars.get('GROUPS_API_URL') or os.getenv('GROUPS_API_URL', 'https://api.groupin.app/api/v1')
if not base.endswith('/api/v1'):
    base = f"{base.rstrip('/')}/api/v1"

# Get list of broadcast IDs first
req = urllib.request.Request(base + '/broadcasts', headers={'x-api-key': api_key})
with urllib.request.urlopen(req) as r:
    data = json.loads(r.read().decode())
    campaigns = data.get('data', {}).get('campaigns', [])
    print('Found %d broadcasts' % len(campaigns))
    for c in campaigns[:3]:
        print('  ID:', c['id'], '|', c['title'], '|', c['status'])

# Try getting customers from first broadcast
if campaigns:
    bid = campaigns[0]['id']
    print('\n=== GET /broadcast/%s/customers ===' % bid)
    req2 = urllib.request.Request(base + '/broadcast/' + bid + '/customers', headers={'x-api-key': api_key})
    try:
        with urllib.request.urlopen(req2, timeout=6) as r2:
            cdata = json.loads(r2.read().decode())
            print(json.dumps(cdata, indent=2)[:2000])
    except urllib.error.HTTPError as e:
        print('HTTP', e.code, e.read().decode()[:300])

# Also inspect the swagger spec for all response schemas
print('\n=== Fetching full OpenAPI spec response schemas ===')
req3 = urllib.request.Request('https://stag-saas-messagebot.tech-v2.groupin.app/docs/json', headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req3) as r3:
    spec = json.loads(r3.read().decode())
    # Find check-registered schema
    path_data = spec.get('paths', {}).get('/api/v1/contacts/check-registered', {})
    print('check-registered schema:')
    print(json.dumps(path_data, indent=2)[:3000])
