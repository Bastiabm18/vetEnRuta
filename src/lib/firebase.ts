import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Tipado para las instancias
interface FirebaseInstances {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
}

let instances: FirebaseInstances | null = null;

export function getFirebaseClientInstances(): FirebaseInstances {
  if (instances) return instances;

  // Configuración desde variables de entorno
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, // Usará .firebasestorage.app
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
  };

  // Validación crítica
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error("❌ Configuración incompleta de Firebase. Verifica tus variables de entorno.");
  }

  // Inicialización condicional
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

  instances = {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
    storage: getStorage(app) // Storage con el nuevo dominio
  };

  // Debug (opcional)
  console.log("Firebase inicializado con Storage:", firebaseConfig.storageBucket);

  return instances;
}

// Exporta tipos y funciones útiles
export { 
  GoogleAuthProvider, 
  signInWithPopup,
  createUserWithEmailAndPassword 
} from 'firebase/auth';