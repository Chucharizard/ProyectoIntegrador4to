import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usuarioService } from '../../services/usuarioService';
import { rolService } from '../../services/rolService';
import { empleadoService } from '../../services/empleadoService';
import Layout from '../../components/layout/Layout';
import { ArrowLeftIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const UsuarioForm = () => {
  const { ci } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(ci);

  const [roles, setRoles] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    ci_empleado: '',
    nombre_usuario: '',
    contrasenia_usuario: '',
    id_rol: '',
    es_activo_usuario: true
  });

  useEffect(() => {
    loadRoles();
    loadEmpleados();
    if (isEditMode) {
      loadUsuario();
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

  const loadEmpleados = async () => {
    try {
      const data = await empleadoService.getAll();
      setEmpleados(data);
    } catch (error) {
      console.error('Error loading empleados:', error);
      toast.error('Error al cargar empleados');
    }
  };

  const loadUsuario = async () => {
    try {
      setLoading(true);
      const data = await usuarioService.getById(ci);
      setFormData({
        ci_empleado: data.ci_empleado,
        nombre_usuario: data.nombre_usuario,
        contrasenia_usuario: '', // No mostrar la contraseña actual
        id_rol: data.id_rol,
        es_activo_usuario: data.es_activo_usuario
      });
    } catch (error) {
      console.error('Error loading usuario:', error);
      toast.error('Error al cargar usuario');
      navigate('/usuarios');
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
    if (!formData.ci_empleado) {
      toast.error('Debe seleccionar un empleado');
      return false;
    }
    if (!formData.nombre_usuario.trim()) {
      toast.error('El nombre de usuario es obligatorio');
      return false;
    }
    
    // La contraseña es obligatoria solo al crear
    if (!isEditMode && !formData.contrasenia_usuario.trim()) {
      toast.error('La contraseña es obligatoria');
      return false;
    }

    // Si está editando y proporciona contraseña, validar longitud
    if (formData.contrasenia_usuario.trim() && formData.contrasenia_usuario.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (!formData.id_rol) {
      toast.error('El rol es obligatorio');
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

      // Preparar datos para enviar
      const dataToSend = {
        ci_empleado: formData.ci_empleado,
        nombre_usuario: formData.nombre_usuario,
        id_rol: parseInt(formData.id_rol),
        es_activo_usuario: formData.es_activo_usuario
      };

      // Solo incluir contraseña si se proporcionó
      if (formData.contrasenia_usuario.trim()) {
        dataToSend.contrasenia_usuario = formData.contrasenia_usuario;
      }

      if (isEditMode) {
        await usuarioService.update(ci, dataToSend);
        toast.success('Usuario actualizado exitosamente');
      } else {
        await usuarioService.create(dataToSend);
        toast.success('Usuario creado exitosamente');
      }

      navigate('/usuarios');
    } catch (error) {
      console.error('Error saving usuario:', error);
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error(isEditMode ? 'Error al actualizar usuario' : 'Error al crear usuario');
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
            onClick={() => navigate('/usuarios')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Volver a Usuarios
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditMode 
              ? 'Actualiza las credenciales de acceso del usuario' 
              : 'Crea las credenciales de acceso para un nuevo usuario'}
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>📌 Nota:</strong> Los usuarios necesitan estas credenciales para acceder al sistema. 
            {isEditMode && ' Deja la contraseña vacía si no deseas cambiarla.'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Empleado */}
            <div>
              <label htmlFor="ci_empleado" className="block text-sm font-medium text-gray-700 mb-1">
                Empleado <span className="text-red-500">*</span>
              </label>
              <select
                id="ci_empleado"
                name="ci_empleado"
                value={formData.ci_empleado}
                onChange={handleChange}
                disabled={isEditMode}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              >
                <option value="">Seleccione un empleado</option>
                {empleados.map((emp) => (
                  <option key={emp.ci_empleado} value={emp.ci_empleado}>
                    {emp.ci_empleado} - {emp.nombres_completo_empleado} {emp.apellidos_completo_empleado}
                  </option>
                ))}
              </select>
              {isEditMode && (
                <p className="text-sm text-gray-500 mt-1">El empleado no se puede modificar</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Selecciona el empleado al que se le asignarán estas credenciales
              </p>
            </div>

            {/* Nombre de Usuario */}
            <div>
              <label htmlFor="nombre_usuario" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de Usuario <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="nombre_usuario"
                name="nombre_usuario"
                value={formData.nombre_usuario}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: jperez"
              />
              <p className="text-sm text-gray-500 mt-1">
                Este será el usuario para iniciar sesión
              </p>
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="contrasenia_usuario" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña {!isEditMode && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="contrasenia_usuario"
                  name="contrasenia_usuario"
                  value={formData.contrasenia_usuario}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                  placeholder={isEditMode ? 'Dejar vacío para mantener la actual' : 'Mínimo 6 caracteres'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {isEditMode 
                  ? 'Deja este campo vacío si no deseas cambiar la contraseña' 
                  : 'Mínimo 6 caracteres'}
              </p>
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
              <p className="text-sm text-gray-500 mt-1">
                Define los permisos del usuario en el sistema
              </p>
            </div>

            {/* Estado Activo */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="es_activo_usuario"
                name="es_activo_usuario"
                checked={formData.es_activo_usuario}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="es_activo_usuario" className="ml-2 block text-sm text-gray-700">
                Usuario activo (puede iniciar sesión)
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Guardando...' : isEditMode ? 'Actualizar Usuario' : 'Crear Usuario'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/usuarios')}
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

export default UsuarioForm;
