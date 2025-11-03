import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usuarioService } from '../../services/usuarioService';
import { rolService } from '../../services/rolService';
import Layout from '../../components/layout/Layout';
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  MagnifyingGlassIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const UsuariosList = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    
    const fetchData = async () => {
      await loadUsuarios();
      await loadRoles();
    };
    
    fetchData();
    
    return () => {
      controller.abort(); // Cancelar peticiones pendientes al desmontar
    };
  }, []);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const data = await usuarioService.getAll();
      setUsuarios(data);
    } catch (error) {
      // Ignorar errores de cancelación
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
        return;
      }
      console.error('Error loading usuarios:', error);
      toast.error('Error al cargar usuarios');
      setUsuarios([]); // Evitar que se rompa la UI
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const data = await rolService.getAll();
      setRoles(data);
    } catch (error) {
      // Ignorar errores de cancelación
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
        return;
      }
      console.error('Error loading roles:', error);
    }
  };

  const handleDelete = async (ci) => {
    if (window.confirm('¿Estás seguro de eliminar este usuario? Esta acción eliminará sus credenciales de acceso.')) {
      try {
        await usuarioService.delete(ci);
        toast.success('Usuario eliminado exitosamente');
        loadUsuarios();
      } catch (error) {
        console.error('Error deleting usuario:', error);
        toast.error('Error al eliminar usuario');
      }
    }
  };

  const getRoleName = (idRol) => {
    const rol = roles.find(r => r.id_rol === idRol);
    return rol ? rol.nombre_rol : 'Sin rol';
  };

  const filteredUsuarios = usuarios.filter(user => {
    if (!user) return false;
    const term = searchTerm.toLowerCase();
    return (
      (user.ci_empleado || '').toLowerCase().includes(term) ||
      (user.nombre_usuario || '').toLowerCase().includes(term)
    );
  });

  const stats = {
    total: usuarios.length,
    filtered: filteredUsuarios.length,
    activos: usuarios.filter(u => u.es_activo_usuario).length,
    inactivos: usuarios.filter(u => !u.es_activo_usuario).length
  };

  if (loading) {
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Usuarios</h1>
            <p className="text-gray-600 mt-1">Gestiona las credenciales de acceso al sistema</p>
          </div>
          <button
            onClick={() => navigate('/usuarios/nuevo')}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Nuevo Usuario
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <UserIcon className="h-10 w-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Filtrados</p>
                <p className="text-2xl font-bold text-gray-900">{stats.filtered}</p>
              </div>
              <MagnifyingGlassIcon className="h-10 w-10 text-purple-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Activos</p>
                <p className="text-2xl font-bold text-green-600">{stats.activos}</p>
              </div>
              <CheckCircleIcon className="h-10 w-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactivos</p>
                <p className="text-2xl font-bold text-red-600">{stats.inactivos}</p>
              </div>
              <XCircleIcon className="h-10 w-10 text-red-500" />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por CI empleado o nombre de usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CI Empleado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre de Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsuarios.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      No se encontraron usuarios
                    </td>
                  </tr>
                ) : (
                  filteredUsuarios.map((usuario) => (
                    <tr key={usuario.id_usuario} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {usuario.ci_empleado}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <ShieldCheckIcon className="h-5 w-5 text-blue-500" />
                          {usuario.nombre_usuario}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {getRoleName(usuario.id_rol)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {usuario.es_activo_usuario ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircleIcon className="h-5 w-5" />
                            Activo
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600">
                            <XCircleIcon className="h-5 w-5" />
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/usuarios/editar/${usuario.ci_empleado}`)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(usuario.ci_empleado)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UsuariosList;
