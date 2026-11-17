## v31 — Actionable dashboard and recurrence consistency

- Added mobile-responsive overview of urgent trial cancellation deadlines, missing cancellation dates, and upcoming estimated payments.
- Added quick review buttons for individual accounts.
- Corrected the upcoming-renewals counter to use the same recurrence engine as the payment forecast, including historical billing anchors.
- Refreshes forecast when account data changes, not just when the forecast window changes.
- Fixed malformed escaped newlines in the HTML head.
- Added regression tests for dashboard ordering, active trials, historical anchors, and safe presentation.

## v30 — Free trial watchlist

- Added an active-trial watchlist showing cancellation urgency, offer duration, trial end, and edit actions.
- Added advisory checks for missing and inconsistent trial dates and durations.
- Added automated trial timeline regression coverage and updated offline shell caching.
- Trial deadlines are user-entered, not verified against providers; browser/device testing remains outstanding.

## v28 — Reminder snooze reliability
- Fix one-day snooze: now suppresses a reminder through tomorrow instead of using today, which allowed it to reappear immediately.
- Compute snooze boundaries with UTC calendar arithmetic across month/year ends and leap days.
- Reject invalid calendar dates in stored reminder mute/delivery preferences.
- Add regression cases for snooze expiry and calendar boundaries.
- Mobile browser notification delivery remains unverified.

## v27 — Recurring billing dates and reminder accuracy

- Resolve upcoming weekly, monthly and yearly renewals from the original billing date instead of treating an old saved date as expired.
- Preserve month-end billing anchors across short months (January 31 → February 28 → March 31).
- Use the same recurrence calculation in dashboard calendar, in-app reminders, and billing alerts.
- Reject impossible dates and unsupported billing cycles for recurrence calculations.
- Add regression tests for stale renewal dates, leap years, and month-end behavior.
- Increment offline shell cache to v27.

## v26 — Billing and reminder consistency

- Unified subscription totals with the shared billing calculation rather than a duplicate UI formula.
- Excluded unsupported billing cycles from payment alerts, calendar exports, and in-app reminders.
- Ignored null account records in billing summaries and alerts.
- Validated actual calendar dates for snooze and delivery timestamps.
- Added regression tests for consistency across billing, reminders, and calendar exports.

## v24 — Backup payload and identifier integrity
- Reject backup files with declared sizes that disagree with their encoded bytes.
- Reject non-canonical Base64 encodings to avoid accepting ambiguous file payloads.
- Reject duplicate or invalid service, account and folder identifiers before any import writes.
- Added regression cases for each rejection path.
- Bumped offline cache to v24.

## v23 — Backup validation and atomic reset

- Enforce collection limits and reject malformed or noncanonical base64 backup file payloads before writes.
- Reject oversized or invalid backup file metadata.
- Clear file blobs and usage events together in one IndexedDB transaction to prevent partial database resets.
- Prevent concurrent backup imports and block resets while an import is active.
- Bump offline shell cache to v23.

## v22 — Backup integrity and recovery

- Validate backup shape, file names, payload encoding and decoded size before restoration.
- Enforce the same 100 MB size limit on export as import; do not silently export unbounded backups.
- Warn before exporting metadata-only records for files whose binary contents are missing.
- Stage imported file blobs before changing records; restore previous usage history and stored metadata if an import fails.
- Handle FileReader errors explicitly.
- Update offline shell cache version.

# Release notes

## ZIP project foundation
- Converted the single-file application into a multi-file project layout.
- Extracted the existing CSS into `styles/app.css`.
- Extracted the existing JavaScript into `src/app.js`.
- Kept the existing HTML screen structure in `index.html`.
- Added a local Python development server.
- Added architecture notes and project integrity checks.

This is a packaging and maintainability milestone, not a claim that provider integrations
or full automated browser testing are complete.

## Modular domain milestone
- Extracted billing calculations and context-memory metrics into independent modules.
- Wired existing screens to shared domain functions.
- Added unit tests for billing conversion, recurring summaries, memory warnings and history ranges.

## Account domain milestone
- Extracted account lookup and provider association helpers into `src/modules/accounts.js`.
- Connected dashboard account resolution, account editing lookup, and provider account selectors to the module.
- Added tests for account lookup, provider filtering, active selection, and summary counts.

## File library domain milestone
- Extracted file categorization, category icons, filtering, sorting, and folder counts into `src/modules/files.js`.
- Connected the existing file library UI to shared module functions while keeping IndexedDB persistence stable.
- Added unit tests for classification, filtering, sorting, and category counts.

## Storage infrastructure milestone
- Extracted IndexedDB database creation and version-change handling into `src/modules/storage.js`.
- Moved file blob CRUD, file-key listing/clearing, usage-history reads/writes/replacement, and database diagnostics behind a storage API.
- Kept application state synchronization and rendering in the main app layer.
- Added tests for the storage API surface and explicit IndexedDB-unavailable behavior.

## Backup and installability milestone
- Extracted backup envelope creation and import validation into `src/modules/backup.js`.
- Added schema allow-list, duplicate file ID rejection, strict base64 data URL validation, and file-size guards.
- Added PWA manifest, custom vector app icon, service worker shell cache, and guarded service-worker registration.
- Expanded tests for backup validation and installability assets.

## Custom folders and application events
- Added schema version 6 with validated user-created folder records and file folder associations.
- Added custom folder creation, folder filtering, file organization through the existing Organize editor, and drag-and-drop moves.
- Deleting a folder unassigns its files rather than deleting file contents.
- Added a small event bus and emits a wallet state-saved event after successful state commits.
- Added tests for folder membership/counts and event subscription/unsubscription.

## Trial and renewal reminder development batch (2026-11-16)
- Added trial enrollment, duration, end date, cancellation deadline, status and offer terms to account records and editor.
- Added per-account warning windows (0–90 days) and in-app trial/payment reminders.
- Suppressed trial warnings for cancelled/converted trials and duplicate first-charge renewal alerts.
- Dates and offers are user-entered; no live offer discovery, email/push delivery or provider verification is implemented.
- Verified static project integrity, JavaScript syntax and domain unit tests; full mobile-browser interaction and notification delivery remain unverified.

## Creator income and data-integrity batch (schema 7)
- Added a mobile Creator Income screen with agreements, payout status, goals and three-month recurring revenue run-rate.
- Integrated creator records with the existing normalized wallet state and backup export/import.
- Added creator domain tests for reconciliation, date validation, duplicate IDs and year rollover.
- Fixed a file-library custom-folder filter temporal-dead-zone bug found during source review.
- Updated PWA shell cache to include the creator domain module.
- Pending: end-to-end mobile browser testing, automated provider integration, cash-flow date modeling, payment verification and push delivery.

## Creator action center and cash-date intelligence (v8)
- Added recurring due-date expansion with month-end anchoring and leap-year tests.
- Added date-specific three-month cash outlook, keeping agreement schedule and payout ledger separate to prevent double counting.
- Added prioritized action center for overdue creator payouts, near-term agreement milestones, trial cancellation deadlines and subscription renewals.
- Added duplicate payout reference and missing-reference reconciliation diagnostics.
- Added unit tests and updated offline asset cache. No background notification or financial provider sync is claimed.

## v9 — Revenue health and collection analytics

- Added `src/modules/analytics.js` with payout aging buckets, overdue totals, contracted recurring revenue concentration, and goal shortfall metrics.
- Added a revenue-health panel in Creator Income, preserving the existing action center, cash outlook, reconciliation, and recurring forecast.
- Added `tests/analytics.test.cjs` covering aging boundaries, concentration, empty data, income goals, and invalid dates.
- Financial figures remain manual-record based; no bank verification, automatic provider discovery, or closed-app push notifications.


## v10 — Reminder foundation
- Added subscription reminder center, on-device preferences, per-occurrence snooze and optional foreground browser notifications.
- Added notification click focus behavior, cache version bump and regression tests.
- Explicit limitation: no background push, server scheduling, live trial offer discovery or provider verified payment dates.

## v11 — Revenue planning and portable exports
- Added separate scenario planning for scheduled creator agreements (55%, 80%, 100% illustrative collection assumptions).
- Added UTF-8 CSV exports for the creator ledger and forecast, with spreadsheet formula-injection protection.
- Preserved separate scheduled contract and recorded payout amounts to avoid double counting.
- Added automated tests for forecasts, exports, month-end recurrence and invalid dates.
- No live payment feeds, provider offer discovery, closed-app notifications, or device-level mobile validation are claimed.

## v12 — Reconciliation review
- Added read-only payout review queue: duplicate references, missing references, ambiguous agreement matches, and exact client+amount candidate links.
- Added CSV export of review issues and candidate matches, escaping spreadsheet formula prefixes.
- Reconciliation does not modify payout status and does not assert bank verification.
- Added automated domain tests; browser/mobile interaction and real integrations remain unverified.


