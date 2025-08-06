// app/admin/consultas/ConsultasManager.tsx
"use client";

import { useState, useEffect } from 'react';
import { getCitas, deleteCita, Cita, getRegionesComunas } from './actions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FaPaw, FaDog, FaCat, FaTimesCircle, FaSpinner, FaEdit, FaCheck, FaWhatsapp } from 'react-icons/fa';
import ManageAppointmentModal from './ManageAppointmentModal';
import ConfirmModal from './ConfirmModal'; // Modal para eliminar
import FinalizeConfirmModal from './FinalizeConfirmModal'; // Modal para finalizar
import { finalizeAppointment } from './actions'; // Asegúrate de que esta ruta sea correcta para la acción de finalizar

// NUEVOS ESTADOS PARA FILTROS DE REGION/COMUNA
interface RegionFilter { // Interfaz para las regiones que cargaremos
  id: string;
  nombre: string;
}
interface ComunaFilter { // Interfaz para las comunas que cargaremos
  id: string;
  nombre: string;
  regionId: string; // Para agruparlas por región
}

export default function ConsultasManager() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [finalizingId, setFinalizingId] = useState<string | null>(null);

  //filtros de región y comuna
  const [regions, setRegions] = useState<RegionFilter[]>([]); // Lista de regiones disponibles para el filtro
  const [selectedRegionId, setSelectedRegionId] = useState<string>(''); // ID de la región seleccionada
  const [comunas, setComunas] = useState<ComunaFilter[]>([]); // Lista de comunas disponibles para el filtro (según la región)
  const [selectedComunaId, setSelectedComunaId] = useState<string>(''); // ID de la comuna seleccionada


  // Estados para el modal de gestión de citas
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedCitaId, setSelectedCitaId] = useState<string | null>(null);

  // Estados para el modal de confirmación de ELIMINACIÓN
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [citaToDeleteId, setCitaToDeleteId] = useState<string | null>(null);

  // Estados para el modal de confirmación de FINALIZACIÓN
  const [isFinalizeConfirmModalOpen, setIsFinalizeConfirmModalModalOpen] = useState(false);
  const [citaToFinalizeId, setCitaToFinalizeId] = useState<string | null>(null);

  // Estado para el filtro de citas (true = finalizadas, false = pendientes)
  const [showFinalized, setShowFinalized] = useState(false);

useEffect(() => {
  fetchCitas();
}, [selectedRegionId, selectedComunaId, showFinalized]);
  // NUEVOS EFECTOS PARA CARGAR REGIONES Y COMUNAS
useEffect(() => {
  const loadFilterOptions = async () => {
    // Asume que tienes una acción de servidor getRegionesComunas en './actions.ts'
    // que carga ambas.
    const result = await getRegionesComunas(); // La definiremos en actions.ts
    if (result.regiones) {
      setRegions(result.regiones);
    }
  };
  loadFilterOptions();
}, []); // Se ejecuta una vez al montar

useEffect(() => {
  const loadComunasForRegion = async () => {
    if (selectedRegionId) {
      const result = await getRegionesComunas(selectedRegionId); // Pasa la ID de la región
      if (result.comunas) {
        setComunas(result.comunas);
        setSelectedComunaId(''); // Resetear comuna seleccionada al cambiar la región
      }
    } else {
      setComunas([]); // Limpiar comunas si no hay región seleccionada
      setSelectedComunaId(''); // Limpiar comuna seleccionada
    }
  };
  loadComunasForRegion();
}, [selectedRegionId]); // Se ejecuta cuando la región seleccionada cambia

