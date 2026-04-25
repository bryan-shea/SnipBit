<p align="center">
  <img width="708" height="216" alt="SnipBit logo" src="https://github.com/user-attachments/assets/3d465e6e-6dea-499d-9713-95273751ae83" />
</p>

<p align="center">
  <strong>Save, organize, and reuse text snippets from your browser — fast.</strong>
</p>

<p align="center">
  SnipBit is a local-first Manifest V3 Chrome extension with a quick-access popup, full side-panel library, collections, and right-click snippet capture.
</p>

<p align="center">
  <a href="https://github.com/bryan-shea/SnipBit/actions/workflows/ci.yml">
    <img alt="CI" src="https://github.com/bryan-shea/SnipBit/actions/workflows/ci.yml/badge.svg" />
  </a>
  <a href="https://github.com/bryan-shea/SnipBit/actions/workflows/package.yml">
    <img alt="Package" src="https://github.com/bryan-shea/SnipBit/actions/workflows/package.yml/badge.svg" />
  </a>
  <a href="https://github.com/bryan-shea/SnipBit/actions/workflows/release.yml">
    <img alt="Release" src="https://github.com/bryan-shea/SnipBit/actions/workflows/release.yml/badge.svg" />
  </a>
  <a href="https://github.com/bryan-shea/SnipBit/actions/workflows/publish-chrome.yml">
    <img alt="Chrome publish" src="https://github.com/bryan-shea/SnipBit/actions/workflows/publish-chrome.yml/badge.svg" />
  </a>
  <a href="https://github.com/bryan-shea/SnipBit/releases">
    <img alt="GitHub release" src="https://img.shields.io/github/v/release/bryan-shea/SnipBit?style=flat-square&logo=github" />
  </a>
</p>

<p align="center">
  <img alt="Chrome Web Store pending review" src="https://img.shields.io/badge/Chrome%20Web%20Store-Pending%20review-F59E0B?style=flat-square&logo=googlechrome&logoColor=white" />
  <img alt="Manifest V3" src="https://img.shields.io/badge/Manifest%20V3-Chrome-4285F4?style=flat-square&logo=googlechrome&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-Ready-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-UI-61DAFB?style=flat-square&logo=react&logoColor=111827" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-Build-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img alt="Local first" src="https://img.shields.io/badge/Local--first-No%20backend-16A34A?style=flat-square" />
  <img alt="No analytics" src="https://img.shields.io/badge/Privacy-No%20analytics-0F766E?style=flat-square" />
</p>

<p align="center">
  <a href="#features">Features</a>
  ·
  <a href="#screenshots">Screenshots</a>
  ·
  <a href="#install">Install</a>
  ·
  <a href="#development">Development</a>
  ·
  <a href="#permissions">Permissions</a>
  ·
  <a href="#roadmap">Roadmap</a>
</p>

---

## Overview

SnipBit is a focused snippet manager for Chrome. It helps you save reusable text, organize snippets into collections, and copy what you need without leaving your browser workflow.

Use it for:

- Email replies and follow-ups.
- Support responses.
- Sales/outreach templates.
- Research notes.
- Code/text fragments.
- Frequently reused links, blurbs, or prompts.

SnipBit runs locally in the browser. It does not require an account, backend, analytics service, or broad host permissions.

---

## Features

- **Quick copy workflow** — search and copy saved snippets from the toolbar popup.
- **Full snippet library** — create, edit, duplicate, delete, favorite, and organize snippets in the Chrome side panel.
- **Collections** — group related snippets and filter by All, Favorites, Unassigned, or a specific collection.
- **Right-click capture** — highlight text on a webpage and save it through `Save selection to SnipBit`.
- **Local-first storage** — persist snippets, collections, and preferences with `chrome.storage.local`.
- **Minimal permissions** — no host permissions, no remote code, no analytics, and no backend.
- **Chrome Web Store-ready packaging** — CI/CD scripts validate, build, package, release, and publish extension ZIPs.

---

## Screenshots

> PENDING

Create this folder and add the images below:

```txt
docs/assets/screenshots/
```

| Popup | Side Panel |
| --- | --- |
| <img src="docs/assets/screenshots/popup.png" alt="SnipBit popup showing searchable snippet cards" width="360" /> | <img src="docs/assets/screenshots/side-panel.png" alt="SnipBit side panel showing collections and snippet editor" width="520" /> |

| Save Selection | Collections |
| --- | --- |
| <img src="docs/assets/screenshots/context-menu.png" alt="Right-click context menu for saving selected text to SnipBit" width="420" /> | <img src="docs/assets/screenshots/collections.png" alt="SnipBit collections sidebar and snippet list" width="520" /> |

---

## How it works

SnipBit has three primary surfaces:

| Surface | Purpose |
| --- | --- |
| **Popup** | Fast search, filtering, and one-click snippet copy. |
| **Side panel** | Full library management, editing, collections, and preferences. |
| **Context menu** | Save highlighted webpage text directly into SnipBit. |

The extension stores all user data locally in Chrome extension storage.

---

## Collections

Collections are named groups for keeping related snippets together.

