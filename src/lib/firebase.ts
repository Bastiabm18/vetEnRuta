// lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Re-exportamos las funciones y proveedores que usas en otras partes de tu app
export { 
  GoogleAuthProvider, 
  FacebookAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';

// Guardaremos las instancias aquí para no reinicializar
let instances: {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
} | null = null;

// Esta es la función clave que tus componentes llamarán
export function getFirebaseClientInstances() {
  // Si ya las creamos, las devolvemos inmediatamente
  if (instances) {
    return instances;
  }

  // Definimos la configuración DENTRO de la función para asegurar que se lee en el cliente
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
  
  // Verificamos que la clave de API exista
  if (!firebaseConfig.apiKey) {
      throw new Error("Firebase API Key del cliente no encontrada. Revisa las variables de entorno.");
  }

  let app: FirebaseApp;
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  // Creamos y guardamos las instancias en caché
  instances = {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
    storage: getStorage(app),
  };

  return instances;
}
