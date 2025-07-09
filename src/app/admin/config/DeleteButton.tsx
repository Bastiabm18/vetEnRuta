'use client';

import { useState } from 'react';

interface DeleteButtonProps {
  itemId: string;
  itemType: 'region' | 'comuna' | 'servicio';
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
  onSuccess?: () => void;
}

export default function DeleteButton({ itemId, itemType, onDelete, onSuccess }: DeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    
    try {
      const result = await onDelete(itemId);
      
      if (result.success) {
        setShowModal(false);
        onSuccess?.();
      } else {
        setError(result.error || 'Error al eliminar');
      }
    } catch (err) {
      setError('Error inesperado al eliminar');
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const getItemName = () => {
    switch (itemType) {
      case 'region': return 'región';
      case 'comuna': return 'comuna';
      case 'servicio': return 'servicio';
      default: return 'elemento';
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1 px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
      >
        <span>🗑️</span>
        Eliminar
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-3">Confirmar eliminación</h3>
            <p className="text-gray-700 mb-5">
              ¿Estás seguro de eliminar esta {getItemName()}?.
            </p>
            
            {error && (
              <p className="text-red-500 mb-3 text-sm">{error}</p>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded flex items-center gap-1 disabled:opacity-50"
              >
                {isDeleting ? (
                  <span className="animate-spin">↻</span>
                ) : (
                  <span>🗑️</span>
                )}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}