### Collection workflows

- Create a collection from the side panel sidebar.
- Assign a snippet to a collection when creating or editing it.
- Move a snippet between collections by changing its Collection field.
- Filter snippets by All, Favorites, Unassigned, or any collection.
- View the same collection filters in the popup.
- Save highlighted text to the default collection when configured, or to Unassigned by default.

### Deleting a collection

Deleting a collection does **not** delete its snippets.

When a collection is deleted:

1. Snippets inside the collection are kept.
2. Their `collectionId` is set to `null`.
3. Those snippets move to **Unassigned**.

A confirmation dialog explains this before the deletion completes.

---

## Storage

SnipBit uses local Chrome extension storage.

| Key | Contents |
| --- | --- |
| `snipbit.snippets` | All snippets |
| `snipbit.collections` | All collections |
| `snipbit.preferences` | User preferences, default collection, and sort modes |

Existing data from before collections were added migrates automatically. Snippets without a `collectionId` field are treated as Unassigned.

---

## Install

```bash
npm install
```

---

## Development

```bash
npm run dev
```

`npm run dev` uses `vite build --watch`, which rebuilds the unpacked extension output in `dist/`.

After changes, reload the extension from:

```txt
chrome://extensions
```

---

## Typecheck and build

```bash
npm run typecheck
npm run build
```

---

## Load unpacked in Chrome

1. Run:

   ```bash
   npm run build
   ```

2. Open:

   ```txt
   chrome://extensions
   ```

3. Enable **Developer Mode**.
4. Click **Load unpacked**.
5. Select the generated `dist/` folder.
6. Pin SnipBit to your toolbar.
7. Open the popup or use **Manage library** to open the side panel.

---

## Permissions

SnipBit requests only the permissions needed for its core workflows.

| Permission | Why it is used |
| --- | --- |
| `storage` | Stores snippets, collections, and preferences locally on the device. |
| `contextMenus` | Adds the `Save selection to SnipBit` right-click action. |
| `sidePanel` | Opens the richer management UI from the popup. |

SnipBit does **not** request host permissions, inject remote code, use analytics, or require a backend.

---

## Privacy

SnipBit is designed to be local-first.

- No account required.
- No analytics.
- No backend.
- No remote code.
- No host permissions.
- No third-party data sharing.
- Snippets are stored locally with `chrome.storage.local`.

---

## Local commands

```bash
# Type check
npm run typecheck

# Lint
npm run lint

# Build
npm run build

# Validate the built extension
npm run validate:extension

# Package into a Chrome Web Store-ready ZIP
npm run package:extension

# Full pre-release check
npm run release:check
```

Packaged extension ZIPs are generated in:

```txt
artifacts/
```

Example output:

```txt
artifacts/snipbit-chrome-vX.Y.Z.zip
```

---

## Release process

For a normal update:

1. Make changes on a feature branch.
2. Open a pull request.
3. Wait for CI to pass.
4. Merge to `main`.
5. Bump the extension version.
6. Commit the version bump.
7. Push a tag like `v1.0.1`.
8. Confirm the GitHub Release was created with the packaged ZIP.
9. Run the Chrome Web Store publish workflow with `dry_run: true`.
10. Run the Chrome Web Store publish workflow with `dry_run: false`.

Chrome Web Store publishing should not run automatically on every push to `main`.

---

## Roadmap

### Planned

- Import/export for snippet backups.
- Collection-specific context menu save.
- Drag-and-drop ordering for snippets and collections.
- Keyboard shortcuts for filtering, creating, and copying snippets.
- Optional sync support.
- Richer metadata views for captured page snippets.
- More polished screenshot/demo assets for the public repo and Chrome Web Store listing.

### Current limitations

- No nested folders.
- No drag-and-drop ordering yet.
- No import/export yet.
- Context-menu capture saves to the default collection or Unassigned.
- Keyboard hints are stored but not wired to commands yet.
- Clipboard writes rely on extension-page permissions and a DOM fallback, so browser-specific clipboard quirks can still apply.
- The side panel is optimized for Chromium browsers that support the Manifest V3 `sidePanel` API.

---

## Documentation

| Document | Purpose |
| --- | --- |
| [`docs/releasing.md`](docs/releasing.md) | Release checklist, versioning, and GitHub Release flow. |
| [`docs/chrome-web-store-publishing.md`](docs/chrome-web-store-publishing.md) | Chrome Web Store API setup, required secrets, and publishing workflow. |

---

## Contributing

This project is early and intentionally focused.

Before contributing:

1. Open an issue or discussion for larger changes.
2. Keep PRs small and scoped.
3. Run local checks before opening a pull request.

```bash
npm run typecheck
npm run lint
npm run build
npm run validate:extension
```

---

## Support

Use GitHub Issues for bugs, feature requests, and release/publishing problems:

- [Report a bug](https://github.com/bryan-shea/SnipBit/issues/new?template=bug_report.md)
- [Request a feature](https://github.com/bryan-shea/SnipBit/issues/new?template=feature_request.md)

---

## License

License information has not been added yet.
