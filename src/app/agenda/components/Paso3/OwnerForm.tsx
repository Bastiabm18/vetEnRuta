"use client"
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppointmentStore } from '@/lib/stores/appointmentStore';
import { validateRUT } from '@/lib/utilities/validators';
import { ValidationMessage } from '../shared/ValidationMessage';
import { CustomButton } from '../shared/CustomButton';

export const OwnerForm = () => {
  const { datosDueño, setDatosDueño } = useAppointmentStore();
  const [formData, setFormData] = useState({
    nombre: datosDueño.nombre,
    rut: datosDueño.rut,
    telefono: datosDueño.telefono,
    email: datosDueño.email,
    direccion: {
      calle: datosDueño.direccion.calle,
      numero: datosDueño.direccion.numero,
      comuna: datosDueño.direccion.comuna
    },
     estacionamiento: datosDueño.estacionamiento  || '', 
  });

  const [errors, setErrors] = useState({
    nombre: '',
    rut: '',
    telefono: '',
    email: '',
    direccion: {
      calle: '',
      numero: '',
      comuna: ''
    }
  });

  const [submissionMessage, setSubmissionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    if (name.includes('direccion.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        direccion: {
          ...prev.direccion,
          [field]: value
        }
      }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked // Para checkboxes, usa 'checked'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors = {
      nombre: '',
      rut: '',
      telefono: '',
      email: '',
      direccion: {
        calle: '',
        numero: '',
        comuna: ''
      }
    };

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'Nombre es requerido';
      isValid = false;
    }

    if (!validateRUT(formData.rut)) {
      newErrors.rut = 'RUT inválido';
      isValid = false;
    }

    if (!formData.telefono.trim() || formData.telefono.length < 8) {
      newErrors.telefono = 'Teléfono inválido';
      isValid = false;
    }

    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      newErrors.email = 'Email inválido';
      isValid = false;
    }

    if (!formData.direccion.calle.trim()) {
      newErrors.direccion.calle = 'Calle es requerida';
      isValid = false;
    }

    if (!formData.direccion.numero.trim()) {
      newErrors.direccion.numero = 'Número es requerido';
      isValid = false;
    }

    // No se requiere validación para comuna ya que el store ya la tiene del paso anterior.
    // Si la comuna se fuese a elegir en este formulario, se necesitaría validarla aquí.

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      setDatosDueño({
        nombre: formData.nombre,
        rut: formData.rut,
        telefono: formData.telefono,
        email: formData.email,
        direccion: {
          calle: formData.direccion.calle,
          numero: formData.direccion.numero,
          comuna: formData.direccion.comuna
        },
        estacionamiento: formData.estacionamiento // Agregado: Guarda el valor del checkbox
      });
      setSubmissionMessage({ type: 'success', text: '¡Datos del tutor guardados correctamente!' });
      setTimeout(() => setSubmissionMessage(null), 3000);
    } else {
      setSubmissionMessage({ type: 'error', text: 'Por favor, corrige los errores en el formulario.' });
      setTimeout(() => setSubmissionMessage(null), 4000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <h3 className="text-lg font-semibold text-black">Datos del tutor</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Nombre completo
          </label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            className="border text-black focus:border-green-vet rounded p-2 w-full"
            placeholder="Ej: Juan Pérez"
          />
          {errors.nombre && <ValidationMessage message={errors.nombre} />}
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-1">
            RUT
          </label>
          <input
            type="text"
            name="rut"
            value={formData.rut}
            onChange={handleChange}
            className="border text-black focus:border-green-vet rounded p-2 w-full"
            placeholder="Ej: 12345678-9"
          />
          {errors.rut && <ValidationMessage message={errors.rut} />}
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Teléfono
          </label>
          <input
            type="tel"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            className="border text-black focus:border-green-vet rounded p-2 w-full"
            placeholder="Ej: 912345678"
          />
          {errors.telefono && <ValidationMessage message={errors.telefono} />}
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="border text-black focus:border-green-vet rounded p-2 w-full"
            placeholder="Ej: juan@example.com"
          />
          {errors.email && <ValidationMessage message={errors.email} />}
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-black">Dirección</h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Calle
              </label>
              <input
                type="text"
                name="direccion.calle"
                value={formData.direccion.calle}
                onChange={handleChange}
                className="border text-black focus:border-green-vet rounded p-2 w-full"
                placeholder="Ej: Av. Principal"
              />
              {errors.direccion.calle && (
                <ValidationMessage message={errors.direccion.calle} />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Número
              </label>
              <input
                type="text"
                name="direccion.numero"
                value={formData.direccion.numero}
                onChange={handleChange}
                className="border text-black focus:border-green-vet rounded p-2 w-full"
                placeholder="Ej: 123"
              />
              {errors.direccion.numero && (
                <ValidationMessage message={errors.direccion.numero} />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Comuna
              </label>
              <input
                type="text"
                name="direccion.comuna"
                value={formData.direccion.comuna}
                onChange={handleChange}
                className="border text-black focus:border-green-vet rounded p-2 w-full"
                placeholder="Ej: Providencia"
              />
              {errors.direccion.comuna && (
                <ValidationMessage message={errors.direccion.comuna} />
              )}
            </div>
          </div>
        </div>

        {/* Campo de texto para Estacionamiento - MODIFICADO */}
        <div className="mt-4"> {/* Contenedor principal con margen superior */}
          <label htmlFor="estacionamiento" className="block text-sm font-medium text-black mb-1">
            Información de Estacionamiento para el Veterinario
          </label>
          <input
            type="text"
            id="estacionamiento"
            name="estacionamiento"
            value={formData.estacionamiento}
            onChange={handleChange}
            placeholder='Ej: Sí, es en la calle / No hay estacionamiento disponible'
            // Clases para hacerlo de ancho completo y con estilo de input de texto
            className="border text-black focus:border-green-vet rounded p-2 w-full"
          />
        </div>


        <CustomButton onClick={handleSubmit} className="w-full">
          Guardar Datos
        </CustomButton>

        {submissionMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={`mt-4 p-3 rounded-lg text-center ${
              submissionMessage.type === 'success'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {submissionMessage.text}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};