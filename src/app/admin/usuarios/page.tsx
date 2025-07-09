// app/admin/usuarios/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { getAdminInstances } from '@/lib/firebase-admin';
//import { adminAuth, adminFirestore } from '@/lib/firebase-admin';
import AdminLayout from '../../components/adminLayout';
import UserTable from './UserTable';

async function getUsers() {
  
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
  const usersSnapshot = await adminFirestore.collection('users').get();
  return usersSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      uid: doc.id,
      displayName: data.displayName || '',
      email: data.email || '',
      photoURL: data.photoURL || '',
      role: data.role || 'cliente',
      // Convert Timestamp to ISO string or null
      createdAt: data.createdAt?.toDate().toISOString() || null
    };
  });
}

export default async function UsuariosPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('firebaseAuthSession')?.value;

  if (!sessionCookie) return redirect('/login?redirect=/admin/usuarios');

  try {

    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    if (decodedToken.role !== 'admin') return redirect('/unauthorized');
    
    const users = await getUsers();

    return (
      <AdminLayout userEmail={decodedToken.email} userName={decodedToken.name}  userRole={decodedToken.role}>
        <UserTable users={users} />
      </AdminLayout>
    );
  } catch (error) {
    
        const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
    console.error('Error en página de usuarios:', error);
      const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    if (decodedToken.role == 'vet') return redirect('/admin');
    return redirect('/');
  }
}

interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  role: string;
  createdAt?: string | null; // Optional
} 