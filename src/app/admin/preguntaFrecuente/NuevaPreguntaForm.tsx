// app/admin/preguntaFrecuente/NuevaPreguntaForm.tsx
'use client';

import { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
//import { db } from '@/lib/firebase';
import { getFirebaseClientInstances } from '@/lib/firebase';

export default function NuevaPreguntaForm() {
  const [pregunta, setPregunta] = useState('');
  const [respuesta, setRespuesta] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!pregunta.trim() || !respuesta.trim()) {
      setError('Ambos campos son obligatorios');
      setLoading(false);
      return;
    }

    try {
      const { auth, db, storage } = getFirebaseClientInstances();
      await addDoc(collection(db, 'preguntaFrecuente'), {
        pregunta: pregunta.trim(),
        respuesta: respuesta.trim(),
        fecha_creacion: new Date()
      });

      setPregunta('');
      setRespuesta('');
      setSuccess('Pregunta creada exitosamente');
    } catch (err) {
      console.error('Error al crear pregunta:', err);
      setError('Error al crear la pregunta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white text-black shadow-md rounded-lg p-6">
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{success}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="pregunta" className="block text-sm font-medium text-gray-700">
            Pregunta
          </label>
          <input
            type="text"
            id="pregunta"
            value={pregunta}
            onChange={(e) => setPregunta(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-vet focus:ring-blue-vet sm:text-sm"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="respuesta" className="block text-sm font-medium text-gray-700">
            Respuesta
          </label>
          <textarea
            id="respuesta"
            rows={4}
            value={respuesta}
            onChange={(e) => setRespuesta(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-vet focus:ring-blue-vet sm:text-sm"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-vet hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-vet disabled:bg-gray-400"
        >
          {loading ? 'Guardando...' : 'Guardar Pregunta'}
        </button>
      </form>
    </div>
  );
}