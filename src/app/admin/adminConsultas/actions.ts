// app/horarios/citas-actions.ts
"use server";

import { cookies } from 'next/headers';
//import { adminAuth, adminFirestore } from '@/lib/firebase-admin';
import { getAdminInstances } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

// --- INTERFACES PARA CITAS (ACTUALIZADAS) ---
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
  estacionamiento?: string | null;
}

export interface VeterinarioAnidado {
  id: string;
  nombre: string;
}

export interface LocationData {
  comuna: string;
  nom_comuna: string;
  nom_region: string;
  fecha: string;
  hora: string;
  region: string;
  veterinario?: VeterinarioAnidado;
  costoAdicionalComuna?: number | null;
}

export interface CitaServicio {
  id: string;
  nombre: string;
  precio: number;
  precio_vet?: number; // Precio específico para veterinarios, si aplica
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

export interface Servicio {
  id: string;
  nombre: string;
  descripcion?: string;
  disponible_para: ('perro' | 'gato')[];
  precio: number;
  en_promocion: boolean;
  new_price?: number;
  precio_vet?: number;
}

export interface Cita {
  id: string;
  datosDueno: DatosDueno;
  fechaCreacion: string;
  locationData: LocationData;
  mascotas?: Mascota[];
  estado: boolean;
  finalizada?: boolean;
  montoTotal?: number;
  veterinario?: string; // Nombre del veterinario asignado a la cita
  precio_base?: number; // Para almacenar el precio base de la cita, si aplica
  pago_vet?:number;
  precio_base_vet?:number

}

export interface Region {
  id: string;
  nombre: string;
}

export interface Comuna {
  id: string;
  nombre: string;
  regionId: string;
}

export interface VeterinarioFilter {
  id: string;
  nombre: string;
}
// --- FIN INTERFACES ---

// FUNCIÓN GENERAL PARA OBTENER USUARIO LOGUEADO Y SU ROL
async function getLoggedInUser(): Promise<{ id: string; nombre: string; role?: string } | null> {

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
      role: userData?.role // Devuelve el rol del usuario
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
  const user = await getLoggedInUser();
  if (!user) {
    return { error: 'No autorizado. Inicia sesión.' };
  }

  try {
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
    const citaDocRef = adminFirestore.collection('citas').doc(citaId);
    const citaDoc = await citaDocRef.get();

    if (!citaDoc.exists) {
      return { error: 'Cita no encontrada.' };
    }
    // Para el super-admin, no se verifica si el veterinario actual es el asignado a la cita
    const currentMascotas: Mascota[] = (citaDoc.data()?.mascotas || []) as Mascota[];
    const updatedMascotas = currentMascotas.filter(
      (mascota) => mascota.id !== mascotaIdToRemove
    );

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
  const user = await getLoggedInUser();
  if (!user) {
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
    if (!data) {
      return { error: 'Datos de la cita no encontrados.' };
    }
    // Para el super-admin, no se verifica si el veterinario actual es el asignado a la cita
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
            precio_vet: s.precio_vet, // Asegúrate de que este campo exista en los datos
        } as CitaServicio)) : []
    })) : [];
    
    const calculatedTotalAmount = calculateTotalAmount({ mascotas: mappedMascotas, locationData: data.locationData as LocationData,precio_base: data.precio_base });

    const cita: Cita = {
      id: citaDoc.id,
      veterinario: data.locationData.veterinario?.nombre || '',
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
      precio_base: data.precio_base ?? 0, // Incluye el precio base si está disponible
      precio_base_vet: data.precio_base_vet?? 0,
      fechaCreacion: formattedFechaCreacion,
      locationData: {
        ...data.locationData,
        fecha: formattedLocationDataFecha,
      },
      mascotas: mappedMascotas,
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

// NUEVA ACCIÓN: Para obtener todos los veterinarios con rol 'vet' (para el filtro)
export async function getAllVeterinariosForFilter(): Promise<{ veterinarios?: VeterinarioFilter[]; error?: string }> {
  try {
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
    const usersSnapshot = await adminFirestore.collection('users')
     .where('role', 'in', ['vet', 'admin'])
      .orderBy('displayName', 'asc')
      .get();

    const veterinarios: VeterinarioFilter[] = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      nombre: doc.data().displayName || 'Sin Nombre'
    }));

    return { veterinarios };
  } catch (error) {
    console.error('Error al obtener la lista de veterinarios para el filtro:', error);
    return { error: `Error al cargar veterinarios: ${(error as Error).message}` };
  }
}

