/**
 * Bootstrap Firebase project for VisuCAN.
 *
 * Prerequisites:
 *   npx -y firebase-tools@latest login
 *
 * Usage:
 *   node scripts/firebase-bootstrap.mjs
 *
 * Creates project `visucan-prod`, registers a Web app, prints SDK config
 * and writes service-account.json (gitignored) for Vercel env setup.
 */

import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const PROJECT_ID = 'visucan-prod';
const DISPLAY_NAME = 'VisuCAN';
const WEB_APP_ID = 'visucan-web';
const SUPPORT_EMAIL = 'umtkyck@gmail.com';

const firebase = (args) =>
  execSync(`npx -y firebase-tools@latest ${args}`, { encoding: 'utf8' }).trim();

function run() {
  console.log('Checking Firebase login…');
  try {
    firebase('login:list');
  } catch {
    console.error('Not logged in. Run: npx -y firebase-tools@latest login');
    process.exit(1);
  }

  console.log(`Ensuring project ${PROJECT_ID}…`);
  try {
    firebase(`projects:create ${PROJECT_ID} --display-name "${DISPLAY_NAME}"`);
  } catch (error) {
    const message = String(error.stderr || error.stdout || error.message);
    if (!message.includes('already exists')) throw error;
    console.log('Project already exists.');
  }

  firebase(`use ${PROJECT_ID}`);

  console.log('Registering web app…');
  let appId;
  try {
    const out = firebase(`apps:create WEB ${WEB_APP_ID} --project ${PROJECT_ID}`);
    const match = out.match(/App ID: (1:[^\s]+)/);
    appId = match?.[1];
  } catch (error) {
    const message = String(error.stderr || error.stdout || error.message);
    if (message.includes('already exists')) {
      const listed = firebase(`apps:list WEB --project ${PROJECT_ID} --json`);
      const apps = JSON.parse(listed);
      appId = apps.result?.[0]?.appId;
    } else {
      throw error;
    }
  }

  if (!appId) {
    throw new Error('Could not resolve Firebase Web App ID');
  }

  console.log(`Web App ID: ${appId}`);

  const sdkConfigRaw = firebase(`apps:sdkconfig WEB ${appId} --project ${PROJECT_ID}`);
  const sdk = JSON.parse(sdkConfigRaw);

  console.log('\n--- Add these to Vercel / .env.local ---\n');
  console.log(`NEXT_PUBLIC_FIREBASE_API_KEY=${sdk.apiKey}`);
  console.log(`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${sdk.authDomain}`);
  console.log(`NEXT_PUBLIC_FIREBASE_PROJECT_ID=${sdk.projectId}`);
  console.log(`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${sdk.storageBucket}`);
  console.log(`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${sdk.messagingSenderId}`);
  console.log(`NEXT_PUBLIC_FIREBASE_APP_ID=${sdk.appId}`);
  console.log(`FIREBASE_PROJECT_ID=${sdk.projectId}`);

  console.log('\nCreating service account key…');
  const require = createRequire(import.meta.url);
  // firebase CLI doesn't create SA keys; use gcloud if available
  try {
    const saEmail = `firebase-adminsdk@${PROJECT_ID}.iam.gserviceaccount.com`;
    execSync(
      `gcloud iam service-accounts keys create service-account.json --iam-account=${saEmail} --project=${PROJECT_ID}`,
      { stdio: 'inherit' }
    );
    const key = JSON.parse(
      require('node:fs').readFileSync('service-account.json', 'utf8')
    );
    console.log(`FIREBASE_CLIENT_EMAIL=${key.client_email}`);
    console.log(`FIREBASE_PRIVATE_KEY="${key.private_key.replace(/\n/g, '\\n')}"`);
  } catch {
    console.log(
      'Could not auto-create service account key (gcloud missing or no permission).'
    );
    console.log(
      'Download from Firebase Console → Project settings → Service accounts → Generate new private key.'
    );
  }

  console.log('\nDeploying auth + rules…');
  firebase('deploy --only auth,firestore:rules,storage');

  console.log('\nDone. Enable Apple + Facebook in Firebase Console → Authentication → Sign-in method.');
  console.log(`Support email: ${SUPPORT_EMAIL}`);
}

run();
