import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { clienteService } from '../../services/clienteService';
import toast from 'react-hot-toast';
import { 
  UserIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  MapPinIcon, 
  CurrencyDollarIcon,
  TagIcon 
} from '@heroicons/react/24/outline';

// ✨ Importar componentes reutilizables
import BackButton from '../../components/shared/BackButton';
import FormCard from '../../components/shared/FormCard';

// ✨ Importar validaciones
import {
  validateCI,
  validateText,
  validatePhone,
  validateEmail,
  validateDecimal,
  MAX_LENGTH,
  NUMERIC_LIMITS,
  sanitizeString
} from '../../utils/validations';

const ClienteForm = () => {
  const navigate = useNavigate();
  const { ci } = useParams();
  const isEditing = Boolean(ci);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    ci_cliente: '',
    nombres_completo_cliente: '',
    apellidos_completo_cliente: '',
    telefono_cliente: '',
    correo_electronico_cliente: '',
    preferencia_zona_cliente: '',
    presupuesto_max_cliente: '',
    origen_cliente: '',
  });

  // ✨ Estado para errores de validación
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isEditing) return;

    const controller = new AbortController();
    let isMounted = true;

    const loadCliente = async () => {
      try {
        setLoading(true);
        const data = await clienteService.getById(ci, controller.signal);
        
        if (isMounted) {
          setFormData({
            ci_cliente: data.ci_cliente || '',
            nombres_completo_cliente: data.nombres_completo_cliente || '',
            apellidos_completo_cliente: data.apellidos_completo_cliente || '',
            telefono_cliente: data.telefono_cliente || '',
            correo_electronico_cliente: data.correo_electronico_cliente || '',
            preferencia_zona_cliente: data.preferencia_zona_cliente || '',
            presupuesto_max_cliente: data.presupuesto_max_cliente || '',
            origen_cliente: data.origen_cliente || '',
          });
        }
      } catch (error) {
        if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError') {
          return;
        }

        if (isMounted) {
          console.error('Error al cargar cliente:', error);
          toast.error('Error al cargar los datos del cliente');
          navigate('/clientes');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadCliente();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [ci, isEditing, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Sanitizar el valor
    const sanitizedValue = sanitizeString(value);
    
    setFormData((prev) => ({
      ...prev,
      [name]: sanitizedValue,
    }));

    // ✨ Validar el campo en tiempo real
    validateField(name, sanitizedValue);
  };

  // ✨ Validar campo individual
  const validateField = (fieldName, value) => {
    let error = null;

    switch (fieldName) {
      case 'ci_cliente':
        error = validateCI(value, true);
        break;
      case 'nombres_completo_cliente':
        error = validateText(value, 'Nombres', MAX_LENGTH.NOMBRES, true);
        break;
      case 'apellidos_completo_cliente':
        error = validateText(value, 'Apellidos', MAX_LENGTH.APELLIDOS, true);
        break;
      case 'telefono_cliente':
        error = validatePhone(value, false);
        break;
      case 'correo_electronico_cliente':
        error = validateEmail(value, false);
        break;
      case 'preferencia_zona_cliente':
        error = validateText(value, 'Zona preferida', MAX_LENGTH.PREFERENCIA_ZONA, false);
        break;
      case 'presupuesto_max_cliente':
        error = validateDecimal(value, 'Presupuesto', NUMERIC_LIMITS.PRECIO, false);
        break;
      case 'origen_cliente':
        error = validateText(value, 'Origen', MAX_LENGTH.ORIGEN, false);
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
    
    newErrors.ci_cliente = validateCI(formData.ci_cliente, true);
    newErrors.nombres_completo_cliente = validateText(formData.nombres_completo_cliente, 'Nombres', MAX_LENGTH.NOMBRES, true);
    newErrors.apellidos_completo_cliente = validateText(formData.apellidos_completo_cliente, 'Apellidos', MAX_LENGTH.APELLIDOS, true);
    newErrors.telefono_cliente = validatePhone(formData.telefono_cliente, false);
    newErrors.correo_electronico_cliente = validateEmail(formData.correo_electronico_cliente, false);
    newErrors.preferencia_zona_cliente = validateText(formData.preferencia_zona_cliente, 'Zona preferida', MAX_LENGTH.PREFERENCIA_ZONA, false);
    newErrors.presupuesto_max_cliente = validateDecimal(formData.presupuesto_max_cliente, 'Presupuesto', NUMERIC_LIMITS.PRECIO, false);
    newErrors.origen_cliente = validateText(formData.origen_cliente, 'Origen', MAX_LENGTH.ORIGEN, false);

    // Filtrar errores nulos
    const filteredErrors = Object.fromEntries(
      Object.entries(newErrors).filter(([_, error]) => error !== null)
    );

    setErrors(filteredErrors);
    return Object.keys(filteredErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✨ Validar todos los campos
    if (!validateAllFields()) {
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    try {
      setLoading(true);

      const dataToSend = {
        ...formData,
        telefono_cliente: formData.telefono_cliente || null,
        correo_electronico_cliente: formData.correo_electronico_cliente || null,
        preferencia_zona_cliente: formData.preferencia_zona_cliente || null,
        presupuesto_max_cliente: formData.presupuesto_max_cliente
          ? parseFloat(formData.presupuesto_max_cliente)
          : null,
        origen_cliente: formData.origen_cliente || null,
      };

      if (isEditing) {
        await clienteService.update(ci, dataToSend);
        toast.success('Cliente actualizado correctamente');
      } else {
        await clienteService.create(dataToSend);
        toast.success('Cliente creado correctamente');
      }

      navigate('/clientes');
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      toast.error(
        error.response?.data?.detail || 'Error al guardar el cliente'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
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
    <div className="max-w-4xl mx-auto">
      {/* ✨ Header con BackButton */}
      <div className="mb-6">
        <BackButton to="/clientes" label="Volver a Clientes" />
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
          {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
        </h1>
        <p className="text-gray-400 mt-1">
          {isEditing
            ? 'Modifica la información del cliente'
            : 'Completa los datos del nuevo cliente'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ✨ Información Personal - FormCard */}
        <FormCard>
          <div className="flex items-center gap-2 mb-4">
            <UserIcon className="h-6 w-6 text-green-400" />
            <h2 className="text-xl font-semibold text-green-400">Información Personal</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CI */}
            <div>
              <label className="block text-sm font-medium text-green-400 mb-2">
                CI <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="ci_cliente"
                value={formData.ci_cliente}
                onChange={handleChange}
                disabled={isEditing}
                maxLength={MAX_LENGTH.CI}
                className={`w-full px-4 py-2.5 bg-gray-900/50 border ${
                  errors.ci_cliente ? 'border-red-500' : 'border-gray-700'
                } rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all ${
                  isEditing ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                placeholder="Ej: 12345678 (solo números)"
                required
              />
              {errors.ci_cliente && (
                <p className="text-xs text-red-400 mt-1">{errors.ci_cliente}</p>
              )}
              {isEditing && !errors.ci_cliente && (
                <p className="text-xs text-gray-500 mt-1">
                  El CI no se puede modificar
                </p>
              )}
              {!isEditing && !errors.ci_cliente && (
                <p className="text-xs text-gray-500 mt-1">
                  {formData.ci_cliente.length}/{MAX_LENGTH.CI} caracteres
                </p>
              )}
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-green-400 mb-2">
                <div className="flex items-center gap-2">
                  <PhoneIcon className="h-4 w-4" />
                  Teléfono
                </div>
              </label>
              <input
                type="tel"
                name="telefono_cliente"
                value={formData.telefono_cliente}
                onChange={handleChange}
                maxLength={MAX_LENGTH.TELEFONO}
                className={`w-full px-4 py-2.5 bg-gray-900/50 border ${
                  errors.telefono_cliente ? 'border-red-500' : 'border-gray-700'
                } rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all`}
                placeholder="Ej: 70123456 (solo números)"
              />
              {errors.telefono_cliente && (
                <p className="text-xs text-red-400 mt-1">{errors.telefono_cliente}</p>
              )}
              {!errors.telefono_cliente && formData.telefono_cliente && (
                <p className="text-xs text-gray-500 mt-1">
                  {formData.telefono_cliente.length}/{MAX_LENGTH.TELEFONO} caracteres
                </p>
              )}
            </div>

            {/* Nombres */}
            <div>
              <label className="block text-sm font-medium text-green-400 mb-2">
                Nombres <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="nombres_completo_cliente"
                value={formData.nombres_completo_cliente}
                onChange={handleChange}
                maxLength={MAX_LENGTH.NOMBRES}
                className={`w-full px-4 py-2.5 bg-gray-900/50 border ${
                  errors.nombres_completo_cliente ? 'border-red-500' : 'border-gray-700'
                } rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all`}
                placeholder="Ej: Juan Carlos"
                required
              />
              {errors.nombres_completo_cliente && (
                <p className="text-xs text-red-400 mt-1">{errors.nombres_completo_cliente}</p>
              )}
              {!errors.nombres_completo_cliente && formData.nombres_completo_cliente && (
                <p className="text-xs text-gray-500 mt-1">
                  {formData.nombres_completo_cliente.length}/{MAX_LENGTH.NOMBRES} caracteres
                </p>
              )}
            </div>

            {/* Apellidos */}
            <div>
              <label className="block text-sm font-medium text-green-400 mb-2">
                Apellidos <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="apellidos_completo_cliente"
                value={formData.apellidos_completo_cliente}
                onChange={handleChange}
                maxLength={MAX_LENGTH.APELLIDOS}
                className={`w-full px-4 py-2.5 bg-gray-900/50 border ${
                  errors.apellidos_completo_cliente ? 'border-red-500' : 'border-gray-700'
                } rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all`}
                placeholder="Ej: Pérez García"
                required
              />
              {errors.apellidos_completo_cliente && (
                <p className="text-xs text-red-400 mt-1">{errors.apellidos_completo_cliente}</p>
              )}
              {!errors.apellidos_completo_cliente && formData.apellidos_completo_cliente && (
                <p className="text-xs text-gray-500 mt-1">
                  {formData.apellidos_completo_cliente.length}/{MAX_LENGTH.APELLIDOS} caracteres
                </p>
              )}
            </div>

            {/* Correo Electrónico */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-green-400 mb-2">
                <div className="flex items-center gap-2">
                  <EnvelopeIcon className="h-4 w-4" />
                  Correo Electrónico
                </div>
              </label>
              <input
                type="email"
                name="correo_electronico_cliente"
                value={formData.correo_electronico_cliente}
                onChange={handleChange}
                maxLength={MAX_LENGTH.EMAIL}
                className={`w-full px-4 py-2.5 bg-gray-900/50 border ${
                  errors.correo_electronico_cliente ? 'border-red-500' : 'border-gray-700'
                } rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all`}
                placeholder="Ej: juan.perez@email.com"
              />
              {errors.correo_electronico_cliente && (
                <p className="text-xs text-red-400 mt-1">{errors.correo_electronico_cliente}</p>
              )}
              {!errors.correo_electronico_cliente && formData.correo_electronico_cliente && (
                <p className="text-xs text-gray-500 mt-1">
                  {formData.correo_electronico_cliente.length}/{MAX_LENGTH.EMAIL} caracteres
                </p>
              )}
            </div>
          </div>
        </FormCard>

        {/* ✨ Preferencias - FormCard */}
        <FormCard>
          <div className="flex items-center gap-2 mb-4">
            <MapPinIcon className="h-6 w-6 text-green-400" />
            <h2 className="text-xl font-semibold text-green-400">Preferencias</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Zona Preferida */}
            <div>
              <label className="block text-sm font-medium text-green-400 mb-2">
                Zona Preferida
              </label>
              <input
                type="text"
                name="preferencia_zona_cliente"
                value={formData.preferencia_zona_cliente}
                onChange={handleChange}
                maxLength={MAX_LENGTH.PREFERENCIA_ZONA}
                className={`w-full px-4 py-2.5 bg-gray-900/50 border ${
                  errors.preferencia_zona_cliente ? 'border-red-500' : 'border-gray-700'
                } rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all`}
                placeholder="Ej: Zona Sur, Centro"
              />
              {errors.preferencia_zona_cliente && (
                <p className="text-xs text-red-400 mt-1">{errors.preferencia_zona_cliente}</p>
              )}
              {!errors.preferencia_zona_cliente && formData.preferencia_zona_cliente && (
                <p className="text-xs text-gray-500 mt-1">
                  {formData.preferencia_zona_cliente.length}/{MAX_LENGTH.PREFERENCIA_ZONA} caracteres
                </p>
              )}
            </div>

            {/* Presupuesto */}
            <div>
              <label className="block text-sm font-medium text-green-400 mb-2">
                <div className="flex items-center gap-2">
                  <CurrencyDollarIcon className="h-4 w-4" />
                  Presupuesto Máximo (Bs.)
                </div>
              </label>
              <input
                type="number"
                name="presupuesto_max_cliente"
                value={formData.presupuesto_max_cliente}
                onChange={handleChange}
                step="0.01"
                min={NUMERIC_LIMITS.PRECIO.min}
                max={NUMERIC_LIMITS.PRECIO.max}
                className={`w-full px-4 py-2.5 bg-gray-900/50 border ${
                  errors.presupuesto_max_cliente ? 'border-red-500' : 'border-gray-700'
                } rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all`}
                placeholder="Ej: 150000"
              />
              {errors.presupuesto_max_cliente && (
                <p className="text-xs text-red-400 mt-1">{errors.presupuesto_max_cliente}</p>
              )}
              {!errors.presupuesto_max_cliente && (
                <p className="text-xs text-gray-500 mt-1">
                  Monto entre {NUMERIC_LIMITS.PRECIO.min} y {NUMERIC_LIMITS.PRECIO.max.toLocaleString()} Bs.
                </p>
              )}
            </div>

            {/* Origen */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-green-400 mb-2">
                <div className="flex items-center gap-2">
                  <TagIcon className="h-4 w-4" />
                  Origen/Fuente
                </div>
              </label>
              <select
                name="origen_cliente"
                value={formData.origen_cliente}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 bg-gray-900/50 border ${
                  errors.origen_cliente ? 'border-red-500' : 'border-gray-700'
                } rounded-lg text-gray-200 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all`}
              >
                <option value="">Seleccionar...</option>
                <option value="Referido">Referido</option>
                <option value="Redes Sociales">Redes Sociales</option>
                <option value="Sitio Web">Sitio Web</option>
                <option value="Llamada Directa">Llamada Directa</option>
                <option value="Oficina">Oficina</option>
                <option value="Otro">Otro</option>
              </select>
              {errors.origen_cliente && (
                <p className="text-xs text-red-400 mt-1">{errors.origen_cliente}</p>
              )}
            </div>
          </div>
        </FormCard>

        {/* Botones */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Guardando...</span>
              </>
            ) : (
              <span>{isEditing ? 'Actualizar' : 'Crear'} Cliente</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/clientes')}
            className="flex-1 bg-gray-700/50 text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-700 transition-all duration-300 font-medium border border-gray-600"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClienteForm;
