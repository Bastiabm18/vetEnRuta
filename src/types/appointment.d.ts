// src/types/appointment.d.ts
interface Region {
  id: string;
  nombre: string;
}

interface Comuna {
  id: string;
  nombre: string;
  region_id: string;
}

interface TimeSlot {
  id: string;
  hora: string;
  disponible: boolean;
  veterinario: {
    id: string;
    nombre: string;
  };
  comuna_id: string;
  fecha: string;
}

interface Service {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  duracion: number;
  tipo_mascota: 'perro' | 'gato' | 'ambos';
}

interface Mascota {
  id: string;
  nombre: string;
  tipo: 'perro' | 'gato';
  servicios: string[];
}

interface Direccion {
  calle: string;
  numero: string;
  comuna: string;
}

interface DatosDueño {
  nombre: string;
  rut: string;
  telefono: string;
  email: string;
  direccion: Direccion;
}

interface AppointmentState {
  currentStep: number;
  locationData: {
    region: string | null;
    comuna: string | null;
    fecha: Date | null;
    hora: string | null;
    veterinario: { id: string; nombre: string } | null;
  };
  mascotas: Mascota[];
  datosDueño: DatosDueño;
}