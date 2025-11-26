import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import contratoService from '../../services/contratoService';
import pagoService from '../../services/pagoService';
import propiedadService from '../../services/propiedadService';
import clienteService from '../../services/clienteService';
import usuarioService from '../../services/usuarioService';

function ContratoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMounted = useRef(true);
  const abortControllerRef = useRef(null);

  const [contrato, setContrato] = useState(null);
  const [propiedad, setPropiedad] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [activeTab, setActiveTab] = useState('info'); // 'info', 'pagos'
  const [loading, setLoading] = useState(true);

  // Stats de pagos
  const [pagoStats, setPagoStats] = useState({
    totalPagado: 0,
    totalPendiente: 0,
    porcentajePagado: 0,
    numeroPagos: 0
  });

  useEffect(() => {
    isMounted.current = true;
    loadData();

    return () => {
      isMounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [id]);

  const loadData = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(true);

      // Cargar contrato
      const contratoData = await contratoService.getById(id);

      if (!isMounted.current) return;

      setContrato(contratoData);

      // Cargar datos relacionados en paralelo
      const [propiedadData, clienteData, usuarioData, pagosData] = await Promise.all([
        propiedadService.getAllSimple().then(props => 
          props.find(p => p.id_propiedad === contratoData.id_propiedad)
        ),
        clienteService.getAllSimple().then(clientes => 
          clientes.find(c => c.ci_cliente === contratoData.ci_cliente)
        ),
        usuarioService.getAll().then(usuarios => 
          usuarios.find(u => u.id_usuario === contratoData.id_usuario_colocador)
        ),
        pagoService.getAll({ id_contrato: id })
      ]);

      if (!isMounted.current) return;

      setPropiedad(propiedadData);
      setCliente(clienteData);
      setUsuario(usuarioData);
      setPagos(pagosData);

      // Calcular estadísticas de pagos
      const precioTotal = parseFloat(contratoData.precio_cierre_contrato || 0);
      const montoPagado = pagosData
        .filter(p => p.estado_pago === 'Pagado')
        .reduce((sum, p) => sum + parseFloat(p.monto_pago || 0), 0);
      
      const montoPendiente = precioTotal - montoPagado;
      const porcentaje = precioTotal > 0 ? (montoPagado / precioTotal) * 100 : 0;

      setPagoStats({
        totalPagado: montoPagado,
        totalPendiente: montoPendiente,
        porcentajePagado: porcentaje,
        numeroPagos: pagosData.length
      });

    } catch (error) {
      if (error.name === 'CanceledError' || error.name === 'AbortError') {
        return;
      }
      console.error('Error al cargar datos:', error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleDeletePago = async (pagoId) => {
    if (!window.confirm('¿Está seguro de eliminar este pago?')) return;

    try {
      await pagoService.delete(pagoId);
      // Recargar datos
      loadData();
    } catch (error) {
      console.error('Error al eliminar pago:', error);
      alert('Error al eliminar el pago');
    }
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
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getEstadoColor = (estado) => {
    const colores = {
      'Borrador': 'bg-gray-100 text-gray-700 border border-gray-300',
      'Activo': 'bg-green-100 text-green-700 border border-green-300',
      'Finalizado': 'bg-blue-100 text-blue-700 border border-blue-300',
      'Cancelado': 'bg-red-100 text-red-700 border border-red-300'
    };
    return colores[estado] || 'bg-gray-100 text-gray-700';
  };

  const getPagoEstadoColor = (estado) => {
    const colores = {
      'Pendiente': 'bg-yellow-100 text-yellow-700 border border-yellow-300',
      'Pagado': 'bg-green-100 text-green-700 border border-green-300',
      'Atrasado': 'bg-red-100 text-red-700 border border-red-300',
      'Cancelado': 'bg-gray-100 text-gray-700 border border-gray-300'
    };
    return colores[estado] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!contrato) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar el contrato</h3>
        <p className="text-gray-600 mb-4">No se pudo cargar la información del contrato.</p>
        <button
          onClick={() => navigate('/contratos')}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Volver a Contratos
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/contratos')}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Detalle del Contrato</h1>
            <p className="text-gray-600 mt-1">
              {contrato.tipo_operacion_contrato} - {propiedad?.titulo_propiedad || 'Propiedad'}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            to={`/contratos/editar/${id}`}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar
          </Link>
        </div>
      </div>

      {/* Estado y Progress */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(contrato.estado_contrato)} bg-white`}>
              {contrato.estado_contrato}
            </span>
            <h3 className="text-2xl font-bold mt-3">{formatCurrency(contrato.precio_cierre_contrato)}</h3>
            <p className="text-blue-100 text-sm mt-1">Precio total del contrato</p>
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-sm">Progreso de pago</p>
            <p className="text-3xl font-bold">{pagoStats.porcentajePagado.toFixed(1)}%</p>
          </div>
        </div>
        
        {/* Barra de progreso */}
        <div className="bg-white bg-opacity-20 rounded-full h-4 overflow-hidden">
          <div 
            className="bg-white h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(pagoStats.porcentajePagado, 100)}%` }}
          ></div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4 text-center">
          <div>
            <p className="text-blue-100 text-xs">Pagado</p>
            <p className="font-semibold">{formatCurrency(pagoStats.totalPagado)}</p>
          </div>
          <div>
            <p className="text-blue-100 text-xs">Pendiente</p>
            <p className="font-semibold">{formatCurrency(pagoStats.totalPendiente)}</p>
          </div>
          <div>
            <p className="text-blue-100 text-xs">N° Pagos</p>
            <p className="font-semibold">{pagoStats.numeroPagos}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('info')}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'info'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Información
              </span>
            </button>
            <button
              onClick={() => setActiveTab('pagos')}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'pagos'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Pagos ({pagos.length})
              </span>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Tab: Información */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Información del Contrato */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos del Contrato</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm text-gray-600">Tipo de Operación</label>
                    <p className="text-gray-900 font-medium">{contrato.tipo_operacion_contrato}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Modalidad de Pago</label>
                    <p className="text-gray-900 font-medium">{contrato.modalidad_pago_contrato}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Fecha de Inicio</label>
                    <p className="text-gray-900 font-medium">{formatDate(contrato.fecha_inicio_contrato)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Fecha de Fin</label>
                    <p className="text-gray-900 font-medium">{formatDate(contrato.fecha_fin_contrato) || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Fecha de Cierre</label>
                    <p className="text-gray-900 font-medium">{formatDate(contrato.fecha_cierre_contrato) || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Estado</label>
                    <p>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(contrato.estado_contrato)}`}>
                        {contrato.estado_contrato}
                      </span>
                    </p>
                  </div>
                </div>
                {contrato.observaciones_contrato && (
                  <div className="mt-4">
                    <label className="text-sm text-gray-600">Observaciones</label>
                    <p className="text-gray-900 mt-1">{contrato.observaciones_contrato}</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-6"></div>

              {/* Propiedad */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Propiedad</h3>
                {propiedad ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-600">Título</label>
                        <p className="text-gray-900 font-medium">{propiedad.titulo_propiedad}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Tipo</label>
                        <p className="text-gray-900">{propiedad.tipo_propiedad}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Precio</label>
                        <p className="text-gray-900 font-semibold">{formatCurrency(propiedad.precio_propiedad)}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Estado</label>
                        <p className="text-gray-900">{propiedad.estado_propiedad}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No se encontró información de la propiedad</p>
                )}
              </div>

              <div className="border-t pt-6"></div>

              {/* Cliente */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cliente</h3>
                {cliente ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-600">Nombre Completo</label>
                        <p className="text-gray-900 font-medium">
                          {cliente.nombres_completo_cliente} {cliente.apellidos_completo_cliente}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">CI</label>
                        <p className="text-gray-900">{cliente.ci_cliente}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Teléfono</label>
                        <p className="text-gray-900">{cliente.telefono_cliente || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Email</label>
                        <p className="text-gray-900">{cliente.email_cliente || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No se encontró información del cliente</p>
                )}
              </div>

              <div className="border-t pt-6"></div>

              {/* Usuario Colocador */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Asesor/Colocador</h3>
                {usuario ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-600">Nombre de Usuario</label>
                        <p className="text-gray-900 font-medium">{usuario.nombre_usuario}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Estado</label>
                        <p className="text-gray-900">
                          {usuario.es_activo_usuario ? (
                            <span className="text-green-600">● Activo</span>
                          ) : (
                            <span className="text-red-600">● Inactivo</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No se encontró información del usuario</p>
                )}
              </div>
            </div>
          )}

          {/* Tab: Pagos */}
          {activeTab === 'pagos' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Historial de Pagos</h3>
                <Link
                  to={`/pagos/nuevo?contrato=${id}`}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Registrar Pago
                </Link>
              </div>

              {pagos.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-gray-600 mb-4">No hay pagos registrados para este contrato</p>
                  <Link
                    to={`/pagos/nuevo?contrato=${id}`}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Registrar el primer pago →
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cuota</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pagos.map((pago) => (
                        <tr key={pago.id_pago} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {pago.numero_cuota_pago ? `Cuota ${pago.numero_cuota_pago}` : 'Pago único'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">
                              {formatCurrency(pago.monto_pago)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDate(pago.fecha_pago)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPagoEstadoColor(pago.estado_pago)}`}>
                              {pago.estado_pago}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            <Link
                              to={`/pagos/editar/${pago.id_pago}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Link>
                            <button
                              onClick={() => handleDeletePago(pago.id_pago)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ContratoDetail;
