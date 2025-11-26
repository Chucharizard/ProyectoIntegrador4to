import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { empleadoService } from '../../services/empleadoService';
import { 
  PencilIcon, 
  TrashIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// ✨ Importar componentes reutilizables
import PageHeader from '../../components/shared/PageHeader';
import StatsCard from '../../components/shared/StatsCard';
import SearchBar from '../../components/shared/SearchBar';
import DataTable from '../../components/shared/DataTable';

const EmpleadosList = () => {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados de paginación
  const [page, setPage] = useState(1);
  const [pageSize] = useState(30);
  
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const empleadosData = await empleadoService.getAll(controller.signal);
        if (isMounted) {
          setEmpleados(empleadosData);
        }
      } catch (error) {
        if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError') {
          console.log('Peticiones canceladas');
          return;
        }
        if (isMounted) {
          console.error('Error loading data:', error);
          toast.error('Error al cargar datos');
          setEmpleados([]);
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
    if (window.confirm('¿Estás seguro de eliminar este empleado?')) {
      try {
        await empleadoService.delete(ci);
        toast.success('Empleado eliminado exitosamente');
        const empleadosData = await empleadoService.getAll();
        setEmpleados(empleadosData);
      } catch (error) {
        console.error('Error deleting empleado:', error);
        toast.error('Error al eliminar empleado');
      }
    }
  };

  // ====================================
  // 🔍 FILTRADO
  // ====================================
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

  // ====================================
  // 📄 PAGINACIÓN LOCAL
  // ====================================
  const totalFilteredItems = filteredEmpleados.length;
  const totalPages = Math.ceil(totalFilteredItems / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedEmpleados = filteredEmpleados.slice(startIndex, endIndex);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  // Resetear a página 1 cuando cambia la búsqueda
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  // ====================================
  // 📊 ESTADÍSTICAS
  // ====================================
  const stats = {
    total: empleados.length,
    filtered: filteredEmpleados.length,
    activos: empleados.filter(e => e.es_activo_empleado).length,
    inactivos: empleados.filter(e => !e.es_activo_empleado).length
  };

  // 📋 Definir columnas de la tabla
  const columns = [
    { 
      header: 'CI', 
      render: (row) => (
        <span className="font-medium text-gray-200">{row.ci_empleado}</span>
      )
    },
    { 
      header: 'Nombres', 
      accessor: 'nombres_completo_empleado' 
    },
    { 
      header: 'Apellidos', 
      accessor: 'apellidos_completo_empleado' 
    },
    { 
      header: 'Teléfono', 
      accessor: 'telefono_empleado' 
    },
    { 
      header: 'Correo', 
      accessor: 'correo_electronico_empleado' 
    },
    { 
      header: 'Estado', 
      render: (row) => (
        row.es_activo_empleado ? (
          <span className="flex items-center gap-2 text-green-400">
            <CheckCircleIcon className="h-5 w-5" />
            <span className="font-medium">Activo</span>
          </span>
        ) : (
          <span className="flex items-center gap-2 text-red-400">
            <XCircleIcon className="h-5 w-5" />
            <span className="font-medium">Inactivo</span>
          </span>
        )
      )
    },
    {
      header: 'Acciones',
      render: (row) => (
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/empleados/editar/${row.ci_empleado}`)}
            className="text-blue-400 hover:text-blue-300 transition-colors p-1 hover:bg-blue-500/10 rounded"
            title="Editar"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleDelete(row.ci_empleado)}
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
        title="Empleados"
        description="Gestiona la información de los empleados"
        buttonText="Nuevo Empleado"
        onButtonClick={() => navigate('/empleados/nuevo')}
      />

      {/* ✨ Stats Cards Component */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard 
          label="Total" 
          value={stats.total} 
          icon={UserGroupIcon} 
          color="blue" 
        />
        <StatsCard 
          label="Filtrados" 
          value={stats.filtered} 
          icon={MagnifyingGlassIcon} 
          color="purple" 
        />
        <StatsCard 
          label="Activos" 
          value={stats.activos} 
          icon={CheckCircleIcon} 
          color="green" 
        />
        <StatsCard 
          label="Inactivos" 
          value={stats.inactivos} 
          icon={XCircleIcon} 
          color="red" 
        />
      </div>

      {/* ✨ Search Bar Component */}
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar por CI, nombre, apellido o correo..."
      />

      {/* Info de resultados */}
      <div className="text-sm text-gray-400">
        Mostrando <span className="text-green-400 font-semibold">{(page - 1) * pageSize + 1}</span> - <span className="text-green-400 font-semibold">{Math.min(page * pageSize, totalFilteredItems)}</span> de <span className="text-green-400 font-semibold">{totalFilteredItems}</span> empleados
      </div>

      {/* ✨ Data Table Component */}
      <DataTable
        columns={columns}
        data={paginatedEmpleados}
        emptyMessage="No se encontraron empleados"
        emptyIcon={UserGroupIcon}
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

export default EmpleadosList;
