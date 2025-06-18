// app/admin/usuarios/UserTable.tsx
"use client";

import { useState } from 'react';
import { deleteUser, updateUserRole } from '../../actions/user-actions';
import { FaUserCircle } from 'react-icons/fa'; // Importa el icono de usuario

interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  role: string;
  createdAt?: string | null;
}

export default function UserTable({ users }: { users: User[] }) {
  const [localUsers, setLocalUsers] = useState(users);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const handleRoleUpdate = async (uid: string) => {
    if (!newRole) return;
    
    try {
      await updateUserRole(uid, newRole);
      setLocalUsers(prev => prev.map(user => 
        user.uid === uid ? { ...user, role: newRole } : user
      ));
      setEditingUserId(null);
    } catch (error) {
      console.error('Error updating role:', error);
      // Reemplazado alert con console.error para no usar alertas en la UI
      console.error('Error al actualizar el rol'); 
    }
  };

  const confirmDelete = (uid: string) => {
    setUserToDelete(uid);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    
    try {
      await deleteUser(userToDelete);
      setLocalUsers(prev => prev.filter(user => user.uid !== userToDelete));
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      // Reemplazado alert con console.error para no usar alertas en la UI
      console.error('Error al eliminar usuario');
    }
  };

  return (
    <div className="bg-white text-black shadow rounded-lg p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestión de Usuarios</h1>
      
      {/* Modal de confirmación */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Confirmar eliminación</h2>
            <p className="mb-6">¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.</p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <tbody className="bg-white divide-y divide-gray-200">
            {localUsers.map((user) => (
              <tr key={user.uid}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {/* Cambio aquí: Usar FaUserCircle si photoURL no existe */}
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      className="h-10 w-10 rounded-full object-cover"
                      alt="Avatar"
                      onError={(e) => { // Manejo básico de error de imagen
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none'; // Oculta la imagen rota
                        // Podrías añadir lógica para mostrar el icono aquí directamente si la imagen falla al cargar.
                      }}
                    />
                  ) : (
                    <FaUserCircle className="h-10 w-10 text-gray-400" /> // Icono de React como fallback
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <p className="font-medium">{user.displayName}</p>
                    <p className="text-gray-500 text-sm">{user.email}</p>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  {editingUserId === user.uid ? (
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="border text-black rounded-md px-2 py-1"
                    >
                      <option value="admin">Admin</option>
                      <option value="vet">Veterinario</option>
                      <option value="cliente">cliente</option>
                    </select>
                  ) : (
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-green-100 text-green-800' 
                        : user.role === 'vet'
                          ? 'bg-purple-100 text-purple-800' // Color para veterinario
                          : 'bg-blue-100 text-blue-800' // Color para cliente u otros roles
                    }`}>
                      {user.role}
                    </span>
                  )}
                </td>

                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                  {editingUserId === user.uid ? (
                    <>
                      <button
                        onClick={() => handleRoleUpdate(user.uid)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditingUserId(null)}
                        className="px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingUserId(user.uid);
                          setNewRole(user.role);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => confirmDelete(user.uid)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}