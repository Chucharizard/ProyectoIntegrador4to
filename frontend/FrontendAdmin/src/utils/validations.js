/**
 * Utilidades de validación para formularios
 * Basado en los límites de la base de datos
 */

// Expresiones regulares
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[0-9]{7,20}$/,
  CI: /^[0-9]{5,20}$/,
  ALPHANUMERIC: /^[a-zA-Z0-9\s]*$/,
  LETTERS_ONLY: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/,
  DECIMAL: /^\d+(\.\d{1,2})?$/,
  CODIGO_PUBLICO: /^[A-Z0-9-]{3,30}$/,
};

// Límites de caracteres según la base de datos
export const MAX_LENGTH = {
  // Persona
  CI: 20,
  NOMBRES: 120,
  APELLIDOS: 120,
  TELEFONO: 20,
  EMAIL: 120,
  
  // Usuario
  NOMBRE_USUARIO: 60,
  CONTRASENIA: 256,
  
  // Rol
  NOMBRE_ROL: 50,
  DESCRIPCION_ROL: 200,
  
  // Cliente
  PREFERENCIA_ZONA: 200,
  ORIGEN: 60,
  
  // Dirección
  CALLE: 150,
  CALLE_DIRECCION: 150,
  CIUDAD: 80,
  CIUDAD_DIRECCION: 80,
  ZONA: 80,
  ZONA_DIRECCION: 80,
  
  // Propiedad
  CODIGO_PUBLICO: 30,
  CODIGO_PUBLICO_PROPIEDAD: 30,
  TITULO: 160,
  TITULO_PROPIEDAD: 160,
  DESCRIPCION: 1000,
  DESCRIPCION_PROPIEDAD: 1000,
  TIPO_OPERACION: 20,
  ESTADO: 20,
  
  // Imagen
  URL_IMAGEN: 400,
  DESCRIPCION_IMAGEN: 200,
  
  // Documento
  TIPO_DOCUMENTO: 40,
  RUTA_ARCHIVO: 400,
  OBSERVACIONES_DOCUMENTO: 400,
  
  // Cita
  LUGAR_ENCUENTRO: 200,
  ESTADO_CITA: 20,
  NOTA_CITA: 400,
  
  // Contrato
  TIPO_CONTRATO: 20,
  ESTADO_CONTRATO: 20,
  MODALIDAD_PAGO: 30,
  OBSERVACIONES_CONTRATO: 400,
  
  // Pago
  ESTADO_PAGO: 20,
  
  // Desempeño
  PERIODO: 20,
};

// Límites numéricos
export const NUMERIC_LIMITS = {
  PRECIO: {
    min: 0,
    max: 9999999999.99, // DECIMAL(12,2)
  },
  SUPERFICIE: {
    min: 0,
    max: 9999999999.99, // DECIMAL(12,2)
  },
  PORCENTAJE: {
    min: 0,
    max: 100, // DECIMAL(5,2)
  },
  LATITUD: {
    min: -90,
    max: 90, // DECIMAL(10,6)
  },
  LONGITUD: {
    min: -180,
    max: 180, // DECIMAL(10,6)
  },
  RECORDATORIO: {
    min: 0,
    max: 1440, // minutos en un día
  },
  ORDEN_IMAGEN: {
    min: 0,
    max: 999,
  },
};

/**
 * Valida un campo de texto con longitud máxima
 */
export const validateText = (value, fieldName, maxLength, required = false) => {
  if (required && !value?.trim()) {
    return `El campo ${fieldName} es obligatorio`;
  }
  
  if (value && value.length > maxLength) {
    return `${fieldName} no puede exceder ${maxLength} caracteres (actual: ${value.length})`;
  }
  
  return null;
};

/**
 * Valida un email
 */
export const validateEmail = (email, required = false) => {
  if (required && !email?.trim()) {
    return 'El correo electrónico es obligatorio';
  }
  
  if (email && !REGEX.EMAIL.test(email)) {
    return 'El formato del correo electrónico es inválido';
  }
  
  if (email && email.length > MAX_LENGTH.EMAIL) {
    return `El correo electrónico no puede exceder ${MAX_LENGTH.EMAIL} caracteres`;
  }
  
  return null;
};

/**
 * Valida un teléfono
 */
export const validatePhone = (phone, required = false) => {
  if (required && !phone?.trim()) {
    return 'El teléfono es obligatorio';
  }
  
  if (phone && !REGEX.PHONE.test(phone)) {
    return 'El teléfono debe contener solo números (7-20 dígitos)';
  }
  
  if (phone && phone.length > MAX_LENGTH.TELEFONO) {
    return `El teléfono no puede exceder ${MAX_LENGTH.TELEFONO} caracteres`;
  }
  
  return null;
};

