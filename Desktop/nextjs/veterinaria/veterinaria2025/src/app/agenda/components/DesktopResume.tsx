// components/DesktopResume.tsx
import { useAppointmentStore } from '@/lib/stores/appointmentStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const DesktopResume = () => {
  // Asegúrate de desestructurar costoAdicionalComuna de locationData
  const { locationData, mascotas } = useAppointmentStore();

  const calculateTotal = () => {
    let total = 0;
    // Suma el precio real de cada servicio
    mascotas.forEach(pet => {
      pet.servicios.forEach(service => {
        total += service.precio; 
      });
    });
    // NUEVO: Suma el costo adicional por comuna si existe
    if (locationData.costoAdicionalComuna !== null && locationData.costoAdicionalComuna !== undefined) {
      total += locationData.costoAdicionalComuna;
    }
    return total;
  };

  return (
    <div className="space-y-6 sticky top-6">
      <h3 className="text-xl font-semibold text-black">Resumen</h3>

      <div className="space-y-4">
        {locationData.fecha && (
          <div>
            <h4 className="text-sm font-medium text-gray-500">Fecha y Hora</h4>
            <p className="text-black">
              {format(locationData.fecha, 'PPPP', { locale: es })} a las {locationData.hora}
            </p>
          </div>
        )}

        {locationData.veterinario && (
          <div>
            <h4 className="text-sm font-medium text-gray-500">Veterinario</h4>
            <p className="text-black">{locationData.veterinario.nombre}</p>
          </div>
        )}

        {mascotas.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-500">Mascotas y Servicios</h4>
            <ul className="space-y-2 mt-2">
              {mascotas.map((mascota) => (
                <li key={mascota.id} className="text-black">
                  <span className="font-semibold">{mascota.nombre}</span> ({mascota.tipo})
                  {mascota.servicios.length > 0 && (
                    <ul className="ml-4 text-sm text-gray-600">
                      {mascota.servicios.map(service => (
                        <li key={service.id} className="flex justify-between items-center">
                          <span>{service.nombre}</span>
                          <span className="font-medium">${service.precio.toLocaleString('es-CL')}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {mascota.servicios.length === 0 && (
                    <span className="block text-sm text-gray-600">
                      Sin servicios seleccionados
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* NUEVO: Mostrar el costo adicional por comuna si está disponible y es mayor que 0 */}
        {locationData.costoAdicionalComuna !== null && locationData.costoAdicionalComuna !== undefined && locationData.costoAdicionalComuna > 0 && (
          <div className="pt-4 border-t"> 
            <h4 className="text-sm font-medium text-gray-500">Recargo por Comuna</h4>
            <p className="text-black">
              ${locationData.costoAdicionalComuna.toLocaleString('es-CL')}
            </p>
          </div>
        )}

        {/* El div de "Total estimado" ahora incluye el recargo por comuna en calculateTotal() */}
        {mascotas.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-500">Total estimado</h4>
            <p className="text-lg font-semibold text-black">
              ${calculateTotal().toLocaleString('es-CL')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};