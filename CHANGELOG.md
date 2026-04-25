# Changelog

All notable changes to SnipBit are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
SnipBit uses semantic versioning: `MAJOR.MINOR.PATCH`.

---

## [Unreleased]

### Added

- CI/CD pipeline with GitHub Actions (CI, package, release, and publish workflows)
- `scripts/validate-extension.mjs` — validates the built extension before packaging
- `scripts/package-extension.mjs` — packages the extension into a Chrome Web Store-ready ZIP
- `scripts/bump-version.mjs` — bumps version in `manifest.json` and `package.json` together
- `scripts/publish-chrome-web-store.mjs` — publishes to the Chrome Web Store via the official API
- `docs/releasing.md` — release checklist and process documentation
- `docs/chrome-web-store-publishing.md` — Chrome Web Store first-time setup guide
- GitHub issue templates and pull request template

---

## [0.1.0] — Initial release

### Added

- Popup for quick snippet access from the Chrome toolbar.
- Side panel for full snippet management.
- Create, edit, delete, duplicate, favorite, and search snippets.
- Copy snippets to clipboard from popup or side panel.
- Save highlighted page text via the right-click context menu.
- Collections for grouping related snippets.
- Filter by All, Favorites, Unassigned, or any collection.
- Local storage only — no backend, no remote data.
- Demo snippets on first run.
