"""플랫폼 공지 자동 수집기.

'대상 사이트' 중 서버 HTML에 목록이 그대로 들어있는(=requests로 긁을 수 있는)
"웹 자동" 표시 사이트들만 수집한다. JS가 비동기로 채우거나 로그인/캡차가 있는
"PC Chrome" 표시 사이트는 이 스크립트로 자동화하지 않는다 — 수동 확인 대상.

새로 발견된 공지는 topic="기타 안내"(미분류), check=""(빈 값)으로 들어간다.
주제 분류·영업 체크 메모는 사람이 주기적으로 검토해서 채운다.

Usage: python3 tools/collector.py <password> [data.enc.json 경로]
환경변수 PN_PASSWORD 로 비밀번호를 줘도 된다(그 경우 인자 생략 가능).

기존 notices와의 중복 판정은 (platform, url) 또는 (platform, title, date) 키로 한다.
"""
import base64
import json
import os
import re
import sys
import time
from datetime import datetime, timedelta, timezone

import requests
from bs4 import BeautifulSoup
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

KST = timezone(timedelta(hours=9))
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36"
HEADERS = {"User-Agent": UA}
TIMEOUT = 25
RETRIES = 3
ITER = 310000


def now_kst():
    return datetime.now(KST)


def log(msg):
    print(f"[collector] {msg}", flush=True)


def req(method, url, **kwargs):
    last_exc = None
    for attempt in range(RETRIES):
        try:
            r = requests.request(method, url, headers=HEADERS, timeout=TIMEOUT, **kwargs)
            r.raise_for_status()
            return r
        except Exception as e:
            last_exc = e
            if attempt < RETRIES - 1:
                time.sleep(4 * (attempt + 1))
    raise last_exc


# ---------- 암복호화 (build_data.py / decrypt_json.py 와 동일 포맷) ----------

def decrypt(pw, path):
    e = json.load(open(path, encoding="utf-8"))
    d = lambda x: base64.b64decode(x)
    key = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=d(e["salt"]), iterations=e["iter"]).derive(pw.encode("utf-8"))
    plain = AESGCM(key).decrypt(d(e["iv"]), d(e["ct"]), None)
    return json.loads(plain)


def encrypt(pw, obj, path):
    plain = json.dumps(obj, ensure_ascii=False).encode("utf-8")
    salt, iv = os.urandom(16), os.urandom(12)
    key = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=ITER).derive(pw.encode("utf-8"))
    ct = AESGCM(key).encrypt(iv, plain, None)
    b64 = lambda b: base64.b64encode(b).decode("ascii")
    json.dump({"v": 1, "iter": ITER, "salt": b64(salt), "iv": b64(iv), "ct": b64(ct)}, open(path, "w"))


# ---------- 출처별 수집 함수 ----------
# 각 함수는 [{title, date(YYYY-MM-DD), url}, ...] 를 반환한다.

def fetch_skbb():
    url = "https://www.bworld.co.kr/customer/notice/list.do?menu_id=C05010000"
    r = req("GET", url)
    soup = BeautifulSoup(r.text, "html.parser")
    out = []
    for tr in soup.select("table tbody tr"):
        tds = tr.select("td")
        if len(tds) < 5:
            continue
        title = tds[2].get_text(" ", strip=True)
        if not title:
            continue
        date = tds[4].get_text(strip=True).replace(".", "-")
        a = tr.select_one("a")
        onclick = (a.get("onclick") or "") if a else ""
        m = re.search(r"fn_go_to_view\('([^']+)',\s*'(\d+)'\)", onclick)
        if m:
            link = f"https://www.bworld.co.kr/customer/notice/view.do?menu_id={m.group(1)}&nt_keynum={m.group(2)}"
        else:
            link = url
        if re.match(r"^20\d{2}-\d{2}-\d{2}$", date):
            out.append({"title": title, "date": date, "url": link})
    return out


def fetch_cmb():
    url = "https://www.cmb.co.kr/Notice/?category=c4Bu17meD1"
    r = req("GET", url)
    soup = BeautifulSoup(r.text, "html.parser")
    out = []
    today = now_kst().date()
    for ul in soup.select("ul.li_body"):
        a = ul.select_one("a[href*='bmode=view']")
        if not a:
            continue
        title = a.get_text(" ", strip=True)
        if not title:
            continue
        m = re.search(r"idx=(\d+)", a.get("href") or "")
        if not m:
            continue
        idx = m.group(1)
        link = f"https://www.cmb.co.kr/Notice/?bmode=view&idx={idx}&t=board&category=c4Bu17meD1"
        text = ul.get_text(" ", strip=True)
        dm = re.search(r"(20\d{2}-\d{2}-\d{2})", text)
        if dm:
            date = dm.group(1)
        else:
            rel = re.search(r"(오늘|어제|(\d+)\s*일\s*전)", text)
            if not rel:
                continue
            if rel.group(1) == "오늘":
                d = today
            elif rel.group(1) == "어제":
                d = today - timedelta(days=1)
            else:
                d = today - timedelta(days=int(rel.group(2)))
            date = d.strftime("%Y-%m-%d")
        out.append({"title": title, "date": date, "url": link})
    return out


