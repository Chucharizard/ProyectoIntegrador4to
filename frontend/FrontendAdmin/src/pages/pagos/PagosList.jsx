import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import pagoService from '../../services/pagoService';
import contratoService from '../../services/contratoService';
import PageHeader from '../../components/shared/PageHeader';
import StatsCard from '../../components/shared/StatsCard';
import { 
  BanknotesIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

function PagosList() {
  const [pagos, setPagos] = useState([]);
  const [contratos, setContratos] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [contratoFilter, setContratoFilter] = useState('');

  // ✅ NUEVO: Paginación
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pagados: 0,
    pendientes: 0,
    atrasados: 0,
    totalMontoPagado: 0,
    totalMontoPendiente: 0
  });

  // Refs para cleanup
  const isMounted = useRef(true);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    isMounted.current = true;
    loadData();

    return () => {
      isMounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [estadoFilter, contratoFilter, pagination.page]); // ✅ Agregar pagination.page

  const loadData = async () => {
    // Cancelar petición anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(true);
      setError(null);

      // ✅ NUEVA FORMA: Con paginación
      const options = {
        page: pagination.page,
        pageSize: pagination.pageSize
      };

      if (estadoFilter) options.estado = estadoFilter;
      if (contratoFilter) options.idContrato = contratoFilter;

      // Cargar pagos y contratos en paralelo
      const [pagosData, contratosData] = await Promise.all([
        pagoService.getAll(controller.signal, options), // ✅ Con paginación
        contratoService.getAll({}, controller.signal)
      ]);

      if (!isMounted.current) return;

      // Crear mapa de contratos
      const contratosMap = {};
      contratosData.forEach(contrato => {
        contratosMap[contrato.id_contrato_operacion] = contrato;
      });

      // ✅ pagosData ahora tiene estructura { items, total, page, ... }
      setPagos(pagosData.items || pagosData); // Retrocompatible
      setContratos(contratosMap);

      // ✅ Actualizar paginación
      if (pagosData.total !== undefined) {
        setPagination({
          page: pagosData.page,
          pageSize: pagosData.page_size,
          total: pagosData.total,
          totalPages: pagosData.total_pages,
          hasNext: pagosData.has_next,
          hasPrev: pagosData.has_prev
        });
      }

      // Calcular estadísticas (usar items si existe)
      const pagosList = pagosData.items || pagosData;
      const totalPagos = pagosData.total || pagosList.length;
      const pagadosCount = pagosList.filter(p => p.estado_pago === 'Pagado').length;
      const pendientesCount = pagosList.filter(p => p.estado_pago === 'Pendiente').length;
      const atrasadosCount = pagosList.filter(p => p.estado_pago === 'Atrasado').length;
      
      const montoPagado = pagosList
        .filter(p => p.estado_pago === 'Pagado')
        .reduce((sum, p) => sum + parseFloat(p.monto_pago || 0), 0);
      
      const montoPendiente = pagosList
        .filter(p => p.estado_pago !== 'Pagado' && p.estado_pago !== 'Cancelado')
        .reduce((sum, p) => sum + parseFloat(p.monto_pago || 0), 0);

      setStats({
        total: totalPagos,
        pagados: pagadosCount,
        pendientes: pendientesCount,
        atrasados: atrasadosCount,
        totalMontoPagado: montoPagado,
        totalMontoPendiente: montoPendiente
      });

    } catch (error) {
      if (error.name === 'CanceledError' || error.name === 'AbortError') {
        return;
      }
      console.error('Error al cargar pagos:', error);
      if (isMounted.current) {
        setError('Error al cargar los pagos. Por favor, intente nuevamente.');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este pago?')) return;

    try {
      await pagoService.delete(id);
      loadData();
    } catch (error) {
      console.error('Error al eliminar pago:', error);
      alert('Error al eliminar el pago');
    }
  };

  // ✅ NUEVO: Cambiar de página
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const filteredPagos = pagos.filter(pago => {
    const contrato = contratos[pago.id_contrato_operacion];
    const searchLower = searchTerm.toLowerCase();
    const contratoInfo = contrato ? `${contrato.tipo_operacion_contrato || ''}`.toLowerCase() : '';
    const monto = pago.monto_pago ? pago.monto_pago.toString() : '';
    const cuota = pago.numero_cuota_pago ? `cuota ${pago.numero_cuota_pago}` : '';

    return contratoInfo.includes(searchLower) ||
           monto.includes(searchLower) ||
           cuota.includes(searchLower);
  });

  const getEstadoColor = (estado) => {
    const colores = {
      'Pendiente': 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
      'Pagado': 'bg-green-500/20 text-green-300 border border-green-500/30',
      'Atrasado': 'bg-red-500/20 text-red-300 border border-red-500/30',
      'Cancelado': 'bg-gray-500/20 text-gray-300 border border-gray-600'
    };
    return colores[estado] || 'bg-gray-500/20 text-gray-300';
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Pagos"
        description={`Gestión de pagos de contratos • ${pagination.total} total`}
        buttonText="Registrar Pago"
        onButtonClick={() => navigate('/pagos/nuevo')}
      />

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-gray-100">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          label="Total Pagos"
          value={stats.total}
          icon={BanknotesIcon}
          color="blue"
        />
        <StatsCard
          label="Pagados"
          value={`${stats.pagados} • ${formatCurrency(stats.totalMontoPagado)}`}
          icon={CheckCircleIcon}
          color="green"
        />
        <StatsCard
          label="Pendientes"
          value={`${stats.pendientes} • ${formatCurrency(stats.totalMontoPendiente)}`}
          icon={ClockIcon}
          color="purple"
        />
        <StatsCard
          label="Atrasados"
          value={stats.atrasados}
          icon={ExclamationTriangleIcon}
          color="red"
        />
      </div>

      {/* Filtros */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-700/50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Buscar</label>
            <input
              type="text"
              placeholder="Buscar por monto, cuota..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Estado</label>
            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Pagado">Pagado</option>
              <option value="Atrasado">Atrasado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Contrato</label>
            <select
              value={contratoFilter}
              onChange={(e) => setContratoFilter(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los contratos</option>
              {Object.values(contratos).map(contrato => (
                <option key={contrato.id_contrato_operacion} value={contrato.id_contrato_operacion}>
                  {contrato.tipo_operacion_contrato} - {formatCurrency(contrato.precio_cierre_contrato)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Pagos */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-gray-700/50">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Contrato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Cuota
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Fecha Pago
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredPagos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                    <svg className="mx-auto h-12 w-12 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-lg font-medium text-gray-300">No hay pagos registrados</p>
                    <p className="text-sm mt-1 text-gray-400">Comienza registrando el primer pago</p>
                  </td>
                </tr>
              ) : (
                filteredPagos.map((pago) => {
                  const contrato = contratos[pago.id_contrato_operacion];
                  
                  return (
                    <tr key={pago.id_pago} className="hover:bg-gray-900/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                          {contrato?.tipo_operacion_contrato || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-300">
                          Total: {formatCurrency(contrato?.precio_cierre_contrato)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                          {pago.numero_cuota_pago ? `Cuota ${pago.numero_cuota_pago}` : 'Pago único'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                          {formatCurrency(pago.monto_pago)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                          {formatDate(pago.fecha_pago)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(pago.estado_pago)}`}>
                          {pago.estado_pago}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => navigate(`/pagos/editar/${pago.id_pago}`)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Editar"
                        >
                          <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(pago.id_pago)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Eliminar"
                        >
                          <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ✅ NUEVO: Paginación */}
        {pagination.totalPages > 1 && (
          <div className="bg-gray-800/50 px-6 py-4 border-t border-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-300">
                Mostrando página <span className="font-semibold text-green-400">{pagination.page}</span> de{' '}
                <span className="font-semibold text-green-400">{pagination.totalPages}</span> ({pagination.total} total)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-sm font-medium text-gray-200 hover:bg-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-sm font-medium text-gray-200 hover:bg-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PagosList;
