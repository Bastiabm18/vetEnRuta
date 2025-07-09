// src/app/agenda/componentes/Paso1/SelectRegion.tsx
"use client"
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
//import { db } from '@/lib/firebase';
import { getFirebaseClientInstances } from '@/lib/firebase';
import { motion } from 'framer-motion';
import { useAppointmentStore } from '@/lib/stores/appointmentStore';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface Region {
  id: string;
  nombre_region: string;
}

export const SelectRegion = () => {
  const [regiones, setRegiones] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const { locationData, setLocationData } = useAppointmentStore();

  useEffect(() => {
    const fetchRegiones = async () => {
      try {
        const { auth, db, storage } = getFirebaseClientInstances();
        const snapshot = await getDocs(collection(db, 'regiones'));
        const regionesData = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          nombre_region: doc.data().nombre 
        } as Region));
        setRegiones(regionesData);
      } catch (error) {
        console.error("Error fetching regiones:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRegiones();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-4"
    >
      <h3 className="text-lg font-semibold text-black">Selecciona tu región</h3>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {regiones.map((region) => (
            <button
              key={region.id}
              onClick={() => setLocationData({ 
                region: region.id,
                nom_region: region.nombre_region,
                comuna: null, // Reset comuna al cambiar región
                veterinario: null // Reset veterinario al cambiar región
              })}
              className={`p-3 rounded-lg border text-black ${
                locationData.region === region.id 
                  ? 'bg-green-vet text-white' 
                  : 'hover:border-green-vet'
              }`}
            >
              {region.nombre_region}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
};