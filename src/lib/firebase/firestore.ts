// src/lib/firebase/firestore.ts
import { db } from "../firebase";
import { doc, runTransaction, collection, query, where, getDocs, orderBy } from 'firebase/firestore'; // Asegúrate de importar orderBy si no estaba

export const reserveTimeSlot = async (horaId: string): Promise<boolean> => {
  const horaRef = doc(db, 'horas_disponibles', horaId);
  try {
    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(horaRef);
      if (!docSnap.exists() || !docSnap.data().disponible) {
        throw new Error('Hora no disponible');
      }
      transaction.update(horaRef, { disponible: false });
    });
    return true;
  } catch (error) {
    console.error('Error en reserva:', error);
    return false;
  }
};

export const fetchRegiones = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'regiones'));
    return snapshot.docs.map(doc => ({ id: doc.id, nombre: doc.data().nombre }));
  } catch (error) {
    console.error("Error fetching regiones:", error);
    return [];
  }
};

export const fetchComunasByRegion = async (regionId: string) => {
  try {
    const q = query(
      collection(db, 'comunas'),
      where('regionId', '==', regionId) // CAMBIO: Usar 'regionId' para consistencia
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, nombre: doc.data().nombre }));
  } catch (error) {
    console.error("Error fetching comunas:", error);
    return [];
  }
};

export const fetchTimeSlots = async (comunaId: string, fecha: string) => {
  try {
    const q = query(
      collection(db, 'horas_disponibles'),
      where('comunaIdsFlat', 'array-contains', comunaId), // CAMBIO CLAVE: Usa el nuevo campo para la búsqueda
      where('fecha', '==', fecha),
      orderBy('hora', 'asc') // Asegura que los resultados estén ordenados
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching time slots:", error);
    return [];
  }
};

export const fetchServices = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'servicios'));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching services:", error);
    return [];
  }
};