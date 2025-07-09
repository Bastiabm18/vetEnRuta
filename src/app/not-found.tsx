'use client'; // Necesario para usar el hook useRouter

import { useRouter } from 'next/navigation';
import { IoArrowBack } from 'react-icons/io5'; // Importamos el ícono de flecha

export default function NotFound() {
  const router = useRouter();

  return (
    <main
      className="flex h-[100vh] w-[100vw] flex-col items-center justify-center bg-gray-50 text-center"
    >
      <div className="p-8">
        {/* Se agrega la imagen solicitada */}
        <img src="/icon1.png" alt="Icono de la aplicación" className="mx-auto mb-8 h-24 w-24" />
        
        <h1 className="text-9xl font-black text-gray-200">404</h1>

        <p className="mt-4 text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          ¡Ups!
        </p>

        <p className="mt-4 text-lg text-gray-500">
          La página que estás intentando visitar no existe.
        </p>

        <button
          onClick={() => router.back()} // La función router.back() navega a la página anterior
          className="mt-8 inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-3 text-base font-medium text-white shadow-lg transition-transform duration-200 hover:scale-105 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <IoArrowBack className="h-5 w-5" />
          Volver atrás
        </button>
      </div>
    </main>
  );
}
