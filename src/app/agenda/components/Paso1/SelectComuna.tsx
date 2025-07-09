// src/app/agenda/componentes/Paso1/SelectComuna.tsx
"use client"
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion'; // Importa AnimatePresence
import { useAppointmentStore } from '@/lib/stores/appointmentStore';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface Comuna {
  id: string;
  nombre: string;
}

export const SelectComuna = () => {
  const [comunas, setComunas] = useState<Comuna[]>([]);
  const [loading, setLoading] = useState(true);
  const { locationData, setLocationData } = useAppointmentStore();
  const [showInfoMessage, setShowInfoMessage] = useState(false); // NUEVO ESTADO

  useEffect(() => {
    const fetchComunas = async () => {
      if (!locationData.region) return;
      
      try {
        const q = query(
          collection(db, 'comunas'),
          where('regionId', '==', locationData.region)
        );
        const snapshot = await getDocs(q);
        const comunasData = snapshot.docs.map(doc => ({
          id: doc.id,
          nombre: doc.data().nombre
        } as Comuna));
        setComunas(comunasData);
      } catch (error) {
        console.error("Error fetching comunas:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchComunas();
  }, [locationData.region]);

  // Efecto para ocultar el mensaje informativo después de 3 segundos
  useEffect(() => {
    if (showInfoMessage) {
      const timer = setTimeout(() => {
        setShowInfoMessage(false);
      }, 3000); // El mensaje desaparecerá después de 3 segundos
      return () => clearTimeout(timer); // Limpiar el timer si el componente se desmonta o el estado cambia
    }
  }, [showInfoMessage]); // Se ejecuta cuando showInfoMessage cambia

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-4"
    >
      <h3 className="text-lg font-semibold text-black">Selecciona tu comuna</h3>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {comunas.map((comuna) => (
            <button
              key={comuna.id}
              onClick={() => {
                setLocationData({ comuna: comuna.id , nom_comuna: comuna.nombre });
                setShowInfoMessage(true); // ACTIVAR EL MENSAJE AL SELECCIONAR
              }}
              className={`p-3 rounded-lg border text-black ${
                locationData.comuna === comuna.id 
                  ? 'bg-green-vet text-white' 
                  : 'hover:border-green-vet'
              }`}
            >
              {comuna.nombre}
            </button>
          ))}
        </div>
      )}

      {/* NUEVO: Mensaje informativo sobre cargo adicional */}
      <AnimatePresence> {/* Envuelve el mensaje con AnimatePresence para que funcione la animación 'exit' */}
        {showInfoMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }} 
            transition={{ duration: 0.3 }}
            className="bg-green-vet bg-opacity-70 p-3 rounded-lg text-black text-sm mt-4"
          >
            <p>Algunas comunas podrían tener un cargo adicional.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};