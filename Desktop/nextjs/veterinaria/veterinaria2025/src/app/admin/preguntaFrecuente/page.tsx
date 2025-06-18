// app/admin/preguntaFrecuente/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth } from '@/lib/firebase-admin';
import AdminLayout from '@/app/components/adminLayout';
import NuevaPreguntaForm from './NuevaPreguntaForm';
import ListadoPreguntas from './ListadoPreguntas';

export default async function PreguntasFrecuentesPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('firebaseAuthSession')?.value;

  if (!sessionCookie) return redirect('/login?redirect=/admin/preguntaFrecuente');

  try {
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    if (decodedToken.role !== 'admin') return redirect('/unauthorized');

    return (
      <AdminLayout userEmail={decodedToken.email} userName={decodedToken.name} userRole={decodedToken.role}>
        <h2 className="text-2xl text-black font-bold mb-6">Administrar Preguntas Frecuentes</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl text-black font-semibold mb-4">Listado de Preguntas</h3>
            <ListadoPreguntas />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl text-black font-semibold mb-4">Nueva Pregunta</h3>
            <NuevaPreguntaForm />
          </div>
        </div>
      </AdminLayout>
    );
  } catch (error) {
    console.error('Error en página de preguntas frecuentes:', error);
    
    return redirect('/admin');
  }
}