// getCitas: Ahora obtiene TODAS las citas y filtra por veterinario si se especifica
export async function getCitas(
  filterRegionId?: string,
  filterComunaId?: string,
  filterVeterinarioId?: string // Filtro opcional por veterinario
): Promise<{ citas?: Cita[]; error?: string }> {
  const user = await getLoggedInUser();
  if (!user) {
    return { error: 'No se pudo autenticar al usuario para obtener citas.' };
  }

  try {
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
    console.log("Consultando TODAS las citas para administración. Usuario ID:", user.id);
    console.log("Filtros aplicados - Región:", filterRegionId, "Comuna:", filterComunaId, "Veterinario:", filterVeterinarioId);

    let queryRef: FirebaseFirestore.Query = adminFirestore.collection('citas');

    // Aplicar filtro por región si está seleccionada
    if (filterRegionId && filterRegionId !== '') {
      queryRef = queryRef.where('locationData.region', '==', filterRegionId);
    }

    // Aplicar filtro por comuna si está seleccionada
    if (filterComunaId && filterComunaId !== '') {
      queryRef = queryRef.where('locationData.comuna', '==', filterComunaId);
    }

    // Aplicar filtro por veterinario si está seleccionado
    if (filterVeterinarioId && filterVeterinarioId !== '') {
      queryRef = queryRef.where('locationData.veterinario.id', '==', filterVeterinarioId);
    }

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
              precio_vet: s.precio_vet, // Asegúrate de que este campo exista en los datos
          } as CitaServicio)) : []
      })) : [];

      const calculatedTotalAmount = calculateTotalAmount({ mascotas: mappedMascotas, locationData: data.locationData as LocationData, precio_base: data.precio_base });
      const calculatedTotalAmountVet = calculateTotalAmountVet({ mascotas: mappedMascotas });
      const cita: Cita = {
        id: doc.id,
        veterinario: data.locationData.veterinario?.nombre || '', // Nombre del veterinario asignado a la cita
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
        pago_vet: calculatedTotalAmountVet ?? 0, // Monto total para veterinarios
        fechaCreacion: formattedFechaCreacion,
        locationData: {
          ...data.locationData,
          fecha: formattedLocationDataFecha,
        },
        mascotas: mappedMascotas,
      };
      return cita;
    });

    return { citas };
  } catch (error) {
    console.error('Error al obtener citas:', error);
    return { error: `Error al obtener las citas: ${(error as Error).message}. Por favor, intente nuevamente.` };
  }
}

