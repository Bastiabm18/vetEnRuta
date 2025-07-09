// components/adminLayout.tsx (o donde tengas tu AdminLayout)
"use client";

import { ReactNode, useState } from 'react';
import Sidebar from './Sidebar'; // Asegúrate de que esta ruta sea correcta
import {signOut} from "firebase/auth";
//import { auth } from '@/lib/firebase'; // Asegúrate de que esta ruta sea correcta
import { useRouter } from 'next/navigation';
import { FaDog } from 'react-icons/fa6';
import { getFirebaseClientInstances } from '@/lib/firebase';

interface AdminLayoutProps {
  children: ReactNode;
  userEmail?: string;
  userName?: string;
  userRole?: string; // <--- Agrega esta prop
}

export default function AdminLayout({ children, userEmail, userName, userRole }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleSignOut = async () => {
    try {

const { auth, db, storage } = getFirebaseClientInstances();
      await signOut(auth);
      console.log("User signed out from Firebase.");

      try {
        // Delete the session cookie via API route
        const response = await fetch('/api/auth/session', { method: 'DELETE' });
        if (response.ok) {
          console.log("Session cookie deleted successfully.");
        } else {
          console.error("Failed to delete session cookie via API:", response.statusText);
        }
      } catch (error) {
        console.error("Error deleting session cookie via API:", error);
      }
      
      router.push("/login");
      
    } catch (error) {
      console.error("Error during sign out:", error);
      alert('Error al cerrar sesión. Por favor, inténtalo de nuevo.');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={toggleSidebar}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
        userRole={userRole} // <--- Pasa el userRole al Sidebar
      />
      
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
      }`}>
        {/* Top Header */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 lg:hidden"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                ></path>
              </svg>
            </button>
            
            {/* User Info and Logout */}
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block p-2">
                
                {userName && (
                  <p className="text-sm font-josefin uppercase text-blue-vet">{userName}</p>
                )}
                {userEmail && (
                  <p className="text-xs text-gray-800">{userEmail}</p>
                )}
                {userRole && (
                  <p className="font-playwrite text-xs text-blue-vet"> {userRole}</p>
                )}
              </div>
              
                <button
                  onClick={handleSignOut}
                  className="flex items-center text-sm text-red-600 hover:text-red-800 px-3 py-2 rounded-md hover:bg-red-50 transition-colors"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    ></path>
                  </svg>
                  Cerrar sesión
                </button>
              
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}