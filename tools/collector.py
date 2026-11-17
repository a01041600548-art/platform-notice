"""플랫폼 공지 자동 수집기.

'대상 사이트' 중 서버 HTML에 목록이 그대로 들어있는(=requests로 긁을 수 있는)
"웹 자동" 표시 사이트들만 수집한다. JS가 비동기로 채우거나 로그인/캡차가 있는
"PC Chrome" 표시 사이트는 이 스크립트로 자동화하지 않는다 — 수동 확인 대상.

새로 발견된 공지는 topic="기타 안내"(미분류), check=""(빈 값)으로 들어간다.
주제 분류·영업 체크 메모는 사람이 주기적으로 검토해서 채운다.

Usage: python3 tools/collector.py <password> [data.enc.json 경로]
환경변수 PN_PASSWORD 로 비밀번호를 줘도 된다(그 경우 인자 생략 가능).

기존 notices와의 중복 판정은 URL 안의 게시글 번호(boardSeq/nt_keynum/idx 등) →
(platform, url) → (platform, title, date) 순으로 한다 (notice_key 참고).
"""
import base64
import json
import os
import re
import sys
import time
from datetime import datetime, timedelta, timezone
from urllib.parse import urljoin

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


def fetch_abn():
    url = "https://www.abn.co.kr/customer/noticeList.do"
    r = req("GET", url)
    soup = BeautifulSoup(r.text, "html.parser")
    out = []
    table = soup.select_one("table")
    rows = table.select("tbody tr") if table else []
    for tr in rows:
        tds = tr.select("td")
        if len(tds) < 3:
            continue
        a = tr.select_one("a[onclick*='goView']")
        if not a:
            continue
        title = a.get_text(" ", strip=True)
        title = re.sub(r"\s*(공지|첨부)\s*$", "", title).strip()
        title = re.sub(r"\s*(공지|첨부)\s*$", "", title).strip()
        if not title:
            continue
        onclick = a.get("onclick") or ""
        m_id = re.search(r"goView\('?(\d+)'?\)", onclick)
        if not m_id:
            continue
        seq = m_id.group(1)
        link = "https://www.abn.co.kr/customer/noticeView.do?seq=" + seq
        date = ""
        for td in tds:
            m = re.search(r"(20\d{2})[.\-](\d{2})[.\-](\d{2})", td.get_text())
            if m:
                date = "%s-%s-%s" % (m.group(1), m.group(2), m.group(3))
                break
        if date:
            out.append({"title": title, "date": date, "url": link})
    return out


def fetch_gcs():
    url = "https://www.gcs.co.kr/help/board/notice"
    r = req("GET", url)
    soup = BeautifulSoup(r.text, "html.parser")
    out = []
    today = datetime.now(KST).date()
    rows = soup.select("a[href*='/help/notice/']")
    seen = set()
    for a in rows:
        href = a.get("href") or ""
        m_id = re.search(r"/help/notice/(\d+)", href)
        if not m_id:
            continue
        nid = m_id.group(1)
        if nid in seen:
            continue
        tr = a.find_parent("tr")
        if not tr:
            continue
        tds = tr.select("td")
        if len(tds) < 2:
            continue
        title = a.get_text(" ", strip=True)
        if not title:
            title = tds[1].get_text(" ", strip=True) if len(tds) > 1 else ""
        if not title:
            continue
        date = ""
        row_text = tr.get_text(" ", strip=True)
        m = re.search(r"(20\d{2})[.\-](\d{2})[.\-](\d{2})", row_text)
        if m:
            date = "%s-%s-%s" % (m.group(1), m.group(2), m.group(3))
        else:
            m2 = re.search(r"(\d{2})[.\-](\d{2})\b", row_text)
            if m2:
                mm, dd = int(m2.group(1)), int(m2.group(2))
                y = today.year
                try:
                    d = datetime(y, mm, dd).date()
                    if d > today:
                        d = datetime(y - 1, mm, dd).date()
                    date = d.strftime("%Y-%m-%d")
                except ValueError:
                    date = ""
        if not date:
            continue
        seen.add(nid)
        link = requests.compat.urljoin(url, href)
        out.append({"title": title, "date": date, "url": link})
    return out


