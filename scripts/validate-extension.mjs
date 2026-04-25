#!/usr/bin/env node
/**
 * Validates the built Chrome extension output before packaging or publishing.
 *
 * Checks:
 *   - Build directory exists
 *   - manifest.json present and parseable
 *   - manifest_version is 3
 *   - name and description are present
 *   - version is valid Chrome extension format (1-4 dot-separated integers)
 *   - Icons referenced in manifest exist on disk
 *   - action.default_popup exists if declared
 *   - side_panel.default_path exists if declared
 *   - background.service_worker exists if declared
 *   - No source maps shipped (unless ALLOW_SOURCE_MAPS=true)
 *   - No .env, .pem, or .key files shipped
 *   - No src/ directory leaked into build output
 *
 * Usage:
 *   node scripts/validate-extension.mjs
 *   npm run validate:extension
 *
 * Environment variables:
 *   BUILD_DIR          Override build output directory (default: dist)
 *   ALLOW_SOURCE_MAPS  Set to "true" to suppress source map warnings
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');
const BUILD_DIR = process.env.BUILD_DIR || 'dist';
const buildPath = join(ROOT, BUILD_DIR);

let errors = 0;
let warnings = 0;

function fail(msg) {
  console.error(`  [ERROR] ${msg}`);
  errors++;
}

function warn(msg) {
  console.warn(`  [WARN]  ${msg}`);
  warnings++;
}

function pass(msg) {
  console.log(`  [OK]    ${msg}`);
}

function check(condition, passMsg, failMsg) {
  if (condition) {
    pass(passMsg);
    return true;
  }
  fail(failMsg);
  return false;
}

function walkDir(dir, callback) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const relPath = relative(buildPath, fullPath);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath, callback);
    } else {
      callback(fullPath, relPath, entry);
    }
  }
}

console.log(`\nValidating Chrome extension build: ${BUILD_DIR}/\n`);

// 1. Build directory exists
if (
  !check(
    existsSync(buildPath),
    `Build directory exists: ${BUILD_DIR}/`,
    `Build directory not found: ${buildPath}\n         Run "npm run build" first.`,
  )
) {
  process.exit(1);
}

// 2. manifest.json exists
const manifestPath = join(buildPath, 'manifest.json');
if (
  !check(
    existsSync(manifestPath),
    'manifest.json found in build output',
    'manifest.json not found in build output',
  )
) {
  process.exit(1);
}

// 3. Parse manifest
let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  pass('manifest.json is valid JSON');
} catch (e) {
  fail(`manifest.json could not be parsed: ${e.message}`);
  process.exit(1);
}

// 4. manifest_version is 3
check(
  manifest.manifest_version === 3,
  'manifest_version is 3',
  `manifest_version must be 3, got: ${manifest.manifest_version}`,
);

// 5. name present
check(
  typeof manifest.name === 'string' && manifest.name.length > 0,
  `name is present: "${manifest.name}"`,
  'manifest.name is missing or empty',
);

// 6. description present
check(
  typeof manifest.description === 'string' && manifest.description.length > 0,
  'description is present',
  'manifest.description is missing or empty',
);

// 7. version format: 1-4 dot-separated integers (each 0-65535)
const VERSION_RE = /^\d+(\.\d+){0,3}$/;
const versionValid =
  typeof manifest.version === 'string' &&
  VERSION_RE.test(manifest.version) &&
  manifest.version.split('.').every((n) => Number(n) <= 65535);

check(
  versionValid,
  `version is valid: "${manifest.version}"`,
  `manifest.version is invalid: "${manifest.version}" — expected 1 to 4 dot-separated integers (each 0-65535)`,
);

// 8. version_name is optional but valid if present
if (manifest.version_name !== undefined) {
  check(
    typeof manifest.version_name === 'string' && manifest.version_name.length > 0,
    `version_name is present: "${manifest.version_name}"`,
    'manifest.version_name is set but empty or not a string',
  );
}

// 9. Icons referenced in manifest exist
if (manifest.icons && typeof manifest.icons === 'object') {
  for (const [size, iconPath] of Object.entries(manifest.icons)) {
    const fullPath = join(buildPath, iconPath);
    check(
      existsSync(fullPath),
      `icon ${size}px exists: ${iconPath}`,
      `icon ${size}px not found: ${iconPath}`,
    );
  }
}

// Also check action.default_icon if declared separately
if (manifest.action?.default_icon && typeof manifest.action.default_icon === 'object') {
  for (const [size, iconPath] of Object.entries(manifest.action.default_icon)) {
    const fullPath = join(buildPath, iconPath);
    check(
      existsSync(fullPath),
      `action icon ${size}px exists: ${iconPath}`,
      `action icon ${size}px not found: ${iconPath}`,
    );
  }
}

// 10. Action popup exists if declared
if (manifest.action?.default_popup) {
  const popupPath = join(buildPath, manifest.action.default_popup);
  check(
    existsSync(popupPath),
    `action popup exists: ${manifest.action.default_popup}`,
    `action popup not found: ${manifest.action.default_popup}`,
  );
}

// 11. Side panel path exists if declared
if (manifest.side_panel?.default_path) {
  const sidePanelPath = join(buildPath, manifest.side_panel.default_path);
  check(
    existsSync(sidePanelPath),
    `side_panel.default_path exists: ${manifest.side_panel.default_path}`,
    `side_panel.default_path not found: ${manifest.side_panel.default_path}`,
  );
}

// 12. Background service worker exists if declared
if (manifest.background?.service_worker) {
  const swPath = join(buildPath, manifest.background.service_worker);
  check(
    existsSync(swPath),
    `background service_worker exists: ${manifest.background.service_worker}`,
    `background service_worker not found: ${manifest.background.service_worker}`,
  );
}

// 13. Walk build directory for forbidden or unexpected files
const FORBIDDEN_SUFFIXES = ['.pem', '.key'];
const FORBIDDEN_NAMES = ['.env'];
const ALLOW_SOURCE_MAPS = process.env.ALLOW_SOURCE_MAPS === 'true';

walkDir(buildPath, (_fullPath, relPath, name) => {
  // Source maps
  if (name.endsWith('.map') && !ALLOW_SOURCE_MAPS) {
    warn(`Source map found (set ALLOW_SOURCE_MAPS=true to suppress): ${relPath}`);
  }

  // Forbidden file suffixes
  for (const suffix of FORBIDDEN_SUFFIXES) {
    if (name.endsWith(suffix)) {
      fail(`Forbidden file type in build output: ${relPath}`);
    }
  }

  // Forbidden file names
  for (const forbidden of FORBIDDEN_NAMES) {
    if (name === forbidden || name.startsWith(`${forbidden}.`)) {
      fail(`Forbidden file in build output: ${relPath}`);
    }
  }

  // Test fixture / spec files
  if (name.endsWith('.test.js') || name.endsWith('.spec.js')) {
    warn(`Test file found in build output: ${relPath}`);
  }
});

// 14. No src/ directory leaked into build
const srcInBuild = join(buildPath, 'src');
if (existsSync(srcInBuild)) {
  fail('Source directory "src/" found in build output — source files must not be shipped');
}

// Summary
console.log('');
if (errors > 0) {
  console.error(`Validation FAILED: ${errors} error(s), ${warnings} warning(s).`);
  process.exit(1);
} else if (warnings > 0) {
  console.warn(`Validation PASSED with ${warnings} warning(s). Review warnings before publishing.`);
} else {
  console.log('Validation PASSED. Extension build is ready for packaging.');
}
