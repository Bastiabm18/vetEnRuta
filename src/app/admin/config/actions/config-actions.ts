// actions.ts
'use server';

import { adminFirestore } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Tipos para regiones
export interface Region {
  id: string;
  nombre: string;
}


export interface CreateRegionData {
  nombre: string;
}

// Tipos para comunas
export interface Comuna {
  id: string;
  nombre: string;
  // ✨ CAMBIO: Usamos regionId en el tipo de interfaz para que coincida con Firestore
  regionId: string; 
}

export interface CreateComunaData {
  nombre: string;
  // ✨ CAMBIO: Usamos regionId para la creación también
  regionId: string;
}

export interface Servicio {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  // duracion: number; // Eliminado
  disponible_para: ("perro" | "gato")[]; // Eliminado "otro"
  // requiere_veterinario: boolean; // Eliminado
  en_promocion: boolean; // Nuevo campo
  new_price?: number; // Nuevo campo, opcional en la carga
  precio_vet?: number;
  precio_item?: number;
}

export interface CreateServicioData {
  nombre: string;
  descripcion: string;
  precio: number;
  // duracion?: number; // Eliminado
  disponible_para: ("perro" | "gato")[]; // Eliminado "otro"
  // requiere_veterinario?: boolean; // Eliminado
  en_promocion: boolean; // Nuevo campo
  new_price?: number; // Nuevo campo, opcional para la creación/actualización
  precio_vet?:number;
  precio_item: number;
}

// --- Operaciones CRUD para Regiones ---
export async function createRegion(data: CreateRegionData): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const docRef = await adminFirestore.collection('regiones').add({
      nombre: data.nombre,
      createdAt: Timestamp.now()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creando región:', error);
    return { success: false, error: 'No se pudo crear la región' };
  }
}

export async function updateRegion(id: string, data: Partial<CreateRegionData>): Promise<{ success: boolean; error?: string }> {
  try {
    await adminFirestore.collection('regiones').doc(id).update({
      ...data,
      updatedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error) {
    console.error('Error actualizando región:', error);
    return { success: false, error: 'No se pudo actualizar la región' };
  }
}

export async function deleteRegion(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await adminFirestore.collection('regiones').doc(id).delete();
    return { success: true };
  } catch (error) {
    console.error('Error eliminando región:', error);
    return { success: false, error: 'No se pudo eliminar la región' };
  }
}

export async function getAllRegiones(): Promise<Region[]> {
  try {
    const snapshot = await adminFirestore.collection('regiones').orderBy('nombre').get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      nombre: doc.data().nombre
    }));
  } catch (error) {
    console.error('Error obteniendo regiones:', error);
    return [];
  }
}

// --- Operaciones CRUD para Comunas ---
export async function createComuna(data: CreateComunaData): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const docRef = await adminFirestore.collection('comunas').add({
      nombre: data.nombre,
      // ✨ CAMBIO: Guardar como regionId en Firestore
      regionId: data.regionId, 
      createdAt: Timestamp.now()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creando comuna:', error);
    return { success: false, error: 'No se pudo crear la comuna' };
  }
}

export async function updateComuna(id: string, data: Partial<CreateComunaData>): Promise<{ success: boolean; error?: string }> {
  try {
    // ✨ CAMBIO: Asegurar que se use 'regionId' si está presente en los datos
    const updateData: any = { ...data };
    if (updateData.regionId !== undefined) {
      // Si regionId está presente, se usa directamente
      // No necesitamos eliminar regionId o añadir region_id porque ahora el tipo de datos ya espera regionId
    }

    await adminFirestore.collection('comunas').doc(id).update({
      ...updateData,
      updatedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error) {
    console.error('Error actualizando comuna:', error);
    return { success: false, error: 'No se pudo actualizar la comuna' };
  }
}

export async function deleteComuna(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await adminFirestore.collection('comunas').doc(id).delete();
    return { success: true };
  } catch (error) {
    console.error('Error eliminando comuna:', error);
    return { success: false, error: 'No se pudo eliminar la comuna' };
  }
}

export async function getAllComunas(): Promise<Comuna[]> {
  try {
    const snapshot = await adminFirestore.collection('comunas').orderBy('nombre').get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      nombre: doc.data().nombre,
      // ✨ CAMBIO: Leer directamente el campo 'regionId' de Firestore
      regionId: doc.data().regionId 
    }));
  } catch (error) {
    console.error('Error obteniendo comunas:', error);
    return [];
  }
}

