// src/app/agenda/componentes/Paso1/TimeSlotPicker.tsx
"use client"
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppointmentStore } from '@/lib/stores/appointmentStore';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LoadingSpinner } from '../shared/LoadingSpinner';
// La importación de reserveTimeSlot ya no es estrictamente necesaria aquí, pero la mantengo si la usas en otro lado
import { reserveTimeSlot } from '@/lib/firebase/firestore'; 

interface Veterinario {
  id: string;
  nombre: string;
}

interface ComunaConValor {
  id: string;
  nombre: string;
  valor: number;
}

interface TimeSlot {
  id: string;
  hora: string;
  disponible: boolean;
  id_usuario?: string;
  veterinario: Veterinario;
  id_comuna: ComunaConValor[];
  comunaIdsFlat: string[];
  fecha: string;
}

interface TimeSlotsByVeterinarian {
  [veterinarioId: string]: {
    nombre: string;
    slots: TimeSlot[];
  };
}

export const TimeSlotPicker = () => {
  const { locationData, setLocationData } = useAppointmentStore();
  const [timeSlotsByVeterinarian, setTimeSlotsByVeterinarian] = useState<TimeSlotsByVeterinarian>({});
  const [loading, setLoading] = useState(true);
  // const [reserving, setReserving] = useState(false); // <--- ELIMINADO: Este estado ya no es necesario aquí
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!locationData.comuna || typeof locationData.comuna !== 'string' || !locationData.fecha) return;

      try {
        setLoading(true);
        setError('');

        const year = locationData.fecha.getFullYear();
        const month = String(locationData.fecha.getMonth() + 1).padStart(2, '0');
        const day = String(locationData.fecha.getDate()).padStart(2, '0');
        const fechaStr = `${year}-${month}-${day}`;

        console.log("Fetching for comuna:", locationData.comuna, "on date:", fechaStr);
        
        const q = query(
          collection(db, 'horas_disponibles'),
          where('comunaIdsFlat', 'array-contains', locationData.comuna), 
          where('fecha', '==', fechaStr),
          orderBy('hora','asc'),
        );

        const snapshot = await getDocs(q);
        const slotsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as TimeSlot));

        console.log("Fetched slots:", slotsData);

        const groupedSlots: TimeSlotsByVeterinarian = slotsData.reduce((acc: TimeSlotsByVeterinarian, slot) => {
          const vetId = slot.veterinario.id;
          if (!acc[vetId]) {
            acc[vetId] = {
              nombre: slot.veterinario.nombre,
              slots: []
            };
          }
          acc[vetId].slots.push(slot);
          return acc;
        }, {} as TimeSlotsByVeterinarian);

        setTimeSlotsByVeterinarian(groupedSlots);
      } catch (err) {
        console.error("Error fetching time slots:", err);
        setError('Error al cargar horarios disponibles');
      } finally {
        setLoading(false);
      }
    };

    fetchTimeSlots();
  }, [locationData.comuna, locationData.fecha, setLocationData]);

  const handleTimeSlotSelect = async (slot: TimeSlot) => {
    if (!slot.disponible) return;

    setError(''); // Limpiar errores anteriores
    
    const selectedComunaId = locationData.comuna; 
    const comunaEntry = slot.id_comuna.find(c => c.id === selectedComunaId);
    const costoAdicionalComuna = comunaEntry ? comunaEntry.valor : 0;

    setLocationData({
      hora: slot.hora,
      veterinario: slot.veterinario,
      costoAdicionalComuna: costoAdicionalComuna,
      selectedTimeSlotId: slot.id, // <--- ¡NUEVO! Guarda el ID del slot seleccionado
    });
    // No hay llamada a reserveTimeSlot ni lógica de reserva aquí.
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <h3 className="text-lg font-semibold text-black">Selecciona un horario</h3>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-6">
          {Object.entries(timeSlotsByVeterinarian).map(([veterinarioId, data]) => {
            const selectedComunaId = locationData.comuna; 
            const firstSlotForVet = data.slots[0];
            const comunaEntryForVet = firstSlotForVet?.id_comuna.find(c => c.id === selectedComunaId);
            const costoAdicionalDisplay = comunaEntryForVet && comunaEntryForVet.valor > 0
              ? ` (+ $${comunaEntryForVet.valor.toLocaleString('es-CL')})`
              : ' (+ $0)';

            return (
              <div key={veterinarioId} className="space-y-2">
                <h4 className="font-semibold text-gray-700">
                  Vet: {data.nombre}{costoAdicionalDisplay}
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {data.slots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => handleTimeSlotSelect(slot)}
                      // CAMBIO AQUÍ: `reserving` eliminado, solo se deshabilita si no está disponible
                      disabled={!slot.disponible} 
                      className={`p-3 rounded-lg border text-black ${
                        locationData.hora === slot.hora && locationData.veterinario?.id === slot.veterinario.id
                          ? 'bg-green-vet text-white'
                          : slot.disponible
                            ? 'hover:border-green-vet'
                            : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      {slot.hora}
                      
                      {slot.disponible && slot.id_usuario && (
                        <div className="text-xs mt-1">{slot.id_usuario}</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {Object.keys(timeSlotsByVeterinarian).length === 0 && !loading && (
            <div className="text-gray-500">No hay horarios disponibles para la fecha y comuna seleccionadas.</div>
          )}
        </div>
      )}
    </motion.div>
  );
};