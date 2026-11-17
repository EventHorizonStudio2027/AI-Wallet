"""DomAIn release integrity checks. Run from any working directory."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json
import re

ROOT = Path(__file__).resolve().parents[1]
errors = []

def check(condition, message):
    if not condition:
        errors.append(message)

def local_path(value):
    parsed = urlsplit(value.strip())
    if parsed.scheme or parsed.netloc or value.startswith(("#", "data:", "mailto:", "tel:")):
        return None
    path = unquote(parsed.path)
    if not path or path in ("/", "./", "."):
        return None
    candidate = (ROOT / path.lstrip("/")).resolve()
    if not candidate.is_relative_to(ROOT.resolve()):
        errors.append(f"Asset escapes application root: {value}")
        return None
    return candidate

class DocumentAudit(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = []
        self.scripts = []
        self.styles = []
        self.manifests = []
        self.assets = []
        self.pages = []
    def handle_starttag(self, tag, attrs):
        props = dict(attrs)
        if props.get("id"):
            self.ids.append(props["id"])
        if tag == "script" and props.get("src"):
            self.scripts.append(props["src"])
        if tag == "link" and props.get("href"):
            rel = (props.get("rel") or "").lower()
            if "stylesheet" in rel:
                self.styles.append(props["href"])
            elif "manifest" in rel:
                self.manifests.append(props["href"])
            elif "icon" in rel:
                self.assets.append(props["href"])
        if tag in ("img", "source") and props.get("src"):
            self.assets.append(props["src"])

html_file = ROOT / "index.html"
check(html_file.is_file(), "Missing index.html")
if not html_file.is_file():
    raise SystemExit("Missing index.html")
html = html_file.read_text(encoding="utf-8")
doc = DocumentAudit()
doc.feed(html)
check("DomAIn" in html, "DomAIn branding missing from entrypoint")
check(bool(doc.scripts), "No JavaScript application entrypoints")
check(bool(doc.styles), "No linked CSS")
check(bool(doc.manifests), "No web app manifest")
for identifier, count in Counter(doc.ids).items():
    check(count == 1, f"Duplicate HTML id: {identifier} ({count})")
for url in doc.scripts + doc.styles + doc.manifests + doc.assets:
    path = local_path(url)
    if path is not None:
        check(path.is_file() and path.stat().st_size > 0, f"Missing/empty linked asset: {url}")
check(any(urlsplit(url).path == "src/app.js" for url in doc.scripts), "Main app script not loaded")
check("serviceWorker.register" in (ROOT / "src/app.js").read_text(encoding="utf-8"), "Missing service worker registration")

manifest_path = ROOT / "manifest.webmanifest"
check(manifest_path.is_file(), "Missing PWA manifest")
if manifest_path.is_file():
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        check("DomAIn" in manifest.get("name", ""), "Outdated installed app name")
        for icon in manifest.get("icons", []):
            path = local_path(icon.get("src", ""))
            check(path is not None and path.is_file(), f"Missing manifest icon: {icon.get('src')}")
        check(bool(manifest.get("icons")), "No PWA icons configured")
    except (ValueError, OSError) as exc:
        errors.append(f"Invalid PWA manifest: {exc}")

sw_file = ROOT / "service-worker.js"
check(sw_file.is_file(), "Missing service worker")
if sw_file.is_file():
    sw = sw_file.read_text(encoding="utf-8")
    match = re.search(r"const SHELL\s*=\s*\[([^\]]+)\]", sw, re.S)
    check(bool(match), "Service worker shell list not found")
    if match:
        entries = re.findall(r"['\"]([^'\"]+)['\"]", match.group(1))
        for url in entries:
            path = local_path(url)
            if path is not None:
                check(path.is_file() and path.stat().st_size > 0, f"Missing precache asset: {url}")
        check(len(entries) == len(set(entries)), "Duplicate service worker precache entries")
    check("CACHE_PREFIX" in sw, "Service worker cache namespace missing")

if errors:
    for error in errors:
        print(f"FAIL: {error}")
    raise SystemExit(f"DomAIn release audit failed with {len(errors)} error(s)")
print(f"DomAIn release audit passed: {len(doc.ids)} unique element IDs, {len(doc.scripts)} scripts, {len(doc.styles)} stylesheets, {len(doc.assets)} image assets, manifest and offline shell.")
