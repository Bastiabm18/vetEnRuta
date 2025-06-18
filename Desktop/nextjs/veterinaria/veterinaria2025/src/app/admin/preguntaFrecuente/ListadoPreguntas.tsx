// app/admin/preguntaFrecuente/ListadoPreguntas.tsx
'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import Modal from './Modal';
interface Pregunta {
  id: string;
  pregunta: string;
  respuesta: string;
  fecha_creacion: { seconds: number };
}

export default function ListadoPreguntas() {
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPregunta, setEditPregunta] = useState('');
  const [editRespuesta, setEditRespuesta] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreguntas = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'preguntaFrecuente'));
        const preguntasData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Pregunta[];
        
        // Ordenar por fecha de creación (más reciente primero)
        preguntasData.sort((a, b) => b.fecha_creacion.seconds - a.fecha_creacion.seconds);
        
        setPreguntas(preguntasData);
      } catch (err) {
        console.error('Error fetching questions:', err);
        setError('Error al cargar las preguntas');
      } finally {
        setLoading(false);
      }
    };

    fetchPreguntas();
  }, []);

  const handleEdit = (pregunta: Pregunta) => {
    setEditingId(pregunta.id);
    setEditPregunta(pregunta.pregunta);
    setEditRespuesta(pregunta.respuesta);
  };

  const handleUpdate = async () => {
    if (!editingId || !editPregunta.trim() || !editRespuesta.trim()) return;

    try {
      await updateDoc(doc(db, 'preguntaFrecuente', editingId), {
        pregunta: editPregunta.trim(),
        respuesta: editRespuesta.trim()
      });

      setPreguntas(preguntas.map(p => 
        p.id === editingId 
          ? { ...p, pregunta: editPregunta.trim(), respuesta: editRespuesta.trim() }
          : p
      ));
      setEditingId(null);
    } catch (err) {
      console.error('Error updating question:', err);
      setError('Error al actualizar la pregunta');
    }
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteDoc(doc(db, 'preguntaFrecuente', deleteId));
      setPreguntas(preguntas.filter(p => p.id !== deleteId));
    } catch (err) {
      console.error('Error deleting question:', err);
      setError('Error al eliminar la pregunta');
    } finally {
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  if (loading) return <p>Cargando preguntas...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className='text-black'>
      {preguntas.length === 0 ? (
        <p>No hay preguntas frecuentes registradas</p>
      ) : (
        <div className="space-y-4">
          {preguntas.map((pregunta) => (
            <div key={pregunta.id} className="border-b border-gray-200 pb-4">
              {editingId === pregunta.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editPregunta}
                    onChange={(e) => setEditPregunta(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                  <textarea
                    value={editRespuesta}
                    onChange={(e) => setEditRespuesta(e.target.value)}
                    className="w-full p-2 border rounded"
                    rows={3}
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleUpdate}
                      className="px-3 py-1 bg-green-vet text-white rounded hover:bg-green-700"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h4 className="font-medium text-lg">{pregunta.pregunta}</h4>
                  <p className="text-gray-600 mt-1">{pregunta.respuesta}</p>
                  <div className="flex justify-end space-x-2 mt-2">
                    <button
                      onClick={() => handleEdit(pregunta)}
                      className="text-blue-vet hover:text-blue-700"
                      title="Editar"
                    >
                      <FiEdit size={18} />
                    </button>
                    <button
                      onClick={() => confirmDelete(pregunta.id)}
                      className="text-red-500 hover:text-red-700"
                      title="Eliminar"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmar eliminación"
      >
        <p>¿Estás seguro de que deseas eliminar esta pregunta?</p>
        <div className="flex justify-end space-x-4 mt-4">
          <button
            onClick={() => setShowDeleteModal(false)}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Eliminar
          </button>
        </div>
      </Modal>
    </div>
  );
}