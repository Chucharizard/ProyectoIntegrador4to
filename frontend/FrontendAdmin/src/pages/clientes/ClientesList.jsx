import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrashIcon, 
  PencilIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  XMarkIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import clienteService from '../../services/clienteService';
import toast from 'react-hot-toast';

// ✨ Importar componentes reutilizables
import PageHeader from '../../components/shared/PageHeader';
import StatsCard from '../../components/shared/StatsCard';
import SearchBar from '../../components/shared/SearchBar';
import DataTable from '../../components/shared/DataTable';

/**
 * ✅ Componente MEJORADO con Paginación del Backend
 */
const ClientesList = () => {
  const navigate = useNavigate();

  // Estados de datos
  const [loading, setLoading] = useState(true);
  const [error] = useState(null);
  const [allClientes, setAllClientes] = useState([]);

  // Estados de paginación
  const [page, setPage] = useState(1);
  const [pageSize] = useState(30); // Puedes hacerlo configurable

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [origenFilter, setOrigenFilter] = useState('');
  const [zonaFilter, setZonaFilter] = useState('');
  const [misClientes, setMisClientes] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // ====================================
  // 📥 CARGAR CLIENTES (UNA SOLA VEZ)
  // ====================================
  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        // Cargar TODOS los clientes (sin paginación del backend)
        const data = await clienteService.getAllSimple(controller.signal);
        
        if (isMounted) {
          setAllClientes(data);
        }
      } catch (error) {
        if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError') {
          console.log('Petición cancelada');
          return;
        }
        
        if (isMounted) {
          console.error('Error loading clientes:', error);
          toast.error('Error al cargar clientes');
          setAllClientes([]);
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
  // 🔍 FILTRADO EN EL CLIENTE
  // ====================================
  const filteredClientes = allClientes.filter(cliente => {
    if (!cliente) return false;
    
    // Filtro de búsqueda
    const term = searchTerm.toLowerCase();
    const matchSearch = !searchTerm || 
      (cliente.ci_cliente || '').toLowerCase().includes(term) ||
      (cliente.nombres_completo_cliente || '').toLowerCase().includes(term) ||
      (cliente.correo_electronico_cliente || '').toLowerCase().includes(term) ||
      (cliente.telefono_cliente || '').toLowerCase().includes(term);
    
    // Filtro de origen
    const matchOrigen = !origenFilter || cliente.origen_cliente === origenFilter;
    
    // Filtro de zona
    const matchZona = !zonaFilter || 
      (cliente.preferencia_zona_cliente || '').toLowerCase().includes(zonaFilter.toLowerCase());
    
    // Filtro de "mis clientes" (si aplica - necesitarías el id_usuario_registrador)
    const matchMisClientes = !misClientes; // Por ahora deshabilitado, necesitas comparar con usuario actual
    
    return matchSearch && matchOrigen && matchZona && matchMisClientes;
  });

  // ====================================
  // 📄 PAGINACIÓN EN EL CLIENTE
  // ====================================
  const totalFilteredItems = filteredClientes.length;
  const totalPages = Math.ceil(totalFilteredItems / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedClientes = filteredClientes.slice(startIndex, endIndex);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    setPage(1);
  }, [searchTerm, origenFilter, zonaFilter, misClientes]);

  // ====================================
  // 🗑️ ELIMINAR CLIENTE
  // ====================================
  const handleDelete = async (ci) => {
    if (!window.confirm('¿Estás seguro de eliminar este cliente?')) return;

    try {
      await clienteService.delete(ci);
      toast.success('Cliente eliminado exitosamente');
      
      // Recargar la lista
      const controller = new AbortController();
      const data = await clienteService.getAllSimple(controller.signal);
      setAllClientes(data);
      
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      toast.error('Error al eliminar el cliente');
    }
  };

  // ====================================
  // 📄 NAVEGACIÓN DE PÁGINAS
  // ====================================
  const goToPage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToNextPage = () => goToPage(page + 1);
  const goToPrevPage = () => goToPage(page - 1);

  // ====================================
  // 🧹 LIMPIAR FILTROS
  // ====================================
  const clearFilters = () => {
    setSearchTerm('');
    setOrigenFilter('');
    setZonaFilter('');
    setMisClientes(false);
    setPage(1);
  };

  // ====================================
  // 📊 ESTADÍSTICAS
  // ====================================
