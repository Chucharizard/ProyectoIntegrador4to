import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { empleadoService } from '../../services/empleadoService';
// ✅ ELIMINADO: import Layout from '../../components/layout/Layout';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const EmpleadoForm = () => {
  const { ci } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(ci);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    ci_empleado: '',
    nombres_completo_empleado: '',
    apellidos_completo_empleado: '',
    fecha_nacimiento_empleado: '',
    direccion_empleado: '',
    telefono_empleado: '',
    correo_electronico_empleado: '',
    fecha_contratacion_empleado: '',
    es_activo_empleado: true
  });

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const fetchData = async () => {
      if (!isEditMode) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const empleadoData = await empleadoService.getById(ci, controller.signal);
        
        if (isMounted) {
          setFormData({
            ci_empleado: empleadoData.ci_empleado,
            nombres_completo_empleado: empleadoData.nombres_completo_empleado,
            apellidos_completo_empleado: empleadoData.apellidos_completo_empleado,
            fecha_nacimiento_empleado: empleadoData.fecha_nacimiento_empleado,
            direccion_empleado: empleadoData.direccion_empleado || '',
            telefono_empleado: empleadoData.telefono_empleado,
            correo_electronico_empleado: empleadoData.correo_electronico_empleado || '',
            fecha_contratacion_empleado: empleadoData.fecha_contratacion_empleado,
            es_activo_empleado: empleadoData.es_activo_empleado
          });
        }
      } catch (error) {
        if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError') {
          console.log('Petición cancelada');
          return;
        }

        if (isMounted) {
          console.error('Error loading data:', error);
          toast.error('Error al cargar datos del empleado');
          navigate('/empleados');
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
  }, [ci, isEditMode, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    if (!formData.ci_empleado.trim()) {
      toast.error('El CI es obligatorio');
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
    if (!formData.fecha_contratacion_empleado) {
      toast.error('La fecha de contratación es obligatoria');
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
        await empleadoService.update(ci, formData);
        toast.success('Empleado actualizado exitosamente');
      } else {
        await empleadoService.create(formData);
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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
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
          {isEditMode 
            ? 'Actualiza la información del empleado' 
            : 'Registra un nuevo empleado en el sistema'}
        </p>
      </div>

      {/* Info Box */}
      {!isEditMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>📌 Nota:</strong> Después de crear el empleado, podrás crear sus credenciales de acceso en el módulo de Usuarios.
          </p>
        </div>
      )}

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
              placeholder="12345678"
            />
            {isEditMode && (
              <p className="text-sm text-gray-500 mt-1">El CI no se puede modificar</p>
            )}
          </div>

          {/* Nombres */}
          <div>
            <label htmlFor="nombres_completo_empleado" className="block text-sm font-medium text-gray-700 mb-1">
              Nombres Completos <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="nombres_completo_empleado"
              name="nombres_completo_empleado"
              value={formData.nombres_completo_empleado}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Juan Carlos"
            />
          </div>

          {/* Apellidos */}
          <div>
            <label htmlFor="apellidos_completo_empleado" className="block text-sm font-medium text-gray-700 mb-1">
              Apellidos Completos <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="apellidos_completo_empleado"
              name="apellidos_completo_empleado"
              value={formData.apellidos_completo_empleado}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Pérez García"
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

          {/* Dirección */}
          <div>
            <label htmlFor="direccion_empleado" className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <input
              type="text"
              id="direccion_empleado"
              name="direccion_empleado"
              value={formData.direccion_empleado}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Av. Principal #123"
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
              placeholder="70123456"
            />
          </div>

          {/* Correo */}
          <div>
            <label htmlFor="correo_electronico_empleado" className="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              id="correo_electronico_empleado"
              name="correo_electronico_empleado"
              value={formData.correo_electronico_empleado}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="empleado@ejemplo.com"
            />
          </div>

          {/* Fecha de Contratación */}
          <div>
            <label htmlFor="fecha_contratacion_empleado" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Contratación <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="fecha_contratacion_empleado"
              name="fecha_contratacion_empleado"
              value={formData.fecha_contratacion_empleado}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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
  );
};

export default EmpleadoForm;
