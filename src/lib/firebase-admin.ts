import { App, cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// Se crea un objeto para guardar las instancias una vez creadas (caché).
// Se inicializa en null para saber que aún no se ha ejecutado.
let instances: { auth: Auth; firestore: Firestore } | null = null;

/**
 * Esta función es la única exportación. Se encarga de inicializar Firebase Admin
 * de forma segura y "perezosa" solo la primera vez que se necesita.
 * @returns Un objeto con las instancias de Auth y Firestore.
 */
export function getAdminInstances() {
  // Si ya hemos creado las instancias, simplemente las devolvemos.
  // Esto evita inicializaciones múltiples.
  if (instances) {
    return instances;
  }

  // Si no hay instancias, procedemos a inicializar.
  // Esta lógica ahora solo se ejecuta cuando una ruta de API la llama por primera vez.
  if (getApps().length === 0) {
    console.log("Initializing Firebase Admin SDK for the first time...");

    const PROJECT_ID = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const CLIENT_EMAIL = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const PRIVATE_KEY = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    // Esta verificación ahora funciona, porque se ejecuta tarde en el proceso.
    if (!PROJECT_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
      throw new Error(`Firebase Admin SDK: Faltan variables de entorno. Revisa tu apphosting.yaml.`);
    }

    const formattedPrivateKey = PRIVATE_KEY.replace(/\\n/g, '\n');

    initializeApp({
      credential: cert({
        projectId: PROJECT_ID,
        clientEmail: CLIENT_EMAIL,
        privateKey: formattedPrivateKey,
      }),
      databaseURL: `https://${PROJECT_ID}.firebaseio.com`
    });

    console.log("Firebase Admin SDK initialized successfully.");
  }

  // Una vez inicializado, creamos las instancias, las guardamos en nuestra caché
  // y las devolvemos.
  instances = {
    auth: getAuth(),
    firestore: getFirestore()
  };

  return instances;
}