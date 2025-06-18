// src/app/agenda/confirmacion/page.tsx
// Este es el componente de servidor (Wrapper) que usa Suspense.

import { Suspense } from 'react';
import { PiSpinnerBold } from 'react-icons/pi'; // Para el spinner de carga

// Importa tu nuevo componente cliente que contiene la lógica real de la página
import ConfirmationClientContent from './ConfirmationContent'; 

export default function ConfirmationPageWrapper() {
  return (
    // Envuelve el componente cliente en Suspense para manejar useSearchParams en el cliente.
    <Suspense 
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <PiSpinnerBold className='text-green-vet text-6xl animate-spin'/>
        </div>
      }
    >
      <ConfirmationClientContent />
    </Suspense>
  );
}