# scrape.py
# Usage: python3 scrape.py
# Requires: requests, beautifulsoup4
# Optional: pdfminer.six (for PDFs), lxml (robust HTML parsing)

import os
import re
import time
import json
import random
import logging
from typing import List, Dict, Optional, Tuple
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup, NavigableString, Tag
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# ---- Optional PDF support ----
PDF_ENABLED = True
try:
    from pdfminer_high_level_fallback import extract_text  # dummy import to trigger except
    raise ImportError  # force except below to run
except Exception:
    try:
        from pdfminer.high_level import extract_text as pdf_extract_text  # type: ignore
    except Exception:
        PDF_ENABLED = False

# ---- HTML parser choice (no bs4 internals) ----
HAS_LXML = False
try:
    import lxml  # noqa: F401
    HAS_LXML = True
except Exception:
    HAS_LXML = False

def best_parser() -> str:
    return "lxml" if HAS_LXML else "html.parser"

URLS_FILE = "urls.txt"
OUT_FILE = "blogs.json"

# Politeness / robustness
REQUEST_TIMEOUT = 25
DELAY_RANGE = (0.9, 2.2)    # polite delay between requests
SAVE_EVERY = 4              # incremental save cadence
MIN_WORDS = 120             # drop pages with too little useful text

# Big status markers
OK = "✅"
FAIL = "❌"
SKIP = "⚠️⚠️"

# Rotating desktop UA strings (helps avoid 403)
USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:128.0) Gecko/20100101 Firefox/128.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36 Edg/127.0.0.0",
]

BASE_HEADERS = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,"
              "image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
}

# Sites that often need JS/cookies; we may skip them gracefully if blocked
LIKELY_JS_SITES = [
    "sciencedirect.com",
    "pmc.ncbi.nlm.nih.gov",
    "ncbi.nlm.nih.gov",
    "timesofagriculture.in",
    "medium.com",
]

# Junk patterns to strip
BLOCK_PATTERNS = [
    re.compile(r"\benter\s+otp\b", re.I),
    re.compile(r"\botp\b", re.I),
    re.compile(r"\blogin\b", re.I),
    re.compile(r"\bsign\s*in\b", re.I),
    re.compile(r"\bregister\b", re.I),
    re.compile(r"\bdownload app\b", re.I),
    re.compile(r"\bsubscribe\b", re.I),
    re.compile(r"\bnewsletter\b", re.I),
    re.compile(r"\bcookie\b", re.I),
    re.compile(r"\bprivacy policy\b", re.I),
    re.compile(r"\bterms and conditions\b", re.I),
    re.compile(r"^\s*(hi there|home|contact|site map|follow|accessibility)\b", re.I),
    re.compile(r"\bcomments?\b", re.I),
    re.compile(r"\bleave your comment\b", re.I),
    re.compile(r"\brelated posts?\b", re.I),
    re.compile(r"\btop searched\b", re.I),
    re.compile(r"\bcoupon\b", re.I),
    re.compile(r"\bavail\b", re.I),
    re.compile(r"\bwhatsapp\b", re.I),
]

# Tags to remove entirely
STRIP_TAGS = [
    "script", "style", "noscript", "iframe", "svg", "canvas",
    "form", "input", "button", "select", "nav", "aside", "header", "footer",
]

# id/class hints to remove
STRIP_ID_CLASS_HINTS = [
    "cookie", "banner", "subscribe", "newsletter", "footer", "header",
    "nav", "menu", "login", "register", "otp", "advert", "ads", "promo",
    "comments", "sidebar", "social", "share", "modal",
]


def build_session() -> requests.Session:
    s = requests.Session()
    retries = Retry(
        total=4,
        backoff_factor=0.8,
        status_forcelist=[401, 403, 404, 408, 425, 429, 500, 502, 503, 504],
        allowed_methods=["GET", "HEAD"],
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retries, pool_connections=20, pool_maxsize=40)
    s.mount("http://", adapter)
    s.mount("https://", adapter)
    return s


