# Google Drive OAuth setup for DomAIn

The public static site uses Google Identity Services token-based OAuth and Google Drive REST APIs. The OAuth **web client ID** is public; a **client secret is not used or needed** in the browser.

## Google account owner actions

1. Open https://console.cloud.google.com/ and select or create a Google Cloud project named **DomAIn**.
2. Enable **Google Drive API** under APIs & Services → Library.
3. Open Google Auth Platform → Branding and fill in the app name **DomAIn**, support email, and contact email.
4. Configure **Audience** (External if using a personal Google account). In testing mode, add the Google account that will test DomAIn under **Test users**.
5. Under **Data access**, add the minimum Google Drive scopes required by the current app:
   - `https://www.googleapis.com/auth/drive.readonly` (read user-selected Drive folder and its files)
   - `https://www.googleapis.com/auth/drive.appdata` (store private DomAIn backup files in appDataFolder)
   Google may require verification before public production use, particularly for restricted scopes. Do not publish to broad users until reviewed.
6. Open Google Auth Platform → Clients → **Create client** → **Web application**. Name it **DomAIn Web**.
7. Under **Authorized JavaScript origins**, enter the exact origin of the deployed website, e.g. `https://fatespassage.github.io` **only if that is the actual origin**. For local development add `http://localhost:8000` only if you use that origin. Origins contain scheme, host and optional port, **not** a path.
8. Create the client and copy its `...apps.googleusercontent.com` **Client ID**. Do not share a client secret. In DomAIn → Media Library → Google Drive sync, paste the Client ID, then click Connect Google and approve the requested scopes.

## Validation

- Confirm OAuth works from the exact deployed origin, including popup behavior.
- Import a Drive folder containing one small PNG; import it again and confirm it is skipped.
- Change the source file, import again, and confirm the existing library entry updates instead of duplicating.
- Create a private Drive backup and download the latest backup.
- Verify that disconnect revokes the session token and that no access token or client secret is persisted in local storage.
- Check Google Cloud's consent screen and scope verification requirements before any commercial launch.

## Security note

The app currently uses browser session-only access tokens and client-side local file storage. This is **not** a production backend with secure server-side token storage, scheduled background sync, or multi-provider OAuth. Those require additional architecture and verification. Never put Google client secrets into GitHub, frontend files, or GitHub Pages settings.
