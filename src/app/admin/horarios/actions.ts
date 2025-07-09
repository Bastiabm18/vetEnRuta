// app/horarios/actions.ts
"use server";

import { cookies } from 'next/headers';
//import { adminAuth, adminFirestore } from '@/lib/firebase-admin';
import { getAdminInstances } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Interfaces (asegúrate de que estas coincidan con la estructura de tu DB)
interface VeterinarioInfo {
  id: string;
  nombre: string;
}

interface Region {
  id: string;
  nombre: string;
}

interface Comuna {
  id: string;
  nombre: string;
  regionId: string;
}

// NUEVA INTERFAZ: Para la estructura de comuna con su valor
export interface ComunaConValor { // Exportado para que MassScheduleManager.tsx lo use
  id: string;
  nombre: string;
  valor: number;
}

export interface HoraDisponible {
  id: string;
  fecha: string; // Stored as 'YYYY-MM-DD' string
  hora: string;  // Stored as 'HH:MM' string
  id_comuna: ComunaConValor[]; // <--- ¡CAMBIO AQUÍ! Ahora es un array de objetos
  comunaIdsFlat: string[]; // <--- ¡NUEVO CAMPO PARA BÚSQUEDA!
  disponible: boolean;
  veterinario: {
    id: string;
    nombre: string;
  };
  creado?: FieldValue;
  actualizado?: FieldValue;
}

async function getLoggedInVeterinario(): Promise<VeterinarioInfo | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('firebaseAuthSession')?.value;

  if (!sessionCookie) {
    console.error('No session cookie found.');
    return null;
  }

  try {
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
    const userDoc = await adminFirestore.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      console.error('No se encontró información adicional del veterinario para UID:', decodedToken.uid);
      return null;
    }
    
    const userData = userDoc.data();
    return {
      id: decodedToken.uid,
      nombre: userData?.displayName || `Veterinario ${decodedToken.uid.slice(0, 5)}`
    };
  } catch (error) {
    console.error('Error verifying session cookie or fetching user data:', error);
    return null;
  }
}

export async function getRegionesComunas(regionId?: string): Promise<{
  regiones?: Region[];
  comunas?: Comuna[];
  error?: string;
}> {
  try {
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
    const regionesSnapshot = await adminFirestore.collection('regiones').orderBy('nombre').get();
    const regiones = regionesSnapshot.docs.map(doc => ({ id: doc.id, nombre: doc.data().nombre }));

    let comunas: Comuna[] = [];
    if (regionId) {
      const comunasSnapshot = await adminFirestore.collection('comunas')
        .where('regionId', '==', regionId)
        .orderBy('nombre')
        .get();
      comunas = comunasSnapshot.docs.map(doc => ({
        id: doc.id,
        nombre: doc.data().nombre,
        regionId: doc.data().regionId
      }));
    }

    return { regiones, comunas };
  } catch (error) {
    console.error('Error fetching regiones and/or comunas:', error);
    return { error: 'Error al cargar regiones y comunas' };
  }
}

export async function generateMassScheduleForUser(
  comunasConValores: ComunaConValor[],
  startDateString: string, 
  endDateString: string 
): Promise<{
  success?: boolean;
  error?: string;
  message?: string;
}> {
  if (!comunasConValores || comunasConValores.length === 0) {
    return { error: 'Por favor, selecciona al menos una comuna con su valor.' };
  }
  if (!startDateString || !endDateString) {
    return { error: 'Las fechas de inicio y fin son obligatorias.' };
  }

  const veterinario = await getLoggedInVeterinario();
  if (!veterinario) {
    return { error: 'No se pudo autenticar al veterinario. Por favor, inicia sesión.' };
  }

  try {
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
    const partsStart = startDateString.split('-');
    const startDate = new Date(
      parseInt(partsStart[0]),
      parseInt(partsStart[1]) - 1, // Meses son 0-indexed en JavaScript Date
      parseInt(partsStart[2]),
      0, 0, 0, 0 // 00:00:00.000 del día en la zona horaria local
    );

    const partsEnd = endDateString.split('-');
    const endDate = new Date(
      parseInt(partsEnd[0]),
      parseInt(partsEnd[1]) - 1, // Meses son 0-indexed
      parseInt(partsEnd[2]),
      23, 59, 59, 999 // 23:59:59.999 del día en la zona horaria local
    );
    if (startDate > endDate) {
      return { error: 'La fecha de inicio no puede ser posterior a la fecha de fin.' };
    }

    const batch = adminFirestore.batch();
    let schedulesCreatedCount = 0;

    // Verificación simplificada de duplicados para el rango de fechas para este veterinario.
    const existingSchedulesQuery = await adminFirestore
      .collection('horas_disponibles')
      .where('veterinario.id', '==', veterinario.id)
      .where('fecha', '>=', startDateString)
      .where('fecha', '<=', endDateString)
      .limit(1)
      .get();

    if (!existingSchedulesQuery.empty) {
      return { error: `Ya existen horarios generados para este veterinario en el rango de fechas seleccionado.` };
    }
    
    // Preparar el array plano de IDs para el nuevo campo de búsqueda `comunaIdsFlat`
    const comunaIdsPlain = comunasConValores.map(c => c.id);

    const currentDate = new Date(startDate); 
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay(); // 0: Domingo, 1: Lunes, ..., 6: Sábado

      // Generar horas solo de Lunes a Sábado (1 a 6)
      if (dayOfWeek >= 1 && dayOfWeek <= 6) {
        for (let hora = 9; hora <= 20; hora++) {
          const fechaISOString = currentDate.toISOString().split('T')[0]; // Formato 'YYYY-MM-DD'
          const horaString = `${String(hora).padStart(2, '0')}:00`;

          const docRef = adminFirestore.collection('horas_disponibles').doc();
          batch.set(docRef, {
            disponible: true,
            fecha: fechaISOString,
            hora: horaString,
            id_comuna: comunasConValores, // Guarda el array de objetos con id, nombre y valor
            comunaIdsFlat: comunaIdsPlain, // Guarda el campo plano
            veterinario: {
              id: veterinario.id,
              nombre: veterinario.nombre
            },
            creado: FieldValue.serverTimestamp()
          });
          schedulesCreatedCount++;
        }
      }
      currentDate.setDate(currentDate.getDate() + 1); // Avanza al siguiente día
    }

    await batch.commit();
    return { 
      success: true,
      message: `Se generaron ${schedulesCreatedCount} horarios exitosamente para el rango del ${startDateString} al ${endDateString}.`
    };
  } catch (error) {
    console.error('Error al generar horarios:', error);
    return { error: `Error al generar los horarios: ${(error as Error).message}. Intente nuevamente.` };
  }
}

