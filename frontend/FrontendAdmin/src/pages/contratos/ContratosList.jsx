import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import contratoService from '../../services/contratoService';
import propiedadService from '../../services/propiedadService';
import clienteService from '../../services/clienteService';
import usuarioService from '../../services/usuarioService';
import PageHeader from '../../components/shared/PageHeader';
import StatsCard from '../../components/shared/StatsCard';
import { 
  DocumentTextIcon, 
  CheckCircleIcon, 
  CheckIcon, 
  DocumentIcon 
} from '@heroicons/react/24/outline';

function ContratosList() {
  const navigate = useNavigate();
  const [contratos, setContratos] = useState([]);
  const [propiedades, setPropiedades] = useState({});
  const [clientes, setClientes] = useState({});
  const [usuarios, setUsuarios] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    finalizados: 0,
    borradores: 0
  });

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Cargar datos en paralelo con Promise.all
        const filters = {};
        if (estadoFilter) filters.estado = estadoFilter;
        if (tipoFilter) filters.tipo_operacion = tipoFilter;

        const [contratosData, propiedadesData, clientesData, usuariosData] = await Promise.all([
          contratoService.getAll(filters, controller.signal),
          propiedadService.getAllSimple(controller.signal),
          clienteService.getAllSimple(controller.signal),
          usuarioService.getAll(controller.signal)
        ]);

        if (!isMounted) return;

        // Convertir arrays a objetos para lookup rápido
        const propiedadesMap = {};
        propiedadesData.forEach(prop => {
          propiedadesMap[prop.id_propiedad] = prop;
        });

        const clientesMap = {};
        clientesData.forEach(cliente => {
          clientesMap[cliente.ci_cliente] = cliente;
        });

        const usuariosMap = {};
        usuariosData.forEach(usuario => {
          usuariosMap[usuario.id_usuario] = usuario;
        });

        setPropiedades(propiedadesMap);
        setClientes(clientesMap);
        setUsuarios(usuariosMap);
        setContratos(contratosData);

        // Calcular estadísticas
        const total = contratosData.length;
        const activos = contratosData.filter(c => c.estado_contrato === 'Activo').length;
        const finalizados = contratosData.filter(c => c.estado_contrato === 'Finalizado').length;
        const borradores = contratosData.filter(c => c.estado_contrato === 'Borrador').length;

        setStats({ total, activos, finalizados, borradores });
        
      } catch (err) {
        if (err.code === 'ERR_CANCELED') {
          return; // Request was aborted, no action needed
        }
        if (isMounted) {
          console.error('Error al cargar contratos:', err);
          setError('Error al cargar los contratos. Por favor, intente nuevamente.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [estadoFilter, tipoFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este contrato?')) {
      return;
    }

    try {
      await contratoService.delete(id);
      // Recargar página para actualizar la lista
      window.location.reload();
    } catch (err) {
      console.error('Error al eliminar contrato:', err);
      alert('Error al eliminar el contrato. Verifique que no tenga pagos asociados.');
    }
  };

  // Filtrar contratos por búsqueda
  const filteredContratos = contratos.filter(contrato => {
    const propiedad = propiedades[contrato.id_propiedad];
    const cliente = clientes[contrato.ci_cliente];
    const usuario = usuarios[contrato.id_usuario_colocador];

    const searchLower = searchTerm.toLowerCase();
    const propiedadTitle = propiedad ? `${propiedad.titulo_propiedad || ''}`.toLowerCase() : '';
    const clienteNombre = cliente ? `${cliente.nombres_completo_cliente || ''} ${cliente.apellidos_completo_cliente || ''}`.toLowerCase() : '';
    const usuarioNombre = usuario ? `${usuario.nombre_usuario || ''}`.toLowerCase() : '';
    const tipo = contrato.tipo_operacion_contrato?.toLowerCase() || '';
    const estado = contrato.estado_contrato?.toLowerCase() || '';

    return propiedadTitle.includes(searchLower) ||
           clienteNombre.includes(searchLower) ||
           usuarioNombre.includes(searchLower) ||
           tipo.includes(searchLower) ||
           estado.includes(searchLower);
  });

  const getEstadoColor = (estado) => {
    const colores = {
      'Borrador': 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
      'Activo': 'bg-green-500/20 text-green-300 border border-green-500/30',
      'Finalizado': 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
      'Cancelado': 'bg-red-500/20 text-red-300 border border-red-500/30'
    };
    return colores[estado] || 'bg-gray-500/20 text-gray-300';
  };

  const getTipoColor = (tipo) => {
    const colores = {
      'Venta': 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
      'Alquiler': 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
      'Anticrético': 'bg-teal-500/20 text-teal-300 border border-teal-500/30',
      'Traspaso': 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
    };
    return colores[tipo] || 'bg-gray-500/20 text-gray-300';
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'Bs. 0.00';
    return `Bs. ${parseFloat(amount).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-BO', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Contratos"
        description="Gestión de contratos de operación"
        buttonText="Nuevo Contrato"
        onButtonClick={() => navigate('/contratos/nuevo')}
      />

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          label="Total Contratos"
          value={stats.total}
          icon={DocumentTextIcon}
          color="blue"
        />
        <StatsCard
          label="Activos"
          value={stats.activos}
          icon={CheckCircleIcon}
          color="green"
        />
        <StatsCard
          label="Finalizados"
          value={stats.finalizados}
          icon={CheckIcon}
          color="purple"
        />
        <StatsCard
          label="Borradores"
          value={stats.borradores}
          icon={DocumentIcon}
          color="red"
        />
      </div>

      {/* Filters and Search */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-700/50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Buscar
            </label>
            <input
              type="text"
              placeholder="Buscar por propiedad, cliente, usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-100 placeholder-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Estado
            </label>
            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-100"
            >
              <option value="">Todos los estados</option>
              <option value="Borrador">Borrador</option>
              <option value="Activo">Activo</option>
              <option value="Finalizado">Finalizado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tipo de Operación
            </label>
            <select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-100"
            >
              <option value="">Todos los tipos</option>
              <option value="Venta">Venta</option>
              <option value="Alquiler">Alquiler</option>
              <option value="Anticrético">Anticrético</option>
              <option value="Traspaso">Traspaso</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contratos Table */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider min-w-[180px]">
                  Propiedad
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider min-w-[150px]">
                  Cliente
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider min-w-[100px]">
                  Colocador
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider min-w-[90px]">
                  Tipo
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider min-w-[90px]">
                  Estado
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider min-w-[100px]">
                  Precio
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider min-w-[100px]">
                  Fecha Inicio
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider min-w-[80px]">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredContratos.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-lg font-medium text-gray-300">No se encontraron contratos</p>
                      <p className="text-sm mt-1 text-gray-400">Intente ajustar los filtros de búsqueda</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredContratos.map((contrato) => {
                  const propiedad = propiedades[contrato.id_propiedad];
                  const cliente = clientes[contrato.ci_cliente];
                  const usuario = usuarios[contrato.id_usuario_colocador];

                  return (
                    <tr key={contrato.id_contrato_operacion} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-3 py-3 max-w-[180px]">
                        <div className="text-xs font-medium text-gray-200 truncate">
                          {propiedad?.titulo_propiedad || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {propiedad?.tipo_operacion_propiedad || ''}
                        </div>
                      </td>
                      <td className="px-3 py-3 max-w-[150px]">
                        <div className="text-xs text-gray-200 truncate">
                          {cliente ? `${cliente.nombres_completo_cliente} ${cliente.apellidos_completo_cliente}` : 'N/A'}
                        </div>
                      </td>
                      <td className="px-3 py-3 max-w-[100px]">
                        <div className="text-xs text-gray-200 truncate">
                          {usuario ? `${usuario.nombre_usuario}` : 'N/A'}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${getTipoColor(contrato.tipo_operacion_contrato)}`}>
                          {contrato.tipo_operacion_contrato}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${getEstadoColor(contrato.estado_contrato)}`}>
                          {contrato.estado_contrato}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-200 font-medium">
                        {formatCurrency(contrato.precio_cierre_contrato)}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-300">
                        {formatDate(contrato.fecha_inicio_contrato)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Link
                            to={`/contratos/${contrato.id_contrato_operacion}`}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg p-1 transition-colors"
                            title="Ver Detalle"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Link>
                          <Link
                            to={`/contratos/editar/${contrato.id_contrato_operacion}`}
                            className="text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg p-1 transition-colors"
                            title="Editar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          <button
                            onClick={() => handleDelete(contrato.id_contrato_operacion)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg p-1 transition-colors"
                            title="Eliminar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
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
}

export default ContratosList;
