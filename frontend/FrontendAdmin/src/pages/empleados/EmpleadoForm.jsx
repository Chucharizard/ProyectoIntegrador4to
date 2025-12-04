import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { empleadoService } from '../../services/empleadoService';
import toast from 'react-hot-toast';

// ✨ Importar componentes reutilizables
import BackButton from '../../components/shared/BackButton';
import FormCard from '../../components/shared/FormCard';
import InfoBox from '../../components/shared/InfoBox';

// ✨ Importar validaciones
import {
  validateCI,
  validateText,
  validatePhone,
  validateEmail,
  validateDate,
  MAX_LENGTH,
  sanitizeString
} from '../../utils/validations';

const EmpleadoForm = () => {
  const { ci } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(ci);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    ci_empleado: '',
    nombres_completo_empleado: '',
    apellidos_completo_empleado: '',
    fecha_nacimiento_empleado: '',
    // direccion_empleado: '', // ⚠️ No existe en la BD - comentado para futuro uso
    telefono_empleado: '',
    correo_electronico_empleado: '',
    // fecha_contratacion_empleado: '', // ⚠️ No existe en la BD - comentado para futuro uso
    es_activo_empleado: true
  });

  // ✨ Estado para errores de validación
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const fetchData = async () => {
      if (!isEditMode) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const empleadoData = await empleadoService.getById(ci, controller.signal);
        
        if (isMounted) {
          setFormData({
            ci_empleado: empleadoData.ci_empleado,
            nombres_completo_empleado: empleadoData.nombres_completo_empleado,
            apellidos_completo_empleado: empleadoData.apellidos_completo_empleado,
            fecha_nacimiento_empleado: empleadoData.fecha_nacimiento_empleado,
            // direccion_empleado: empleadoData.direccion_empleado || '', // ⚠️ No existe en la BD
            telefono_empleado: empleadoData.telefono_empleado,
            correo_electronico_empleado: empleadoData.correo_electronico_empleado || '',
            // fecha_contratacion_empleado: empleadoData.fecha_contratacion_empleado, // ⚠️ No existe en la BD
            es_activo_empleado: empleadoData.es_activo_empleado
          });
        }
      } catch (error) {
        if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError') {
          console.log('Petición cancelada');
          return;
        }

        if (isMounted) {
          console.error('Error loading data:', error);
          toast.error('Error al cargar datos del empleado');
          navigate('/empleados');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [ci, isEditMode, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Sanitizar el valor para campos de texto
    const sanitizedValue = ['text', 'email', 'tel'].includes(type) 
      ? sanitizeString(value) 
      : value;
    
    const finalValue = type === 'checkbox' ? checked : sanitizedValue;
    
    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));

    // ✨ Validar el campo en tiempo real (excepto checkbox)
    if (type !== 'checkbox') {
      validateField(name, finalValue);
    }
  };

  // ✨ Validar campo individual
  const validateField = (fieldName, value) => {
    let error = null;

    switch (fieldName) {
      case 'ci_empleado':
        error = validateCI(value, true);
        break;
      case 'nombres_completo_empleado':
        error = validateText(value, 'Nombres', MAX_LENGTH.NOMBRES, true);
        break;
      case 'apellidos_completo_empleado':
        error = validateText(value, 'Apellidos', MAX_LENGTH.APELLIDOS, true);
        break;
      case 'telefono_empleado':
        error = validatePhone(value, false);
        break;
      case 'correo_electronico_empleado':
        error = validateEmail(value, false);
        break;
      case 'fecha_nacimiento_empleado':
        error = validateDate(value, 'Fecha de nacimiento', false, { notFuture: true });
        break;
      default:
        break;
    }

    setErrors((prev) => ({
      ...prev,
      [fieldName]: error,
    }));

    return error;
  };

  // ✨ Validar todos los campos
  const validateAllFields = () => {
    const newErrors = {};
    
    newErrors.ci_empleado = validateCI(formData.ci_empleado, true);
    newErrors.nombres_completo_empleado = validateText(formData.nombres_completo_empleado, 'Nombres', MAX_LENGTH.NOMBRES, true);
    newErrors.apellidos_completo_empleado = validateText(formData.apellidos_completo_empleado, 'Apellidos', MAX_LENGTH.APELLIDOS, true);
    newErrors.telefono_empleado = validatePhone(formData.telefono_empleado, false);
    newErrors.correo_electronico_empleado = validateEmail(formData.correo_electronico_empleado, false);
    newErrors.fecha_nacimiento_empleado = validateDate(formData.fecha_nacimiento_empleado, 'Fecha de nacimiento', false, { notFuture: true });

    // Filtrar errores nulos
    const filteredErrors = Object.fromEntries(
      Object.entries(newErrors).filter(([_, error]) => error !== null)
    );

    setErrors(filteredErrors);
    return Object.keys(filteredErrors).length === 0;
  };

  const validateForm = () => {
    // ✨ Usar la nueva función de validación
    if (!validateAllFields()) {
      toast.error('Por favor corrige los errores en el formulario');
      return false;
    }
    
    if (!formData.ci_empleado.trim()) {
      toast.error('El CI es obligatorio');
      return false;
    }
    if (!formData.nombres_completo_empleado.trim()) {
      toast.error('Los nombres son obligatorios');
      return false;
    }
    if (!formData.apellidos_completo_empleado.trim()) {
      toast.error('Los apellidos son obligatorios');
      return false;
    }
    if (!formData.fecha_nacimiento_empleado) {
      toast.error('La fecha de nacimiento es obligatoria');
      return false;
    }
    if (!formData.telefono_empleado.trim()) {
      toast.error('El teléfono es obligatorio');
      return false;
    }
    // ⚠️ Campo comentado - no existe en la BD
    // if (!formData.fecha_contratacion_empleado) {
    //   toast.error('La fecha de contratación es obligatoria');
    //   return false;
    // }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      if (isEditMode) {
        await empleadoService.update(ci, formData);
        toast.success('Empleado actualizado exitosamente');
      } else {
        await empleadoService.create(formData);
        toast.success('Empleado creado exitosamente');
      }

      navigate('/empleados');
    } catch (error) {
      console.error('Error saving empleado:', error);
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error(isEditMode ? 'Error al actualizar empleado' : 'Error al crear empleado');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-800 border-t-green-500"></div>
          <div className="absolute inset-0 rounded-full border-4 border-green-500/20 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* ✨ Header con BackButton Component */}
      <div className="mb-6">
        <BackButton to="/empleados" label="Volver a Empleados" />
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
          {isEditMode ? 'Editar Empleado' : 'Nuevo Empleado'}
        </h1>
        <p className="text-gray-400 mt-1">
          {isEditMode 
            ? 'Actualiza la información del empleado' 
            : 'Registra un nuevo empleado en el sistema'}
        </p>
      </div>

      {/* ✨ Info Box Component */}
      {!isEditMode && (
        <InfoBox type="info">
          <strong className="text-blue-400">📌 Nota:</strong> Después de crear el empleado, podrás crear sus credenciales de acceso en el módulo de Usuarios.
        </InfoBox>
      )}

      {/* ✨ Form Card Component */}
      <FormCard>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Grid de 2 columnas para campos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CI */}
            <div>
              <label htmlFor="ci_empleado" className="block text-sm font-medium text-green-400 mb-2">
                CI <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="ci_empleado"
                name="ci_empleado"
                value={formData.ci_empleado}
                onChange={handleChange}
                disabled={isEditMode}
                maxLength={MAX_LENGTH.CI}
                className={`w-full px-4 py-2.5 bg-gray-900/50 border rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 transition-all ${
                  isEditMode ? 'cursor-not-allowed opacity-60 border-gray-700 focus:ring-green-500/50 focus:border-green-500/50' : 
                  errors.ci_empleado ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500/50' : 'border-gray-700 focus:ring-green-500/50 focus:border-green-500/50'
                }`}
                placeholder="12345678"
              />
              {!isEditMode && errors.ci_empleado && (
                <p className="text-red-400 text-xs mt-1">⚠️ {errors.ci_empleado}</p>
              )}
              {!isEditMode && !errors.ci_empleado && (
                <p className="text-gray-500 text-xs mt-1">
                  {formData.ci_empleado.length}/{MAX_LENGTH.CI} caracteres
                </p>
              )}
              {isEditMode && (
                <p className="text-xs text-gray-500 mt-1">El CI no se puede modificar</p>
              )}
            </div>

            {/* Nombres */}
            <div>
              <label htmlFor="nombres_completo_empleado" className="block text-sm font-medium text-green-400 mb-2">
                Nombres Completos <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="nombres_completo_empleado"
                name="nombres_completo_empleado"
                value={formData.nombres_completo_empleado}
                onChange={handleChange}
                maxLength={MAX_LENGTH.NOMBRES}
                className={`w-full px-4 py-2.5 bg-gray-900/50 border rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 transition-all ${
                  errors.nombres_completo_empleado ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500/50' : 'border-gray-700 focus:ring-green-500/50 focus:border-green-500/50'
                }`}
                placeholder="Juan Carlos"
              />
              {errors.nombres_completo_empleado ? (
                <p className="text-red-400 text-xs mt-1">⚠️ {errors.nombres_completo_empleado}</p>
              ) : (
                <p className="text-gray-500 text-xs mt-1">
                  {formData.nombres_completo_empleado.length}/{MAX_LENGTH.NOMBRES} caracteres
                </p>
              )}
            </div>

            {/* Apellidos */}
            <div>
              <label htmlFor="apellidos_completo_empleado" className="block text-sm font-medium text-green-400 mb-2">
                Apellidos Completos <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="apellidos_completo_empleado"
                name="apellidos_completo_empleado"
                value={formData.apellidos_completo_empleado}
                onChange={handleChange}
                maxLength={MAX_LENGTH.APELLIDOS}
                className={`w-full px-4 py-2.5 bg-gray-900/50 border rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 transition-all ${
                  errors.apellidos_completo_empleado ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500/50' : 'border-gray-700 focus:ring-green-500/50 focus:border-green-500/50'
                }`}
                placeholder="Pérez García"
              />
              {errors.apellidos_completo_empleado ? (
                <p className="text-red-400 text-xs mt-1">⚠️ {errors.apellidos_completo_empleado}</p>
              ) : (
                <p className="text-gray-500 text-xs mt-1">
                  {formData.apellidos_completo_empleado.length}/{MAX_LENGTH.APELLIDOS} caracteres
                </p>
              )}
            </div>

            {/* Fecha de Nacimiento */}
            <div>
              <label htmlFor="fecha_nacimiento_empleado" className="block text-sm font-medium text-green-400 mb-2">
                Fecha de Nacimiento <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                id="fecha_nacimiento_empleado"
                name="fecha_nacimiento_empleado"
                value={formData.fecha_nacimiento_empleado}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 bg-gray-900/50 border rounded-lg text-gray-200 focus:ring-2 transition-all ${
                  errors.fecha_nacimiento_empleado ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500/50' : 'border-gray-700 focus:ring-green-500/50 focus:border-green-500/50'
                }`}
              />
              {errors.fecha_nacimiento_empleado && (
                <p className="text-red-400 text-xs mt-1">⚠️ {errors.fecha_nacimiento_empleado}</p>
              )}
            </div>

            {/* ⚠️ Campo comentado - no existe en la BD (Dirección) */}
            {/* <div className="md:col-span-2">
              <label htmlFor="direccion_empleado" className="block text-sm font-medium text-green-400 mb-2">
                Dirección
              </label>
              <input
                type="text"
                id="direccion_empleado"
                name="direccion_empleado"
                value={formData.direccion_empleado}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                placeholder="Av. Principal #123"
              />
            </div> */}

            {/* Teléfono */}
            <div>
              <label htmlFor="telefono_empleado" className="block text-sm font-medium text-green-400 mb-2">
                Teléfono <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                id="telefono_empleado"
                name="telefono_empleado"
                value={formData.telefono_empleado}
                onChange={handleChange}
                maxLength={MAX_LENGTH.TELEFONO}
                className={`w-full px-4 py-2.5 bg-gray-900/50 border rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 transition-all ${
                  errors.telefono_empleado ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500/50' : 'border-gray-700 focus:ring-green-500/50 focus:border-green-500/50'
                }`}
                placeholder="70123456"
              />
              {errors.telefono_empleado ? (
                <p className="text-red-400 text-xs mt-1">⚠️ {errors.telefono_empleado}</p>
              ) : (
                <p className="text-gray-500 text-xs mt-1">
                  {formData.telefono_empleado.length}/{MAX_LENGTH.TELEFONO} caracteres
                </p>
              )}
            </div>

            {/* Correo */}
            <div>
              <label htmlFor="correo_electronico_empleado" className="block text-sm font-medium text-green-400 mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                id="correo_electronico_empleado"
                name="correo_electronico_empleado"
                value={formData.correo_electronico_empleado}
                onChange={handleChange}
                maxLength={MAX_LENGTH.EMAIL}
                className={`w-full px-4 py-2.5 bg-gray-900/50 border rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 transition-all ${
                  errors.correo_electronico_empleado ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500/50' : 'border-gray-700 focus:ring-green-500/50 focus:border-green-500/50'
                }`}
                placeholder="empleado@ejemplo.com"
              />
              {errors.correo_electronico_empleado ? (
                <p className="text-red-400 text-xs mt-1">⚠️ {errors.correo_electronico_empleado}</p>
              ) : (
                <p className="text-gray-500 text-xs mt-1">
                  {formData.correo_electronico_empleado.length}/{MAX_LENGTH.EMAIL} caracteres
                </p>
              )}
            </div>

            {/* ⚠️ Campo comentado - no existe en la BD (Fecha de Contratación) */}
            {/* <div>
              <label htmlFor="fecha_contratacion_empleado" className="block text-sm font-medium text-green-400 mb-2">
                Fecha de Contratación <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                id="fecha_contratacion_empleado"
                name="fecha_contratacion_empleado"
                value={formData.fecha_contratacion_empleado}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
              />
            </div> */}
          </div>

          {/* Estado Activo */}
          <div className="flex items-center space-x-3 p-4 bg-gray-900/30 border border-gray-700/50 rounded-lg">
            <input
              type="checkbox"
              id="es_activo_empleado"
              name="es_activo_empleado"
              checked={formData.es_activo_empleado}
              onChange={handleChange}
              className="h-5 w-5 text-green-500 bg-gray-900 border-gray-600 rounded focus:ring-2 focus:ring-green-500/50"
            />
            <label htmlFor="es_activo_empleado" className="text-sm text-gray-300 font-medium cursor-pointer">
              Empleado activo
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Guardando...' : isEditMode ? 'Actualizar Empleado' : 'Crear Empleado'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/empleados')}
              className="flex-1 bg-gray-700/50 text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-700 transition-all duration-300 font-medium border border-gray-600"
            >
              Cancelar
            </button>
          </div>
        </form>
      </FormCard>
    </div>
  );
};

export default EmpleadoForm;
