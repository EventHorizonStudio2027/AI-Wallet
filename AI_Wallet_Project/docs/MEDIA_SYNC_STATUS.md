# Unified AI media library — implementation status (v76)

Tracking: https://github.com/FatesPassage/AI-Wallet/issues/1

## Implemented in the GitHub Pages app

- Manual/bulk file import using the browser file picker or drag-and-drop.
- Local IndexedDB file payloads and locally persisted library metadata.
- Provider/account and folder organization, type filtering, file previews and downloads.
- New manual-import provenance fields: `source: "manual-import"`, `storageMode: "local"`, `originalModified`, and optional `checksum` / `checksumAlgorithm`.
- SHA-256 duplicate detection for imports up to 64 MiB when Web Crypto is available. Identical bytes are skipped when a matching stored checksum and file size exist. This is **not** a guarantee of deduplication for larger files, older records without checksums, or browsers without Web Crypto.
- Local-only storage disclosure in the My Files interface.

## Not implemented / not verified

- No official AI-service OAuth connection, AI creation-history API, or automatic media sync.
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
