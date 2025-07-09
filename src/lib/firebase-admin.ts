// lib/firebase-admin.ts

import { App, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// Se crea un objeto para guardar las instancias una vez creadas (caché).
let instances: { auth: Auth; firestore: Firestore } | null = null;

/**
 * Esta función inicializa Firebase Admin de forma segura y "perezosa"
 * solo la primera vez que se necesita.
 * @returns Un objeto con las instancias de Auth y Firestore.
 */
export function getAdminInstances() {
  // Si ya hemos creado las instancias, simplemente las devolvemos.
  // Esto evita inicializaciones múltiples y es más eficiente.
  if (instances) {
    return instances;
  }

  // Si no hay instancias, procedemos a inicializar.
  // Verificamos si ya existe alguna app inicializada.
  if (getApps().length === 0) {
    console.log("Initializing Firebase Admin SDK for the first time...");

    // ¡ESTA ES LA LÍNEA CLAVE!
    // Se llama a initializeApp() sin argumentos. En un entorno de Google Cloud
    // como App Hosting, las credenciales se detectan automáticamente.
    initializeApp();

    console.log("Firebase Admin SDK initialized successfully via automatic credentials.");
  }

  // Una vez inicializado, creamos las instancias, las guardamos en nuestra caché
  // y las devolvemos para usos futuros.
  instances = {
    auth: getAuth(),
    firestore: getFirestore()
  };

  return instances;
}