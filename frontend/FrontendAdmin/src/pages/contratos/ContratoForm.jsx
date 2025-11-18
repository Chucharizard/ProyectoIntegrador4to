import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import contratoService from '../../services/contratoService';
import propiedadService from '../../services/propiedadService';
import clienteService from '../../services/clienteService';
import usuarioService from '../../services/usuarioService';

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
          propiedadService.getAll(controller.signal),
          clienteService.getAll(controller.signal),
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
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error del campo al modificarlo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validaciones requeridas
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
    if (!formData.precio_cierre_contrato || formData.precio_cierre_contrato <= 0) {
      newErrors.precio_cierre_contrato = 'El precio de cierre debe ser mayor a 0';
    }
    if (!formData.fecha_inicio_contrato) {
      newErrors.fecha_inicio_contrato = 'La fecha de inicio es requerida';
    }

    // Validación específica: Alquiler requiere fecha de fin
    if (formData.tipo_operacion_contrato === 'Alquiler' && !formData.fecha_fin_contrato) {
      newErrors.fecha_fin_contrato = 'La fecha de fin es requerida para contratos de Alquiler';
    }

    // Validación: fecha_fin debe ser posterior a fecha_inicio
    if (formData.fecha_inicio_contrato && formData.fecha_fin_contrato) {
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Editar Contrato' : 'Nuevo Contrato'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEditing ? 'Modifique los datos del contrato' : 'Complete el formulario para crear un nuevo contrato'}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información General */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Información General</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Propiedad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Propiedad <span className="text-red-500">*</span>
              </label>
              <select
                name="id_propiedad"
                value={formData.id_propiedad}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.id_propiedad ? 'border-red-500' : 'border-gray-300'
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
                <p className="mt-1 text-sm text-red-500">{errors.id_propiedad}</p>
              )}
            </div>

            {/* Cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente <span className="text-red-500">*</span>
              </label>
              <select
                name="ci_cliente"
                value={formData.ci_cliente}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.ci_cliente ? 'border-red-500' : 'border-gray-300'
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
                <p className="mt-1 text-sm text-red-500">{errors.ci_cliente}</p>
              )}
            </div>

            {/* Usuario Colocador */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Colocador (Asesor) <span className="text-red-500">*</span>
              </label>
              <select
                name="id_usuario_colocador"
                value={formData.id_usuario_colocador}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.id_usuario_colocador ? 'border-red-500' : 'border-gray-300'
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
                <p className="mt-1 text-sm text-red-500">{errors.id_usuario_colocador}</p>
              )}
            </div>
          </div>
        </div>

        {/* Tipo y Estado */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Tipo y Estado</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tipo de Operación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Operación <span className="text-red-500">*</span>
              </label>
              <select
                name="tipo_operacion_contrato"
                value={formData.tipo_operacion_contrato}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.tipo_operacion_contrato ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccione un tipo</option>
                <option value="Venta">Venta</option>
                <option value="Alquiler">Alquiler</option>
                <option value="Anticrético">Anticrético</option>
                <option value="Traspaso">Traspaso</option>
              </select>
              {errors.tipo_operacion_contrato && (
                <p className="mt-1 text-sm text-red-500">{errors.tipo_operacion_contrato}</p>
              )}
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado <span className="text-red-500">*</span>
              </label>
              <select
                name="estado_contrato"
                value={formData.estado_contrato}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.estado_contrato ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="Borrador">Borrador</option>
                <option value="Activo">Activo</option>
                <option value="Finalizado">Finalizado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
              {errors.estado_contrato && (
                <p className="mt-1 text-sm text-red-500">{errors.estado_contrato}</p>
              )}
            </div>

            {/* Modalidad de Pago */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modalidad de Pago
              </label>
              <input
                type="text"
                name="modalidad_pago_contrato"
                value={formData.modalidad_pago_contrato}
                onChange={handleChange}
                placeholder="Ej: Contado, Cuotas, Mixto"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Montos y Fechas */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Montos y Fechas</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Precio de Cierre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio de Cierre (Bs.) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="precio_cierre_contrato"
                value={formData.precio_cierre_contrato}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.precio_cierre_contrato ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.precio_cierre_contrato && (
                <p className="mt-1 text-sm text-red-500">{errors.precio_cierre_contrato}</p>
              )}
            </div>

            {/* Fecha de Inicio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Inicio <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="fecha_inicio_contrato"
                value={formData.fecha_inicio_contrato}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.fecha_inicio_contrato ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.fecha_inicio_contrato && (
                <p className="mt-1 text-sm text-red-500">{errors.fecha_inicio_contrato}</p>
              )}
            </div>

            {/* Fecha de Fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Fin {formData.tipo_operacion_contrato === 'Alquiler' && <span className="text-red-500">*</span>}
              </label>
              <input
                type="date"
                name="fecha_fin_contrato"
                value={formData.fecha_fin_contrato}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.fecha_fin_contrato ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.fecha_fin_contrato && (
                <p className="mt-1 text-sm text-red-500">{errors.fecha_fin_contrato}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Requerida para contratos de Alquiler</p>
            </div>

            {/* Fecha de Cierre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Cierre
              </label>
              <input
                type="date"
                name="fecha_cierre_contrato"
                value={formData.fecha_cierre_contrato}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">Fecha en que se firmó/cerró el contrato</p>
            </div>
          </div>
        </div>

        {/* Observaciones */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Observaciones</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones Adicionales
            </label>
            <textarea
              name="observaciones_contrato"
              value={formData.observaciones_contrato}
              onChange={handleChange}
              rows={4}
              placeholder="Ingrese observaciones o notas adicionales sobre el contrato..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => navigate('/contratos')}
            className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </span>
            ) : (isEditing ? 'Actualizar Contrato' : 'Crear Contrato')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ContratoForm;
