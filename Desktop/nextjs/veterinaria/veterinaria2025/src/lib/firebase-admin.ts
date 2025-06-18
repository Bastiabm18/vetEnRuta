import { App, cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.split('\\n').join('\n'),
  }),
  databaseURL: `https://${process.env.FIREBASE_ADMIN_PROJECT_ID}.firebaseio.com`
};

// Patrón Singleton para Firebase Admin
function createFirebaseAdminApp(): App {
  if (getApps().length === 0) {
    return initializeApp(firebaseAdminConfig);
  }
  return getApp();
}

const adminApp = createFirebaseAdminApp();

// Exporta las instancias inicializadas
export const adminAuth = getAuth(adminApp);
export const adminFirestore = getFirestore(adminApp);