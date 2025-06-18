// src/app/agenda/componentes/Paso4/PDFButton.tsx
"use client"
import { useState } from 'react';
import { useAppointmentStore } from '@/lib/stores/appointmentStore';
import { CustomButton } from '../shared/CustomButton';
import { LoadingSpinner } from '../shared/LoadingSpinner';

export const PDFButton = () => {
  const { locationData, mascotas, datosDueño } = useAppointmentStore();
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const showModal = (message: string, error = false) => {
    setModalMessage(message);
    setIsError(error);
    setModalOpen(true);
    setTimeout(() => setModalOpen(false), 3000); // Cierra automáticamente después de 3 segundos
  };

  const handleDownload = async () => {
    // Validación básica en el cliente
    if (!locationData?.fecha || !mascotas?.length || !datosDueño?.nombre) {
      showModal('Faltan datos necesarios para generar el PDF', true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locationData,
          mascotas,
          datosDueño
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al generar el PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Crear enlace y simular click
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cita_veterinaria_${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.appendChild(link);
      link.click();

      // Limpieza
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
      window.URL.revokeObjectURL(url);

      showModal('PDF generado y descargado correctamente');
    } catch (error) {
      console.error('Error:', error);
      showModal(error instanceof Error ? error.message : 'Error al generar el PDF', true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 relative">
      <CustomButton
        onClick={handleDownload}
        disabled={loading || !locationData?.fecha || !mascotas?.length || !datosDueño?.nombre}
        className="bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <LoadingSpinner />
            Generando PDF...
          </span>
        ) : (
          'Descargar Comprobante PDF'
        )}
      </CustomButton>

      {/* Modal de notificación */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className={`p-6 rounded-lg shadow-lg max-w-md w-full mx-4 ${
            isError ? 'bg-red-100 border-l-4 border-red-500' : 'bg-green-100 border-l-4 border-green-500'
          }`}>
            <div className="flex justify-between items-start">
              <h3 className={`text-lg font-medium ${
                isError ? 'text-red-800' : 'text-green-800'
              }`}>
                {isError ? 'Error' : 'Éxito'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <p className={`mt-2 ${
              isError ? 'text-red-600' : 'text-green-600'
            }`}>
              {modalMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};