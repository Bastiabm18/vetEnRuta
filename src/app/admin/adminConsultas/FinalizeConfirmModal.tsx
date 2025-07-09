// app/admin/consultas/FinalizeConfirmModal.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import { Cita } from './actions'; // Importa la interfaz Cita desde actions.ts

interface FinalizeConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isProcessing: boolean; // Para mostrar un spinner si está procesando la finalización
  cita: Cita; // Asegúrate de que la interfaz Cita sea la correcta y contenga costoAdicionalComuna
}

const FinalizeConfirmModal: React.FC<FinalizeConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isProcessing,
  cita,
}) => {
  if (!isOpen) return null;

  // Calcula el total solo de servicios
  const totalServicios = cita.mascotas?.reduce((sumMascota: number, mascota: any) => {
    return sumMascota + (mascota.servicios?.reduce((sumServicio: number, servicio: any) => sumServicio + (servicio.precio || 0), 0) || 0);
  }, 0) || 0;

  // NUEVO: Calcula el total final incluyendo el recargo por comuna
  const totalFinalConRecargo = totalServicios + (cita.locationData?.costoAdicionalComuna || 0) + (cita.precio_base || 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50"
        >
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-auto relative transform transition-all duration-300"
          >
            <h3 className="text-2xl font-bold text-center text-green-700 mb-4 flex items-center justify-center">
              <FaCheckCircle className="mr-3 text-green-500" /> Confirmar Finalización
            </h3>
            <p className="text-gray-700 text-center mb-6">
              ¿Estás seguro de que quieres finalizar la cita para **{cita.datosDueno.nombre}**?
              <br />
              Esto marcará la cita como completada y generará el mensaje de WhatsApp con el total.
            </p>

            <div className="bg-green-50 p-4 rounded-md mb-6 border border-green-200">
              <p className="text-lg font-semibold text-green-800 text-center">
                Monto Total Estimado: <span className="font-bold">${totalFinalConRecargo.toLocaleString('es-CL')}</span>
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="flex items-center px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FaTimesCircle className="mr-2" /> Cancelar
              </button>
              <button
                onClick={onConfirm}
                disabled={isProcessing}
                className={`flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                  ${isProcessing ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'}`}
              >
                {isProcessing ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" /> Finalizando...
                  </>
                ) : (
                  <>
                    <FaCheckCircle className="mr-2" /> Sí, Finalizar
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FinalizeConfirmModal;