import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { desempenoService } from '../../services/desempenoService';
import { usuarioService } from '../../services/usuarioService';
import { empleadoService } from '../../services/empleadoService';
import { 
  ChartBarIcon, 
  PlusIcon, 
  TrophyIcon, 
  UsersIcon, 
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import PageHeader from '../../components/shared/PageHeader';
import StatsCard from '../../components/shared/StatsCard';

export default function DesempenoList() {
  const [desempenos, setDesempenos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Form data para generar desempeño
  const [formData, setFormData] = useState({
    id_usuario_asesor: '',
    tipo_periodo: 'mensual',
    anio: new Date().getFullYear(),
    mes: new Date().getMonth() + 1
  });

  // Estadísticas
  const [stats, setStats] = useState({
    total: 0,
    totalCaptaciones: 0,
    totalColocaciones: 0,
    totalVisitas: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    console.log('Estado showModal:', showModal);
  }, [showModal]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [desData, usrData, empData] = await Promise.all([
        desempenoService.getAll(),
        usuarioService.getAll(),
        empleadoService.getAll()
      ]);

      setDesempenos(desData);
      setUsuarios(Array.isArray(usrData) ? usrData : usrData.data || []);
      setEmpleados(Array.isArray(empData) ? empData : empData.data || []);

      // Calcular estadísticas
      calcularEstadisticas(desData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar los desempeños');
    } finally {
      setLoading(false);
    }
  };

  const calcularEstadisticas = (desData) => {
    const total = desData.length;
    const totalCaptaciones = desData.reduce((sum, d) => sum + (d.captaciones_desempeno || 0), 0);
    const totalColocaciones = desData.reduce((sum, d) => sum + (d.colocaciones_desempeno || 0), 0);
    const totalVisitas = desData.reduce((sum, d) => sum + (d.visitas_agendadas_desempeno || 0), 0);

    setStats({
      total,
      totalCaptaciones,
      totalColocaciones,
      totalVisitas
    });
  };

  const getNombreEmpleado = (idUsuario) => {
    const usuario = usuarios.find(u => u.id_usuario === idUsuario);
    if (!usuario) return 'N/A';

    const empleado = empleados.find(e => e.ci_empleado === usuario.ci_empleado);
    if (!empleado) return usuario.nombre_usuario;

    return `${empleado.nombres_completo_empleado} ${empleado.apellidos_completo_empleado}`;
  };

  const handleGenerar = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!formData.id_usuario_asesor) {
      toast.error('Selecciona un asesor');
      return;
    }

    if (formData.tipo_periodo === 'mensual' && !formData.mes) {
      toast.error('Selecciona un mes');
      return;
    }

    try {
      setGenerating(true);
      
      const data = {
        id_usuario_asesor: formData.id_usuario_asesor,
        tipo_periodo: formData.tipo_periodo,
        anio: parseInt(formData.anio)
      };

      if (formData.tipo_periodo === 'mensual') {
        data.mes = parseInt(formData.mes);
      }

      await desempenoService.generar(data);
      toast.success('Desempeño generado exitosamente');
      setShowModal(false);
      loadData();
      
      // Resetear form
      setFormData({
        id_usuario_asesor: '',
        tipo_periodo: 'mensual',
        anio: new Date().getFullYear(),
        mes: new Date().getMonth() + 1
      });
    } catch (error) {
      console.error('Error:', error);
      const errorMsg = error.response?.data?.detail || 'Error al generar el desempeño';
      toast.error(errorMsg);
    } finally {
      setGenerating(false);
    }
  };

  // Obtener años disponibles
  const getAniosDisponibles = () => {
    const anioActual = new Date().getFullYear();
    const anios = [];
    for (let i = anioActual; i >= anioActual - 5; i--) {
      anios.push(i);
    }
    return anios;
  };

  // Obtener meses disponibles (solo pasados si es el año actual)
  const getMesesDisponibles = () => {
    const mesActual = new Date().getMonth() + 1;
    const anioActual = new Date().getFullYear();
    const maxMes = parseInt(formData.anio) === anioActual ? mesActual - 1 : 12;
    
    const meses = [
      { value: 1, label: 'Enero' },
      { value: 2, label: 'Febrero' },
      { value: 3, label: 'Marzo' },
      { value: 4, label: 'Abril' },
      { value: 5, label: 'Mayo' },
      { value: 6, label: 'Junio' },
      { value: 7, label: 'Julio' },
      { value: 8, label: 'Agosto' },
      { value: 9, label: 'Septiembre' },
      { value: 10, label: 'Octubre' },
      { value: 11, label: 'Noviembre' },
      { value: 12, label: 'Diciembre' }
    ];
    
    return meses.filter(m => m.value <= maxMes);
  };

  // Filtrar desempeños
  const desempenosFiltrados = desempenos.filter(desempeno => {
    if (searchTerm) {
      const nombreEmpleado = getNombreEmpleado(desempeno.id_usuario_asesor).toLowerCase();
      const periodo = desempeno.periodo_desempeno.toLowerCase();
      const searchLower = searchTerm.toLowerCase();

      return nombreEmpleado.includes(searchLower) || periodo.includes(searchLower);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando desempeños...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <PageHeader
          title="Desempeño de Asesores"
          description="Análisis de captaciones, colocaciones y visitas por periodo"
          buttonText="Generar Análisis"
          onButtonClick={() => {
            console.log('Botón clickeado, abriendo modal');
            setShowModal(true);
          }}
          icon={PlusIcon}
        />

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="Total Registros"
            value={stats.total}
            icon={ChartBarIcon}
            color="blue"
          />
          <StatsCard
            title="Total Captaciones"
            value={stats.totalCaptaciones}
            icon={TrophyIcon}
            color="green"
          />
          <StatsCard
            title="Total Colocaciones"
            value={stats.totalColocaciones}
            icon={TrophyIcon}
            color="purple"
          />
          <StatsCard
            title="Total Visitas"
            value={stats.totalVisitas}
            icon={UsersIcon}
            color="yellow"
          />
        </div>

        {/* Búsqueda */}
        <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl border border-gray-800/50 p-4 mb-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Buscar
              </label>
              <input
                type="text"
                placeholder="Nombre de asesor o periodo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
              />
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl border border-gray-800/50 overflow-hidden">
          {desempenosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <ChartBarIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">
                {searchTerm
                  ? 'No se encontraron registros con los filtros aplicados'
                  : 'No hay registros de desempeño. Genera uno para comenzar.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-900/50 border-b border-gray-800">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-green-400 uppercase tracking-wider">
                      Asesor
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-green-400 uppercase tracking-wider">
                      Periodo
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-green-400 uppercase tracking-wider">
                      Captaciones
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-green-400 uppercase tracking-wider">
                      Colocaciones
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-green-400 uppercase tracking-wider">
                      Visitas
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-green-400 uppercase tracking-wider">
                      Total Actividad
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {desempenosFiltrados.map((desempeno) => {
                    const totalActividad = 
                      (desempeno.captaciones_desempeno || 0) +
                      (desempeno.colocaciones_desempeno || 0) +
                      (desempeno.visitas_agendadas_desempeno || 0);
                    
                    return (
                      <tr
                        key={desempeno.id_desempeno}
                        className="hover:bg-gray-800/30 transition-colors"
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <UsersIcon className="h-5 w-5 text-gray-500" />
                            <span className="text-sm font-medium text-gray-200">
                              {getNombreEmpleado(desempeno.id_usuario_asesor)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-blue-900/50 text-blue-300">
                            {desempeno.periodo_desempeno}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="text-lg font-bold text-green-400">
                            {desempeno.captaciones_desempeno || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="text-lg font-bold text-purple-400">
                            {desempeno.colocaciones_desempeno || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="text-lg font-bold text-yellow-400">
                            {desempeno.visitas_agendadas_desempeno || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="text-lg font-bold text-blue-400">
                            {totalActividad}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Resumen */}
        {desempenosFiltrados.length > 0 && (
          <div className="mt-4 bg-gray-900/50 backdrop-blur-xl rounded-xl border border-gray-800/50 p-4">
            <p className="text-sm text-gray-400">
              Mostrando {desempenosFiltrados.length} de {desempenos.length} registros
            </p>
          </div>
        )}
      </div>

      {/* Modal para generar desempeño */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-gray-900 rounded-xl border border-gray-800 max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ChartBarIcon className="h-6 w-6 text-green-400" />
                Generar Análisis de Desempeño
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleGenerar} className="space-y-4">
              {/* Asesor */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Asesor <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.id_usuario_asesor}
                  onChange={(e) => setFormData({ ...formData, id_usuario_asesor: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Seleccionar asesor</option>
                  {usuarios.map(usuario => (
                    <option key={usuario.id_usuario} value={usuario.id_usuario}>
                      {getNombreEmpleado(usuario.id_usuario)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo de Periodo */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tipo de Periodo <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.tipo_periodo}
                  onChange={(e) => setFormData({ ...formData, tipo_periodo: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:ring-2 focus:ring-green-500"
                >
                  <option value="mensual">Mensual</option>
                  <option value="anual">Anual</option>
                </select>
              </div>

              {/* Año */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Año <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.anio}
                  onChange={(e) => setFormData({ ...formData, anio: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:ring-2 focus:ring-green-500"
                >
                  {getAniosDisponibles().map(anio => (
                    <option key={anio} value={anio}>{anio}</option>
                  ))}
                </select>
              </div>

              {/* Mes (solo si es mensual) */}
              {formData.tipo_periodo === 'mensual' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Mes <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.mes}
                    onChange={(e) => setFormData({ ...formData, mes: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Seleccionar mes</option>
                    {getMesesDisponibles().map(mes => (
                      <option key={mes.value} value={mes.value}>{mes.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Solo se pueden analizar meses pasados
                  </p>
                </div>
              )}

              {formData.tipo_periodo === 'anual' && (
                <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
                  <p className="text-xs text-blue-300">
                    💡 Para el año actual, si ya existe un registro se actualizará
                  </p>
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  {generating ? 'Generando...' : 'Generar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
