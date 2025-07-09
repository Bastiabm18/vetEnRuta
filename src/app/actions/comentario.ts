'use server';

import { adminFirestore } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

interface CommentData {
  calificacion: number;
  comentario: string;
  fecha: Timestamp | Date; // Can be Timestamp from Firestore or Date object from client
  userId: string;
  userName: string;
  userPhotoURL?: string;
  pets?: string; // Nuevo campo para 'pets'
}

// Tipo para los comentarios con ID
export interface CommentWithId extends CommentData {
  id: string;
}

/**
 * Elimina un comentario por su ID
 */
export async function deleteComment(commentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await adminFirestore.collection('comentarios').doc(commentId).delete();
    return { success: true };
  } catch (error) {
    console.error('Error deleting comment:', error);
    return { success: false, error: 'Could not delete comment' };
  }
}

/**
 * Actualiza un comentario existente
 * Ahora acepta 'fecha' y 'pets' como campos opcionales en data
 */
export async function editComment(
  commentId: string,
  data: { calificacion?: number; comentario?: string; fecha?: Date; pets?: string } // 'pets' añadido como opcional
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: { [key: string]: any } = { ...data };

    // Si 'fecha' es proporcionado, convertirlo a un Firestore Timestamp
    if (data.fecha) {
      updateData.fecha = Timestamp.fromDate(data.fecha);
    }
    // 'pets' se pasa directamente si existe en data, no necesita transformación
    // if (data.pets !== undefined) {
    //   updateData.pets = data.pets; // Ya está incluido con {...data}
    // }


    await adminFirestore.collection('comentarios').doc(commentId).update(updateData);
    return { success: true };
  } catch (error) {
    console.error('Error updating comment:', error);
    return { success: false, error: 'Could not update comment' };
  }
}

/**
 * Obtiene todos los comentarios ordenados por fecha (descendente)
 */
export async function getAllComments(): Promise<CommentWithId[]> {
  try {
    const snapshot = await adminFirestore
      .collection('comentarios')
      .orderBy('fecha', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as CommentData
    }));
  } catch (error) {
    console.error('Error getting comments:', error);
    return [];
  }
}

/**
 * Crea un nuevo comentario
 */
export async function createComment(commentData: Omit<CommentData, 'fecha'>): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const docRef = await adminFirestore.collection('comentarios').add({
      ...commentData,
      fecha: Timestamp.now()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating comment:', error);
    return { success: false, error: 'Could not create comment' };
  }
}