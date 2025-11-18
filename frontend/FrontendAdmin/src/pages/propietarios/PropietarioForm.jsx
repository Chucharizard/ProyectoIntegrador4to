import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { propietarioService } from '../../services/propietarioService';
import { UserIcon, PhoneIcon, EnvelopeIcon, CalendarIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// ✨ Importar componentes reutilizables
import BackButton from '../../components/shared/BackButton';
import FormCard from '../../components/shared/FormCard';

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
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    if (!formData.ci_propietario.trim()) {
      toast.error('La CI es obligatoria');
      return false;
    }
    if (!formData.nombres_completo_propietario.trim()) {
      toast.error('Los nombres son obligatorios');
      return false;
    }
    if (!formData.apellidos_completo_propietario.trim()) {
      toast.error('Los apellidos son obligatorios');
      return false;
    }
    if (!formData.fecha_nacimiento_propietario) {
      toast.error('La fecha de nacimiento es obligatoria');
      return false;
    }
    if (!formData.telefono_propietario.trim()) {
      toast.error('El teléfono es obligatorio');
      return false;
    }
    if (!formData.correo_electronico_propietario.trim()) {
      toast.error('El correo electrónico es obligatorio');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.correo_electronico_propietario)) {
      toast.error('El formato del correo electrónico no es válido');
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
                  className={`w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all ${
                    isEditMode ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                  placeholder="Ej: 12345678"
                />
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
                    className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                    placeholder="Ej: Juan Carlos"
                  />
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
                    className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                    placeholder="Ej: Pérez González"
                  />
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
                  className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                />
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
                  className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                  placeholder="Ej: 099123456"
                />
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
                  className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                  placeholder="Ej: propietario@example.com"
                />
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