/**
 * Valida un CI
 */
export const validateCI = (ci, required = true) => {
  if (required && !ci?.trim()) {
    return 'El CI es obligatorio';
  }
  
  if (ci && !REGEX.CI.test(ci)) {
    return 'El CI debe contener solo números (5-20 dígitos)';
  }
  
  if (ci && ci.length > MAX_LENGTH.CI) {
    return `El CI no puede exceder ${MAX_LENGTH.CI} caracteres`;
  }
  
  return null;
};

/**
 * Valida un número decimal
 */
export const validateDecimal = (value, fieldName, limits, required = false) => {
  if (required && (!value || value === '')) {
    return `El campo ${fieldName} es obligatorio`;
  }
  
  if (value !== '' && value !== null && value !== undefined) {
    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) {
      return `${fieldName} debe ser un número válido`;
    }
    
    if (limits.min !== undefined && numValue < limits.min) {
      return `${fieldName} debe ser mayor o igual a ${limits.min}`;
    }
    
    if (limits.max !== undefined && numValue > limits.max) {
      return `${fieldName} debe ser menor o igual a ${limits.max}`;
    }
  }
  
  return null;
};

/**
 * Valida un número entero
 */
export const validateInteger = (value, fieldName, min, max, required = false) => {
  if (required && (!value || value === '')) {
    return `El campo ${fieldName} es obligatorio`;
  }
  
  if (value !== '' && value !== null && value !== undefined) {
    const numValue = parseInt(value);
    
    if (isNaN(numValue)) {
      return `${fieldName} debe ser un número entero válido`;
    }
    
    if (min !== undefined && numValue < min) {
      return `${fieldName} debe ser mayor o igual a ${min}`;
    }
    
    if (max !== undefined && numValue > max) {
      return `${fieldName} debe ser menor o igual a ${max}`;
    }
  }
  
  return null;
};

/**
 * Valida una fecha
 */
export const validateDate = (date, fieldName, required = false, options = {}) => {
  if (required && !date) {
    return `El campo ${fieldName} es obligatorio`;
  }
  
  if (date) {
    const dateObj = new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return `${fieldName} no es una fecha válida`;
    }
    
    if (options.minDate && dateObj < new Date(options.minDate)) {
      return `${fieldName} no puede ser anterior a ${new Date(options.minDate).toLocaleDateString()}`;
    }
    
    if (options.maxDate && dateObj > new Date(options.maxDate)) {
      return `${fieldName} no puede ser posterior a ${new Date(options.maxDate).toLocaleDateString()}`;
    }
    
    if (options.notFuture && dateObj > new Date()) {
      return `${fieldName} no puede ser una fecha futura`;
    }
    
    if (options.notPast && dateObj < new Date()) {
      return `${fieldName} no puede ser una fecha pasada`;
    }
  }
  
  return null;
};

/**
 * Valida una contraseña
 */
export const validatePassword = (password, required = true, minLength = 6) => {
  if (required && !password) {
    return 'La contraseña es obligatoria';
  }
  
  if (password && password.length < minLength) {
    return `La contraseña debe tener al menos ${minLength} caracteres`;
  }
  
  if (password && password.length > MAX_LENGTH.CONTRASENIA) {
    return `La contraseña no puede exceder ${MAX_LENGTH.CONTRASENIA} caracteres`;
  }
  
  return null;
};

/**
 * Valida que solo contenga letras
 */
export const validateLettersOnly = (value, fieldName, required = false) => {
  if (required && !value?.trim()) {
    return `El campo ${fieldName} es obligatorio`;
  }
  
  if (value && !REGEX.LETTERS_ONLY.test(value)) {
    return `${fieldName} solo puede contener letras`;
  }
  
  return null;
};

/**
 * Valida código público de propiedad
 */
export const validateCodigoPublico = (codigo, required = false) => {
  if (required && !codigo?.trim()) {
    return 'El código público es obligatorio';
  }
  
  if (codigo && !REGEX.CODIGO_PUBLICO.test(codigo)) {
    return 'El código debe contener solo letras mayúsculas, números y guiones (3-30 caracteres)';
  }
  
  return null;
};

/**
 * Valida coordenadas geográficas
 */
export const validateLatitude = (lat, required = false) => {
  return validateDecimal(lat, 'Latitud', NUMERIC_LIMITS.LATITUD, required);
};

export const validateLongitude = (lng, required = false) => {
  return validateDecimal(lng, 'Longitud', NUMERIC_LIMITS.LONGITUD, required);
};

/**
 * Sanitiza un string (elimina caracteres peligrosos pero mantiene espacios)
 */
export const sanitizeString = (str) => {
  if (!str) return '';
  // Solo elimina caracteres peligrosos pero mantiene espacios y caracteres válidos
  return str.replace(/[<>]/g, '');
};

