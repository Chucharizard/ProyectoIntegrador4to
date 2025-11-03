import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { propietarioService } from '../../services/propietarioService';
import Layout from '../../components/layout/Layout';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

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

    // Validar formato de correo
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
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/propietarios')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Volver a Propietarios
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? 'Editar Propietario' : 'Nuevo Propietario'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditMode ? 'Actualiza la información del propietario' : 'Completa el formulario para agregar un nuevo propietario'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* CI */}
            <div>
              <label htmlFor="ci_propietario" className="block text-sm font-medium text-gray-700 mb-1">
                CI <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="ci_propietario"
                name="ci_propietario"
                value={formData.ci_propietario}
                onChange={handleChange}
                disabled={isEditMode}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                placeholder="Ej: 12345678"
              />
              {isEditMode && (
                <p className="text-sm text-gray-500 mt-1">La CI no se puede modificar</p>
              )}
            </div>

            {/* Nombres */}
            <div>
              <label htmlFor="nombres_completo_propietario" className="block text-sm font-medium text-gray-700 mb-1">
                Nombres Completos <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="nombres_completo_propietario"
                name="nombres_completo_propietario"
                value={formData.nombres_completo_propietario}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Juan Carlos"
              />
            </div>

            {/* Apellidos */}
            <div>
              <label htmlFor="apellidos_completo_propietario" className="block text-sm font-medium text-gray-700 mb-1">
                Apellidos Completos <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="apellidos_completo_propietario"
                name="apellidos_completo_propietario"
                value={formData.apellidos_completo_propietario}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Pérez González"
              />
            </div>

            {/* Fecha de Nacimiento */}
            <div>
              <label htmlFor="fecha_nacimiento_propietario" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Nacimiento <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="fecha_nacimiento_propietario"
                name="fecha_nacimiento_propietario"
                value={formData.fecha_nacimiento_propietario}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Teléfono */}
            <div>
              <label htmlFor="telefono_propietario" className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="telefono_propietario"
                name="telefono_propietario"
                value={formData.telefono_propietario}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: 099123456"
              />
            </div>

            {/* Correo Electrónico */}
            <div>
              <label htmlFor="correo_electronico_propietario" className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="correo_electronico_propietario"
                name="correo_electronico_propietario"
                value={formData.correo_electronico_propietario}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: propietario@example.com"
              />
            </div>

            {/* Estado Activo */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="es_activo_propietario"
                name="es_activo_propietario"
                checked={formData.es_activo_propietario}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="es_activo_propietario" className="ml-2 block text-sm text-gray-700">
                Propietario activo
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Guardando...' : isEditMode ? 'Actualizar Propietario' : 'Crear Propietario'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/propietarios')}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default PropietarioForm;
