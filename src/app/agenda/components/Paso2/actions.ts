// src/app/agenda/components/Paso2/actions.ts
//import { db } from '@/lib/firebase'; // Asegúrate de que esta ruta sea correcta
import { doc, getDoc } from 'firebase/firestore'; // getDoc se mantiene por si acaso, aunque ya no se usa directamente en addServiceToMascotaFromFirestore
import { useAppointmentStore, ServicioDetalle } from '@/lib/stores/appointmentStore'; // Asegúrate de que esta ruta y el tipo ServicioDetalle sean correctos

/**
 * Agrega un servicio a una mascota en el store.
 * Ahora recibe un objeto ServicioDetalle ya preparado, que incluye el precio final (normal o de promoción).
 * Esto evita una lectura adicional a Firestore para obtener el precio, ya que ServicesGrid.tsx ya lo calculó.
 * @param mascotaId El ID de la mascota a la que se le agregará el servicio.
 * @param serviceToAdd El objeto ServicioDetalle completo (con el precio ya ajustado si es en promo).
 */
export const addServiceToMascotaFromFirestore = async (mascotaId: string, serviceToAdd: ServicioDetalle) => {
  const appointmentStore = useAppointmentStore.getState();
  const addServiceToStore = appointmentStore.addServiceToMascota;

  try {
    // Ya no es necesario obtener el servicio de Firestore aquí,
    // ya que el precio final (normal o promo) se calcula en ServicesGrid y se pasa.
    addServiceToStore(mascotaId, serviceToAdd);
  } catch (error) {
    console.error("Error al agregar servicio a la mascota:", error);
  }
};

/**
 * Remueve un servicio de una mascota en el store.
 * Esta es la función que deberías llamar desde tus componentes de UI (ej: ServicesGrid).
 * @param mascotaId El ID de la mascota de la que se removerá el servicio.
 * @param serviceId El ID del servicio a remover.
 */
export const removeServiceFromMascotaFromStore = (mascotaId: string, serviceId: string) => {
  const appointmentStore = useAppointmentStore.getState();
  const removeServiceFromStore = appointmentStore.removeServiceFromMascota;

  // Llama a la acción interna del store para actualizar el estado
  removeServiceFromStore(mascotaId, serviceId);
};