# AI Wallet

AI Wallet is a mobile-first workspace for organizing AI provider accounts, subscriptions,
usage, conversation context, generated files, and creator revenue.

## Project structure

- `index.html` — application shell and screen markup
- `styles/app.css` — visual system and responsive styling
- `src/app.js` — current application behavior
- `docs/` — architecture and development notes
- `tests/` — lightweight project integrity checks
- `serve.py` — local development server

## Run locally

Requires Python 3.

```bash
python3 serve.py
```

Then open http://127.0.0.1:8000 in a browser.

The project includes a baseline installable-web-app manifest and offline shell cache. Service workers require localhost or HTTPS.\n\nThe current build is a local-first prototype. Provider usage, chat-context data,
and payments are not automatically verified unless a supported provider integration
is implemented and authorized. Manually entered values must be treated as estimates
or user-recorded information.

## Development checks

```bash
node --check src/app.js
node --check src/modules/billing.js
node --check src/modules/memory.js
node --check src/modules/accounts.js
node --check src/modules/files.js
node --check src/modules/storage.js
node --check src/modules/backup.js
node --check src/modules/events.js
node tests/domain.test.cjs
python3 tests/check_project.py
```

## Data safety

Before replacing an older build, export an AI Wallet backup from within the app.
Browser storage belongs to the browser profile and origin; running this project at a
different origin may not automatically see data saved by an earlier standalone HTML file.

### Trial and subscription alerts
Open an account profile to record trial start, length, end date, cancellation deadline,
trial status, offer terms, and a warning lead time. The Usage screen displays
upcoming cancellation and renewal reminders. Alerts are calculated locally when
AI Wallet is open; they are **not** background notifications. Trial offers are
not automatically discovered or verified. Always confirm cancellation requirements
with the provider.

## Creator income milestone (schema 7)

Creator Income records recurring agreements, manual payouts, paid/pending reconciliation, monthly income goals and a three-month contracted-revenue run-rate forecast. Existing schema 6 data migrates without deleting accounts or file references. Wallet JSON backups include creator records. The forecast is a monthly-equivalent run rate, **not** a cash-date projection or verified bank balance. No bank sync, invoicing, payment processing, automatic offer discovery, or push notifications are implemented.

## Intelligence batch v8

The Creator Income screen now includes an action center combining locally calculated trial/renewal warnings with creator payout follow-ups and agreement milestones. A separate cash-date outlook displays scheduled agreements, recorded pending payouts and recorded received payouts **in separate columns** to avoid double counting. Dates are manually recorded, and future scheduled amounts are estimates, not guaranteed payments. Reconciliation checks flag duplicate references and missing references; no external bank verification occurs. Alerts appear only while the app is open.

## Revenue health batch v9

The Creator Income dashboard now provides collection aging (1–30, 31–60, and 61+ days overdue), recurring-revenue client concentration, and monthly income-goal shortfall. The calculations use existing manually entered records; they are not audited income or bank-reconciled cash. Run `node tests/analytics.test.cjs` to verify the new analytics module.

## Reminder center (v10)

Subscription trial cancellation, trial end and renewal reminders are computed from manually entered dates. Users can change the global lead time, disable reminders and snooze a specific occurrence until the following day. Preferences are device-local and separate from the wallet backup. With permission, the app attempts one browser notification per occurrence per day for deadlines within one day **only while the app is open or returns to focus**. No push subscription, server scheduler or reliable closed-app notification delivery exists. The notification permission button must be clicked by the user.

Test with `node tests/reminders.test.cjs`.

## File safety (v21)
Potentially active file formats such as HTML and SVG are download-only instead of being previewed inside the app. Backup JSON imports are limited to 100 MB. Exported backups may still be larger, so keep an independent backup copy. This does not constitute malware scanning.


### v30 trial watchlist
The Usage page now includes a free-trial watchlist and date consistency warnings. Dates are entered by users and should be checked against provider terms.
