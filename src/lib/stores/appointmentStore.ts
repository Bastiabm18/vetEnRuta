// src/lib/stores/appointmentStore.ts
import { create } from 'zustand';

// Define the interface for detailed service information
export interface ServicioDetalle {
  id: string;
  nombre: string;
  precio: number;
  precio_vet?: number; // Nuevo campo opcional para el precio del veterinario
}

// Interfaz para la estructura de VeterinariStore
interface VeterinarioStore {
  id: string;
  nombre: string;
}

interface AppointmentStore {
  currentStep: number;
  locationData: {
    region: string | null;
    nom_region: string | null;
    comuna: string | null;
    nom_comuna: string | null;
    fecha: Date | null;
    hora: string | null;
    veterinario: VeterinarioStore | null;
    costoAdicionalComuna?: number | null;
    selectedTimeSlotId?: string | null; // <--- ¡NUEVO CAMPO AQUÍ!
  };
  estado:boolean;
  mascotas: Array<{
    id: string;
    nombre: string;
    tipo: 'perro' | 'gato';
    edad: 'cachorro' | 'joven' | 'senior';
    sexo: 'macho entero'|'macho castrado' | 'hembra entera' | 'hembra esterilizada';
    info_adicional: string;
    observacion: string;
    servicios: ServicioDetalle[];
  }>;
  datosDueño: {
    nombre: string;
    rut: string;
    telefono: string;
    email: string;
    direccion: {
      calle: string;
      numero: string;
      comuna: string;
    };
    estacionamiento?: string | null; // <--- Aseguramos que sea string | null
  };
  precio_base?: number; // <--- Aseguramos que sea un número
  // Actions
  
  setCurrentStep: (step: number) => void;
  setLocationData: (data: Partial<AppointmentStore['locationData']>) => void;
  addMascota: (mascota: Omit<AppointmentStore['mascotas'][0], 'id' | 'servicios'>) => void;
  removeMascota: (id: string) => void;
  updateMascota: (id: string, data: Partial<AppointmentStore['mascotas'][0]>) => void;
  setDatosDueño: (data: Partial<AppointmentStore['datosDueño']>) => void;
  resetStore: () => void;
  addServiceToMascota: (mascotaId: string, service: ServicioDetalle) => void;
  removeServiceFromMascota: (mascotaId: string, serviceId: string) => void;
  setEstado: (newEstado: boolean) => void;
  setPrecioBase: (precio: number) => void;
}

export const useAppointmentStore = create<AppointmentStore>((set) => ({
  currentStep: 1,
  locationData: {
    region: null,
    nom_region: null,
    comuna: null,
    nom_comuna: null,
    fecha: null,
    hora: null,
    veterinario: null,
    costoAdicionalComuna: null,
    selectedTimeSlotId: null, // <--- Inicialización del nuevo campo
  },
  estado:false,
  mascotas: [],
  datosDueño: {
    nombre: '',
    rut: '',
    telefono: '',
    email: '',
    direccion: {
      calle: '',
      numero: '',
      comuna: ''
    },
    estacionamiento: null, // <--- Inicializa como null para ser consistente con string | null
  },
  precio_base: 0, // <--- Aseguramos que sea un número
  setCurrentStep: (step) => set({ currentStep: step }),
  setLocationData: (data) => set((state) => ({
    locationData: { ...state.locationData, ...data }
  })),
  addMascota: (mascota) => set((state) => ({
    mascotas: [...state.mascotas, { ...mascota, id: Date.now().toString(), servicios: [] }]
  })),
  removeMascota: (id) => set((state) => ({
    mascotas: state.mascotas.filter(pet => pet.id !== id)
  })),
  updateMascota: (id, data) => set((state) => ({
    mascotas: state.mascotas.map(pet =>
      pet.id === id ? { ...pet, ...data } : pet
    )
  })),
  setDatosDueño: (data) => set((state) => ({
    datosDueño: { ...state.datosDueño, ...data }
  })),
  resetStore: () => set({
    currentStep: 1,
    locationData: {
      region: null,
      nom_region: null,
      comuna: null,
      nom_comuna: null,
      fecha: null,
      hora: null,
      veterinario: null,
      costoAdicionalComuna: null,
      selectedTimeSlotId: null, // <--- Resetear también el nuevo campo
    },
    mascotas: [],
    datosDueño: { 
      nombre: '',
      rut: '',
      telefono: '',
      email: '',
      direccion: {
        calle: '',
        numero: '',
        comuna: ''
      },
      estacionamiento: null, // <--- Resetear también a null
    },
    precio_base: 0, // <--- Aseguramos que sea un número
    estado: false
  }),
  addServiceToMascota: (mascotaId, service) => set((state) => ({
    mascotas: state.mascotas.map(pet =>
      pet.id === mascotaId
        ? { ...pet, servicios: [...pet.servicios, service] }
        : pet
    )
  })),
  removeServiceFromMascota: (mascotaId, serviceId) => set((state) => ({
    mascotas: state.mascotas.map(pet =>
      pet.id === mascotaId
        ? { ...pet, servicios: pet.servicios.filter(s => s.id !== serviceId) }
        : pet
    )
  })),
  setEstado: (newEstado) => set(() => ({
    estado: newEstado
  })),
  setPrecioBase: (precio) => set({ precio_base: precio }), // <--- ¡IMPLEMENTACIÓN DE LA NUEVA ACCIÓN!
}));