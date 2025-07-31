// app/horarios/citas-actions.ts
"use server";

import { cookies } from 'next/headers';
//import { adminAuth, adminFirestore } from '@/lib/firebase-admin';
import { getAdminInstances } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

// --- INTERFACES PARA CITAS ---
export interface DatosDueno {
  nombre: string;
  rut: string;
  telefono: string;
  email: string;
  direccion: {
    calle: string;
    numero: string;
    comuna: string;
  };
  estacionamiento?: string | null; // Puede ser un string o null si no aplica
}

export interface VeterinarioAnidado {
  id: string;
  nombre: string;
}

export interface LocationData {
  comuna: string; // ID de la comuna en Firestore
  nom_comuna: string; // Nombre legible de la comuna
  nom_region: string; // Nombre legible de la región
  fecha: string; // ISO date string
  hora: string;
  region: string; // ID de la región en Firestore
  veterinario?: VeterinarioAnidado;
  costoAdicionalComuna?: number | null; // <--- ¡NUEVO CAMPO AQUÍ!
}

export interface CitaServicio {
  id: string;
  nombre: string;
  precio: number;
  precio_vet?: number; 
}

export interface Mascota {
  edad: string;
  id: string;
  info_adicional: string;
  nombre: string;
  observacion: string;
  sexo: string;
  tipo: 'perro' | 'gato';
  servicios?: CitaServicio[];
}

// ✨ INTERFAZ SERVICIO MODIFICADA:
export interface Servicio {
  id: string;
  nombre: string;
  descripcion?: string;
  disponible_para: ('perro' | 'gato')[];
  // duracion?: number; // Ya eliminamos duracion
  precio: number;
  // requiere_veterinario?: boolean; // Ya eliminamos requiere_veterinario
  en_promocion: boolean; // ¡Nuevo campo!
  new_price?: number; // ¡Nuevo campo!
  precio_vet?: number; // Precio específico para veterinarios, si aplica
}

