/**
 * VisuCAN Firebase setup — run once in an interactive terminal.
 *
 *   npm run firebase:setup
 *
 * Step 1 opens your browser for Google sign-in (no copy/paste link).
 * Step 2 creates visucan-prod, web app, deploys rules, prints Vercel env vars.
 */

import { execSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const PROJECT_ID = 'visucan-prod';
const DISPLAY_NAME = 'VisuCAN';
const WEB_APP_NICKNAME = 'visucan-web';
const SUPPORT_EMAIL = 'umtkyck@gmail.com';

const firebase = (args, opts = {}) =>
  execSync(`npx -y firebase-tools@latest ${args}`, {
    encoding: 'utf8',
    stdio: opts.silent ? 'pipe' : 'inherit',
    ...opts,
  });

function isLoggedIn() {
  try {
    const out = firebase('login:list --json', { silent: true });
    const accounts = JSON.parse(out);
    return Array.isArray(accounts) && accounts.length > 0;
  } catch {
    return false;
  }
}

function login() {
  console.log('\n── Step 1/4: Firebase login ──');
  console.log('Your browser will open. Sign in with umtkyck@gmail.com\n');

  const result = spawnSync('npx', ['-y', 'firebase-tools@latest', 'login'], {
    stdio: 'inherit',
    shell: true,
  });

  if (result.status !== 0) {
    console.error('\nLogin failed. Try again: npm run firebase:login');
    process.exit(1);
  }
}

function ensureProject() {
  console.log('\n── Step 2/4: Firebase project ──');
  try {
    firebase(`projects:create ${PROJECT_ID} --display-name "${DISPLAY_NAME}"`, {
      silent: true,
    });
    console.log(`Created project ${PROJECT_ID}`);
  } catch (error) {
    const msg = String(error.stderr || error.stdout || error.message);
    if (msg.includes('already exists') || msg.includes('ALREADY_EXISTS')) {
      console.log(`Project ${PROJECT_ID} already exists — continuing.`);
    } else {
      throw error;
    }
  }

  firebase(`use ${PROJECT_ID}`, { silent: true });
}

function ensureWebApp() {
  console.log('\n── Step 3/4: Web app + SDK config ──');

  let appId;
  try {
    const out = firebase(`apps:create WEB ${WEB_APP_NICKNAME} --project ${PROJECT_ID}`, {
      silent: true,
    });
    const match = out.match(/App ID: (1:[^\s]+)/);
    appId = match?.[1];
  } catch (error) {
    const msg = String(error.stderr || error.stdout || error.message);
    if (msg.includes('already exists') || msg.includes('ALREADY_EXISTS')) {
      const listed = firebase(`apps:list WEB --project ${PROJECT_ID} --json`, {
        silent: true,
      });
      const apps = JSON.parse(listed);
      appId = apps.result?.[0]?.appId;
    } else {
      throw error;
    }
  }

  if (!appId) throw new Error('Could not resolve Web App ID');

  const sdkRaw = firebase(`apps:sdkconfig WEB ${appId} --project ${PROJECT_ID}`, {
    silent: true,
  });
  const sdk = JSON.parse(sdkRaw);

  const envLines = [
    `NEXT_PUBLIC_FIREBASE_API_KEY=${sdk.apiKey}`,
    `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${sdk.authDomain}`,
    `NEXT_PUBLIC_FIREBASE_PROJECT_ID=${sdk.projectId}`,
    `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${sdk.storageBucket}`,
    `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${sdk.messagingSenderId}`,
    `NEXT_PUBLIC_FIREBASE_APP_ID=${sdk.appId}`,
    `FIREBASE_PROJECT_ID=${sdk.projectId}`,
    '# FIREBASE_CLIENT_EMAIL=...',
    '# FIREBASE_PRIVATE_KEY="..."',
    '# Download service account key from:',
    '# https://console.firebase.google.com/project/visucan-prod/settings/serviceaccounts/adminsdk',
  ];

  writeFileSync('apps/web/.env.firebase.local', envLines.join('\n') + '\n');
  console.log('\nWrote apps/web/.env.firebase.local (gitignored via .env*)\n');
  console.log(envLines.filter((l) => !l.startsWith('#')).join('\n'));

  return sdk;
}

function deploy() {
  console.log('\n── Step 4/4: Deploy auth + security rules ──');
  firebase('deploy --only auth,firestore:rules,storage');
}

function printNextSteps() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  Firebase setup complete                                     ║
╠══════════════════════════════════════════════════════════════╣
║  1. Copy vars from apps/web/.env.firebase.local → Vercel     ║
║  2. Service account key (Admin SDK):                         ║
║     https://console.firebase.google.com/project/visucan-prod/settings/serviceaccounts/adminsdk
║     → Generate new private key → add FIREBASE_CLIENT_EMAIL   ║
║       and FIREBASE_PRIVATE_KEY to Vercel                     ║
║  3. Enable Apple + Facebook in Firebase Console:             ║
║     https://console.firebase.google.com/project/visucan-prod/authentication/providers
║  Support email: ${SUPPORT_EMAIL}                              ║
╚══════════════════════════════════════════════════════════════╝
`);
}

async function main() {
  console.log('VisuCAN Firebase setup\n');

  if (!isLoggedIn()) {
    login();
    if (!isLoggedIn()) {
      console.error('Still not logged in after login attempt.');
      process.exit(1);
    }
  } else {
    console.log('Already logged in to Firebase.');
  }

  ensureProject();
  ensureWebApp();
  deploy();
  printNextSteps();
}

main().catch((error) => {
  console.error('\nSetup failed:', error.message || error);
  process.exit(1);
});
