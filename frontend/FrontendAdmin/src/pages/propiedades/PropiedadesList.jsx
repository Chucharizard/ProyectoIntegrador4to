import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { propiedadService } from '../../services/propiedadService';
import { propietarioService } from '../../services/propietarioService';
import { 
  PencilIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  HomeIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// ✨ Importar componentes reutilizables
import PageHeader from '../../components/shared/PageHeader';
import StatsCard from '../../components/shared/StatsCard';
import DataTable from '../../components/shared/DataTable';

const PropiedadesList = () => {
  // Estados de datos
  const [loading, setLoading] = useState(true);
  const [allPropiedades, setAllPropiedades] = useState([]);
  const [propietarios, setPropietarios] = useState([]);
  
  // Estados de paginación
  const [page, setPage] = useState(1);
  const [pageSize] = useState(30);
  
  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoOperacionFilter, setTipoOperacionFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  
  const navigate = useNavigate();

  // ====================================
  // 📥 CARGAR PROPIEDADES (UNA SOLA VEZ)
  // ====================================
  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Cargar TODAS las propiedades (sin paginación del backend)
        const [propiedadesData, propietariosData] = await Promise.all([
          propiedadService.getAllSimple(controller.signal),
          propietarioService.getAll(controller.signal)
        ]);
        
        if (isMounted) {
          setAllPropiedades(propiedadesData);
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
          setAllPropiedades([]);
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

  // ====================================
  // 🗑️ ELIMINAR PROPIEDAD
  // ====================================
  const handleDelete = async (id, titulo) => {
    if (window.confirm(`¿Estás seguro de eliminar la propiedad "${titulo}"?`)) {
      try {
        await propiedadService.delete(id);
        toast.success('Propiedad eliminada exitosamente');
        
        // Recargar todas las propiedades
        const data = await propiedadService.getAllSimple();
        setAllPropiedades(data);
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
      'Captada': 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
      'Publicada': 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
      'Reservada': 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
      'Cerrada': 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
    };
    return colors[estado] || 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
  };

  const getTipoOperacionBadgeColor = (tipo) => {
    const colors = {
      'Venta': 'bg-green-500/20 text-green-300 border border-green-500/30',
      'Alquiler': 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
      'Anticrético': 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
    };
    return colors[tipo] || 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
  };

  const formatPrice = (price) => {
    if (!price) return 'No especificado';
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB'
    }).format(price);
  };

  // ====================================
  // 🔍 FILTRADO EN EL CLIENTE
  // ====================================
  const filteredPropiedades = allPropiedades.filter(prop => {
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

  // ====================================
  // 📄 PAGINACIÓN EN EL CLIENTE
  // ====================================
  const totalFilteredItems = filteredPropiedades.length;
  const totalPages = Math.ceil(totalFilteredItems / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedPropiedades = filteredPropiedades.slice(startIndex, endIndex);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    setPage(1);
  }, [searchTerm, tipoOperacionFilter, estadoFilter]);

  // ====================================
  // 📊 ESTADÍSTICAS
  // ====================================
  const stats = {
    total: allPropiedades.length,
    publicadas: allPropiedades.filter(p => p.estado_propiedad === 'Publicada').length,
    venta: allPropiedades.filter(p => p.tipo_operacion_propiedad === 'Venta').length,
    alquiler: allPropiedades.filter(p => p.tipo_operacion_propiedad === 'Alquiler').length
  };

  // 📋 Definir columnas de la tabla
  const columns = [
    {
      header: 'Código',
      render: (row) => (
        <span className="font-medium text-gray-200">
          {row.codigo_publico_propiedad || 'Sin código'}
        </span>
      )
    },
    {
      header: 'Título',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-200">{row.titulo_propiedad}</div>
          {row.descripcion_propiedad && (
            <div className="text-gray-400 text-xs truncate max-w-xs">
              {row.descripcion_propiedad}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Propietario',
      render: (row) => (
        <span className="text-gray-300">{getPropietarioNombre(row.ci_propietario)}</span>
      )
    },
    {
      header: 'Tipo',
      render: (row) => (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTipoOperacionBadgeColor(row.tipo_operacion_propiedad)}`}>
          {row.tipo_operacion_propiedad || 'No especificado'}
        </span>
      )
    },
    {
      header: 'Precio',
      render: (row) => (
        <span className="font-medium text-green-400">
          {formatPrice(row.precio_publicado_propiedad)}
        </span>
      )
    },
    {
      header: 'Superficie',
      render: (row) => (
        <span className="text-gray-300">
          {row.superficie_propiedad ? `${row.superficie_propiedad} m²` : 'N/D'}
        </span>
      )
    },
    {
      header: 'Estado',
      render: (row) => (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getEstadoBadgeColor(row.estado_propiedad)}`}>
          {row.estado_propiedad || 'Sin estado'}
        </span>
      )
    },
    {
      header: 'Acciones',
      render: (row) => (
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/propiedades/editar/${row.id_propiedad}`)}
            className="text-blue-400 hover:text-blue-300 transition-colors p-1 hover:bg-blue-500/10 rounded"
            title="Editar"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleDelete(row.id_propiedad, row.titulo_propiedad)}
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
        title="Propiedades"
        description="Gestiona el catálogo de propiedades inmobiliarias"
        buttonText="Nueva Propiedad"
        onButtonClick={() => navigate('/propiedades/nuevo')}
      />

      {/* ✨ Stats Cards Component */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard 
          label="Total Propiedades" 
          value={stats.total} 
          icon={BuildingOfficeIcon} 
          color="blue" 
        />
        <StatsCard 
          label="Publicadas" 
          value={stats.publicadas} 
          icon={CheckCircleIcon} 
          color="blue" 
        />
        <StatsCard 
          label="En Venta" 
          value={stats.venta} 
          icon={CurrencyDollarIcon} 
          color="green" 
        />
        <StatsCard 
          label="En Alquiler" 
          value={stats.alquiler} 
          icon={HomeIcon} 
          color="purple" 
        />
      </div>

      {/* Filters */}
      <div className="relative bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-xl border border-green-500/20 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-green-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por título, código o propietario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
            />
          </div>

          {/* Tipo de Operación */}
          <select
            value={tipoOperacionFilter}
            onChange={(e) => setTipoOperacionFilter(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
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
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
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
      <div className="text-sm text-gray-400">
        Mostrando <span className="text-green-400 font-semibold">{(page - 1) * pageSize + 1}</span> - <span className="text-green-400 font-semibold">{Math.min(page * pageSize, totalFilteredItems)}</span> de <span className="text-green-400 font-semibold">{totalFilteredItems}</span> propiedades
      </div>

      {/* ✨ Data Table Component */}
      <DataTable
        columns={columns}
        data={paginatedPropiedades}
        emptyMessage="No se encontraron propiedades"
        emptyIcon={HomeIcon}
      />

      {/* ✨ Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-white/10 pt-4 bg-white/5 p-4 rounded-lg">
          <div className="text-sm text-gray-400">
            Página <span className="text-green-400 font-semibold">{page}</span> de <span className="text-green-400 font-semibold">{totalPages}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={!hasPrev}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                hasPrev
                  ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20'
                  : 'bg-gray-800/50 text-gray-600 cursor-not-allowed border border-gray-700/20'
              }`}
            >
              Anterior
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={!hasNext}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                hasNext
                  ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20'
                  : 'bg-gray-800/50 text-gray-600 cursor-not-allowed border border-gray-700/20'
              }`}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropiedadesList;