// --- Operaciones CRUD para Servicios ---
// Operaciones CRUD para Servicios
export async function createServicio(data: CreateServicioData): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const docRef = await adminFirestore.collection('servicios').add({
      ...data,
      createdAt: Timestamp.now()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creando servicio:', error);
    return { success: false, error: 'No se pudo crear el servicio' };
  }
}

export async function updateServicio(id: string, data: Partial<CreateServicioData>): Promise<{ success: boolean; error?: string }> {
  try {
    // Asegurar que 'new_price' se elimine si 'en_promocion' es falso
    const dataToUpdate: any = { ...data };
    if (!dataToUpdate.en_promocion) {
      delete dataToUpdate.new_price;
    }

    await adminFirestore.collection('servicios').doc(id).update({
      ...dataToUpdate,
      updatedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error) {
    console.error('Error actualizando servicio:', error);
    return { success: false, error: 'No se pudo actualizar el servicio' };
  }
}

// ... (deleteServicio se mantiene igual) ...

export async function getAllServicios(): Promise<Servicio[]> {
  try {
    const snapshot = await adminFirestore.collection('servicios').orderBy('nombre').get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      nombre: doc.data().nombre,
      descripcion: doc.data().descripcion,
      precio: doc.data().precio,
      // duracion: doc.data().duracion, // Eliminado
      disponible_para: doc.data().disponible_para || [],
      // requiere_veterinario: doc.data().requiere_veterinario !== false, // Eliminado
      en_promocion: doc.data().en_promocion || false, // Asegurar un valor booleano
      new_price: doc.data().new_price, // Incluir new_price
      precio_vet: doc.data().precio_vet, // Incluir precio_vet
      precio_item: doc.data().precio_item 
    }));
  } catch (error) {
    console.error('Error obteniendo servicios:', error);
    return [];
  }
}

export async function deleteServicio(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await adminFirestore.collection('servicios').doc(id).delete();
    return { success: true };
  } catch (error) {
    console.error('Error eliminando servicio:', error);
    return { success: false, error: 'No se pudo eliminar el servicio' };
  }
}

export async function getPrecioBase(): Promise<number> {
  try {
    const snapshot = await adminFirestore.collection('precio_base').limit(1).get();

    // Si la colección está vacía, no hay precio que obtener.
    if (snapshot.empty) {
      console.log('No se encontró ningún documento en la colección precio_base.');
      return 0;
    }

    // Usamos el primer documento que encontramos.
    const doc = snapshot.docs[0];
    // Leemos el campo "precio_base" como se ve en tu imagen.
    return doc.data().precio_base as number;

  } catch (error) {
    console.error('Error obteniendo el precio base:', error);
    return 0;
  }
}

/**
 * Actualiza el precio base de la visita.
 * Busca el primer documento y lo actualiza. Si no existe, crea uno nuevo.
 * @param {number} nuevoPrecio - El nuevo precio a guardar.
 * @returns {Promise<{ success: boolean; error?: string }>}
 */
export async function updatePrecioBase(nuevoPrecio: number): Promise<{ success: boolean; error?: string }> {
  try {
    const snapshot = await adminFirestore.collection('precio_base').limit(1).get();

    if (snapshot.empty) {
      // Si no hay ningún documento, creamos uno nuevo.
      // Firestore le asignará un ID aleatorio, replicando tu estructura.
      await adminFirestore.collection('precio_base').add({
        precio_base: nuevoPrecio,
        createdAt: Timestamp.now()
      });
    } else {
      // Si ya existe un documento, obtenemos su ID y lo actualizamos.
      const docId = snapshot.docs[0].id;
      await adminFirestore.collection('precio_base').doc(docId).update({
        precio_base: nuevoPrecio,
        updatedAt: Timestamp.now()
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error actualizando el precio base:', error);
    return { success: false, error: 'No se pudo actualizar el precio base' };
  }
}

