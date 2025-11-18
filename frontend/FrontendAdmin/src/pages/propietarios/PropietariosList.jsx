import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { propietarioService } from '../../services/propietarioService';
import { 
  PencilIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// ✨ Importar componentes reutilizables
import PageHeader from '../../components/shared/PageHeader';
import StatsCard from '../../components/shared/StatsCard';
import SearchBar from '../../components/shared/SearchBar';
import DataTable from '../../components/shared/DataTable';

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

  // 📋 Definir columnas de la tabla
  const columns = [
    {
      header: 'CI',
      render: (row) => (
        <span className="font-medium text-gray-200">{row.ci_propietario}</span>
      )
    },
    {
      header: 'Nombres',
      render: (row) => (
        <span className="text-gray-300">{row.nombres_completo_propietario}</span>
      )
    },
    {
      header: 'Apellidos',
      render: (row) => (
        <span className="text-gray-300">{row.apellidos_completo_propietario}</span>
      )
    },
    {
      header: 'Teléfono',
      render: (row) => (
        <span className="text-gray-300">{row.telefono_propietario}</span>
      )
    },
    {
      header: 'Correo',
      render: (row) => (
        <span className="text-gray-300">{row.correo_electronico_propietario}</span>
      )
    },
    {
      header: 'Estado',
      render: (row) => (
        row.es_activo_propietario ? (
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
            onClick={() => navigate(`/propietarios/editar/${row.ci_propietario}`)}
            className="text-blue-400 hover:text-blue-300 transition-colors p-1 hover:bg-blue-500/10 rounded"
            title="Editar"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleDelete(row.ci_propietario)}
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
        title="Propietarios"
        description="Gestiona la información de los propietarios de inmuebles"
        buttonText="Nuevo Propietario"
        onButtonClick={() => navigate('/propietarios/nuevo')}
      />

      {/* ✨ Stats Cards Component */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard label="Total" value={stats.total} icon={UserGroupIcon} color="blue" />
        <StatsCard label="Filtrados" value={stats.filtered} icon={MagnifyingGlassIcon} color="purple" />
        <StatsCard label="Activos" value={stats.activos} icon={CheckCircleIcon} color="green" />
        <StatsCard label="Inactivos" value={stats.inactivos} icon={XCircleIcon} color="red" />
      </div>

      {/* ✨ Search Bar Component */}
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar por CI, nombre, apellido o correo..."
      />

      {/* ✨ Data Table Component */}
      <DataTable
        columns={columns}
        data={filteredPropietarios}
        emptyMessage="No se encontraron propietarios"
        emptyIcon={UserGroupIcon}
      />
    </div>
  );
};

export default PropietariosList;
