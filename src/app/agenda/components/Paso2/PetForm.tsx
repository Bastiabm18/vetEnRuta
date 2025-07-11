"use client"
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppointmentStore } from '@/lib/stores/appointmentStore';
import { CustomButton } from '../shared/CustomButton';
import { ValidationMessage } from '../shared/ValidationMessage';

export const PetForm = () => {
  // Asegúrate de que addMascota se use sin la propiedad 'servicios' en la llamada inicial
  const { mascotas, addMascota, removeMascota } = useAppointmentStore();
  const [nombre, setNombre] = useState('');
  const [info_adicional, setInfoAdicional] = useState('');
  const [observacion, setObserbacion] = useState('');
  const [tipo, setTipo] = useState<'perro' | 'gato'>('perro');
  const [edad, setEdad] = useState<'cachorro' | 'joven' | 'senior'>('cachorro');
  const [sexo, setSexo] = useState<'macho entero'|'macho castrado' | 'hembra entera' | 'hembra esterilizada'>('macho entero');
  const [error, setError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false); // New state for confirmation message

  const handleAddPet = () => {
    if (!nombre.trim()) {
      setError('Por favor ingresa un nombre para tu mascota');
      return;
    }

    // Al llamar a addMascota, ya no necesitas pasar 'servicios: []'
    // El store se encarga de inicializarlo correctamente como ServicioDetalle[]
    addMascota({ nombre, tipo, edad, sexo, info_adicional, observacion });
    
    setNombre('');
    setInfoAdicional(''); // Clear these states after adding
    setObserbacion('');   // Clear these states after adding
    setTipo('perro');     // Reset to default
    setEdad('cachorro');  // Reset to default
    setSexo('macho entero'); // Reset to default

    setError('');
    setShowConfirmation(true); // Show the confirmation message
    setTimeout(() => {
      setShowConfirmation(false); // Hide the confirmation message after 2 seconds
    }, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <h3 className="text-lg font-semibold text-black">Registra tus mascotas</h3>

      <div className="space-y-4">
        <div className="flex flex-col md:grid md:grid-cols-1 gap-4">

          <div className="flex-1">
            <label className="block text-sm font-medium text-black mb-1">
              Nombre de la mascota
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="border text-black focus:border-green-vet rounded p-2 w-full"
              placeholder="Ej: Firulais"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-black mb-1">
              Especie
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setTipo('perro')}
                className={`flex-1 p-2 rounded border ${
                  tipo === 'perro' ? 'bg-green-vet text-white' : 'text-black'
                }`}
              >
                Perro
              </button>
              <button
                onClick={() => setTipo('gato')}
                className={`flex-1 p-2 rounded border ${
                  tipo === 'gato' ? 'bg-green-vet text-white' : 'text-black'
                }`}
              >
                Gato
              </button>
            </div>
          </div>



            <div className="flex-1">
            <label className="block text-sm font-medium text-black mb-1">
              ¿Quieres agregar algun antecedente mas para la consulta?
            </label>
            <input
              type="text"
              value={observacion}
              onChange={(e) => setObserbacion(e.target.value)}
              className="border text-black focus:border-green-vet rounded p-2 w-full"
              placeholder="Motivo Principal, preocupaciones, etc."
            />
          </div>
        </div>

        {error && <ValidationMessage message={error} />}

        <CustomButton
          onClick={handleAddPet}
          className="w-full md:w-auto"
        >
          Agregar Mascota
        </CustomButton>

        {showConfirmation && ( // Conditionally render the message
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="mt-4 p-3 bg-green-100 text-green-700 rounded-lg text-center"
          >
            ¡Mascota agregada correctamente!
          </motion.div>
        )}
      </div>

      {mascotas.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-black">Tus mascotas:</h4>
          <ul className="space-y-2">
            {mascotas.map((mascota) => (
              <li
                key={mascota.id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded"
              >
                <span className="text-black">
                  {mascota.nombre} ({mascota.tipo})
                </span>
                <button
                  onClick={() => removeMascota(mascota.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
};