def fetch_dlive():
    """딜라이브 — 상세 링크가 JS(onViewPage)로만 열려서 개별 URL이 없다.
    목록 페이지 링크로 대신 연결한다."""
    url = "https://www.dlive.kr/front/company/publicity/PubNewsAction.do?method=list&searchFlag=A"
    r = req("GET", url)
    soup = BeautifulSoup(r.text, "html.parser")
    out = []
    for tr in soup.select("table tbody tr"):
        tds = tr.select("td")
        if len(tds) < 5:
            continue
        title = tds[2].get_text(" ", strip=True)
        date = tds[4].get_text(strip=True)
        if title and re.match(r"^20\d{2}-\d{2}-\d{2}$", date):
            out.append({"title": title, "date": date, "url": url})
    return out


def fetch_kmcc():
    url = "https://www.kmcc.go.kr/user.do?boardId=1112&page=A05020000&dc=K05020000"
    r = req("GET", url)
    soup = BeautifulSoup(r.text, "html.parser")
    out = []
    table = soup.select_one("table")
    rows = table.select("tbody tr") if table else []
    for tr in rows:
        tds = tr.select("td")
        if len(tds) < 6:
            continue
        a = tds[1].select_one("a")
        if not a:
            continue
        title = a.get_text(" ", strip=True)
        if not title:
            continue
        href = a.get("href") or ""
        link = requests.compat.urljoin(url, href) if href and not href.startswith("javascript") else url
        date = ""
        m = re.search(r"(20\d{2}-\d{2}-\d{2}|20\d{2}\.\d{2}\.\d{2})", tds[5].get_text())
        if m:
            date = m.group(1).replace(".", "-")
        if date:
            out.append({"title": title, "date": date, "url": link})
    return out


# (platform, group) 은 sites 배열의 표기와 정확히 일치해야 한다.
SOURCES = {
    "skbb": ("SK브로드밴드", "IPTV", fetch_skbb),
    "cmb": ("CMB", "MSO", fetch_cmb),
    "dlive": ("딜라이브", "MSO", fetch_dlive),
    "kmcc": ("방미통위(KMCC)", "정부", fetch_kmcc),
}


def notice_key(n):
    if n.get("url") and not n["url"].endswith(("list.do", "searchFlag=A")):
        return ("url", n["platform"] + "|" + n["url"])
    return ("tpd", n["platform"] + "|" + n["title"] + "|" + n["date"])


def main():
    pw = os.environ.get("PN_PASSWORD") or (sys.argv[1] if len(sys.argv) > 1 else None)
    if not pw:
        log("비밀번호가 없습니다 (PN_PASSWORD 환경변수 또는 첫 번째 인자)")
        sys.exit(1)
    data_path = sys.argv[2] if len(sys.argv) > 2 else "data.enc.json"

    data = decrypt(pw, data_path)
    existing_keys = {notice_key(n) for n in data["notices"]}

    added_total = 0
    new_items = []
    any_ok = False
    for key, (platform, group, fn) in SOURCES.items():
        try:
            fresh = fn()
            added = 0
            for it in fresh:
                cand = {
                    "id": f"{key}-{it['date']}-{abs(hash(it['title'])) % 100000}",
                    "topic": "기타 안내",
                    "platform": platform,
                    "group": group,
                    "date": it["date"],
                    "title": it["title"],
                    "summary": "",
                    "check": "",
                    "url": it["url"],
                }
                k = notice_key(cand)
                if k in existing_keys:
                    continue
                existing_keys.add(k)
                new_items.append(cand)
                added += 1
            log(f"{platform}: 수집 {len(fresh)}건 (신규 {added}건)")
            added_total += added
            any_ok = True
        except Exception as e:
            log(f"{platform}: 수집 실패 — {type(e).__name__}: {e}")

    if not any_ok:
        log("경고: 모든 출처 수집 실패 — data.enc.json 변경 없음")
        sys.exit(1)

    if added_total == 0:
        log("신규 공지 없음 — data.enc.json 변경 없음")
        return

    new_items.sort(key=lambda x: x["date"], reverse=True)
    data["notices"] = new_items + data["notices"]
    data["updated"] = now_kst().strftime("%Y-%m-%d %H:%M")
    encrypt(pw, data, data_path)
    log(f"신규 공지 {added_total}건 반영, data.enc.json 갱신 완료")


if __name__ == "__main__":
    main()
