// app/adminHorarios/SuperAdminMassScheduleManager.tsx
"use client";

import { useState, useEffect, ChangeEvent, useRef } from 'react';
import {
  getRegionesComunas,
  generateMassScheduleForUser,
  getGeneratedSchedules,
  updateScheduleAvailability,
  updateScheduleComunaValues,
  getVeterinariansForAdmin, // ¡NUEVA IMPORTACIÓN!
  HoraDisponible,
  ComunaConValor
} from './actions';
import { FaEdit, FaLock, FaUnlock, FaTimes, FaSpinner } from 'react-icons/fa'; // FaSpinner para carga

interface Region {
  id: string;
  nombre: string;
}

interface Comuna {
  id: string;
  nombre: string;
  regionId: string;
}

interface ComunaValorUI {
  id: string;
  nombre: string;
  valor: number | ''; // Permite un string vacío para el input
}

interface VeterinarianListItem { // Interfaz para los veterinarios en el selector
  id: string;
  nombre: string;
  role?: string;
}

const SuperAdminMassScheduleManager = () => {
  const [regiones, setRegiones] = useState<Region[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState('');
  const [comunas, setComunas] = useState<Comuna[]>([]);
  
  const [selectedComunasWithValues, setSelectedComunasWithValues] = useState<ComunaValorUI[]>([]); 

  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [message, setMessage] = useState<{text: string; type: 'success' | 'error' | 'info'} | null>(null);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  const [generatedSchedules, setGeneratedSchedules] = useState<HoraDisponible[]>([]);
  
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
  
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<Set<string>>(new Set());

  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  // ESTADOS ESPECÍFICOS PARA SUPERADMIN
  const [veterinarians, setVeterinarians] = useState<VeterinarianListItem[]>([]);
  const [selectedVeterinarioId, setSelectedVeterinarioId] = useState(''); // ID del veterinario seleccionado
  const [loadingVets, setLoadingVets] = useState(true);

  // ESTADOS PARA EL MODAL DE EDICIÓN DE VALORES DE COMUNA
  const [showEditComunaValuesModal, setShowEditComunaValuesModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<HoraDisponible | null>(null);
  const [modalComunaValues, setModalComunaValues] = useState<ComunaValorUI[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);


  // --- Efecto para la fecha y hora actual ---
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60 * 1000); // Actualiza cada minuto
    return () => clearInterval(intervalId);
  }, []);

  // --- Efecto para cargar regiones, comunas y la lista de veterinarios al inicio ---
  useEffect(() => {
    const fetchData = async () => {
      // Cargar regiones y comunas
      const geoData = await getRegionesComunas();
      if (geoData?.regiones) {
        setRegiones(geoData.regiones);
      }
      if (geoData?.error) {
        setMessage({ text: geoData.error, type: 'error' });
      }

      // Cargar veterinarios para el selector
      setLoadingVets(true);
      const vetsData = await getVeterinariansForAdmin();
      if (vetsData?.vets) {
        setVeterinarians(vetsData.vets);
      }
      if (vetsData?.error) {
        setMessage({ text: vetsData.error, type: 'error' });
      }
      setLoadingVets(false);
    };
    fetchData();
  }, []);

  // --- Efecto para actualizar comunas al cambiar la región seleccionada ---
  useEffect(() => {
    const updateComunas = async () => {
      if (selectedRegionId) {
        const data = await getRegionesComunas(selectedRegionId);
        if (data?.comunas) {
          setComunas(data.comunas);
          setSelectedComunasWithValues([]); // Limpiar comunas seleccionadas con valores al cambiar la región
          setGeneratedSchedules([]); // Limpiar horarios si la región cambia
          setStartDate(''); setEndDate(''); // Limpiar fechas si la región cambia
          setSelectedScheduleIds(new Set());
        } else if (data?.error) {
          setMessage({ text: data.error, type: 'error' });
        }
      } else {
        setComunas([]);
        setSelectedComunasWithValues([]); // Limpiar comunas seleccionadas con valores si no hay región
        setGeneratedSchedules([]); // Limpiar horarios si no hay región
        setStartDate(''); setEndDate(''); // Limpiar fechas si no hay región
        setSelectedScheduleIds(new Set());
      }
    };
    updateComunas();
  }, [selectedRegionId]);

  // --- Función para manejar la selección/deselección de comunas (botones/chips) ---
  const handleComunaToggle = (comuna: Comuna) => {
    setSelectedComunasWithValues(prevSelected => {
      const isSelected = prevSelected.some(s => s.id === comuna.id);
      if (isSelected) {
        return prevSelected.filter(s => s.id !== comuna.id);
      } else {
        return [...prevSelected, { id: comuna.id, nombre: comuna.nombre, valor: '' }];
      }
    });
  };

  // --- Función para manejar el cambio en los inputs de valor_comuna en la sección de generación ---
  const handleValorComunaChange = (comunaId: string, newValue: string) => {
    setSelectedComunasWithValues(prev =>
      prev.map(comuna =>
        comuna.id === comunaId
          ? { ...comuna, valor: newValue === '' ? '' : parseFloat(newValue) }
          : comuna
      )
    );
  };

  // --- Función para cargar horarios (fetchSchedules) ---
  const fetchSchedules = async () => {
    // Si no hay vet seleccionado, o no hay comunas seleccionadas, o no hay rango de fechas, no cargar.
    if (!selectedVeterinarioId || selectedComunasWithValues.length === 0 || !startDate || !endDate) {
      setGeneratedSchedules([]);
      setSelectedScheduleIds(new Set());
      setMessage(null);
      setLoadingSchedules(false);
      return;
    }

    setLoadingSchedules(true);
    setMessage(null);

    try {
      const partsStart = startDate.split('-');
      const start = new Date(
        parseInt(partsStart[0]),
        parseInt(partsStart[1]) - 1,
        parseInt(partsStart[2]),
        0, 0, 0, 0
      );

      const partsEnd = endDate.split('-');
      const end = new Date(
        parseInt(partsEnd[0]),
        parseInt(partsEnd[1]) - 1,
        parseInt(partsEnd[2]),
        23, 59, 59, 999
      );

      const comunaIdsForFetch = selectedComunasWithValues.map(sc => sc.id);
      // Pasa el veterinarioId seleccionado a la acción
      const schedules = await getGeneratedSchedules(comunaIdsForFetch, start, end, selectedVeterinarioId);
      setGeneratedSchedules(schedules);
      setCurrentPage(1);
      setSelectedScheduleIds(new Set());

      if (schedules.length === 0) {
        setMessage({ text: 'No se encontraron horarios para los criterios seleccionados.', type: 'info' });
      }

    } catch (error) {
      console.error("Error al cargar horarios:", error);
      setMessage({ text: 'Error al cargar horarios. Por favor, intente nuevamente.', type: 'error' });
    } finally {
      setLoadingSchedules(false);
    }
  };

  // --- Efecto para recargar horarios al cambiar la selección de comunas, fechas o VETERINARIO ---
  useEffect(() => {
    fetchSchedules();
  }, [selectedComunasWithValues, startDate, endDate, selectedVeterinarioId]); // ¡selectedVeterinarioId añadido aquí!


  // --- Función para generar horarios masivos ---
  const handleGenerateSchedule = async () => {
    setLoadingGenerate(true);
    setMessage(null);

    if (!selectedVeterinarioId) {
      setMessage({ text: 'Por favor, selecciona un veterinario para generar horarios.', type: 'error' });
      setLoadingGenerate(false);
      return;
    }
    if (selectedComunasWithValues.length === 0) {
      setMessage({ text: 'Por favor, selecciona al menos una comuna para generar horarios.', type: 'error' });
      setLoadingGenerate(false);
      return;
    }
    if (!startDate || !endDate) {
      setMessage({ text: 'Por favor, selecciona una fecha de inicio y una fecha de fin para generar horarios.', type: 'error' });
      setLoadingGenerate(false);
      return;
    }

    const partsStart = startDate.split('-');
    const localStartDate = new Date(
      parseInt(partsStart[0]),
      parseInt(partsStart[1]) - 1,
      parseInt(partsStart[2]),
      0, 0, 0, 0
    );

    const partsEnd = endDate.split('-');
    const localEndDate = new Date(
      parseInt(partsEnd[0]),
      parseInt(partsEnd[1]) - 1,
      parseInt(partsEnd[2]),
      23, 59, 59, 999
    );

    if (localStartDate > localEndDate) {
        setMessage({ text: 'La fecha de inicio no puede ser posterior a la fecha de fin.', type: 'error' });
        setLoadingGenerate(false);
        return;
    }

    const hasInvalidValor = selectedComunasWithValues.some(sc => {
      if (sc.valor === '') {
        return false;
      }
      const numValue = Number(sc.valor);
      return isNaN(numValue) || numValue < 0;
    });

    if (hasInvalidValor) {
      setMessage({ text: 'Por favor, ingresa un valor numérico válido (mayor o igual a cero) para cada comuna seleccionada.', type: 'error' });
      setLoadingGenerate(false);
      return;
    }

    try {
      const comunasToSend: ComunaConValor[] = selectedComunasWithValues.map(sc => ({
        id: sc.id,
        nombre: sc.nombre,
        valor: Number(sc.valor === '' ? 0 : sc.valor)
      }));

      // Pasa el ID del veterinario seleccionado a la acción de generación
      const result = await generateMassScheduleForUser(selectedVeterinarioId, comunasToSend, startDate, endDate);
      if (result?.error) {
        setMessage({ text: result.error, type: 'error' });
      } else if (result?.success) {
        setMessage({ text: result.message || 'Horarios generados exitosamente.', type: 'success' });
        fetchSchedules(); // Vuelve a cargar los horarios después de generar
      }
    } catch (error) {
      console.error("Error generating schedules:", error);
      setMessage({ text: 'Error al generar horarios. Por favor, intente nuevamente.', type: 'error' });
    } finally {
      setLoadingGenerate(false);
    }
  };

  // --- Funciones de utilidad y manejo de tabla/paginación ---
  const isScheduleExpired = (schedule: HoraDisponible): boolean => {
    const dateParts = schedule.fecha.split('-');
    const timeParts = schedule.hora.split(':');

    const scheduleDate = new Date(
      parseInt(dateParts[0]),
      parseInt(dateParts[1]) - 1,
      parseInt(dateParts[2]),
      parseInt(timeParts[0]),
      parseInt(timeParts[1]),
      0, 0
    );
    return scheduleDate < currentDateTime;
  };

  const handleBlockSchedule = async (scheduleId: string) => {
    setMessage(null);
    const originalSchedule = generatedSchedules.find(s => s.id === scheduleId);
    if (!originalSchedule) {
        setMessage({ text: 'Horario no encontrado para bloquear.', type: 'error' });
        return;
    }

    const schedulesMatchingTimeSlot = generatedSchedules.filter(s =>
      s.veterinario.id === originalSchedule.veterinario.id &&
      s.fecha === originalSchedule.fecha &&
      s.hora === originalSchedule.hora
    );

    setGeneratedSchedules(prevSchedules =>
      prevSchedules.map(schedule =>
        schedulesMatchingTimeSlot.some(s => s.id === schedule.id)
          ? { ...schedule, disponible: false }
          : schedule
      )
    );
    setMessage({ text: 'Bloqueando horario(s)...', type: 'info' });

    try {
      const result = await updateScheduleAvailability(scheduleId, false);
      if (result?.success) {
        setMessage({ text: 'Horario(s) bloqueado(s) exitosamente.', type: 'success' });
        fetchSchedules();
      } else if (result?.error) {
        setGeneratedSchedules(prevSchedules =>
          prevSchedules.map(schedule =>
            schedulesMatchingTimeSlot.some(s => s.id === schedule.id)
              ? { ...schedule, disponible: originalSchedule.disponible }
              : schedule
          )
        );
        setMessage({ text: result.error, type: 'error' });
      }
    } catch (error) {
      console.error('Error al bloquear horario:', error);
      setGeneratedSchedules(prevSchedules =>
        prevSchedules.map(schedule =>
          schedulesMatchingTimeSlot.some(s => s.id === schedule.id)
            ? { ...schedule, disponible: originalSchedule.disponible }
            : schedule
        )
      );
      setMessage({ text: 'Error al bloquear el horario. Intente nuevamente.', type: 'error' });
    }
  };

  const handleUnblockSchedule = async (scheduleId: string) => {
    setMessage(null);
    const originalSchedule = generatedSchedules.find(s => s.id === scheduleId);
    if (!originalSchedule) {
        setMessage({ text: 'Horario no encontrado para desbloquear.', type: 'error' });
        return;
    }

    const schedulesMatchingTimeSlot = generatedSchedules.filter(s =>
      s.veterinario.id === originalSchedule.veterinario.id &&
      s.fecha === originalSchedule.fecha &&
      s.hora === originalSchedule.hora
    );

    setGeneratedSchedules(prevSchedules =>
      prevSchedules.map(schedule =>
        schedulesMatchingTimeSlot.some(s => s.id === schedule.id)
          ? { ...schedule, disponible: true }
          : schedule
      )
    );
    setMessage({ text: 'Desbloqueando horario(s)...', type: 'info' });

    try {
      const result = await updateScheduleAvailability(scheduleId, true);
      if (result?.success) {
        setMessage({ text: 'Horario(s) desbloqueado(s) exitosamente.', type: 'success' });
        fetchSchedules();
      } else if (result?.error) {
        setGeneratedSchedules(prevSchedules =>
          prevSchedules.map(schedule =>
            schedulesMatchingTimeSlot.some(s => s.id === schedule.id)
              ? { ...schedule, disponible: originalSchedule.disponible }
              : schedule
          )
        );
        setMessage({ text: result.error, type: 'error' });
      }
    } catch (error) {
      console.error('Error al desbloquear horario:', error);
      setGeneratedSchedules(prevSchedules =>
        prevSchedules.map(schedule =>
          schedulesMatchingTimeSlot.some(s => s.id === schedule.id)
            ? { ...schedule, disponible: originalSchedule.disponible }
            : schedule
        )
      );
      setMessage({ text: 'Error al desbloquear el horario. Intente nuevamente.', type: 'error' });
    }
  };

  const totalPages = Math.ceil(generatedSchedules.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSchedules = generatedSchedules.slice(startIndex, endIndex);

  const selectableSchedules = currentSchedules.filter(schedule => !isScheduleExpired(schedule));

  const isAllSelected = selectableSchedules.length > 0 && selectableSchedules.every(schedule => selectedScheduleIds.has(schedule.id));
  const isIndeterminate = selectableSchedules.some(schedule => selectedScheduleIds.has(schedule.id)) && !isAllSelected;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  const handleSelectAll = (event: ChangeEvent<HTMLInputElement>) => {
    const newSelectedIds = new Set(selectedScheduleIds);
    if (event.target.checked) {
      selectableSchedules.forEach(schedule => newSelectedIds.add(schedule.id));
    } else {
      selectableSchedules.forEach(schedule => newSelectedIds.delete(schedule.id));
    }
    setSelectedScheduleIds(newSelectedIds);
  };

  const handleSelectSchedule = (scheduleId: string, isChecked: boolean) => {
    const newSelectedIds = new Set(selectedScheduleIds);
    if (isChecked) {
      newSelectedIds.add(scheduleId);
    } else {
      newSelectedIds.delete(scheduleId);
    }
    setSelectedScheduleIds(newSelectedIds);
  };

  const handleBulkBlock = async () => {
    if (selectedScheduleIds.size === 0) {
      setMessage({ text: 'No hay horarios seleccionados para bloquear.', type: 'info' });
      return;
    }

    setMessage({ text: `Bloqueando ${selectedScheduleIds.size} horarios seleccionados...`, type: 'info' });

    const schedulesToBlock = generatedSchedules.filter(s => selectedScheduleIds.has(s.id));

    const uniqueTimeSlots = new Map<string, HoraDisponible>();
    schedulesToBlock.forEach(schedule => {
      const key = `${schedule.veterinario.id}-${schedule.fecha}-${schedule.hora}`;
      if (!uniqueTimeSlots.has(key)) {
        uniqueTimeSlots.set(key, schedule);
      }
    });

    setGeneratedSchedules(prevSchedules => {
      return prevSchedules.map(schedule => {
        const key = `${schedule.veterinario.id}-${schedule.fecha}-${schedule.hora}`;
        if (uniqueTimeSlots.has(key)) {
          return { ...schedule, disponible: false };
        }
        return schedule;
      });
    });

    const results = await Promise.all(
      Array.from(uniqueTimeSlots.values()).map(schedule =>
        updateScheduleAvailability(schedule.id, false)
      )
    );

    const successfulUpdates = results.filter(r => r?.success).length;
    const failedUpdates = results.filter(r => r?.error).length;

    if (successfulUpdates > 0) {
      setMessage({ text: `Se bloquearon ${successfulUpdates} franja(s) horaria(s) exitosamente.`, type: 'success' });
      setSelectedScheduleIds(new Set());
      fetchSchedules();
    }
    if (failedUpdates > 0) {
      setMessage({ text: `Falló el bloqueo de ${failedUpdates} franja(s) horaria(s).`, type: 'error' });
      fetchSchedules();
    }
    if (successfulUpdates === 0 && failedUpdates === 0) {
      setMessage({ text: 'No se pudo realizar el bloqueo general.', type: 'error' });
    }
  };

  const handleBulkUnblock = async () => {
    if (selectedScheduleIds.size === 0) {
      setMessage({ text: 'No hay horarios seleccionados para desbloquear.', type: 'info' });
      return;
    }

    setMessage({ text: `Desbloqueando ${selectedScheduleIds.size} horarios seleccionados...`, type: 'info' });

    const schedulesToUnblock = generatedSchedules.filter(s => selectedScheduleIds.has(s.id));

    const uniqueTimeSlots = new Map<string, HoraDisponible>();
    schedulesToUnblock.forEach(schedule => {
      const key = `${schedule.veterinario.id}-${schedule.fecha}-${schedule.hora}`;
      if (!uniqueTimeSlots.has(key)) {
        uniqueTimeSlots.set(key, schedule);
      }
    });

    setGeneratedSchedules(prevSchedules => {
      return prevSchedules.map(schedule => {
        const key = `${schedule.veterinario.id}-${schedule.fecha}-${schedule.hora}`;
        if (uniqueTimeSlots.has(key)) {
          return { ...schedule, disponible: true };
        }
        return schedule;
      });
    });

    const results = await Promise.all(
      Array.from(uniqueTimeSlots.values()).map(schedule =>
        updateScheduleAvailability(schedule.id, true)
      )
    );

    const successfulUpdates = results.filter(r => r?.success).length;
    const failedUpdates = results.filter(r => r?.error).length;

    if (successfulUpdates > 0) {
      setMessage({ text: `Se desbloquearon ${successfulUpdates} franja(s) horaria(s) exitosamente.`, type: 'success' });
      setSelectedScheduleIds(new Set());
      fetchSchedules();
    }
    if (failedUpdates > 0) {
      setMessage({ text: `Falló el desbloqueo de ${failedUpdates} franja(s) horaria(s).`, type: 'error' });
      fetchSchedules();
    }
    if (successfulUpdates === 0 && failedUpdates === 0) {
      setMessage({ text: 'No se pudo realizar el desbloqueo general.', type: 'error' });
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setSelectedScheduleIds(new Set());
    }
  };

  // --- FUNCIÓN: Abrir modal de edición de valores de comuna ---
  const openEditComunaValuesModal = (schedule: HoraDisponible) => {
    setEditingSchedule(schedule);
    setModalComunaValues(schedule.id_comuna.map(c => ({
      id: c.id,
      nombre: c.nombre,
      valor: c.valor === 0 ? '' : c.valor
    })));
    setModalError(null);
    setShowEditComunaValuesModal(true);
  };

  // --- FUNCIÓN: Manejar cambio de valor en el modal ---
  const handleModalValorComunaChange = (comunaId: string, newValue: string) => {
    setModalComunaValues(prev =>
      prev.map(comuna =>
        comuna.id === comunaId
          ? { ...comuna, valor: newValue === '' ? '' : parseFloat(newValue) }
          : comuna
      )
    );
  };

  // --- FUNCIÓN: Guardar valores de comuna del modal ---
  const handleSaveComunaValues = async () => {
    setModalLoading(true);
    setModalError(null);

    if (!editingSchedule) {
      setModalError('No hay horario seleccionado para editar.');
      setModalLoading(false);
      return;
    }

    const hasInvalidValor = modalComunaValues.some(sc => {
      if (sc.valor === '') {
        return false;
      }
      const numValue = Number(sc.valor);
      return isNaN(numValue) || numValue < 0;
    });

    if (hasInvalidValor) {
      setModalError('Por favor, ingresa un valor numérico válido (mayor o igual a cero) para todas las comunas.');
      setModalLoading(false);
      return;
    }

    try {
      const comunasToSend: ComunaConValor[] = modalComunaValues.map(c => ({
        id: c.id,
        nombre: c.nombre,
        valor: Number(c.valor === '' ? 0 : c.valor)
      }));

      const result = await updateScheduleComunaValues(editingSchedule.id, comunasToSend);
      if (result?.success) {
        setMessage({ text: 'Valores de comuna actualizados exitosamente.', type: 'success' });
        setShowEditComunaValuesModal(false);
        setEditingSchedule(null);
        fetchSchedules();
      } else if (result?.error) {
        setModalError(result.error);
      }
    } catch (error) {
      console.error("Error al guardar valores de comuna:", error);
      setModalError('Error al guardar valores de comuna. Intente nuevamente.');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="bg-white text-gray-800 shadow rounded-lg p-6  font-inter">
      <h2 className="text-2xl font-bold text-indigo-700 mb-6 border-b pb-3">Gestión general de Horarios </h2>
      
      <div className="mb-8 p-4 bg-gray-50 rounded-lg shadow-inner">
        <p className="text-base text-gray-700 mb-4">
          Selecciona un veterinario, una región, una o varias comunas y un rango de fechas para generar o visualizar los horarios disponibles.
        </p>

        <div className="grid grid-cols-1 gap-4 mb-6">
          {/* Selector de Veterinario */}
          <div>
            <label htmlFor="veterinario" className="block text-sm font-medium text-gray-700 mb-1">Veterinario</label>
            <select id="veterinario" className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              value={selectedVeterinarioId} onChange={(e) => {
                setSelectedVeterinarioId(e.target.value);
                // Cuando el veterinario cambia, limpiamos comunas seleccionadas y fechas para una nueva búsqueda
                setSelectedComunasWithValues([]);
                setStartDate('');
                setEndDate('');
                setGeneratedSchedules([]);
                setSelectedScheduleIds(new Set());
              }}
              disabled={loadingVets} // Deshabilitar mientras carga la lista de vets
            >
              <option value="">
                {loadingVets ? 'Cargando veterinarios...' : 'Selecciona un veterinario'}
              </option>
              {veterinarians.map((vet) => (
                <option key={vet.id} value={vet.id}>
                  {vet.nombre} {vet.role ? `(${vet.role})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Región */}
          <div>
            <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">Región</label>
            <select id="region" className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              value={selectedRegionId} onChange={(e) => setSelectedRegionId(e.target.value)}
              disabled={!selectedVeterinarioId} // Deshabilitar si no hay veterinario seleccionado
            >
              <option value="">Selecciona una región</option>
              {regiones.map((region) => (<option key={region.id} value={region.id}>{region.nombre}</option>))}
            </select>
          </div>

          {/* Selección Múltiple de Comunas (botones/chips) */}
          {selectedRegionId && comunas.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecciona las comunas disponibles:
              </label>
              <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-white shadow-sm">
                {comunas.map((comuna) => (
                  <button
                    key={comuna.id}
                    type="button" 
                    className={`
                      px-4 py-2 rounded-full text-sm font-medium
                      ${selectedComunasWithValues.some(sc => sc.id === comuna.id) 
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }
                      transition-colors duration-200 ease-in-out
                    `}
                    onClick={() => handleComunaToggle(comuna)}
                    disabled={!selectedVeterinarioId} // Deshabilitar si no hay veterinario seleccionado
                  >
                    {comuna.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* NUEVA SECCIÓN: Inputs de Valor por Comuna Seleccionada */}
          {selectedComunasWithValues.length > 0 && (
            <div className="mt-6 p-4 border rounded-md bg-white shadow-sm">
              <h4 className="text-md font-semibold text-gray-800 mb-3">Valores por Comuna Seleccionada:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedComunasWithValues.map((sc) => (
                  <div key={sc.id} className="flex items-center space-x-2">
                    <label htmlFor={`valor-${sc.id}`} className="block text-sm font-medium text-gray-700 w-2/3">
                      {sc.nombre}:
                    </label>
                    <input
                      type="number"
                      id={`valor-${sc.id}`}
                      value={sc.valor}
                      onChange={(e) => handleValorComunaChange(sc.id, e.target.value)}
                      placeholder="Valor en pesos"
                      min="0" // Asegura valores no negativos
                      className="w-1/3 px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      disabled={!selectedVeterinarioId} // Deshabilitar si no hay veterinario seleccionado
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filtros de Fecha - en una nueva fila */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
              <input type="date" id="start-date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                disabled={!selectedVeterinarioId || selectedComunasWithValues.length === 0} // Deshabilitar si no hay vet o comunas
              />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
              <input type="date" id="end-date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                disabled={!selectedVeterinarioId || selectedComunasWithValues.length === 0} // Deshabilitar si no hay vet o comunas
              />
            </div>
          </div>
        </div>

        {/* Botón Generar Horarios */}
        <button onClick={handleGenerateSchedule} disabled={loadingGenerate || !selectedVeterinarioId || selectedComunasWithValues.length === 0 || !startDate || !endDate || selectedComunasWithValues.some(sc => { const num = Number(sc.valor); return (sc.valor !== '' && isNaN(num)) || num < 0; })}
          className={`px-6 py-2 rounded-lg text-white font-semibold text-lg shadow-md transition duration-200 ease-in-out transform hover:scale-105 ${
            loadingGenerate || !selectedVeterinarioId || selectedComunasWithValues.length === 0 || !startDate || !endDate || selectedComunasWithValues.some(sc => { const num = Number(sc.valor); return (sc.valor !== '' && isNaN(num)) || num < 0; }) ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
          }`}>
          {loadingGenerate ? (
            <span className="flex items-center justify-center">
              <FaSpinner className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />Generando...
            </span>
          ) : ('Generar Horarios en Rango de Fechas')}
        </button>

        {/* Área de Mensajes */}
        {message && (
          <div className={`mt-5 p-4 rounded-md text-base font-medium ${
            message.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' :
            message.type === 'error'   ? 'bg-red-100 text-red-700 border border-red-200' :
                                         'bg-blue-100 text-blue-700 border border-blue-200'
          }`}>{message.text}</div>
        )}
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4 text-indigo-700 border-b pb-2">Horarios Disponibles</h3>

        {/* Lógica de Renderizado Condicional Mejorada para mensajes */}
        {loadingSchedules ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            <p className="ml-3 text-gray-600">Cargando horarios...</p>
          </div>
        ) : !selectedVeterinarioId ? (
          <div className="bg-gray-50 p-6 rounded-lg text-center shadow-inner">
            <p className="text-gray-600 text-lg">Selecciona un veterinario para ver sus horarios.</p>
          </div>
        ) : !selectedRegionId ? (
          <div className="bg-gray-50 p-6 rounded-lg text-center shadow-inner">
            <p className="text-gray-600 text-lg">Selecciona una región para cargar sus comunas.</p>
          </div>
        ) : comunas.length === 0 ? (
          <div className="bg-gray-50 p-6 rounded-lg text-center shadow-inner">
            <p className="text-gray-600 text-lg">No hay comunas disponibles para la región seleccionada.</p>
          </div>
        ) : selectedComunasWithValues.length === 0 ? (
          <div className="bg-gray-50 p-6 rounded-lg text-center shadow-inner">
            <p className="text-gray-600 text-lg">Selecciona una o varias comunas para ver los horarios disponibles.</p>
          </div>
        ) : (!startDate || !endDate) ? (
          <div className="bg-gray-50 p-6 rounded-lg text-center shadow-inner">
            <p className="text-gray-600 text-lg">Selecciona una fecha de inicio y una fecha de fin para ver los horarios.</p>
          </div>
        ) : generatedSchedules.length > 0 ? ( // Si hay horarios y no está cargando
          <div className="overflow-x-auto rounded-lg shadow-md">
            {/* Botones de Acción Masiva */}
            <div className="flex justify-end space-x-3 mb-4 p-2 bg-gray-100 rounded-t-lg">
              <button onClick={handleBulkBlock} disabled={selectedScheduleIds.size === 0}
                className={`px-4 py-2 rounded-md text-sm font-medium transition flex items-center ${
                  selectedScheduleIds.size === 0 ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-red-500 text-white hover:bg-red-600'
                }`}>
                <FaLock className="mr-2" /> Bloqueo General
              </button>
              <button onClick={handleBulkUnblock} disabled={selectedScheduleIds.size === 0}
                className={`px-4 py-2 rounded-md text-sm font-medium transition flex items-center ${
                  selectedScheduleIds.size === 0 ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'
                }`}>
                <FaUnlock className="mr-2" /> Desbloqueo General
              </button>
            </div>

            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider rounded-tl-lg">
                    <input type="checkbox" className="form-checkbox h-4 w-4 text-indigo-600 rounded"
                      onChange={handleSelectAll}
                      checked={isAllSelected}
                      ref={headerCheckboxRef}
                      disabled={selectableSchedules.length === 0}
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Hora</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Veterinario</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider rounded-tr-lg">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentSchedules.map((schedule) => {
                  const expired = isScheduleExpired(schedule);
                  const isChecked = selectedScheduleIds.has(schedule.id);
                  const isDisabled = expired;

                  return (
                    <tr key={schedule.id} className={expired ? 'bg-gray-50 opacity-80' : `hover:bg-indigo-50 transition duration-100 ${isChecked ? 'bg-indigo-100' : ''}`}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input type="checkbox" className="form-checkbox h-4 w-4 text-indigo-600 rounded"
                          checked={isChecked} onChange={(e) => handleSelectSchedule(schedule.id, e.target.checked)} disabled={isDisabled}
                        />
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm ${expired ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                        {(() => {
                          const parts = schedule.fecha.split('-');
                          const localDate = new Date(
                            parseInt(parts[0]),
                            parseInt(parts[1]) - 1,
                            parseInt(parts[2])
                          );
                          return localDate.toLocaleDateString('es-CL');
                        })()}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm ${expired ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                        {schedule.hora}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm ${expired ? 'text-gray-500' : 'text-gray-700'}`}>
                        {schedule.veterinario.nombre}
                      </td> 
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full py-1 ${
                          expired ? 'bg-gray-200 text-gray-700' : schedule.disponible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {expired ? 'Caducado' : (schedule.disponible ? 'Disponible' : 'Ocupado')}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium flex items-center space-x-2">
                        <button onClick={() => openEditComunaValuesModal(schedule)}
                          className={`p-1 rounded-full hover:bg-gray-200 transition ${expired ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-900'}`}
                          title="Editar valores de comunas" disabled={expired}>
                          <FaEdit className="h-5 w-5" />
                        </button>
                        <button onClick={() => handleBlockSchedule(schedule.id)} disabled={expired || !schedule.disponible}
                          className={`p-1 rounded-full hover:bg-gray-200 transition ${expired || !schedule.disponible ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:text-red-900'}`} title="Bloquear">
                          <FaLock className="h-5 w-5" />
                        </button>
                        <button onClick={() => handleUnblockSchedule(schedule.id)} disabled={expired || schedule.disponible}
                          className={`p-1 rounded-full hover:bg-gray-200 transition ${expired || schedule.disponible ? 'text-gray-400 cursor-not-allowed' : 'text-green-600 hover:text-green-900'}`} title="Desbloquear">
                          <FaUnlock className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* Controles de Paginación */}
            {totalPages > 1 && (
              <nav className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-b-lg">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 shadow-sm">
                    Anterior
                  </button>
                  <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 shadow-sm">
                    Siguiente
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">Mostrando <span className="font-medium">{startIndex + 1}</span> a <span className="font-medium">{Math.min(endIndex, generatedSchedules.length)}</span> de <span className="font-medium">{generatedSchedules.length}</span> resultados</p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L9.46 10l3.31 3.71a.75.75 0 11-1.08 1.04l-3.75-4.25a.75.75 0 010-1.04l3.75-4.25a.75.75 0 011.06-.02z" clipRule="evenodd" /></svg>
                      </button>
                      {[...Array(totalPages)].map((_, index) => (
                        <button key={index} onClick={() => handlePageChange(index + 1)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === index + 1 ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}>
                          {index + 1}
                        </button>
                      ))}
                      <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L10.54 10l-3.31-3.71a.75.75 0 111.08-1.04l3.75 4.25a.75.75 0 010 1.04l-3.75 4.25a.75.75 0 01-1.06.02z" clipRule="evenodd" /></svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </nav>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 p-6 rounded-lg text-center shadow-inner">
            <p className="text-gray-600 text-lg">
              {!selectedVeterinarioId ? "Selecciona un veterinario para ver sus horarios." :
               !selectedRegionId ? "Selecciona una región para cargar sus comunas." :
               comunas.length === 0 ? "No hay comunas disponibles para la región seleccionada." :
               selectedComunasWithValues.length === 0 ? "Selecciona una o varias comunas para ver los horarios disponibles." :
               (!startDate || !endDate) ? "Selecciona una fecha de inicio y una fecha de fin para ver los horarios." :
               "No hay horarios disponibles para mostrar con los criterios seleccionados."
              }
            </p>
          </div>
        )}
      </div>

      {/* Modal para Editar Valores de Comunas */}
      {showEditComunaValuesModal && editingSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-lg relative">
            <button onClick={() => setShowEditComunaValuesModal(false)}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700">
              <FaTimes className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-bold mb-4 text-indigo-700">Editar Valores de Comunas</h2>
            <p className="text-gray-700 mb-4">
              Horario: <span className="font-semibold">{editingSchedule.fecha}</span> a las <span className="font-semibold">{editingSchedule.hora}</span>
            </p>

            {modalError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">{modalError}</span>
              </div>
            )}

            <div className="space-y-4 mb-6 max-h-80 overflow-y-auto">
              {modalComunaValues.map(comuna => (
                <div key={comuna.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <label htmlFor={`modal-valor-${comuna.id}`} className="block text-sm font-medium text-gray-700 flex-grow">
                    {comuna.nombre}:
                  </label>
                  <input
                    type="number"
                    id={`modal-valor-${comuna.id}`}
                    value={comuna.valor}
                    onChange={(e) => handleModalValorComunaChange(comuna.id, e.target.value)}
                    placeholder="Valor en pesos"
                    min="0"
                    className="ml-4 w-1/3 px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-right"
                    disabled={modalLoading}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowEditComunaValuesModal(false)}
                      className="px-5 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                      disabled={modalLoading}>
                Cancelar
              </button>
              <button onClick={handleSaveComunaValues}
                      className={`px-5 py-2 rounded-md text-white font-semibold transition ${
                        modalLoading ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                      disabled={modalLoading}>
                {modalLoading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminMassScheduleManager;