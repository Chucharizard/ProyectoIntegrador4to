import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { empleadoService } from '../../services/empleadoService';
import { rolService } from '../../services/rolService';
import Layout from '../../components/layout/Layout';
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const EmpleadosList = () => {
  const [empleados, setEmpleados] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    
    const fetchData = async () => {
      await loadEmpleados();
      await loadRoles();
    };
    
    fetchData();
    
    return () => {
      controller.abort(); // Cancelar peticiones pendientes al desmontar
    };
  }, []);

  const loadEmpleados = async () => {
    try {
      setLoading(true);
      const data = await empleadoService.getAll();
      setEmpleados(data);
    } catch (error) {
      // Ignorar errores de cancelación
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
        return;
      }
      console.error('Error loading empleados:', error);
      toast.error('Error al cargar empleados');
      setEmpleados([]); // Evitar que se rompa la UI
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
    if (window.confirm('¿Estás seguro de eliminar este empleado?')) {
      try {
        await empleadoService.delete(ci);
        toast.success('Empleado eliminado exitosamente');
        loadEmpleados();
      } catch (error) {
        console.error('Error deleting empleado:', error);
        toast.error('Error al eliminar empleado');
      }
    }
  };

  const getRoleName = (idRol) => {
    const rol = roles.find(r => r.id_rol === idRol);
    return rol ? rol.nombre_rol : 'Sin rol';
  };

  const filteredEmpleados = empleados.filter(emp => {
    if (!emp) return false;
    const term = searchTerm.toLowerCase();
    return (
      (emp.ci_empleado || '').toLowerCase().includes(term) ||
      (emp.nombres_completo_empleado || '').toLowerCase().includes(term) ||
      (emp.apellidos_completo_empleado || '').toLowerCase().includes(term) ||
      (emp.correo_electronico_empleado || '').toLowerCase().includes(term)
    );
  });

  const stats = {
    total: empleados.length,
    filtered: filteredEmpleados.length,
    activos: empleados.filter(e => e.es_activo_empleado).length,
    inactivos: empleados.filter(e => !e.es_activo_empleado).length
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
            <h1 className="text-3xl font-bold text-gray-900">Empleados</h1>
            <p className="text-gray-600 mt-1">Gestiona la información de los empleados</p>
          </div>
          <button
            onClick={() => navigate('/empleados/nuevo')}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Nuevo Empleado
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
              <UserGroupIcon className="h-10 w-10 text-blue-500" />
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
              placeholder="Buscar por CI, nombre, apellido o correo..."
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
                    CI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombres
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Apellidos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Correo
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
                {filteredEmpleados.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                      No se encontraron empleados
                    </td>
                  </tr>
                ) : (
                  filteredEmpleados.map((empleado) => (
                    <tr key={empleado.ci_empleado} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {empleado.ci_empleado}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {empleado.nombres_completo_empleado}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {empleado.apellidos_completo_empleado}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {empleado.telefono_empleado}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {empleado.correo_electronico_empleado}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {getRoleName(empleado.id_rol)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {empleado.es_activo_empleado ? (
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
                            onClick={() => navigate(`/empleados/editar/${empleado.ci_empleado}`)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(empleado.ci_empleado)}
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

export default EmpleadosList;
