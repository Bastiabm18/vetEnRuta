// src/app/promos/page.tsx
// Este es el componente de servidor (Wrapper) que usa Suspense.

import { Suspense } from 'react';
import { FaSpinner } from 'react-icons/fa'; // Importa el spinner para el fallback

// Importa tu nuevo componente cliente que contiene la lógica real de la página
import PromosClientContent from './PromosClientContent'; 

export default function PromosPageWrapper() {
  return (
    // Envuelve el componente cliente en Suspense para manejar useSearchParams en el cliente.
    <Suspense 
      fallback={
        <div className="flex items-center justify-center h-screen bg-gray-100">
          <FaSpinner className="animate-spin text-6xl text-green-vet" />
        </div>
      }
    >
      <PromosClientContent />
    </Suspense>
  );
}