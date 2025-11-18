import { useAuth } from '../../auth/AuthContext';
import { BellIcon, MagnifyingGlassIcon, UserCircleIcon } from '@heroicons/react/24/outline';

const Navbar = () => {
  const { user } = useAuth();

  // Verificar si el usuario es Broker
  const isBroker = user?.id_rol === 1;

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-green-500/20 shadow-2xl backdrop-blur-xl">
      {/* Línea decorativa superior con gradiente verde neón */}
      <div className="h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
      
      <div className="px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Left Side - Título y Bienvenida */}
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent animate-pulse-slow">
              Panel de Administración
            </h2>
            <div className="flex items-center space-x-2 mt-1">
              <p className="text-sm text-gray-400">
                Bienvenido,
              </p>
              <p className="text-sm font-semibold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                {user?.nombre_usuario}
              </p>
              <span className="text-lg animate-wave">👋</span>
            </div>
          </div>

          {/* Right Side - Actions */}
          <div className="flex items-center space-x-3">
            {/* Search Bar (Desktop) */}
            <div className="hidden md:flex items-center bg-gray-800/50 border border-green-500/30 rounded-lg px-4 py-2 transition-all duration-300 hover:border-green-500/60 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-500/20 backdrop-blur-sm">
              <MagnifyingGlassIcon className="h-5 w-5 text-green-400 mr-2" />
              <input
                type="text"
                placeholder="Buscar..."
                className="bg-transparent border-none outline-none text-sm text-gray-300 placeholder-gray-500 w-48"
              />
            </div>

            {/* Notificaciones con efecto neón */}
            <button className="relative p-2.5 text-gray-400 hover:text-green-400 hover:bg-gray-800/50 rounded-lg transition-all duration-300 group border border-transparent hover:border-green-500/30">
              <BellIcon className="h-6 w-6 group-hover:scale-110 transition-transform" />
              {/* Badge de notificaciones */}
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-green-500 rounded-full shadow-lg shadow-green-500/50">
                <span className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></span>
              </span>
            </button>

            {/* Avatar del Usuario */}
            <div className="relative group">
              <button className="flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-gray-800/50 to-gray-800/30 border border-green-500/30 rounded-lg hover:border-green-500/60 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20">
                <UserCircleIcon className="h-7 w-7 text-green-400" />
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-semibold text-gray-200">{user?.nombre_usuario}</p>
                  <p className="text-xs text-gray-400">
                    {isBroker ? '👨‍💼 Broker' : '📋 Secretaria'}
                  </p>
                </div>
              </button>
            </div>

            {/* Badge de rol con efecto glassmorphism */}
            <div
              className={`
                relative overflow-hidden px-5 py-2.5 rounded-lg text-sm font-bold shadow-xl
                transition-all duration-300 hover:scale-105
                ${
                  isBroker
                    ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border-2 border-green-500/50'
                    : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 border-2 border-blue-500/50'
                }
                backdrop-blur-sm
              `}
            >
              {/* Efecto shine animado */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-shine"></span>
              
              <span className="relative flex items-center space-x-2">
                <span className="text-lg">{isBroker ? '👨‍💼' : '📋'}</span>
                <span>{isBroker ? 'Broker' : 'Secretaria'}</span>
              </span>

              {/* Efecto de brillo en el borde */}
              <span className={`absolute inset-0 rounded-lg ${isBroker ? 'shadow-green-500/20' : 'shadow-blue-500/20'} shadow-lg`}></span>
            </div>
          </div>
        </div>
      </div>

      {/* Línea decorativa inferior con efecto de partículas */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-green-500/30 to-transparent"></div>
    </header>
  );
};

export default Navbar;
