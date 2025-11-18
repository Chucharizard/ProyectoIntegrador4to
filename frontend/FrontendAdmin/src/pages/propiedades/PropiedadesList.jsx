import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { propiedadService } from '../../services/propiedadService';
import { propietarioService } from '../../services/propietarioService';
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  MagnifyingGlassIcon,
  HomeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const PropiedadesList = () => {
  const [propiedades, setPropiedades] = useState([]);
  const [propietarios, setPropietarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoOperacionFilter, setTipoOperacionFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Cargar propiedades y propietarios en paralelo
        const [propiedadesData, propietariosData] = await Promise.all([
          propiedadService.getAll(controller.signal),
          propietarioService.getAll(controller.signal)
        ]);
        
        if (isMounted) {
          setPropiedades(propiedadesData);
          setPropietarios(propietariosData);
        }
      } catch (error) {
        if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError') {
          console.log('✅ Petición cancelada correctamente');
          return;
        }
        
        if (isMounted) {
          console.error('❌ Error loading data:', error);
          toast.error('Error al cargar propiedades');
          setPropiedades([]);
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

  const handleDelete = async (id, titulo) => {
    if (window.confirm(`¿Estás seguro de eliminar la propiedad "${titulo}"?`)) {
      try {
        await propiedadService.delete(id);
        toast.success('Propiedad eliminada exitosamente');
        
        // Recargar lista
        const data = await propiedadService.getAll();
        setPropiedades(data);
      } catch (error) {
        console.error('Error deleting propiedad:', error);
        toast.error('Error al eliminar propiedad');
      }
    }
  };

  const getPropietarioNombre = (ciPropietario) => {
    const propietario = propietarios.find(p => p.ci_propietario === ciPropietario);
    if (!propietario) return 'Desconocido';
    return `${propietario.nombres_completo_propietario} ${propietario.apellidos_completo_propietario}`;
  };

  const getEstadoBadgeColor = (estado) => {
    const colors = {
      'Captada': 'bg-yellow-100 text-yellow-800',
      'Publicada': 'bg-blue-100 text-blue-800',
      'Reservada': 'bg-purple-100 text-purple-800',
      'Cerrada': 'bg-gray-100 text-gray-800'
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  const getTipoOperacionBadgeColor = (tipo) => {
    const colors = {
      'Venta': 'bg-green-100 text-green-800',
      'Alquiler': 'bg-orange-100 text-orange-800',
      'Anticrético': 'bg-indigo-100 text-indigo-800'
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  };

  const formatPrice = (price) => {
    if (!price) return 'No especificado';
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB'
    }).format(price);
  };

  const filteredPropiedades = propiedades.filter(prop => {
    if (!prop) return false;
    
    const term = searchTerm.toLowerCase();
    const matchesSearch = (
      (prop.titulo_propiedad || '').toLowerCase().includes(term) ||
      (prop.codigo_publico_propiedad || '').toLowerCase().includes(term) ||
      (prop.descripcion_propiedad || '').toLowerCase().includes(term) ||
      getPropietarioNombre(prop.ci_propietario).toLowerCase().includes(term)
    );
    
    const matchesTipo = !tipoOperacionFilter || prop.tipo_operacion_propiedad === tipoOperacionFilter;
    const matchesEstado = !estadoFilter || prop.estado_propiedad === estadoFilter;
    
    return matchesSearch && matchesTipo && matchesEstado;
  });

  const stats = {
    total: propiedades.length,
    filtered: filteredPropiedades.length,
    captadas: propiedades.filter(p => p.estado_propiedad === 'Captada').length,
    publicadas: propiedades.filter(p => p.estado_propiedad === 'Publicada').length,
    reservadas: propiedades.filter(p => p.estado_propiedad === 'Reservada').length,
    cerradas: propiedades.filter(p => p.estado_propiedad === 'Cerrada').length,
    venta: propiedades.filter(p => p.tipo_operacion_propiedad === 'Venta').length,
    alquiler: propiedades.filter(p => p.tipo_operacion_propiedad === 'Alquiler').length
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
          <h1 className="text-3xl font-bold text-gray-900">Propiedades</h1>
          <p className="text-gray-600 mt-1">Gestiona el catálogo de propiedades inmobiliarias</p>
        </div>
        <button
          onClick={() => navigate('/propiedades/nuevo')}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Nueva Propiedad
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Propiedades</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <BuildingOfficeIcon className="h-10 w-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Publicadas</p>
              <p className="text-2xl font-bold text-blue-600">{stats.publicadas}</p>
            </div>
            <CheckCircleIcon className="h-10 w-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En Venta</p>
              <p className="text-2xl font-bold text-green-600">{stats.venta}</p>
            </div>
            <CurrencyDollarIcon className="h-10 w-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En Alquiler</p>
              <p className="text-2xl font-bold text-orange-600">{stats.alquiler}</p>
            </div>
            <HomeIcon className="h-10 w-10 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por título, código o propietario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Tipo de Operación */}
          <select
            value={tipoOperacionFilter}
            onChange={(e) => setTipoOperacionFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos los tipos</option>
            <option value="Venta">Venta</option>
            <option value="Alquiler">Alquiler</option>
            <option value="Anticrético">Anticrético</option>
          </select>

          {/* Estado */}
          <select
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos los estados</option>
            <option value="Captada">Captada</option>
            <option value="Publicada">Publicada</option>
            <option value="Reservada">Reservada</option>
            <option value="Cerrada">Cerrada</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Mostrando {filteredPropiedades.length} de {stats.total} propiedades
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Título
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Propietario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Superficie
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
              {filteredPropiedades.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    <HomeIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p>No se encontraron propiedades</p>
                  </td>
                </tr>
              ) : (
                filteredPropiedades.map((propiedad) => (
                  <tr key={propiedad.id_propiedad} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {propiedad.codigo_publico_propiedad || 'Sin código'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="font-medium">{propiedad.titulo_propiedad}</div>
                      {propiedad.descripcion_propiedad && (
                        <div className="text-gray-500 text-xs truncate max-w-xs">
                          {propiedad.descripcion_propiedad}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getPropietarioNombre(propiedad.ci_propietario)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoOperacionBadgeColor(propiedad.tipo_operacion_propiedad)}`}>
                        {propiedad.tipo_operacion_propiedad || 'No especificado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {formatPrice(propiedad.precio_publicado_propiedad)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {propiedad.superficie_propiedad ? `${propiedad.superficie_propiedad} m²` : 'N/D'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoBadgeColor(propiedad.estado_propiedad)}`}>
                        {propiedad.estado_propiedad || 'Sin estado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/propiedades/editar/${propiedad.id_propiedad}`)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(propiedad.id_propiedad, propiedad.titulo_propiedad)}
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

export default PropiedadesList;
