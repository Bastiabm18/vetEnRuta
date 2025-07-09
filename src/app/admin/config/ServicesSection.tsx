'use client';

import { useState } from 'react';
import { createServicio, updateServicio, deleteServicio, getAllServicios } from './actions/config-actions';
import { Servicio } from './actions/config-actions'; // Asume que ya tienes este tipo actualizado o lo actualizaremos

export default function ServiciosSection({ initialServicios }: { initialServicios: Servicio[] }) {
  const [servicios, setServicios] = useState(initialServicios);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: 0,
    //duracion: 30, // Eliminado
    disponible_para: [] as ("perro" | "gato")[], // Eliminado "otro"
    //requiere_veterinario: true, // Eliminado
    en_promocion: false, // Nuevo campo
    precio_promocion: undefined as number | undefined, // Nuevo campo, opcional
    precio_vet: 0, // Nuevo campo opcional para precio veterinario
   precio_item: 0 // Nuevo campo opcional para precio item
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshServicios = async () => {
    setLoading(true);
    try {
      const nuevosServicios = await getAllServicios();
      setServicios(nuevosServicios);
    } catch (err) {
      console.error('Error refreshing servicios:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Preparar los datos a enviar
    const dataToSend = {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      precio: formData.precio,
      //duracion: formData.duracion, // Asegúrate de que esto se elimine si no lo envías
      disponible_para: formData.disponible_para,
      //requiere_veterinario: formData.requiere_veterinario, // Asegúrate de que esto se elimine
      en_promocion: formData.en_promocion,
      // Solo enviar new_price si en_promocion es true y precio_promocion tiene un valor
      new_price: formData.en_promocion ? formData.precio_promocion : undefined ,
      precio_vet: formData.precio_vet ? formData.precio_vet : undefined, // Nuevo campo opcional
      precio_item: formData.precio_item // 
    };
    
    // Eliminar propiedades undefined para que Firestore no se queje
    Object.keys(dataToSend).forEach(key => {
        if ((dataToSend as any)[key] === undefined) {
            delete (dataToSend as any)[key];
        }
    });

    try {
      if (editingId) {
        const result = await updateServicio(editingId, dataToSend); // Pasar los datos preparados
        if (!result.success) throw new Error(result.error);
      } else {
        const result = await createServicio(dataToSend); // Pasar los datos preparados
        if (!result.success) throw new Error(result.error);
      }
      
      await refreshServicios();
      setFormData({
        nombre: '',
        descripcion: '',
        precio: 0,
        //duracion: 30,
        disponible_para: [],
        //requiere_veterinario: true,
        en_promocion: false,
        precio_promocion: undefined,
        precio_vet: 0,
        precio_item:0,
      });
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Submit error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (servicio: Servicio) => {
    setEditingId(servicio.id);
    setFormData({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion,
      precio: servicio.precio,
      //duracion: servicio.duracion,
      disponible_para: servicio.disponible_para,
      //requiere_veterinario: servicio.requiere_veterinario,
      en_promocion: servicio.en_promocion || false, // Asegurar que sea booleano
      precio_promocion: servicio.new_price, // Mapear new_price a precio_promocion
     precio_vet: servicio.precio_vet ?? 0, // Mapear precio_vet, asegura que sea number
      precio_item: servicio.precio_item ?? 0 // Mapear precio_item, asegura que sea number
    });
  };

  const toggleDisponiblePara = (tipo: "perro" | "gato") => { // Eliminado "otro"
    setFormData(prev => {
      if (prev.disponible_para.includes(tipo)) {
        return {
          ...prev,
          disponible_para: prev.disponible_para.filter(item => item !== tipo)
        };
      } else {
        return {
          ...prev,
          disponible_para: [...prev.disponible_para, tipo]
        };
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este servicio?')) return;
    
    setLoading(true);
    try {
      const result = await deleteServicio(id);
      if (!result.success) throw new Error(result.error);
      await refreshServicios();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
      console.error('Delete error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white text-black rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Gestión de Servicios</h2>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Nombre del servicio"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              required
            />
          </div>
          <div className="md:col-span-2">
            <textarea
              placeholder="Descripción"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              rows={3}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Precio (CLP)</label>
            <input
              type="number"
              value={formData.precio}
              onChange={(e) => setFormData({ ...formData, precio: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              min="0"
              required
            />
          </div>
          {/* Duración eliminada */}
          
          {/* Nuevo campo: En Promoción */}
          <div className="flex items-center md:col-span-1">
            <input
              type="checkbox"
              checked={formData.en_promocion}
              onChange={(e) => {
                setFormData({ 
                  ...formData, 
                  en_promocion: e.target.checked,
                  precio_promocion: e.target.checked ? formData.precio_promocion : undefined // Limpia si se desactiva
                });
              }}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">En promoción</label>
          </div>

          {/* Nuevo campo: Precio en Promoción (condicional) */}
          {formData.en_promocion && (
            <div>
              <label className="block text-sm text-gray-500 mb-1">Precio en promoción (CLP)</label>
              <input
                type="number"
                value={formData.precio_promocion || ''} // Usar '' para que el input no muestre 0 si es undefined
                onChange={(e) => setFormData({ ...formData, precio_promocion: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                min="0"
                required={formData.en_promocion} // Requerido solo si está en promoción
              />
            </div>
          )}
          
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-500 mb-2">Disponible para:</label>
            <div className="flex gap-4">
              {(['perro', 'gato'] as const).map(tipo => ( // Eliminado "otro"
                <label key={tipo} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.disponible_para.includes(tipo)}
                    onChange={() => toggleDisponiblePara(tipo)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">{tipo}</span>
                </label>
              ))}
            </div>
          </div>
           <div>
            <label className="block text-sm text-gray-500 mb-1">Precio Vet (CLP)</label>
            <input
              type="number"
              value={formData.precio_vet}
              onChange={(e) => setFormData({ ...formData, precio_vet: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              min="0"
              required
            />
          </div>
           <div>
            <label className="block text-sm text-gray-500 mb-1">Precio Item (CLP)</label>
            <input
              type="number"
              value={formData.precio_item}
              onChange={(e) => setFormData({ ...formData, precio_item: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              min="0"
              required
            />
          </div>
          
          {/* Requiere veterinario eliminado */}
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
                setFormData({
                  nombre: '',
                  descripcion: '',
                  precio: 0,
                  //duracion: 30,
                  disponible_para: [],
                  //requiere_veterinario: true,
                  en_promocion: false,
                  precio_promocion: undefined,
                  precio_vet: 0,
                  precio_item:0
                });
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio item</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio vet</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Disponible para</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Promoción</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {servicios.map((servicio) => (
              <tr key={servicio.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{servicio.nombre}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500 line-clamp-2">{servicio.descripcion}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">${servicio.precio.toLocaleString('es-CL')}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {servicio.precio_item !== undefined
                      ? `$${servicio.precio_item.toLocaleString('es-CL')}`
                      : <span className="text-gray-400">N/A</span>
                    }
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {servicio.precio_vet !== undefined
                      ? `$${servicio.precio_vet.toLocaleString('es-CL')}`
                      : <span className="text-gray-400">N/A</span>
                    }
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {servicio.disponible_para.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')}
                  </div>
                </td>
                {/* Columna Promoción */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {servicio.en_promocion && servicio.new_price !== undefined ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      ${servicio.new_price.toLocaleString('es-CL')}
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      No
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleEdit(servicio)}
                    className="text-indigo-600 hover:text-indigo-900 px-2 py-1 rounded hover:bg-indigo-50"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(servicio.id)}
                    className="text-red-600 hover:text-red-900 px-2 py-1 rounded hover:bg-red-50"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}