// Helper function to calculate total amount (actualizada para incluir locationData)
function calculateTotalAmount(citaData: { mascotas?: Mascota[], locationData?: LocationData, precio_base?: number }): number {
    let totalAmount = citaData.precio_base || 0; // Inicia con el precio base si existe
    if (citaData.mascotas && Array.isArray(citaData.mascotas)) {
        totalAmount += citaData.mascotas.reduce((sumMascota, mascota) => {
            if (mascota.servicios && Array.isArray(mascota.servicios)) {
                return sumMascota + mascota.servicios.reduce((sumServicio, servicio) => {
                    const precio = typeof servicio.precio === 'number' ? servicio.precio : parseFloat(servicio.precio || '0');
                    return sumServicio + precio;
                }, 0);
            }
            return sumMascota;
        }, 0);
    }
    // Suma el costo adicional de comuna si existe
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
  const user = await getLoggedInUser();
  if (!user) {
    return { error: 'No autorizado para eliminar la cita. Inicia sesión.' };
  }

  try {
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
    const citaDocRef = adminFirestore.collection('citas').doc(citaId);
    const citaDoc = await citaDocRef.get();

    if (!citaDoc.exists) {
      return { error: 'Cita no encontrada.' };
    }
    // Para el super-admin, no se verifica si el veterinario actual es el asignado a la cita
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
      disponible_para: (doc.data().disponible_para || []) as ('perro' | 'gato')[],
      precio: doc.data().precio,
      en_promocion: doc.data().en_promocion || false,
      new_price: doc.data().new_price,
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
  const user = await getLoggedInUser();
  if (!user) {
    return { error: 'No autorizado. Inicia sesión.' };
  }

  try {
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
    const citaDocRef = adminFirestore.collection('citas').doc(citaId);
    const citaDoc = await citaDocRef.get();

    if (!citaDoc.exists) {
      return { error: 'Cita no encontrada.' };
    }
    // Para el super-admin, no se verifica si el veterinario actual es el asignado a la cita
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
  const user = await getLoggedInUser();
  if (!user) {
    return { error: 'No autorizado. Inicia sesión.' };
  }

  try {
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
    const citaDocRef = adminFirestore.collection('citas').doc(citaId);
    const citaDoc = await citaDocRef.get();

    if (!citaDoc.exists) {
      return { error: 'Cita no encontrada.' };
    }
    // Para el super-admin, no se verifica si el veterinario actual es el asignado a la cita
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
  const user = await getLoggedInUser();
  if (!user) {
    return { error: 'No autorizado para crear la cita. Inicia sesión.' };
  }

  try {
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
    const docRef = await adminFirestore.collection('citas').add({
      ...citaData,
      precio_base: citaData.precio_base ?? 0, 
      precio_base_vet: citaData.precio_base_vet ?? 0,
      locationData: {
        ...citaData.locationData,
        veterinario: { id: user.id, nombre: user.nombre }, // Asigna el veterinario logueado a la cita
        costoAdicionalComuna: citaData.locationData?.costoAdicionalComuna ?? 0,
      },
      estado: false,
      finalizada: false,
      montoTotal: 0,
      fechaCreacion: FieldValue.serverTimestamp(),
      mascotas: citaData.mascotas || [],
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error al crear cita:', error);
    return { error: `Error al crear cita: ${(error as Error).message}` };
  }
}

// ACCIÓN DE SERVIDOR: finalizeAppointment (actualizada para admin general)
export async function finalizeAppointment(appointmentId: string): Promise<{ success: boolean; data?: { totalAmount: number; ownerPhone: string; ownerName: string; vetName: string; servicios: string; precioBase: number; precioComuna: number }; error?: string }> {
  const user = await getLoggedInUser();
  if (!user) {
    return { success: false, error: 'No autorizado. Inicia sesión.' };
  }

  try {
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
    const appointmentRef = adminFirestore.collection('citas').doc(appointmentId);
    const doc = await appointmentRef.get();

    if (!doc.exists) {
      return { success: false, error: 'Cita no encontrada.' };
    }

    const appointmentData = doc.data() as Cita;

    if (appointmentData.finalizada) {
      return { success: false, error: 'La cita ya ha sido finalizada.' };
    }

    const totalAmount = calculateTotalAmount({ 
      mascotas: appointmentData.mascotas,
      locationData: appointmentData.locationData,
      precio_base: appointmentData.precio_base
    });

    await appointmentRef.update({
      finalizada: true,
      montoTotal: totalAmount,
      actualizado: FieldValue.serverTimestamp(),
    });

    const ownerPhone = appointmentData.datosDueno?.telefono || '';
    const ownerName = appointmentData.datosDueno?.nombre || '';
    const vetName = appointmentData.locationData?.veterinario?.nombre || '';
    const precioBase = appointmentData.precio_base || 0;
    const precioComuna = appointmentData.locationData?.costoAdicionalComuna || 0;
    // --- LÍNEAS MODIFICADAS ---
    const serviciosConPrecio = appointmentData.mascotas
        ?.flatMap(mascota => mascota.servicios || []) // Obtiene todos los servicios en un solo arreglo
        .filter(servicio => servicio && servicio.nombre && typeof servicio.precio === 'number') // Filtra servicios inválidos
        .map(servicio => `${servicio.nombre}: $${servicio.precio.toLocaleString('es-CL')}`); // Crea el string "Nombre: $Precio"

    // Une los servicios únicos en un texto final
    const servicios = [...new Set(serviciosConPrecio)].join('\n');
    // --- FIN DE LÍNEAS MODIFICADAS ---
    return {
      success: true,
      data: {
        totalAmount,
        ownerPhone,
        ownerName,
        vetName,
        servicios,
        precioBase,
        precioComuna
      }
    };

  } catch (error) {
    console.error('Error al finalizar la cita:', error);
    return { success: false, error: `Error interno al finalizar la cita: ${(error as Error).message}` };
  }
}