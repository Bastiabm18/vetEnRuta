import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth, adminFirestore } from '@/lib/firebase-admin';
import AdminLayout from '../../components/adminLayout';
import RegionesSection from './RegionesSection';
import ComunasSection from './ComunasSection';
import ServiciosSection from './ServicesSection';
import { getAllRegiones, getAllComunas, getAllServicios } from './actions/config-actions';
import { PrecioVisita } from './precioVisita';

export default async function ConfigPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('firebaseAuthSession')?.value;

  if (!sessionCookie) return redirect('/login?redirect=/config');

  try {
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
   if (decodedToken.role !== 'admin') {
        return redirect('/admin');
      }

    // Obtener datos en paralelo
    const [regiones, comunas, servicios] = await Promise.all([
      getAllRegiones(),
      getAllComunas(),
      getAllServicios()
    ]);

    return (
      <AdminLayout userEmail={decodedToken.email} userName={decodedToken.name} userRole={decodedToken.role}>
        <div className="space-y-8">
          <RegionesSection initialRegiones={regiones} />
          <ComunasSection initialComunas={comunas} regiones={regiones} />
          <PrecioVisita/>
          <ServiciosSection initialServicios={servicios} />
        </div>
      </AdminLayout>
    );
  } catch (error) {
    console.error('Error en página de configuración:', error);
    return redirect('/admin');
  }
}