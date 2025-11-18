import { useAuth } from '../../auth/AuthContext';
import { BellIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const Navbar = () => {
  const { user } = useAuth();

  // Verificar si el usuario es Broker
  const isBroker = user?.id_rol === 1;

  return (
    <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-200/50 sticky top-0 z-30 transition-all duration-300">
      <div className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Título de la página con gradiente */}
          <div className="animate-slide-up">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-900 via-primary-700 to-secondary-600 bg-clip-text text-transparent">
              Panel de Administración
            </h2>
            <p className="text-sm text-gray-600 mt-1 flex items-center space-x-2">
              <span>Bienvenido,</span>
              <span className="font-semibold bg-gradient-to-r from-secondary-600 to-accent-600 bg-clip-text text-transparent">
                {user?.nombre_usuario}
              </span>
              <span className="inline-flex items-center">
                👋
              </span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {/* Search Bar (Desktop) */}
            <div className="hidden md:flex items-center bg-gray-50 hover:bg-white border border-gray-200 rounded-xl px-4 py-2 transition-all duration-200 focus-within:ring-2 focus-within:ring-secondary-500/20 focus-within:border-secondary-500">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Buscar..."
                className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 w-48"
              />
            </div>

            {/* Notificaciones con animación */}
            <button className="relative p-2.5 text-gray-600 hover:text-secondary-600 hover:bg-secondary-50 rounded-xl transition-all duration-200 group">
              <BellIcon className="h-6 w-6 group-hover:scale-110 transition-transform" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-accent-500 rounded-full animate-pulse shadow-lg">
                <span className="absolute inset-0 bg-accent-500 rounded-full animate-ping opacity-75"></span>
              </span>
            </button>

            {/* Badge de rol mejorado con glassmorphism */}
            <div
              className={`
                relative overflow-hidden px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md
                backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg
                ${
                  isBroker
                    ? 'bg-gradient-to-r from-secondary-500/90 to-accent-500/90 text-white border border-white/20'
                    : 'bg-gradient-to-r from-blue-500/90 to-primary-500/90 text-white border border-white/20'
                }
              `}
            >
              {/* Efecto shine */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shine"></span>
              
              <span className="relative flex items-center space-x-2">
                <span className="text-lg">{isBroker ? '👨‍💼' : '📋'}</span>
                <span>{isBroker ? 'Broker' : 'Secretaria'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
