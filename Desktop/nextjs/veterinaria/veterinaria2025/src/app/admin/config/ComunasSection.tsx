'use client';

import { useState, useEffect } from 'react'; // Importar useEffect
import { createComuna, updateComuna, deleteComuna, getAllComunas } from './actions/config-actions';
import DeleteButton from './DeleteButton';

// Asegúrate de que estos tipos coincidan con actions.ts
interface Region {
  id: string;
  nombre: string;
}

interface Comuna {
  id: string;
  nombre: string;
  regionId: string; // Asegurarse de que sea regionId
}

export default function ComunasSection({ 
  initialComunas,
  regiones 
}: { 
  initialComunas: Comuna[],
  regiones: Region[]
}) {
  const [comunas, setComunas] = useState(initialComunas);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nombre: '', regionId: '' }); // ✨ CAMBIO 1: Inicializar regionId como cadena vacía
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✨ CAMBIO 2: Usar useEffect para establecer la región por defecto cuando las regiones estén disponibles
  useEffect(() => {
    if (regiones.length > 0 && !formData.regionId) {
      setFormData(prev => ({ ...prev, regionId: regiones[0].id }));
    } else if (regiones.length === 0 && formData.regionId) {
      // Si no hay regiones, asegúrate de que regionId no sea un valor inválido
      setFormData(prev => ({ ...prev, regionId: '' }));
    }
  }, [regiones, formData.regionId]); // Dependencias: cuando cambian las regiones o regionId

  const refreshComunas = async () => {
    setLoading(true);
    try {
      const nuevasComunas = await getAllComunas();
      setComunas(nuevasComunas); 
    } catch (err) {
      console.error('Error refreshing comunas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // ✨ VALIDACIÓN ADICIONAL: Asegúrate de que regionId no esté vacío antes de enviar
    if (!formData.regionId) {
      setError('Debe seleccionar una región.');
      setLoading(false);
      return;
    }

    try {
      if (editingId) {
        const result = await updateComuna(editingId, formData);
        if (!result.success) throw new Error(result.error);
      } else {
        const result = await createComuna(formData); // Pasamos todo el formData directamente
        if (!result.success) throw new Error(result.error);
      }
      
      await refreshComunas();
      // ✨ CAMBIO 3: Reiniciar formData, asegurando que regionId sea la primera región si existe
      setFormData({ nombre: '', regionId: regiones[0]?.id || '' }); 
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Submit error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (comuna: Comuna) => {
    setEditingId(comuna.id);
    setFormData({ nombre: comuna.nombre, regionId: comuna.regionId });
  };

  const getRegionName = (regionId: string) => {
    return regiones.find(r => r.id === regionId)?.nombre || 'Desconocida';
  };

  return (
    <div className="bg-white text-black rounded-lg shadow p-6 mb-8">
      <h2 className="text-xl font-bold mb-4">Gestión de Comunas</h2>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="Nombre de la comuna"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded"
            required
          />
          <select
            value={formData.regionId}
            onChange={(e) => setFormData({ ...formData, regionId: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded"
            required
          >
            {/* ✨ CAMBIO 4: Mostrar una opción por defecto si no hay regiones o no se ha seleccionado nada */}
            {regiones.length === 0 && <option value="">Cargando regiones...</option>}
            {regiones.map(region => (
              <option key={region.id} value={region.id}>
                {region.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-4">
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
                setFormData({ nombre: '', regionId: regiones[0]?.id || '' }); 
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Región</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {comunas.map((comuna) => (
              <tr key={comuna.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{comuna.nombre}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{getRegionName(comuna.regionId)}</div> 
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleEdit(comuna)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Editar
                  </button>
                  <DeleteButton
                    itemId={comuna.id}
                    itemType="comuna"
                    onDelete={deleteComuna}
                    onSuccess={refreshComunas}
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