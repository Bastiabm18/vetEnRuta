import { App, cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Define las variables de entorno esperadas.
// Asegúrate de que los nombres aquí coincidan con los de tu apphosting.yaml
const PROJECT_ID = process.env.FIREBASE_ADMIN_PROJECT_ID;
const CLIENT_EMAIL = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const PRIVATE_KEY = process.env.FIREBASE_ADMIN_PRIVATE_KEY; // Ya debería tener \n escapados

// Verifica que todas las credenciales necesarias existan
if (!PROJECT_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
  const missing = [];
  if (!PROJECT_ID) missing.push('FIREBASE_ADMIN_PROJECT_ID');
  if (!CLIENT_EMAIL) missing.push('FIREBASE_ADMIN_CLIENT_EMAIL');
  if (!PRIVATE_KEY) missing.push('FIREBASE_ADMIN_PRIVATE_KEY');

  // Lanza un error claro si falta alguna variable.
  // Esto hará que el build falle con un mensaje más informativo si el problema es la ENV.
  throw new Error(`Firebase Admin SDK: Missing environment variables: ${missing.join(', ')}. Please check apphosting.yaml.`);
}

// Opcional: Asegurarse que los saltos de línea de la privateKey sean correctos
// El YAML ya debería manejar los \n correctamente si los copiaste bien,
// pero si sigues teniendo problemas con la clave, esta línea ayuda:
const formattedPrivateKey = PRIVATE_KEY.replace(/\\n/g, '\n');

const firebaseAdminConfig = {
  credential: cert({
    projectId: PROJECT_ID,
    clientEmail: CLIENT_EMAIL,
    privateKey: formattedPrivateKey, // Usamos la clave formateada si es necesario
  }),
  databaseURL: `https://${PROJECT_ID}.firebaseio.com`
};

// Patrón Singleton para Firebase Admin
function createFirebaseAdminApp(): App {
  if (getApps().length === 0) {
    console.log("Initializing Firebase Admin SDK..."); // Para depuración en los logs
    return initializeApp(firebaseAdminConfig);
  }
  console.log("Firebase Admin SDK already initialized."); // Para depuración
  return getApp();
}

const adminApp = createFirebaseAdminApp();

// Exporta las instancias inicializadas
export const adminAuth = getAuth(adminApp);
export const adminFirestore = getFirestore(adminApp);