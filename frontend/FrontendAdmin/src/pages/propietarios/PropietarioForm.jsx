import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { propietarioService } from '../../services/propietarioService';
import { UserIcon, PhoneIcon, EnvelopeIcon, CalendarIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// ✨ Importar componentes reutilizables
import BackButton from '../../components/shared/BackButton';
import FormCard from '../../components/shared/FormCard';

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

const PropietarioForm = () => {
  const { ci } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(ci);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    ci_propietario: '',
    nombres_completo_propietario: '',
    apellidos_completo_propietario: '',
    fecha_nacimiento_propietario: '',
    telefono_propietario: '',
    correo_electronico_propietario: '',
    es_activo_propietario: true
  });

  // ✨ Estado para errores de validación
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const fetchData = async () => {
      if (isEditMode) {
        try {
          setLoading(true);
          const data = await propietarioService.getById(ci, controller.signal);
          
          if (isMounted) {
            setFormData({
              ci_propietario: data.ci_propietario,
              nombres_completo_propietario: data.nombres_completo_propietario,
              apellidos_completo_propietario: data.apellidos_completo_propietario,
              fecha_nacimiento_propietario: data.fecha_nacimiento_propietario,
              telefono_propietario: data.telefono_propietario,
              correo_electronico_propietario: data.correo_electronico_propietario,
              es_activo_propietario: data.es_activo_propietario
            });
          }
        } catch (error) {
          if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError') {
            console.log('Petición cancelada');
            return;
          }

          if (isMounted) {
            console.error('Error loading propietario:', error);
            toast.error('Error al cargar propietario');
            navigate('/propietarios');
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
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
      case 'ci_propietario':
        error = validateCI(value, true);
        break;
      case 'nombres_completo_propietario':
        error = validateText(value, 'Nombres', MAX_LENGTH.NOMBRES, true);
        break;
      case 'apellidos_completo_propietario':
        error = validateText(value, 'Apellidos', MAX_LENGTH.APELLIDOS, true);
        break;
      case 'telefono_propietario':
        error = validatePhone(value, true);
        break;
      case 'correo_electronico_propietario':
        error = validateEmail(value, true);
        break;
      case 'fecha_nacimiento_propietario':
        error = validateDate(value, 'Fecha de nacimiento', true, { notFuture: true });
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
    
    newErrors.ci_propietario = validateCI(formData.ci_propietario, true);
    newErrors.nombres_completo_propietario = validateText(formData.nombres_completo_propietario, 'Nombres', MAX_LENGTH.NOMBRES, true);
    newErrors.apellidos_completo_propietario = validateText(formData.apellidos_completo_propietario, 'Apellidos', MAX_LENGTH.APELLIDOS, true);
    newErrors.telefono_propietario = validatePhone(formData.telefono_propietario, true);
    newErrors.correo_electronico_propietario = validateEmail(formData.correo_electronico_propietario, true);
    newErrors.fecha_nacimiento_propietario = validateDate(formData.fecha_nacimiento_propietario, 'Fecha de nacimiento', true, { notFuture: true });

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
        await propietarioService.update(ci, formData);
        toast.success('Propietario actualizado exitosamente');
      } else {
        await propietarioService.create(formData);
        toast.success('Propietario creado exitosamente');
      }

      navigate('/propietarios');
    } catch (error) {
      console.error('Error saving propietario:', error);
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error(isEditMode ? 'Error al actualizar propietario' : 'Error al crear propietario');
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
      {/* ✨ Header con BackButton */}
      <div className="mb-6">
        <BackButton to="/propietarios" label="Volver a Propietarios" />
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
          {isEditMode ? 'Editar Propietario' : 'Nuevo Propietario'}
        </h1>
        <p className="text-gray-400 mt-1">
          {isEditMode ? 'Actualiza la información del propietario' : 'Completa el formulario para agregar un nuevo propietario'}
        </p>
      </div>

      {/* ✨ Form Card */}
      <FormCard>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Información Personal */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <UserIcon className="h-6 w-6 text-green-400" />
              <h2 className="text-xl font-semibold text-green-400">Información Personal</h2>
            </div>

            <div className="space-y-4">
              {/* CI */}
              <div>
                <label htmlFor="ci_propietario" className="block text-sm font-medium text-green-400 mb-2">
                  CI <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="ci_propietario"
                  name="ci_propietario"
                  value={formData.ci_propietario}
                  onChange={handleChange}
                  disabled={isEditMode}
                  maxLength={MAX_LENGTH.CI}
                  className={`w-full px-4 py-2.5 bg-gray-900/50 border rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 transition-all ${
                    isEditMode ? 'opacity-60 cursor-not-allowed border-gray-700 focus:ring-green-500/50 focus:border-green-500/50' : 
                    errors.ci_propietario ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500/50' : 'border-gray-700 focus:ring-green-500/50 focus:border-green-500/50'
                  }`}
                  placeholder="Ej: 12345678"
                />
                {!isEditMode && errors.ci_propietario && (
                  <p className="text-red-400 text-xs mt-1">⚠️ {errors.ci_propietario}</p>
                )}
                {!isEditMode && !errors.ci_propietario && (
                  <p className="text-gray-500 text-xs mt-1">
                    {formData.ci_propietario.length}/{MAX_LENGTH.CI} caracteres
                  </p>
                )}
                {isEditMode && (
                  <p className="text-sm text-gray-500 mt-1">La CI no se puede modificar</p>
                )}
              </div>

              {/* Nombres y Apellidos en grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nombres_completo_propietario" className="block text-sm font-medium text-green-400 mb-2">
                    Nombres <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="nombres_completo_propietario"
                    name="nombres_completo_propietario"
                    value={formData.nombres_completo_propietario}
                    onChange={handleChange}
                    maxLength={MAX_LENGTH.NOMBRES}
                    className={`w-full px-4 py-2.5 bg-gray-900/50 border rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 transition-all ${
                      errors.nombres_completo_propietario ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500/50' : 'border-gray-700 focus:ring-green-500/50 focus:border-green-500/50'
                    }`}
                    placeholder="Ej: Juan Carlos"
                  />
                  {errors.nombres_completo_propietario ? (
                    <p className="text-red-400 text-xs mt-1">⚠️ {errors.nombres_completo_propietario}</p>
                  ) : (
                    <p className="text-gray-500 text-xs mt-1">
                      {formData.nombres_completo_propietario.length}/{MAX_LENGTH.NOMBRES} caracteres
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="apellidos_completo_propietario" className="block text-sm font-medium text-green-400 mb-2">
                    Apellidos <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="apellidos_completo_propietario"
                    name="apellidos_completo_propietario"
                    value={formData.apellidos_completo_propietario}
                    onChange={handleChange}
                    maxLength={MAX_LENGTH.APELLIDOS}
                    className={`w-full px-4 py-2.5 bg-gray-900/50 border rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 transition-all ${
                      errors.apellidos_completo_propietario ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500/50' : 'border-gray-700 focus:ring-green-500/50 focus:border-green-500/50'
                    }`}
                    placeholder="Ej: Pérez González"
                  />
                  {errors.apellidos_completo_propietario ? (
                    <p className="text-red-400 text-xs mt-1">⚠️ {errors.apellidos_completo_propietario}</p>
                  ) : (
                    <p className="text-gray-500 text-xs mt-1">
                      {formData.apellidos_completo_propietario.length}/{MAX_LENGTH.APELLIDOS} caracteres
                    </p>
                  )}
                </div>
              </div>

              {/* Fecha de Nacimiento */}
              <div>
                <label htmlFor="fecha_nacimiento_propietario" className="block text-sm font-medium text-green-400 mb-2">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Fecha de Nacimiento <span className="text-red-400">*</span>
                  </div>
                </label>
                <input
                  type="date"
                  id="fecha_nacimiento_propietario"
                  name="fecha_nacimiento_propietario"
                  value={formData.fecha_nacimiento_propietario}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-gray-900/50 border rounded-lg text-gray-200 focus:ring-2 transition-all ${
                    errors.fecha_nacimiento_propietario ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500/50' : 'border-gray-700 focus:ring-green-500/50 focus:border-green-500/50'
                  }`}
                />
                {errors.fecha_nacimiento_propietario && (
                  <p className="text-red-400 text-xs mt-1">⚠️ {errors.fecha_nacimiento_propietario}</p>
                )}
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <PhoneIcon className="h-6 w-6 text-green-400" />
              <h2 className="text-xl font-semibold text-green-400">Información de Contacto</h2>
            </div>

            <div className="space-y-4">
              {/* Teléfono */}
              <div>
                <label htmlFor="telefono_propietario" className="block text-sm font-medium text-green-400 mb-2">
                  Teléfono <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  id="telefono_propietario"
                  name="telefono_propietario"
                  value={formData.telefono_propietario}
                  onChange={handleChange}
                  maxLength={MAX_LENGTH.TELEFONO}
                  className={`w-full px-4 py-2.5 bg-gray-900/50 border rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 transition-all ${
                    errors.telefono_propietario ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500/50' : 'border-gray-700 focus:ring-green-500/50 focus:border-green-500/50'
                  }`}
                  placeholder="Ej: 099123456"
                />
                {errors.telefono_propietario ? (
                  <p className="text-red-400 text-xs mt-1">⚠️ {errors.telefono_propietario}</p>
                ) : (
                  <p className="text-gray-500 text-xs mt-1">
                    {formData.telefono_propietario.length}/{MAX_LENGTH.TELEFONO} caracteres
                  </p>
                )}
              </div>

              {/* Correo Electrónico */}
              <div>
                <label htmlFor="correo_electronico_propietario" className="block text-sm font-medium text-green-400 mb-2">
                  <div className="flex items-center gap-2">
                    <EnvelopeIcon className="h-4 w-4" />
                    Correo Electrónico <span className="text-red-400">*</span>
                  </div>
                </label>
                <input
                  type="email"
                  id="correo_electronico_propietario"
                  name="correo_electronico_propietario"
                  value={formData.correo_electronico_propietario}
                  onChange={handleChange}
                  maxLength={MAX_LENGTH.EMAIL}
                  className={`w-full px-4 py-2.5 bg-gray-900/50 border rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 transition-all ${
                    errors.correo_electronico_propietario ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500/50' : 'border-gray-700 focus:ring-green-500/50 focus:border-green-500/50'
                  }`}
                  placeholder="Ej: propietario@example.com"
                />
                {errors.correo_electronico_propietario ? (
                  <p className="text-red-400 text-xs mt-1">⚠️ {errors.correo_electronico_propietario}</p>
                ) : (
                  <p className="text-gray-500 text-xs mt-1">
                    {formData.correo_electronico_propietario.length}/{MAX_LENGTH.EMAIL} caracteres
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Estado Activo */}
          <div className="flex items-center space-x-3 p-4 bg-gray-900/30 border border-gray-700/50 rounded-lg">
            <input
              type="checkbox"
              id="es_activo_propietario"
              name="es_activo_propietario"
              checked={formData.es_activo_propietario}
              onChange={handleChange}
              className="h-5 w-5 text-green-500 bg-gray-900 border-gray-600 rounded focus:ring-2 focus:ring-green-500/50"
            />
            <label htmlFor="es_activo_propietario" className="text-sm text-gray-300 font-medium cursor-pointer">
              Propietario activo
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Guardando...' : isEditMode ? 'Actualizar Propietario' : 'Crear Propietario'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/propietarios')}
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

export default PropietarioForm;