const fetchCitas = async () => {
  setLoading(true);
  setError(null);
  // Pasa los filtros a getCitas. Si no hay nada seleccionado, pasarán como strings vacíos.
  const result = await getCitas(selectedRegionId, selectedComunaId); // <--- CAMBIO AQUÍ
  if (result.citas) {
    setCitas(result.citas);
  } else if (result.error) {
    setError(result.error);
  }
  setLoading(false);
};

  // --- Funciones para el modal de confirmación de ELIMINACIÓN ---
  const handleOpenConfirmDeleteModal = (id: string) => {
    setCitaToDeleteId(id);
    setIsConfirmDeleteModalOpen(true);
  };

  const handleCloseConfirmDeleteModal = () => {
    setIsConfirmDeleteModalOpen(false);
    setCitaToDeleteId(null);
  };

  const handleConfirmDeleteCita = async () => {
    if (!citaToDeleteId) return;

    handleCloseConfirmDeleteModal();
    setDeletingId(citaToDeleteId);

    const result = await deleteCita(citaToDeleteId);
    if (result.success) {
      fetchCitas(); // Recarga las citas para ver el cambio
    } else if (result.error) {
      setError(result.error);
    }
    setDeletingId(null);
    setCitaToDeleteId(null);
  };

  // --- Funciones para el modal de gestión de citas (Editar) ---
  const handleOpenManageModal = (cita: Cita) => {
    setSelectedCitaId(cita.id);
    setIsManageModalOpen(true);
  };

  const handleCloseManageModal = () => {
    setIsManageModalOpen(false);
    setSelectedCitaId(null);
  };

  const handleServicesUpdated = () => {
    fetchCitas();
  };

  // --- Funciones para el modal de confirmación de FINALIZACIÓN ---
  const handleOpenFinalizeConfirmModal = (cita: Cita) => {
    setCitaToFinalizeId(cita.id);
    setIsFinalizeConfirmModalModalOpen(true);
  };

  const handleCloseFinalizeConfirmModal = () => {
    setIsFinalizeConfirmModalModalOpen(false);
    setCitaToFinalizeId(null);
  };

  const handleConfirmFinalizeCita = async () => {
    if (!citaToFinalizeId) return;

    setFinalizingId(citaToFinalizeId);
    setError(null);

    try {
      const result = await finalizeAppointment(citaToFinalizeId);

      if (result.success) {
        // Actualizamos el estado local para reflejar que la cita está finalizada
        setCitas(prev => prev.map(c => 
            c.id === citaToFinalizeId ? { ...c, finalizada: true, montoTotal: result.data?.totalAmount || 0 } : c
        ));

        // Obtén los datos para el mensaje de WhatsApp
        // currentCitaToFinalize debe estar disponible ya que se usa para abrir el modal
        const currentCita = citas.find(c => c.id === citaToFinalizeId);
        if (!currentCita) throw new Error("Cita no encontrada para finalizar.");

        const { totalAmount, ownerName, vetName, servicios, precioBase, precioComuna } = result.data!;
        const ownerPhone = currentCita.datosDueno.telefono; 

        if (!ownerPhone) {
          throw new Error("No se encontró el número de teléfono del dueño para enviar WhatsApp.");
        }

        // Formato de fecha para el mensaje de WhatsApp (usando la fecha ya formateada en la cita)
        const formattedCitaDate = currentCita.locationData.fecha && format(new Date(currentCita.locationData.fecha), "dd MMMM 'de 'yyyy", { locale: es });

     const message = encodeURIComponent(
          `¡Hola ${ownerName}! 👋\n` +
          `Tu cita con el/la Dr(a). ${vetName} el día ${formattedCitaDate} a las ${currentCita.locationData.hora} ha finalizado.\n\n` +
          `Servicios realizados:\n` +
          `${servicios}\n` +
          `Visita a domicilio: $${precioBase.toLocaleString('es-CL')}\n` +
          `Recargo por Comuna: $${precioComuna.toLocaleString('es-CL')}\n` +
          `El monto total de los servicios es: $${totalAmount.toLocaleString('es-CL')}\n\n` +
          `¡Gracias por confiar en nuestros servicios! 😊 \n`+
          `Datos para el pago:\n` +
          `Nombre:  FRANCISCO JAVIER FUENTES \n`+
          `RUT:  15.853.418-5 \n`+
          `Banco:  Scotiabank \n`+
          `Tipo Cuenta:  Cuenta Corriente \n`+
          `Número Cuenta:  960081184 \n`+
          `Correo:  FRANCISCOFUENTESNUTRICION@GMAIL.COM ` 
        );
        
        // Limpiar y formatear número de teléfono para WhatsApp (ej. para Chile +569)
        const cleanedPhone = ownerPhone.replace(/[\s\-\(\)]/g, '');
        const whatsappNumber = cleanedPhone.startsWith('+') ? cleanedPhone : `+56${cleanedPhone}`; // Asumiendo +569 para Chile

        window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');

      } else {
        setError(result.error || 'Error desconocido al finalizar la cita.');
      }
    } catch (err) {
      console.error("Error finalizing appointment:", err);
      setError((err as Error).message || 'Ocurrió un error inesperado al finalizar la cita.');
    } finally {
      setFinalizingId(null);
      handleCloseFinalizeConfirmModal();
    }
  };

  // Helper para abrir WhatsApp para el dueño (botón de prueba en la lista)
  const handleTestWhatsapp = (phoneNumber: string, ownerName: string) => {
    const testMessage = encodeURIComponent(`¡Hola ${ownerName}! Este es un mensaje de prueba de WhatsApp.`);
    const cleanedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    const whatsappNumber = cleanedPhone.startsWith('+') ? cleanedPhone : `+56${cleanedPhone}`;
    window.open(`https://wa.me/${whatsappNumber}?text=${testMessage}`, '_blank');
  };

  // Calcular la cita seleccionada para el modal de gestión y finalización
  const currentSelectedCita = selectedCitaId
    ? citas.find(c => c.id === selectedCitaId)
    : null;

  // Calcular la cita para el modal de finalización (cuando se abre)
  const currentCitaToFinalize = citaToFinalizeId
    ? citas.find(c => c.id === citaToFinalizeId)
    : null;

  // Lógica de filtrado de citas a mostrar
  const filteredCitas = citas.filter(cita => cita.finalizada === showFinalized);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <FaSpinner className="animate-spin text-indigo-600 text-4xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error:</strong>
        <span className="block sm:inline"> {error}</span>
        <button
          onClick={fetchCitas}
          className="ml-4 px-3 py-1 bg-red-700 text-white rounded hover:bg-red-800"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-3xl font-extrabold text-indigo-800 mb-8 text-center">Consultas Agendadas</h2>

