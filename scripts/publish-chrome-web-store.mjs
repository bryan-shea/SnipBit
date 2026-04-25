#!/usr/bin/env node
/**
 * Publishes a packaged Chrome extension ZIP to the Chrome Web Store.
 *
 * Authentication uses the OAuth 2.0 refresh token flow.
 * Tokens are exchanged at runtime and never written to disk or printed.
 *
 * Required environment variables:
 *   CWS_EXTENSION_ID    Chrome Web Store item ID (from the dashboard URL)
 *   CWS_CLIENT_ID       Google OAuth2 client ID
 *   CWS_CLIENT_SECRET   Google OAuth2 client secret
 *   CWS_REFRESH_TOKEN   Long-lived refresh token for the publisher account
 *   EXTENSION_ZIP_PATH  Absolute path to the packaged extension ZIP
 *
 * Optional environment variables:
 *   CWS_PUBLISH_TYPE    DEFAULT_PUBLISH (default) | STAGED_PUBLISH
 *   CWS_SKIP_REVIEW     "true" to request skipReview (only eligible items)
 *
 * Steps performed:
 *   1. Exchange refresh token for a short-lived access token
 *   2. Upload the ZIP to the Chrome Web Store upload API
 *   3. Submit a publish request with the selected publish type
 *
 * Usage:
 *   EXTENSION_ZIP_PATH=artifacts/snipbit-chrome-v1.0.0.zip \
 *   node scripts/publish-chrome-web-store.mjs
 */

import { createReadStream, readFileSync, statSync } from 'node:fs';
import { request as httpsRequest } from 'node:https';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

