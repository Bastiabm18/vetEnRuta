// app/adminHorarios/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
//import { adminAuth, adminFirestore } from '@/lib/firebase-admin'; // Asumiendo que firebase-admin está en lib
import { getAdminInstances } from '@/lib/firebase-admin'; // Asegúrate de que esta función esté definida correctamente
import AdminLayout from '../../components/adminLayout'; // Asegúrate de que la ruta sea correcta
import SuperAdminMassScheduleManager from './SuperAdminMassScheduleManager'; // Nuevo componente

export default async function AdminHorariosPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('firebaseAuthSession')?.value;

  if (!sessionCookie) {
    return redirect('/login?redirect=/adminHorarios');
  }

  try {
    const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    // Solo permitir acceso si el rol es 'admin'
    if (decodedToken.role !== 'admin') {
      // Si no es admin, redirigir a donde corresponda, por ejemplo, al dashboard de veterinario o al login
      if (decodedToken.role === 'vet') {
        return redirect('/admin');
      }
      return redirect('/login?redirect=/adminHorarios'); // o a la página de inicio normal
    }

    // Opcional: Podrías obtener el email del admin para pasarlo al layout
    const adminEmail = decodedToken.email;

    return (
      <AdminLayout userEmail={adminEmail} userName={decodedToken.name}  userRole={decodedToken.role}>
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Maestro Gestión de Horarios </h1>
        <SuperAdminMassScheduleManager />
      </AdminLayout>
    );
  } catch (error) {
    console.error('Error en página de gestión de horarios (Superadmin):', error);
    // En caso de error de sesión o token inválido, redirigir al login
    return redirect('/login?redirect=/adminHorarios');
  }
}