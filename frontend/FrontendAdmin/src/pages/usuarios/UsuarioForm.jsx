import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usuarioService } from '../../services/usuarioService';
import { rolService } from '../../services/rolService';
import { empleadoService } from '../../services/empleadoService';
import { EyeIcon, EyeSlashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// ✨ Importar componentes reutilizables
import BackButton from '../../components/shared/BackButton';
import FormCard from '../../components/shared/FormCard';
import InfoBox from '../../components/shared/InfoBox';

// ✨ Importar validaciones
import {
  validateText,
  validatePassword,
  MAX_LENGTH,
  sanitizeString
} from '../../utils/validations';

const UsuarioForm = () => {
  const { id_usuario } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id_usuario);

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

  // ✨ Estado para errores de validación
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [rolesData, empleadosData] = await Promise.all([
          rolService.getAll(controller.signal),
          empleadoService.getAll(controller.signal)
        ]);

        if (isMounted) {
          setRoles(rolesData);
          setEmpleados(empleadosData);
        }

        if (isEditMode && isMounted) {
          const usuarioData = await usuarioService.getById(id_usuario, controller.signal);
          
          if (isMounted) {
            setFormData({
              ci_empleado: usuarioData.ci_empleado,
              nombre_usuario: usuarioData.nombre_usuario,
              contrasenia_usuario: '',
              id_rol: usuarioData.id_rol,
              es_activo_usuario: usuarioData.es_activo_usuario
            });
          }
        }
      } catch (error) {
        if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError') {
          console.log('Peticiones canceladas');
          return;
        }

        if (isMounted) {
          console.error('Error loading data:', error);
          toast.error('Error al cargar datos');
          if (isEditMode) {
            navigate('/usuarios');
          }
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
  }, [id_usuario, isEditMode, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Sanitizar el valor para campos de texto
    const sanitizedValue = type === 'text' ? sanitizeString(value) : value;
    const finalValue = type === 'checkbox' ? checked : sanitizedValue;
    
    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));

    // ✨ Validar el campo en tiempo real (excepto checkbox y select)
    if (type !== 'checkbox' && type !== 'select-one') {
      validateField(name, finalValue);
    }
  };

  // ✨ Validar campo individual
  const validateField = (fieldName, value) => {
    let error = null;

    switch (fieldName) {
      case 'nombre_usuario':
        error = validateText(value, 'Nombre de usuario', MAX_LENGTH.NOMBRE_USUARIO, true);
        break;
      case 'contrasenia_usuario':
        // Solo validar contraseña si no está vacía o si estamos creando (no en modo edición)
        if (value || !isEditMode) {
          error = validatePassword(value, !isEditMode);
        }
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
    
    newErrors.nombre_usuario = validateText(formData.nombre_usuario, 'Nombre de usuario', MAX_LENGTH.NOMBRE_USUARIO, true);
    
    // Solo validar contraseña si tiene contenido o estamos creando usuario
    if (formData.contrasenia_usuario || !isEditMode) {
      newErrors.contrasenia_usuario = validatePassword(formData.contrasenia_usuario, !isEditMode);
    }

    // Validaciones adicionales para select
    if (!formData.ci_empleado) {
      newErrors.ci_empleado = 'Debe seleccionar un empleado';
    }
    if (!formData.id_rol) {
      newErrors.id_rol = 'Debe seleccionar un rol';
    }

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
      return;
    }

    try {
      setLoading(true);

      const dataToSend = {
        ci_empleado: formData.ci_empleado,
        nombre_usuario: formData.nombre_usuario,
        id_rol: parseInt(formData.id_rol),
        es_activo_usuario: formData.es_activo_usuario
      };

      if (formData.contrasenia_usuario.trim()) {
        dataToSend.contrasenia_usuario = formData.contrasenia_usuario;
      }

      if (isEditMode) {
        await usuarioService.update(id_usuario, dataToSend);
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
        <BackButton to="/usuarios" label="Volver a Usuarios" />
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
          {isEditMode ? 'Editar Usuario' : 'Nuevo Usuario'}
        </h1>
        <p className="text-gray-400 mt-1">
          {isEditMode 
            ? 'Actualiza las credenciales de acceso del usuario' 
            : 'Crea las credenciales de acceso para un nuevo usuario'}
        </p>
      </div>

      {/* ✨ Info Box Component */}
      <InfoBox type="info">
        <strong className="text-blue-400">🔐 Nota:</strong> Los usuarios necesitan estas credenciales para acceder al sistema.
        {isEditMode && ' Deja la contraseña vacía si no deseas cambiarla.'}
      </InfoBox>

      {/* ✨ Form Card Component */}
      <FormCard>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Empleado */}
          <div>
            <label htmlFor="ci_empleado" className="block text-sm font-medium text-green-400 mb-2">
              Empleado <span className="text-red-400">*</span>
            </label>
            <select
              id="ci_empleado"
              name="ci_empleado"
              value={formData.ci_empleado}
              onChange={handleChange}
              disabled={isEditMode}
              className={`w-full px-4 py-2.5 bg-gray-900/50 border rounded-lg text-gray-200 focus:ring-2 transition-all ${
                isEditMode ? 'cursor-not-allowed opacity-60 border-gray-700 focus:ring-green-500/50 focus:border-green-500/50' : 
                errors.ci_empleado ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500/50' : 'border-gray-700 focus:ring-green-500/50 focus:border-green-500/50'
              }`}
            >
              <option value="">Seleccione un empleado</option>
              {empleados.map((emp) => (
                <option key={emp.ci_empleado} value={emp.ci_empleado}>
                  {emp.ci_empleado} - {emp.nombres_completo_empleado} {emp.apellidos_completo_empleado}
                </option>
              ))}
            </select>
            {errors.ci_empleado && !isEditMode && (
              <p className="text-red-400 text-xs mt-1">⚠️ {errors.ci_empleado}</p>
            )}
            {isEditMode && (
              <p className="text-xs text-gray-500 mt-1">El empleado no se puede modificar</p>
            )}
            {!errors.ci_empleado && !isEditMode && (
              <p className="text-xs text-gray-400 mt-1">
                Selecciona el empleado al que se le asignarán estas credenciales
              </p>
            )}
          </div>

          {/* Nombre de Usuario */}
          <div>
            <label htmlFor="nombre_usuario" className="block text-sm font-medium text-green-400 mb-2">
              Nombre de Usuario <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <ShieldCheckIcon className="h-5 w-5 text-green-400/50 absolute left-4 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                id="nombre_usuario"
                name="nombre_usuario"
                value={formData.nombre_usuario}
                onChange={handleChange}
                maxLength={MAX_LENGTH.NOMBRE_USUARIO}
                className={`w-full pl-12 pr-4 py-2.5 bg-gray-900/50 border rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 transition-all ${
                  errors.nombre_usuario ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500/50' : 'border-gray-700 focus:ring-green-500/50 focus:border-green-500/50'
                }`}
                placeholder="Ej: jperez"
              />
            </div>
            {errors.nombre_usuario ? (
              <p className="text-red-400 text-xs mt-1">⚠️ {errors.nombre_usuario}</p>
            ) : (
              <p className="text-gray-500 text-xs mt-1">
                {formData.nombre_usuario.length}/{MAX_LENGTH.NOMBRE_USUARIO} caracteres - Este será el usuario para iniciar sesión
              </p>
            )}
          </div>

          {/* Contraseña */}
          <div>
            <label htmlFor="contrasenia_usuario" className="block text-sm font-medium text-green-400 mb-2">
              Contraseña {!isEditMode && <span className="text-red-400">*</span>}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="contrasenia_usuario"
                name="contrasenia_usuario"
                value={formData.contrasenia_usuario}
                onChange={handleChange}
                maxLength={MAX_LENGTH.PASSWORD}
                className={`w-full px-4 py-2.5 bg-gray-900/50 border rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 transition-all pr-12 ${
                  errors.contrasenia_usuario ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500/50' : 'border-gray-700 focus:ring-green-500/50 focus:border-green-500/50'
                }`}
                placeholder={isEditMode ? 'Dejar vacío para mantener la actual' : 'Mínimo 8 caracteres'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-400 transition-colors"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.contrasenia_usuario ? (
              <p className="text-red-400 text-xs mt-1">⚠️ {errors.contrasenia_usuario}</p>
            ) : (
              <p className="text-gray-400 text-xs mt-1">
                {isEditMode 
                  ? 'Deja este campo vacío si no deseas cambiar la contraseña' 
                  : 'Mínimo 8 caracteres, incluye mayúsculas, minúsculas y números'}
              </p>
            )}
          </div>

          {/* Rol */}
          <div>
            <label htmlFor="id_rol" className="block text-sm font-medium text-green-400 mb-2">
              Rol <span className="text-red-400">*</span>
            </label>
            <select
              id="id_rol"
              name="id_rol"
              value={formData.id_rol}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 bg-gray-900/50 border rounded-lg text-gray-200 focus:ring-2 transition-all ${
                errors.id_rol ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500/50' : 'border-gray-700 focus:ring-green-500/50 focus:border-green-500/50'
              }`}
            >
              <option value="">Seleccione un rol</option>
              {roles.map((rol) => (
                <option key={rol.id_rol} value={rol.id_rol}>
                  {rol.nombre_rol}
                </option>
              ))}
            </select>
            {errors.id_rol ? (
              <p className="text-red-400 text-xs mt-1">⚠️ {errors.id_rol}</p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">
                Define los permisos del usuario en el sistema
              </p>
            )}
          </div>

          {/* Estado Activo */}
          <div className="flex items-center space-x-3 p-4 bg-gray-900/30 border border-gray-700/50 rounded-lg">
            <input
              type="checkbox"
              id="es_activo_usuario"
              name="es_activo_usuario"
              checked={formData.es_activo_usuario}
              onChange={handleChange}
              className="h-5 w-5 text-green-500 bg-gray-900 border-gray-600 rounded focus:ring-2 focus:ring-green-500/50"
            />
            <label htmlFor="es_activo_usuario" className="text-sm text-gray-300 font-medium cursor-pointer">
              Usuario activo (puede iniciar sesión)
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Guardando...' : isEditMode ? 'Actualizar Usuario' : 'Crear Usuario'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/usuarios')}
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

export default UsuarioForm;
