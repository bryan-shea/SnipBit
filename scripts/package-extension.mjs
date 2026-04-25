#!/usr/bin/env node
/**
 * Packages the built Chrome extension into a ZIP file ready for Chrome Web Store submission.
 *
 * The manifest.json is placed at the ZIP root (Chrome Web Store requirement).
 * Output: artifacts/snipbit-chrome-vX.Y.Z.zip
 *
 * Usage:
 *   node scripts/package-extension.mjs
 *   npm run package:extension
 *
 * Environment variables:
 *   BUILD_DIR    Override build output directory (default: dist)
 *   PACKAGE_DIR  Override artifacts output directory (default: artifacts)
 *
 * Cross-platform: uses Node.js streams and zlib — no external zip binary required.
 */

import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
} from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');
const BUILD_DIR = process.env.BUILD_DIR || 'dist';
const PACKAGE_DIR = process.env.PACKAGE_DIR || 'artifacts';
const buildPath = join(ROOT, BUILD_DIR);
const packagePath = join(ROOT, PACKAGE_DIR);

// Ensure build exists
if (!existsSync(buildPath)) {
  console.error(`Build directory not found: ${buildPath}`);
  console.error('Run "npm run build" before packaging.');
  process.exit(1);
}

// Ensure manifest.json exists in build output
const manifestPath = join(buildPath, 'manifest.json');
if (!existsSync(manifestPath)) {
  console.error(`manifest.json not found in build output: ${manifestPath}`);
  console.error('Run "npm run build" to generate the build output with manifest.json.');
  process.exit(1);
}

// Parse manifest
let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
} catch (e) {
  console.error(`Failed to parse manifest.json: ${e.message}`);
  process.exit(1);
}

const { name, version } = manifest;

if (!name || typeof name !== 'string') {
  console.error('manifest.json is missing a valid "name" field.');
  process.exit(1);
}

if (!version || typeof version !== 'string') {
  console.error('manifest.json is missing a valid "version" field.');
  process.exit(1);
}

// Construct ZIP output path
const safeName = name
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');
const zipName = `${safeName}-chrome-v${version}.zip`;
const zipPath = join(packagePath, zipName);
const zipPathAbs = resolve(zipPath);

console.log(`\nPackaging Chrome extension`);
console.log(`  Name    : ${name}`);
console.log(`  Version : ${version}`);
console.log(`  Source  : ${buildPath}`);
console.log(`  Output  : ${zipPath}`);
console.log('');

// Clean and recreate artifacts directory
if (existsSync(packagePath)) {
  rmSync(packagePath, { recursive: true, force: true });
}
mkdirSync(packagePath, { recursive: true });

// Collect all files under buildPath
function collectFiles(dir, base) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(full, base));
    } else {
      files.push({ full, rel: relative(base, full).replace(/\\/g, '/') });
    }
  }
  return files;
}

// Pure-Node ZIP writer (PKZIP format, stored + deflate via zlib)
// Uses Uint8Array helpers to avoid external dependencies.
function uint16LE(n) {
  return [(n & 0xff), (n >> 8) & 0xff];
}
function uint32LE(n) {
  return [(n & 0xff), (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff];
}

// CRC-32 table
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (const b of buf) crc = crcTable[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

async function createZip(files, outPath) {
  const { default: zlib } = await import('node:zlib');
  const { promisify } = await import('node:util');
  const deflateRaw = promisify(zlib.deflateRaw);

  const centralDir = [];
  const chunks = [];
  let offset = 0;

  for (const { full, rel } of files) {
    const data = readFileSync(full);
    const compressed = await deflateRaw(data);
    const useCompressed = compressed.length < data.length;
    const fileData = useCompressed ? compressed : data;
    const crc = crc32(data);
    const nameBytes = Buffer.from(rel, 'utf8');
    const now = new Date();
    const dosTime =
      ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xffff;
    const dosDate =
      (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xffff;

    const localHeader = Buffer.from([
      0x50, 0x4b, 0x03, 0x04, // local file header signature
      0x14, 0x00,             // version needed: 2.0
      0x00, 0x00,             // general purpose flags
      ...uint16LE(useCompressed ? 8 : 0), // compression: deflate or stored
      ...uint16LE(dosTime),
      ...uint16LE(dosDate),
      ...uint32LE(crc),
      ...uint32LE(fileData.length),
      ...uint32LE(data.length),
      ...uint16LE(nameBytes.length),
      0x00, 0x00,             // extra field length
      ...nameBytes,
    ]);

    const centralEntry = Buffer.from([
      0x50, 0x4b, 0x01, 0x02, // central directory signature
      0x14, 0x00,             // version made by
      0x14, 0x00,             // version needed
      0x00, 0x00,             // flags
      ...uint16LE(useCompressed ? 8 : 0),
      ...uint16LE(dosTime),
      ...uint16LE(dosDate),
      ...uint32LE(crc),
      ...uint32LE(fileData.length),
      ...uint32LE(data.length),
      ...uint16LE(nameBytes.length),
      0x00, 0x00,             // extra field length
      0x00, 0x00,             // file comment length
      0x00, 0x00,             // disk number start
      0x00, 0x00,             // internal attrs
      0x00, 0x00, 0x00, 0x00, // external attrs
      ...uint32LE(offset),
      ...nameBytes,
    ]);

    chunks.push(localHeader, fileData);
    centralDir.push(centralEntry);
    offset += localHeader.length + fileData.length;
  }

  const centralDirBuf = Buffer.concat(centralDir);
  const endRecord = Buffer.from([
    0x50, 0x4b, 0x05, 0x06, // end of central directory signature
    0x00, 0x00,             // disk number
    0x00, 0x00,             // disk with start of central dir
    ...uint16LE(centralDir.length),
    ...uint16LE(centralDir.length),
    ...uint32LE(centralDirBuf.length),
    ...uint32LE(offset),
    0x00, 0x00,             // comment length
  ]);

  const out = createWriteStream(outPath);
  await new Promise((resolve, reject) => {
    out.on('finish', resolve);
    out.on('error', reject);
    for (const chunk of chunks) out.write(chunk);
    out.write(centralDirBuf);
    out.write(endRecord);
    out.end();
  });
}

// Build and write the ZIP
const files = collectFiles(buildPath, buildPath);

if (files.length === 0) {
  console.error('No files found in build directory. Run "npm run build" first.');
  process.exit(1);
}

console.log(`  Files   : ${files.length}`);
console.log('');

try {
  await createZip(files, zipPathAbs);
} catch (err) {
  console.error(`\nFailed to create ZIP archive: ${err.message}`);
  process.exit(1);
}

// Confirm ZIP was created
if (!existsSync(zipPath)) {
  console.error('ZIP file was not created. Check the output above for errors.');
  process.exit(1);
}

console.log(`Package created successfully: ${zipPath}`);
console.log(`\nTo use in publish workflow, set:`);
console.log(`  EXTENSION_ZIP_PATH=${zipPathAbs}`);