def fetch_jcn():
    url = "https://www.jcntv.co.kr/notice.html?query=view&page=1&table=BBs01&botype=LIS_B05_01&page_num=20"
    r = req("GET", url)
    soup = BeautifulSoup(r.text, "html.parser")
    out = []
    table = soup.select_one("table")
    rows = table.select("tbody tr") if table else []
    for tr in rows:
        a = tr.select_one("a[href*='bid=']")
        if not a:
            continue
        tds = tr.select("td")
        if len(tds) < 2:
            continue
        title = a.get_text(" ", strip=True)
        if not title:
            continue
        href = a.get("href") or ""
        m_id = re.search(r"bid=(\d+)", href)
        if not m_id:
            continue
        link = ("https://www.jcntv.co.kr/notice.html?query=view&page=1&table=BBs01"
                "&botype=LIS_B05_01&page_num=20&bid=" + m_id.group(1))
        date = ""
        row_text = tr.get_text(" ", strip=True)
        m = re.search(r"(20\d{2})[.\-](\d{2})[.\-](\d{2})", row_text)
        if m:
            date = "%s-%s-%s" % (m.group(1), m.group(2), m.group(3))
        if date:
            out.append({"title": title, "date": date, "url": link})
    return out


def fetch_kctv():
    url = "https://www.kctv.co.kr/customer/notice_board.php"
    r = req("GET", url)
    soup = BeautifulSoup(r.text, "html.parser")
    out = []
    table = soup.select_one("table")
    rows = table.select("tbody tr") if table else []
    for tr in rows:
        a = tr.select_one("a[href*='view_notice_board.php']")
        if not a:
            continue
        tds = tr.select("td")
        if len(tds) < 2:
            continue
        title = a.get_text(" ", strip=True)
        if not title:
            continue
        href = a.get("href") or ""
        m_id = re.search(r"idx=(\d+)", href)
        if not m_id:
            continue
        link = "https://www.kctv.co.kr/customer/view_notice_board.php?idx=" + m_id.group(1)
        date = ""
        row_text = tr.get_text(" ", strip=True)
        m = re.search(r"(20\d{2})[.\-](\d{2})[.\-](\d{2})", row_text)
        if m:
            date = "%s-%s-%s" % (m.group(1), m.group(2), m.group(3))
        if date:
            out.append({"title": title, "date": date, "url": link})
    return out


def fetch_kcta():
    """한국케이블TV방송협회 공지.

    목록 화면(ArticleList.do)의 표는 자바스크립트가 나중에 채운다. requests 로
    받은 HTML에는 머리글만 있고 글이 없어서 HTML 파싱으로는 0건이 나온다.
    그래서 화면이 쓰는 JSON 엔드포인트를 그대로 호출한다(POST 폼 전송,
    응답은 content-type 이 text/xml 이지만 내용은 JSON).
    """
    base = "https://kcta.or.kr"
    api = base + "/kcta_new/board/getArticleList.do"
    form = {"BOARD_ID": "28", "SITE_ID": "KCTA", "H_MENU_CD": "100204",
            "L_MENU_CD": "10020401", "PAGE_INDEX": "1", "PAGE_SIZE": "15"}
    r = req("POST", api, data=form)
    try:
        payload = json.loads(r.text)
    except ValueError:
        return []
    out = []
    for row in payload.get("ds_list") or []:
        title = str(row.get("TITLE") or "").strip()
        seq = str(row.get("ARTICLE_SEQ") or "").strip()
        if not title or not seq:
            continue
        cat = str(row.get("CATEGORY_NAME") or "").strip()
        if cat:
            title = "[%s] %s" % (cat, title)
        date = str(row.get("REG_DT") or "").strip()
        if not re.fullmatch(r"20\d{2}-\d{2}-\d{2}", date):
            m = re.match(r"(20\d{2})(\d{2})(\d{2})", str(row.get("REG_DTTM") or ""))
            date = "%s-%s-%s" % m.groups() if m else ""
        if date:
            out.append({"title": title, "date": date,
                        "url": "%s/kcta_new/board/ArticleView.do?BOARD_ID=28&ARTICLE_SEQ=%s" % (base, seq)})
    return out


def fetch_kiptv():
    """한국IPTV방송협회 공지. 표 한 줄이 번호/제목/글쓴이/등록일/조회수,
    상세 링크는 /notice/<번호> 형태의 평범한 href 다."""
    list_url = "https://www.kiptv.or.kr/notice"
    r = req("GET", list_url)
    soup = BeautifulSoup(r.text, "html.parser")
    out = []
    table = soup.select_one("table")
    for tr in (table.select("tbody tr") if table else []):
        a = tr.select_one("td.td_subject a[href]") or tr.select_one("a[href]")
        if not a:
            continue
        title = a.get_text(" ", strip=True)
        title = re.sub(r"\s*\+?\d+\s*$", "", title).strip()  # 댓글 수 꼬리 제거
        if not title:
            continue
        date = ""
        cell = tr.select_one("td.td_datetime")
        texts = [cell.get_text()] if cell else [td.get_text() for td in tr.select("td")]
        for txt in texts:
            m = re.search(r"(20\d{2})[.\-](\d{2})[.\-](\d{2})", txt)
            if m:
                date = "%s-%s-%s" % (m.group(1), m.group(2), m.group(3))
                break
        if date:
            out.append({"title": title, "date": date,
                        "url": urljoin(list_url, a.get("href") or "")})
    return out


