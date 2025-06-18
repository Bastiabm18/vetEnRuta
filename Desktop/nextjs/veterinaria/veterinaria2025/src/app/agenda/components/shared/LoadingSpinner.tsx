// src/app/agenda/componentes/shared/LoadingSpinner.tsx
import { FaSpinner } from 'react-icons/fa';

export const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center p-4">
      <FaSpinner className="animate-spin text-green-vet text-2xl" />
    </div>
  );
};