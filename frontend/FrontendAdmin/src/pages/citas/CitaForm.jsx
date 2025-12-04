import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import citaVisitaService from '../../services/citaVisitaService';
import propiedadService from '../../services/propiedadService';
import clienteService from '../../services/clienteService';
import usuarioService from '../../services/usuarioService';

// ✨ Importar componentes reutilizables
import BackButton from '../../components/shared/BackButton';
import FormCard from '../../components/shared/FormCard';

// ✨ Importar validaciones
import {
  validateText,
  validateDate,
  validateInteger,
  MAX_LENGTH,
  sanitizeString
} from '../../utils/validations';

const CitaForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditMode);
  
  const [propiedades, setPropiedades] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  const [formData, setFormData] = useState({
    id_propiedad: '',
    ci_cliente: '',
    id_usuario_asesor: '',
    fecha_visita_cita: '',
    lugar_encuentro_cita: '',
    estado_cita: 'Programada',
    nota_cita: '',
    recordatorio_minutos_cita: 30
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadOptions();
    if (isEditMode) {
      loadCita();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode]);

  const loadOptions = async () => {
    try {
      const [propiedadesData, clientesData, usuariosData] = await Promise.all([
        propiedadService.getAllSimple(),
        clienteService.getAllSimple(),
        usuarioService.getAll()
      ]);

      const propiedadesDisponibles = propiedadesData.filter(
        p => p.estado_propiedad !== 'Cerrada'
      );

      setPropiedades(propiedadesDisponibles);
      setClientes(clientesData);
      setUsuarios(usuariosData);
    } catch (error) {
      console.error('Error al cargar opciones:', error);
      toast.error('Error al cargar las opciones del formulario');
    }
  };

  const loadCita = async () => {
    try {
      setLoadingData(true);
      const data = await citaVisitaService.getById(id);
      
      let fechaFormateada = '';
      if (data.fecha_visita_cita) {
        const fecha = new Date(data.fecha_visita_cita);
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const day = String(fecha.getDate()).padStart(2, '0');
        const hours = String(fecha.getHours()).padStart(2, '0');
        const minutes = String(fecha.getMinutes()).padStart(2, '0');
        fechaFormateada = `${year}-${month}-${day}T${hours}:${minutes}`;
      }

      setFormData({
        id_propiedad: data.id_propiedad || '',
        ci_cliente: data.ci_cliente || '',
        id_usuario_asesor: data.id_usuario_asesor || '',
        fecha_visita_cita: fechaFormateada,
        lugar_encuentro_cita: data.lugar_encuentro_cita || '',
        estado_cita: data.estado_cita || 'Programada',
        nota_cita: data.nota_cita || '',
        recordatorio_minutos_cita: data.recordatorio_minutos_cita || 30
      });
    } catch (error) {
      console.error('Error al cargar cita:', error);
      toast.error('Error al cargar los datos de la cita');
      navigate('/citas');
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    // Sanitizar el valor para campos de texto
    const sanitizedValue = type === 'text' || type === 'textarea' 
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
      case 'fecha_visita_cita':
        error = validateDate(value, 'Fecha de visita', true, { notPast: !isEditMode });
        break;
      case 'lugar_encuentro_cita':
        error = validateText(value, 'Lugar de encuentro', MAX_LENGTH.LUGAR_ENCUENTRO, true);
        break;
      case 'nota_cita':
        error = validateText(value, 'Nota', MAX_LENGTH.NOTA_CITA, false);
        break;
      case 'recordatorio_minutos_cita':
        error = validateInteger(value, 'Recordatorio', false, 0, 1440);
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
      newErrors.id_propiedad = 'La propiedad es obligatoria';
    }
    if (!formData.ci_cliente) {
      newErrors.ci_cliente = 'El cliente es obligatorio';
    }
    if (!formData.estado_cita) {
      newErrors.estado_cita = 'El estado es obligatorio';
    }

    // Validar campos con funciones
    newErrors.fecha_visita_cita = validateDate(formData.fecha_visita_cita, 'Fecha de visita', true, { notPast: !isEditMode });
    newErrors.lugar_encuentro_cita = validateText(formData.lugar_encuentro_cita, 'Lugar de encuentro', MAX_LENGTH.LUGAR_ENCUENTRO, true);
    newErrors.nota_cita = validateText(formData.nota_cita, 'Nota', MAX_LENGTH.NOTA_CITA, false);
    newErrors.recordatorio_minutos_cita = validateInteger(formData.recordatorio_minutos_cita, 'Recordatorio', 0, 1440, false);

    // Filtrar errores nulos
    const filteredErrors = Object.fromEntries(
      Object.entries(newErrors).filter(([_, error]) => error !== null && error !== undefined)
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
      toast.error('Por favor corrija los errores del formulario');
      return;
    }

    try {
      setLoading(true);

      const dataToSend = {
        ...formData,
        recordatorio_minutos_cita: parseInt(formData.recordatorio_minutos_cita) || 30
      };

      if (dataToSend.fecha_visita_cita) {
        const fechaLocal = new Date(dataToSend.fecha_visita_cita);
        dataToSend.fecha_visita_cita = fechaLocal.toISOString();
      }

      if (isEditMode) {
        await citaVisitaService.update(id, dataToSend);
        toast.success('Cita actualizada exitosamente');
      } else {
        await citaVisitaService.create(dataToSend);
        toast.success('Cita creada exitosamente');
      }

      navigate('/citas');
    } catch (error) {
      console.error('Error al guardar cita:', error);
      const errorMessage = error.response?.data?.detail || 'Error al guardar la cita';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
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
        <BackButton to="/citas" label="Volver a Citas" />
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent flex items-center gap-3">
          <CalendarDaysIcon className="h-8 w-8 text-green-400" />
          {isEditMode ? 'Editar Cita' : 'Nueva Cita de Visita'}
        </h1>
      </div>

      {/* ✨ Form Card */}
      <FormCard>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Título de Sección */}
          <div>
            <h2 className="text-xl font-semibold text-green-400 mb-4 pb-2 border-b-2 border-green-500/30">
              Información de la Visita
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Propiedad */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-green-400 mb-2">
                  Propiedad <span className="text-red-400">*</span>
                </label>
                <select
                  name="id_propiedad"
                  value={formData.id_propiedad}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-gray-900/50 border ${errors.id_propiedad ? 'border-red-500' : 'border-gray-700'} rounded-lg text-gray-200 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all`}
                  disabled={loading}
                >
                  <option value="">Seleccione una propiedad</option>
                  {propiedades.map(propiedad => (
                    <option key={propiedad.id_propiedad} value={propiedad.id_propiedad}>
                      {propiedad.codigo_publico_propiedad} - {propiedad.titulo_propiedad} 
                      ({propiedad.tipo_operacion_propiedad})
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
                  Cliente <span className="text-red-400">*</span>
                </label>
                <select
                  name="ci_cliente"
                  value={formData.ci_cliente}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-gray-900/50 border ${errors.ci_cliente ? 'border-red-500' : 'border-gray-700'} rounded-lg text-gray-200 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all`}
                  disabled={loading}
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

              {/* Asesor */}
              <div>
                <label className="block text-sm font-medium text-green-400 mb-2">
                  Asesor Asignado
                </label>
                <select
                  name="id_usuario_asesor"
                  value={formData.id_usuario_asesor}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                  disabled={loading}
                >
                  <option value="">Asignar automáticamente</option>
                  {usuarios.map(usuario => (
                    <option key={usuario.id_usuario} value={usuario.id_usuario}>
                      {usuario.nombre_usuario}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-400">
                  Si no se asigna, el sistema asignará automáticamente
                </p>
              </div>

              {/* Fecha y Hora */}
              <div>
                <label className="block text-sm font-medium text-green-400 mb-2">
                  Fecha y Hora <span className="text-red-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="fecha_visita_cita"
                  value={formData.fecha_visita_cita}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-gray-900/50 border ${errors.fecha_visita_cita ? 'border-red-500' : 'border-gray-700'} rounded-lg text-gray-200 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all`}
                  disabled={loading}
                />
                {errors.fecha_visita_cita && (
                  <p className="mt-1 text-sm text-red-400">{errors.fecha_visita_cita}</p>
                )}
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-green-400 mb-2">
                  Estado <span className="text-red-400">*</span>
                </label>
                <select
                  name="estado_cita"
                  value={formData.estado_cita}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-gray-900/50 border ${errors.estado_cita ? 'border-red-500' : 'border-gray-700'} rounded-lg text-gray-200 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all`}
                  disabled={loading}
                >
                  <option value="Programada">Programada</option>
                  <option value="Realizada">Realizada</option>
                  <option value="Cancelada">Cancelada</option>
                  <option value="Reprogramada">Reprogramada</option>
                </select>
                {errors.estado_cita && (
                  <p className="mt-1 text-sm text-red-400">{errors.estado_cita}</p>
                )}
              </div>

              {/* Lugar de Encuentro */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-green-400 mb-2">
                  Lugar de Encuentro <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="lugar_encuentro_cita"
                  value={formData.lugar_encuentro_cita}
                  onChange={handleChange}
                  maxLength={MAX_LENGTH.LUGAR_ENCUENTRO}
                  placeholder="Ej: Frente a la propiedad, Av. Principal #123"
                  className={`w-full px-4 py-2.5 bg-gray-900/50 border ${errors.lugar_encuentro_cita ? 'border-red-500' : 'border-gray-700'} rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all`}
                  disabled={loading}
                />
                {errors.lugar_encuentro_cita ? (
                  <p className="mt-1 text-sm text-red-400">⚠️ {errors.lugar_encuentro_cita}</p>
                ) : (
                  <p className="mt-1 text-xs text-gray-400">
                    {formData.lugar_encuentro_cita.length}/{MAX_LENGTH.LUGAR_ENCUENTRO} caracteres
                  </p>
                )}
              </div>

              {/* Recordatorio */}
              <div>
                <label className="block text-sm font-medium text-green-400 mb-2">
                  Recordatorio (minutos antes)
                </label>
                <input
                  type="number"
                  name="recordatorio_minutos_cita"
                  value={formData.recordatorio_minutos_cita}
                  onChange={handleChange}
                  min="0"
                  max="1440"
                  step="5"
                  className={`w-full px-4 py-2.5 bg-gray-900/50 border rounded-lg text-gray-200 focus:ring-2 transition-all ${
                    errors.recordatorio_minutos_cita ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500/50' : 'border-gray-700 focus:ring-green-500/50 focus:border-green-500/50'
                  }`}
                  disabled={loading}
                />
                {errors.recordatorio_minutos_cita ? (
                  <p className="mt-1 text-sm text-red-400">⚠️ {errors.recordatorio_minutos_cita}</p>
                ) : (
                  <p className="mt-1 text-xs text-gray-400">
                    Tiempo antes de la cita para enviar recordatorio (0-1440 min)
                  </p>
                )}
              </div>

              {/* Notas */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-green-400 mb-2">
                  Notas / Observaciones
                </label>
                <textarea
                  name="nota_cita"
                  value={formData.nota_cita}
                  onChange={handleChange}
                  maxLength={MAX_LENGTH.NOTA_CITA}
                  rows="4"
                  placeholder="Agregue notas adicionales sobre la visita..."
                  className={`w-full px-4 py-2.5 bg-gray-900/50 border rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 transition-all resize-none ${
                    errors.nota_cita ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500/50' : 'border-gray-700 focus:ring-green-500/50 focus:border-green-500/50'
                  }`}
                  disabled={loading}
                />
                {errors.nota_cita ? (
                  <p className="mt-1 text-sm text-red-400">⚠️ {errors.nota_cita}</p>
                ) : (
                  <p className="mt-1 text-xs text-gray-400">
                    {formData.nota_cita.length}/{MAX_LENGTH.NOTA_CITA} caracteres
                  </p>
                )}
              </div>

            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-700/50">
            <button
              type="button"
              onClick={() => navigate('/citas')}
              className="flex-1 bg-gray-700/50 text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-700 transition-all duration-300 font-medium border border-gray-600"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Guardando...
                </span>
              ) : (
                <>{isEditMode ? 'Actualizar Cita' : 'Crear Cita'}</>
              )}
            </button>
          </div>
        </form>
      </FormCard>
    </div>
  );
};

export default CitaForm;
