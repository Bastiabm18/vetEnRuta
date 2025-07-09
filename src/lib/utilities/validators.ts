// src/lib/utilities/validators.ts
export const validateRUT = (rut: string): boolean => {
  if (!rut || typeof rut !== 'string') return false;
  
  // Eliminar puntos y guión
  const cleanRut = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
  
  // Validar formato
  if (!/^[0-9]+[0-9K]$/.test(cleanRut)) return false;
  
  // Separar número y dígito verificador
  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1);
  
  // Calcular DV correcto
  let sum = 0;
  let multiplier = 2;
  
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body.charAt(i)) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const calculatedDv = 11 - (sum % 11);
  let expectedDv = calculatedDv === 11 ? '0' : calculatedDv === 10 ? 'K' : calculatedDv.toString();
  
  return expectedDv === dv;
};

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePhone = (phone: string): boolean => {
  return /^[0-9]{8,12}$/.test(phone);
};