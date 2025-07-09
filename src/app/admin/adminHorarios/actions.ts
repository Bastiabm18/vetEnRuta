// app/adminHorarios/actions.ts
"use server";

import { cookies } from 'next/headers';
//import { adminAuth, adminFirestore } from '@/lib/firebase-admin';
import { getAdminInstances } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Interfaces (asegúrate de que estas coincidan con la estructura de tu DB)
interface UserInfo { // Cambiado a UserInfo para ser más general
  id: string;
  nombre: string;
  role?: string; // Añadir rol para filtrar veterinarios/admins
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

export interface ComunaConValor {
  id: string;
  nombre: string;
  valor: number;
}

export interface HoraDisponible {
  id: string;
  fecha: string; // Stored as 'YYYY-MM-DD' string
  hora: string;  // Stored as 'HH:MM' string
  id_comuna: ComunaConValor[];
  comunaIdsFlat: string[];
  disponible: boolean;
  veterinario: {
    id: string;
    nombre: string;
  };
  creado?: FieldValue;
  actualizado?: FieldValue;
}

// Función para obtener información del usuario autenticado y su rol (para validación)
async function getAuthenticatedUserInfo(): Promise<UserInfo | null> {
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
      console.error('No se encontró información adicional del usuario para UID:', decodedToken.uid);
      return null;
    }
    
    const userData = userDoc.data();
    return {
      id: decodedToken.uid,
      nombre: userData?.displayName || `Usuario ${decodedToken.uid.slice(0, 5)}`,
      role: userData?.role || 'cliente' // Asumir 'cliente' por defecto si no tiene rol
    };
  } catch (error) {
    console.error('Error verifying session cookie or fetching user data:', error);
    return null;
  }
}

