// src/app/agenda/confirmacion/ConfirmationClientContent.tsx
// Este es el componente cliente real con toda tu lógica original.
'use client'; 

import { useSearchParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { app, db } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { PiSpinnerBold } from 'react-icons/pi';
import emailjs from '@emailjs/browser';
import { FaWhatsapp } from 'react-icons/fa';

interface ServicioConfirmacionFirestore {
  id: string;
  nombre: string;
  precio: number;
}

interface AppointmentData {
  locationData?: {
    region?: string | null;
    comuna?: string | null;
    nom_comuna?: string | null;
    fecha?: any | null; // Firestore Timestamp u objeto Date
    hora?: string | null;
    veterinario?: {
      id?: string;
      nombre?: string;
    } | null;
    costoAdicionalComuna?: number | null;
  };
  mascotas?: Array<{
    id?: string;
    nombre?: string;
    tipo?: string;
    servicios?: ServicioConfirmacionFirestore[];
  }>;
  datosDueño?: {
    nombre?: string;
    rut?: string;
    telefono?: string;
    email?: string;
    direccion?: {
      calle?: string;
      numero?: string;
      comuna?: string;
    };
    estacionamiento?: string | null;
  };
  fechaCreacion?: any; // Firestore Timestamp
  precio_base?: number;
}

export default function ConfirmationClientContent() { // <-- ¡NOMBRE DEL COMPONENTE CAMBIADO AQUÍ!
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get('citaId');
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const calculatePetServicesTotal = (servicios?: ServicioConfirmacionFirestore[]) => {
    if (!servicios || servicios.length === 0) return 0;
    return servicios.reduce((subtotal, service) => subtotal + (service.precio || 0), 0);
  };

  const calculateTotalAppointment = () => {
    let total = 0;
    appointment?.mascotas?.forEach(mascota => {
      total = appointment.precio_base || 0; 
      total += calculatePetServicesTotal(mascota.servicios);
    });
    if (appointment?.locationData?.costoAdicionalComuna !== null && appointment?.locationData?.costoAdicionalComuna !== undefined) {
      total += appointment.locationData.costoAdicionalComuna;
    }
    return total;
  };

  const sendConfirmationEmail = async (appointmentData: AppointmentData, idCita: string) => {
    if (!appointmentData.datosDueño?.email) {
      setEmailError('No se encontró dirección de email para enviar la confirmación');
      console.error('DEBUG: No se encontró appointmentData.datosDueño.email. El correo no se enviará.');
      return;
    }

    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      setEmailError('Configuración de EmailJS incompleta. Faltan variables de entorno.');
      console.error('DEBUG: Variables de entorno de EmailJS incompletas.');
      return;
    }

    try {
      emailjs.init(publicKey);

      const formattedDateForEmail = appointmentData.locationData?.fecha
        ? new Date(appointmentData.locationData.fecha.seconds * 1000).toLocaleDateString('es-CL', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          })
        : 'Fecha no disponible';

      const templateParams = {
        owner_email: appointmentData.datosDueño.email,
        reply_to: 'veterinaria.concepcion2025@gmail.com',
        appointment_id: idCita,
        owner_name: appointmentData.datosDueño?.nombre || 'No proporcionado',
        owner_phone: appointmentData.datosDueño?.telefono || 'No proporcionado',
        owner_rut: appointmentData.datosDueño?.rut || 'No proporcionado',
        owner_address_street: appointmentData.datosDueño?.direccion?.calle || '',
        owner_address_number: appointmentData.datosDueño?.direccion?.numero || '',
        owner_address_comuna: appointmentData.datosDueño?.direccion?.comuna || '',
        parking_needed: appointmentData.datosDueño?.estacionamiento ? 'Sí' : 'No',
        appointment_date: formattedDateForEmail,
        appointment_time: appointmentData.locationData?.hora || 'Hora no disponible',
        veterinarian_name: appointmentData.locationData?.veterinario?.nombre || 'No asignado',
        pets: appointmentData.mascotas?.map(mascota => ({
          name: mascota.nombre || 'Mascota sin nombre',
          type: mascota.tipo || 'Sin tipo especificado',
          services: mascota.servicios?.map(servicio => ({
            name: servicio.nombre || 'Servicio sin nombre',
            price: servicio.precio?.toLocaleString('es-CL') || '0'
          })) || [],
          pet_total: calculatePetServicesTotal(mascota.servicios).toLocaleString('es-CL')
        })) || [],
        comuna_fee: appointmentData.locationData?.costoAdicionalComuna?.toLocaleString('es-CL') || '0',
        total_appointment: calculateTotalAppointment().toLocaleString('es-CL'),
        current_year: new Date().getFullYear(),
      };

      console.log('DEBUG: Enviando email con parámetros:', templateParams);
      const response = await emailjs.send(serviceId, templateId, templateParams);
      console.log('DEBUG: Email enviado con éxito:', response);
      setEmailSent(true);
      setEmailError(null);
    } catch (error) {
      console.error('Error al enviar el correo:', error);
      setEmailError('Ocurrió un error al enviar el correo de confirmación. Por favor contáctanos.');
    }
  };

  useEffect(() => {
    const fetchAppointment = async () => {
      if (!appointmentId) {
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'citas', appointmentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const fetchedAppointment = docSnap.data() as AppointmentData;
          setAppointment(fetchedAppointment);

          if (!emailSent) {
            await sendConfirmationEmail(fetchedAppointment, appointmentId);
          }
        } else {
          console.log("No se encontró la cita con ID:", appointmentId);
        }
      } catch (error) {
        console.error("Error al obtener la cita:", error);
        setEmailError('Error al cargar los datos de la cita');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [appointmentId, emailSent]);

  const formattedDate = appointment?.locationData?.fecha
    ? new Date(appointment.locationData.fecha.seconds * 1000).toLocaleDateString('es-CL', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      })
    : 'Fecha no disponible';

  const totalFinal = calculateTotalAppointment();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <PiSpinnerBold className='text-green-vet text-6xl animate-spin'/>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen flex bg-gray-50 flex-col items-center justify-center p-4">
        <p className="text-gray-700 text-lg mb-4">No se encontró la cita o el ID es inválido.</p>
        <Link href="/" className="text-green-vet hover:underline text-base">Volver al inicio</Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-3xl mx-auto text-black bg-white rounded-xl shadow-md overflow-hidden p-8">
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </motion.div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">¡Cita Confirmada!</h1>
          <p className="text-lg text-gray-600">
            {emailSent ? 'Hemos enviado los detalles a tu correo electrónico.' : 'Procesando el envío de confirmación...'}
          </p>
          
          {emailError && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
              {emailError}
            </div>
          )}
        </div>

        <div className="border-t border-b border-gray-200 py-8 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Detalles de tu cita</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Datos del Dueño</h3>
              <p className="mt-1 text-sm text-gray-900">
                <span className="font-medium">Nombre:</span> {appointment.datosDueño?.nombre || 'No proporcionado'} <br />
                <span className="font-medium">Email:</span> {appointment.datosDueño?.email || 'No proporcionado'} <br />
                <span className="font-medium">Teléfono:</span> {appointment.datosDueño?.telefono || 'No proporcionado'}
              </p>
              {appointment.datosDueño?.direccion && (
                <p className="mt-1 text-sm text-gray-900">
                  <span className="font-medium">Dirección:</span> {appointment.datosDueño.direccion.calle} {appointment.datosDueño.direccion.numero}, {appointment.datosDueño.direccion.comuna}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-900">
                <span className="font-medium">RUT:</span> {appointment.datosDueño?.rut || 'No proporcionado'}
              </p>
              {appointment.datosDueño?.estacionamiento && appointment.datosDueño.estacionamiento.trim() !== '' && (
                <p className="mt-1 text-sm text-gray-900">
                  <span className="font-medium">Estacionamiento para el Veterinario:</span>{' '}
                  {appointment.datosDueño.estacionamiento}
                </p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Fecha y Hora</h3>
              <p className="mt-1 text-sm text-gray-900">
                <span className="font-medium">Fecha:</span> {formattedDate} <br />
                <span className="font-medium">Hora:</span> {appointment.locationData?.hora || 'No especificada'}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Veterinario</h3>
              <p className="mt-1 text-sm text-gray-900">
                <span className="font-medium">Nombre:</span> {appointment.locationData?.veterinario?.nombre || 'No asignado'}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Mascotas y Servicios</h3>
            <div className="space-y-4">
              {appointment.mascotas?.map((mascota, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold text-gray-900">
                    {mascota.nombre || 'Mascota sin nombre'} ({mascota.tipo || 'Sin tipo'})
                  </p>
                  {mascota.servicios && mascota.servicios.length > 0 ? (
                    <ul className="list-disc list-inside mt-2 text-sm text-gray-800 space-y-1">
                      {mascota.servicios.map((servicio, svcIndex) => (
                        <li key={svcIndex} className="flex justify-between items-center pr-4">
                          <span>{servicio.nombre}</span>
                          <span className="font-medium">${servicio.precio?.toLocaleString('es-CL') || '0'}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-xs italic mt-2">Sin servicios seleccionados para esta mascota.</p>
                  )}
                  {mascota.servicios && mascota.servicios.length > 0 && (
                    <div className="border-t border-gray-200 mt-3 pt-2 text-right">
                      <p className="font-semibold text-gray-900 text-sm">
                        Total para {mascota.nombre}: ${calculatePetServicesTotal(mascota.servicios).toLocaleString('es-CL')}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {appointment?.locationData?.costoAdicionalComuna !== null && appointment?.locationData?.costoAdicionalComuna !== undefined && appointment.locationData.costoAdicionalComuna > 0 && (
            <div className="mt-6 text-right">
                <p className="text-base font-semibold text-gray-900">
                    Recargo por Comuna: ${appointment.locationData.costoAdicionalComuna.toLocaleString('es-CL')}
                </p>
            </div>
        )}
        {appointment?.precio_base && appointment.precio_base > 0 && (
            <div className="mt-6 text-right">
                <p className="text-base font-semibold text-gray-900">
                    Precio Visita: ${appointment.precio_base.toLocaleString('es-CL')}
                </p>
            </div>
        )

        }

        <div className="mt-8 text-right">
          <p className="text-xl font-bold text-gray-900">
            Total Estimado de la Cita: ${totalFinal.toLocaleString('es-CL')}
          </p>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-6">
            {emailSent 
              ? (
                  <>
                  Si tienes alguna duda sobre la consulta, no dudes en hablarnos directamente a nuestro {' '}
                  <Link 
                    href="https://wa.me/++5696097887" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center text-green-vet hover:underline ml-1"
                  >
                    WhatsApp <FaWhatsapp className="ml-1 text-lg font-bold" />
                  </Link>
                </>
              )
              : 'Estamos procesando tu confirmación...'}
          </p>

          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-vet hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </motion.div>
  );
}