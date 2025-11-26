import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { propiedadService } from '../../services/propiedadService';
import { propietarioService } from '../../services/propietarioService';
import { direccionService } from '../../services/direccionService';
import { MapPinIcon, HomeIcon, CurrencyDollarIcon, CalendarIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// ✨ Importar componentes reutilizables
import BackButton from '../../components/shared/BackButton';
import FormCard from '../../components/shared/FormCard';

const PropiedadForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [propietarios, setPropietarios] = useState([]);
  
  const [formData, setFormData] = useState({
    titulo_propiedad: '',
    codigo_publico_propiedad: '',
    descripcion_propiedad: '',
    ci_propietario: '',
    tipo_operacion_propiedad: '',
    estado_propiedad: 'Captada',
    precio_publicado_propiedad: '',
    superficie_propiedad: '',
    porcentaje_captacion_propiedad: '',
    porcentaje_colocacion_propiedad: '',
    fecha_captacion_propiedad: '',
    fecha_publicacion_propiedad: '',
    calle_direccion: '',
    barrio_direccion: '',
    ciudad_direccion: '',
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
          const [propiedadData, propietariosData] = await Promise.all([
            propiedadService.getById(id, controller.signal),
            propietarioService.getAll(controller.signal)
          ]);

          if (isMounted) {
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
              calle_direccion: direccionData?.calle_direccion || '',
              barrio_direccion: direccionData?.barrio_direccion || '',
              ciudad_direccion: direccionData?.ciudad_direccion || '',
              codigo_postal_direccion: direccionData?.codigo_postal_direccion || '',
              latitud_direccion: direccionData?.latitud_direccion || '',
              longitud_direccion: direccionData?.longitud_direccion || ''
            });
            setPropietarios(propietariosData);
          }
        } else {
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

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const direccionData = {
        calle_direccion: formData.calle_direccion,
        barrio_direccion: formData.barrio_direccion || null,
        ciudad_direccion: formData.ciudad_direccion,
        codigo_postal_direccion: formData.codigo_postal_direccion || null,
        latitud_direccion: formData.latitud_direccion ? parseFloat(formData.latitud_direccion) : null,
        longitud_direccion: formData.longitud_direccion ? parseFloat(formData.longitud_direccion) : null
      };

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
        direccion: direccionData
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
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-800 border-t-green-500"></div>
          <div className="absolute inset-0 rounded-full border-4 border-green-500/20 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto"> {/* ✨ Ancho máximo aumentado */}
      {/* Header */}
      <div className="mb-6">
        <BackButton to="/propiedades" label="Volver a Propiedades" />
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
          {isEditMode ? 'Editar Propiedad' : 'Nueva Propiedad'}
        </h1>
        <p className="text-gray-400 mt-1">
          {isEditMode ? 'Actualiza la información de la propiedad' : 'Completa el formulario para agregar una nueva propiedad'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* ✨ Layout de 2 COLUMNAS en pantallas grandes */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          {/* 📋 COLUMNA IZQUIERDA */}
          <div className="space-y-6">
            
            {/* Información Básica */}
            <FormCard>
              <div className="flex items-center gap-2 mb-4">
                <HomeIcon className="h-6 w-6 text-green-400" />
                <h2 className="text-xl font-semibold text-green-400">Información Básica</h2>
              </div>
              
              <div className="space-y-4">
                {/* Título */}
                <div>
                  <label htmlFor="titulo_propiedad" className="block text-sm font-medium text-green-400 mb-2">
                    Título de la Propiedad <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="titulo_propiedad"
                    name="titulo_propiedad"
                    value={formData.titulo_propiedad}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                    placeholder="Ej: Casa moderna en zona residencial"
                  />
                </div>

                {/* Código y Propietario en 2 columnas */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="codigo_publico_propiedad" className="block text-sm font-medium text-green-400 mb-2">
                      Código Público
                    </label>
                    <input
                      type="text"
                      id="codigo_publico_propiedad"
                      name="codigo_publico_propiedad"
                      value={formData.codigo_publico_propiedad}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                      placeholder="PROP-2024-001"
                    />
                  </div>

                  <div>
                    <label htmlFor="estado_propiedad" className="block text-sm font-medium text-green-400 mb-2">
                      Estado
                    </label>
                    <select
                      id="estado_propiedad"
                      name="estado_propiedad"
                      value={formData.estado_propiedad}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                    >
                      <option value="Captada">Captada</option>
                      <option value="Publicada">Publicada</option>
                      <option value="Reservada">Reservada</option>
                      <option value="Cerrada">Cerrada</option>
                    </select>
                  </div>
                </div>

                {/* Propietario */}
                <div>
                  <label htmlFor="ci_propietario" className="block text-sm font-medium text-green-400 mb-2">
                    Propietario <span className="text-red-400">*</span>
                  </label>
                  <select
                    id="ci_propietario"
                    name="ci_propietario"
                    value={formData.ci_propietario}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
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
                  <label htmlFor="tipo_operacion_propiedad" className="block text-sm font-medium text-green-400 mb-2">
                    Tipo de Operación <span className="text-red-400">*</span>
                  </label>
                  <select
                    id="tipo_operacion_propiedad"
                    name="tipo_operacion_propiedad"
                    value={formData.tipo_operacion_propiedad}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                  >
                    <option value="">Seleccionar tipo</option>
                    <option value="Venta">Venta</option>
                    <option value="Alquiler">Alquiler</option>
                    <option value="Anticrético">Anticrético</option>
                  </select>
                </div>

                {/* Descripción */}
                <div>
                  <label htmlFor="descripcion_propiedad" className="block text-sm font-medium text-green-400 mb-2">
                    Descripción
                  </label>
                  <textarea
                    id="descripcion_propiedad"
                    name="descripcion_propiedad"
                    value={formData.descripcion_propiedad}
                    onChange={handleChange}
                    rows="4"
                    className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all resize-none"
                    placeholder="Describe las características de la propiedad..."
                  />
                </div>
              </div>
            </FormCard>

            {/* Precio y Superficie */}
            <FormCard>
              <div className="flex items-center gap-2 mb-4">
                <CurrencyDollarIcon className="h-6 w-6 text-green-400" />
                <h2 className="text-xl font-semibold text-green-400">Precio y Superficie</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="precio_publicado_propiedad" className="block text-sm font-medium text-green-400 mb-2">
                    Precio (Bs.)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="precio_publicado_propiedad"
                    name="precio_publicado_propiedad"
                    value={formData.precio_publicado_propiedad}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                    placeholder="250000.00"
                  />
                </div>

                <div>
                  <label htmlFor="superficie_propiedad" className="block text-sm font-medium text-green-400 mb-2">
                    Superficie (m²)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="superficie_propiedad"
                    name="superficie_propiedad"
                    value={formData.superficie_propiedad}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                    placeholder="150.50"
                  />
                </div>

                <div>
                  <label htmlFor="porcentaje_captacion_propiedad" className="block text-sm font-medium text-green-400 mb-2">
                    % Captación
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="porcentaje_captacion_propiedad"
                    name="porcentaje_captacion_propiedad"
                    value={formData.porcentaje_captacion_propiedad}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                    placeholder="3.00"
                  />
                </div>

                <div>
                  <label htmlFor="porcentaje_colocacion_propiedad" className="block text-sm font-medium text-green-400 mb-2">
                    % Colocación
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="porcentaje_colocacion_propiedad"
                    name="porcentaje_colocacion_propiedad"
                    value={formData.porcentaje_colocacion_propiedad}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                    placeholder="2.50"
                  />
                </div>
              </div>
            </FormCard>

           
          </div>

          {/* 📋 COLUMNA DERECHA */}
          <div className="space-y-6">
            
            {/* Ubicación */}
            <FormCard>
              <div className="flex items-center gap-2 mb-4">
                <MapPinIcon className="h-6 w-6 text-green-400" />
                <h2 className="text-xl font-semibold text-green-400">Ubicación</h2>
              </div>
              
              <div className="space-y-4">
                {/* Calle */}
                <div>
                  <label htmlFor="calle_direccion" className="block text-sm font-medium text-green-400 mb-2">
                    Calle <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="calle_direccion"
                    name="calle_direccion"
                    value={formData.calle_direccion}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                    placeholder="Av. 6 de Agosto"
                  />
                </div>

                {/* Barrio */}
                <div>
                  <label htmlFor="barrio_direccion" className="block text-sm font-medium text-green-400 mb-2">
                    Barrio/Zona
                  </label>
                  <input
                    type="text"
                    id="barrio_direccion"
                    name="barrio_direccion"
                    value={formData.barrio_direccion}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                    placeholder="San Miguel"
                  />
                </div>

                {/* Ciudad */}
                <div>
                  <label htmlFor="ciudad_direccion" className="block text-sm font-medium text-green-400 mb-2">
                    Ciudad <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="ciudad_direccion"
                    name="ciudad_direccion"
                    value={formData.ciudad_direccion}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                    placeholder="La Paz"
                  />
                </div>

                {/* Código Postal */}
                <div>
                  <label htmlFor="codigo_postal_direccion" className="block text-sm font-medium text-green-400 mb-2">
                    Código Postal
                  </label>
                  <input
                    type="text"
                    id="codigo_postal_direccion"
                    name="codigo_postal_direccion"
                    value={formData.codigo_postal_direccion}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                    placeholder="10101"
                  />
                </div>

                {/* Coordenadas GPS */}
                <div>
                  <p className="text-sm font-medium text-green-400 mb-2">Coordenadas GPS (Opcional)</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="latitud_direccion" className="block text-xs text-gray-400 mb-1">
                        Latitud
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        id="latitud_direccion"
                        name="latitud_direccion"
                        value={formData.latitud_direccion}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                        placeholder="-16.500000"
                      />
                    </div>

                    <div>
                      <label htmlFor="longitud_direccion" className="block text-xs text-gray-400 mb-1">
                        Longitud
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        id="longitud_direccion"
                        name="longitud_direccion"
                        value={formData.longitud_direccion}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                        placeholder="-68.150000"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </FormCard>

             {/* Fechas */}
            <FormCard>
              <div className="flex items-center gap-2 mb-4">
                <CalendarIcon className="h-6 w-6 text-green-400" />
                <h2 className="text-xl font-semibold text-green-400">Fechas</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fecha_captacion_propiedad" className="block text-sm font-medium text-green-400 mb-2">
                    Fecha Captación
                  </label>
                  <input
                    type="date"
                    id="fecha_captacion_propiedad"
                    name="fecha_captacion_propiedad"
                    value={formData.fecha_captacion_propiedad}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="fecha_publicacion_propiedad" className="block text-sm font-medium text-green-400 mb-2">
                    Fecha Publicación
                  </label>
                  <input
                    type="date"
                    id="fecha_publicacion_propiedad"
                    name="fecha_publicacion_propiedad"
                    value={formData.fecha_publicacion_propiedad}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                  />
                </div>
              </div>
            </FormCard>
          </div>
        </div>

        {/* Buttons - Fuera del grid, full width */}
        <div className="flex gap-4 mt-6">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Guardando...' : isEditMode ? 'Actualizar Propiedad' : 'Crear Propiedad'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/propiedades')}
            className="flex-1 bg-gray-700/50 text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-700 transition-all duration-300 font-medium border border-gray-600"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default PropiedadForm;
