// app/horarios/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth } from '@/lib/firebase-admin';
import AdminLayout from '../../components/adminLayout'; // Asegúrate de que la ruta sea correcta
import ConsultasManager from './ConsultasManager';
//import MassScheduleManager from './MassScheduleManager';

export default async function HorariosPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('firebaseAuthSession')?.value;

  if (!sessionCookie) {
    return redirect('/login?redirect=/consultas');
  }

  try {
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
    if (decodedToken.role !== 'admin') {
  return redirect('/login?redirect=/consultas');
}

    return (
      <AdminLayout userEmail={decodedToken.email} userName={decodedToken.name} userRole={decodedToken.role}>
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Maestro Gestión de Consultas</h1>
       <ConsultasManager />
      </AdminLayout>
    );
  } catch (error) {
    console.error('Error en página de consultas:', error);
    return redirect('/login?redirect=/consultas');
  }
}