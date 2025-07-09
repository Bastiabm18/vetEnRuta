// app/promos/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
//import { adminAuth } from '@/lib/firebase-admin';
import { getAdminInstances } from '@/lib/firebase-admin';
import AdminLayout from '../../components/adminLayout'; // Ajusta la ruta si es necesario
import NuevaPromoForm from './NuevaPromoForm'; // Ajusta la ruta si es necesario

export default async function PromosPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('firebaseAuthSession')?.value;

  if (!sessionCookie) return redirect('/login?redirect=/promos');

  try {
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    if (decodedToken.role !== 'admin') return redirect('/');

    return (
      <AdminLayout userEmail={decodedToken.email} userName={decodedToken.name} userRole={decodedToken.role}>
        <h2>Crear Nueva Promoción</h2>
        <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
          <NuevaPromoForm />
        </div>
      </AdminLayout>
    );
  } catch (error) {
      const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
    console.error('Error en página de promos:', error);
      const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    if (decodedToken.role == 'vet') return redirect('/admin');
    return redirect('/');
  }
}