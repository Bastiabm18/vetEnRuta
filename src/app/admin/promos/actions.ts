// /app/admin/promos/actions.ts
'use server';

import { db, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, orderBy, query, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { revalidatePath } from 'next/cache';

// Interface for promotions
export interface PromoItem {
  id?: string; // Optional for when reading from Firestore, as it's the doc ID
  title: string;
  service: string;
  description: string;
  price: string;
  new_price?: string; // Optional for new prices
  image: string; // URL of the image
  imagePath?: string;
  createdAt?: string | number | null;
}

const PROMOS_COLLECTION_NAME = 'promos';
const PROMOS_STORAGE_PATH = 'promo_images/';

// Helper to sanitize filename
function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9.\-]/g, '_');
}

/**
 * Fetches a single promotion by its ID from Firestore.
 * @param promoId The ID of the promotion to fetch.
 * @returns A PromoItem object if found, otherwise null.
 */
export async function getPromoById(promoId: string): Promise<PromoItem | null> {
  if (!promoId) {
    console.warn("getPromoById called with an empty promoId.");
    return null;
  }

  try {
    const promoRef = doc(db, PROMOS_COLLECTION_NAME, promoId);
    const docSnap = await getDoc(promoRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        title: data.title,
        service: data.service,
        description: data.description,
        price: data.price,
        new_price: data.new_price || undefined, // Ensures new_price is mapped correctly, undefined if not present
        image: data.image,
        imagePath: data.imagePath || undefined,
        createdAt: data.createdAt ? data.createdAt : null,
      } as PromoItem;
    } else {
      console.log(`No promo found with ID: ${promoId}`);
      return null;
    }
  } catch (error) {
    console.error('Error fetching promo from Firestore:', error);
    return null;
  }
}

/**
 * Adds a new promotion to Firestore and uploads its image to Storage.
 * @param formData FormData containing promo details and the image file.
 * @returns A success/error message.
 */
export async function addPromo(formData: FormData) {
  const title = formData.get('title') as string;
  const service = formData.get('service') as string;
  const description = formData.get('description') as string;
  const price = formData.get('price') as string;
  const new_price = formData.get('new_price') as string | undefined; // Get new_price from form
  const imageFile = formData.get('image') as File | null;

  if (!title || !service || !description || !price) {
    return { success: false, message: 'Todos los campos de texto son requeridos (Título, Servicio, Descripción, Precio Original).' };
  }

  if (!imageFile || !(imageFile instanceof File) || imageFile.size === 0) {
    return { success: false, message: 'Un archivo de imagen válido es requerido.' };
  }

  try {
    if (typeof imageFile.arrayBuffer !== 'function') {
      return { success: false, message: 'Formato inválido de imagen.' };
    }

    const sanitizedFileName = sanitizeFilename(imageFile.name);
    const uniqueFileName = `${Date.now()}-${sanitizedFileName}`;
    const storageRef = ref(storage, `${PROMOS_STORAGE_PATH}${uniqueFileName}`);
    
    const fileBuffer = await imageFile.arrayBuffer();
    await uploadBytes(storageRef, fileBuffer);
    
    const imageUrl = await getDownloadURL(storageRef);
    const imagePath = storageRef.fullPath;

    const newPromo: Omit<PromoItem, 'id'> = {
      title,
      service,
      description,
      price,
      new_price: new_price && new_price !== "" ? new_price : undefined, // Store as undefined if empty string
      image: imageUrl,
      imagePath: imagePath,
      createdAt: new Date().toISOString()
    };

    await addDoc(collection(db, PROMOS_COLLECTION_NAME), newPromo);

    revalidatePath('/admin/promos');
    revalidatePath('/');
    
    return { success: true, message: 'Promoción agregada de manera exitosa!' };
  } catch (error) {
    console.error('Error añadiendo la promo:', error);
    return { 
      success: false, 
      message: `Error al cargar la promo: ${error instanceof Error ? error.message : ' error desconocido'}` 
    };
  }
}

/**
 * Updates an existing promotion in Firestore and handles image replacement if a new image is provided.
 * @param id The ID of the promotion to update.
 * @param formData FormData containing updated promo details and potentially a new image file.
 * @returns A success/error message.
 */
