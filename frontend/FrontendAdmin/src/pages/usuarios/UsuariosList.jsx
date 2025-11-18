import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usuarioService } from '../../services/usuarioService';
import { rolService } from '../../services/rolService';
import { 
  PencilIcon, 
  TrashIcon,
  UserIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// ✨ Importar componentes reutilizables
import PageHeader from '../../components/shared/PageHeader';
import StatsCard from '../../components/shared/StatsCard';
import SearchBar from '../../components/shared/SearchBar';
import DataTable from '../../components/shared/DataTable';

const UsuariosList = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [usuariosData, rolesData] = await Promise.all([
          usuarioService.getAll(controller.signal),
          rolService.getAll(controller.signal)
        ]);
        
        if (isMounted) {
          setUsuarios(usuariosData);
          setRoles(rolesData);
        }
      } catch (error) {
        if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError') {
          console.log('Peticiones canceladas');
          return;
        }
        
        if (isMounted) {
          console.error('Error loading data:', error);
          toast.error('Error al cargar datos');
          setUsuarios([]);
          setRoles([]);
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

  const handleDelete = async (id_usuario) => {
    if (window.confirm('¿Estás seguro de eliminar este usuario? Esta acción eliminará sus credenciales de acceso.')) {
      try {
        await usuarioService.delete(id_usuario);
        toast.success('Usuario eliminado exitosamente');
        
        const usuariosData = await usuarioService.getAll();
        setUsuarios(usuariosData);
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

  // 📋 Definir columnas
  const columns = [
    {
      header: 'CI Empleado',
      render: (row) => (
        <span className="font-medium text-gray-200">{row.ci_empleado}</span>
      )
    },
    {
      header: 'Nombre de Usuario',
      render: (row) => (
        <div className="flex items-center gap-2">
          <ShieldCheckIcon className="h-5 w-5 text-blue-400" />
          <span>{row.nombre_usuario}</span>
        </div>
      )
    },
    {
      header: 'Rol',
      render: (row) => (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
          {getRoleName(row.id_rol)}
        </span>
      )
    },
    {
      header: 'Estado',
      render: (row) => (
        row.es_activo_usuario ? (
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
            onClick={() => navigate(`/usuarios/editar/${row.id_usuario}`)}
            className="text-blue-400 hover:text-blue-300 transition-colors p-1 hover:bg-blue-500/10 rounded"
            title="Editar"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleDelete(row.id_usuario)}
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
        title="Usuarios"
        description="Gestiona las credenciales de acceso al sistema"
        buttonText="Nuevo Usuario"
        onButtonClick={() => navigate('/usuarios/nuevo')}
      />

      {/* ✨ Stats Cards Component */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard label="Total" value={stats.total} icon={UserIcon} color="blue" />
        <StatsCard label="Filtrados" value={stats.filtered} icon={MagnifyingGlassIcon} color="purple" />
        <StatsCard label="Activos" value={stats.activos} icon={CheckCircleIcon} color="green" />
        <StatsCard label="Inactivos" value={stats.inactivos} icon={XCircleIcon} color="red" />
      </div>

      {/* ✨ Search Bar Component */}
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar por CI empleado o nombre de usuario..."
      />

      {/* ✨ Data Table Component */}
      <DataTable
        columns={columns}
        data={filteredUsuarios}
        emptyMessage="No se encontraron usuarios"
        emptyIcon={ShieldCheckIcon}
      />
    </div>
  );
};

export default UsuariosList;
