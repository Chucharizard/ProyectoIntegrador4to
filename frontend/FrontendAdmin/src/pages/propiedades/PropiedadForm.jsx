import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { propiedadService } from '../../services/propiedadService';
import { propietarioService } from '../../services/propietarioService';
import { direccionService } from '../../services/direccionService';
import { ArrowLeftIcon, MapPinIcon, HomeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const PropiedadForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [propietarios, setPropietarios] = useState([]);
  
  const [formData, setFormData] = useState({
    // Datos básicos
    titulo_propiedad: '',
    codigo_publico_propiedad: '',
    descripcion_propiedad: '',
    ci_propietario: '',
    
    // Tipo y estado
    tipo_operacion_propiedad: '',
    estado_propiedad: 'Captada',
    
    // Precio y superficie
    precio_publicado_propiedad: '',
    superficie_propiedad: '',
    
    // Porcentajes
    porcentaje_captacion_propiedad: '',
    porcentaje_colocacion_propiedad: '',
    
    // Fechas
    fecha_captacion_propiedad: '',
    fecha_publicacion_propiedad: '',
    
    // Dirección (se creará automáticamente)
    calle_direccion: '',
    numero_calle_direccion: '',
    barrio_direccion: '',
    ciudad_direccion: '',
    departamento_direccion: '',
    codigo_postal_direccion: '',
    latitud_direccion: '',
    longitud_direccion: ''
  });

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);

        if (isEditMode) {
          // Modo edición: cargar propiedad, propietarios y dirección
          const [propiedadData, propietariosData] = await Promise.all([
            propiedadService.getById(id, controller.signal),
            propietarioService.getAll(controller.signal)
          ]);

          if (isMounted) {
            // Cargar dirección de la propiedad
            let direccionData = null;
            if (propiedadData.id_direccion) {
              direccionData = await direccionService.getById(propiedadData.id_direccion, controller.signal);
            }

            setFormData({
              titulo_propiedad: propiedadData.titulo_propiedad || '',
              codigo_publico_propiedad: propiedadData.codigo_publico_propiedad || '',
              descripcion_propiedad: propiedadData.descripcion_propiedad || '',
              ci_propietario: propiedadData.ci_propietario || '',
              tipo_operacion_propiedad: propiedadData.tipo_operacion_propiedad || '',
              estado_propiedad: propiedadData.estado_propiedad || 'Captada',
              precio_publicado_propiedad: propiedadData.precio_publicado_propiedad || '',
              superficie_propiedad: propiedadData.superficie_propiedad || '',
              porcentaje_captacion_propiedad: propiedadData.porcentaje_captacion_propiedad || '',
              porcentaje_colocacion_propiedad: propiedadData.porcentaje_colocacion_propiedad || '',
              fecha_captacion_propiedad: propiedadData.fecha_captacion_propiedad || '',
              fecha_publicacion_propiedad: propiedadData.fecha_publicacion_propiedad || '',
              
              // Dirección
              calle_direccion: direccionData?.calle_direccion || '',
              numero_calle_direccion: direccionData?.numero_calle_direccion || '',
              barrio_direccion: direccionData?.barrio_direccion || '',
              ciudad_direccion: direccionData?.ciudad_direccion || '',
              departamento_direccion: direccionData?.departamento_direccion || '',
              codigo_postal_direccion: direccionData?.codigo_postal_direccion || '',
              latitud_direccion: direccionData?.latitud_direccion || '',
              longitud_direccion: direccionData?.longitud_direccion || ''
            });
            setPropietarios(propietariosData);
          }
        } else {
          // Modo creación: solo cargar propietarios
          const propietariosData = await propietarioService.getAll(controller.signal);
          
          if (isMounted) {
            setPropietarios(propietariosData);
          }
        }
      } catch (error) {
        if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError') {
          console.log('✅ Petición cancelada correctamente');
          return;
        }

        if (isMounted) {
          console.error('❌ Error loading data:', error);
          toast.error('Error al cargar datos');
          navigate('/propiedades');
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
  }, [id, isEditMode, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.titulo_propiedad.trim()) {
      toast.error('El título es obligatorio');
      return false;
    }
    if (!formData.ci_propietario) {
      toast.error('Debes seleccionar un propietario');
      return false;
    }
    if (!formData.tipo_operacion_propiedad) {
      toast.error('Debes seleccionar el tipo de operación');
      return false;
    }
    if (!formData.calle_direccion.trim()) {
      toast.error('La calle es obligatoria');
      return false;
    }
    if (!formData.ciudad_direccion.trim()) {
      toast.error('La ciudad es obligatoria');
      return false;
    }
    if (!formData.departamento_direccion.trim()) {
      toast.error('El departamento es obligatorio');
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

      // Preparar objeto de dirección
      const direccionData = {
        calle_direccion: formData.calle_direccion,
        numero_calle_direccion: formData.numero_calle_direccion || null,
        barrio_direccion: formData.barrio_direccion || null,
        ciudad_direccion: formData.ciudad_direccion,
        departamento_direccion: formData.departamento_direccion,
        codigo_postal_direccion: formData.codigo_postal_direccion || null,
        latitud_direccion: formData.latitud_direccion ? parseFloat(formData.latitud_direccion) : null,
        longitud_direccion: formData.longitud_direccion ? parseFloat(formData.longitud_direccion) : null
      };

      // Preparar objeto de propiedad
      const propiedadData = {
        titulo_propiedad: formData.titulo_propiedad,
        codigo_publico_propiedad: formData.codigo_publico_propiedad || null,
        descripcion_propiedad: formData.descripcion_propiedad || null,
        ci_propietario: formData.ci_propietario,
        tipo_operacion_propiedad: formData.tipo_operacion_propiedad,
        estado_propiedad: formData.estado_propiedad,
        precio_publicado_propiedad: formData.precio_publicado_propiedad ? parseFloat(formData.precio_publicado_propiedad) : null,
        superficie_propiedad: formData.superficie_propiedad ? parseFloat(formData.superficie_propiedad) : null,
        porcentaje_captacion_propiedad: formData.porcentaje_captacion_propiedad ? parseFloat(formData.porcentaje_captacion_propiedad) : null,
        porcentaje_colocacion_propiedad: formData.porcentaje_colocacion_propiedad ? parseFloat(formData.porcentaje_colocacion_propiedad) : null,
        fecha_captacion_propiedad: formData.fecha_captacion_propiedad || null,
        fecha_publicacion_propiedad: formData.fecha_publicacion_propiedad || null,
        direccion: direccionData  // El backend creará la dirección automáticamente
      };

      if (isEditMode) {
        await propiedadService.update(id, propiedadData);
        toast.success('Propiedad actualizada exitosamente');
      } else {
        await propiedadService.create(propiedadData);
        toast.success('Propiedad creada exitosamente');
      }

      navigate('/propiedades');
    } catch (error) {
      console.error('❌ Error saving propiedad:', error);
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error(isEditMode ? 'Error al actualizar propiedad' : 'Error al crear propiedad');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/propiedades')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Volver a Propiedades
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? 'Editar Propiedad' : 'Nueva Propiedad'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEditMode ? 'Actualiza la información de la propiedad' : 'Completa el formulario para agregar una nueva propiedad'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <HomeIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Información Básica</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Título */}
            <div className="md:col-span-2">
              <label htmlFor="titulo_propiedad" className="block text-sm font-medium text-gray-700 mb-1">
                Título de la Propiedad <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="titulo_propiedad"
                name="titulo_propiedad"
                value={formData.titulo_propiedad}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Casa moderna en zona residencial"
              />
            </div>

            {/* Código Público */}
            <div>
              <label htmlFor="codigo_publico_propiedad" className="block text-sm font-medium text-gray-700 mb-1">
                Código Público
              </label>
              <input
                type="text"
                id="codigo_publico_propiedad"
                name="codigo_publico_propiedad"
                value={formData.codigo_publico_propiedad}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: PROP-2024-001"
              />
            </div>

            {/* Propietario */}
            <div>
              <label htmlFor="ci_propietario" className="block text-sm font-medium text-gray-700 mb-1">
                Propietario <span className="text-red-500">*</span>
              </label>
              <select
                id="ci_propietario"
                name="ci_propietario"
                value={formData.ci_propietario}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar propietario</option>
                {propietarios.map(prop => (
                  <option key={prop.ci_propietario} value={prop.ci_propietario}>
                    {prop.nombres_completo_propietario} {prop.apellidos_completo_propietario} - CI: {prop.ci_propietario}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo de Operación */}
            <div>
              <label htmlFor="tipo_operacion_propiedad" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Operación <span className="text-red-500">*</span>
              </label>
              <select
                id="tipo_operacion_propiedad"
                name="tipo_operacion_propiedad"
                value={formData.tipo_operacion_propiedad}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar tipo</option>
                <option value="Venta">Venta</option>
                <option value="Alquiler">Alquiler</option>
                <option value="Anticrético">Anticrético</option>
              </select>
            </div>

            {/* Estado */}
            <div>
              <label htmlFor="estado_propiedad" className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                id="estado_propiedad"
                name="estado_propiedad"
                value={formData.estado_propiedad}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Captada">Captada</option>
                <option value="Publicada">Publicada</option>
                <option value="Reservada">Reservada</option>
                <option value="Cerrada">Cerrada</option>
              </select>
            </div>

            {/* Descripción */}
            <div className="md:col-span-2">
              <label htmlFor="descripcion_propiedad" className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                id="descripcion_propiedad"
                name="descripcion_propiedad"
                value={formData.descripcion_propiedad}
                onChange={handleChange}
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe las características de la propiedad..."
              />
            </div>
          </div>
        </div>

        {/* Precio y Superficie */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Precio y Superficie</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Precio */}
            <div>
              <label htmlFor="precio_publicado_propiedad" className="block text-sm font-medium text-gray-700 mb-1">
                Precio Publicado (Bs.)
              </label>
              <input
                type="number"
                step="0.01"
                id="precio_publicado_propiedad"
                name="precio_publicado_propiedad"
                value={formData.precio_publicado_propiedad}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: 250000.00"
              />
            </div>

            {/* Superficie */}
            <div>
              <label htmlFor="superficie_propiedad" className="block text-sm font-medium text-gray-700 mb-1">
                Superficie (m²)
              </label>
              <input
                type="number"
                step="0.01"
                id="superficie_propiedad"
                name="superficie_propiedad"
                value={formData.superficie_propiedad}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: 150.50"
              />
            </div>

            {/* Porcentaje Captación */}
            <div>
              <label htmlFor="porcentaje_captacion_propiedad" className="block text-sm font-medium text-gray-700 mb-1">
                Porcentaje Captación (%)
              </label>
              <input
                type="number"
                step="0.01"
                id="porcentaje_captacion_propiedad"
                name="porcentaje_captacion_propiedad"
                value={formData.porcentaje_captacion_propiedad}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: 3.00"
              />
            </div>

            {/* Porcentaje Colocación */}
            <div>
              <label htmlFor="porcentaje_colocacion_propiedad" className="block text-sm font-medium text-gray-700 mb-1">
                Porcentaje Colocación (%)
              </label>
              <input
                type="number"
                step="0.01"
                id="porcentaje_colocacion_propiedad"
                name="porcentaje_colocacion_propiedad"
                value={formData.porcentaje_colocacion_propiedad}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: 2.50"
              />
            </div>
          </div>
        </div>

        {/* Fechas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Fechas</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fecha Captación */}
            <div>
              <label htmlFor="fecha_captacion_propiedad" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Captación
              </label>
              <input
                type="date"
                id="fecha_captacion_propiedad"
                name="fecha_captacion_propiedad"
                value={formData.fecha_captacion_propiedad}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Fecha Publicación */}
            <div>
              <label htmlFor="fecha_publicacion_propiedad" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Publicación
              </label>
              <input
                type="date"
                id="fecha_publicacion_propiedad"
                name="fecha_publicacion_propiedad"
                value={formData.fecha_publicacion_propiedad}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Dirección */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPinIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Ubicación</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Calle */}
            <div>
              <label htmlFor="calle_direccion" className="block text-sm font-medium text-gray-700 mb-1">
                Calle <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="calle_direccion"
                name="calle_direccion"
                value={formData.calle_direccion}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Av. 6 de Agosto"
              />
            </div>

            {/* Número */}
            <div>
              <label htmlFor="numero_calle_direccion" className="block text-sm font-medium text-gray-700 mb-1">
                Número
              </label>
              <input
                type="text"
                id="numero_calle_direccion"
                name="numero_calle_direccion"
                value={formData.numero_calle_direccion}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: 1234"
              />
            </div>

            {/* Barrio */}
            <div>
              <label htmlFor="barrio_direccion" className="block text-sm font-medium text-gray-700 mb-1">
                Barrio/Zona
              </label>
              <input
                type="text"
                id="barrio_direccion"
                name="barrio_direccion"
                value={formData.barrio_direccion}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: San Miguel"
              />
            </div>

            {/* Ciudad */}
            <div>
              <label htmlFor="ciudad_direccion" className="block text-sm font-medium text-gray-700 mb-1">
                Ciudad <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="ciudad_direccion"
                name="ciudad_direccion"
                value={formData.ciudad_direccion}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: La Paz"
              />
            </div>

            {/* Departamento */}
            <div>
              <label htmlFor="departamento_direccion" className="block text-sm font-medium text-gray-700 mb-1">
                Departamento <span className="text-red-500">*</span>
              </label>
              <select
                id="departamento_direccion"
                name="departamento_direccion"
                value={formData.departamento_direccion}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar departamento</option>
                <option value="La Paz">La Paz</option>
                <option value="Cochabamba">Cochabamba</option>
                <option value="Santa Cruz">Santa Cruz</option>
                <option value="Oruro">Oruro</option>
                <option value="Potosí">Potosí</option>
                <option value="Tarija">Tarija</option>
                <option value="Chuquisaca">Chuquisaca</option>
                <option value="Beni">Beni</option>
                <option value="Pando">Pando</option>
              </select>
            </div>

            {/* Código Postal */}
            <div>
              <label htmlFor="codigo_postal_direccion" className="block text-sm font-medium text-gray-700 mb-1">
                Código Postal
              </label>
              <input
                type="text"
                id="codigo_postal_direccion"
                name="codigo_postal_direccion"
                value={formData.codigo_postal_direccion}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: 10101"
              />
            </div>

            {/* Coordenadas GPS (opcional para futuro) */}
            <div>
              <label htmlFor="latitud_direccion" className="block text-sm font-medium text-gray-700 mb-1">
                Latitud (GPS)
              </label>
              <input
                type="number"
                step="0.000001"
                id="latitud_direccion"
                name="latitud_direccion"
                value={formData.latitud_direccion}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: -16.500000"
              />
            </div>

            <div>
              <label htmlFor="longitud_direccion" className="block text-sm font-medium text-gray-700 mb-1">
                Longitud (GPS)
              </label>
              <input
                type="number"
                step="0.000001"
                id="longitud_direccion"
                name="longitud_direccion"
                value={formData.longitud_direccion}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: -68.150000"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Guardando...' : isEditMode ? 'Actualizar Propiedad' : 'Crear Propiedad'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/propiedades')}
            className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default PropiedadForm;
