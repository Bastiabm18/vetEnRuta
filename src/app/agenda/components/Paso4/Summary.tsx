// src/app/agenda/componentes/Paso1/summary.tsx
"use client"; // Asegura que este componente se renderice en el cliente
import { useState, useEffect } from 'react'; // Importa useState y useEffect
import { motion } from 'framer-motion';
import { useAppointmentStore } from '@/lib/stores/appointmentStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { collection, getDocs } from 'firebase/firestore'; // Importa funciones de Firestore
//import { db } from '@/lib/firebase'; // Importa tu instancia de la base de datos de Firebase
import { getFirebaseClientInstances } from '@/lib/firebase';
export const Summary = () => {
  const { locationData, mascotas, datosDueño, precio_base } = useAppointmentStore();

  // Nuevo estado para almacenar los nombres de las comunas
  const [comunasMap, setComunasMap] = useState<Record<string, string>>({});
  const [loadingComunas, setLoadingComunas] = useState(true);

  // Efecto para cargar los nombres de las comunas desde Firestore
  useEffect(() => {
    const fetchComunas = async () => {
      try {
        const {auth, db, storage} = getFirebaseClientInstances(); 
        const querySnapshot = await getDocs(collection(db, 'comunas'));
        const map: Record<string, string> = {};
        querySnapshot.forEach((doc) => {
          // Asegúrate de que tu documento de comuna tenga un campo 'nombre'
          map[doc.id] = doc.data().nombre;
        });
        setComunasMap(map);
      } catch (error) {
        console.error("Error fetching comunas:", error);
      } finally {
        setLoadingComunas(false);
      }
    };

    fetchComunas();
  }, []); // El array vacío asegura que se ejecuta solo una vez al montar

  // Calcula el total de servicios para una mascota específica
const calculatePetServicesTotal = (petId: string) => {
  const pet = mascotas.find(p => p.id === petId);
  if (!pet) return 0;

  // 1. El subtotal para esta mascota comienza con el precio base de la visita.
  let subtotal = precio_base || 0;

  // 2. Se suma el precio de todos los servicios seleccionados para esa mascota.
  subtotal += pet.servicios.reduce((serviceSubtotal, service) => serviceSubtotal + service.precio, 0);

  return subtotal;
};

  // Calcula el total general de todos los servicios de la cita
  const calculateTotalAppointment = () => {
    let total = 0;
    mascotas.forEach(pet => {
      total += calculatePetServicesTotal(pet.id);
    });
    // Suma el costo adicional por comuna si existe
    if (locationData.costoAdicionalComuna !== null && locationData.costoAdicionalComuna !== undefined ) {
      total += locationData.costoAdicionalComuna;
    }
    return total;
  };

  // Obtiene el nombre de la comuna usando el ID
  const getComunaName = (comunaId: string | null) => {
    if (!comunaId || loadingComunas) return 'Cargando...'; // Muestra cargando mientras se obtienen
    return comunasMap[comunaId] || 'Desconocida'; // Retorna el nombre o 'Desconocida' si no se encuentra
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <h3 className="text-xl font-semibold text-black">Resumen de tu cita</h3>

      <div className="space-y-6">
        <div>
          <h4 className="font-medium text-black mb-2">Detalles de la cita</h4>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-black">
              <span className="font-medium">Fecha:</span>{' '}
              {locationData.fecha && format(locationData.fecha, 'PPPP', { locale: es })}
            </p>
            <p className="text-black">
              <span className="font-medium">Hora:</span> {locationData.hora}
            </p>
            <p className="text-black">
              <span className="font-medium">Veterinario:</span>{' '}
              {locationData.veterinario?.nombre}
            </p>
            <p className="text-black">
              <span className="font-medium">Ubicación:</span>{' '}
              {getComunaName(locationData.comuna)}
            </p>
            
          </div>
               <div>
          <h4 className="font-medium text-black mb-2">Datos del dueño</h4>
          <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-black">
            <p>
              <span className="font-medium">Nombre:</span> {datosDueño.nombre}
            </p>
            <p>
              <span className="font-medium">RUT:</span> {datosDueño.rut}
            </p>
            <p>
              <span className="font-medium">Teléfono:</span> {datosDueño.telefono}
            </p>
            <p>
              <span className="font-medium">Email:</span> {datosDueño.email}
            </p>
            <p>
              <span className="font-medium">Dirección:</span>{' '}
              {datosDueño.direccion.calle} {datosDueño.direccion.numero},{' '}
              {datosDueño.direccion.comuna}
            </p>
            {/* MODIFICADO: Información de Estacionamiento como texto libre */}
            {datosDueño.estacionamiento && datosDueño.estacionamiento.trim() !== '' && ( // Solo muestra si hay texto
              <p>
                <span className="font-medium">Estacionamiento para el Veterinario:</span>{' '}
                {datosDueño.estacionamiento} {/* Renderiza el string directamente */}
              </p>
            )}
          </div>
        </div>

        </div>
           
        <div>
          <h4 className="font-medium text-black mb-2">Tus mascotas y servicios</h4>
          <div className="space-y-3">


            {mascotas.map((mascota) => (
              <div key={mascota.id} className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium text-black">
                  {mascota.nombre} ({mascota.tipo})
                </p>
                    <ul className="list-disc list-inside mt-2 text-black space-y-1">
                   
                      <li key="aa" className="flex justify-between items-center pr-4">
                        <span>Consulta a domicilio</span>
                        <span className="font-medium">${(precio_base ?? 0).toLocaleString('es-CL')}</span>
                      </li>
                  
                  </ul>
                {mascota.servicios.length > 0 ? (
                  <ul className="list-disc list-inside mt-2 text-black space-y-1">
                    {mascota.servicios.map((servicio) => (
                      <li key={servicio.id} className="flex justify-between items-center pr-4">
                        <span>{servicio.nombre}</span>
                        <span className="font-medium">${servicio.precio.toLocaleString('es-CL')}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm italic mt-2">Sin servicios adicionales para esta mascota</p>
                )}
                {mascota.servicios.length > 0 && (
                  <div className="border-t border-gray-200 mt-3 pt-2 text-right">
                    <p className="font-semibold text-black text-sm">
                      Total para {mascota.nombre}: ${calculatePetServicesTotal(mascota.id).toLocaleString('es-CL')}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

          
        
        {/* NUEVO: Mostrar el costo adicional por comuna si está disponible y es mayor que 0 */}
        {locationData.costoAdicionalComuna !== null && locationData.costoAdicionalComuna !== undefined && locationData.costoAdicionalComuna > 0 && (
          <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-black">
            <p className='text-right'>
              <span className="font-medium text-right">Recargo Comuna Aledaña:</span>{' '}
              ${locationData.costoAdicionalComuna.toLocaleString('es-CL')}
            </p>
          </div>
        )}


   

        <div className="border-t pt-4">
          <p className="text-lg font-semibold text-black text-right">
            Total de la cita: ${calculateTotalAppointment().toLocaleString('es-CL')}
          </p>
        </div>

        {/* NUEVO: Información de pago */}
        <div className="bg-green-vet bg-opacity-70 p-4 rounded-lg mt-6 hover:bg-green-vet hover:bg-opacity-100 transition-colors">
            <h4 className="font-semibold text-black mb-2">Información de Pago</h4>
            <ul className="list-disc list-inside text-black space-y-1">
                <li><b>Transferencia bancaria</b> (te enviaremos los datos a tu WhatsApp cuando el veterinario haya finalizado tu cita).</li>
                <li><b>Efectivo</b> (asegúrate de tener el monto justo para que pueda recibirlo el veterinario al finalizar tu cita).</li>
            </ul>
        </div>

        {/* Aquí irían tus botones de "Confirmar" y "Anterior", si los tienes en este componente */}
        {/* Si no tienes botones aquí, puedes eliminar este comentario. */}
      </div>
    </motion.div>
  );
};