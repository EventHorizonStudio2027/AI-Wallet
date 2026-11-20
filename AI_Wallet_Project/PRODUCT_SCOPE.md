# domAIn — focused product scope (Phase: Make It Real)

## Product promise
A practical workspace for managing AI service accounts, manually tracked subscriptions, generated files, and private backup/recovery.

## Four core jobs
1. **Accounts and service launcher:** Create, edit, remove, and organize service/account records. Open official service destinations. Do not imply OAuth account control or automatic switching unless a provider-supported integration exists.
2. **Subscription and usage records:** Enter plan cost, billing cadence, renewal/reset information, and usage manually. Display calculated totals from entered data. Do not claim bank-verified billing or live usage synchronization.
3. **Media library:** Import local files and supported files from a selected Google Drive folder; categorize, search, preview and download files. Google Docs/Sheets/Slides require export before importing. Local storage is device/browser-specific; do not claim cross-device synchronization without testing.
4. **Backup and recovery:** Export and import backups; save private backups to Google Drive app data; download and validate recovery copies. A user has confirmed a backup and recovery download worked. Full destructive restore remains a separate test and must be done with disposable data.

## Explicitly outside the core product
Creator income, financial payout reconciliation, automated billing aggregation, cross-provider memory usage scraping, and unsupported OAuth account-switching. Keep existing legacy code/data for now; remove it only after a migration and data-retention review. Creator Income is hidden from primary navigation, not deleted.

## Integration contract
Every integration must document: permissions and provider scopes, what actually synchronizes, manual vs automatic fields, authentication expiry, error states, privacy/storage, and an end-to-end verification checklist. Never call a shortcut an integration.

## Release gate
For each core job: automated unit tests, browser smoke test, mobile interaction test, accessible keyboard navigation, fresh-install test, data migration/restore check, and a verified deployed GitHub Pages URL. Mark implementation, execution, and live verification separately.

## Outstanding work (renumber from 1 each iteration)
1. Verify Drive folder import and incremental sync with an actual folder and a changed file.
2. Execute automated tests and browser/mobile smoke tests.
3. Audit all visible buttons and workflows; fix or remove dead-end interactions.
4. Validate account/service launch and subscription calculations with real user flows.
5. Verify backup import/restore using disposable data; never overwrite live data as a test.

## Current priority: operational excellence and service breadth
The four core jobs are fixed. Prioritize end-to-end functionality, reliability, security, smooth UX, and honest integration status over adding unrelated product modules.

### Service catalog taxonomy
Include mainstream and specialized AI providers as *directory entries* without implying API access: conversational assistants; search/research; coding and developer agents; image/design; video/animation; voice, audio and music; transcription/meetings; writing/translation; productivity; automation and agent builders; model hosting/inference; education; accessibility; scientific research; 3D and game creation; legal and enterprise workflows. Catalog breadth is not the same as integration breadth.

For each entry track: official URL, category, supported tasks, account-launch behavior, pricing mode (unknown unless verified), integration status (directory-only / manually tracked / connected), data access scope, and last verification date. Never store provider passwords or pretend a launch link can switch login sessions. Validate URLs and external links. Avoid embedding third-party apps in iframes without provider support.

### Phase execution order
1. Make account create/edit/delete, service selection, and safe provider launch work across devices.
2. Verify subscription totals, currencies, billing cadence and manual reset dates against fixtures.
3. Verify local file lifecycle, limits, deduplication, and import/preview/download.
4. Verify Google Drive folder sync and non-destructive backup/recovery; ensure expired tokens and partial failures are handled.
5. Run automated tests, browser smoke tests and mobile tests before declaring any flow production-ready.

**Live verification:** user confirmed Google Drive backup creation and verified-backup JSON download on 2026-11-20. Full restore and folder incremental sync are still unverified.
