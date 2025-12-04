import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  CalendarDaysIcon,
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

// ✨ Importar componentes reutilizables
import PageHeader from '../../components/shared/PageHeader';
import StatsCard from '../../components/shared/StatsCard';
import DataTable from '../../components/shared/DataTable';

const CitasList = () => {
  // ✅ HELPER PARA EXTRAER ARRAY (agregado al inicio)
  const extractArray = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.items && Array.isArray(data.items)) return data.items;
    return [];
  };

  const navigate = useNavigate();
  const [citas, setCitas] = useState([]);
  const [propiedades, setPropiedades] = useState({});
  const [clientes, setClientes] = useState({});
  const [usuarios, setUsuarios] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const isMounted = useRef(true);

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

      const [citasData, propiedadesData, clientesData, usuariosData] = await Promise.all([
        citaVisitaService.getAll({ 
          page: 1, 
          pageSize: 100,
          estado: estadoFilter || null 
        }, abortController.signal),
        propiedadService.getAll(abortController.signal, { page: 1, pageSize: 100 }),
        clienteService.getAll(abortController.signal, { page: 1, pageSize: 100 }),
        usuarioService.getAll(abortController.signal)
      ]);

      if (!isMounted.current) return;

      // ✅ EXTRAER ARRAYS USANDO HELPER
      const citasList = extractArray(citasData);
      const propiedadesList = extractArray(propiedadesData);
      const clientesList = extractArray(clientesData);
      const usuariosList = extractArray(usuariosData);

      // Crear mapas
      const propiedadesMap = {};
      propiedadesList.forEach(p => {
        propiedadesMap[p.id_propiedad] = p;
      });

      const clientesMap = {};
      clientesList.forEach(c => {
        clientesMap[c.ci_cliente] = c;
      });

      const usuariosMap = {};
      usuariosList.forEach(u => {
        usuariosMap[u.id_usuario] = u;
      });

      setPropiedades(propiedadesMap);
      setClientes(clientesMap);
      setUsuarios(usuariosMap);
      setCitas(citasList); // ✅ Ya es array
      calculateStats(citasList); // ✅ Pasar array

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
    // ✅ USAR HELPER AQUÍ
    const citasList = extractArray(citasData);

    const total = citasList.length;
    const programadas = citasList.filter(c => c.estado_cita === 'Programada').length;
    const realizadas = citasList.filter(c => c.estado_cita === 'Realizada').length;
    const canceladas = citasList.filter(c => c.estado_cita === 'Cancelada').length;

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

  // ✅ USAR HELPER AQUÍ
  const filteredCitas = extractArray(citas).filter(cita => {
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
      'Programada': 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
      'Realizada': 'bg-green-500/20 text-green-300 border border-green-500/30',
      'Cancelada': 'bg-red-500/20 text-red-300 border border-red-500/30',
      'Reprogramada': 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
    };
    return colors[estado] || 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
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

  // 📋 Definir columnas de la tabla
  const columns = [
    {
      header: 'Fecha/Hora',
      render: (cita) => (
        <div className="flex items-center min-w-[130px]">
          <ClockIcon className="h-4 w-4 text-green-400 mr-1.5" />
          <span className="text-xs font-medium">{formatDateTime(cita.fecha_visita_cita)}</span>
        </div>
      )
    },
    {
      header: 'Propiedad',
      render: (cita) => {
        const propiedad = propiedades[cita.id_propiedad];
        return (
          <div className="max-w-[180px]">
            <div className="font-medium text-gray-200 text-xs truncate">{propiedad?.titulo_propiedad || 'N/A'}</div>
            <div className="text-gray-400 text-xs">{propiedad?.codigo_publico_propiedad || ''}</div>
          </div>
        );
      }
    },
    {
      header: 'Cliente',
      render: (cita) => {
        const cliente = clientes[cita.ci_cliente];
        return (
          <div className="max-w-[150px]">
            <div className="font-medium text-gray-200 text-xs truncate">
              {cliente?.nombres_completo_cliente || 'N/A'} {cliente?.apellidos_completo_cliente || ''}
            </div>
            <div className="text-gray-400 text-xs">CI: {cita.ci_cliente}</div>
          </div>
        );
      }
    },
    {
      header: 'Asesor',
      render: (cita) => {
        const asesor = usuarios[cita.id_usuario_asesor];
        return (
          <span className="text-xs text-gray-300 truncate block max-w-[120px]">{asesor?.nombre_usuario || 'Sin asignar'}</span>
        );
      }
    },
    {
      header: 'Lugar',
      render: (cita) => (
        <div className="flex items-start max-w-[150px]">
          <MapPinIcon className="h-4 w-4 text-green-400 mr-1.5 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-gray-300 truncate">
            {cita.lugar_encuentro_cita || 'N/A'}
          </div>
        </div>
      )
    },
    {
      header: 'Estado',
      render: (cita) => (
        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoBadgeColor(cita.estado_cita)}`}>
          {cita.estado_cita}
        </span>
      )
    },
    {
      header: 'Acciones',
      render: (cita) => (
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(`/citas/editar/${cita.id_cita}`)}
            className="text-blue-400 hover:text-blue-300 transition-colors p-1 hover:bg-blue-500/10 rounded"
            title="Editar"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleDelete(cita.id_cita)}
            className="text-red-400 hover:text-red-300 transition-colors p-1 hover:bg-red-500/10 rounded"
            title="Eliminar"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      )
    }
  ];

  if (loading) {
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
    <div className="space-y-6">
      {/* ✨ Header Component */}
      <PageHeader
        title="Citas y Visitas"
        description="Gestión de visitas a propiedades"
        buttonText="Nueva Cita"
        onButtonClick={() => navigate('/citas/nuevo')}
      />

      {/* ✨ Stats Cards Component */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard 
          label="Total Citas" 
          value={stats.total} 
          icon={CalendarDaysIcon} 
          color="green" 
        />
        <StatsCard 
          label="Programadas" 
          value={stats.programadas} 
          icon={ClockIcon} 
          color="blue" 
        />
        <StatsCard 
          label="Realizadas" 
          value={stats.realizadas} 
          icon={CalendarDaysIcon} 
          color="green" 
        />
        <StatsCard 
          label="Canceladas" 
          value={stats.canceladas} 
          icon={TrashIcon} 
          color="red" 
        />
      </div>

      {/* Filters */}
      <div className="relative bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-xl border border-green-500/20 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-green-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por propiedad, cliente, asesor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
            />
          </div>

          <select
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
          >
            <option value="">Todos los estados</option>
            <option value="Programada">Programada</option>
            <option value="Realizada">Realizada</option>
            <option value="Cancelada">Cancelada</option>
            <option value="Reprogramada">Reprogramada</option>
          </select>
        </div>
      </div>

      {/* ✨ Data Table Component */}
      <DataTable
        columns={columns}
        data={filteredCitas}
        emptyMessage="No hay citas registradas. Comienza creando una nueva cita"
        emptyIcon={CalendarDaysIcon}
      />
    </div>
  );
};

export default CitasList;
