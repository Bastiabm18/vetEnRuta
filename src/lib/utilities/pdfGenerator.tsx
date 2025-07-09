// src/lib/utilities/pdfGenerator.tsx
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import React from 'react';

// Registrar fuentes
Font.register({
  family: 'Helvetica',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2',
      fontWeight: 'normal'
    },
    {
      src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmEU9fBBc4AMP6lQ.woff2',
      fontWeight: 'bold'
    }
  ]
});

// Definición de estilos
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 12,
    lineHeight: 1.5,
    color: '#333',
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#22c55e',
    borderBottomStyle: 'solid',
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22c55e',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#22c55e',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    borderBottomStyle: 'solid',
    paddingBottom: 3,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  label: {
    width: 120,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#555',
  },
  value: {
    fontSize: 12,
    flex: 1,
  },
  petItem: {
    marginBottom: 15,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#22c55e',
    borderLeftStyle: 'solid',
  },
  petName: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 5,
  },
  serviceList: {
    marginLeft: 10,
    marginTop: 5,
  },
  serviceItem: {
    marginBottom: 3,
  },
  footer: {
    marginTop: 40,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    borderTopStyle: 'solid',
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
});

// Interfaces TypeScript
interface Veterinario {
  nombre: string;
  especialidad?: string;
}

interface Servicio {
  id: string;
  nombre: string;
  descripcion?: string;
}

interface Direccion {
  calle: string;
  numero: string;
  comuna: string;
  ciudad?: string;
}

interface Mascota {
  id?: string;
  nombre: string;
  tipo: string;
  raza?: string;
  edad?: number;
  servicios: Servicio[];
}

interface DatosDueño {
  nombre: string;
  rut: string;
  telefono: string;
  email: string;
  direccion: Direccion;
}

interface LocationData {
  fecha?: Date | string;
  hora?: string;
  veterinario?: Veterinario;
  comuna?: string;
  direccion?: string;
}

interface AppointmentPDFProps {
  locationData: LocationData;
  mascotas: Mascota[];
  datosDueño: DatosDueño;
}

// Componente principal del PDF
const GenerateAppointmentPDF = ({
  locationData,
  mascotas,
  datosDueño
}: AppointmentPDFProps) => {
  // Formatear fecha si es string
  const fechaCita = locationData.fecha
    ? new Date(locationData.fecha)
    : null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Encabezado */}
        <View style={styles.header}>
          <Text style={styles.title}>Comprobante de Cita Veterinaria</Text>
          <Text style={styles.subtitle}>
            N° {Date.now().toString().slice(-8)} - {fechaCita && format(fechaCita, 'dd/MM/yyyy')}
          </Text>
        </View>

        {/* Sección Detalles de la Cita */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles de la Cita</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Fecha:</Text>
            <Text style={styles.value}>
              {fechaCita ? format(fechaCita, 'PPPP', { locale: es }) : 'No especificada'}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Hora:</Text>
            <Text style={styles.value}>{locationData.hora || 'No especificada'}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Veterinario:</Text>
            <Text style={styles.value}>
              {locationData.veterinario?.nombre || 'No asignado'}
              {locationData.veterinario?.especialidad && ` (${locationData.veterinario.especialidad})`}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Ubicación:</Text>
            <Text style={styles.value}>
              {locationData.direccion || locationData.comuna || 'No especificada'}
            </Text>
          </View>
        </View>

        {/* Sección Mascotas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mascotas ({mascotas.length})</Text>

          {mascotas.map((mascota, index) => (
            <View key={index} style={styles.petItem}>
              <Text style={styles.petName}>
                {mascota.nombre} - {mascota.tipo}
                {mascota.raza && ` (${mascota.raza})`}
                {mascota.edad && `, ${mascota.edad} años`}
              </Text>

              {mascota.servicios.length > 0 && (
                <View style={styles.serviceList}>
                  <Text>Servicios contratados:</Text>
                  {mascota.servicios.map((servicio, i) => (
                    <Text key={i} style={styles.serviceItem}>
                      • {servicio.nombre}
                      {servicio.descripcion && `: ${servicio.descripcion}`}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Sección Datos del Dueño */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Dueño</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Nombre:</Text>
            <Text style={styles.value}>{datosDueño.nombre}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>RUT:</Text>
            <Text style={styles.value}>{datosDueño.rut}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Teléfono:</Text>
            <Text style={styles.value}>{datosDueño.telefono}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{datosDueño.email}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Dirección:</Text>
            <Text style={styles.value}>
              {datosDueño.direccion.calle} {datosDueño.direccion.numero},
              {datosDueño.direccion.comuna}
              {datosDueño.direccion.ciudad && `, ${datosDueño.direccion.ciudad}`}
            </Text>
          </View>
        </View>

        {/* Pie de página */}
        <View style={styles.footer}>
          <Text>Gracias por confiar en nuestro servicio veterinario</Text>
          <Text>Para consultas: +56 9 1234 5678 | contacto@veterinaria.cl</Text>
          <Text>Horario de atención: Lunes a Viernes de 9:00 a 19:00 hrs</Text>
        </View>
      </Page>
    </Document>
  );
};

export default GenerateAppointmentPDF;
