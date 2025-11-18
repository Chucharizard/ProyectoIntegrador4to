import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { 
  BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import {
  HomeIcon,
  UserGroupIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import propiedadService from '../services/propiedadService';
import clienteService from '../services/clienteService';
import citaService from '../services/citaService';
import contratoService from '../services/contratoService';
import pagoService from '../services/pagoService';

const Dashboard = () => {
  const { user } = useAuth();
  const isBroker = user?.id_rol === 1;
  const isMounted = useRef(true);
  const abortControllerRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPropiedades: 0,
    propiedadesDisponibles: 0,
    totalClientes: 0,
    citasHoy: 0,
    citasEstaSemana: 0,
    contratosActivos: 0,
    montoContratosActivos: 0,
    pagosMes: 0,
    montoPagosMes: 0
  });

  const [propiedadesPorTipo, setPropiedadesPorTipo] = useState([]);
  const [contratosPorEstado, setContratosPorEstado] = useState([]);
  const [proximasCitas, setProximasCitas] = useState([]);
  const [ventasPorMes, setVentasPorMes] = useState([]);

  useEffect(() => {
    isMounted.current = true;
    loadDashboardData();

    return () => {
      isMounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const loadDashboardData = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(true);

      // ✅ OPTIMIZADO: Usar endpoints específicos del dashboard
      const [propiedadesData, clientesData, citasData, contratosData, pagosData] = await Promise.all([
        propiedadService.getAll(controller.signal, { page: 1, pageSize: 100 }),
        clienteService.getAll(controller.signal, { page: 1, pageSize: 50 }),
        citaService.getProximas(5, controller.signal), // ✅ OPTIMIZADO
        contratoService.getAll({}, controller.signal),
        pagoService.getDashboard(30, controller.signal) // ✅ OPTIMIZADO
      ]);

      if (!isMounted.current) return;

      // ✅ Extraer items si viene paginado
      const propiedades = propiedadesData.items || propiedadesData;
      const clientes = clientesData.items || clientesData;
      const citas = citasData; // Ya es array directo
      const contratos = contratosData;
      const pagos = pagosData; // Ya es array directo

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      const finSemana = new Date(hoy);
      finSemana.setDate(hoy.getDate() + 7);

      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

      // Propiedades disponibles
      const propDisponibles = propiedades.filter(p => p.estado_propiedad !== 'Cerrada').length;

      // Citas hoy (usando todas las citas para stats precisos)
      const citasHoyCount = citas.filter(c => {
        const fechaCita = new Date(c.fecha_visita_cita);
        fechaCita.setHours(0, 0, 0, 0);
        return fechaCita.getTime() === hoy.getTime();
      }).length;

      // Citas esta semana
      const citasSemanaCount = citas.filter(c => {
        const fechaCita = new Date(c.fecha_visita_cita);
        return fechaCita >= hoy && fechaCita <= finSemana;
      }).length;

      // Contratos activos
      const contratosActivos = contratos.filter(c => c.estado_contrato === 'Activo');
      const montoContratos = contratosActivos.reduce((sum, c) => sum + parseFloat(c.precio_cierre_contrato || 0), 0);

      // Pagos del mes
      const pagosMes = pagos.filter(p => {
        const fechaPago = new Date(p.fecha_pago);
        return fechaPago >= inicioMes && fechaPago <= finMes && p.estado_pago === 'Pagado';
      });
      const montoPagosMes = pagosMes.reduce((sum, p) => sum + parseFloat(p.monto_pago || 0), 0);

      setStats({
        totalPropiedades: propiedadesData.total || propiedades.length,
        propiedadesDisponibles: propDisponibles,
        totalClientes: clientesData.total || clientes.length,
        citasHoy: citasHoyCount,
        citasEstaSemana: citasSemanaCount,
        contratosActivos: contratosActivos.length,
        montoContratosActivos: montoContratos,
        pagosMes: pagosMes.length,
        montoPagosMes: montoPagosMes
      });

      // Propiedades por tipo
      const tiposCount = {};
      propiedades.forEach(p => {
        const tipo = p.tipo_propiedad || 'Otro';
        tiposCount[tipo] = (tiposCount[tipo] || 0) + 1;
      });
      setPropiedadesPorTipo(
        Object.entries(tiposCount).map(([name, value]) => ({ name, value }))
      );

      // Contratos por estado
      const estadosCount = {};
      contratos.forEach(c => {
        const estado = c.estado_contrato || 'Otro';
        estadosCount[estado] = (estadosCount[estado] || 0) + 1;
      });
      setContratosPorEstado(
        Object.entries(estadosCount).map(([name, value]) => ({ name, value }))
      );

      // Próximas citas (ya vienen ordenadas del backend)
      setProximasCitas(citas);

      // Ventas por mes (últimos 6 meses)
      const meses = [];
      for (let i = 5; i >= 0; i--) {
        const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
        const mesNombre = fecha.toLocaleDateString('es-BO', { month: 'short' });
        const inicioMesActual = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
        const finMesActual = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);

        const contratosDelMes = contratos.filter(c => {
          const fechaContrato = new Date(c.fecha_inicio_contrato);
          return fechaContrato >= inicioMesActual && fechaContrato <= finMesActual;
        });

        const montoMes = contratosDelMes.reduce((sum, c) => sum + parseFloat(c.precio_cierre_contrato || 0), 0);

        meses.push({
          mes: mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1),
          contratos: contratosDelMes.length,
          monto: montoMes
        });
      }
      setVentasPorMes(meses);

    } catch (error) {
      if (error.name === 'CanceledError' || error.name === 'AbortError') {
        return;
      }
      console.error('Error al cargar datos del dashboard:', error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'Bs. 0';
    return `Bs. ${parseFloat(amount).toLocaleString('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-BO', { 
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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
      {/* ✨ Welcome Header */}
      <div className="bg-gradient-to-br from-gray-800/80 via-gray-900/80 to-primary-900/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-green-500/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-4 shadow-lg shadow-green-500/30">
              <ChartBarIcon className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                👋 ¡Bienvenido, {user?.nombre_usuario}!
              </h1>
              <p className="text-gray-400 mt-1 text-lg">
                {isBroker
                  ? 'Panel de control completo del sistema'
                  : 'Gestiona clientes, propiedades y citas'}
              </p>
            </div>
          </div>
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-green-500/20">
            <p className="text-gray-400 text-sm font-medium">Fecha actual</p>
            <p className="text-green-400 text-lg font-bold mt-1">
              {new Date().toLocaleDateString('es-BO', { 
                weekday: 'long', 
                day: 'numeric',
                month: 'long'
              })}
            </p>
          </div>
        </div>
      </div>

      {/* ✨ KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Propiedades */}
        <div className="group relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-md rounded-2xl p-6 border border-blue-500/20 hover:border-blue-500/50 transition-all duration-300 shadow-xl hover:shadow-blue-500/20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-500/20 backdrop-blur-sm rounded-xl p-3 group-hover:scale-110 transition-transform duration-300">
                <HomeIcon className="h-7 w-7 text-blue-400" />
              </div>
              <ArrowTrendingUpIcon className="h-5 w-5 text-blue-400" />
            </div>
            <p className="text-gray-400 text-sm font-medium mb-1">Propiedades</p>
            <p className="text-3xl font-bold text-white mb-2">{stats.totalPropiedades}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">
                {stats.propiedadesDisponibles} disponibles
              </span>
            </div>
            <Link 
              to="/propiedades" 
              className="mt-4 inline-flex items-center text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium group"
            >
              Ver todas 
              <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Clientes */}
        <div className="group relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-md rounded-2xl p-6 border border-green-500/20 hover:border-green-500/50 transition-all duration-300 shadow-xl hover:shadow-green-500/20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-500/20 backdrop-blur-sm rounded-xl p-3 group-hover:scale-110 transition-transform duration-300">
                <UserGroupIcon className="h-7 w-7 text-green-400" />
              </div>
              <ArrowTrendingUpIcon className="h-5 w-5 text-green-400" />
            </div>
            <p className="text-gray-400 text-sm font-medium mb-1">Clientes</p>
            <p className="text-3xl font-bold text-white mb-2">{stats.totalClientes}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                Total registrados
              </span>
            </div>
            <Link 
              to="/clientes" 
              className="mt-4 inline-flex items-center text-sm text-green-400 hover:text-green-300 transition-colors font-medium group"
            >
              Ver todos 
              <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Citas */}
        <div className="group relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-md rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/50 transition-all duration-300 shadow-xl hover:shadow-purple-500/20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-500/20 backdrop-blur-sm rounded-xl p-3 group-hover:scale-110 transition-transform duration-300">
                <CalendarIcon className="h-7 w-7 text-purple-400" />
              </div>
              <ClockIcon className="h-5 w-5 text-purple-400" />
            </div>
            <p className="text-gray-400 text-sm font-medium mb-1">Citas Hoy</p>
            <p className="text-3xl font-bold text-white mb-2">{stats.citasHoy}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full">
                {stats.citasEstaSemana} esta semana
              </span>
            </div>
            <Link 
              to="/citas" 
              className="mt-4 inline-flex items-center text-sm text-purple-400 hover:text-purple-300 transition-colors font-medium group"
            >
              Ver todas 
              <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Ingresos */}
        <div className="group relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-md rounded-2xl p-6 border border-orange-500/20 hover:border-orange-500/50 transition-all duration-300 shadow-xl hover:shadow-orange-500/20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-500/20 backdrop-blur-sm rounded-xl p-3 group-hover:scale-110 transition-transform duration-300">
                <CurrencyDollarIcon className="h-7 w-7 text-orange-400" />
              </div>
              <ArrowTrendingUpIcon className="h-5 w-5 text-orange-400" />
            </div>
            <p className="text-gray-400 text-sm font-medium mb-1">Ingresos del Mes</p>
            <p className="text-3xl font-bold text-white mb-2">{formatCurrency(stats.montoPagosMes)}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full">
                {stats.pagosMes} pagos
              </span>
            </div>
            <Link 
              to="/pagos" 
              className="mt-4 inline-flex items-center text-sm text-orange-400 hover:text-orange-300 transition-colors font-medium group"
            >
              Ver pagos 
              <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* ✨ Contratos Activos */}
      <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-green-500/20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-500/20 backdrop-blur-sm rounded-xl p-2">
              <DocumentTextIcon className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Contratos Activos</h3>
              <p className="text-sm text-gray-400">Estado actual de los contratos</p>
            </div>
          </div>
          <Link 
            to="/contratos" 
            className="text-green-400 hover:text-green-300 text-sm font-medium flex items-center gap-1 group"
          >
            Ver todos
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-sm rounded-xl p-5 border border-blue-500/30 hover:border-blue-500/50 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-blue-400 font-semibold">Total Activos</p>
              <CheckCircleIcon className="h-5 w-5 text-blue-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-3xl font-bold text-white">{stats.contratosActivos}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 backdrop-blur-sm rounded-xl p-5 border border-green-500/30 hover:border-green-500/50 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-green-400 font-semibold">Monto Total</p>
              <CurrencyDollarIcon className="h-5 w-5 text-green-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-3xl font-bold text-white">{formatCurrency(stats.montoContratosActivos)}</p>
          </div>
        </div>
      </div>

      {/* ✨ Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas por mes */}
        <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-green-500/20">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5 text-green-400" />
            Contratos por Mes
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ventasPorMes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="mes" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #10b981', 
                  borderRadius: '0.5rem',
                  color: '#fff'
                }}
                formatter={(value, name) => {
                  if (name === 'monto') return [formatCurrency(value), 'Monto'];
                  return [value, 'Contratos'];
                }}
              />
              <Legend />
              <Bar dataKey="contratos" fill="#10b981" name="Contratos" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Propiedades por tipo */}
        <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-green-500/20">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <HomeIcon className="h-5 w-5 text-green-400" />
            Propiedades por Tipo
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={propiedadesPorTipo}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {propiedadesPorTipo.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #10b981', 
                  borderRadius: '0.5rem',
                  color: '#fff'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ✨ Próximas Citas y Accesos Rápidos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas citas */}
        <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-green-500/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-500/20 backdrop-blur-sm rounded-xl p-2">
                <CalendarIcon className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Próximas Citas</h3>
            </div>
            <Link 
              to="/citas" 
              className="text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center gap-1 group"
            >
              Ver todas
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          {proximasCitas.length === 0 ? (
            <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700/50">
              <CalendarIcon className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No hay citas programadas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {proximasCitas.map((cita, index) => (
                <div 
                  key={index} 
                  className="group flex items-center gap-4 p-4 bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10"
                >
                  <div className="bg-purple-500/20 backdrop-blur-sm rounded-xl p-3 group-hover:scale-110 transition-transform duration-300">
                    <CalendarIcon className="h-5 w-5 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{cita.tipo_cita || 'Visita'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(cita.fecha_visita_cita)}</p>
                  </div>
                  <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                    cita.estado_cita === 'Programada' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                    cita.estado_cita === 'Completada' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    'bg-gray-700/50 text-gray-400 border border-gray-600/30'
                  }`}>
                    {cita.estado_cita}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ✨ Accesos Rápidos */}
        <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-green-500/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-green-500/20 backdrop-blur-sm rounded-xl p-2">
              <PlusIcon className="h-6 w-6 text-green-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Accesos Rápidos</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/propiedades/nuevo"
              className="group relative flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-sm hover:from-blue-500/20 hover:to-blue-600/20 rounded-xl transition-all duration-300 border border-blue-500/30 hover:border-blue-500/50 overflow-hidden hover:shadow-lg hover:shadow-blue-500/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-600/0 group-hover:from-blue-500/10 group-hover:to-blue-600/10 transition-all duration-300"></div>
              <div className="relative z-10 bg-blue-500/20 backdrop-blur-sm rounded-xl p-4 mb-3 group-hover:scale-110 transition-transform duration-300">
                <HomeIcon className="w-8 h-8 text-blue-400" />
              </div>
              <span className="relative z-10 text-sm font-bold text-blue-400 text-center">Nueva Propiedad</span>
            </Link>

            <Link
              to="/clientes/nuevo"
              className="group relative flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-500/10 to-emerald-600/10 backdrop-blur-sm hover:from-green-500/20 hover:to-emerald-600/20 rounded-xl transition-all duration-300 border border-green-500/30 hover:border-green-500/50 overflow-hidden hover:shadow-lg hover:shadow-green-500/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-emerald-600/0 group-hover:from-green-500/10 group-hover:to-emerald-600/10 transition-all duration-300"></div>
              <div className="relative z-10 bg-green-500/20 backdrop-blur-sm rounded-xl p-4 mb-3 group-hover:scale-110 transition-transform duration-300">
                <UserGroupIcon className="w-8 h-8 text-green-400" />
              </div>
              <span className="relative z-10 text-sm font-bold text-green-400 text-center">Nuevo Cliente</span>
            </Link>

            <Link
              to="/citas/nuevo"
              className="group relative flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/10 backdrop-blur-sm hover:from-purple-500/20 hover:to-purple-600/20 rounded-xl transition-all duration-300 border border-purple-500/30 hover:border-purple-500/50 overflow-hidden hover:shadow-lg hover:shadow-purple-500/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-600/0 group-hover:from-purple-500/10 group-hover:to-purple-600/10 transition-all duration-300"></div>
              <div className="relative z-10 bg-purple-500/20 backdrop-blur-sm rounded-xl p-4 mb-3 group-hover:scale-110 transition-transform duration-300">
                <CalendarIcon className="w-8 h-8 text-purple-400" />
              </div>
              <span className="relative z-10 text-sm font-bold text-purple-400 text-center">Nueva Cita</span>
            </Link>

            <Link
              to="/contratos/nuevo"
              className="group relative flex flex-col items-center justify-center p-6 bg-gradient-to-br from-orange-500/10 to-orange-600/10 backdrop-blur-sm hover:from-orange-500/20 hover:to-orange-600/20 rounded-xl transition-all duration-300 border border-orange-500/30 hover:border-orange-500/50 overflow-hidden hover:shadow-lg hover:shadow-orange-500/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-orange-600/0 group-hover:from-orange-500/10 group-hover:to-orange-600/10 transition-all duration-300"></div>
              <div className="relative z-10 bg-orange-500/20 backdrop-blur-sm rounded-xl p-4 mb-3 group-hover:scale-110 transition-transform duration-300">
                <DocumentTextIcon className="w-8 h-8 text-orange-400" />
              </div>
              <span className="relative z-10 text-sm font-bold text-orange-400 text-center">Nuevo Contrato</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ✨ Contratos por Estado */}
      {contratosPorEstado.length > 0 && (
        <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-green-500/20">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <DocumentTextIcon className="h-5 w-5 text-green-400" />
            Contratos por Estado
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {contratosPorEstado.map((estado, index) => (
              <div 
                key={index} 
                className="group bg-gradient-to-br from-gray-700/40 to-gray-800/40 backdrop-blur-sm rounded-xl p-5 border border-gray-600/50 hover:border-green-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10"
              >
                <p className="text-sm text-gray-400 font-medium mb-2">{estado.name}</p>
                <p className="text-3xl font-bold text-white group-hover:text-green-400 transition-colors">{estado.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
