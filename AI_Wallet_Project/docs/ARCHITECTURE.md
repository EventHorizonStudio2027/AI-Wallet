# Architecture and next steps

## Current state
This ZIP is the first multi-file packaging pass. It separates the existing application
shell, CSS, and JavaScript without intentionally changing application behavior.

## Target modules
As the codebase is refactored and covered by tests, move responsibilities into:

- `src/core/` — state, validation, migrations, event handling
- `src/data/` — IndexedDB repositories and backup/restore
- `src/features/accounts/` — providers and account profiles
- `src/features/billing/` — plans, renewals, recorded payments
- `src/features/usage/` — account quotas and usage history
- `src/features/conversations/` — per-chat context and refresh tracking
- `src/features/files/` — file metadata, blobs, folders and previews
- `src/integrations/` — authorized provider adapters
- `src/ui/` — navigation, components and view rendering

## Refactor rules
1. Preserve existing user data and backup compatibility.
2. Add migration tests before changing persistent schemas.
3. Never treat manually entered usage or payments as provider-verified.
4. Keep secrets out of browser storage and client-side source.
5. Validate mobile layouts and keyboard accessibility with real browser tests.
6. Split code incrementally; do not perform a risky all-at-once rewrite.

## Extracted domain modules
- `src/modules/billing.js` — recurring billing conversions and summaries.
- `src/modules/memory.js` — context utilization thresholds and date-range history filtering.
These dependency-free modules are covered by Node unit tests and are the pattern for future incremental extraction.

- `src/modules/accounts.js` — account lookup, provider filtering, active-account resolution, and account summary counts.

- `src/modules/files.js` — file categorization, category icons, provider/category filtering, sorting, and folder counts. IndexedDB blob persistence remains in the storage layer pending extraction.

- `src/modules/storage.js` — IndexedDB lifecycle, file blob operations, usage-history persistence, and storage diagnostics. The UI/state synchronization remains in `src/app.js`.

- `src/modules/backup.js` — backup envelope creation, schema/file-list validation, base64 data URL checks, and payload size guards.
- `manifest.webmanifest`, `service-worker.js`, and `assets/ai-wallet-icon.svg` — installable web app metadata and an offline application shell. This is a PWA foundation, not native iOS/Android packaging.

- `src/modules/events.js` — small in-process event bus with unsubscribe support.
- Schema version 6 adds user-created file folders; legacy backups migrate with an empty folder list.
