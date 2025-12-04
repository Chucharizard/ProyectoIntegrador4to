import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import contratoService from '../../services/contratoService';
import propiedadService from '../../services/propiedadService';
import clienteService from '../../services/clienteService';
import usuarioService from '../../services/usuarioService';
import BackButton from '../../components/shared/BackButton';
import FormCard from '../../components/shared/FormCard';

// ✨ Importar validaciones
import {
  validateText,
  validateDecimal,
  validateDate,
  MAX_LENGTH,
  NUMERIC_LIMITS,
  sanitizeString
} from '../../utils/validations';

function ContratoForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);

  // Datos para los selects
  const [propiedades, setPropiedades] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  // Datos del formulario
  const [formData, setFormData] = useState({
    id_propiedad: '',
    ci_cliente: '',
    id_usuario_colocador: '',
    tipo_operacion_contrato: '',
    estado_contrato: 'Borrador',
    modalidad_pago_contrato: '',
    precio_cierre_contrato: '',
    fecha_inicio_contrato: '',
    fecha_fin_contrato: '',
    fecha_cierre_contrato: '',
    observaciones_contrato: ''
  });

  // Validaciones
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        setLoadingData(true);
        setError(null);

        // Cargar datos para los selects en paralelo
        const [propiedadesData, clientesData, usuariosData] = await Promise.all([
          propiedadService.getAllSimple(controller.signal),
          clienteService.getAllSimple(controller.signal),
          usuarioService.getAll(controller.signal)
        ]);

        if (!isMounted) return;

        // Filtrar solo propiedades que NO están cerradas (disponibles para contrato)
        const propiedadesDisponibles = propiedadesData.filter(
          prop => prop.estado_propiedad !== 'Cerrada'
        );

        setPropiedades(propiedadesDisponibles);
        setClientes(clientesData);
        setUsuarios(usuariosData);

        // Si estamos editando, cargar los datos del contrato
        if (isEditing) {
          const contratoData = await contratoService.getById(id, controller.signal);
          if (isMounted) {
            // Formatear las fechas para los inputs tipo date
            const formattedData = {
              ...contratoData,
              fecha_inicio_contrato: contratoData.fecha_inicio_contrato 
                ? contratoData.fecha_inicio_contrato.split('T')[0] 
                : '',
              fecha_fin_contrato: contratoData.fecha_fin_contrato 
                ? contratoData.fecha_fin_contrato.split('T')[0] 
                : '',
              fecha_cierre_contrato: contratoData.fecha_cierre_contrato 
                ? contratoData.fecha_cierre_contrato.split('T')[0] 
                : ''
            };
            setFormData(formattedData);
          }
        }
        
      } catch (err) {
        if (err.code === 'ERR_CANCELED') {
          return;
        }
        if (isMounted) {
          console.error('Error al cargar datos:', err);
          setError('Error al cargar los datos necesarios. Por favor, intente nuevamente.');
        }
      } finally {
        if (isMounted) {
          setLoadingData(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    // Sanitizar valores de texto/textarea
    const sanitizedValue = (type === 'text' || type === 'textarea') 
      ? sanitizeString(value) 
      : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));

    // ✨ Validar el campo en tiempo real (excepto select)
    if (type !== 'select-one' && type !== 'number') {
      validateField(name, sanitizedValue);
    }
  };

  // ✨ Validar campo individual
  const validateField = (fieldName, value) => {
    let error = null;

    switch (fieldName) {
      case 'precio_cierre_contrato':
        error = validateDecimal(value, 'Precio de cierre', true, NUMERIC_LIMITS.PRECIO.min, NUMERIC_LIMITS.PRECIO.max, NUMERIC_LIMITS.PRECIO.decimals);
        break;
      case 'fecha_inicio_contrato':
        error = validateDate(value, 'Fecha de inicio', true);
        break;
      case 'fecha_fin_contrato':
        if (value) {
          error = validateDate(value, 'Fecha de fin', false);
          // Validar que sea posterior a fecha inicio
          if (!error && formData.fecha_inicio_contrato) {
            const fechaInicio = new Date(formData.fecha_inicio_contrato);
            const fechaFin = new Date(value);
            if (fechaFin <= fechaInicio) {
              error = 'La fecha de fin debe ser posterior a la fecha de inicio';
            }
          }
        }
        break;
      case 'fecha_cierre_contrato':
        if (value) {
          error = validateDate(value, 'Fecha de cierre', false);
        }
        break;
      case 'observaciones_contrato':
        error = validateText(value, 'Observaciones', MAX_LENGTH.OBSERVACIONES_CONTRATO, false);
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

    // Validar selects
    if (!formData.id_propiedad) {
      newErrors.id_propiedad = 'La propiedad es requerida';
    }
    if (!formData.ci_cliente) {
      newErrors.ci_cliente = 'El cliente es requerido';
    }
    if (!formData.id_usuario_colocador) {
      newErrors.id_usuario_colocador = 'El colocador es requerido';
    }
    if (!formData.tipo_operacion_contrato) {
      newErrors.tipo_operacion_contrato = 'El tipo de operación es requerido';
    }
    if (!formData.estado_contrato) {
      newErrors.estado_contrato = 'El estado es requerido';
    }
    if (!formData.modalidad_pago_contrato) {
      newErrors.modalidad_pago_contrato = 'La modalidad de pago es requerida';
    }

    // Validar campos con funciones
    newErrors.precio_cierre_contrato = validateDecimal(formData.precio_cierre_contrato, 'Precio de cierre', true, NUMERIC_LIMITS.PRECIO.min, NUMERIC_LIMITS.PRECIO.max, NUMERIC_LIMITS.PRECIO.decimals);
    newErrors.fecha_inicio_contrato = validateDate(formData.fecha_inicio_contrato, 'Fecha de inicio', true);
    
    if (formData.fecha_fin_contrato) {
      newErrors.fecha_fin_contrato = validateDate(formData.fecha_fin_contrato, 'Fecha de fin', false);
    }
    if (formData.fecha_cierre_contrato) {
      newErrors.fecha_cierre_contrato = validateDate(formData.fecha_cierre_contrato, 'Fecha de cierre', false);
    }
    newErrors.observaciones_contrato = validateText(formData.observaciones_contrato, 'Observaciones', MAX_LENGTH.OBSERVACIONES_CONTRATO, false);

    // Validación específica: Alquiler requiere fecha de fin
    if (formData.tipo_operacion_contrato === 'Alquiler' && !formData.fecha_fin_contrato) {
      newErrors.fecha_fin_contrato = 'La fecha de fin es requerida para contratos de Alquiler';
    }

    // Validación: fecha_fin debe ser posterior a fecha_inicio
    if (formData.fecha_inicio_contrato && formData.fecha_fin_contrato && !newErrors.fecha_fin_contrato) {
      const fechaInicio = new Date(formData.fecha_inicio_contrato);
      const fechaFin = new Date(formData.fecha_fin_contrato);
      if (fechaFin <= fechaInicio) {
        newErrors.fecha_fin_contrato = 'La fecha de fin debe ser posterior a la fecha de inicio';
      }
    }

    // Validación: Tipo de operación debe coincidir con el tipo de la propiedad
    if (formData.id_propiedad && formData.tipo_operacion_contrato) {
      const propiedadSeleccionada = propiedades.find(p => p.id_propiedad === formData.id_propiedad);
      if (propiedadSeleccionada) {
        const tipoPropiedad = propiedadSeleccionada.tipo_operacion_propiedad;
        
        // Validación de compatibilidad
        const tiposCompatibles = {
          'Venta': ['Venta'],
          'Alquiler': ['Alquiler'],
          'Anticrético': ['Anticrético'],
          'Traspaso': ['Traspaso'],
          'Venta/Alquiler': ['Venta', 'Alquiler'],
          'Venta/Anticrético': ['Venta', 'Anticrético']
        };

        const permitidos = tiposCompatibles[tipoPropiedad] || [];
        if (!permitidos.includes(formData.tipo_operacion_contrato)) {
          newErrors.tipo_operacion_contrato = `Esta propiedad solo permite: ${permitidos.join(', ')}`;
        }
      }
    }

    // Filtrar errores nulos
    const filteredErrors = Object.fromEntries(
      Object.entries(newErrors).filter(([_, error]) => error !== null && error !== undefined)
    );

    setErrors(filteredErrors);
    return Object.keys(filteredErrors).length === 0;
  };

  const validateForm = () => {
    // ✨ Usar la nueva función de validación
    return validateAllFields();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Preparar datos para enviar
      const dataToSend = {
        ...formData,
        precio_cierre_contrato: parseFloat(formData.precio_cierre_contrato)
      };

      // Convertir campos vacíos a null
      if (!dataToSend.fecha_fin_contrato) {
        dataToSend.fecha_fin_contrato = null;
      }
      if (!dataToSend.fecha_cierre_contrato) {
        dataToSend.fecha_cierre_contrato = null;
      }
      if (!dataToSend.observaciones_contrato) {
        dataToSend.observaciones_contrato = null;
      }
      if (!dataToSend.modalidad_pago_contrato) {
        dataToSend.modalidad_pago_contrato = null;
      }

      if (isEditing) {
        await contratoService.update(id, dataToSend);
      } else {
        await contratoService.create(dataToSend);
      }

      navigate('/contratos');
    } catch (err) {
      console.error('Error al guardar contrato:', err);
      const errorMessage = err.response?.data?.detail || 'Error al guardar el contrato. Por favor, verifique los datos.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <BackButton to="/contratos" />
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
          {isEditing ? 'Editar Contrato' : 'Nuevo Contrato'}
        </h1>
        <p className="text-gray-400 mt-1">
          {isEditing ? 'Modifique los datos del contrato' : 'Complete el formulario para crear un nuevo contrato'}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-gray-100">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información General */}
        <FormCard>
          <h2 className="text-xl font-semibold text-green-400 mb-4">Información General</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Propiedad */}
            <div>
              <label className="block text-sm font-medium text-green-400 mb-2">
                Propiedad <span className="text-red-400">*</span>
              </label>
              <select
                name="id_propiedad"
                value={formData.id_propiedad}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-gray-700/50 border rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.id_propiedad ? 'border-red-500' : 'border-gray-600'
                }`}
                disabled={isEditing} // No se puede cambiar la propiedad al editar
              >
                <option value="">Seleccione una propiedad</option>
                {propiedades.map(propiedad => (
                  <option key={propiedad.id_propiedad} value={propiedad.id_propiedad}>
                    {propiedad.titulo_propiedad} - {propiedad.tipo_operacion_propiedad}
                  </option>
                ))}
              </select>
              {errors.id_propiedad && (
                <p className="mt-1 text-sm text-red-400">{errors.id_propiedad}</p>
              )}
            </div>

            {/* Cliente */}
            <div>
              <label className="block text-sm font-medium text-green-400 mb-2">
                Cliente <span className="text-red-400">**</span>
              </label>
              <select
                name="ci_cliente"
                value={formData.ci_cliente}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-gray-700/50 border rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.ci_cliente ? 'border-red-500' : 'border-gray-600'
                }`}
              >
                <option value="">Seleccione un cliente</option>
                {clientes.map(cliente => (
                  <option key={cliente.ci_cliente} value={cliente.ci_cliente}>
                    {cliente.nombres_completo_cliente} {cliente.apellidos_completo_cliente} - CI: {cliente.ci_cliente}
                  </option>
                ))}
              </select>
              {errors.ci_cliente && (
                <p className="mt-1 text-sm text-red-400">{errors.ci_cliente}</p>
              )}
            </div>

            {/* Usuario Colocador */}
            <div>
              <label className="block text-sm font-medium text-green-400 mb-2">
                Colocador (Asesor) <span className="text-red-400">**</span>
              </label>
              <select
                name="id_usuario_colocador"
                value={formData.id_usuario_colocador}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-gray-700/50 border rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.id_usuario_colocador ? 'border-red-500' : 'border-gray-600'
                }`}
              >
                <option value="">Seleccione un colocador</option>
                {usuarios.map(usuario => (
                  <option key={usuario.id_usuario} value={usuario.id_usuario}>
                    {usuario.nombre_usuario}
                  </option>
                ))}
              </select>
              {errors.id_usuario_colocador && (
                <p className="mt-1 text-sm text-red-400">*{errors.id_usuario_colocador}</p>
              )}
            </div>
          </div>
        </FormCard>

        {/* Tipo y Estado */}
        <FormCard>
          <h2 className="text-xl font-semibold text-green-400 mb-4">Tipo y Estado</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tipo de Operación */}
            <div>
              <label className="block text-sm font-medium text-green-400 mb-2">
                Tipo de Operación <span className="text-red-400">**</span>
              </label>
              <select
                name="tipo_operacion_contrato"
                value={formData.tipo_operacion_contrato}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-gray-700/50 border rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.tipo_operacion_contrato ? 'border-red-500' : 'border-gray-600'
                }`}
              >
                <option value="">Seleccione un tipo</option>
                <option value="Venta">Venta</option>
                <option value="Alquiler">Alquiler</option>
                <option value="Anticrético">Anticrético</option>
                <option value="Traspaso">Traspaso</option>
              </select>
              {errors.tipo_operacion_contrato && (
                <p className="mt-1 text-sm text-red-400">*{errors.tipo_operacion_contrato}</p>
              )}
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-green-400 mb-2">
                Estado <span className="text-red-400">**</span>
              </label>
              <select
                name="estado_contrato"
                value={formData.estado_contrato}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-gray-700/50 border rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.estado_contrato ? 'border-red-500' : 'border-gray-600'
                }`}
              >
                <option value="Borrador">Borrador</option>
                <option value="Activo">Activo</option>
                <option value="Finalizado">Finalizado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
              {errors.estado_contrato && (
                <p className="mt-1 text-sm text-red-400">*{errors.estado_contrato}</p>
              )}
            </div>

            {/* Modalidad de Pago */}
            <div>
              <label className="block text-sm font-medium text-green-400 mb-2">
                Modalidad de Pago
              </label>
              <input
                type="text"
                name="modalidad_pago_contrato"
                value={formData.modalidad_pago_contrato}
                onChange={handleChange}
                placeholder="Ej: Contado, Cuotas, Mixto"
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </FormCard>

        {/* Montos y Fechas */}
        <FormCard>
          <h2 className="text-xl font-semibold text-green-400 mb-4">Montos y Fechas</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Precio de Cierre */}
            <div>
              <label className="block text-sm font-medium text-green-400 mb-2">
                Precio de Cierre (Bs.) <span className="text-red-400">**</span>
              </label>
              <input
                type="number"
                name="precio_cierre_contrato"
                value={formData.precio_cierre_contrato}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                className={`w-full px-4 py-2 bg-gray-700/50 border rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.precio_cierre_contrato ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {errors.precio_cierre_contrato && (
                <p className="mt-1 text-sm text-red-400">*{errors.precio_cierre_contrato}</p>
              )}
            </div>

            {/* Fecha de Inicio */}
            <div>
              <label className="block text-sm font-medium text-green-400 mb-2">
                Fecha de Inicio <span className="text-red-400">**</span>
              </label>
              <input
                type="date"
                name="fecha_inicio_contrato"
                value={formData.fecha_inicio_contrato}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-gray-700/50 border rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.fecha_inicio_contrato ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {errors.fecha_inicio_contrato && (
                <p className="mt-1 text-sm text-red-400">*{errors.fecha_inicio_contrato}</p>
              )}
            </div>

            {/* Fecha de Fin */}
            <div>
              <label className="block text-sm font-medium text-green-400 mb-2">
                Fecha de Fin {formData.tipo_operacion_contrato === 'Alquiler' && <span className="text-red-400">**</span>}
              </label>
              <input
                type="date"
                name="fecha_fin_contrato"
                value={formData.fecha_fin_contrato}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-gray-700/50 border rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.fecha_fin_contrato ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {errors.fecha_fin_contrato && (
                <p className="mt-1 text-sm text-red-400">*{errors.fecha_fin_contrato}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Requerida para contratos de Alquiler</p>
            </div>

            {/* Fecha de Cierre */}
            <div>
              <label className="block text-sm font-medium text-green-400 mb-2">
                Fecha de Cierre
              </label>
              <input
                type="date"
                name="fecha_cierre_contrato"
                value={formData.fecha_cierre_contrato}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">Fecha en que se firmó/cerró el contrato</p>
            </div>
          </div>
        </FormCard>

        {/* Observaciones */}
        <FormCard>
          <h2 className="text-xl font-semibold text-green-400 mb-4">Observaciones</h2>
          
          <div>
            <label className="block text-sm font-medium text-green-400 mb-2">
              Observaciones Adicionales
            </label>
            <textarea
              name="observaciones_contrato"
              value={formData.observaciones_contrato}
              onChange={handleChange}
              rows={4}
              placeholder="Ingrese observaciones o notas adicionales sobre el contrato..."
              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </FormCard>

        {/* Buttons */}
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => navigate('/contratos')}
            className="flex-1 bg-gray-700/50 text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-700 transition-all duration-300 font-medium border border-gray-600"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Guardando...' : (isEditing ? 'Actualizar Contrato' : 'Crear Contrato')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ContratoForm;
