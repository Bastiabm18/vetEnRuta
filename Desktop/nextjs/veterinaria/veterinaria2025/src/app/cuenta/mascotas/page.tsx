import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth, adminFirestore } from '@/lib/firebase-admin';
import AccountMenu from '../AcountMenu';
import MascotasClientContent from './MascotasClientContent';

// Definición de tipos
export type Pet = {
  id: string;
  userId: string;
  name: string;
  type: 'perro' | 'gato' | 'otro';
  extraType?: string;
  breed: string;
  age: number;
  weight: number;
  medicalHistory?: string;
  createdAt: Date | string;
};

export default async function MascotasPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('firebaseAuthSession')?.value;

  if (!sessionCookie) {
    return redirect('/login?error=not_authenticated');
  }

  let userId: string;
  try {
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    userId = decodedToken.uid;
    console.log('Server  Session verified for user:', userId); // Verificamos la UID en el servidor
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    return redirect('/login?error=invalid_session');
  }

  try {
    const userDoc = await adminFirestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return redirect('/login?error=user_not_found');
    }

    const petsSnapshot = await adminFirestore.collection('pets')
      .where('ownerId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const pets = petsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        name: data.name,
        type: data.type,
        extraType: data.extraType,
        breed: data.breed,
        age: data.age,
        weight: data.weight,
        medicalHistory: data.medicalHistory,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      } as Pet;
    });

    console.log('Server Pets fetched:', pets); // Verificamos las mascotas en el servidor

    return (
      <div className="flex text-black min-h-screen bg-gray-50">
        <AccountMenu />
        <MascotasClientContent initialPets={pets} userId={userId} />
      </div>
    );
  } catch (error) {
    console.error('Error loading pets data:', error);
    return redirect('/cuenta/mascotas?error=load_error');
  }
}