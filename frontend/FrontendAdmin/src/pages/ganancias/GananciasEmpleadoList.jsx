import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { gananciaEmpleadoService } from '../../services/gananciaEmpleadoService';
import { usuarioService } from '../../services/usuarioService';
import { empleadoService } from '../../services/empleadoService';
import { propiedadService } from '../../services/propiedadService';
import { BanknotesIcon, CheckCircleIcon, ClockIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import PageHeader from '../../components/shared/PageHeader';
import StatsCard from '../../components/shared/StatsCard';

export default function GananciasEmpleadoList() {
  const [ganancias, setGanancias] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [propiedades, setPropiedades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todas'); // todas, pendientes, concretadas
  const [filtroTipo, setFiltroTipo] = useState('todas'); // todas, Captación, Colocación, Ambas

  // Estadísticas
  const [stats, setStats] = useState({
    total: 0,
    pendientes: 0,
    concretadas: 0,
    montoPendiente: 0,
    montoConcretado: 0,
    montoTotal: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ganData, usrData, empData, propData] = await Promise.all([
        gananciaEmpleadoService.getAll(),
        usuarioService.getAll(),
        empleadoService.getAll(),
        propiedadService.getAll()
      ]);

      setGanancias(ganData);
      setUsuarios(Array.isArray(usrData) ? usrData : usrData.data || []);
      setEmpleados(Array.isArray(empData) ? empData : empData.data || []);
      setPropiedades(Array.isArray(propData) ? propData : propData.data || []);

      // Calcular estadísticas
      calcularEstadisticas(ganData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar las ganancias');
    } finally {
      setLoading(false);
    }
  };

  const calcularEstadisticas = (ganData) => {
    const total = ganData.length;
    const concretadas = ganData.filter(g => g.esta_concretado_ganancia).length;
    const pendientes = total - concretadas;

    const montoConcretado = ganData
      .filter(g => g.esta_concretado_ganancia)
      .reduce((sum, g) => sum + parseFloat(g.dinero_ganado_ganancia || 0), 0);

    const montoPendiente = ganData
      .filter(g => !g.esta_concretado_ganancia)
      .reduce((sum, g) => sum + parseFloat(g.dinero_ganado_ganancia || 0), 0);

    setStats({
      total,
      pendientes,
      concretadas,
      montoPendiente,
      montoConcretado,
      montoTotal: montoConcretado + montoPendiente
    });
  };

  const getNombreEmpleado = (idUsuario) => {
    const usuario = usuarios.find(u => u.id_usuario === idUsuario);
    if (!usuario) return 'N/A';

    const empleado = empleados.find(e => e.ci_empleado === usuario.ci_empleado);
    if (!empleado) return usuario.nombre_usuario;

    return `${empleado.nombres_completo_empleado} ${empleado.apellidos_completo_empleado}`;
  };

  const getTituloPropiedad = (idPropiedad) => {
    const propiedad = propiedades.find(p => p.id_propiedad === idPropiedad);
    return propiedad?.titulo_propiedad || 'N/A';
  };

  const getCodigoPropiedad = (idPropiedad) => {
    const propiedad = propiedades.find(p => p.id_propiedad === idPropiedad);
    return propiedad?.codigo_publico_propiedad || 'N/A';
  };

  const handleMarcarConcretado = async (ganancia) => {
    const nombreEmpleado = getNombreEmpleado(ganancia.id_usuario_empleado);
    const tituloPropiedad = getTituloPropiedad(ganancia.id_propiedad);

    if (!window.confirm(
      `¿Confirmar que se pagó la ganancia de ${ganancia.tipo_operacion_ganancia} a ${nombreEmpleado}?\n\n` +
      `Propiedad: ${tituloPropiedad}\n` +
      `Monto: Bs. ${parseFloat(ganancia.dinero_ganado_ganancia).toFixed(2)}`
    )) {
      return;
    }

    try {
      await gananciaEmpleadoService.marcarComoConcretado(ganancia.id_ganancia);
      toast.success('Ganancia marcada como concretada');
      loadData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar la ganancia');
    }
  };

  // Filtrar ganancias
  const gananciasFiltradas = ganancias.filter(ganancia => {
    // Filtro por estado
    if (filtroEstado === 'pendientes' && ganancia.esta_concretado_ganancia) return false;
    if (filtroEstado === 'concretadas' && !ganancia.esta_concretado_ganancia) return false;

    // Filtro por tipo
    if (filtroTipo !== 'todas' && ganancia.tipo_operacion_ganancia !== filtroTipo) return false;

    // Búsqueda por texto
    if (searchTerm) {
      const nombreEmpleado = getNombreEmpleado(ganancia.id_usuario_empleado).toLowerCase();
      const tituloPropiedad = getTituloPropiedad(ganancia.id_propiedad).toLowerCase();
      const codigoPropiedad = getCodigoPropiedad(ganancia.id_propiedad).toLowerCase();
      const searchLower = searchTerm.toLowerCase();

      return (
        nombreEmpleado.includes(searchLower) ||
        tituloPropiedad.includes(searchLower) ||
        codigoPropiedad.includes(searchLower)
      );
    }

    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando ganancias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <PageHeader
          title="Ganancias de Empleados"
          subtitle="Gestión de comisiones por captación y colocación de propiedades"
          showButton={false}
          icon={BanknotesIcon}
        />

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="Total Ganancias"
            value={stats.total}
            icon={BanknotesIcon}
            color="blue"
          />
          <StatsCard
            title="Pendientes"
            value={stats.pendientes}
            subtitle={`Bs. ${stats.montoPendiente.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={ClockIcon}
            color="yellow"
          />
          <StatsCard
            title="Concretadas"
            value={stats.concretadas}
            subtitle={`Bs. ${stats.montoConcretado.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={CheckCircleIcon}
            color="green"
          />
          <StatsCard
            title="Monto Total"
            value={`Bs. ${stats.montoTotal.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={CurrencyDollarIcon}
            color="purple"
          />
        </div>

        {/* Filtros y búsqueda */}
        <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl border border-gray-800/50 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Buscar
              </label>
              <input
                type="text"
                placeholder="Empleado, propiedad o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
              />
            </div>

            {/* Filtro por estado */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Estado
              </label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/50"
              >
                <option value="todas">Todas</option>
                <option value="pendientes">Pendientes</option>
                <option value="concretadas">Concretadas</option>
              </select>
            </div>

            {/* Filtro por tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Tipo de Operación
              </label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/50"
              >
                <option value="todas">Todas</option>
                <option value="Captación">Captación</option>
                <option value="Colocación">Colocación</option>
                <option value="Ambas">Ambas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl border border-gray-800/50 overflow-hidden">
          {gananciasFiltradas.length === 0 ? (
            <div className="text-center py-12">
              <BanknotesIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">
                {searchTerm || filtroEstado !== 'todas' || filtroTipo !== 'todas'
                  ? 'No se encontraron ganancias con los filtros aplicados'
                  : 'No hay ganancias registradas'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-900/50 border-b border-gray-800">
                    <th className="px-3 py-3 text-left text-xs font-semibold text-green-400 uppercase tracking-wider">
                      Empleado
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-green-400 uppercase tracking-wider">
                      Propiedad
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-green-400 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-green-400 uppercase tracking-wider">
                      %
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-green-400 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-green-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-green-400 uppercase tracking-wider">
                      Fecha Cierre
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-green-400 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {gananciasFiltradas.map((ganancia) => (
                    <tr
                      key={ganancia.id_ganancia}
                      className="hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-200">
                          {getNombreEmpleado(ganancia.id_usuario_empleado)}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-sm text-gray-200">
                          {getTituloPropiedad(ganancia.id_propiedad)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {getCodigoPropiedad(ganancia.id_propiedad)}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            ganancia.tipo_operacion_ganancia === 'Captación'
                              ? 'bg-blue-900/50 text-blue-300'
                              : ganancia.tipo_operacion_ganancia === 'Colocación'
                              ? 'bg-purple-900/50 text-purple-300'
                              : 'bg-indigo-900/50 text-indigo-300'
                          }`}
                        >
                          {ganancia.tipo_operacion_ganancia}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        <span className="text-sm text-gray-300">
                          {parseFloat(ganancia.porcentaje_ganado_ganancia).toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        <span className="text-sm font-semibold text-green-400">
                          Bs. {parseFloat(ganancia.dinero_ganado_ganancia).toLocaleString('es-BO', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        {ganancia.esta_concretado_ganancia ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-900/50 text-green-300">
                            <CheckCircleIcon className="h-4 w-4" />
                            Pagado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-yellow-900/50 text-yellow-300">
                            <ClockIcon className="h-4 w-4" />
                            Pendiente
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        <span className="text-sm text-gray-400">
                          {ganancia.fecha_cierre_ganancia
                            ? new Date(ganancia.fecha_cierre_ganancia).toLocaleDateString('es-BO')
                            : 'N/A'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        {!ganancia.esta_concretado_ganancia && (
                          <button
                            onClick={() => handleMarcarConcretado(ganancia)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                            Marcar Pagado
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Resumen al final */}
        {gananciasFiltradas.length > 0 && (
          <div className="mt-4 bg-gray-900/50 backdrop-blur-xl rounded-xl border border-gray-800/50 p-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">
                Mostrando {gananciasFiltradas.length} de {ganancias.length} ganancias
              </span>
              <div className="flex gap-4">
                <span className="text-gray-400">
                  Total pendiente: <span className="text-yellow-400 font-semibold">
                    Bs. {gananciasFiltradas
                      .filter(g => !g.esta_concretado_ganancia)
                      .reduce((sum, g) => sum + parseFloat(g.dinero_ganado_ganancia || 0), 0)
                      .toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </span>
                <span className="text-gray-400">
                  Total concretado: <span className="text-green-400 font-semibold">
                    Bs. {gananciasFiltradas
                      .filter(g => g.esta_concretado_ganancia)
                      .reduce((sum, g) => sum + parseFloat(g.dinero_ganado_ganancia || 0), 0)
                      .toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