## v13 — Payout CSV review and import
- Staged CSV import for creator payouts with explicit user confirmation, required-column checks, strict positive decimal amounts, valid ISO dates, quoted CSV parsing, 1 MB / 2000-row caps and duplicate-reference suppression.
- Rechecks references before committing and uses existing state persistence/rollback. Does not perform bank verification.
- Refreshed offline shell cache list to include all current creator modules.
- Limitations: duplicate detection requires a nonempty transaction reference; no server sync, provider sync, background notifications or browser device testing.

## v14 — Subscription data integrity
- Added trial and renewal date audit, explicit account-edit shortcuts, and warnings for expired but unconfirmed trials.
- Fixed paid renewal alerts appearing during active trials with mismatched renewal dates.
- Updated offline cache and added audit and billing regression tests.
- No provider verification, background push, or automatic offer discovery.
- CSV imports now reject explicitly non-USD payouts and highlight missing references that cannot be reliably deduplicated.


## v15 — Calendar handoff and deadline portability
- Added portable iCalendar (.ics) export of manually entered trial cancellation deadlines, trial expiration dates, and upcoming subscription renewals.
- Includes a one-day-before VALARM for calendar applications that support imported alarms.
- Prevents active free trials from appearing as paid renewals, and excludes invalid dates.
- Escapes calendar content, folds UTF-8 lines, and uses all-day events with exclusive end dates.
- Tests cover leap years, year boundaries, invalid dates, cancellations, and ICS content.
- Limitations: Calendar import is user-controlled; external calendar apps may ignore alarms. No background push notifications or provider offer discovery.

## v16 — Rolling subscription calendar
- Calendar export supports 90-day, 12-month and 24-month horizons, anchored to the local date.
- Generates future weekly/monthly/yearly renewal occurrences, not just the next one.
- Monthly recurrence retains the original billing day where possible (e.g. January 31 → February 28 → March 31).
- Free-trial deadlines remain distinct from renewals; active trials do not generate paid renewal events.
- Invalid dates and invalid export horizons are rejected. No external calendar synchronization or closed-app notifications are claimed.
- Added automated horizon/recurrence tests. Browser compatibility remains unverified.


## v17 — Import mapping and data-health foundation
- Optional explicit CSV column mapping and opt-in fingerprint duplicate checks for payouts without transaction references. Existing import behavior remains unchanged by default.
- Read-only data-health audit for account/file referential integrity and creator payout references and amounts.
- Added dedicated automated regression tests; service-worker shell cache updated.
- No live financial verification, closed-app push delivery, or mobile device testing is claimed.

## v19 — Collections follow-up worklist
Prioritized pending payout collections with aging, due-soon totals, missing reference counts and formula-safe CSV export. No automated collection or payment verification.

## v20 — Offline cache isolation and update reliability
- Restrict Cache Storage to known application shell files; bypass unknown URLs, query strings and authorization requests.
- Network-first HTML navigation with offline fallback, to avoid indefinitely stale app pages.
- Delete only prior AI Wallet shell caches, preserving unrelated applications on the same origin.
- Add service-worker behavioral tests. Browser/PWA installation testing is still outstanding.

## v21 — File preview and backup import safety
- Restrict inline previews to a small allowlist of media and text formats; HTML, SVG, XML, JavaScript, and WebAssembly are download-only.
- Check both recorded file metadata and actual stored Blob MIME type before previewing.
- Sanitize filenames for download and prevent oversized backup imports (100 MB) from being read into memory.
- Version the offline shell and include the new file safety module.
- Automated checks cover file preview rules and offline cache migration. Browser security behavior and mobile device compatibility still need real-world testing.


## v25 — Import race protection and payload preflight
- Acquire the backup import lock before starting FileReader, so a second import or reset cannot race the read phase. Release the lock on read errors, aborts and synchronous read failures.
- Require portable, bounded file identifiers and integer numeric sizes, preventing silent normalization of malformed file metadata.
- Enforce a cumulative 100 MB decoded-file preflight limit in addition to the existing JSON backup file size limit.
- Extend backup validation regression checks. No claim of live browser storage-failure simulation.

## v29 — Upcoming payment forecast
- Add a 30/90/365-day scheduled payment forecast with account-level rows, event count, unique accounts, and cent-rounded totals.
- Reuse original billing anchors for month-end and leap-year recurrence. Active free trials are excluded until marked converted or cancelled; forecast is never presented as a verified charge.
- Add regression tests for recurring dates, trial exclusion, invalid dates, and horizon bounds.
