"""domAIn release integrity checks. Run from any working directory."""
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
check("domAIn" in html, "domAIn branding missing from entrypoint")
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
        check("domAIn" in manifest.get("name", ""), "Outdated installed app name")
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

# Brand, navigation and asset integration regressions
app_js = (ROOT / "src/app.js").read_text(encoding="utf-8")
css = (ROOT / "styles/app.css").read_text(encoding="utf-8")
check("Welcome to AI Wallet" not in app_js, "Old brand title still rendered dynamically")
check("Welcome to domAIn" in app_js, "Dynamic home title is not branded")
check("service-logo-image" in app_js and ".service-logo-image" in css, "Service logo markup and CSS out of sync")
check("mobile-nav-label" in html and ".mobile-nav-label" in css, "Mobile navigation markup and CSS out of sync")
check(html.count('id="domainNeon"') == 1, "Duplicate sidebar SVG gradient identifier")
check(html.count('id="domainHeroNeon"') == 1, "Dashboard SVG gradient missing or duplicated")
check("CACHE_PREFIX" in (ROOT / "service-worker.js").read_text(encoding="utf-8"), "Missing offline cache version")
check("styles/app.css" in html, "Stylesheet missing from HTML")
# Guard against publishing a branded page with broken media-preview wiring.
for identifier in ("mediaPreviewDialog", "mediaPreviewTitle", "mediaPreviewMeta", "mediaPreviewContent", "closeMediaPreviewBtn"):
    check(identifier in doc.ids, f"Missing media preview UI: {identifier}")
