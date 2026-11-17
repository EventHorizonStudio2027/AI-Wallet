from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text(encoding='utf-8')
required=['styles/app.css','src/modules/creator.js','src/modules/intelligence.js','src/modules/billing.js','src/modules/reminders.js','src/modules/memory.js','src/modules/accounts.js','src/modules/files.js','src/modules/storage.js','src/modules/backup.js','src/modules/events.js','src/modules/events.js','src/app.js','manifest.webmanifest','service-worker.js','assets/ai-wallet-icon.svg']
for rel in required:
    path=root/rel
    assert path.exists() and path.stat().st_size>20, f'Missing/empty file: {rel}'
for rel in required:
    if rel.endswith('.js') and rel.startswith('src/'):
        assert f'src="{rel}"' in html, f'Not linked: {rel}'
assert 'rel="manifest"' in html
ids=re.findall(r"\bid=[\"']([^\"']+)[\"']",html)
duplicates=sorted({value for value in ids if ids.count(value)>1})
assert not duplicates, f'Duplicate HTML IDs: {duplicates}'
assert '<style' not in html.lower()
assert 'serviceWorker.register' in (root/'src/app.js').read_text(encoding='utf-8')
print(f'Project check passed: {len(ids)} unique IDs; modular scripts, PWA manifest, icon and service worker present.')
