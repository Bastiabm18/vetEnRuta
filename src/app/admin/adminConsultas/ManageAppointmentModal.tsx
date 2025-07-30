"use client";

import React, { useState, useEffect } from 'react';
import { Mascota, Servicio, Cita, CitaServicio, addMascotaToCita } from './actions'; 
import { getAvailableServices, updateMascotaServices, removeMascotaFromCita } from './actions';
import { FaTimes, FaPlusCircle, FaMinusCircle, FaSpinner, FaCheckCircle, FaExclamationTriangle, FaDog, FaCat, FaTimesCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface ManageAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cita: Cita;
  onServicesUpdated: () => void; // Callback para recargar citas después de actualizar
}

export default function ManageAppointmentModal({ isOpen, onClose, cita, onServicesUpdated }: ManageAppointmentModalProps) {
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mascotaToDelete, setMascotaToDelete] = useState<{id: string, nombre: string} | null>(null);
  const [deletingMascota, setDeletingMascota] = useState<string | null>(null);
  const [deleteMascotaError, setDeleteMascotaError] = useState<string | null>(null);

  // availableServices ya tiene la interfaz correcta gracias a la actualización en actions.ts
  const [availableServices, setAvailableServices] = useState<Servicio[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [errorServices, setErrorServices] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatusMessage, setSaveStatusMessage] = useState<string | null>(null);
  const [isErrorSaveStatus, setIsErrorSaveStatus] = useState<boolean>(false);

  const [localCitaMascotas, setLocalCitaMascotas] = useState<Mascota[]>([]);
  const [selectedMascotaId, setSelectedMascotaId] = useState<string | null>(null);

  // ESTADOS PARA AGREGAR MASCOTA
  const [showAddMascotaForm, setShowAddMascotaForm] = useState(false);
  const [newMascotaName, setNewMascotaName] = useState('');
  const [newMascotaTipo, setNewMascotaTipo] = useState<'perro' | 'gato' | ''>('');
  const [newMascotaSexo, setNewMascotaSexo] = useState<'macho entero' | 'macho castrado' | 'hembra entera' | 'hembra esterilizada' | ''>('');
  const [newMascotaEdad, setNewMascotaEdad] = useState<'cachorro' | 'joven' | 'senior' | ''>('');
  const [newMascotaInfoAdicional, setNewMascotaInfoAdicional] = useState('');
  const [newMascotaObservacion, setNewMascotaObservacion] = useState('');
  const [addMascotaError, setAddMascotaError] = useState<string | null>(null);
  const [addingMascota, setAddingMascota] = useState(false);

  const [serviceFilter, setServiceFilter] = useState(''); // Filtro de búsqueda para servicios disponibles

  // Efecto para limpiar el mensaje de estado después de 3 segundos
  useEffect(() => {
    if (saveStatusMessage) {
      const timer = setTimeout(() => {
        setSaveStatusMessage(null);
        setIsErrorSaveStatus(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [saveStatusMessage]);

  // Efecto para cargar servicios y resetear estados al abrir el modal o cambiar la cita
  useEffect(() => {
    if (isOpen) {
      fetchAvailableServices();
      // Crear una copia profunda de las mascotas. Los servicios aquí ya deberían ser de tipo CitaServicio[]
      setLocalCitaMascotas(JSON.parse(JSON.stringify(cita.mascotas || [])));
      setSaveStatusMessage(null);
      setIsErrorSaveStatus(false);
      setShowAddMascotaForm(false);
      setAddMascotaError(null);

      // Seleccionar la primera mascota por defecto si hay alguna
      if (cita.mascotas && cita.mascotas.length > 0) {
        setSelectedMascotaId(cita.mascotas[0].id);
      } else {
        setSelectedMascotaId(null);
      }
    }
  }, [isOpen, cita]);

  const fetchAvailableServices = async () => {
    setLoadingServices(true);
    setErrorServices(null);
    const result = await getAvailableServices();
    if (result.services) {
      setAvailableServices(result.services);
    } else if (result.error) {
      setErrorServices(result.error);
    }
    setLoadingServices(false);
  };

  const currentSelectedMascota = localCitaMascotas.find(m => m.id === selectedMascotaId);
  // Aseguramos que los servicios sean de tipo CitaServicio[]
  const currentMascotaServices: CitaServicio[] = currentSelectedMascota?.servicios || [];

  const handleAddService = (serviceToAdd: Servicio) => {
    if (!currentSelectedMascota) return;

    if (currentMascotaServices.some(s => s.id === serviceToAdd.id)) {
      setSaveStatusMessage('Este servicio ya está asignado a la mascota.');
      setIsErrorSaveStatus(true);
      return;
    }

    const updatedMascotas = localCitaMascotas.map(mascota => {
      if (mascota.id === selectedMascotaId) {
        // ✨ Lógica para determinar el precio a guardar:
        // Si está en promoción y tiene new_price, usa new_price, de lo contrario, usa el precio normal.
        const finalPrice = serviceToAdd.en_promocion && serviceToAdd.new_price !== undefined 
                           ? serviceToAdd.new_price 
                           : serviceToAdd.precio;

        return {
          ...mascota,
          servicios: [...(mascota.servicios || []), {
            id: serviceToAdd.id,
            nombre: serviceToAdd.nombre,
            precio: finalPrice, // ✨ Usar el precio final calculado
            precio_vet: serviceToAdd.precio_vet
          } as CitaServicio]
        };
      }
      return mascota;
    });
    setLocalCitaMascotas(updatedMascotas);
    setSaveStatusMessage(null);
    setIsErrorSaveStatus(false);
  };

  const handleRemoveMascota = async (mascotaId: string, mascotaNombre: string) => {
    setMascotaToDelete({ id: mascotaId, nombre: mascotaNombre });
    setShowDeleteConfirm(true);
  };

  const confirmDeleteMascota = async () => {
    if (!mascotaToDelete) return;

    setShowDeleteConfirm(false);
    setDeletingMascota(mascotaToDelete.id);
    setDeleteMascotaError(null);

    const result = await removeMascotaFromCita(cita.id, mascotaToDelete.id);

    if (result.success) {
      setSaveStatusMessage(`¡Mascota ${mascotaToDelete.nombre} eliminada correctamente de la cita!`);
      setIsErrorSaveStatus(false);
      onServicesUpdated(); // Notificar al componente padre para recargar citas

      setLocalCitaMascotas(prevMascotas => prevMascotas.filter(m => m.id !== mascotaToDelete.id));
      if (selectedMascotaId === mascotaToDelete.id) {
        setSelectedMascotaId(null);
      }
    } else if (result.error) {
      setDeleteMascotaError(`Error al eliminar a ${mascotaToDelete.nombre}: ${result.error}`);
      setSaveStatusMessage(`Error al eliminar a ${mascotaToDelete.nombre}: ${result.error}`);
      setIsErrorSaveStatus(true);
    }
    
    setDeletingMascota(null);
    setMascotaToDelete(null);
  };

  const handleRemoveService = (serviceIdToRemove: string) => {
    if (!currentSelectedMascota) return;

    const updatedMascotas = localCitaMascotas.map(mascota => {
      if (mascota.id === selectedMascotaId) {
        return {
          ...mascota,
          servicios: (mascota.servicios || []).filter(s => s.id !== serviceIdToRemove)
        };
      }
      return mascota;
    });
    setLocalCitaMascotas(updatedMascotas);
    setSaveStatusMessage(null);
    setIsErrorSaveStatus(false);
  };

  const handleSaveChanges = async () => {
    if (!currentSelectedMascota) {
      setSaveStatusMessage('No hay mascota seleccionada para guardar cambios.');
      setIsErrorSaveStatus(true);
      return;
    }

    setSaving(true);
    setSaveStatusMessage(null);
    setIsErrorSaveStatus(false);
    setErrorServices(null);

    const result = await updateMascotaServices(
      cita.id,
      currentSelectedMascota.id,
      currentMascotaServices
    );

    if (result.success) {
      setSaveStatusMessage('Servicios actualizados exitosamente!');
      setIsErrorSaveStatus(false);
      onServicesUpdated(); // Notificar al componente padre para recargar citas
    } else if (result.error) {
      setSaveStatusMessage(`Error al guardar: ${result.error}`);
      setIsErrorSaveStatus(true);
    }
    setSaving(false);
  };

  // --- FUNCIÓN PARA AGREGAR MASCOTA A LA CITA ---
  const handleAddMascota = async () => {
    setAddMascotaError(null);

    // Validaciones básicas
    if (!newMascotaName || !newMascotaTipo || !newMascotaSexo || !newMascotaEdad) {
      setAddMascotaError('Por favor, completa todos los campos obligatorios: Nombre, Especie, Sexo y Edad.');
      return;
    }

    setAddingMascota(true);

    const newMascotaData: Omit<Mascota, 'id' | 'servicios'> = {
      nombre: newMascotaName,
      tipo: newMascotaTipo,
      sexo: newMascotaSexo,
      edad: newMascotaEdad,
      info_adicional: newMascotaInfoAdicional,
      observacion: newMascotaObservacion,
    };

    // Llama a la acción de servidor para añadir la mascota a la cita
    const result = await addMascotaToCita(cita.id, newMascotaData);

    if (result.success && result.mascotaId) {
      setSaveStatusMessage('¡Mascota agregada correctamente a la cita!');
      setIsErrorSaveStatus(false);
      onServicesUpdated(); // Recargar citas para que la cita en el padre también se actualice con la nueva mascota
      
      // Limpiar formulario y ocultarlo
      setNewMascotaName('');
      setNewMascotaTipo('');
      setNewMascotaSexo('');
      setNewMascotaEdad('');
      setNewMascotaInfoAdicional('');
      setNewMascotaObservacion('');
      setShowAddMascotaForm(false);
    } else if (result.error) {
      setAddMascotaError(`Error al agregar mascota: ${result.error}`);
    }
    setAddingMascota(false);
  };
  // --- FIN FUNCIÓN AGREGAR MASCOTA ---

  if (!isOpen) return null;

  // Filtrar servicios disponibles por el tipo de mascota seleccionada y el filtro de búsqueda
  const filteredAvailableServices = availableServices.filter(service => {
    const matchesType = currentSelectedMascota && service.disponible_para.includes(currentSelectedMascota.tipo as 'perro' | 'gato');
    const matchesFilter = serviceFilter.trim() === '' || 
                          service.nombre.toLowerCase().includes(serviceFilter.toLowerCase().trim()) ||
                          (service.descripcion && service.descripcion.toLowerCase().includes(serviceFilter.toLowerCase().trim()));
    return matchesType && matchesFilter;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 opacity-100">
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-indigo-700">Gestionar Cita de {cita.datosDueno.nombre}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <FaTimes size={24} />
          </button>
        </div>

        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Seleccionar Mascota:</h3>
          <div className="flex flex-wrap gap-3 mb-6 items-center">
            {localCitaMascotas.map(mascota => (
              <div key={mascota.id} className="relative">
                <button
                  onClick={() => {
                    setSelectedMascotaId(mascota.id);
                    setShowAddMascotaForm(false);
                    setAddMascotaError(null);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                    ${selectedMascotaId === mascota.id && !showAddMascotaForm
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                >
                  {mascota.nombre} ({mascota.tipo})
                </button>
                {deletingMascota === mascota.id ? (
                  <FaSpinner className="absolute -top-2 -right-2 text-white animate-spin rounded-full bg-red-600 p-1" size={24} />
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveMascota(mascota.id, mascota.nombre);
                    }}
                    className="absolute -top-2 -right-2 text-white rounded-full bg-red-600 p-1 hover:bg-red-700 transition-colors"
                    title={`Eliminar a ${mascota.nombre}`}
                  >
                    <FaTimesCircle size={20} />
                  </button>
                )}
              </div>
            ))}
            {/* BOTÓN AGREGAR MASCOTA */}
            <button
              onClick={() => {
                setShowAddMascotaForm(true);
                setSaveStatusMessage(null);
                setIsErrorSaveStatus(false);
                setAddMascotaError(null);
                setNewMascotaName('');
                setNewMascotaTipo('');
                setNewMascotaSexo('');
                setNewMascotaEdad('');
                setNewMascotaInfoAdicional('');
                setNewMascotaObservacion('');
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2
                  ${showAddMascotaForm
                    ? 'bg-green-700 text-white shadow-md'
                    : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
            >
              <FaPlusCircle /> Agregar Mascota
            </button>
          </div>

          {/* FORMULARIO AGREGAR MASCOTA */}
          {showAddMascotaForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Nueva Mascota</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="newMascotaName" className="block text-sm font-medium text-gray-700 mb-1">Nombre de la mascota</label>
                  <input
                    type="text"
                    id="newMascotaName"
                    value={newMascotaName}
                    onChange={(e) => setNewMascotaName(e.target.value)}
                    className="border border-gray-300 focus:border-indigo-500 rounded-md p-2 w-full text-gray-900"
                    placeholder="Ej: Firulais"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Especie</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setNewMascotaTipo('perro')}
                      className={`flex-1 p-2 rounded border ${newMascotaTipo === 'perro' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'}`}
                    >
                      <FaDog className="inline-block mr-1" /> Perro
                    </button>
                    <button
                      onClick={() => setNewMascotaTipo('gato')}
                      className={`flex-1 p-2 rounded border ${newMascotaTipo === 'gato' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'}`}
                    >
                      <FaCat className="inline-block mr-1" /> Gato
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    <button
                      onClick={() => setNewMascotaSexo('macho entero')}
                      className={`flex-1 p-2 rounded border text-sm ${newMascotaSexo === 'macho entero' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'}`}
                    >
                      Macho entero
                    </button>
                    <button
                      onClick={() => setNewMascotaSexo('macho castrado')}
                      className={`flex-1 p-2 rounded border text-sm ${newMascotaSexo === 'macho castrado' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'}`}
                    >
                      Macho castrado
                    </button>
                    <button
                      onClick={() => setNewMascotaSexo('hembra entera')}
                      className={`flex-1 p-2 rounded border text-sm ${newMascotaSexo === 'hembra entera' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'}`}
                    >
                      Hembra entera
                    </button>
                    <button
                      onClick={() => setNewMascotaSexo('hembra esterilizada')}
                      className={`flex-1 p-2 rounded border text-sm ${newMascotaSexo === 'hembra esterilizada' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'}`}
                    >
                      Hembra esterilizada
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Edad</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setNewMascotaEdad('cachorro')}
                      className={`flex-1 p-2 rounded border ${newMascotaEdad === 'cachorro' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'}`}
                    >
                      Cachorro
                    </button>
                    <button
                      onClick={() => setNewMascotaEdad('joven')}
                      className={`flex-1 p-2 rounded border ${newMascotaEdad === 'joven' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'}`}
                    >
                      Joven
                    </button>
                    <button
                      onClick={() => setNewMascotaEdad('senior')}
                      className={`flex-1 p-2 rounded border ${newMascotaEdad === 'senior' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'}`}
                    >
                      Senior
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="newMascotaInfoAdicional" className="block text-sm font-medium text-gray-700 mb-1">Información importante (opcional)</label>
                  <input
                    type="text"
                    id="newMascotaInfoAdicional"
                    value={newMascotaInfoAdicional}
                    onChange={(e) => setNewMascotaInfoAdicional(e.target.value)}
                    className="border border-gray-300 focus:border-indigo-500 rounded-md p-2 w-full text-gray-900"
                    placeholder="Ej: Enfermedades o tratamientos actuales"
                  />
                </div>
                <div>
                  <label htmlFor="newMascotaObservacion" className="block text-sm font-medium text-gray-700 mb-1">Observaciones (opcional)</label>
                  <input
                    type="text"
                    id="newMascotaObservacion"
                    value={newMascotaObservacion}
                    onChange={(e) => setNewMascotaObservacion(e.target.value)}
                    className="border border-gray-300 focus:border-indigo-500 rounded-md p-2 w-full text-gray-900"
                    placeholder="Motivo Principal, preocupaciones, etc."
                  />
                </div>
                {addMascotaError && (
                  <p className="text-red-600 text-sm mt-2 flex items-center">
                    <FaExclamationTriangle className="mr-2" /> {addMascotaError}
                  </p>
                )}
                <button
                  onClick={handleAddMascota}
                  disabled={addingMascota}
                  className={`px-6 py-2 rounded-lg text-lg font-semibold transition-colors duration-200 w-full mt-4
                    ${addingMascota
                      ? 'bg-green-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white shadow-md'
                    }`}
                >
                  {addingMascota ? (
                    <>
                      <FaSpinner className="animate-spin inline-block mr-2" /> Agregando...
                    </>
                  ) : (
                    'Confirmar Agregar Mascota'
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Renderiza la sección de gestión de servicios solo si hay una mascota seleccionada y el formulario de agregar mascota no está visible */}
          {selectedMascotaId && !showAddMascotaForm ? (
            <>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Servicios Actuales de {currentSelectedMascota?.nombre}</h3>
              {currentMascotaServices.length === 0 ? (
                <p className="text-gray-600 italic mb-6">Esta mascota no tiene servicios asignados para esta cita.</p>
              ) : (
                <ul className="space-y-2 mb-6">
                  {currentMascotaServices.map(service => (
                    <li key={service.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <span className="text-gray-800 font-medium">{service.nombre}</span>
                      <div className="flex items-center">
                        <span className="text-green-600 font-bold mr-3">${service.precio.toLocaleString('es-CL')}</span>
                        <button
                          onClick={() => handleRemoveService(service.id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded-full bg-white hover:bg-red-100 transition-colors"
                          title="Eliminar servicio"
                        >
                          <FaMinusCircle size={20} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <h3 className="text-xl font-semibold text-gray-800 mb-4">Servicios Disponibles para {currentSelectedMascota?.nombre}</h3>
              {/* INPUT PARA FILTRAR SERVICIOS */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Filtrar servicios por nombre o descripción..."
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                />
              </div>
              
              {loadingServices ? (
                <div className="flex items-center justify-center py-8">
                  <FaSpinner className="animate-spin text-indigo-600 text-3xl mr-3" />
                  <p className="text-gray-700">Cargando servicios disponibles...</p>
                </div>
              ) : errorServices ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                  <strong className="font-bold">Error:</strong>
                  <span className="block sm:inline"> {errorServices}</span>
                </div>
              ) : filteredAvailableServices.length === 0 ? (
                <p className="text-gray-600 italic mb-6">No hay servicios disponibles para este tipo de mascota.</p>
              ) : (
                <ul className="space-y-2 mb-6">
                  {filteredAvailableServices.map(service => (
                    <li key={service.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm relative"> {/* Added relative for promo tag */}
                      <div className="flex-1">
                        <span className="text-gray-900 font-medium">{service.nombre}</span>
                        {service.descripcion && <p className="text-gray-600 text-sm">{service.descripcion}</p>}
                      </div>
                      <div className="flex items-center">
                        {/* ✨ Lógica de visualización de precios con promoción */}
                        {service.en_promocion && service.new_price !== undefined ? (
                          <div className="flex flex-col items-end mr-3">
                            <span className="text-sm text-red-500 line-through">
                              ${service.precio.toLocaleString('es-CL')}
                            </span>
                            <span className="text-green-600 font-bold text-lg">
                              ${service.new_price.toLocaleString('es-CL')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-green-600 font-bold mr-3 text-lg">
                            ${service.precio.toLocaleString('es-CL')}
                          </span>
                        )}
                        {/* Etiqueta "¡En Promoción!" */}
                        {service.en_promocion && (
                          <span className="absolute top-2 left-40 bg-green-vet text-white text-xs font-semibold px-2 py-1 rounded-full">
                            ¡En Promoción!
                          </span>
                        )}

                        <button
                          onClick={() => handleAddService(service)}
                          className="text-green-500 hover:text-green-700 p-1 rounded-full bg-white hover:bg-green-100 transition-colors"
                          title="Añadir servicio"
                        >
                          <FaPlusCircle size={20} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="text-center mt-6">
                <button
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className={`px-8 py-3 rounded-lg text-lg font-semibold transition-colors duration-200
                    ${saving
                      ? 'bg-blue-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                    }`}
                >
                  {saving ? (
                    <>
                      <FaSpinner className="animate-spin inline-block mr-2" /> Guardando...
                    </>
                  ) : (
                    'Guardar Cambios de Servicios'
                  )}
                </button>
                {saveStatusMessage && (
                  <p className={`mt-2 flex items-center justify-center font-medium ${isErrorSaveStatus ? 'text-red-600' : 'text-green-600'}`}>
                    {isErrorSaveStatus ? <FaExclamationTriangle className="mr-2" /> : <FaCheckCircle className="mr-2" />}
                    {saveStatusMessage}
                  </p>
                )}
              </div>
            </>
          ) : !showAddMascotaForm && (
            <p className="text-center text-gray-700 text-lg py-10">Selecciona una mascota para gestionar sus servicios o agrega una nueva.</p>
          )}
        </div>

        <div className="flex justify-end p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
      {/* Modal de confirmación para eliminar mascota */}
      {showDeleteConfirm && mascotaToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Confirmar eliminación</h3>
              <p className="text-gray-700 mb-6">
                ¿Estás seguro de que quieres eliminar a <span className="font-semibold">{mascotaToDelete.nombre}</span> de esta cita?
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setMascotaToDelete(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteMascota}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                >
                  {deletingMascota === mascotaToDelete.id ? (
                    <FaSpinner className="animate-spin mr-2" />
                  ) : (
                    <FaTimesCircle className="mr-2" />
                  )}
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    
  );
}