def read_urls(path: str) -> List[str]:
    if not os.path.exists(path):
        print(f"{FAIL} {path} not found")
        return []
    out: List[str] = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            u = line.strip()
            if u and not u.startswith("#"):
                out.append(u)
    # de-dupe keep order
    seen = set()
    deduped = []
    for u in out:
        if u not in seen:
            deduped.append(u); seen.add(u)
    return deduped


def hostname(url: str) -> str:
    try:
        return (urlparse(url).hostname or "").lower()
    except Exception:
        return ""


def is_pdf_response(resp: requests.Response, url: str) -> bool:
    ct = (resp.headers.get("Content-Type") or "").lower()
    if "application/pdf" in ct:
        return True
    if url.lower().split("?", 1)[0].endswith(".pdf"):
        return True
    return False


def extract_pdf_text(data: bytes) -> str:
    if not PDF_ENABLED:
        return ""
    import tempfile
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=True) as tmp:
        tmp.write(data); tmp.flush()
        try:
            txt = pdf_extract_text(tmp.name)
            return txt or ""
        except Exception:
            return ""


def strip_nodes(soup: BeautifulSoup) -> None:
    # remove unwanted tags
    for tag in STRIP_TAGS:
        for t in list(soup.find_all(tag)):
            try:
                t.decompose()
            except Exception:
                pass

    # remove by id/class hints, guarding every access
    for el in list(soup.find_all(True)):
        try:
            if not isinstance(el, Tag):
                continue
            id_val = el.get("id")
            classes = el.get("class")
            id_s = (str(id_val) if id_val else "").lower()
            cls_s = " ".join(classes).lower() if isinstance(classes, list) else (str(classes or "").lower())
            blob = f"{id_s} {cls_s}"
            if any(h in blob for h in STRIP_ID_CLASS_HINTS):
                el.decompose()
        except Exception:
            continue


def normalize_text(s: str) -> str:
    s = s.replace("\u00A0", " ")
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip()


def drop_block_lines(text: str) -> str:
    kept: List[str] = []
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        try:
            if any(p.search(line) for p in BLOCK_PATTERNS):
                continue
        except Exception:
            pass
        if len(line) < 3:
            continue
        kept.append(line)
    return "\n".join(kept)


def word_count(s: str) -> int:
    return len(re.findall(r"\b[\w’']+\b", s))


def extract_html_title_and_text(html: str) -> Tuple[str, str]:
    soup = BeautifulSoup(html, best_parser())

    title = ""
    try:
        if soup.title and soup.title.string:
            title = soup.title.string.strip()
    except Exception:
        title = ""

    try:
        strip_nodes(soup)
    except Exception:
        pass

    # choose main container
    container: Optional[Tag] = None
    try:
        container = soup.find("article") or soup.find("main") or soup.body or soup
    except Exception:
        container = soup

    # remove some structural tags from container
    try:
        for t in list(container.find_all(["nav", "aside", "form", "footer", "header"])):
            try:
                t.decompose()
            except Exception:
                pass
    except Exception:
        pass

    # flatten text
    lines: List[str] = []
    try:
        for node in container.descendants:
            if isinstance(node, NavigableString):
                txt = str(node).strip()
                if txt:
                    lines.append(txt)
    except Exception:
        # fallback to get_text
        try:
            fallback = container.get_text(separator="\n")
            lines = [seg.strip() for seg in fallback.splitlines() if seg.strip()]
        except Exception:
            lines = []

    text = "\n".join(lines)
    text = normalize_text(text)
    text = drop_block_lines(text)

    # final fallback if empty
    if not text:
        try:
            text = soup.get_text(separator="\n")
            text = normalize_text(text)
            text = drop_block_lines(text)
        except Exception:
            text = ""

    return title, text


