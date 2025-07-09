// src/app/api/citas/route.ts
import { NextResponse } from 'next/server';
import { getAdminInstances } from '@/lib/firebase-admin';
//import { adminFirestore } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
        
    const data = await request.json();
    
    // Validar los datos recibidos
    if (!data.userId || !data.date || !data.services) {
      return NextResponse.json(
        { error: 'Datos de cita incompletos' },
        { status: 400 }
      );
    }

    // Guardar en Firestore
    const docRef = await adminFirestore.collection('appointments').add({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      id: docRef.id,
      message: 'Cita creada exitosamente'
    }, { status: 201 });

  } catch (error) {
    console.error('Error al crear cita:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}