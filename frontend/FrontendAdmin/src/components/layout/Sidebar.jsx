import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import {
  HomeIcon,
  UsersIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  CalendarIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Verificar si el usuario es Broker (id_rol === 1)
  const isBroker = user?.id_rol === 1;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Menú de navegación
  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: HomeIcon,
      roles: [1, 2], // Broker y Secretaria
    },
    {
      name: 'Empleados',
      path: '/empleados',
      icon: UsersIcon,
      roles: [1], // Solo Broker
    },
    {
      name: 'Roles',
      path: '/roles',
      icon: ShieldCheckIcon,
      roles: [1], // Solo Broker
    },
    {
      name: 'Clientes',
      path: '/clientes',
      icon: UserGroupIcon,
      roles: [1, 2], // Broker y Secretaria
    },
    {
      name: 'Propietarios',
      path: '/propietarios',
      icon: UserGroupIcon,
      roles: [1, 2], // Broker y Secretaria
    },
    {
      name: 'Propiedades',
      path: '/propiedades',
      icon: BuildingOfficeIcon,
      roles: [1, 2], // Broker y Secretaria
    },
    {
      name: 'Contratos',
      path: '/contratos',
      icon: DocumentTextIcon,
      roles: [1, 2], // Broker y Secretaria
    },
    {
      name: 'Visitas',
      path: '/visitas',
      icon: CalendarIcon,
      roles: [1, 2], // Broker y Secretaria
    },
  ];

  // Filtrar menú según el rol del usuario
  const filteredMenu = menuItems.filter((item) =>
    item.roles.includes(user?.id_rol)
  );

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg bg-white shadow-lg text-gray-600 hover:text-gray-900"
        >
          {isMobileMenuOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Overlay para móvil */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-64 bg-gradient-to-b from-blue-600 to-blue-800 text-white
          transform transition-transform duration-300 ease-in-out z-40
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="p-6 border-b border-blue-500">
            <h1 className="text-2xl font-bold text-center">
              🏢 InmoAdmin
            </h1>
            <p className="text-sm text-blue-200 text-center mt-1">
              Sistema de Gestión
            </p>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-blue-500">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center">
                <span className="text-lg font-semibold">
                  {user?.nombre_usuario?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.nombre_usuario}
                </p>
                <p className="text-xs text-blue-200">
                  {isBroker ? 'Broker' : 'Secretaria'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              {filteredMenu.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`
                        flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                        ${
                          isActive(item.path)
                            ? 'bg-blue-700 shadow-lg'
                            : 'hover:bg-blue-700/50'
                        }
                      `}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-blue-500">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-red-500 hover:bg-red-600 transition-colors duration-200"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              <span className="font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