def fetch_with_rotation(session: requests.Session, url: str) -> requests.Response:
    ua = random.choice(USER_AGENTS)
    headers = dict(BASE_HEADERS)
    headers["User-Agent"] = ua
    try:
        parsed = urlparse(url)
        headers["Referer"] = f"{parsed.scheme}://{parsed.hostname}" if parsed.hostname else ""
    except Exception:
        pass
    return session.get(url, headers=headers, timeout=REQUEST_TIMEOUT, allow_redirects=True)


def main():
    urls = read_urls(URLS_FILE)
    if not urls:
        print(f"{FAIL} No URLs to scrape.")
        return

    session = build_session()

    results: List[Dict[str, str]] = []
    # Resume if file exists
    if os.path.exists(OUT_FILE):
        try:
            existing = json.load(open(OUT_FILE, "r", encoding="utf-8"))
            if isinstance(existing, list):
                have = {e.get("url") for e in existing if isinstance(e, dict)}
                results = [e for e in existing if isinstance(e, dict)]
                urls = [u for u in urls if u not in have]
                print(f"↻ Resuming: already had {len(have)} items; {len(urls)} new to fetch.")
        except Exception:
            pass

    success = 0
    for idx, url in enumerate(urls, 1):
        host = hostname(url)
        try:
            time.sleep(random.uniform(*DELAY_RANGE))
            resp = fetch_with_rotation(session, url)

            # retry 403/429 once with backoff + new UA
            if resp.status_code in (403, 429):
                time.sleep(random.uniform(2.0, 4.0))
                resp = fetch_with_rotation(session, url)

            if resp.status_code in (401, 403, 406):
                if any(d in host for d in LIKELY_JS_SITES):
                    print(f"{SKIP} {url} (status {resp.status_code}, likely JS/cookie-gated — skipped)")
                else:
                    print(f"{SKIP} {url} (status {resp.status_code}, forbidden — skipped)")
                continue

            if resp.status_code >= 400:
                print(f"{FAIL} {url} (status {resp.status_code})")
                continue

            # PDF?
            if is_pdf_response(resp, url):
                if not PDF_ENABLED:
                    print(f"{SKIP} {url} (PDF — install pdfminer.six to extract)")
                    continue
                text = extract_pdf_text(resp.content)
                text = normalize_text(text)
                if word_count(text) < MIN_WORDS:
                    print(f"{SKIP} {url} (PDF text too short after extraction)")
                    continue
                title = os.path.basename(url.split("?", 1)[0]) or "Document"
                results.append({"url": url, "title": title, "content": text})
                success += 1
                print(f"{OK} {url}")
            else:
                html = resp.text
                title, text = extract_html_title_and_text(html)
                if word_count(text) < MIN_WORDS:
                    print(f"{SKIP} {url} (too little content after cleaning)")
                    continue
                results.append({"url": url, "title": title or "", "content": text})
                success += 1
                print(f"{OK} {url}")

            if success % SAVE_EVERY == 0:
                with open(OUT_FILE, "w", encoding="utf-8") as f:
                    json.dump(results, f, ensure_ascii=False, indent=2)
                print(f"💾 Saved {len(results)} items to {OUT_FILE}")

        except requests.exceptions.RequestException as e:
            if any(d in host for d in LIKELY_JS_SITES):
                print(f"{SKIP} {url} (network; likely JS/cookie-gated) -> {e}")
            else:
                print(f"{FAIL} {url} (network error) -> {e}")
        except Exception as e:
            print(f"{FAIL} {url} (unexpected error) -> {e}")

    if results:
        with open(OUT_FILE, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        print(f"{OK} Wrote {len(results)} items total to {OUT_FILE}")
    else:
        print(f"{SKIP} No items scraped — check URLs or increase allowances.")


if __name__ == "__main__":
    logging.getLogger("bs4").setLevel(logging.ERROR)
    main()
