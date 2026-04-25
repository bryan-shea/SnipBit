<p align="center">
  <img src="src/assets/Logo.png" alt="SnipBit" width="320" />
</p>

[![CI](https://github.com/bryan-shea/SnipBit/actions/workflows/ci.yml/badge.svg)](https://github.com/bryan-shea/SnipBit/actions/workflows/ci.yml)

SnipBit is a Manifest V3 Chrome extension for saving, searching, favoriting, copying, and reusing text snippets without any backend. It includes a compact popup for quick access, a side panel for full snippet management including collections, and a right-click workflow for saving highlighted text from normal webpages.

## Features

- Create snippets manually from the side panel.
- Edit, delete, duplicate, favorite, and search snippets.
- Copy snippets from the popup or side panel.
- Save highlighted page text through the context menu item `Save selection to SnipBit`.
- Organize snippets into collections.
- Filter snippets by collection in both the popup and side panel.
- Persist all data locally with `chrome.storage.local`.
- Seed a few demo snippets on first run only. Remove them by setting `ENABLE_DEMO_SNIPPETS` to `false` in `src/services/snippetStorage.ts`.

## Collections

Collections are named groups that keep related snippets together.

### How it works

- Create a collection from the side panel sidebar.
- Assign any snippet to a collection when creating or editing it.
- Move a snippet between collections by editing its Collection field.
- Filter the snippet list by All, Favorites, Unassigned, or any collection.
- The popup shows the same collection filters as compact chips above the search bar.
- Snippets captured from the right-click context menu save to Unassigned by default. Set `defaultCollectionId` in preferences storage to assign them automatically.

### Deleting a collection

Deleting a collection does not delete its snippets. All affected snippets move to Unassigned. A confirmation dialog explains this before the action completes.

### Storage keys

| Key                   | Contents                                          |
| --------------------- | ------------------------------------------------- |
| `snipbit.snippets`    | All snippets                                      |
| `snipbit.collections` | All collections                                   |
| `snipbit.preferences` | User preferences (default collection, sort modes) |

Existing data from before collections were added migrates automatically. Snippets without a `collectionId` field are treated as Unassigned.

## Current limitations

- No nested folders.
- No drag-and-drop ordering of collections or snippets.
- No import or export of snippets or collections.
- The right-click context menu always saves to the default collection (or Unassigned). There is no submenu to choose a collection at capture time.
- No keyboard shortcuts for collections.
- No cloud sync.

## Future improvements

- Drag-and-drop ordering for collections and snippets.
- Nested folders.
- Import and export (JSON, CSV).
- Collection-specific context menu save (`Save to... > [collection name]`).
- Keyboard shortcuts for filtering and creating snippets.
- Sync support via `chrome.storage.sync`.

## Install

```bash
npm install
```

## Development

```bash
npm run dev
```

`npm run dev` uses `vite build --watch`, which rebuilds the unpacked extension output in `dist/`. Reload the extension from `chrome://extensions` after changes.

## Typecheck And Build

```bash
npm run typecheck
npm run build
```

## Load Unpacked In Chrome

1. Run `npm run build`.
2. Open `chrome://extensions`.
3. Enable Developer Mode.
4. Click `Load unpacked`.
5. Select the generated `dist/` folder.

After loading, use the toolbar action for the popup, or pin the extension and use the `Manage library` button to open the side panel.

## Permissions

- `storage`: Stores snippets locally on the device.
- `contextMenus`: Adds the `Save selection to SnipBit` right-click action.
- `sidePanel`: Opens the richer management UI from the popup.

SnipBit does not request host permissions, inject remote code, use analytics, or require a backend.

## Current Limitations

- Clipboard writes rely on extension-page permissions and a DOM fallback, so browser-specific clipboard quirks can still apply.
- The side panel is optimized for Chromium browsers that support the Manifest V3 `sidePanel` API.
- Keyboard hints are stored for future shortcut support, but they are not wired to commands yet.

## Future Enhancements

- Add import and export for snippet backups.
- Add snippet folders or saved filters.
- Add keyboard shortcuts and optional quick-insert workflows.
- Add richer metadata views for captured page snippets.

---

## CI/CD

### Local commands

```bash
# Type check
npm run typecheck

# Lint
npm run lint

# Build
npm run build

# Validate the built extension
npm run validate:extension

# Package into a Chrome Web Store-ready ZIP (artifacts/snipbit-chrome-vX.Y.Z.zip)
npm run package:extension

# Full pre-release check (build + validate + package)
npm run release:check
```

### Version bumping

`manifest.json` is the source of truth for the Chrome extension version. `package.json` is kept in sync automatically.

```bash
npm run version:patch   # 0.1.0 -> 0.1.1
npm run version:minor   # 0.1.0 -> 0.2.0
npm run version:major   # 0.1.0 -> 1.0.0
```

After bumping, commit and push the tag to trigger a GitHub Release:

```bash
git add manifest.json package.json
git commit -m "chore: bump version to v1.0.0"
git tag v1.0.0
git push origin main --tags
```

### Workflows

| Workflow | Trigger                       | Purpose                                            |
| -------- | ----------------------------- | -------------------------------------------------- |
| CI       | Push to `main`, pull requests | Type check, lint, build, validate, upload artifact |
| Package  | Manual (`workflow_dispatch`)  | Build and package a ZIP for inspection             |
| Release  | Tag push `v*.*.*` or manual   | Create GitHub Release with ZIP attached            |
| Publish  | Manual (`workflow_dispatch`)  | Upload and publish to the Chrome Web Store         |

### Required GitHub secrets and variables

See [docs/chrome-web-store-publishing.md](docs/chrome-web-store-publishing.md) for the full setup guide.

**Environment secrets** (set on the `chrome-web-store-production` environment):

| Secret              | Description                     |
| ------------------- | ------------------------------- |
| `CWS_EXTENSION_ID`  | Chrome Web Store item ID        |
| `CWS_CLIENT_ID`     | Google OAuth2 client ID         |
| `CWS_CLIENT_SECRET` | Google OAuth2 client secret     |
| `CWS_REFRESH_TOKEN` | Long-lived OAuth2 refresh token |

**Repository variables** (optional overrides):

| Variable         | Default     | Description                       |
| ---------------- | ----------- | --------------------------------- |
| `EXTENSION_NAME` | `SnipBit`   | Display name for release titles   |
| `NODE_VERSION`   | `20`        | Node.js version for all workflows |
| `BUILD_DIR`      | `dist`      | Build output directory            |
| `PACKAGE_DIR`    | `artifacts` | ZIP output directory              |

For the full release process, see [docs/releasing.md](docs/releasing.md).
