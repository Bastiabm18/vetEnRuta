import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { getAdminInstances } from '@/lib/firebase-admin';
//import { adminAuth, adminFirestore } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin'; // Importar el objeto admin

async function getUserIdFromCookies(request) {
  const sessionCookie = request.cookies.get('firebaseAuthSession')?.value;

  if (!sessionCookie) {
    console.log('[getUserIdFromCookies] No session cookie found');
    return null;
  }

  try {
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
        
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decodedToken.uid; // La ID del usuario de Firebase es 'uid'
  } catch (error) {
    console.error('[getUserIdFromCookies] Session verification failed:', error);
    return null;
  }
}

// GET para OBTENER todas las mascotas del usuario
export async function GET(request) {
  try {
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
    
    const userId = await getUserIdFromCookies(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const petsSnapshot = await adminFirestore.collection('pets')
      .where('ownerId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const pets = petsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ownerId: data.ownerId,
        name: data.name,
        type: data.type,
        extraType: data.extraType,
        breed: data.breed,
        age: data.age,
        weight: data.weight,
        medicalHistory: data.medicalHistory,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      };
    });

    return NextResponse.json(pets);

  } catch (error) {
    console.error('Error obteniendo mascotas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST para CREAR una nueva mascota
export async function POST(request) {
  try {
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
        
    const userId = await getUserIdFromCookies(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const petData = {
      name: formData.get('name'),
      type: formData.get('type'),
      breed: formData.get('breed'),
      age: parseFloat(formData.get('age') || 0),
      weight: parseFloat(formData.get('weight') || 0),
      medicalHistory: formData.get('medicalHistory'),
      ownerId: userId, // Usamos la ID del usuario de Firebase
      ...(formData.get('type') === 'otro' && { extraType: formData.get('extraType') }),
      // CAMBIO AQUÍ: Usar admin.firestore.FieldValue
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const newPetRef = await adminFirestore.collection('pets').add(petData);
    return NextResponse.json({
      success: true,
      petId: newPetRef.id
    });

  } catch (error) {
    console.error('Error creando mascota:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT para ACTUALIZAR una mascota existente (petId como searchParam)
export async function PUT(request) {
  try {
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
        
    const userId = await getUserIdFromCookies(request);
    const { searchParams } = new URL(request.url);
    const petId = searchParams.get('petId');
    const formData = await request.formData();

    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    if (!petId) {
      return NextResponse.json(
        { error: 'Se requiere el ID de la mascota para actualizar' },
        { status: 400 }
      );
    }

    // Verificar que la mascota existe y pertenece al usuario
    const petDoc = await adminFirestore.collection('pets').doc(petId).get();
    if (!petDoc.exists || petDoc.data()?.ownerId !== userId) {
      return NextResponse.json(
        { error: 'No tienes permisos para actualizar esta mascota' },
        { status: 403 }
      );
    }

    const petData = {
      name: formData.get('name'),
      type: formData.get('type'),
      breed: formData.get('breed'),
      age: parseFloat(formData.get('age') || 0),
      weight: parseFloat(formData.get('weight') || 0),
      medicalHistory: formData.get('medicalHistory'),
      // CAMBIO AQUÍ: Usar admin.firestore.FieldValue
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await adminFirestore.collection('pets').doc(petId).update(petData);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error actualizando mascota:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE para ELIMINAR una mascota (petId como searchParam)
export async function DELETE(request) {
  try {
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
        
    const userId = await getUserIdFromCookies(request);
    const { searchParams } = new URL(request.url);
    const petId = searchParams.get('petId');

    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    if (!petId) {
      return NextResponse.json(
        { error: 'Se requiere el ID de la mascota' },
        { status: 400 }
      );
    }

    // Verificar que la mascota existe y pertenece al usuario
    const petDoc = await adminFirestore.collection('pets').doc(petId).get();
    if (!petDoc.exists || petDoc.data()?.ownerId !== userId) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar esta mascota' },
        { status: 403 }
      );
    }

    await adminFirestore.collection('pets').doc(petId).delete();
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error eliminando mascota:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}