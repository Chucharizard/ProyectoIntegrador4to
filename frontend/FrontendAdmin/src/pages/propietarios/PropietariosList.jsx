import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { propietarioService } from '../../services/propietarioService';
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

const PropietariosList = () => {
  const [propietarios, setPropietarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await propietarioService.getAll(controller.signal);
        
        if (isMounted) {
          setPropietarios(data);
        }
      } catch (error) {
        if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError') {
          console.log('Petición cancelada');
          return;
        }
        
        if (isMounted) {
          console.error('Error loading propietarios:', error);
          toast.error('Error al cargar propietarios');
          setPropietarios([]);
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
  }, []);

  const handleDelete = async (ci) => {
    if (window.confirm('¿Estás seguro de eliminar este propietario?')) {
      try {
        await propietarioService.delete(ci);
        toast.success('Propietario eliminado exitosamente');
        
        // Recargar lista
        const data = await propietarioService.getAll();
        setPropietarios(data);
      } catch (error) {
        console.error('Error deleting propietario:', error);
        toast.error('Error al eliminar propietario');
      }
    }
  };

  const filteredPropietarios = propietarios.filter(prop => {
    if (!prop) return false;
    const term = searchTerm.toLowerCase();
    return (
      (prop.ci_propietario || '').toLowerCase().includes(term) ||
      (prop.nombres_completo_propietario || '').toLowerCase().includes(term) ||
      (prop.apellidos_completo_propietario || '').toLowerCase().includes(term) ||
      (prop.correo_electronico_propietario || '').toLowerCase().includes(term)
    );
  });

  const stats = {
    total: propietarios.length,
    filtered: filteredPropietarios.length,
    activos: propietarios.filter(p => p.es_activo_propietario).length,
    inactivos: propietarios.filter(p => !p.es_activo_propietario).length
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Propietarios</h1>
          <p className="text-gray-600 mt-1">Gestiona la información de los propietarios de inmuebles</p>
        </div>
        <button
          onClick={() => navigate('/propietarios/nuevo')}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Nuevo Propietario
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
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPropietarios.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No se encontraron propietarios
                  </td>
                </tr>
              ) : (
                filteredPropietarios.map((propietario) => (
                  <tr key={propietario.ci_propietario} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {propietario.ci_propietario}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {propietario.nombres_completo_propietario}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {propietario.apellidos_completo_propietario}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {propietario.telefono_propietario}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {propietario.correo_electronico_propietario}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {propietario.es_activo_propietario ? (
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
                          onClick={() => navigate(`/propietarios/editar/${propietario.ci_propietario}`)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(propietario.ci_propietario)}
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
  );
};

export default PropietariosList;
