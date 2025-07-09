import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAdminInstances } from '@/lib/firebase-admin';
//import { adminAuth, adminFirestore } from '@/lib/firebase-admin';
import AccountMenu from './AcountMenu';
import { FaUserCircle } from 'react-icons/fa';

export default async function AccountPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('firebaseAuthSession')?.value;

  // Redirección si no está autenticado
  if (!sessionCookie) return redirect('/login');

  try {
     const { auth: adminAuth, firestore: adminFirestore } = getAdminInstances();
       
    // Verificar sesión
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;

    // Obtener datos del usuario
    const userDoc = await adminFirestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return redirect('/login');
    }

    const userData = userDoc.data();
    
    return (
      <div className="flex text-black min-h-screen bg-gray-50">
        {/* Menú Lateral */}
        <AccountMenu />
        
        {/* Contenido Principal */}
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-col items-center mb-6">
                {userData?.photoURL ? (
                  <img 
                    src={userData.photoURL} 
                    alt={`Foto de ${userData.displayName}`}
                    className="w-24 h-24 rounded-full object-cover mb-4"
                  />
                ) : (
                  <FaUserCircle className="text-gray-400 text-6xl mb-4" />
                )}
                <h1 className="text-2xl font-bold text-gray-800">{userData?.displayName || 'Usuario'}</h1>
                <p className="text-gray-600">{userData?.email}</p>
                <span className="mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {userData?.role || 'user'}
                </span>
              </div>

              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold mb-4">Información de la cuenta</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-700">Nombre</h3>
                    <p className="text-gray-900">{userData?.displayName || 'No especificado'}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700">Correo electrónico</h3>
                    <p className="text-gray-900">{userData?.email}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700">Rol</h3>
                    <p className="text-gray-900">{userData?.role || 'user'}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700">Fecha de registro</h3>
                    <p className="text-gray-900">
                      {userData?.createdAt?.toDate?.()?.toLocaleDateString() || 'No disponible'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error en página de cuenta:', error);
    return redirect('/login?error=auth_error');
  }
}