check("previewMediaInline" in app_js and "closeMediaPreview" in app_js, "Media preview handlers missing")
check(".media-preview-dialog" in css, "Media preview dialog styling missing")
check("Save original file" in app_js and ".media-preview-actions" in css, "Media save fallback missing or unstyled")
check("Backup uploaded. Checking Drive recovery and SHA-256 integrity" in app_js, "Drive backup recovery verification missing")
check("verifiedBlob.size!==blob.size" in app_js, "Drive backup recovered size comparison missing")
check("crypto.subtle.digest('SHA-256'" in app_js, "Drive backup checksum verification missing")
check("Latest Drive backup exceeds the 100 MB recovery limit" in app_js, "Drive restore preflight missing")
drive_js = (ROOT / "src/modules/drive-sync.js").read_text(encoding="utf-8")
check("backup listing exceeds safe limit" in drive_js, "Drive backup listing limit missing")
check("pagination did not advance" in drive_js, "Drive backup pagination loop protection missing")
check("Date.parse(b.createdTime)-Date.parse(a.createdTime)" in app_js, "Drive recovery date ordering missing")
check("Recovered file size does not match Google Drive metadata" in app_js, "Drive recovery metadata integrity check missing")
check("download(driveToken,latest.id,100*1024*1024)" in app_js, "Drive recovery download limit missing")
check("download(driveToken,result.id,blob.size)" in app_js, "Drive upload verification limit missing")
check("response.headers.get('Content-Length')" in drive_js, "Drive download preflight size guard missing")
check("download(driveToken,remote.id,window.AIWalletModules.backup.MAX_FILE_BYTES)" in app_js, "Drive folder import limit missing")
check("Imported Drive file size differs from metadata" in app_js, "Drive folder import integrity guard missing")
check("Malformed Google Drive file entry" in drive_js, "Drive folder entry validation missing")
check("Google Drive folder pagination did not advance" in drive_js, "Drive folder pagination guard missing")
check("Folder ready · " in app_js, "Drive folder scan summary missing")
check("seenFiles.has(file.id)" in drive_js, "Drive folder duplicate ID prevention missing")
check("Google-native unsupported" in app_js, "Drive native file limitations must be visible")
check("tooLarge+" in app_js, "Drive sync must report oversized files")
check("(added+updated+tooLarge)" in app_js, "Drive sync progress must not count unsupported files")
check("oversizedPending=pending.filter" in app_js, "Drive sync must preview oversized files")
check('id="driveCheckBtn"' in html, "Drive connection test button missing")
check("Check Drive access</button>" in html, "Drive access check label missing")
check("Drive access check failed:" in app_js, "Drive access failure diagnostic missing")
check('id="fileSource"' in html, "Media origin filter missing")
check('id="manualFileOrigin"' in html, "Manual AI-provider attribution selector missing")
check('id="fileImportProgress"' in html, "Accessible file import progress missing")
check('id="fileImportProgressBar"' in html, "Visual import progress bar missing")
check('id="driveOperationProgress"' in html, "Drive operation progress indicator missing")
check('id="workspaceHealth"' in html, "Dashboard workspace health panel missing")
check("function renderWorkspaceHealth()" in app_js, "Workspace health rendering missing")
check("renderWorkspaceHealth()}\nfunction driveControls" in app_js, "Drive status changes must refresh dashboard health")
check(".workspace-health-grid{display:grid;grid-template-columns:repeat(3" in css, "Workspace health layout styling missing")
check("driveProgress(added+updated+tooLarge,pending.length)" in app_js, "Drive folder sync progress updates missing")
check("driveProgress(processed,state.files.length)" in app_js, "Drive backup preparation progress missing")
check("uploadProgress.value=Math.round((processed/files.length)*100)" in app_js, "Import percentage updates missing")
check("knownFingerprints=new Set" in app_js, "Bulk import fingerprint index missing")
check("normalizeManualOrigin(source)" in app_js, "Manual provider origin validation missing")
check("files.length>500" in app_js, "Bulk import batch cap missing")
check("batchBytes>maxBatchBytes" in app_js, "Aggregate import byte limit missing")
check("err?.name==='QuotaExceededError'" in app_js, "Browser storage quota failures need a specific recovery message")
check("Browser storage is full. Free up device storage" in app_js, "Storage quota recovery guidance missing")
check("if(state.files.length+files.length>10000)" not in app_js, "Duplicate-heavy imports should not be rejected by conservative capacity preflight")
check("if(state.files.length>=10000)throw Error('The file library limit is 10,000 unique files')" in app_js, "Unique-file limit must be enforced after duplicate detection")
check("uploadProgress.setAttribute('aria-valuetext'" in app_js, "Import progress must expose accessible text")
check("requestAnimationFrame(resolve)" in app_js, "Import progress must yield browser paint")
check("Importing '+(++processed)" in app_js, "Bulk import progress updates missing")
check("duplicates skipped" in app_js, "Import progress should report duplicate skips")
check("Complete · '+stored.length+' added" in app_js, "Import completion summary missing")
check("source:$('#manualFileOrigin').value" in app_js, "Manual provider origin must be recorded")
check("attributedService?.id" in app_js, "Provider exports must map to matching service")
check("existing.checksumAlgorithm==='sha256'" in app_js, "Manual dedupe must verify checksum algorithm")
check('id="fileDuplicatesOnly"' in html, "Duplicate-only library toggle missing")
check('id="exportLibraryCsvBtn"' in html, "Library CSV export button missing")
check("exportInventoryCsv(visibleLibraryFiles)" in app_js, "Filtered library CSV export missing")
check("duplicateIds(state.files)" in app_js, "Duplicate-only library view missing")
check("possible duplicates" in app_js, "Visible duplicate count missing")
check("const duplicateSet=window.AIWalletModules.files.duplicateIds(state.files)" in app_js, "Duplicate count must reuse one fingerprint set")
check("addEventListener('change',renderFiles)" in app_js, "Duplicate-only filter must update immediately")
check("sourceFilter==='other'?!['google-drive','chatgpt','claude','gemini','grok','perplexity'].includes(f.source)" in app_js, "Media origin filter logic missing")
check("'fileStorage','fileSource','fileSort'" in app_js, "Media origin filter change listener missing")
check("window.addEventListener('load',()=>{loadGoogleIdentity()" in app_js, "Google Identity SDK preload missing")
check("To sync: connect Google Drive" in html, "Drive setup guidance missing")
check("driveAPI().listBackups(driveToken)" in app_js, "Drive authenticated connection test missing")
check("driveAPI().listFolder(driveToken,folderId)" in app_js, "Drive connection test must verify folder read access")
check("$('#driveCheckBtn').disabled=driveBusy||!ready" in app_js, "Drive connection test must require authorization")
check('id="driveSyncBtn" disabled>Sync Drive folder' in html, "Drive sync button label must describe repeatable sync")
check("prior&&prior.originalModified===remoteModified" not in app_js, "Drive sync must not skip checksum-only changes")
check("render();return}" in app_js, "Drive no-change sync must refresh library")
check("Importing · " in app_js, "Drive progress summary missing")
check('class="brand-name">dom<span' in html, "Sidebar wordmark must begin with lowercase d")
check("DomAIn" not in html, "Outdated uppercase-D branding in HTML")
if errors:
    for error in errors:
        print(f"FAIL: {error}")
    raise SystemExit(f"domAIn release audit failed with {len(errors)} error(s)")
print(f"domAIn release audit passed: {len(doc.ids)} unique element IDs, {len(doc.scripts)} scripts, {len(doc.styles)} stylesheets, {len(doc.assets)} image assets, manifest and offline shell.")
