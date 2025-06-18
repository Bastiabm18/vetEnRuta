// components/Sidebar.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FaHome,
  FaChartBar,
  FaUsers,
  FaChevronLeft,
  FaChevronRight,
  FaSignOutAlt,
  FaEdit // Asegúrate de importar FaEdit si lo usas
} from 'react-icons/fa';
import { AiFillSetting } from "react-icons/ai";
import { FaComment, FaQuestion } from 'react-icons/fa6';
import { RiCalendarScheduleLine, RiHealthBookLine } from 'react-icons/ri';
import { GrUserAdmin } from 'react-icons/gr';
import type { ReactElement } from 'react';

interface MenuItem {
  name: string;
  path: string;
  icon: ReactElement;
  role?: string[]; // <--- ¡Modificado! Ahora acepta un array de roles opcional
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  userRole?: string;
}

// Define todos los posibles elementos del menú aquí, ahora con la propiedad 'role'
const allMenuItems: MenuItem[] = [
  { name: 'Inicio', path: '/admin', icon: <FaHome />, role: ['admin', 'vet'] },
  { name: 'Consultas', path: '/admin/consultas', icon: <RiHealthBookLine />, role: ['admin', 'vet'] },
  { name: 'Horarios', path: '/admin/horarios', icon: <RiCalendarScheduleLine />, role: ['admin', 'vet'] },
  { name: 'Usuarios', path: '/admin/usuarios', icon: <FaUsers />, role: ['admin'] }, // Solo admin
  { name: 'Opiniones', path: '/admin/opiniones', icon: <FaComment />, role: ['admin'] }, // Solo admin
  { name: 'Promociones', path: '/admin/promos', icon: <FaChartBar />, role: ['admin'] }, // Solo admin
  { name: 'Preguntas Frecuentes', path: '/admin/preguntaFrecuente', icon: <FaQuestion />, role: ['admin'] }, // Solo admin
  { name: 'Configuración Agenda', path: '/admin/config', icon: <AiFillSetting/>, role: ['admin'] }, // Solo admin
  { name: 'Admin Horarios', path: '/admin/adminHorarios', icon: <RiCalendarScheduleLine/>, role: ['admin'] }, // Solo admin
  { name: 'Admin Consultas', path: '/admin/adminConsultas', icon: <GrUserAdmin/>, role: ['admin'] }, // Solo admin
  { name: 'Salir', path: '/', icon: <FaSignOutAlt />, role: ['admin', 'vet'] }, // Asumiendo que ambos roles pueden cerrar sesión desde el sidebar
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, setMobileOpen, userRole }: SidebarProps) {
  const pathname = usePathname();

  // Filtrar los items del menú basados en el rol del usuario utilizando la nueva propiedad 'role'
  const menuItems = allMenuItems.filter(item => {
    // Si el item no tiene una propiedad 'role' definida, asumimos que es visible para todos los roles autorizados (seguro por defecto)
    // O puedes decidir que si no tiene 'role', no se muestra a nadie. Aquí, lo mostramos si el rol es 'admin' o 'vet'.
    if (!item.role) {
      return userRole === 'admin' || userRole === 'vet'; // O ajusta esto según tu política predeterminada
    }

    // Si el item tiene la propiedad 'role', verifica si el userRole actual está incluido en los roles permitidos para ese item.
    return item.role.includes(userRole as string); // Hacemos un 'as string' porque sabemos que userRole es string si está aquí
  });

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white shadow-xl z-40 transition-all duration-300 ease-in-out
          ${collapsed ? 'w-20' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className={`p-4 border-b flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
            {!collapsed && (
              <h1 className="text-xl font-bold text-gray-800">Panel Admin</h1>
            )}
            <button
              onClick={onToggle}
              className="p-1 rounded-md text-gray-500 hover:bg-gray-100 hidden lg:block"
              aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
            >
              {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
            </button>
          </div>

          {/* Sidebar Navigation */}
          <nav className="flex-1 overflow-y-auto py-2">
            <ul className="space-y-1 px-2">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={`flex text-blue-400 items-center p-3 rounded-lg transition-colors
                      ${pathname === item.path ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}
                      ${collapsed ? 'justify-center' : ''}
                    `}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="text-lg">
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <span className="ml-3">{item.name}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Sidebar Footer (Collapse Button for mobile) */}
          <div className="p-4 border-t lg:hidden">
            <button
              onClick={() => setMobileOpen(false)}
              className="w-full flex items-center justify-center p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <FaChevronLeft className="mr-2" />
              Ocultar menú
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
        />
      )}
    </>
  );
}