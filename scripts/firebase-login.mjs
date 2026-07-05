/**
 * Firebase CLI login (matches firebase-tools PKCE flow).
 *
 *   node scripts/firebase-login.mjs
 *   node scripts/firebase-login.mjs --code "4/0Adk..."
 */

import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const STATE_FILE = join(process.cwd(), '.firebase-login-state.json');
const CONFIG_DIR = join(homedir(), '.config', 'configstore');
const CONFIG_FILE = join(CONFIG_DIR, 'firebase-tools.json');

const CLIENT_ID =
  '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';
const AUTH_PROXY = 'https://auth.firebase.tools';
const AUTH_ORIGIN = 'https://accounts.google.com';
const REDIRECT_URI = `${AUTH_PROXY}/complete`;

function urlsafeBase64(base64string) {
  return base64string.replace(/\+/g, '-').replace(/=+$/, '').replace(/\//g, '_');
}

function createPkce() {
  const verifier = randomBytes(32).toString('hex');
  const challenge = urlsafeBase64(createHash('sha256').update(verifier).digest('base64'));
  return { verifier, challenge };
}

function saveState(state) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function loadState() {
  if (!existsSync(STATE_FILE)) return null;
  return JSON.parse(readFileSync(STATE_FILE, 'utf8'));
}

async function getAttestToken(sessionId) {
  const response = await fetch(`${AUTH_PROXY}/attest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId }),
  });
  if (!response.ok) {
    throw new Error(`Attest failed (${response.status})`);
  }
  const body = await response.json();
  return body.token;
}

function buildLoginUrl(challenge, session, attest) {
  const params = new URLSearchParams({
    code_challenge: challenge,
    session,
    attest,
    studio_prototyper: 'true',
  });
  return `${AUTH_PROXY}/login?${params}`;
}

async function exchangeCode(code, verifier) {
  const form = new URLSearchParams({
    code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
    code_verifier: verifier,
  });

  const response = await fetch(`${AUTH_ORIGIN}/o/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Token exchange failed (${response.status}): ${text.slice(0, 300)}`);
  }

  return JSON.parse(text);
}

function decodeJwtPayload(token) {
  const payload = token.split('.')[1];
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
}

function saveFirebaseConfig(tokens) {
  mkdirSync(CONFIG_DIR, { recursive: true });

  let config = {};
  if (existsSync(CONFIG_FILE)) {
    try {
      config = JSON.parse(readFileSync(CONFIG_FILE, 'utf8'));
    } catch {
      config = {};
    }
  }

  const user = decodeJwtPayload(tokens.id_token);

  config.tokens = {
    expires_at: Date.now() + tokens.expires_in * 1000,
    refresh_token: tokens.refresh_token,
    access_token: tokens.access_token,
    scope: tokens.scope,
    token_type: tokens.token_type,
  };
  config.user = {
    email: user.email,
    name: user.name,
    picture: user.picture,
  };

  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

async function startLogin() {
  const session = randomUUID();
  const { verifier, challenge } = createPkce();
  const attest = await getAttestToken(session);
  const url = buildLoginUrl(challenge, session, attest);

  saveState({ session, verifier, challenge, createdAt: Date.now() });

  console.log('\n1. Open this URL (browser should open automatically):\n');
  console.log(url);
  console.log('\n2. Sign in with umtkyck@gmail.com');
  console.log('3. Copy the authorization code from the success page');
  console.log('4. Run immediately:\n');
  console.log('   node scripts/firebase-login.mjs --code "PASTE_CODE"\n');

  try {
    const { execSync } = await import('node:child_process');
    execSync(`start "" "${url}"`, { shell: true, stdio: 'ignore' });
  } catch {
    // ignore
  }
}

async function completeLogin(code) {
  const state = loadState();
  if (!state) {
    throw new Error('No login session. Run: node scripts/firebase-login.mjs');
  }

  if (Date.now() - state.createdAt > 10 * 60 * 1000) {
    throw new Error('Session expired (>10 min). Run step 1 again.');
  }

  const tokens = await exchangeCode(code.trim(), state.verifier);
  saveFirebaseConfig(tokens);

  const user = decodeJwtPayload(tokens.id_token);
  console.log(`\nFirebase login OK: ${user.email}\n`);
  console.log('Next: node scripts/firebase-setup.mjs\n');

  try {
    unlinkSync(STATE_FILE);
  } catch {
    // ignore
  }
}

const codeArg =
  process.argv.find((a) => a.startsWith('--code='))?.slice(7) ??
  (process.argv.indexOf('--code') >= 0 ? process.argv[process.argv.indexOf('--code') + 1] : null);

if (codeArg) {
  completeLogin(codeArg).catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
} else {
  startLogin().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}