# (platform, group) 은 sites 배열의 표기와 정확히 일치해야 한다.
SOURCES = {
    "skbb": ("SK브로드밴드", "IPTV", fetch_skbb),
    "cmb": ("CMB", "MSO", fetch_cmb),
    "dlive": ("딜라이브", "MSO", fetch_dlive),
    "kmcc": ("방미통위(KMCC)", "정부", fetch_kmcc),
    "abn": ("아름방송(ABN)", "개별SO", fetch_abn),
    "gcs": ("푸른방송", "개별SO", fetch_gcs),
    "jcn": ("JCN울산중앙방송", "개별SO", fetch_jcn),
    "kctv": ("KCTV광주방송", "개별SO", fetch_kctv),
    "kcta": ("한국케이블TV방송협회", "협회", fetch_kcta),
    "kiptv": ("IPTV방송협회", "협회", fetch_kiptv),
}

# 출처 자체가 곧 주제 분류가 되는 경우(예: 방미통위는 기관 공지 전체가 '방미통위'
# 주제) 기본 topic을 "기타 안내" 대신 이걸로 넣는다. 그 외 출처는 내용을 봐야
# 주제를 알 수 있어서 계속 "기타 안내"(미분류)로 들어가고 사람이 분류한다.
DEFAULT_TOPIC = {
    "kmcc": "방미통위",
}


def title_norm(t):
    """제목 비교용 정규화. 분류 라벨([공고] 등)과 공백 차이를 없앤다."""
    t = re.sub(r"^\s*\[[^\]]{1,14}\]\s*", "", str(t or ""))
    return re.sub(r"\s+", " ", t).strip()


def notice_keys(n):
    """중복 판정 키 '후보들'. 하나라도 겹치면 같은 글로 본다.

    예전에는 키를 하나만 돌려줬는데, 같은 글이라도 들어온 경로에 따라 URL이
    다르다. 사람이 손으로 넣은 공지는 url 이 게시판 목록 주소이고 수집기가
    넣는 공지는 글 상세 주소라, 키를 하나만 쓰면 같은 글이 두 번 쌓인다.
    그래서 글번호·상세URL·(플랫폼+정규화 제목+날짜)를 모두 만들어 두고
    교집합이 있으면 중복으로 친다. 글번호 파라미터명은 사이트마다 달라서
    (ARTICLE_SEQ, nt_keynum, idx ...) 대소문자 구분 없이 찾고, 번호가 경로에
    들어가는 형태(/notice/1234)도 함께 본다.
    """
    keys = set()
    plat = n.get("platform") or ""
    url = n.get("url") or ""
    m = re.search(r"(?:boardSeq|nt_keynum|idx|bbs_seq|article_seq|seq)=(\d+)", url, re.I)
    if m:
        keys.add(("seq", plat + "|" + m.group(1)))
    m = re.search(r"/(?:notice|view|article)/(\d+)/?$", url, re.I)
    if m:
        keys.add(("seq", plat + "|" + m.group(1)))
    # URL 문자열 자체는 키로 쓰지 않는다. 글 상세 주소를 못 구해 목록 주소를
    # 그대로 넣어 둔 공지(LG헬로비전·HCN·SK브로드밴드 등)는 그 플랫폼 안에서
    # URL이 전부 같아서, URL을 키로 쓰면 서로 다른 공지가 한 건으로 뭉개진다.
    # 목록 주소에도 숫자가 들어 있어 "숫자가 있으면 상세 주소" 같은 어림짐작도
    # 통하지 않는다. 그래서 위에서 뽑은 글번호와, 아래의 (플랫폼+제목+날짜)만
    # 쓴다. 같은 글이면 둘 중 하나는 반드시 겹친다.
    keys.add(("tpd", plat + "|" + title_norm(n.get("title")) + "|" + str(n.get("date") or "")))
    return keys


def main():
    pw = os.environ.get("PN_PASSWORD") or (sys.argv[1] if len(sys.argv) > 1 else None)
    if not pw:
        log("비밀번호가 없습니다 (PN_PASSWORD 환경변수 또는 첫 번째 인자)")
        sys.exit(1)
    data_path = sys.argv[2] if len(sys.argv) > 2 else "data.enc.json"

    data = decrypt(pw, data_path)
    existing_keys = set()
    for n in data["notices"]:
        existing_keys |= notice_keys(n)

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
                    "topic": DEFAULT_TOPIC.get(key, "기타 안내"),
                    "platform": platform,
                    "group": group,
                    "date": it["date"],
                    "title": it["title"],
                    "summary": "",
                    "check": "",
                    "url": it["url"],
                }
                ks = notice_keys(cand)
                if ks & existing_keys:
                    continue
                existing_keys |= ks
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
