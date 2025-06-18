'use client';

import { useState } from 'react';
import { editComment } from '@/app/actions/comentario'; // Asegúrate de que esta ruta sea correcta

export default function EditCommentForm({
  commentId,
  initialComment,
  initialRating,
  initialFecha, // Propiedad para la fecha
  initialPets // Nuevo prop para 'pets'
}: {
  commentId: string;
  initialComment: string;
  initialRating: number;
  initialFecha: string; // Formato esperado: "YYYY-MM-DD"
  initialPets?: string; // 'pets' es opcional
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState(initialComment);
  const [rating, setRating] = useState(initialRating);
  const [fecha, setFecha] = useState(initialFecha); // Estado para la fecha
  const [pets, setPets] = useState(initialPets || ''); // Estado para 'pets', con un valor por defecto vacío
  const [error, setError] = useState<string | null>(null); // Estado para mensajes de error

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null); // Limpia errores previos

    try {
      if (!fecha) {
        setError("La fecha no puede estar vacía.");
        setLoading(false);
        return;
      }

      // Analizar la fecha desde el input (YYYY-MM-DD)
      const dateParts = fecha.split('-').map(Number);
      // Crear un objeto Date que represente el inicio del día seleccionado en UTC.
      const selectedDateInUTC = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2]));

      await editComment(commentId, {
        comentario: comment,
        calificacion: rating,
        fecha: selectedDateInUTC, // Pasar este objeto Date correctamente formado (UTC)
        pets: pets // Pasar el valor de 'pets'
      });
      window.location.reload(); // Recarga la página para mostrar los datos actualizados
    } catch (err: any) {
      console.error('Error updating:', err);
      setError('Error al actualizar el comentario: ' + (err.message || 'Error desconocido.'));
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm flex items-center gap-1"
      >
        <span>✏️</span>
        Editar
      </button>

      {isOpen && (
        <div className="fixed inset-0 text-black bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full shadow-lg">
            <h2 className="text-lg font-bold mb-4">Editar comentario</h2>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="rating" className="block mb-1 text-gray-700">Calificación (1-5)</label>
                <input
                  type="number"
                  id="rating"
                  min="1"
                  max="5"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="comment" className="block mb-1 text-gray-700">Comentario</label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  rows={4}
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="fecha" className="block mb-1 text-gray-700">Fecha</label>
                <input
                  type="date"
                  id="fecha"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="pets" className="block mb-1 text-gray-700">Mascotas</label>
                <input
                  type="text"
                  id="pets"
                  value={pets}
                  onChange={(e) => setPets(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  placeholder="Ej: 2 perros, 1 gato"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setIsOpen(false); setError(null); }} // Limpia el error al cerrar
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors flex items-center gap-1"
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}