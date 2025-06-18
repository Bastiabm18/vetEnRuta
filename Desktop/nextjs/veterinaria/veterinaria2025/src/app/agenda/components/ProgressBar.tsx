// src/app/agenda/componentes/ProgressBar.tsx
import { useAppointmentStore } from '@/lib/stores/appointmentStore';

const steps = [
  { id: 1, name: 'Ubicación y Veterinario' },
  { id: 2, name: 'Mascotas y Servicios' },
  { id: 3, name: 'Datos del Dueño' },
  { id: 4, name: 'Confirmación' }
];

export const ProgressBar = () => {
  const { currentStep } = useAppointmentStore();

  return (
    <div className="w-full">
      <div className="hidden md:flex justify-between">
        {steps.map((step) => (
          <div key={step.id} className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= step.id ? 'bg-green-vet text-white' : 'bg-gray-200 text-black'
              }`}
            >
              {step.id}
            </div>
            <span
              className={`mt-2 text-sm ${
                currentStep >= step.id ? 'text-green-vet font-medium' : 'text-gray-500'
              }`}
            >
              {step.name}
            </span>
          </div>
        ))}
      </div>
      
      {/* Versión mobile */}
      <div className="md:hidden flex items-center">
        <div className="flex-1 bg-gray-200 h-1 rounded-full">
          <div
            className="bg-green-vet h-1 rounded-full"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          ></div>
        </div>
        <span className="ml-2 text-sm text-black">
          Paso {currentStep} de {steps.length}
        </span>
      </div>
    </div>
  );
};