import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFirebaseServiceAccount } from '../utils/firebaseServiceAccount.js';

const appName = 'nexhrms';

export const getFirebaseAuth = () => {
  let app = getApps().find((candidate) => candidate.name === appName);

  if (!app) {
    const options = {};
    const serviceAccount = readFirebaseServiceAccount({
      json: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
      base64: process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64,
    });

    if (serviceAccount) {
      if (
        process.env.FIREBASE_PROJECT_ID
        && process.env.FIREBASE_PROJECT_ID !== serviceAccount.project_id
      ) {
        throw new Error('FIREBASE_PROJECT_ID does not match the service-account project_id');
      }
      options.credential = cert(serviceAccount);
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      options.credential = applicationDefault();
    } else {
      throw new Error('Firebase Admin credentials are not configured');
    }

    if (process.env.FIREBASE_PROJECT_ID) {
      options.projectId = process.env.FIREBASE_PROJECT_ID;
    }

    app = initializeApp(options, appName);
  }

  return getAuth(app);
};