export async function updatePromo(id: string, formData: FormData) {
  const title = formData.get('title') as string;
  const service = formData.get('service') as string;
  const description = formData.get('description') as string;
  const price = formData.get('price') as string;
  const new_price = formData.get('new_price') as string | undefined; // Get new_price from form
  const imageFile = formData.get('image');
  const existingImagePath = formData.get('existingImagePath') as string | null;

  if (!id || !title || !service || !description || !price) {
    return { success: false, message: 'Todos los campos son requeridos.' };
  }

  try {
    let imageUrl = '';
    let updatedImagePath = existingImagePath || '';

    // Check if a new image file is provided and it's a valid File object
    if (imageFile instanceof File && imageFile.size > 0) {
      // Delete old image from storage if it exists
      if (existingImagePath) {
        const oldImageRef = ref(storage, existingImagePath);
        await deleteObject(oldImageRef).catch(e => console.warn("No se pudo eliminar la imagen antigua:", e.message));
      }

      // Upload new image
      const sanitizedFileName = sanitizeFilename(imageFile.name);
      const uniqueFileName = `${Date.now()}-${sanitizedFileName}`;
      const storageRef = ref(storage, `${PROMOS_STORAGE_PATH}${uniqueFileName}`);
      await uploadBytes(storageRef, imageFile);
      imageUrl = await getDownloadURL(storageRef);
      updatedImagePath = storageRef.fullPath;
    } else {
      // If no new image file is provided, retrieve the existing image URL from the current document
      const promoRef = doc(db, PROMOS_COLLECTION_NAME, id);
      const promoSnap = await getDoc(promoRef);
      if (promoSnap.exists()) {
        const data = promoSnap.data();
        imageUrl = data.image || ''; // Use existing image URL
        updatedImagePath = data.imagePath || ''; // Ensure the path is also consistent
      }
    }

    const updatedPromo: Partial<PromoItem> = {
      title,
      service,
      description,
      price,
      new_price: new_price && new_price !== "" ? new_price : undefined, // Store as undefined if empty string
      image: imageUrl,
      imagePath: updatedImagePath,
    };

    const promoDocRef = doc(db, PROMOS_COLLECTION_NAME, id);
    await updateDoc(promoDocRef, updatedPromo);

    revalidatePath('/admin/promos');
    revalidatePath('/');
    
    return { success: true, message: 'Promoción actualizada con éxito!' };
  } catch (error) {
    console.error('Error updating promo:', error);
    return { success: false, message: `Fallo al actualizar la promo: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * Deletes a promotion from Firestore and its associated image from Storage.
 * @param id The ID of the promotion to delete.
 * @param imagePath The storage path of the image to delete.
 * @returns A success/error message.
 */
export async function deletePromo(id: string, imagePath: string) {
  if (!id) {
    return { success: false, message: 'ID de la promo es requerido para eliminar.' };
  }

  try {
    // Delete image from storage
    if (imagePath) {
      const imageRef = ref(storage, imagePath);
      await deleteObject(imageRef).catch(e => console.warn("No se pudo eliminar la imagen de Storage:", e.message));
    }

    // Delete document from Firestore
    await deleteDoc(doc(db, PROMOS_COLLECTION_NAME, id));

    revalidatePath('/admin/promos');
    revalidatePath('/');
    
    return { success: true, message: 'Promoción eliminada!' };
  } catch (error) {
    console.error('Error deleting promo:', error);
    return { success: false, message: 'Error eliminando promo.' };
  }
}

/**
 * Fetches all promotions from Firestore, ordered by creation date (descending).
 * This function specifically maps `new_price`.
 * @returns An array of PromoItem objects.
 */
export async function getPromos_2(): Promise<PromoItem[]> {
  try {
    const q = query(collection(db, PROMOS_COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const promos: PromoItem[] = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        service: data.service,
        description: data.description,
        price: data.price,
        new_price: data.new_price || undefined, // Map new_price, undefined if not present
        image: data.image,
        imagePath: data.imagePath,
        createdAt: data.createdAt ? data.createdAt : undefined,
      } as PromoItem;
    });

    return promos;
  } catch (error) {
    console.error('Error fetching promos (getPromos_2):', error);
    return [];
  }
}

/**
 * Fetches all promotions from Firestore (unordered).
 * This function also maps `new_price`.
 * @returns An array of PromoItem objects.
 */
export async function getPromos(): Promise<PromoItem[]> {
  try {
    const querySnapshot = await getDocs(collection(db, PROMOS_COLLECTION_NAME));
    const promos: PromoItem[] = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<PromoItem, 'id'>),
      new_price: doc.data().new_price || undefined, // Ensure new_price is mapped here too
    }));
    return promos;
  } catch (error) {
    console.error('Error fetching promos (getPromos):', error);
    return [];
  }
}