// components/DesktopResume.tsx
import { useAppointmentStore } from '@/lib/stores/appointmentStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const DesktopResume = () => {
  // 1. OBTENEMOS 'precio_base' DEL STORE JUNTO CON EL RESTO DE LOS DATOS
  const { locationData, mascotas, precio_base } = useAppointmentStore();

  const calculateTotal = () => {
    // 2. INICIAMOS EL TOTAL CON EL precio_base
    // Usamos 'precio_base || 0' como salvaguarda por si el valor aún no ha cargado.
    let total = precio_base || 0;

    // Sumamos el precio de cada servicio
    mascotas.forEach(pet => {
      pet.servicios.forEach(service => {
        total += service.precio;
      });
    });

    // Sumamos el costo adicional por comuna si existe
    if (locationData.costoAdicionalComuna) {
      total += locationData.costoAdicionalComuna;
    }
    
    return total;
  };

  return (
    <div className="space-y-6 sticky top-6">
      <h3 className="text-xl font-semibold text-black">Resumen</h3>

      <div className="space-y-4">
        {/* ... (sin cambios en la sección de Fecha, Hora y Veterinario) ... */}
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

        {/* ... (sin cambios en la sección de Mascotas y Servicios) ... */}
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
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Usamos un fragmento para agrupar la lógica de los costos y el total */}
        {(mascotas.length > 0 || (precio_base ?? 0) > 0) && (
          <div className="pt-4 border-t space-y-2">
            {/* 3. MOSTRAMOS EL PRECIO BASE EN EL RESUMEN */}
            {precio_base !== undefined && precio_base > 0 && (
                <div className="flex justify-between items-center text-black">
                    <span className="text-sm">Consulta A Domicilio</span>
                    <span className="text-sm font-semibold">${precio_base.toLocaleString('es-CL')}</span>
                </div>
            )}
            
            {/* Mostrar el costo adicional por comuna */}
            {locationData.costoAdicionalComuna && locationData.costoAdicionalComuna > 0 && (
                <div className="flex justify-between items-center text-black">
                    <span className="text-sm">Recargo Por Comuna Aledaña</span>
                    <span className="text-sm font-semibold">${locationData.costoAdicionalComuna.toLocaleString('es-CL')}</span>
                </div>
            )}

            {/* El div de "Total estimado" ahora incluye todos los costos */}
            <div className="flex justify-between items-center pt-2 mt-2 border-t">
                <h4 className="text-base font-semibold text-gray-800">Total estimado</h4>
                <p className="text-lg font-bold text-black">
                    ${calculateTotal().toLocaleString('es-CL')}
                </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};