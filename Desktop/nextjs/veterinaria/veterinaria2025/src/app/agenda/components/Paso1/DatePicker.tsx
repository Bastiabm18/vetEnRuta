// src/app/agenda/componentes/Paso1/DatePicker.tsx
"use client"
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppointmentStore } from '@/lib/stores/appointmentStore';
import { format, addDays, isSunday } from 'date-fns';
import { es } from 'date-fns/locale';

export const DatePicker = () => {
  const { locationData, setLocationData } = useAppointmentStore();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Generar próximos 30 días
  const today = new Date();
  const dates = Array.from({ length: 30 }, (_, i) => addDays(today, i));

  const handleDateSelect = (date: Date) => {
    if (!isSunday(date)) {
      setSelectedDate(date);
      setLocationData({
        fecha: date,
        hora: null // Reset hora al cambiar fecha
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <h3 className="text-lg font-semibold text-black">Selecciona una fecha</h3>
      <div className="flex overflow-x-auto gap-2 pb-2">
        {dates.map((date) => {
          const dayName = format(date, 'EEE', { locale: es });
          const dayNumber = format(date, 'd');
          const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
          const isSundayDate = isSunday(date);

          return (
            <button
              key={date.toString()}
              onClick={() => handleDateSelect(date)}
              disabled={isSundayDate}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border min-w-[60px] ${
                isSelected
                  ? 'bg-green-vet text-white'
                  : isSundayDate
                    ? 'text-red-500 cursor-not-allowed'
                    : 'hover:border-green-vet text-black'
              }`}
            >
              <span className="text-sm">{dayName}</span>
              <span className="font-semibold">{dayNumber}</span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};