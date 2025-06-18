'use client';

import { useState } from 'react';
import { createRegion, updateRegion, deleteRegion, getAllRegiones } from './actions/config-actions';
import DeleteButton from './DeleteButton';

export default function RegionesSection({ initialRegiones }: { initialRegiones: Region[] }) {
  const [regiones, setRegiones] = useState(initialRegiones);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nombre: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshRegiones = async () => {
    setLoading(true);
    try {
      const nuevasRegiones = await getAllRegiones();
      setRegiones(nuevasRegiones);
    } catch (err) {
      console.error('Error refreshing regiones:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (editingId) {
        const result = await updateRegion(editingId, formData);
        if (!result.success) throw new Error(result.error);
      } else {
        const result = await createRegion(formData);
        if (!result.success) throw new Error(result.error);
      }
      
      await refreshRegiones();
      setFormData({ nombre: '' });
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Submit error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (region: Region) => {
    setEditingId(region.id);
    setFormData({ nombre: region.nombre });
  };

  return (
    <div className="bg-white text-black rounded-lg shadow p-6 mb-8">
      <h2 className="text-xl font-bold mb-4">Gestión de Regiones</h2>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Nombre de la región"
            value={formData.nombre}
            onChange={(e) => setFormData({ nombre: e.target.value })}
            className="flex-1 px-3 py-2 border border-gray-300 rounded"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {editingId ? 'Actualizar' : 'Agregar'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setFormData({ nombre: '' });
              }}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            >
              Cancelar
            </button>
          )}
        </div>
        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {regiones.map((region) => (
              <tr key={region.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{region.nombre}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleEdit(region)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Editar
                  </button>
                  <DeleteButton
                    itemId={region.id}
                    itemType="region"
                    onDelete={deleteRegion}
                    onSuccess={refreshRegiones}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}