import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const appName = 'nexhrms';

export const getFirebaseAuth = () => {
  let app = getApps().find((candidate) => candidate.name === appName);

  if (!app) {
    const options = {};
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (serviceAccount) {
      options.credential = cert(JSON.parse(serviceAccount));
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
