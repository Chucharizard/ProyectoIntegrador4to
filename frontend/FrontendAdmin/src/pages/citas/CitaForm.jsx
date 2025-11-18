import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeftIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import citaVisitaService from '../../services/citaVisitaService';
import propiedadService from '../../services/propiedadService';
import clienteService from '../../services/clienteService';
import usuarioService from '../../services/usuarioService';

const CitaForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditMode);
  
  // Opciones para selects
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
        propiedadService.getAll(),
        clienteService.getAll(),
        usuarioService.getAll()
      ]);

      // Filtrar solo propiedades disponibles (no cerradas)
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
      
      // Formatear fecha para input datetime-local
      let fechaFormateada = '';
      if (data.fecha_visita_cita) {
        const fecha = new Date(data.fecha_visita_cita);
        // Convertir a formato YYYY-MM-DDTHH:mm
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
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.id_propiedad) {
      newErrors.id_propiedad = 'La propiedad es obligatoria';
    }

    if (!formData.ci_cliente) {
      newErrors.ci_cliente = 'El cliente es obligatorio';
    }

    if (!formData.fecha_visita_cita) {
      newErrors.fecha_visita_cita = 'La fecha y hora son obligatorias';
    } else {
      // Validar que la fecha no sea en el pasado (solo para crear)
      if (!isEditMode) {
        const fechaSeleccionada = new Date(formData.fecha_visita_cita);
        const ahora = new Date();
        if (fechaSeleccionada < ahora) {
          newErrors.fecha_visita_cita = 'La fecha no puede ser en el pasado';
        }
      }
    }

    if (!formData.lugar_encuentro_cita.trim()) {
      newErrors.lugar_encuentro_cita = 'El lugar de encuentro es obligatorio';
    }

    if (!formData.estado_cita) {
      newErrors.estado_cita = 'El estado es obligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor corrija los errores del formulario');
      return;
    }

    try {
      setLoading(true);

      // Preparar datos para envío
      const dataToSend = {
        ...formData,
        recordatorio_minutos_cita: parseInt(formData.recordatorio_minutos_cita) || 30
      };

      // Convertir fecha a formato ISO con timezone
      if (dataToSend.fecha_visita_cita) {
        // Crear objeto Date desde el input datetime-local
        const fechaLocal = new Date(dataToSend.fecha_visita_cita);
        // Convertir a formato ISO 8601 completo con timezone
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/citas')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Volver a Citas
        </button>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-900 to-primary-700 bg-clip-text text-transparent flex items-center gap-3">
          <CalendarDaysIcon className="h-8 w-8 text-primary-700" />
          {isEditMode ? 'Editar Cita' : 'Nueva Cita de Visita'}
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-8 space-y-6">
        
        {/* Sección: Información de la Visita */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-secondary-500">
            Información de la Visita
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Propiedad */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Propiedad <span className="text-red-500">*</span>
              </label>
              <select
                name="id_propiedad"
                value={formData.id_propiedad}
                onChange={handleChange}
                className={`input-field ${errors.id_propiedad ? 'border-red-500' : ''}`}
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
                <p className="mt-1 text-sm text-red-600">{errors.id_propiedad}</p>
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
                className={`input-field ${errors.ci_cliente ? 'border-red-500' : ''}`}
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
                <p className="mt-1 text-sm text-red-600">{errors.ci_cliente}</p>
              )}
            </div>

            {/* Asesor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asesor Asignado
              </label>
              <select
                name="id_usuario_asesor"
                value={formData.id_usuario_asesor}
                onChange={handleChange}
                className="input-field"
                disabled={loading}
              >
                <option value="">Asignar automáticamente</option>
                {usuarios.map(usuario => (
                  <option key={usuario.id_usuario} value={usuario.id_usuario}>
                    {usuario.nombre_usuario}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Si no se asigna, el sistema asignará automáticamente
              </p>
            </div>

            {/* Fecha y Hora */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha y Hora <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="fecha_visita_cita"
                value={formData.fecha_visita_cita}
                onChange={handleChange}
                className={`input-field ${errors.fecha_visita_cita ? 'border-red-500' : ''}`}
                disabled={loading}
              />
              {errors.fecha_visita_cita && (
                <p className="mt-1 text-sm text-red-600">{errors.fecha_visita_cita}</p>
              )}
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado <span className="text-red-500">*</span>
              </label>
              <select
                name="estado_cita"
                value={formData.estado_cita}
                onChange={handleChange}
                className={`input-field ${errors.estado_cita ? 'border-red-500' : ''}`}
                disabled={loading}
              >
                <option value="Programada">Programada</option>
                <option value="Realizada">Realizada</option>
                <option value="Cancelada">Cancelada</option>
                <option value="Reprogramada">Reprogramada</option>
              </select>
              {errors.estado_cita && (
                <p className="mt-1 text-sm text-red-600">{errors.estado_cita}</p>
              )}
            </div>

            {/* Lugar de Encuentro */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lugar de Encuentro <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="lugar_encuentro_cita"
                value={formData.lugar_encuentro_cita}
                onChange={handleChange}
                placeholder="Ej: Frente a la propiedad, Av. Principal #123"
                className={`input-field ${errors.lugar_encuentro_cita ? 'border-red-500' : ''}`}
                disabled={loading}
              />
              {errors.lugar_encuentro_cita && (
                <p className="mt-1 text-sm text-red-600">{errors.lugar_encuentro_cita}</p>
              )}
            </div>

            {/* Recordatorio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recordatorio (minutos antes)
              </label>
              <input
                type="number"
                name="recordatorio_minutos_cita"
                value={formData.recordatorio_minutos_cita}
                onChange={handleChange}
                min="0"
                step="5"
                className="input-field"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500">
                Tiempo antes de la cita para enviar recordatorio
              </p>
            </div>

            {/* Notas */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas / Observaciones
              </label>
              <textarea
                name="nota_cita"
                value={formData.nota_cita}
                onChange={handleChange}
                rows="4"
                placeholder="Agregue notas adicionales sobre la visita..."
                className="input-field resize-none"
                disabled={loading}
              />
            </div>

          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-6 border-t">
          <button
            type="button"
            onClick={() => navigate('/citas')}
            className="btn-outline flex-1"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary flex-1"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Guardando...
              </>
            ) : (
              <>{isEditMode ? 'Actualizar Cita' : 'Crear Cita'}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CitaForm;
