# Chrome Web Store Publishing Setup

This document covers the one-time setup required before automated publishing works, and explains the publish workflow in detail.

---

## Prerequisites

Before running the publish workflow for the first time, complete every step in this guide. Most steps are done once in external tools (Google Cloud Console, Chrome Developer Dashboard) and do not need to be repeated for future releases.

---

## Step 1 — Chrome Web Store developer account

1. Visit [https://chrome.google.com/webstore/devconsole](https://chrome.google.com/webstore/devconsole).
2. Sign in with the Google account that will own the extension.
3. Pay the one-time developer registration fee ($5 USD) if not already registered.

---

## Step 2 — Enable 2-Step Verification

The publishing account must have 2-Step Verification enabled. The Chrome Web Store API will reject OAuth credentials from accounts without it.

Go to [https://myaccount.google.com/security](https://myaccount.google.com/security) and enable 2-Step Verification.

---

## Step 3 — Create the Chrome Web Store item

1. In the [Developer Dashboard](https://chrome.google.com/webstore/devconsole), click **New Item**.
2. Upload a preliminary ZIP (can be your first build from `npm run package:extension`).
3. Note the **Extension ID** from the dashboard URL. This is your `CWS_EXTENSION_ID`.

---

## Step 4 — Complete the store listing

In the Developer Dashboard, fill in:

- Store listing: name, description, screenshots, promotional images
- Privacy tab: data usage declarations and privacy policy URL

The Chrome Web Store will not allow publishing until required fields are complete.

---

## Step 5 — Enable the Chrome Web Store API in Google Cloud

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com).
2. Create a new project or select an existing one.
3. Go to **APIs & Services > Library**.
4. Search for **Chrome Web Store API** and enable it.

---

## Step 6 — Create OAuth 2.0 credentials

1. In Google Cloud Console, go to **APIs & Services > Credentials**.
2. Click **Create Credentials > OAuth client ID**.
3. Set **Application type** to **Desktop app**.
4. Give it a name (e.g. `SnipBit CWS Publisher`).
5. Download or copy the **Client ID** and **Client Secret**.

These become the `CWS_CLIENT_ID` and `CWS_CLIENT_SECRET` secrets.

---

## Step 7 — Generate a refresh token

You must perform a one-time manual OAuth authorization to obtain a long-lived refresh token. The refresh token is then stored as a GitHub secret and exchanged for short-lived access tokens at publish time.

### Option A — Manual browser flow

1. In a browser, navigate to this URL (replace `YOUR_CLIENT_ID`):

```
https://accounts.google.com/o/oauth2/auth?response_type=code&scope=https://www.googleapis.com/auth/chromewebstore&redirect_uri=urn:ietf:wg:oauth:2.0:oob&client_id=YOUR_CLIENT_ID
```

2. Sign in with the publisher account and grant access.
3. Copy the authorization code shown.
4. Exchange the code for a refresh token:

```bash
curl -s \
  --data "client_id=YOUR_CLIENT_ID" \
  --data "client_secret=YOUR_CLIENT_SECRET" \
  --data "code=YOUR_AUTH_CODE" \
  --data "grant_type=authorization_code" \
  --data "redirect_uri=urn:ietf:wg:oauth:2.0:oob" \
  https://oauth2.googleapis.com/token
```

5. Copy the `refresh_token` value from the response. This is your `CWS_REFRESH_TOKEN`.

Note: refresh tokens do not expire unless the OAuth consent is revoked or the account password changes.

---

## Step 8 — Add GitHub environment secrets

In your GitHub repository, go to **Settings > Environments** and create an environment named exactly:

```
chrome-web-store-production
```

Enable required reviewers so that the publish job cannot run without manual approval.

Then add the following **secrets** to that environment:

| Secret name         | Description                                   |
| ------------------- | --------------------------------------------- |
| `CWS_EXTENSION_ID`  | Chrome Web Store item ID (from dashboard URL) |
| `CWS_CLIENT_ID`     | Google OAuth2 client ID                       |
| `CWS_CLIENT_SECRET` | Google OAuth2 client secret                   |
| `CWS_REFRESH_TOKEN` | Long-lived OAuth2 refresh token               |

Do not commit any of these values to the repository.

---

## Step 9 — Add repository variables (optional)

These are non-secret configuration values. Set them under **Settings > Variables > Repository variables**:

| Variable name    | Default     | Description                         |
| ---------------- | ----------- | ----------------------------------- |
| `EXTENSION_NAME` | `SnipBit`   | Display name used in release titles |
| `NODE_VERSION`   | `20`        | Node.js version for CI/CD workflows |
| `BUILD_DIR`      | `dist`      | Build output directory              |
| `PACKAGE_DIR`    | `artifacts` | ZIP output directory                |

---

## Step 10 — Run the first dry-run publish

Go to **Actions > Publish to Chrome Web Store > Run workflow**:

- `publish_type`: `DEFAULT_PUBLISH`
- `skip_review`: unchecked
- `dry_run`: **checked (true)**

Confirm:

- The job passes environment approval.
- The artifact is uploaded and the ZIP looks correct when downloaded.

---

## Step 11 — First real publish

Re-run the workflow with `dry_run` set to **false**.

After the workflow completes successfully:

- Check the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole) for the item status.
- The item will enter review. Public availability depends on review outcome.

---

## Secrets reference (never commit real values)

```
CWS_EXTENSION_ID     = <from Chrome Developer Dashboard item URL>
CWS_PUBLISHER_ID     = <your publisher account ID (for reference, not used in API calls)>
CWS_CLIENT_ID        = <Google Cloud OAuth client ID>
CWS_CLIENT_SECRET    = <Google Cloud OAuth client secret>
CWS_REFRESH_TOKEN    = <generated via one-time OAuth flow above>
```

---

## Publish workflow security model

- Publish only runs via `workflow_dispatch` — never on push or PR.
- The `chrome-web-store-production` GitHub environment requires manual approval before secrets are exposed.
- Secrets are scoped to the environment, not the repository — PRs and CI cannot access them.
- The publish script never logs the refresh token, client secret, or access token.
- Access tokens are short-lived (typically 1 hour) and exist only in the workflow runner memory.

---

## skipReview

`skipReview: true` requests that the item bypass the review queue. Chrome Web Store only allows this for items that:

- Have already been reviewed and published before.
- Meet specific eligibility criteria defined by Google.

Leave `skip_review` as `false` unless you have confirmed eligibility. Sending `skipReview=true` on an ineligible item causes the publish request to fail.

---

## Refresh token expiry and rotation

A refresh token does not expire on its own but becomes invalid if:

- The publisher account password changes.
- OAuth consent is explicitly revoked.
- The Google Cloud project or OAuth client is deleted.

If the token becomes invalid, repeat Step 7 to generate a new one and update the `CWS_REFRESH_TOKEN` secret.
