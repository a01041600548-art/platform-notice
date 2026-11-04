"""방미통위·주요 언론사 공식일정 캘린더 생성기.

두 가지 출처를 합쳐 calendar.enc.json을 (매번 새로) 만든다.

1) 방미통위(KMCC) 위원회 의사일정 게시판 — 자동 수집
   https://www.kmcc.go.kr (boardId=1003, page=A02010100)
   제목이 "YYYY년 제N차 방송미디어통신위원회 (서면)회의(MMDD) 의사일정"
   형식으로 고정되어 있어, 제목 속 (MMDD)를 실제 회의일로 파싱한다.
   (작성일=의사일정 게시일이라 회의일보다 며칠 빠르다. 작성일 기준 연도를
   쓰되, 12월에 올라온 다음해 1월 회의처럼 월이 역전되면 +1년 보정한다.)

2) 주요 언론사 이사회·주요결정 일정 — 수동 보완
   tools/calendar_manual.json 에 사람이 뉴스검색/공식 홈페이지를 참고해
   직접 채워 넣는다. 공시(DART)나 보도자료로 확인되는 대로 주기적으로
   갱신해야 하는 항목이라 자동 수집하지 않는다.

Usage: python3 tools/build_calendar.py <password> [calendar.enc.json 경로]
환경변수 PN_PASSWORD 로 비밀번호를 줘도 된다.
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

KMCC_BOARD_URL = "https://www.kmcc.go.kr/user.do?boardId=1003&page=A02010100&dc=K02010100"
KMCC_PAGES = 3  # 1페이지=10건 기준, 최근 ~3개월 분량


def now_kst():
    return datetime.now(KST)


def log(msg):
    print(f"[calendar] {msg}", flush=True)


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


def fetch_kmcc_meetings():
    out = []
    today = now_kst().date()
    for cp in range(1, KMCC_PAGES + 1):
        url = KMCC_BOARD_URL + f"&cp={cp}"
        r = req("GET", url)
        soup = BeautifulSoup(r.text, "html.parser")
        table = soup.select_one("table")
        rows = table.select("tbody tr") if table else []
        if not rows:
            break
        for tr in rows:
            tds = tr.select("td")
            if len(tds) < 5:
                continue
            title = tds[1].get_text(" ", strip=True)
            m = re.search(r"제(\d+)차\s*방송미디어통신위원회\s*(서면회의|회의)\((\d{2})(\d{2})\)", title)
            if not m:
                continue
            num, kind, mm, dd = m.group(1), m.group(2), int(m.group(3)), int(m.group(4))
            posted = tds[4].get_text(strip=True)
            pm = re.search(r"(20\d{2})-(\d{2})-(\d{2})", posted)
            if not pm:
                continue
            py = int(pm.group(1))
            year = py + 1 if mm < int(pm.group(2)) - 1 else py
            try:
                mdate = datetime(year, mm, dd).date()
            except ValueError:
                continue
            a = tr.select_one("a")
            link = KMCC_BOARD_URL
            if a:
                href = a.get("href") or ""
                if href and not href.startswith("javascript"):
                    link = requests.compat.urljoin(url, href)
            out.append({
                "category": "방미통위",
                "org": "방송미디어통신위원회",
                "title": f"제{num}차 방송미디어통신위원회 {kind}",
                "kind": kind,
                "date": mdate.strftime("%Y-%m-%d"),
                "url": link,
            })
    return out


def load_manual():
    path = os.path.join(os.path.dirname(__file__), "calendar_manual.json")
    if not os.path.exists(path):
        return []
    items = json.load(open(path, encoding="utf-8"))
    out = []
    for it in items:
        if not it.get("date") or not re.match(r"^20\d{2}-\d{2}-\d{2}$", it["date"]):
            continue
        out.append({
            "category": it.get("category", "언론사"),
            "org": it.get("org", ""),
            "title": it.get("title", ""),
            "kind": it.get("kind", ""),
            "date": it["date"],
            "url": it.get("url", ""),
            "note": it.get("note", ""),
        })
    return out


def main():
    pw = os.environ.get("PN_PASSWORD") or (sys.argv[1] if len(sys.argv) > 1 else None)
    if not pw:
        log("비밀번호가 없습니다 (PN_PASSWORD 환경변수 또는 첫 번째 인자)")
        sys.exit(1)
    out_path = sys.argv[2] if len(sys.argv) > 2 else "calendar.enc.json"

    items = []
    try:
        kmcc = fetch_kmcc_meetings()
        log(f"방미통위 의사일정 {len(kmcc)}건 수집")
        items += kmcc
    except Exception as e:
        log(f"방미통위 의사일정 수집 실패 — {type(e).__name__}: {e}")

    manual = load_manual()
    log(f"언론사 등 수동 입력 {len(manual)}건")
    items += manual

    seen = set()
    dedup = []
    for it in items:
        k = (it["category"], it["org"], it["title"], it["date"])
        if k in seen:
            continue
        seen.add(k)
        dedup.append(it)
    dedup.sort(key=lambda x: x["date"], reverse=True)

    if os.path.exists(out_path):
        try:
            prev = decrypt(pw, out_path)
            if prev.get("events") == dedup:
                log("변경 없음 — calendar.enc.json 그대로 둠")
                return
        except Exception as e:
            log(f"기존 파일 비교 실패(무시하고 새로 씀) — {type(e).__name__}: {e}")

    data = {"updated": now_kst().strftime("%Y-%m-%d %H:%M"), "events": dedup}
    encrypt(pw, data, out_path)
    log(f"calendar.enc.json 갱신 완료 — 총 {len(dedup)}건")


if __name__ == "__main__":
    main()
