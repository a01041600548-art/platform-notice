"""Encrypt the monitoring data for the public GitHub Pages site.

Usage: python3 build_data.py <password> <notices.json> <monthly.json> <sites.json> <news.json> <out data.enc.json>
AES-256-GCM, key from PBKDF2-HMAC-SHA256 (310,000 iterations, random 16-byte salt), random 12-byte IV.
The page (index.html) decrypts the same format with WebCrypto.
"""
import base64, json, os, sys, datetime
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

ITER = 310000

def main():
    pw, fn, fm, fs, fnews, out = sys.argv[1:7]
    load = lambda p: json.load(open(p, encoding='utf-8'))
    bundle = {
        'updated': datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))).strftime('%Y-%m-%d %H:%M'),
        'notices': load(fn), 'monthly': load(fm), 'sites': load(fs), 'news': load(fnews),
    }
    plain = json.dumps(bundle, ensure_ascii=False).encode('utf-8')
    salt, iv = os.urandom(16), os.urandom(12)
    key = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=ITER).derive(pw.encode('utf-8'))
    ct = AESGCM(key).encrypt(iv, plain, None)
    b64 = lambda b: base64.b64encode(b).decode('ascii')
    json.dump({'v': 1, 'iter': ITER, 'salt': b64(salt), 'iv': b64(iv), 'ct': b64(ct)}, open(out, 'w'))
    print('ok', len(plain), 'bytes ->', out)

if __name__ == '__main__':
    main()