const stats = [
  {
    label: 'Total', // ✨ CAMBIA 'title' POR 'label' AQUÍ
    value: totalFilteredItems,
    icon: UserGroupIcon,
    color: 'blue'
  },
  {
    label: 'Página Actual', // ✨ Y AQUÍ
    value: paginatedClientes.length,
    icon: UserGroupIcon,
    color: 'green'
  },
  {
    label: 'Páginas', // ✨ Y AQUÍ
    value: totalPages,
    icon: UserGroupIcon,
    color: 'purple'
  }
];

  // ====================================
  // 📊 COLUMNAS DE LA TABLA
  // ====================================
  const columns = [
    {
      header: 'CI',
      render: (row) => (
        <span className="font-medium text-gray-200">{row.ci_cliente}</span>
      )
    },
    {
      header: 'Nombre Completo',
      render: (row) => (
        <span className="font-medium text-gray-100">{row.nombres_completo_cliente}</span>
      )
    },
    {
      header: 'Teléfono',
      render: (row) => (
        <span className="text-gray-300">{row.telefono_cliente || '-'}</span>
      )
    },
    {
      header: 'Correo',
      render: (row) => (
        <span className="text-gray-300">{row.correo_electronico_cliente || '-'}</span>
      )
    },
    {
      header: 'Origen',
      render: (row) => (
        <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs">
          {row.origen_cliente || 'Sin especificar'}
        </span>
      )
    },
    {
      header: 'Acciones',
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/clientes/${row.ci_cliente}`)}
            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all duration-200"
            title="Editar"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleDelete(row.ci_cliente)}
            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
            title="Eliminar"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      )
    }
  ];

  // ====================================
  // 🎨 RENDERIZADO
  // ====================================

  // Calcular rango de items mostrados
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalFilteredItems);

  // Hay filtros activos?
  const hasActiveFilters = searchTerm || origenFilter || zonaFilter || misClientes;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <PageHeader 
        title="Gestión de Clientes"
        subtitle={totalFilteredItems > 0 
          ? `Mostrando ${startItem} - ${endItem} de ${totalFilteredItems} clientes`
          : 'No hay clientes registrados'
        }
        buttonText="Nuevo Cliente"
        onButtonClick={() => navigate('/clientes/nuevo')}
      />

      {/* ESTADÍSTICAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="glass-card p-4">
        <div className="flex gap-4 items-center mb-4">
          <div className="flex-1">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar por nombre o CI..."
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              showFilters 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                : 'glass-effect text-gray-300 hover:bg-white/10'
            }`}
          >
            <FunnelIcon className="w-5 h-5" />
            Filtros
            {hasActiveFilters && (
              <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                !
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 glass-effect text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
            >
              <XMarkIcon className="w-5 h-5" />
              Limpiar
            </button>
          )}
        </div>

        {/* PANEL DE FILTROS */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/10">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Origen
              </label>
              <select
                value={origenFilter}
                onChange={(e) => {
                  setOrigenFilter(e.target.value);
                  setPage(1);
                }}
                className="input-field w-full"
              >
                <option value="">Todos</option>
                <option value="Redes sociales">Redes sociales</option>
                <option value="Referido">Referido</option>
                <option value="Web">Web</option>
                <option value="Llamada directa">Llamada directa</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Zona de Preferencia
              </label>
              <input
                type="text"
                value={zonaFilter}
                onChange={(e) => {
                  setZonaFilter(e.target.value);
                  setPage(1);
                }}
                placeholder="Ej: Zona Sur"
                className="input-field w-full"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={misClientes}
                  onChange={(e) => {
                    setMisClientes(e.target.checked);
                    setPage(1);
                  }}
                  className="w-4 h-4 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-500 focus:ring-offset-0"
                />
                <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                  Solo mis clientes
                </span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* TABLA */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-400">
            {error}
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={paginatedClientes}
              emptyMessage={
                hasActiveFilters 
                  ? "No se encontraron clientes con los filtros aplicados" 
                  : "No hay clientes registrados"
              }
            />

            {/* PAGINACIÓN */}
            {totalPages > 1 && (
              <div className="border-t border-white/10 p-4 bg-white/5">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Info */}
                  <div className="text-sm text-gray-300">
                    Página <span className="font-semibold text-white">{page}</span> de{' '}
                    <span className="font-semibold text-white">{totalPages}</span>
                  </div>

                  {/* Controles */}
                  <div className="flex items-center gap-2 flex-wrap justify-center">
                    <button
                      onClick={goToFirstPage}
                      disabled={!hasPrev}
                      className="px-3 py-2 rounded-lg glass-effect text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all duration-200"
                      title="Primera página"
                    >
                      {'<<'}
                    </button>
                    
                    <button
                      onClick={goToPrevPage}
                      disabled={!hasPrev}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg glass-effect text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all duration-200"
                    >
                      <ChevronLeftIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">Anterior</span>
                    </button>

                    {/* Números de página */}
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => goToPage(pageNum)}
                            className={`px-3 py-2 rounded-lg transition-all duration-200 ${
                              page === pageNum
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                                : 'glass-effect text-gray-300 hover:bg-white/10'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={goToNextPage}
                      disabled={!hasNext}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg glass-effect text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all duration-200"
                    >
                      <span className="hidden sm:inline">Siguiente</span>
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>

                    <button
                      onClick={goToLastPage}
                      disabled={!hasNext}
                      className="px-3 py-2 rounded-lg glass-effect text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all duration-200"
                      title="Última página"
                    >
                      {'>>'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ClientesList;