// NUEVA FUNCIÓN: Obtener veterinarios (y/o admins) para el selector del superadmin
export async function getVeterinariansForAdmin(): Promise<{
  vets?: UserInfo[];
  error?: string;
}> {
  const adminUser = await getAuthenticatedUserInfo();
  if (!adminUser || adminUser.role !== 'admin') {
    return { error: 'No autorizado. Solo administradores pueden ver esta lista.' };
  }

  try {
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
    const usersSnapshot = await adminFirestore.collection('users')
      .where('role', 'in', ['vet', 'admin']) // Obtener usuarios con rol 'vet' o 'admin'
      .orderBy('displayName') // Ojo: si displayName no es un índice, esto podría fallar.
      .get();

    const vets = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      nombre: doc.data().displayName || `Usuario ${doc.id.slice(0, 5)}`,
      role: doc.data().role
    }));

    return { vets };
  } catch (error) {
    console.error('Error fetching veterinarians for admin:', error);
    return { error: 'Error al cargar la lista de veterinarios.' };
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
  targetVeterinarioId: string, // ¡NUEVO ARGUMENTO! ID del veterinario para quien se generan los horarios
  comunasConValores: ComunaConValor[],
  startDateString: string, 
  endDateString: string 
): Promise<{
  success?: boolean;
  error?: string;
  message?: string;
}> {
  const adminUser = await getAuthenticatedUserInfo();
  if (!adminUser || adminUser.role !== 'admin') {
    return { error: 'No autorizado. Solo administradores pueden generar horarios.' };
  }

  if (!targetVeterinarioId) {
    return { error: 'Debe seleccionar un veterinario para generar horarios.' };
  }
  if (!comunasConValores || comunasConValores.length === 0) {
    return { error: 'Por favor, selecciona al menos una comuna con su valor.' };
  }
  if (!startDateString || !endDateString) {
    return { error: 'Las fechas de inicio y fin son obligatorias.' };
  }

  try {
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
    // Obtener el nombre del veterinario objetivo desde Firestore (para guardar en el documento)
    const targetVetDoc = await adminFirestore.collection('users').doc(targetVeterinarioId).get();
    if (!targetVetDoc.exists || (targetVetDoc.data()?.role !== 'vet' && targetVetDoc.data()?.role !== 'admin')) {
      return { error: 'Veterinario seleccionado no válido o no encontrado.' };
    }
    const targetVetName = targetVetDoc.data()?.displayName || `Veterinario ${targetVeterinarioId.slice(0, 5)}`;


    const partsStart = startDateString.split('-');
    const startDate = new Date(
      parseInt(partsStart[0]),
      parseInt(partsStart[1]) - 1,
      parseInt(partsStart[2]),
      0, 0, 0, 0 
    );

    const partsEnd = endDateString.split('-');
    const endDate = new Date(
      parseInt(partsEnd[0]),
      parseInt(partsEnd[1]) - 1,
      parseInt(partsEnd[2]),
      23, 59, 59, 999 
    );
    if (startDate > endDate) {
      return { error: 'La fecha de inicio no puede ser posterior a la fecha de fin.' };
    }

    const batch = adminFirestore.batch();
    let schedulesCreatedCount = 0;

    // Verificación de duplicados para el rango de fechas para el VETERINARIO OBJETIVO.
    const existingSchedulesQuery = await adminFirestore
      .collection('horas_disponibles')
      .where('veterinario.id', '==', targetVeterinarioId) // Filtrar por el ID del veterinario objetivo
      .where('fecha', '>=', startDateString)
      .where('fecha', '<=', endDateString)
      .limit(1)
      .get();

    if (!existingSchedulesQuery.empty) {
      return { error: `Ya existen horarios generados para el veterinario seleccionado en el rango de fechas.` };
    }
    
    const comunaIdsPlain = comunasConValores.map(c => c.id);

    const currentDate = new Date(startDate); 
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay(); // 0: Domingo, 1: Lunes, ..., 6: Sábado

      if (dayOfWeek >= 1 && dayOfWeek <= 6) { // Generar horas solo de Lunes a Sábado
        for (let hora = 9; hora <= 20; hora++) {
          const fechaISOString = currentDate.toISOString().split('T')[0];
          const horaString = `${String(hora).padStart(2, '0')}:00`;

          const docRef = adminFirestore.collection('horas_disponibles').doc();
          batch.set(docRef, {
            disponible: true,
            fecha: fechaISOString,
            hora: horaString,
            id_comuna: comunasConValores,
            comunaIdsFlat: comunaIdsPlain,
            veterinario: { // Usa la información del veterinario objetivo
              id: targetVeterinarioId,
              nombre: targetVetName
            },
            creado: FieldValue.serverTimestamp()
          });
          schedulesCreatedCount++;
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    await batch.commit();
    return { 
      success: true,
      message: `Se generaron ${schedulesCreatedCount} horarios exitosamente para ${targetVetName} del ${startDateString} al ${endDateString}.`
    };
  } catch (error) {
    console.error('Error al generar horarios:', error);
    return { error: `Error al generar los horarios: ${(error as Error).message}. Intente nuevamente.` };
  }
}

export async function getGeneratedSchedules(
  comunaIds: string[],
  startDate: Date | null,
  endDate: Date | null,
  veterinarioId?: string // ¡NUEVO ARGUMENTO OPCIONAL! Para filtrar por veterinario
): Promise<HoraDisponible[]> {
  const adminUser = await getAuthenticatedUserInfo();
  if (!adminUser || adminUser.role !== 'admin') {
    return []; // Solo administradores pueden usar esta acción para filtrar
  }

  if (comunaIds.length === 0 && !veterinarioId) { // Si no hay comunas ni vetId, no hay nada que buscar.
    return [];
  }

  try {
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
    let queryRef: FirebaseFirestore.Query = adminFirestore.collection('horas_disponibles');
    
    // Si se proporciona un veterinarioId, filtrar por él. Si no, obtener todos.
    if (veterinarioId) {
      queryRef = queryRef.where('veterinario.id', '==', veterinarioId);
    }

    // Si hay comunas, filtrar por ellas.
    if (comunaIds.length > 0) {
      queryRef = queryRef.where('comunaIdsFlat', 'array-contains-any', comunaIds);
    }

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

export async function updateScheduleAvailability(
  scheduleId: string,
  targetAvailability: boolean
): Promise<{ success?: boolean; error?: string }> {
  const adminUser = await getAuthenticatedUserInfo();
  if (!adminUser || adminUser.role !== 'admin') {
    return { error: 'No autorizado. Solo administradores pueden modificar horarios.' };
  }

  try {
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
    const scheduleDocRef = adminFirestore.collection('horas_disponibles').doc(scheduleId);
    const scheduleDoc = await scheduleDocRef.get();

    if (!scheduleDoc.exists) {
      return { error: 'Horario no encontrado para actualización.' };
    }

    const scheduleData = scheduleDoc.data() as HoraDisponible;
    const { id: veterinarioId } = scheduleData.veterinario; // Se obtiene el ID del veterinario del horario

    const fecha = scheduleData.fecha;
    const hora = scheduleData.hora;

    // La consulta se mantiene para actualizar todas las franjas horarias del mismo vet/fecha/hora
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

// Actualiza los valores de las comunas para un horario específico (para superadmin)
export async function updateScheduleComunaValues(
  scheduleId: string,
  updatedComunaValues: ComunaConValor[] // Array de objetos {id, nombre, valor}
): Promise<{ success?: boolean; error?: string }> {
  const adminUser = await getAuthenticatedUserInfo();
  if (!adminUser || adminUser.role !== 'admin') {
    return { error: 'No autorizado. Solo administradores pueden editar valores de comuna.' };
  }

  try {
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
    const scheduleDocRef = adminFirestore.collection('horas_disponibles').doc(scheduleId);
    const scheduleDoc = await scheduleDocRef.get();

    if (!scheduleDoc.exists) {
      return { error: 'Horario no encontrado para actualización.' };
    }

    const currentScheduleData = scheduleDoc.data() as HoraDisponible;

    // No se verifica si el veterinario autenticado es el dueño porque el admin puede editar cualquiera
    // if (currentScheduleData.veterinario.id !== veterinario.id) {
    //   return { error: 'No tienes permisos para editar este horario.' };
    // }

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


export async function deleteSchedule(
  scheduleId: string
): Promise<{ success?: boolean; error?: string }> {
  const adminUser = await getAuthenticatedUserInfo();
  if (!adminUser || adminUser.role !== 'admin') {
    return { error: 'No autorizado. Solo administradores pueden eliminar horarios.' };
  }
  try {
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
    await adminFirestore.collection('horas_disponibles').doc(scheduleId).delete();
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar horario:', error);
    return { error: 'Error al eliminar horario' };
  }
}