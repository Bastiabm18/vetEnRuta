// app/agenda/page.tsx
//coment para agenda
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppointmentStore } from '@/lib/stores/appointmentStore';
import { ProgressBar } from './components/ProgressBar';
import { DesktopResume }  from './components/DesktopResume';
import { motion } from 'framer-motion';
import { SelectRegion } from './components/Paso1/SelectRegion';
import { SelectComuna } from './components/Paso1/SelectComuna';
import { DatePicker } from './components/Paso1/DatePicker';
import { TimeSlotPicker } from './components/Paso1/TimeSlotPicker';
import { PetForm } from './components/Paso2/PetForm';
import { ServicesGrid } from './components/Paso2/ServicesGrid';
import { OwnerForm } from './components/Paso3/OwnerForm';
import { Summary } from './components/Paso4/Summary';
import { CustomButton } from './components/shared/CustomButton';
//import { db } from '@/lib/firebase';
import { getFirebaseClientInstances } from '@/lib/firebase';
import { collection, addDoc,getDoc,doc, getDocs } from 'firebase/firestore';
import { PiSpinnerBold } from 'react-icons/pi';
import { FaArrowLeft } from 'react-icons/fa';
import { reserveTimeSlot } from '@/lib/firebase/firestore'; 

export default function AgendaPage() {
  const { currentStep, setCurrentStep,setPrecioBase,setPrecioBaseVet, locationData, mascotas, datosDueño,precio_base, precio_base_vet,resetStore } = useAppointmentStore();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isSavingAppointment, setIsSavingAppointment] = useState(false);
  const router = useRouter();

 useEffect(() => {
    // Función asíncrona para obtener los datos de configuración desde Firestore
    const fetchInitialData = async () => {
      try {
        const { auth, db, storage } = getFirebaseClientInstances();
        // Apuntamos a tu colección 'precio_base'
        const querySnapshot = await getDocs(collection(db, 'precio_base'));
        
        // Verificamos si la consulta devolvió algún documento
        if (!querySnapshot.empty) {
          // Tomamos el PRIMER documento que encuentre en la colección
          const docSnap = querySnapshot.docs[0]; 
          const configData = docSnap.data();
          const basePrice = configData.precio_base;
          const precio_base_vet = configData.precio_vet;

          // Verificamos que el precio sea un número antes de actualizar el store
          if (typeof basePrice === 'number') {
            setPrecioBase(basePrice); // ¡Aquí actualizamos el store!
            setPrecioBaseVet(precio_base_vet); // Actualizamos el precio del veterinario
            console.log('Precio base cargado desde tu configuración de Firestore:', basePrice);
            console.log('Precio base del veterinario cargado desde tu configuración de Firestore:', precio_base_vet);
          } else {
            console.warn("El campo 'precio_base' no es un número o no existe en el documento.");
          }
        } else {
          console.error("No se encontró ningún documento en la colección 'precio_base'.");
        }
      } catch (error) {
        console.error("Error al obtener la configuración inicial:", error);
      } finally {
        // Ocultamos el spinner de carga
        setIsLoadingPage(false);
      }
    };
    
    // Llamamos a la función al montar el componente
    fetchInitialData();

  }, [setPrecioBase, setPrecioBaseVet]); // La dependencia se mantiene igual

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return (
          !!locationData.region &&
          !!locationData.comuna &&
          locationData.fecha instanceof Date &&
          !!locationData.hora &&
          !!locationData.veterinario?.id &&
          !!locationData.selectedTimeSlotId
        );
      case 2:
        return mascotas.length > 0 ;
      case 3:
        return (
          datosDueño.nombre.trim() !== '' &&
          datosDueño.rut.trim() !== '' &&
          datosDueño.telefono.trim() !== '' &&
          datosDueño.email.trim() !== '' &&
          datosDueño.direccion.calle.trim() !== '' &&
          datosDueño.direccion.numero.trim() !== '' &&
          datosDueño.direccion.comuna.trim() !== ''
        );
      case 4:
        return true;
      default:
        return true;
    }
  };

  const openConfirmModal = () => {
    if (!isSavingAppointment) {
      setIsConfirmModalOpen(true);
    }
  };

  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
  };

  const saveAppointmentToFirestoreAndRedirect = async () => {
    setIsConfirmModalOpen(false);
    setIsSavingAppointment(true);

    try {
      const { auth, db, storage } = getFirebaseClientInstances();
      if (!locationData.selectedTimeSlotId) {
          throw new Error('Error interno: No se ha seleccionado una hora para reservar.');
      }
      const reservationSuccess = await reserveTimeSlot(locationData.selectedTimeSlotId);
      if (!reservationSuccess) {
          throw new Error('La hora seleccionada ya no está disponible. Por favor, intente nuevamente y elija otra hora.');
      }

      const citasCollection = collection(db, 'citas');

      const docRef = await addDoc(citasCollection, {
        locationData: {
          ...locationData,
          fecha: locationData.fecha,
        },
        mascotas,
        datosDueño: datosDueño,
        fechaCreacion: new Date(),
        estado: false,
        finalizada: false,
        montoTotal: 0,
        precio_base: precio_base,
        precio_base_vet: precio_base_vet, // Aseguramos que se guarde el precio del veterinario
      });

      resetStore();
      const citaId = docRef.id;
      router.push(`/agenda/confirmacion?citaId=${citaId}`);
    } catch (error) {
      console.error("Error al agendar la cita: ", error);
      alert(`Hubo un error al agendar la cita: ${(error as Error).message}.`);
      setIsSavingAppointment(false);
      setCurrentStep(1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 text-black">
            <SelectRegion />
            {locationData.region && <SelectComuna />}
            {locationData.comuna && <DatePicker />}
            {locationData.fecha && <TimeSlotPicker />}
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <PetForm />
            {mascotas.length > 0 && <ServicesGrid />}
          </div>
        );
      case 3:
        return <OwnerForm />;
      case 4:
        return (
          <div className="space-y-6">
            <Summary />
          </div>
        );
      default:
        return null;
    }
  };

  // Spinner de carga inicial de la página
  if (isLoadingPage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <PiSpinnerBold className='text-green-vet text-6xl animate-spin'/>
          <p className="mt-4 text-lg font-semibold text-green-vet">Cargando...</p>
        </div>
      </div>
    );
  }

  // Spinner de guardado/procesamiento de la cita
  if (isSavingAppointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <PiSpinnerBold className='text-green-vet text-6xl animate-spin'/>
        <p className="mt-4 text-lg font-semibold text-green-vet">Agendando tu cita...</p>
      </div>
    );
  }

  // Contenido principal de la página una vez que ha cargado y no está guardando
  return (
    <>
      <nav className='relative w-full h-[60px] bg-green-vet flex items-center justify-between px-4'> {/* Añadimos 'relative' y 'justify-between' */}
          <button onClick={() => router.push('/')} className='flex flex-row items-center justify-center font-josefin font-bold gap-2 bg-green-700 bg-opacity-40 rounded-full p-2 text-white z-10'> {/* z-index para que esté sobre la imagen si se superponen */}
              <FaArrowLeft className='text-2xl' /> 
          </button>
          
          {/* Icono centrado */}
          <img 
            src="/icon1.png" // Ruta relativa a la carpeta 'public'
            alt="Aplicación Icono" 
            className="absolute  left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 h-10 w-auto object-contain" // Ajusta h-10 según necesites
          />
      </nav>

      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md overflow-hidden md:flex">
          {/* Sidebar for desktop */}
          <div className="hidden md:block md:w-1/3 bg-gray-100 p-6">
            <DesktopResume />
          </div>

          {/* Main content */}
          <div className="w-full md:w-2/3 p-6">
            <ProgressBar />

            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: currentStep > 1 ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-8"
            >
              {renderStepContent()}
            </motion.div>

            <div className="mt-8 flex justify-between">
              {currentStep > 1 && (
                <CustomButton onClick={handlePrevStep} variant="secondary">
                  Anterior
                </CustomButton>
              )}
              {currentStep < 4 ? (
                <CustomButton onClick={handleNextStep} disabled={isSavingAppointment || !validateCurrentStep()}>
                  Siguiente
                </CustomButton>
              ) : (
                <CustomButton onClick={openConfirmModal} disabled={isSavingAppointment}>
                  Confirmar
                </CustomButton>
              )}
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {isConfirmModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">¿Confirmar la cita?</h2>
              <p className="text-gray-700 mb-4">¿Estás seguro de que deseas confirmar esta cita?</p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={closeConfirmModal}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveAppointmentToFirestoreAndRedirect}
                  disabled={isSavingAppointment}
                  className="bg-green-vet hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}