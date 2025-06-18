import { App, cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Define las variables de entorno esperadas.
// Asegúrate de que los nombres aquí coincidan con los de tu apphosting.yaml
const PROJECT_ID = process.env.FIREBASE_ADMIN_PROJECT_ID;
const CLIENT_EMAIL = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const PRIVATE_KEY = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

// --- Verificación Crucial de Credenciales ---
// Esto detendrá la aplicación con un error claro si faltan variables de entorno
if (!PROJECT_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
  const missing = [];
  if (!PROJECT_ID) missing.push('FIREBASE_ADMIN_PROJECT_ID');
  if (!CLIENT_EMAIL) missing.push('FIREBASE_ADMIN_CLIENT_EMAIL');
  if (!PRIVATE_KEY) missing.push('FIREBASE_ADMIN_PRIVATE_KEY');

  const errorMessage = `Firebase Admin SDK: Faltan variables de entorno críticas: ${missing.join(', ')}. Por favor, verifica tu apphosting.yaml.`;
  console.error(errorMessage); // Imprime el error para depuración
  throw new Error(errorMessage); // Lanza el error para detener el proceso
}

// La clave privada ya debería venir correctamente formateada con saltos de línea reales (\n)
// gracias al formato 'value: |' en apphosting.yaml.
// Ya no necesitamos .split('\\n').join('\n')
const formattedPrivateKey = PRIVATE_KEY;

const firebaseAdminConfig = {
  credential: cert({
    projectId: PROJECT_ID,
    clientEmail: CLIENT_EMAIL,
    privateKey: formattedPrivateKey,
  }),
  databaseURL: `https://${PROJECT_ID}.firebaseio.com`
};

// --- Patrón Singleton para Firebase Admin ---
// Asegura que la app de Firebase Admin se inicialice solo una vez.
function createFirebaseAdminApp(): App {
  if (getApps().length === 0) {
    console.log("Firebase Admin SDK: Inicializando..."); // Log para depuración en los logs de despliegue
    return initializeApp(firebaseAdminConfig);
  }
  console.log("Firebase Admin SDK: Ya inicializado."); // Log para depuración
  return getApp();
}

const adminApp = createFirebaseAdminApp();

// --- Exporta las instancias inicializadas ---
// Puedes usar adminAuth y adminFirestore en tus API Routes y otras funciones de servidor.
export const adminAuth = getAuth(adminApp);
export const adminFirestore = getFirestore(adminApp);