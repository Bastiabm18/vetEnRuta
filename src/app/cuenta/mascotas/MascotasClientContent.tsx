'use client';

import { useState, ChangeEvent } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

// Type definitions
type Pet = {
  id: string;
  userId: string;
  name: string;
  type: 'perro' | 'gato' | 'otro';
  extraType?: string;
  breed: string;
  age: number;
  weight: number;
  medicalHistory?: string;
  createdAt: any;
};

type PetFormProps = {
  pet?: Pet; // Optional: For editing existing pet
  userId: string; // Required: To associate pet with user
  onCancel: () => void; // Callback to close the form
  onPetUpdated?: (updatedPet: Pet) => void; // Optional: Callback after update
  onPetAdded?: () => void; // Optional: Callback after add
};

// Reusable PetForm component
function PetForm({ pet, userId, onCancel, onPetUpdated, onPetAdded }: PetFormProps) {
  const [formData, setFormData] = useState({
    name: pet?.name || '',
    type: pet?.type || 'perro',
    extraType: pet?.extraType || '',
    breed: pet?.breed || '',
    age: pet?.age || '',
    weight: pet?.weight || '',
    medicalHistory: pet?.medicalHistory || '',
    userId: userId,
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    handleChange(event);
    setSelectedType(event.target.value as 'perro' | 'gato' | 'otro');
  };

  const [selectedType, setSelectedType] = useState<'perro' | 'gato' | 'otro'>(pet?.type || 'perro');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = pet ? 'PUT' : 'POST';
    const url = pet ? `/api/mascotas?petId=${pet.id}` : '/api/mascotas';

    const form = e.target as HTMLFormElement;
    const formDataToSend = new FormData(form);

    const response = await fetch(url, {
      method,
      body: formDataToSend,
    });

    if (response.ok) {
      console.log(pet ? 'Mascota actualizada' : 'Mascota guardada');
      onCancel();
      if (pet && onPetUpdated) {
        const updatedPetData = {
          id: pet.id,
          name: formDataToSend.get('name') as string,
          type: formDataToSend.get('type') as 'perro' | 'gato' | 'otro',
          extraType: formDataToSend.get('extraType') as string | undefined,
          breed: formDataToSend.get('breed') as string,
          age: parseFloat(formDataToSend.get('age') as string),
          weight: parseFloat(formDataToSend.get('weight') as string),
          medicalHistory: formDataToSend.get('medicalHistory') as string | undefined,
          userId: userId,
          createdAt: (pet as any).createdAt, // Mantener createdAt si existe
        };
        onPetUpdated(updatedPetData);
      }
      if (!pet && onPetAdded) onPetAdded();
    } else {
      console.error('Error al guardar/actualizar la mascota');
      const errorData = await response.json();
      console.error(errorData);
    }
  };

  return (
    <form
      id="pet-form"
      className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6"
      onSubmit={handleSubmit}
    >
      <input type="hidden" name="userId" value={userId} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input
            id="name"
            type="text"
            name="name"
            defaultValue={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
          <select
            id="type"
            name="type"
            required
            className="w-full px-3 py-2 border rounded-md"
            value={selectedType}
            onChange={handleTypeChange}
          >
            <option value="perro">Perro</option>
            <option value="gato">Gato</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        {selectedType === 'otro' && (
          <div>
            <label htmlFor="extraType" className="block text-sm font-medium text-gray-700 mb-1">Especifique tipo</label>
            <input
              id="extraType"
              type="text"
              name="extraType"
              defaultValue={formData.extraType}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              required={selectedType === 'otro'}
            />
          </div>
        )}

        <div>
          <label htmlFor="breed" className="block text-sm font-medium text-gray-700 mb-1">Raza</label>
          <input
            id="breed"
            type="text"
            name="breed"
            defaultValue={formData.breed}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">Edad (años)</label>
          <input
            id="age"
            type="number"
            name="age"
            defaultValue={formData.age}
            onChange={handleChange}
            min="0"
            step="0.5"
            required
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
          <input
            id="weight"
            type="number"
            name="weight"
            defaultValue={formData.weight}
            onChange={handleChange}
            min="0"
            step="0.1"
            required
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="medicalHistory" className="block text-sm font-medium text-gray-700 mb-1">Historial médico (opcional)</label>
        <textarea
          id="medicalHistory"
          name="medicalHistory"
          rows={3}
          defaultValue={formData.medicalHistory}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="px-4 py-2 border rounded-md"
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {pet ? 'Actualizar' : 'Guardar'} Mascota
        </button>
      </div>
    </form>
  );
}

type MascotasClientContentProps = {
  initialPets: Pet[];
  userId: string;
};

export default function MascotasClientContent({ initialPets, userId }: MascotasClientContentProps) {
  const [formState, setFormState] = useState<Pet | 'new' | null>(null);
  const [pets, setPets] = useState<Pet[]>(initialPets);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [petToDeleteId, setPetToDeleteId] = useState<string | null>(null);

  const handleShowAddForm = () => setFormState('new');
  const handleShowEditForm = (pet: Pet) => setFormState(pet);
  const handleCancelForm = () => setFormState(null);

  const handlePetUpdated = (updatedPet: Pet) => {
    setPets(currentPets =>
      currentPets.map(pet => (pet.id === updatedPet.id ? updatedPet : pet))
    );
    setFormState(null);
  };

  const handlePetAdded = async () => {
    const res = await fetch('/api/mascotas'); // Assuming you have a GET endpoint
    if (res.ok) {
      const updatedPets = await res.json();
      setPets(updatedPets);
    } else {
      console.error('Failed to fetch updated pets');
    }
    setFormState(null);
  };

  const openDeleteModal = (petId: string) => {
    setPetToDeleteId(petId);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setPetToDeleteId(null);
    setDeleteModalOpen(false);
  };

  const handleDeletePet = async () => {
    if (petToDeleteId) {
      const res = await fetch(`/api/mascotas?petId=${petToDeleteId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        console.log(`Mascota con ID ${petToDeleteId} eliminada`);
        setPets(currentPets => currentPets.filter(pet => pet.id !== petToDeleteId));
      } else {
        console.error('Error al eliminar la mascota');
        const errorData = await res.json();
        console.error(errorData);
      }
      closeDeleteModal();
    }
  };

  return (
    <div className="flex-1 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Mis Mascotas</h1>
            <button
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              onClick={handleShowAddForm}
            >
              <FaPlus /> Agregar Mascota
            </button>
          </div>

          {formState && (
            <div className="mb-6">
              <PetForm
                pet={formState === 'new' ? undefined : formState}
                userId={userId}
                onCancel={handleCancelForm}
                onPetUpdated={handlePetUpdated}
                onPetAdded={handlePetAdded}
              />
            </div>
          )}

          {pets.length === 0 && !formState ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Aún no tienes mascotas registradas.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pets.map(pet => (
                <div key={pet.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{pet.name}</h3>
                      <p className="text-gray-600 capitalize">
                        {pet.type === 'otro' ? pet.extraType : pet.type} • {pet.breed}
                      </p>
                      <p className="text-gray-600">{pet.age} años • {pet.weight} kg</p>
                      {pet.medicalHistory && (
                        <details className="mt-2">
                          <summary className="text-sm text-blue-600 cursor-pointer">Ver historial médico</summary>
                          <p className="text-gray-700 mt-1 pl-2 border-l-2 border-gray-200">{pet.medicalHistory}</p>
                        </details>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="text-blue-600 hover:text-blue-800 p-2"
                        onClick={() => handleShowEditForm(pet)}
                        title="Editar mascota"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800 p-2"
                        onClick={() => openDeleteModal(pet.id)}
                        title="Eliminar mascota"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-md shadow-lg">
            <h2 className="text-lg font-bold mb-4">¿Eliminar mascota?</h2>
            <p className="mb-4">¿Estás seguro de que deseas eliminar esta mascota?</p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 border rounded-md"
                onClick={closeDeleteModal}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                onClick={handleDeletePet}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}