/**
 * Valida un formulario completo
 * @param {Object} formData - Datos del formulario
 * @param {Object} validationRules - Reglas de validación
 * @returns {Object} - { isValid: boolean, errors: Object }
 */
export const validateForm = (formData, validationRules) => {
  const errors = {};
  
  for (const [field, rules] of Object.entries(validationRules)) {
    const value = formData[field];
    let error = null;
    
    if (rules.validator) {
      error = rules.validator(value, rules.required);
    } else if (rules.type === 'text') {
      error = validateText(value, rules.label, rules.maxLength, rules.required);
    } else if (rules.type === 'email') {
      error = validateEmail(value, rules.required);
    } else if (rules.type === 'phone') {
      error = validatePhone(value, rules.required);
    } else if (rules.type === 'ci') {
      error = validateCI(value, rules.required);
    } else if (rules.type === 'decimal') {
      error = validateDecimal(value, rules.label, rules.limits, rules.required);
    } else if (rules.type === 'integer') {
      error = validateInteger(value, rules.label, rules.min, rules.max, rules.required);
    } else if (rules.type === 'date') {
      error = validateDate(value, rules.label, rules.required, rules.options);
    }
    
    if (error) {
      errors[field] = error;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Valida un campo individual en tiempo real
 * @param {string} fieldName - Nombre del campo
 * @param {any} value - Valor del campo
 * @param {Object} formData - Datos completos del formulario (para validaciones contextuales)
 * @returns {string|null} - Mensaje de error o null si es válido
 */
export const validateField = (fieldName, value, formData = {}) => {
  // Campos de texto con límites específicos
  if (fieldName.includes('nombres') || fieldName.includes('apellidos')) {
    return validateText(value, 'Este campo', MAX_LENGTH.NOMBRES, fieldName.includes('*'));
  }
  
  if (fieldName === 'titulo_propiedad') {
    return validateText(value, 'Título', MAX_LENGTH.TITULO_PROPIEDAD, true);
  }
  
  if (fieldName === 'descripcion_propiedad') {
    return validateText(value, 'Descripción', MAX_LENGTH.DESCRIPCION_PROPIEDAD, false);
  }
  
  if (fieldName === 'codigo_publico_propiedad') {
    return validateCodigoPublico(value, false);
  }
  
  if (fieldName === 'calle_direccion') {
    return validateText(value, 'Calle', MAX_LENGTH.CALLE_DIRECCION, true);
  }
  
  if (fieldName === 'barrio_direccion' || fieldName === 'zona_direccion') {
    return validateText(value, 'Zona', MAX_LENGTH.ZONA_DIRECCION, false);
  }
  
  if (fieldName === 'ciudad_direccion') {
    return validateText(value, 'Ciudad', MAX_LENGTH.CIUDAD_DIRECCION, true);
  }
  
  if (fieldName === 'precio_publicado_propiedad') {
    return validateDecimal(value, 'Precio', NUMERIC_LIMITS.PRECIO, false);
  }
  
  if (fieldName === 'superficie_propiedad') {
    return validateDecimal(value, 'Superficie', NUMERIC_LIMITS.SUPERFICIE, false);
  }
  
  if (fieldName === 'porcentaje_captacion_propiedad' || fieldName === 'porcentaje_colocacion_propiedad') {
    return validateDecimal(value, 'Porcentaje', NUMERIC_LIMITS.PORCENTAJE, false);
  }
  
  if (fieldName === 'latitud_direccion') {
    return validateLatitude(value, false);
  }
  
  if (fieldName === 'longitud_direccion') {
    return validateLongitude(value, false);
  }
  
  // Campos de email
  if (fieldName.includes('correo') || fieldName.includes('email')) {
    return validateEmail(value, fieldName.includes('*'));
  }
  
  // Campos de teléfono
  if (fieldName.includes('telefono')) {
    return validatePhone(value, fieldName.includes('*'));
  }
  
  // Campos de CI
  if (fieldName.includes('ci_')) {
    return validateCI(value, fieldName.includes('*'));
  }
  
  // Campos de fecha
  if (fieldName.includes('fecha')) {
    return validateDate(value, 'Fecha', fieldName.includes('*'));
  }
  
  return null;
};

/**
 * Valida todos los campos del formulario
 * @param {Object} formData - Datos del formulario
 * @returns {Object} - Objeto con errores por campo
 */
export const validateAllFields = (formData) => {
  const errors = {};
  
  for (const [fieldName, value] of Object.entries(formData)) {
    const error = validateField(fieldName, value, formData);
    if (error) {
      errors[fieldName] = error;
    }
  }
  
  return errors;
};
