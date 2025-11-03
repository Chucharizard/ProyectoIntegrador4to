import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { empleadoService } from '../../services/empleadoService';
import { rolService } from '../../services/rolService';
import Layout from '../../components/layout/Layout';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const EmpleadoForm = () => {
  const { ci } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(ci);

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    ci_empleado: '',
    nombres_completo_empleado: '',
    apellidos_completo_empleado: '',
    fecha_nacimiento_empleado: '',
    telefono_empleado: '',
    correo_electronico_empleado: '',
    id_rol: '',
    es_activo_empleado: true
  });

  useEffect(() => {
    loadRoles();
    if (isEditMode) {
      loadEmpleado();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ci]);

  const loadRoles = async () => {
    try {
      const data = await rolService.getAll();
      setRoles(data);
    } catch (error) {
      console.error('Error loading roles:', error);
      toast.error('Error al cargar roles');
    }
  };

  const loadEmpleado = async () => {
    try {
      setLoading(true);
      const data = await empleadoService.getById(ci);
      setFormData({
        ci_empleado: data.ci_empleado,
        nombres_completo_empleado: data.nombres_completo_empleado,
        apellidos_completo_empleado: data.apellidos_completo_empleado,
        fecha_nacimiento_empleado: data.fecha_nacimiento_empleado,
        telefono_empleado: data.telefono_empleado,
        correo_electronico_empleado: data.correo_electronico_empleado,
        id_rol: data.id_rol,
        es_activo_empleado: data.es_activo_empleado
      });
    } catch (error) {
      console.error('Error loading empleado:', error);
      toast.error('Error al cargar empleado');
      navigate('/empleados');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    if (!formData.ci_empleado.trim()) {
      toast.error('La CI es obligatoria');
      return false;
    }
    if (!formData.nombres_completo_empleado.trim()) {
      toast.error('Los nombres son obligatorios');
      return false;
    }
    if (!formData.apellidos_completo_empleado.trim()) {
      toast.error('Los apellidos son obligatorios');
      return false;
    }
    if (!formData.fecha_nacimiento_empleado) {
      toast.error('La fecha de nacimiento es obligatoria');
      return false;
    }
    if (!formData.telefono_empleado.trim()) {
      toast.error('El teléfono es obligatorio');
      return false;
    }
    if (!formData.correo_electronico_empleado.trim()) {
      toast.error('El correo electrónico es obligatorio');
      return false;
    }
    if (!formData.id_rol) {
      toast.error('El rol es obligatorio');
      return false;
    }

    // Validar formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.correo_electronico_empleado)) {
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

      // Convertir id_rol a número
      const dataToSend = {
        ...formData,
        id_rol: parseInt(formData.id_rol)
      };

      if (isEditMode) {
        await empleadoService.update(ci, dataToSend);
        toast.success('Empleado actualizado exitosamente');
      } else {
        await empleadoService.create(dataToSend);
        toast.success('Empleado creado exitosamente');
      }

      navigate('/empleados');
    } catch (error) {
      console.error('Error saving empleado:', error);
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error(isEditMode ? 'Error al actualizar empleado' : 'Error al crear empleado');
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
            onClick={() => navigate('/empleados')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Volver a Empleados
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? 'Editar Empleado' : 'Nuevo Empleado'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditMode ? 'Actualiza la información del empleado' : 'Completa el formulario para agregar un nuevo empleado'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* CI */}
            <div>
              <label htmlFor="ci_empleado" className="block text-sm font-medium text-gray-700 mb-1">
                CI <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="ci_empleado"
                name="ci_empleado"
                value={formData.ci_empleado}
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
              <label htmlFor="nombres_completo_empleado" className="block text-sm font-medium text-gray-700 mb-1">
                Nombres <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="nombres_completo_empleado"
                name="nombres_completo_empleado"
                value={formData.nombres_completo_empleado}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Juan Carlos"
              />
            </div>

            {/* Apellidos */}
            <div>
              <label htmlFor="apellidos_completo_empleado" className="block text-sm font-medium text-gray-700 mb-1">
                Apellidos <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="apellidos_completo_empleado"
                name="apellidos_completo_empleado"
                value={formData.apellidos_completo_empleado}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Pérez González"
              />
            </div>

            {/* Fecha de Nacimiento */}
            <div>
              <label htmlFor="fecha_nacimiento_empleado" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Nacimiento <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="fecha_nacimiento_empleado"
                name="fecha_nacimiento_empleado"
                value={formData.fecha_nacimiento_empleado}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Teléfono */}
            <div>
              <label htmlFor="telefono_empleado" className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="telefono_empleado"
                name="telefono_empleado"
                value={formData.telefono_empleado}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: 099123456"
              />
            </div>

            {/* Correo Electrónico */}
            <div>
              <label htmlFor="correo_electronico_empleado" className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="correo_electronico_empleado"
                name="correo_electronico_empleado"
                value={formData.correo_electronico_empleado}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: juan.perez@example.com"
              />
            </div>

            {/* Rol */}
            <div>
              <label htmlFor="id_rol" className="block text-sm font-medium text-gray-700 mb-1">
                Rol <span className="text-red-500">*</span>
              </label>
              <select
                id="id_rol"
                name="id_rol"
                value={formData.id_rol}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccione un rol</option>
                {roles.map((rol) => (
                  <option key={rol.id_rol} value={rol.id_rol}>
                    {rol.nombre_rol}
                  </option>
                ))}
              </select>
            </div>

            {/* Estado Activo */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="es_activo_empleado"
                name="es_activo_empleado"
                checked={formData.es_activo_empleado}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="es_activo_empleado" className="ml-2 block text-sm text-gray-700">
                Empleado activo
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Guardando...' : isEditMode ? 'Actualizar Empleado' : 'Crear Empleado'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/empleados')}
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

export default EmpleadoForm;
