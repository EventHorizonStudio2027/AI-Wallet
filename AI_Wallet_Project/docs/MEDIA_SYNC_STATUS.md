## v81 Google Drive connector (implementation, pending live authorization)

- Uses Google Identity Services OAuth token client with a user-provided **Web application OAuth client ID**; authorized JavaScript origin must include `https://fatespassage.github.io`. Google Drive API must be enabled in the same Google Cloud project, and the OAuth consent screen configured. Depending on Google verification and test-user status, the account may need to be added as a test user. **Do not enter a client secret.**
- Requests `drive.readonly` for reading user-selected folder IDs and `drive.appdata` for creating and listing private DomAIn backups in Google Drive's appDataFolder. These scopes can require Google verification for public deployment. Tokens are held in memory and revoked on disconnect; no OAuth credentials are persisted to local storage or committed to GitHub.
- Lists a chosen Drive folder (including pagination), downloads ordinary binary files to local browser storage, records source IDs and timestamps, and skips unchanged remote files. Nested folders, native Google Docs/Sheets/Slides exports, background sync with a closed tab, robust partial-import retries, and content updates for previously imported remote IDs need additional work.
- Uploads a full JSON backup including local file bytes to Google Drive's private appDataFolder, subject to the existing 100 MB backup limit. Refuses incomplete backups with missing file contents. Offers download of the latest backup for the existing manual Import Backup flow. **Cloud backups are unencrypted beyond Google's transport/storage controls**; do not assume end-to-end encryption.
- **Verification status:** API module tests are mocked; OAuth consent, Drive permissions, live upload/download, cross-device recovery, and GitHub Actions are not independently verified. Do not mark Issue #1 closed until an authorized test account completes an end-to-end run.

# Unified AI media library — implementation status (v80)

Tracking: https://github.com/FatesPassage/AI-Wallet/issues/1

## Implemented in the GitHub Pages app

- Manual/bulk file import using the browser file picker or drag-and-drop.
- Opt-in watched folder (Chromium File System Access API): user explicitly grants read permission; DomAIn checks for changed/new files every 60 seconds while the tab is visible and when the tab becomes visible again. The directory handle stays in memory for the current session only; disconnect stops polling. This is **local folder synchronization**, not a connection to AI provider accounts or cloud storage. Browser support and end-to-end runtime behavior still require verification.
- Opt-in folder import from user-selected local AI exports (where directory input is supported). Relative source paths are saved and searchable; reselecting a folder imports new content and skips checksummed duplicates. This is **not automatic cloud synchronization**.
- Local IndexedDB file payloads and locally persisted library metadata.
- Provider/account and folder organization, type filtering, file previews and downloads.
- New manual-import provenance fields: `source: "manual-import"`, `storageMode: "local"`, `originalModified`, and optional `checksum` / `checksumAlgorithm`.
- SHA-256 duplicate detection for imports up to 64 MiB when Web Crypto is available. Identical bytes are skipped when a matching stored checksum and file size exist. This is **not** a guarantee of deduplication for larger files, older records without checksums, or browsers without Web Crypto.
- Local-only storage disclosure in the My Files interface.

## Not implemented / not verified

- No official AI-service OAuth connection, AI creation-history API, or remote/cloud automatic media sync. The new watched folder feature requires a user-selected local directory and an open app tab.
- No remote cloud-folder indexing, sync cursor, connector retries, cloud backups, or remote delete propagation.
- No secure token backend. **Never add OAuth secrets or provider passwords to the public Pages frontend.**
- Flow and Flow Music creation-history API support is **unverified**. Their icons in the service directory do not mean media sync is supported.
- Live browser validation and CI success for this release are not yet confirmed.

## Next engineering milestones

1. Validate import, deduplication, storage persistence and backup/restore in desktop and mobile browsers.
2. Audit official provider APIs and export options, including Flow and Flow Music; record scopes and unsupported capabilities.
3. Implement an opt-in, backend-backed OAuth connector for a provider with verified media read permissions, with encrypted token storage and revocation.
4. Add incremental sync, provenance-aware deduplication, status/errors and retry controls.
5. Implement optional user-controlled backup with quotas, retention, export and deletion controls.

**Privacy boundary:** Until authorized connector infrastructure exists, all imports are initiated by the user; files remain in the current browser's storage unless the user explicitly exports them.