<div className="mb-8 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
  <h3 className="text-xl font-semibold text-gray-800 mb-4">Filtrar Citas</h3>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {/* Selector de Región */}
    <div className='text-black'>
      <label htmlFor="filterRegion" className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Región</label>
      <select
        id="filterRegion"
        className="w-full px-3 py-2 border text-black border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        value={selectedRegionId}
        onChange={(e) => {
          setSelectedRegionId(e.target.value);
          setSelectedComunaId(''); // Resetear comuna al cambiar región
        }}
      >
        <option value="">Todas las Regiones</option>
        {regions.map(region => (
          <option key={region.id} value={region.id}>{region.nombre}</option>
        ))}
      </select>
    </div>

    {/* Selector de Comuna */}
    <div>
      <label htmlFor="filterComuna" className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Comuna</label>
      <select
        id="filterComuna"
        className="w-full px-3 py-2 border text-black border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        value={selectedComunaId}
        onChange={(e) => setSelectedComunaId(e.target.value)}
        disabled={!selectedRegionId || comunas.length === 0}
      >
        <option value="">Todas las Comunas</option>
        {comunas.map(comuna => (
          <option key={comuna.id} value={comuna.id}>{comuna.nombre}</option>
        ))}
      </select>
    </div>

    {/* Toggle de Citas Finalizadas/Pendientes */}
    <div className="flex items-end justify-end md:justify-start"> {/* Alinea al final o inicio en md */}
      <label htmlFor="toggleFinalized" className="flex items-center cursor-pointer">
        <span className="mr-3 text-lg font-medium text-gray-900">
          {showFinalized ? 'Citas Finalizadas' : 'Citas Pendientes'}
        </span>
        <div className="relative">
          <input 
            type="checkbox" 
            id="toggleFinalized" 
            className="sr-only" 
            checked={showFinalized}
            onChange={() => setShowFinalized(!showFinalized)}
          />
          <div className="block bg-gray-600 w-14 h-8 rounded-full"></div>
          <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${showFinalized ? 'transform translate-x-full bg-green-500' : ''}`}></div>
        </div>
      </label>
    </div>
  </div>
</div>

      {filteredCitas.length === 0 ? (
        <p className="text-center text-gray-600 text-lg">
          No hay citas {showFinalized ? 'finalizadas' : 'pendientes'} disponibles.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCitas.map((cita) => (
            <div key={cita.id} className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Cita con {cita.datosDueno.nombre}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  <span className="font-medium">Agendada el: </span>
                  {cita.fechaCreacion && format(new Date(cita.fechaCreacion), "dd MMMM 'de 'yyyy HH:mm", { locale: es })}
                </p>

                <div className="mb-4 space-y-1">
                  <p className="text-gray-700">
                    <span className="font-medium">Fecha:</span>
                    {cita.locationData.fecha && format(new Date(cita.locationData.fecha), "dd MMMM 'de 'yyyy", { locale: es })}
                  </p>
                  <p className="text-gray-700"><span className="font-medium">Hora:</span> {cita.locationData.hora}</p>
                  <p className="text-gray-700"><span className="font-medium">Comuna:</span> {cita.datosDueno.direccion.comuna}</p>
                  <p className="text-gray-700"><span className="font-medium">Dirección:</span> {cita.datosDueno.direccion.calle} {cita.datosDueno.direccion.numero}</p>
                  {cita.datosDueno.estacionamiento && typeof cita.datosDueno.estacionamiento === 'string' && cita.datosDueno.estacionamiento.trim() !== '' && (
                    <p className="text-gray-700 flex items-center text-md"> {/* Ajusta el estilo si 'Sí' era verde */}
                      <span className="font-medium">Estacionamiento: </span>{' '}
                      {cita.datosDueno.estacionamiento} {/* Muestra el texto directamente */}
                    </p>
                  )}
                </div>

                <div className="bg-gray-50 p-3 rounded-md mb-4 border border-gray-100">
                  <p className="text-lg font-bold text-indigo-700 mb-2">Datos del Tutor:</p>
                  <p className="text-gray-700">Nombre: {cita.datosDueno.nombre}</p>
                  <p className="text-gray-700">Email: {cita.datosDueno.email}</p>
                  <p className="text-gray-700">Teléfono: {cita.datosDueno.telefono}
                    <button 
                        onClick={() => handleTestWhatsapp(cita.datosDueno.telefono, cita.datosDueno.nombre)}
                        className="ml-2 p-1 rounded-full bg-green-500 text-white hover:bg-green-600"
                        title="Enviar WhatsApp de prueba"
                      >
                        <FaWhatsapp size={16} />
                      </button>
                  </p>
                  <p className="text-gray-700">RUT: {cita.datosDueno.rut}</p>
                </div>

                {cita.mascotas && cita.mascotas.length > 0 && (
                  <div className="mb-4">
                    <p className="text-lg font-bold text-indigo-700 mb-2">Mascotas:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {cita.mascotas.map((mascota, index) => (
                        <li key={index} className="text-gray-700 flex items-center flex-wrap">
                          {mascota.tipo === 'perro' ? <FaDog className="mr-2 text-yellow-600" /> : <FaCat className="mr-2 text-pink-500" />}
                          {mascota.nombre} ({mascota.tipo})
                          {mascota.info_adicional && <span className="ml-2 text-sm text-gray-500">Info Adicional: ({mascota.info_adicional})</span>}

                    {mascota.servicios && mascota.servicios.length >= 0 && (
                            <div className="ml-6 mt-2 w-full border-l pl-4 border-gray-200">
                              <p className="text-md font-semibold text-gray-800 mb-1">Servicios para {mascota.nombre}:</p>
                              <ul className="list-disc list-inside text-sm space-y-1">
                               
                                   { cita.precio_base_vet!==undefined && cita.precio_base !== undefined && (
                                     <li key="pv1" className="text-gray-600 flex items-center justify-between">
                                           <span className='flex flex-row items-center'>
                                           <FaPaw className="mr-2 text-teal-500 text-xs"/>
                                           Consulta a domicilio ${cita.precio_base.toLocaleString('es-CL')}
                                           </span>
                                         <span className="ml-2 text-xs text-gray-500 text-right">
                                        Pago veterinario: ${cita.precio_base_vet.toLocaleString('es-CL')}
                                         </span>

                                     </li>
                                   )}

                                {mascota.servicios.map((servicio, svcIndex) => (
                                  <li key={svcIndex} className="text-gray-600 flex items-center justify-between">
                                    <span className='flex flex-row items-center'><FaPaw className="mr-2 text-teal-500 text-xs" />
                                    {servicio.nombre} (${servicio.precio.toLocaleString('es-CL')})
                                    </span>
                                    {servicio.precio_vet && (
                                      <span className="ml-2 text-xs text-gray-500 text-right">Pago Veterinario: ${servicio.precio_vet.toLocaleString('es-CL')}</span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                      {/*NUEVA SECCION PAGO VETERINARIO*/}
                    {cita.precio_base_vet !== undefined && cita.pago_vet !== undefined && (
                      <div className="p-4 rounded-md bg-blue-vet-light border border-blue-vet mb-4">
                        <p className="text-base font-semibold bt-2 text-gray-700 flex justify-between items-center">
                          <span>Pago Veterinario:</span>
                       <span className="text-gray-900">
                         ${(Number(cita.pago_vet) + Number(cita.precio_base_vet)).toLocaleString('es-CL')}
                       </span>
                        </p>
                      </div>
                    )}
                   {/* NUEVO: Sección para mostrar el Recargo por Comuna */}
                {cita.locationData?.costoAdicionalComuna !== null && cita.locationData?.costoAdicionalComuna !== undefined && cita.locationData.costoAdicionalComuna > 0 && (
                  <div className="p-4 rounded-md bg-gray-50 border border-gray-200 mb-4"> {/* Ajusta el estilo según tu diseño */}
                    <p className="text-base font-semibold text-gray-700 flex justify-between items-center">
                      <span>Recargo por Comuna:</span>
                      <span className="text-gray-900">${cita.locationData.costoAdicionalComuna.toLocaleString('es-CL')}</span>
                    </p>
                  </div>
                )}

                {/* NUEVA SECCIÓN PARA EL MONTO TOTAL */}
                { cita.montoTotal !== undefined && (
                  <div className="bg-indigo-50 p-4 rounded-md border-t border-b border-indigo-200 mt-4">
                    <p className="text-xl font-extrabold text-indigo-800 flex items-center justify-between">
                      <span>Total Atencion:</span>
                      <span className="text-green-700 text-2xl">${cita.montoTotal.toLocaleString('es-CL')}</span>
                    </p>
                  </div>
                )}
                {/* FIN DE LA NUEVA SECCIÓN */}
                
              </div>
              <div className="bg-gray-100 flex-col px-6 py-4 border-t border-gray-200 flex justify-between gap-3">
                <button
                  onClick={() => handleOpenManageModal(cita)}
                  className="flex-1 flex items-center justify-center py-2 px-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FaEdit className="mr-2" /> Gestionar Cita
                </button>

                {/* El botón de finalizar/ver se mostrará solo si la cita NO está finalizada en la vista actual */}
                {!showFinalized && ( 
                  <button
                    onClick={() => handleOpenFinalizeConfirmModal(cita)}
                    disabled={finalizingId === cita.id}
                    className={`flex-1 flex items-center justify-center py-2 px-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                      ${finalizingId === cita.id ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'}`}
                  >
                    {finalizingId === cita.id ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" /> Finalizando...
                      </>
                    ) : (
                      <>
                        <FaCheck className="mr-2" /> Finalizar Cita
                      </>
                    )}
                  </button>
                )}
                
                {/* El botón de eliminar se mostrará para ambas vistas */}
                <button
                  onClick={() => handleOpenConfirmDeleteModal(cita.id)}
                  disabled={deletingId === cita.id}
                  className={`flex-1 flex items-center justify-center py-2 px-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    deletingId === cita.id ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                  }`}
                >
                  {deletingId === cita.id ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" /> Eliminando...
                    </>
                  ) : (
                    <>
                      <FaTimesCircle className="mr-2" /> Eliminar Cita
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Renderizar el modal de gestión de citas */}
      {isManageModalOpen && currentSelectedCita && (
        <ManageAppointmentModal
          isOpen={isManageModalOpen}
          onClose={handleCloseManageModal}
          cita={currentSelectedCita}
          onServicesUpdated={handleServicesUpdated}
        />
      )}

      {/* Renderizar el modal de confirmación de ELIMINACIÓN */}
      {isConfirmDeleteModalOpen && (
        <ConfirmModal
          isOpen={isConfirmDeleteModalOpen}
          onClose={handleCloseConfirmDeleteModal}
          onConfirm={handleConfirmDeleteCita}
          message="¿Estás seguro de que quieres eliminar esta cita? Esta acción no se puede deshacer."
          title="Confirmar Eliminación"
          confirmText="Sí, Eliminar"
          cancelText="No, Cancelar"
        />
      )}

      {/* Renderizar el modal de confirmación de FINALIZACIÓN */}
      {isFinalizeConfirmModalOpen && currentCitaToFinalize && (
        <FinalizeConfirmModal
          isOpen={isFinalizeConfirmModalOpen}
          onClose={handleCloseFinalizeConfirmModal}
          onConfirm={handleConfirmFinalizeCita}
          isProcessing={finalizingId === currentCitaToFinalize.id}
          cita={currentCitaToFinalize}
        />
      )}
    </div>
  );
}