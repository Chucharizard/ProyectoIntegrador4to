import { useAuth } from '../../auth/AuthContext';
import { BellIcon } from '@heroicons/react/24/outline';

const Navbar = () => {
  const { user } = useAuth();

  // Verificar si el usuario es Broker
  const isBroker = user?.id_rol === 1;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 lg:ml-64">
      <div className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Título de la página */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              Panel de Administración
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Bienvenido, {user?.nombre_usuario}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Notificaciones */}
            <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200">
              <BellIcon className="h-6 w-6" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Badge de rol */}
            <div
              className={`
                px-4 py-2 rounded-full text-sm font-medium
                ${
                  isBroker
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-blue-100 text-blue-700'
                }
              `}
            >
              {isBroker ? 'Broker' : 'Secretaria'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
