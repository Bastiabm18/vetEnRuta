'use client';

import { useState } from 'react';
import { deleteComment } from '@/app/actions/comentario';

export default function DeleteCommentButton({ commentId }: { commentId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteComment(commentId);
      window.location.reload();
    } catch (error) {
      console.error('Delete error:', error);
      setIsDeleting(false);
      setShowModal(false);
    }
  };

  return (
    <>
      {/* Botón que abre el modal */}
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1 px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
      >
        <span>🗑️</span>
        Eliminar
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white text-black rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-3">Confirmar eliminación</h3>
            <p className="text-gray-700 mb-5">¿Estás seguro de eliminar este comentario? Esta acción no se puede deshacer.</p>
            
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