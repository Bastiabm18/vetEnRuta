// lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth,
  GoogleAuthProvider, 
  FacebookAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Re-exportamos LAS MISMAS funciones y proveedores
export { 
  GoogleAuthProvider, 
  FacebookAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';

// Misma estructura de cache
let instances: {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
} | null = null;

// MISMO nombre de función y estructura
export function getFirebaseClientInstances() {
  if (instances) {
    return instances;
  }

  // Misma obtención de variables de entorno
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "veterinariaconcepcion-86d83.firebasestorage.app", // Fallback explícito
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
  
  // Misma validación
  if (!firebaseConfig.apiKey) {
    throw new Error("Firebase API Key del cliente no encontrada. Revisa las variables de entorno en apphosting.yaml.");
  }

  // Misma lógica de inicialización
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

  // Misma estructura de retorno
  instances = {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
    storage: getStorage(app),
  };

  return instances;
}