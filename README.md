# AI Wallet

Mobile-first AI account, subscription, free-trial, usage-limit, generated-file, and creator-income manager.

## Launch

**[Open AI Wallet](https://fatespassage.github.io/AI-Wallet/)** (requires a successful GitHub Pages deployment).

The browser application source is in [`AI_Wallet_Project/`](./AI_Wallet_Project/), with [`AI_Wallet_Project/index.html`](./AI_Wallet_Project/index.html) as its entry point. The GitHub Actions Pages workflow publishes the **contents** of that folder as the website root.

## Status

The v31 application source has been uploaded. GitHub Pages deployment and real-browser functionality still require verification; do not interpret source presence as proof of a working release.

## Development workflow

- `main`: stable releases and GitHub Pages deployment.
- `develop`: integration and testing before promotion to `main`.
- Automated checks: `.github/workflows/validate.yml`.
- Pages deployment: `.github/workflows/pages.yml`.
- Never commit credentials, API keys, tokens, or personal account exports.
- Validate browser behavior before promoting a release.
