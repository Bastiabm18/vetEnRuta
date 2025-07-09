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

  // --- LA CORRECCIÓN CLAVE ESTÁ AQUÍ ---
  // Leemos la configuración completa desde la variable que nos da App Hosting
  const firebaseConfigString = process.env.NEXT_PUBLIC_FIREBASE_WEBAPP_CONFIG;

  if (!firebaseConfigString) {
    throw new Error("Firebase Web App Config no encontrada. Revisa la configuración de App Hosting.");
  }

  const firebaseConfig = JSON.parse(firebaseConfigString);
  
  // Verificamos que la clave de API exista después de parsear el JSON
  if (!firebaseConfig.apiKey) {
      throw new Error("Firebase API Key del cliente no encontrada en la configuración. Revisa las variables de entorno.");
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