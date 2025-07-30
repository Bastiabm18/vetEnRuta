// app/components/precioVisita.tsx (o la ruta que corresponda)
'use client';

import { useState, useEffect } from 'react';
// 👇 Asegúrate de que la ruta a tu archivo de actions sea la correcta
import { getPrecioBase, updatePrecioBase } from './actions/config-actions';

export function PrecioVisita() {
  const [precio, setPrecio] = useState<number>(0);
  const [precioVet, setPrecioVet] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  // Carga el precio desde Firestore cuando el componente se monta
  useEffect(() => {
    async function fetchPrecio() {
      setIsLoading(true);
      const precioActual = await getPrecioBase();
      setPrecio(precioActual);
      setIsLoading(false);
    }
    fetchPrecio();
  }, []);

  // Maneja el envío del formulario
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage('');

    // Llama a la server action para actualizar el precio
    const result = await updatePrecioBase(precio, precioVet);

    if (result.success) {
      setMessage('¡Precio actualizado con éxito!');
    } else {
      setMessage(result.error || 'Ocurrió un error al guardar.');
    }
    
    // Limpia el mensaje después de 3 segundos
    setTimeout(() => setMessage(''), 3000);
    setIsSaving(false);
  };
  
  // Muestra un mensaje mientras se carga el dato inicial
  if (isLoading) {
    return <div className="text-center p-4">Cargando configuración de precio...</div>;
  }

  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Gestionar Precio Base de Visita</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="precio_base" className="block text-sm font-medium text-gray-700">
            Establecer Precio basico de visita ($)
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
             <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-500 sm:text-sm">$</span>
             </div>
            <input
              type="number"
              id="precio_base"
              name="precio_base"
              value={precio}
              onChange={(e) => setPrecio(Number(e.target.value))}
              className="block w-full rounded-md border-gray-300 text-black pl-7 pr-12 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="0"
              min="0"
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor="precio_base_vet" className="block text-sm font-medium text-gray-700">
            % Precio basico de visita Vet ($)
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
             <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-500 sm:text-sm">$</span>
             </div>
            <input
              type="number"
              id="precio_base_vet"
              name="precio_base_vet"
              value={precioVet}
              onChange={(e) => setPrecioVet(Number(e.target.value))}
              className="block w-full rounded-md border-gray-300 text-black pl-7 pr-12 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="0"
              min="0"
              required
            />
          </div>
        </div>
        
        <button
          type="submit"
          disabled={isSaving}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSaving ? 'Guardando...' : 'Guardar Precio'}
        </button>
      </form>
      
      {message && (
        <p className={`mt-3 text-center text-sm font-medium ${message.includes('éxito') ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
}