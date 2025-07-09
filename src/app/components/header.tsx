"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { PiDogDuotone } from "react-icons/pi";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { FiMenu, FiUser } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { RiMenuFold2Line } from "react-icons/ri";
import { FaSpinner } from "react-icons/fa";
import { TbMenu4 } from "react-icons/tb";
import { HiOutlineMenu } from "react-icons/hi";
interface NavLinkItem {
  id: string;
  label: string;
}

interface AuthUser extends User {
  role?: string | null;
}

const navLinks: NavLinkItem[] = [
  { id: "inicio", label: "Inicio" },
  { id: "servicios", label: "Servicios" },
  { id: "promos", label: "Promociones" },
  { id: "agenda", label: "Agenda" },
  { id: "resenas", label: "Reseñas" },
  { id: "contacto", label: "Contacto" },
  { id: "pregunta_frecuente", label: "Preguntas frecuentes" },
];

const menuVariants = {
  open: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 25 } },
  closed: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

const userMenuVariants = {
  open: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 25 } },
  closed: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

export default function Nav() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("inicio");

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        const idTokenResult = await user.getIdTokenResult();
        const roleFromToken = idTokenResult.claims.role as string | undefined;

        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();
        
        const userRole = roleFromToken || userData?.role || 'cliente';

        console.log("[Nav] User role:", userRole);
        setCurrentUser({ ...user, role: userRole });

        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email || null,
            displayName: user.displayName || null,
            photoURL: user.photoURL || null,
            role: 'cliente',
            createdAt: new Date(),
          });
        }

        const token = await user.getIdToken();
        try {
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
          });
        } catch (error) {
          console.error("Error setting session cookie via API:", error);
        }
      } else {
        setCurrentUser(null);
        try {
          await fetch('/api/auth/session', { method: 'DELETE' });
        } catch (error) {
          console.error("Error deleting session cookie via API:", error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    
    if (element) {
       const offset = 60; // Ajusta este valor según la altura de tu navbar
       const bodyRect = document.body.getBoundingClientRect().top;
       const elementRect = element.getBoundingClientRect().top;
       const elementPosition = elementRect - bodyRect;
       const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
        //block: "start",
      });
      setActiveSection(id);
      setIsMobileMenuOpen(false);
    }
  };

  const handleSignInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error during sign in with Google:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setIsUserMenuOpen(false);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
    setIsMobileMenuOpen(false);
  };

  const getUserDashboardRoute = () => {
    if (!currentUser) return "/";
    return currentUser.role === "admin" || currentUser.role === "vet" ? "/admin" : "/cuenta";
  };

  if (loading) {
    return (
      <nav className="sticky top-0 z-50 w-full bg-green-vet font-josefin bg-opacity-80 backdrop-blur-md shadow-md p-4">
        <div className="container mx-auto flex justify-center items-center">
          <FaSpinner className="animate-spin text-3xl text-white" />
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 w-full font-josefin bg-opacity-80 backdrop-blur-md shadow-md">
      {/* Contenedor principal - responsive */}
      <div className="lg:grid lg:grid-cols-12 relative">
        {/* Logo - centrado en móvil, parte izquierda en desktop */}
        <div className="lg:bg-blue-vet bg-transparent flex justify-center items-center lg:p-0">
          <div 
            onClick={() => scrollToSection("inicio")} 
            className="cursor-pointer bg-blue-vet lg:bg-transparent  p-4 absolute lg:static left-1/2 lg:left-auto transform -translate-x-1/2 lg:transform-none -translate-y-1/2 lg:translate-y-0 top-1/2 z-10"
          >
            <img src='/icon1.png' className="w-[30px]" alt="Logo" />
          </div>
        </div>

        {/* Contenido verde - ocupa todo en móvil, 3/4 en desktop */}
        <div className="bg-green-vet lg:col-span-11 p-4 flex justify-between items-center lg:justify-end">
          {/* Menú hamburguesa - solo móvil */}
          <div className="lg:hidden" onClick={toggleMobileMenu}>
            <HiOutlineMenu  className="text-white text-3xl cursor-pointer" />
          </div>

          {/* Menú desktop */}
          <ul className="hidden lg:flex flex-1 justify-around items-center list-none m-0 p-0">
            {navLinks.map((link) => (
              <li key={link.id}>
                <button
                  onClick={() => scrollToSection(link.id)}
                  className={`text-white no-underline hover:text-gray-300 transition-colors duration-200 px-2 py-1 bg-transparent border-none cursor-pointer ${
                    activeSection === link.id ? "font-bold underline" : ""
                  }`}
                >
                  {link.label}
                </button>
              </li>
            ))}
            
         
          </ul>

          {/* Icono usuario - visible en móvil y desktop */}
          <div className="relative" onClick={toggleUserMenu}>
            {currentUser?.photoURL ? (
              <Image
                src={currentUser.photoURL}
                alt="User avatar"
                width={30}
                height={30}
                className="rounded-full cursor-pointer"
              />
            ) : (
              <FiUser className="text-white text-3xl lg:text-xl cursor-pointer" />
            )}
            <AnimatePresence>
              {isUserMenuOpen && (
                <motion.div
                  className="absolute top-full w-[150px] text-center right-0 mt-2 bg-white rounded-md shadow-lg overflow-hidden z-10"
                  initial="closed"
                  animate="open"
                  exit="closed"
                  variants={userMenuVariants}
                >
                  {currentUser ? (
                    <>
                      <Link 
                        href={getUserDashboardRoute()} 
                        className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                      >
                        {currentUser.role === "admin" || currentUser.role === "vet" ? "Admin Panel" : "Mi Cuenta"}
                      </Link>
                      <button 
                        onClick={handleSignOut} 
                        className="block w-full text-center px-4 py-2 text-gray-800 hover:bg-gray-100"
                      >
                        Cerrar Sesión
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={()=>router.push("/login")} 
                      className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                    >
                      Login
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Menú móvil desplegable */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed top-16 left-0 w-full bg-green-vet bg-opacity-80 shadow-md z-20 rounded-b-md overflow-hidden"
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
          >
            <ul className="p-4  ">
              {navLinks.map((link) => (
                <li key={link.id} className="border-b border-green-vet last:border-b-0">
                  <button
                    onClick={() => scrollToSection(link.id)}
                    className={`block w-full text-left py-2 text-gray-800 hover:bg-green-vet ${
                      activeSection === link.id ? "font-bold underline" : ""
                    }`}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
              {currentUser && (
                <li className="border-b border-gray-200 last:border-b-0">
                  <Link
                    href={getUserDashboardRoute()}
                    className="block w-full text-left py-2 text-gray-900 hover:bg-gray-100"
                  >
                    {currentUser.role === "admin" || currentUser.role === "vet" ? "Admin Panel" : "Mi Cuenta"}
                  </Link>
                </li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}