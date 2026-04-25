# Releasing SnipBit

This document covers the full release process: local verification, tagging, creating a GitHub Release, and publishing to the Chrome Web Store.

---

## Source of truth for versioning

`manifest.json` is the source of truth for the Chrome extension version. `package.json` is kept in sync. Do not bump them independently.

Chrome Web Store requires each uploaded version to be strictly greater than the previously uploaded version. Attempting to upload the same version twice will fail.

---

## Required tools

- Node.js 20+ with npm
- Git
- `zip` command available on your PATH
  - Linux/macOS: included by default
  - Windows: install via Git Bash, WSL, or `choco install zip`
- GitHub CLI (`gh`) for local release creation (optional)

---

## Release checklist

### 1. Develop and test locally

```bash
npm run dev
# Load dist/ as an unpacked extension in Chrome and test your changes.
```

### 2. Open a pull request

Push a feature branch, open a PR, and wait for CI to pass. CI runs on every pull request:

- Type check
- Lint
- Build
- Extension validation
- Artifact upload

### 3. Merge the PR

Merge after CI passes. Do not bump the version until you are ready to release.

### 4. Bump the version

From the `main` branch after merging:

```bash
# Choose one:
npm run version:patch   # 0.1.0 -> 0.1.1
npm run version:minor   # 0.1.0 -> 0.2.0
npm run version:major   # 0.1.0 -> 1.0.0
```

This updates both `manifest.json` and `package.json`.

### 5. Run the pre-release check

```bash
npm run release:check
```

This runs: build -> validate extension -> package extension. Fix any errors before continuing.

### 6. Commit and tag

```bash
git add manifest.json package.json
git commit -m "chore: bump version to v1.0.0"
git tag v1.0.0
git push origin main --tags
```

Pushing the tag automatically triggers the Release workflow on GitHub.

### 7. Verify the GitHub Release

The Release workflow:

- Checks out the tagged commit
- Builds and validates the extension
- Confirms the manifest version matches the tag
- Packages the ZIP
- Creates a GitHub Release and attaches the ZIP

Visit the [Releases page](https://github.com/bryan-shea/SnipBit/releases) to confirm the release was created and the ZIP is attached.

### 8. Publish a dry run first

Go to **Actions > Publish to Chrome Web Store > Run workflow** and set:

- `publish_type`: `DEFAULT_PUBLISH`
- `skip_review`: unchecked
- `dry_run`: **checked (true)**

This builds and packages the extension but does not upload. Inspect the artifact to confirm it looks correct.

### 9. Publish for real

Re-run the workflow with `dry_run` set to **false**. The job requires approval from the `chrome-web-store-production` environment before production secrets are exposed.

After approval, the workflow:

- Exchanges the refresh token for an access token
- Uploads the ZIP to the Chrome Web Store API
- Submits the publish request

---

## Triggering a release manually (without a tag push)

If you need to create a release for an existing tag without pushing again:

1. Go to **Actions > Release > Run workflow**.
2. Enter the existing tag name (e.g. `v1.0.0`).
3. The workflow will check out that tag, build, validate, package, and create the release.

---

## What to do if Chrome Web Store review rejects an update

1. Review the rejection reason in the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. Fix the issue in your code.
3. Bump the version (the rejected version cannot be reused — you must increment).
4. Follow the release checklist from step 4.
5. Resubmit.

Common rejection reasons:

- Overly broad permissions not justified in the listing description
- Privacy policy missing or inadequate
- Misleading store listing content
- Policy violations in extension functionality

---

## What to do if an upload fails

1. Check the workflow logs for the specific error from the Chrome Web Store API.
2. Common causes:
   - Version already exists — bump the version.
   - Invalid ZIP structure — run `npm run validate:extension` and `npm run package:extension` locally.
   - Expired or invalid OAuth credentials — regenerate the refresh token (see [chrome-web-store-publishing.md](./chrome-web-store-publishing.md)).
   - Extension ID mismatch — confirm `CWS_EXTENSION_ID` in the environment secret.

---

## Staging a release (trusted testers only)

To release to trusted testers before a full public release:

1. Run the **Publish to Chrome Web Store** workflow.
2. Set `publish_type` to `STAGED_PUBLISH`.
3. Only users in your trusted tester group will receive the update.
4. When ready for full release, run again with `publish_type: DEFAULT_PUBLISH`.

---

## Future updates — repeating the cycle

For every future update:

1. Develop on a branch.
2. Open a PR and wait for CI.
3. Merge.
4. Bump version.
5. Run `npm run release:check`.
6. Commit, tag, push.
7. Confirm the GitHub Release.
8. Run publish dry run.
9. Run publish for real.