function requireEnv(name) {
  const val = process.env[name];
  if (!val) {
    console.error(`[publish] Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return val;
}

const EXTENSION_ID = requireEnv('CWS_EXTENSION_ID');
const CLIENT_ID = requireEnv('CWS_CLIENT_ID');
const CLIENT_SECRET = requireEnv('CWS_CLIENT_SECRET');
const REFRESH_TOKEN = requireEnv('CWS_REFRESH_TOKEN');
const ZIP_PATH = requireEnv('EXTENSION_ZIP_PATH');

const PUBLISH_TYPE = process.env.CWS_PUBLISH_TYPE || 'DEFAULT_PUBLISH';
const SKIP_REVIEW = process.env.CWS_SKIP_REVIEW === 'true';

const VALID_PUBLISH_TYPES = ['DEFAULT_PUBLISH', 'STAGED_PUBLISH'];
if (!VALID_PUBLISH_TYPES.includes(PUBLISH_TYPE)) {
  console.error(
    `[publish] Invalid CWS_PUBLISH_TYPE: "${PUBLISH_TYPE}". Allowed: ${VALID_PUBLISH_TYPES.join(', ')}`,
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// HTTP helpers (using built-in https to avoid extra dependencies)
// ---------------------------------------------------------------------------

function httpsPost(hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const req = httpsRequest({ method: 'POST', hostname, path, headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function httpsPutStream(hostname, path, headers, stream, contentLength) {
  return new Promise((resolve, reject) => {
    const req = httpsRequest(
      { method: 'PUT', hostname, path, headers: { ...headers, 'Content-Length': contentLength } },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      },
    );
    req.on('error', reject);
    stream.pipe(req);
  });
}

function parseJson(raw, context) {
  try {
    return JSON.parse(raw);
  } catch {
    console.error(`[publish] ${context} returned non-JSON response.`);
    console.error(raw);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Step 1 — Exchange refresh token for access token
// ---------------------------------------------------------------------------

async function getAccessToken() {
  console.log('[publish] Exchanging refresh token for access token...');

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: REFRESH_TOKEN,
    grant_type: 'refresh_token',
  }).toString();

  const res = await httpsPost('oauth2.googleapis.com', '/token', {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(body),
  }, body);

  const json = parseJson(res.body, 'Token endpoint');

  if (res.status !== 200 || !json.access_token) {
    const errorCode = json.error || 'unknown';
    const errorDesc = json.error_description || '';
    console.error(
      `[publish] Token exchange failed (HTTP ${res.status}): ${errorCode} ${errorDesc}`.trim(),
    );
    console.error('[publish] Verify CWS_CLIENT_ID, CWS_CLIENT_SECRET, and CWS_REFRESH_TOKEN.');
    process.exit(1);
  }

  console.log('[publish] Access token obtained.');
  return json.access_token;
}

// ---------------------------------------------------------------------------
// Step 2 — Upload ZIP to Chrome Web Store
// ---------------------------------------------------------------------------

async function uploadPackage(accessToken) {
  console.log(`[publish] Uploading ZIP: ${ZIP_PATH}`);

  let zipSize;
  try {
    zipSize = statSync(ZIP_PATH).size;
  } catch {
    console.error(`[publish] ZIP file not found: ${ZIP_PATH}`);
    process.exit(1);
  }

  const stream = createReadStream(ZIP_PATH);

  const res = await httpsPutStream(
    'www.googleapis.com',
    `/upload/chromewebstore/v1.1/items/${EXTENSION_ID}`,
    {
      'Authorization': `Bearer ${accessToken}`,
      'x-goog-api-version': '2',
      'Content-Type': 'application/zip',
    },
    stream,
    zipSize,
  );

  const json = parseJson(res.body, 'Upload endpoint');

  if (res.status !== 200 || json.uploadState === 'FAILURE') {
    console.error(`[publish] Upload failed (HTTP ${res.status}).`);
    if (Array.isArray(json.itemError)) {
      for (const err of json.itemError) {
        console.error(`         ${err.error_code}: ${err.error_detail}`);
      }
    }
    if (json.error) {
      console.error(`         ${json.error.message || JSON.stringify(json.error)}`);
    }
    process.exit(1);
  }

  console.log(`[publish] Upload state: ${json.uploadState}`);

  if (json.uploadState !== 'SUCCESS') {
    console.error('[publish] Upload did not complete successfully. Check the Chrome Developer Dashboard.');
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Step 3 — Submit publish request
// ---------------------------------------------------------------------------

async function publishExtension(accessToken) {
  console.log(
    `[publish] Submitting publish request (type: ${PUBLISH_TYPE}, skipReview: ${SKIP_REVIEW})...`,
  );

  const params = new URLSearchParams();
  if (PUBLISH_TYPE === 'STAGED_PUBLISH') {
    params.set('publishTarget', 'trustedTesters');
  }
  if (SKIP_REVIEW) {
    params.set('skipReview', 'true');
  }

  const queryString = params.toString();
  const publishPath =
    `/chromewebstore/v1.1/items/${EXTENSION_ID}/publish` +
    (queryString ? `?${queryString}` : '');

  const bodyStr = '{}';

  const res = await httpsPost('www.googleapis.com', publishPath, {
    'Authorization': `Bearer ${accessToken}`,
    'x-goog-api-version': '2',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(bodyStr),
  }, bodyStr);

  const json = parseJson(res.body, 'Publish endpoint');

  if (res.status !== 200) {
    console.error(`[publish] Publish request failed (HTTP ${res.status}).`);
    if (json.error) {
      console.error(`         ${json.error.message || JSON.stringify(json.error)}`);
    }
    if (Array.isArray(json.statusDetail)) {
      for (const detail of json.statusDetail) {
        console.error(`         ${detail}`);
      }
    }
    process.exit(1);
  }

  return json;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('');
  console.log('Chrome Web Store — Publish');
  console.log('==========================');
  console.log(`Extension ID : ${EXTENSION_ID}`);
  console.log(`ZIP Path     : ${ZIP_PATH}`);
  console.log(`Publish Type : ${PUBLISH_TYPE}`);
  console.log(`Skip Review  : ${SKIP_REVIEW}`);
  console.log('');

  // Verify ZIP exists before making any API calls
  try {
    statSync(ZIP_PATH);
  } catch {
    console.error(`[publish] ZIP file not found: ${ZIP_PATH}`);
    process.exit(1);
  }

  const accessToken = await getAccessToken();
  await uploadPackage(accessToken);
  const result = await publishExtension(accessToken);

  console.log('');
  console.log('[publish] Done.');
  console.log(`  Status : ${result.status ?? 'unknown'}`);
  if (Array.isArray(result.statusDetail) && result.statusDetail.length > 0) {
    for (const detail of result.statusDetail) {
      console.log(`  Detail : ${detail}`);
    }
  }
  console.log(`  Item   : https://chromewebstore.google.com/detail/${EXTENSION_ID}`);
}

main().catch((err) => {
  console.error(`\n[publish] Unexpected error: ${err.message ?? err}`);
  process.exit(1);
});
