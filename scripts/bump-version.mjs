#!/usr/bin/env node
/**
 * Bumps the version in manifest.json and package.json.
 *
 * manifest.json is the source of truth for the Chrome extension version.
 * package.json is kept in sync so tooling stays consistent.
 *
 * Usage:
 *   node scripts/bump-version.mjs [patch|minor|major]
 *
 * Or via npm scripts:
 *   npm run version:patch
 *   npm run version:minor
 *   npm run version:major
 *
 * After running, commit both files and push the tag:
 *   git add manifest.json package.json
 *   git commit -m "chore: bump version to vX.Y.Z"
 *   git tag vX.Y.Z
 *   git push origin main --tags
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');

const bumpType = process.argv[2];

if (!['patch', 'minor', 'major'].includes(bumpType)) {
  console.error('Usage: node scripts/bump-version.mjs [patch|minor|major]');
  process.exit(1);
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

function writeJson(filePath, data) {
  writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function bumpVersion(current, type) {
  const parts = current.split('.').map(Number);
  // Normalise to 3 parts
  while (parts.length < 3) parts.push(0);

  if (type === 'major') {
    parts[0]++;
    parts[1] = 0;
    parts[2] = 0;
  } else if (type === 'minor') {
    parts[1]++;
    parts[2] = 0;
  } else {
    parts[2]++;
  }

  return parts.join('.');
}

const manifestPath = join(ROOT, 'manifest.json');
const packagePath = join(ROOT, 'package.json');

const manifest = readJson(manifestPath);
const pkg = readJson(packagePath);

const currentVersion = manifest.version;
if (!currentVersion) {
  console.error('manifest.json does not have a "version" field.');
  process.exit(1);
}

const newVersion = bumpVersion(currentVersion, bumpType);

manifest.version = newVersion;
pkg.version = newVersion;

writeJson(manifestPath, manifest);
writeJson(packagePath, pkg);

console.log(`Version bumped (${bumpType}): ${currentVersion} -> ${newVersion}`);
console.log('Updated: manifest.json, package.json');
console.log('');
console.log('Next steps:');
console.log(`  git add manifest.json package.json`);
console.log(`  git commit -m "chore: bump version to v${newVersion}"`);
console.log(`  git tag v${newVersion}`);
console.log(`  git push origin main --tags`);