export interface Cita {
  id: string;
  datosDueno: DatosDueno;
  fechaCreacion: string; // ISO date string
  locationData: LocationData;
  mascotas?: Mascota[];
  estado: boolean; // Usado para el estado general (ej. ¿activa?)
  finalizada?: boolean; // Para indicar si la cita ha sido finalizada
  montoTotal?: number; // Para almacenar el monto total calculado
  precio_base?: number; // Para almacenar el precio base de la cita, si aplica
  pago_vet?: number; // Para almacenar el monto total para veterinarios
  precio_base_vet?:number
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

// --- FIN INTERFACES PARA CITAS ---


async function getLoggedInVeterinario(): Promise<{ id: string; nombre: string } | null> {
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

export async function removeMascotaFromCita(
  citaId: string,
  mascotaIdToRemove: string
): Promise<{ success?: boolean; error?: string }> {
  const veterinario = await getLoggedInVeterinario();
  if (!veterinario) {
    return { error: 'No autorizado. Inicia sesión.' };
  }

  try {
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
    const citaDocRef = adminFirestore.collection('citas').doc(citaId);
    const citaDoc = await citaDocRef.get();

    if (!citaDoc.exists) {
      return { error: 'Cita no encontrada.' };
    }

    // Opcional: Verifica si el veterinario actual tiene permisos para modificar esta cita
    if (citaDoc.data()?.locationData?.veterinario?.id !== veterinario.id) {
      return { error: 'No tienes permisos para eliminar una mascota de esta cita.' };
    }

    // Obtener el array actual de mascotas
    const currentMascotas: Mascota[] = (citaDoc.data()?.mascotas || []) as Mascota[];

    // Filtrar la mascota que se desea eliminar
    const updatedMascotas = currentMascotas.filter(
      (mascota) => mascota.id !== mascotaIdToRemove
    );

    // Actualizar el documento en Firestore con el array de mascotas modificado
    await citaDocRef.update({
      mascotas: updatedMascotas,
    });

    return { success: true };
  } catch (error) {
    console.error('Error al eliminar mascota de la cita:', error);
    return { error: `Error al eliminar mascota de la cita: ${(error as Error).message}` };
  }
}

export async function getCitaById(citaId: string): Promise<{ cita?: Cita; error?: string }> {
  const veterinario = await getLoggedInVeterinario();
  if (!veterinario) {
    return { error: 'No autorizado para obtener la cita. Inicia sesión.' };
  }

  try {
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
    const citaDocRef = adminFirestore.collection('citas').doc(citaId);
    const citaDoc = await citaDocRef.get();

    if (!citaDoc.exists) {
      return { error: 'Cita no encontrada.' };
    }

    const data = citaDoc.data();

    // Opcional: Si quieres asegurar que solo el veterinario asignado puede ver la cita
    if (data?.locationData?.veterinario?.id !== veterinario.id) {
      return { error: 'No tienes permisos para ver esta cita.' };
    }

    const formattedLocationDataFecha = (data.locationData.fecha instanceof Timestamp)
      ? data.locationData.fecha.toDate().toISOString()
      : data.locationData.fecha;

    const formattedFechaCreacion = (data.fechaCreacion instanceof Timestamp)
      ? data.fechaCreacion.toDate().toISOString()
      : data.fechaCreacion;

    const mappedMascotas: Mascota[] = Array.isArray(data.mascotas) ? data.mascotas.map((m: any) => ({
        edad: m.edad,
        id: m.id,
        info_adicional: m.info_adicional,
        nombre: m.nombre,
        observacion: m.observacion,
        sexo: m.sexo,
        tipo: m.tipo,
        servicios: Array.isArray(m.servicios) ? m.servicios.map((s: any) => ({
            id: s.id,
            nombre: s.nombre,
            precio: s.precio,
            precio_vet: s.precio_vet, // Asegúrate de que este campo exista en los datos
        } as CitaServicio)) : []
    })) : [];

    // CAMBIO AQUÍ: Pasa locationData a calculateTotalAmount
    const calculatedTotalAmount = calculateTotalAmount({ mascotas: mappedMascotas, locationData: data.locationData as LocationData,precio_base: data.precio_base });

    const cita: Cita = {
      id: citaDoc.id,
      datosDueno: {
        nombre: data.datosDueno?.nombre || '',
        rut: data.datosDueno?.rut || '',
        telefono: data.datosDueno?.telefono || '',
        email: data.datosDueno?.email || '',
        direccion: {
          calle: data.datosDueno?.direccion?.calle || '',
          numero: data.datosDueno?.direccion?.numero || '',
          comuna: data.datosDueno?.direccion?.comuna || '',
        },
        estacionamiento: data.datosDueno?.estacionamiento,
      },
      estado: data.estado,
      finalizada: data.finalizada ?? false, // Asume 'false' si no está definido
      montoTotal: calculatedTotalAmount ?? 0, // Asume '0' si no está definido
      precio_base: data.precio_base ?? 0, // Incluye el precio base si está disponible
      precio_base_vet: data.precio_base_vet?? 0,
      fechaCreacion: formattedFechaCreacion,
      locationData: {
        ...data.locationData,
        fecha: formattedLocationDataFecha,
      },
      mascotas: Array.isArray(data.mascotas) ? data.mascotas.map((m: any) => ({
        edad: m.edad,
        id: m.id,
        info_adicional: m.info_adicional,
        nombre: m.nombre,
        observacion: m.observacion,
        sexo: m.sexo,
        tipo: m.tipo,
        servicios: Array.isArray(m.servicios) ? m.servicios.map((s: any) => ({
            id: s.id,
            nombre: s.nombre,
            precio: s.precio,
            precio_vet: s.precio_vet, // Asegúrate de que este campo exista en los datos
        } as CitaServicio)) : []
      })) : [],
    };

    return { cita };
  } catch (error) {
    console.error('Error al obtener cita por ID:', error);
    return { error: `Error al obtener la cita: ${(error as Error).message}.` };
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
    console.error('Error fetching regiones and/or comunas for filters:', error);
    return { error: 'Error al cargar regiones y comunas para filtros' };
  }
}

export async function getCitas(filterRegionId?: string, filterComunaId?: string): Promise<{ citas?: Cita[]; error?: string }> {
  const veterinario = await getLoggedInVeterinario();
  if (!veterinario) {
    return { error: 'No se pudo autenticar al veterinario para obtener citas.' };
  }

  try {
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
    console.log("Consultando citas para veterinario ID:", veterinario.id);
    console.log("Filtros aplicados - Región:", filterRegionId, "Comuna:", filterComunaId);

    let queryRef: FirebaseFirestore.Query = adminFirestore
      .collection('citas')
      .where('locationData.veterinario.id', '==', veterinario.id);

    // NUEVO: Aplicar filtro por región si está seleccionada
    if (filterRegionId && filterRegionId !== '') {
      queryRef = queryRef.where('locationData.region', '==', filterRegionId);
    }

    // NUEVO: Aplicar filtro por comuna si está seleccionada
    if (filterComunaId && filterComunaId !== '') {
      queryRef = queryRef.where('locationData.comuna', '==', filterComunaId);
    }

    // Asegúrate de que los orderBy estén al final y coincidan con los filtros y/o índices compuestos.
    queryRef = queryRef
      .orderBy('locationData.fecha', 'asc')
      .orderBy('locationData.hora', 'asc');

    const citasSnapshot = await queryRef.get();

    console.log("Número de documentos encontrados:", citasSnapshot.size);

    if (citasSnapshot.empty) {
      console.log("Snapshot está vacío. No se encontraron documentos con los filtros dados.");
    }

    const citas: Cita[] = citasSnapshot.docs.map(doc => {
      const data = doc.data();

      const formattedLocationDataFecha = (data.locationData.fecha instanceof Timestamp)
        ? data.locationData.fecha.toDate().toISOString()
        : data.locationData.fecha;

      const formattedFechaCreacion = (data.fechaCreacion instanceof Timestamp)
        ? data.fechaCreacion.toDate().toISOString()
        : data.fechaCreacion;

      const datosDueno = data.datosDueno || data.datosDueño;

      const mappedMascotas: Mascota[] = Array.isArray(data.mascotas) ? data.mascotas.map((m: any) => ({
          edad: m.edad,
          id: m.id,
          info_adicional: m.info_adicional,
          nombre: m.nombre,
          observacion: m.observacion,
          sexo: m.sexo,
          tipo: m.tipo,
          servicios: Array.isArray(m.servicios) ? m.servicios.map((s: any) => ({
              id: s.id,
              nombre: s.nombre,
              precio: s.precio,
              precio_vet: s.precio_vet,
          } as CitaServicio)) : []
      })) : [];

      const calculatedTotalAmount = calculateTotalAmount({ mascotas: mappedMascotas, locationData: data.locationData as LocationData,precio_base: data.precio_base });
      const calculatedTotalAmountVet = calculateTotalAmountVet({ mascotas: mappedMascotas });
      const cita: Cita = {
        id: doc.id,
        datosDueno: {
          nombre: datosDueno?.nombre || '',
          rut: datosDueno?.rut || '',
          telefono: datosDueno?.telefono || '',
          email: datosDueno?.email || '',
          direccion: {
            calle: datosDueno?.direccion?.calle || '',
            numero: datosDueno?.direccion?.numero || '',
            comuna: datosDueno?.direccion?.comuna || '',
          },
          estacionamiento: datosDueno?.estacionamiento,
        },
        estado: data.estado,
        finalizada: data.finalizada ?? false,
        montoTotal: calculatedTotalAmount ?? 0,
        precio_base: data.precio_base ?? 0, 
        precio_base_vet: data.precio_base_vet ?? 0,
        pago_vet: calculatedTotalAmountVet ?? 0,
        fechaCreacion: formattedFechaCreacion,
        locationData: {
          ...data.locationData,
          fecha: formattedLocationDataFecha,
        },
        mascotas: Array.isArray(data.mascotas) ? data.mascotas.map((m: any) => ({
          edad: m.edad,
          id: m.id,
          info_adicional: m.info_adicional,
          nombre: m.nombre,
          observacion: m.observacion,
          sexo: m.sexo,
          tipo: m.tipo,
          servicios: Array.isArray(m.servicios) ? m.servicios.map((s: any) => ({
              id: s.id,
              nombre: s.nombre,
              precio: s.precio,
              precio_vet: s.precio_vet,
          } as CitaServicio)) : []
        })) : [],
      };
      return cita;
    });

    return { citas };
  } catch (error) {
    console.error('Error al obtener citas:', error);
    return { error: `Error al obtener las citas: ${(error as Error).message}. Por favor, intente nuevamente.` };
  }
}

// --- Helper function to calculate total amount ---
// CAMBIO AQUÍ: La función ahora acepta también LocationData para el costo de comuna
function calculateTotalAmount(citaData: { mascotas?: Mascota[], locationData?: LocationData,precio_base?: number }): number {
    let totalAmount = citaData.precio_base ?? 0; // Inicia con el precio base si existe
    if (citaData.mascotas && Array.isArray(citaData.mascotas)) {
        totalAmount += citaData.mascotas.reduce((sumMascota, mascota) => {
            if (mascota.servicios && Array.isArray(mascota.servicios)) {
                return sumMascota + mascota.servicios.reduce((sumServicio, servicio) => {
                    // Ensure price is a number, handling potential string prices
                    const precio = typeof servicio.precio === 'number' ? servicio.precio : parseFloat(servicio.precio || '0');
                    return sumServicio + precio;
                }, 0);
            }
            return sumMascota;
        }, 0);
    }
    // NUEVO: Suma el costo adicional de comuna
    if (citaData.locationData?.costoAdicionalComuna !== null && citaData.locationData?.costoAdicionalComuna !== undefined) {
        totalAmount += citaData.locationData.costoAdicionalComuna;
    }
    return totalAmount;
}

function calculateTotalAmountVet(citaData: { mascotas?: Mascota[] }) {
  let vetTotalAmount = 0; // Inicia con el monto total para veterinarios
  if (citaData.mascotas && Array.isArray(citaData.mascotas)) {
    vetTotalAmount += citaData.mascotas.reduce((sumMascota, mascota) => {
      if (mascota.servicios && Array.isArray(mascota.servicios)) {
        return sumMascota + mascota.servicios.reduce((sumServicio, servicio) => {
          const precioVet = typeof servicio.precio_vet === 'number' ? servicio.precio_vet : parseFloat(servicio.precio_vet || '0');
          return sumServicio + precioVet;
        }, 0);
      }
      return sumMascota;
    }, 0);
  }
  return vetTotalAmount;
}
// --- FIN Helper function ---

export async function deleteCita(
  citaId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
    const veterinario = await getLoggedInVeterinario();
    if (!veterinario) {
      return { error: 'No autorizado para eliminar la cita. Inicia sesión.' };
    }

    const citaDocRef = adminFirestore.collection('citas').doc(citaId);
    const citaDoc = await citaDocRef.get();

    if (!citaDoc.exists) {
      return { error: 'Cita no encontrada.' };
    }

    if (citaDoc.data()?.locationData?.veterinario?.id !== veterinario.id) {
      return { error: 'No tienes permisos para eliminar esta cita. No eres el veterinario asignado.' };
    }

    await citaDocRef.delete();
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar cita:', error);
    return { error: `Error al eliminar cita: ${(error as Error).message}` };
  }
}

export async function getAvailableServices(): Promise<{ services?: Servicio[]; error?: string }> {
  try {
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
    const servicesSnapshot = await adminFirestore.collection('servicios').get();
    const services: Servicio[] = servicesSnapshot.docs.map(doc => ({
      id: doc.id,
      nombre: doc.data().nombre,
      descripcion: doc.data().descripcion,
      disponible_para: (doc.data().disponible_para || []) as ('perro' | 'gato')[], // Asegurar tipo
      // duracion: doc.data().duracion, // Eliminar si no existe en Firestore
      precio: doc.data().precio,
      // requiere_veterinario: doc.data().requiere_veterinario, // Eliminar si no existe en Firestore
      en_promocion: doc.data().en_promocion || false, // ✨ Obtener el nuevo campo
      new_price: doc.data().new_price, // ✨ Obtener el nuevo campo
      precio_vet: doc.data().precio_vet,
    })) as Servicio[];

    return { services };
  } catch (error) {
    console.error('Error al obtener servicios disponibles:', error);
    return { error: `Error al obtener servicios: ${(error as Error).message}` };
  }
}


export async function updateMascotaServices(
  citaId: string,
  mascotaId: string,
  updatedServices: CitaServicio[]
): Promise<{ success?: boolean; error?: string }> {
  const veterinario = await getLoggedInVeterinario();
  if (!veterinario) {
    return { error: 'No autorizado. Inicia sesión.' };
  }

  try {
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
    const citaDocRef = adminFirestore.collection('citas').doc(citaId);
    const citaDoc = await citaDocRef.get();

    if (!citaDoc.exists) {
      return { error: 'Cita no encontrada.' };
    }

    if (citaDoc.data()?.locationData?.veterinario?.id !== veterinario.id) {
      return { error: 'No tienes permisos para modificar esta cita.' };
    }

    const currentMascotas: Mascota[] = (citaDoc.data()?.mascotas || []) as Mascota[];
    const mascotaIndex = currentMascotas.findIndex(m => m.id === mascotaId);

    if (mascotaIndex === -1) {
      return { error: 'Mascota no encontrada en la cita.' };
    }

    const newMascotas = [...currentMascotas];
    newMascotas[mascotaIndex] = {
      ...newMascotas[mascotaIndex],
      servicios: updatedServices
    };

    await citaDocRef.update({
      mascotas: newMascotas
    });

    return { success: true };
  } catch (error) {
    console.error('Error al actualizar servicios de la mascota:', error);
    return { error: `Error al actualizar servicios de la mascota: ${(error as Error).message}` };
  }
}

export async function addMascotaToCita(
  citaId: string,
  newMascotaData: Omit<Mascota, 'id' | 'servicios'>
): Promise<{ success?: boolean; mascotaId?: string; error?: string }> {
  const veterinario = await getLoggedInVeterinario();
  if (!veterinario) {
    return { error: 'No autorizado. Inicia sesión.' };
  }

  try {
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
    const citaDocRef = adminFirestore.collection('citas').doc(citaId);
    const citaDoc = await citaDocRef.get();

    if (!citaDoc.exists) {
      return { error: 'Cita no encontrada.' };
    }

    if (citaDoc.data()?.locationData?.veterinario?.id !== veterinario.id) {
      return { error: 'No tienes permisos para agregar una mascota a esta cita.' };
    }

    const uniqueMascotaId = adminFirestore.collection('temp').doc().id;

    const mascotaToAdd: Mascota = {
      ...newMascotaData,
      id: uniqueMascotaId,
      servicios: [],
    };

    await citaDocRef.update({
      mascotas: FieldValue.arrayUnion(mascotaToAdd)
    });

    return { success: true, mascotaId: uniqueMascotaId };
  } catch (error) {
    console.error('Error al agregar mascota a la cita:', error);
    return { error: `Error al agregar mascota a la cita: ${(error as Error).message}` };
  }
}

export async function createCita(citaData: Omit<Cita, 'id' | 'fechaCreacion' | 'finalizada' | 'montoTotal'>): Promise<{ success?: boolean; id?: string; error?: string }> {
  const veterinario = await getLoggedInVeterinario();
  if (!veterinario) {
    return { error: 'No autorizado para crear la cita. Inicia sesión.' };
  }

  try {
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
    const docRef = await adminFirestore.collection('citas').add({
      ...citaData,
      precio_base: citaData.precio_base ?? 0, // Asegura que precio_base se pase, o se inicialice a 0 si no viene
      precio_base_vet: citaData.precio_base_vet ?? 0,
      locationData: {
        ...citaData.locationData,
        veterinario: veterinario,
        // Asegura que costoAdicionalComuna se pase, o se inicialice a 0 si no viene
        costoAdicionalComuna: citaData.locationData?.costoAdicionalComuna ?? 0, 
      },
      estado: false,
      finalizada: false, // Por defecto, una nueva cita no está finalizada
      montoTotal: 0,     // Monto inicial 0 (se recalculará en finalizeAppointment o al ver la cita)
      fechaCreacion: FieldValue.serverTimestamp(),
      mascotas: citaData.mascotas || [],
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error al crear cita:', error);
    return { error: `Error al crear cita: ${(error as Error).message}` };
  }
}

// --- NUEVA ACCIÓN DE SERVIDOR: finalizeAppointment ---
export async function finalizeAppointment(appointmentId: string): Promise<{ success: boolean; data?: { totalAmount: number; ownerPhone: string; ownerName: string; vetName: string }; error?: string }> {
  const veterinario = await getLoggedInVeterinario();
  if (!veterinario) {
    return { success: false, error: 'No autorizado. Inicia sesión.' };
  }

  try {
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
    const appointmentRef = adminFirestore.collection('citas').doc(appointmentId);
    const doc = await appointmentRef.get();

    if (!doc.exists) {
      return { success: false, error: 'Cita no encontrada.' };
    }

    const appointmentData = doc.data() as Cita; // Cast the data to your Cita interface

    // Validar que el veterinario logueado sea el asignado a la cita
    if (appointmentData.locationData?.veterinario?.id !== veterinario.id) {
      return { success: false, error: 'No tienes permisos para finalizar esta cita.' };
    }

    // Check if the appointment is already finalized
    if (appointmentData.finalizada) {
      return { success: false, error: 'La cita ya ha sido finalizada.' };
    }

    // Calculate total amount using the helper function (ahora incluye costoAdicionalComuna)
    const totalAmount = calculateTotalAmount({ 
      mascotas: appointmentData.mascotas,
      locationData: appointmentData.locationData // Pasa locationData
      , precio_base: appointmentData.precio_base // Pasa precio_base si está disponible
    });

    // Update the appointment status
    await appointmentRef.update({
      finalizada: true,
      montoTotal: totalAmount, // Save the calculated total amount
      actualizado: FieldValue.serverTimestamp(), // Optional: add an update timestamp
    });

    // Ensure datosDueno and locationData are accessed safely
    const ownerPhone = appointmentData.datosDueno?.telefono || '';
    const ownerName = appointmentData.datosDueno?.nombre || '';
    const vetName = appointmentData.locationData?.veterinario?.nombre || veterinario.nombre;

    return {
      success: true,
      data: {
        totalAmount,
        ownerPhone,
        ownerName,
        vetName,
      }
    };

  } catch (error) {
    console.error('Error al finalizar la cita:', error);
    return { success: false, error: `Error interno al finalizar la cita: ${(error as Error).message}` };
  }
}