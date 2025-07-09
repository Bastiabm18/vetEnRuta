// app/admin/page.tsx (o donde tengas tu AdminPage)
import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth } from '@/lib/firebase-admin'; // Asegúrate de que esta ruta sea correcta
import AdminLayout from '../components/adminLayout'; // Asegúrate de que esta ruta sea correcta
import Link from 'next/link';
import { GrUserAdmin } from "react-icons/gr";

// Import icons
import { FaHome, FaEdit, FaUsers, FaComment, FaChartBar, FaQuestion, FaSignOutAlt } from 'react-icons/fa';
import { RiCalendarScheduleLine, RiHealthBookLine } from 'react-icons/ri';

import type { ReactElement } from 'react';
import { AiFillSetting } from 'react-icons/ai';

interface MenuItem {
  name: string;
  path: string;
  icon: ReactElement;
}

async function AdminPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('firebaseAuthSession')?.value;

  if (!sessionCookie) {
    console.log('[AdminPage] No session cookie found');
    return redirect('/');
  }

  let decodedToken;
  try {
    decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
  } catch (error) {
    console.error('[AdminPage] Session verification failed:', error);
    return redirect('/');
  }

  if (decodedToken.role === 'admin' || decodedToken.role === 'vet') {
    console.log("authorized");
  } else {
    console.warn(`[AdminPage] Unauthorized access by ${decodedToken.email}`);
    return redirect('/');
  }

  // Define menuItems aquí si es que los necesitas para la visualización dentro de la página
  // si el Sidebar ya maneja esto, podrías no necesitar esta lógica duplicada aquí.
  let menuItems: MenuItem[] = [];
  if(decodedToken.role==='admin'){
    menuItems = [
      { name: 'Inicio', path: '/admin', icon: <FaHome /> },
      { name: 'Consultas', path: '/admin/consultas', icon: <RiHealthBookLine />},
      { name: 'Horarios', path: '/admin/horarios', icon: <RiCalendarScheduleLine /> },
      { name: 'Usuarios', path: '/admin/usuarios', icon: <FaUsers /> },
      { name: 'Opiniones', path: '/admin/opiniones', icon: <FaComment /> },
      { name: 'Promociones', path: '/admin/promos', icon: <FaChartBar /> },
      { name: 'Preguntas Frecuentes', path: '/admin/preguntaFrecuente', icon: <FaQuestion /> },
      { name: 'Configuración Agenda', path: '/admin/config', icon: <AiFillSetting/> },
      { name: 'Admin Horarios', path: '/admin/adminHorarios', icon: <RiCalendarScheduleLine/> },
      { name: 'Admin Consultas', path: '/admin/adminConsultas', icon: <GrUserAdmin/> },
      { name: 'Salir', path: '/', icon: <FaSignOutAlt /> },
    ];
  } else if(decodedToken.role==='vet'){
    menuItems = [
      { name: 'Inicio', path: '/admin', icon: <FaHome /> },
      { name: 'Consultas', path: '/admin/consultas', icon: <RiHealthBookLine /> },
      { name: 'Horarios', path: '/admin/horarios', icon: <RiCalendarScheduleLine /> },
      { name: 'Salir', path: '/', icon: <FaSignOutAlt /> },
    ];
  }

  return (
    // <AdminLayout userEmail={decodedToken.email} userName={decodedToken.name} userRole={decodedToken.role}> // Si decodedToken.name existe
    <AdminLayout userEmail={decodedToken.email} userName={decodedToken.name} userRole={decodedToken.role}> {/* <--- Pasa el rol aquí */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold font-josefin text-gray-900 mb-6">Panel de Administración</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {menuItems.map((item) => (
            <Link key={item.name} href={item.path} className="group">
              <div className="flex flex-col items-center justify-center p-6 rounded-lg bg-blue-vet bg-opacity-70 text-black cursor-pointer transform transition duration-200 hover:scale-105 hover:bg-opacity-90">
                <div className="text-3xl mb-3">{item.icon}</div>
                <span className="text-md font-semibold text-center">{item.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminPage;