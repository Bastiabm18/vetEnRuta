// services/ServicesGrid.tsx
"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppointmentStore, ServicioDetalle } from '@/lib/stores/appointmentStore';
import { addServiceToMascotaFromFirestore, removeServiceFromMascotaFromStore } from './actions';
import { collection, getDocs } from 'firebase/firestore';
//import { db } from '@/lib/firebase';
import { getFirebaseClientInstances } from '@/lib/firebase';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { CustomButton } from '../shared/CustomButton';

// Interfaz que representa la estructura de un servicio obtenido de Firestore.
interface Service {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  disponible_para: ("perro" | "gato")[]; // Tipos de mascota disponibles para el servicio
  en_promocion: boolean; // Indica si el servicio está en promoción
  new_price?: number; // El precio de promoción, opcional
  precio_vet?: number; // Nuevo campo opcional para el precio del veterinario
}

export const ServicesGrid = () => {
   const { locationData, mascotas, precio_base } = useAppointmentStore();
 
  const [services, setServices] = useState<Service[]>([]); // Estado para todos los servicios obtenidos de Firestore
  const [loading, setLoading] = useState(true); // Estado para controlar el estado de carga
  const [selectedServicesLocal, setSelectedServicesLocal] = useState<Record<string, ServicioDetalle[]>>({}); // Servicios seleccionados localmente
  const [showConfirmation, setShowConfirmation] = useState(false); // Estado para mostrar confirmación de guardado
  const [searchTerm, setSearchTerm] = useState<string>(''); // Estado para el término de búsqueda de servicios
 let precio_b = precio_base || 0;
  // Efecto para cargar los servicios desde Firestore y sincronizar selecciones iniciales
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { auth, db, storage } = getFirebaseClientInstances();
        const snapshot = await getDocs(collection(db, 'servicios'));
        const servicesData = snapshot.docs.map(doc => {
          const data = doc.data(); // Obtenemos todos los datos del documento

          // ✨ CORRECCIÓN PARA 'id' is specified more than once:
          // Construimos el objeto Service de forma explícita
          return {
            id: doc.id, // Tomamos el ID del documento de Firestore
            nombre: data.nombre,
            descripcion: data.descripcion,
            precio: data.precio,
            disponible_para: (data.disponible_para || []) as ("perro" | "gato")[], // Aseguramos que sea un array y el tipo correcto
            en_promocion: data.en_promocion || false, // Aseguramos que sea un booleano
            new_price: data.new_price, // Será undefined si no existe, lo cual está bien para un campo opcional
            precio_vet: data.precio_vet // Nuevo campo para el precio del veterinario
          } as Service; // Casteamos el objeto final a Service
        });
        setServices(servicesData);
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();

    // Inicializa el estado local de servicios seleccionados con los que ya están en el store
    const initialSelections: Record<string, ServicioDetalle[]> = {};
    mascotas.forEach(pet => {
      initialSelections[pet.id] = [...pet.servicios];
    });
    setSelectedServicesLocal(initialSelections);
  }, [mascotas]); // Se ejecuta cuando las mascotas cambian

  // Función para alternar la selección de un servicio para una mascota
  const toggleService = (petId: string, service: Service) => {
    setSelectedServicesLocal(prev => {
      const newSelections = { ...prev };
      if (!newSelections[petId]) {
        newSelections[petId] = [];
      }

      const isSelected = newSelections[petId].some(s => s.id === service.id);

      if (isSelected) {
        // Si ya está seleccionado, lo remueve
        newSelections[petId] = newSelections[petId].filter(s => s.id !== service.id);
      } else {
        // Si no está seleccionado, lo agrega
        // Determina el precio final: si está en promoción y tiene new_price, usa new_price; de lo contrario, usa el precio normal.
        const finalPrice = service.en_promocion && service.new_price !== undefined 
                           ? service.new_price 
                           : service.precio;

        const serviceToAdd: ServicioDetalle = {
          id: service.id,
          nombre: service.nombre,
          precio: finalPrice, // Usa el precio final calculado
          precio_vet: service.precio_vet // Incluye el nuevo campo
        };
        newSelections[petId] = [...newSelections[petId], serviceToAdd];
      }

      return newSelections;
    });
  };

  // Función para guardar los servicios seleccionados en el store global
  const saveServices = async () => {
    for (const pet of mascotas) {
      const currentSelectedServicesForPet = selectedServicesLocal[pet.id] || [];
      const servicesInStore = pet.servicios;

      // Servicios a añadir (están en la selección local pero no en el store)
      const servicesToAdd = currentSelectedServicesForPet.filter(
        localService => !servicesInStore.some(storeService => storeService.id === localService.id)
      );

      // Servicios a remover (están en el store pero no en la selección local)
      const servicesToRemove = servicesInStore.filter(
        storeService => !currentSelectedServicesForPet.some(localService => localService.id === storeService.id)
      );

      // Agrega los servicios nuevos al store
      for (const service of servicesToAdd) {
        await addServiceToMascotaFromFirestore(pet.id, service); 
      }

      // Remueve los servicios eliminados del store
      for (const service of servicesToRemove) {
        removeServiceFromMascotaFromStore(pet.id, service.id);
      }
    }

    // Muestra confirmación temporalmente
    setShowConfirmation(true);
    setTimeout(() => {
      setShowConfirmation(false);
    }, 4000);
  };

  // Maneja el cambio en el input de búsqueda
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className='w-full bg-green-vet rounded-lg bg-opacity-70 p-2'>
        <h3 className="text-lg font-semibold text-black">Selecciona servicios para tu mascota</h3>
        <h5 className="text-sm text-black">No te preocupes si no lo tienes claro<br></br>Esto se puede modificar durante la consulta presencial.</h5>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-8">
          {mascotas.map((mascota) => (
            <div key={mascota.id} className="space-y-4">
              <h4 className="font-medium text-black">
                Servicios para {mascota.nombre} ({mascota.tipo})
              </h4>

              {/* Input de búsqueda */}
              <div className="mb-4 text-black">
                <input
                  type="text"
                  placeholder={`Buscar servicios para ${mascota.nombre}...`}
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-vet focus:border-green-vet"
                />
              </div>

              {/* Grid de servicios */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           
           {precio_b > 0 && (    
             <div className="p-4 border rounded-lg cursor-pointer relative border-green-vet bg-green-vet">
                        <div>
                          <h5 className="font-medium text-black">consulta a domicilio</h5>
                          <p className="text-sm text-gray-600">visita del veterinario</p>
                        </div>

                        <div className="flex flex-col items-end">
                           <span className="text-black font-medium text-lg">
                                ${precio_b.toLocaleString('es-CL')}
                           </span>
                          </div>
                 </div>)}
                
                {services
                  .filter(service =>
                    // Filtra servicios según el tipo de mascota (solo "perro" o "gato")
                    (service.disponible_para.includes("perro") && mascota.tipo === "perro") ||
                    (service.disponible_para.includes("gato") && mascota.tipo === "gato")
                  )
                  .filter(service =>
                    // Filtra servicios según el término de búsqueda (nombre)
                    service.nombre.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((service) => (
                    <div
                      key={service.id}
                      onClick={() => toggleService(mascota.id, service)}
                      className={`p-4 border rounded-lg cursor-pointer relative ${ // 'relative' para posicionar la etiqueta de promoción
                        selectedServicesLocal[mascota.id]?.some(s => s.id === service.id)
                          ? 'border-green-vet bg-green-vet' // Estilo si el servicio está seleccionado
                          : 'hover:border-green-vet' // Estilo al pasar el ratón
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium text-black">{service.nombre}</h5>
                          <p className="text-sm text-gray-600">{service.descripcion}</p>
                        </div>
                        {/* Lógica de visualización de precios */}
                        <div className="flex flex-col items-end">
                          {service.en_promocion && service.new_price !== undefined ? (
                            <>
                              {/* Precio original tachado */}
                              <span className="text-sm text-gray-500 line-through">
                                ${service.precio.toLocaleString('es-CL')}
                              </span>
                              {/* Precio de promoción en verde y negrita */}
                              <span className="text-green-600 font-bold text-lg">
                                ${service.new_price.toLocaleString('es-CL')}
                              </span>
                            </>
                          ) : (
                            // Precio normal
                            <span className="text-black font-medium text-lg">
                              ${service.precio.toLocaleString('es-CL')}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Etiqueta "¡En Promoción!" */}
                      {service.en_promocion && (
                        <span className="absolute top-2 left-40 bg-green-vet text-white text-xs font-semibold px-2 py-1 rounded-full">
                          ¡En Promoción!
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}

          {/* Botón para guardar servicios */}
          <CustomButton onClick={saveServices}>
            Agregar Servicios
          </CustomButton>
          {/* Mensaje de confirmación */}
          {showConfirmation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mt-4 p-3 bg-green-100 text-green-700 rounded-lg text-center"
            >
              ¡Servicios Agregados con éxito!
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
};