export async function getGeneratedSchedules(
  comunaIds: string[], // Mantiene array de IDs de strings para la búsqueda
  startDate: Date | null,
  endDate: Date | null
): Promise<HoraDisponible[]> {
  const veterinario = await getLoggedInVeterinario();
  if (!veterinario) {
    console.error('No se pudo autenticar al veterinario.');
    return [];
  }

  if (comunaIds.length === 0) {
    return [];
  }

  try {
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
    let queryRef: FirebaseFirestore.Query = adminFirestore
      .collection('horas_disponibles')
      .where('veterinario.id', '==', veterinario.id)
      .where('comunaIdsFlat', 'array-contains-any', comunaIds); // Usando el nuevo campo

    if (startDate) {
      const startISO = startDate.toISOString().split('T')[0];
      queryRef = queryRef.where('fecha', '>=', startISO);
    }
    if (endDate) {
      const endISO = endDate.toISOString().split('T')[0];
      queryRef = queryRef.where('fecha', '<=', endISO);
    }

    queryRef = queryRef.orderBy('fecha').orderBy('hora');

    const snapshot = await queryRef.get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        fecha: data.fecha,
        hora: data.hora,
        id_comuna: data.id_comuna,
        comunaIdsFlat: data.comunaIdsFlat,
        disponible: data.disponible,
        veterinario: data.veterinario
      };
    });
  } catch (error) {
    console.error('Error al obtener horarios:', error);
    return [];
  }
}

// ¡NUEVA FUNCIÓN! Actualiza los valores de las comunas para un horario específico
export async function updateScheduleComunaValues(
  scheduleId: string,
  updatedComunaValues: ComunaConValor[] // Array de objetos {id, nombre, valor}
): Promise<{ success?: boolean; error?: string }> {
  const veterinario = await getLoggedInVeterinario();
  if (!veterinario) {
    return { error: 'No autorizado. Por favor, inicia sesión como veterinario.' };
  }

  try {
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
    const scheduleDocRef = adminFirestore.collection('horas_disponibles').doc(scheduleId);
    const scheduleDoc = await scheduleDocRef.get();

    if (!scheduleDoc.exists) {
      return { error: 'Horario no encontrado para actualización.' };
    }

    const currentScheduleData = scheduleDoc.data() as HoraDisponible;

    // Verificar que el veterinario autenticado es el dueño de este horario
    if (currentScheduleData.veterinario.id !== veterinario.id) {
      return { error: 'No tienes permisos para editar este horario.' };
    }

    // Actualizar solo el campo id_comuna y el campo actualizado
    await scheduleDocRef.update({
      id_comuna: updatedComunaValues,
      actualizado: FieldValue.serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error al actualizar valores de comuna del horario:', error);
    return { error: `Error al actualizar valores de comuna: ${(error as Error).message}` };
  }
}


export async function updateScheduleAvailability(
  scheduleId: string,
  targetAvailability: boolean
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
    const scheduleDocRef = adminFirestore.collection('horas_disponibles').doc(scheduleId);
    const scheduleDoc = await scheduleDocRef.get();

    if (!scheduleDoc.exists) {
      return { error: 'Horario no encontrado para actualización.' };
    }

    const scheduleData = scheduleDoc.data() as HoraDisponible;
    const { id: veterinarioId } = scheduleData.veterinario;
    const fecha = scheduleData.fecha;
    const hora = scheduleData.hora;

    const schedulesToUpdateSnapshot = await adminFirestore
      .collection('horas_disponibles')
      .where('veterinario.id', '==', veterinarioId)
      .where('fecha', '==', fecha)
      .where('hora', '==', hora)
      .get();

    if (schedulesToUpdateSnapshot.empty) {
      return { error: 'No se encontraron horarios coincidentes para actualizar (misma fecha/hora/veterinario).' };
    }

    const batch = adminFirestore.batch();
    schedulesToUpdateSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { 
        disponible: targetAvailability,
        actualizado: FieldValue.serverTimestamp()
      });
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Error al actualizar disponibilidad de horarios:', error);
    return { error: `Error al actualizar disponibilidad de horarios: ${(error as Error).message}` };
  }
}

export async function deleteSchedule(
  scheduleId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
    await adminFirestore.collection('horas_disponibles').doc(scheduleId).delete();
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar horario:', error);
    return { error: 'Error al eliminar horario' };
  }
}