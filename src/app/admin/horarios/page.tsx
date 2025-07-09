// app/horarios/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
//import { adminAuth } from '@/lib/firebase-admin';
import { getAdminInstances } from '@/lib/firebase-admin'; // Asegúrate de que esta función esté definida correctamente
import AdminLayout from '../../components/adminLayout'; // Asegúrate de que la ruta sea correcta
import MassScheduleManager from './MassScheduleManager';

export default async function HorariosPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('firebaseAuthSession')?.value;

  if (!sessionCookie) {
    return redirect('/login?redirect=/horarios');
  }

  try {
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
      if (decodedToken.role !== 'admin' && decodedToken.role !== 'vet') {
        return redirect('/login?redirect=/horarios');
      }

    return (
      <AdminLayout  userEmail={decodedToken.email} userName={decodedToken.name} userRole={decodedToken.role}>
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Gestión de Horarios</h1>
        <MassScheduleManager />
      </AdminLayout>
    );
  } catch (error) {
    console.error('Error en página de horarios:', error);
    return redirect('/login?redirect=/horarios');
  }
}