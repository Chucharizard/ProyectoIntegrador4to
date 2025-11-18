import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  CalendarDaysIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  UserIcon,
  HomeIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import citaVisitaService from '../../services/citaVisitaService';
import propiedadService from '../../services/propiedadService';
import clienteService from '../../services/clienteService';
import usuarioService from '../../services/usuarioService';

const CitasList = () => {
  const navigate = useNavigate();
  const [citas, setCitas] = useState([]);
  const [propiedades, setPropiedades] = useState({});
  const [clientes, setClientes] = useState({});
  const [usuarios, setUsuarios] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const isMounted = useRef(true);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    programadas: 0,
    realizadas: 0,
    canceladas: 0
  });

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchData = async () => {
    const abortController = new AbortController();
    
    try {
      setLoading(true);

      // Cargar datos en paralelo
      const [citasData, propiedadesData, clientesData, usuariosData] = await Promise.all([
        citaVisitaService.getAll({ estado: estadoFilter }, abortController.signal),
        propiedadService.getAll(abortController.signal),
        clienteService.getAll(abortController.signal),
        usuarioService.getAll(abortController.signal)
      ]);

      if (!isMounted.current) return;

      // Crear mapas para búsqueda rápida
      const propiedadesMap = {};
      propiedadesData.forEach(p => {
        propiedadesMap[p.id_propiedad] = p;
      });

      const clientesMap = {};
      clientesData.forEach(c => {
        clientesMap[c.ci_cliente] = c;
      });

      const usuariosMap = {};
      usuariosData.forEach(u => {
        usuariosMap[u.id_usuario] = u;
      });

      setPropiedades(propiedadesMap);
      setClientes(clientesMap);
      setUsuarios(usuariosMap);
      setCitas(citasData);

      // Calcular estadísticas
      calculateStats(citasData);

    } catch (error) {
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
        console.log('Petición cancelada');
        return;
      }
      if (isMounted.current) {
        console.error('Error al cargar citas:', error);
        toast.error('Error al cargar las citas');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }

    return () => abortController.abort();
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estadoFilter]);

  const calculateStats = (citasData) => {
    const total = citasData.length;
    const programadas = citasData.filter(c => c.estado_cita === 'Programada').length;
    const realizadas = citasData.filter(c => c.estado_cita === 'Realizada').length;
    const canceladas = citasData.filter(c => c.estado_cita === 'Cancelada').length;

    setStats({ total, programadas, realizadas, canceladas });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar esta cita?')) return;

    try {
      await citaVisitaService.delete(id);
      toast.success('Cita eliminada exitosamente');
      fetchData();
    } catch (error) {
      console.error('Error al eliminar cita:', error);
      toast.error('Error al eliminar la cita');
    }
  };

  const filteredCitas = citas.filter(cita => {
    const propiedad = propiedades[cita.id_propiedad];
    const cliente = clientes[cita.ci_cliente];
    const asesor = usuarios[cita.id_usuario_asesor];
    
    const searchLower = searchTerm.toLowerCase();
    
    return (
      (propiedad?.titulo_propiedad?.toLowerCase().includes(searchLower)) ||
      (cliente?.nombres_completo_cliente?.toLowerCase().includes(searchLower)) ||
      (cliente?.apellidos_completo_cliente?.toLowerCase().includes(searchLower)) ||
      (asesor?.nombre_usuario?.toLowerCase().includes(searchLower)) ||
      (cita.lugar_encuentro_cita?.toLowerCase().includes(searchLower))
    );
  });

  const getEstadoBadgeColor = (estado) => {
    const colors = {
      'Programada': 'bg-blue-100 text-blue-800 border-blue-200',
      'Realizada': 'bg-green-100 text-green-800 border-green-200',
      'Cancelada': 'bg-red-100 text-red-800 border-red-200',
      'Reprogramada': 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colors[estado] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-900 to-primary-700 bg-clip-text text-transparent">
            Citas y Visitas
          </h1>
          <p className="text-gray-600 mt-1">Gestión de visitas a propiedades</p>
        </div>
        <button
          onClick={() => navigate('/citas/nuevo')}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Nueva Cita
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-primary-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Citas</p>
              <p className="text-3xl font-bold text-primary-900">{stats.total}</p>
            </div>
            <CalendarDaysIcon className="h-12 w-12 text-primary-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Programadas</p>
              <p className="text-3xl font-bold text-blue-600">{stats.programadas}</p>
            </div>
            <ClockIcon className="h-12 w-12 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Realizadas</p>
              <p className="text-3xl font-bold text-green-600">{stats.realizadas}</p>
            </div>
            <CalendarDaysIcon className="h-12 w-12 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Canceladas</p>
              <p className="text-3xl font-bold text-red-600">{stats.canceladas}</p>
            </div>
            <TrashIcon className="h-12 w-12 text-red-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por propiedad, cliente, asesor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>

          <select
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            className="input-field"
          >
            <option value="">Todos los estados</option>
            <option value="Programada">Programada</option>
            <option value="Realizada">Realizada</option>
            <option value="Cancelada">Cancelada</option>
            <option value="Reprogramada">Reprogramada</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-primary-900 to-primary-800">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Fecha y Hora
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Propiedad
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Asesor
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Lugar
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-white uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCitas.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium">No hay citas registradas</p>
                    <p className="text-sm">Comienza creando una nueva cita</p>
                  </td>
                </tr>
              ) : (
                filteredCitas.map((cita) => {
                  const propiedad = propiedades[cita.id_propiedad];
                  const cliente = clientes[cita.ci_cliente];
                  const asesor = usuarios[cita.id_usuario_asesor];

                  return (
                    <tr key={cita.id_cita} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <ClockIcon className="h-5 w-5 text-primary-500 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {formatDateTime(cita.fecha_visita_cita)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start">
                          <HomeIcon className="h-5 w-5 text-secondary-500 mr-2 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {propiedad?.titulo_propiedad || 'N/A'}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {propiedad?.codigo_publico_propiedad || ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <UserIcon className="h-5 w-5 text-accent-500 mr-2" />
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {cliente?.nombres_completo_cliente || 'N/A'} {cliente?.apellidos_completo_cliente || ''}
                            </div>
                            <div className="text-gray-500 text-xs">
                              CI: {cita.ci_cliente}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {asesor?.nombre_usuario || 'Sin asignar'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start">
                          <MapPinIcon className="h-5 w-5 text-primary-500 mr-2 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {cita.lugar_encuentro_cita || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getEstadoBadgeColor(cita.estado_cita)}`}>
                          {cita.estado_cita}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button
                          onClick={() => navigate(`/citas/editar/${cita.id_cita}`)}
                          className="text-secondary-600 hover:text-secondary-900 mr-3 transition-colors"
                          title="Editar"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cita.id_cita)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Eliminar"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CitasList;
