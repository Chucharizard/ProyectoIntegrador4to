import { useAuth } from '../auth/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar simple */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Panel Administrativo</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Bienvenido, <span className="font-semibold">{user?.nombre_usuario}</span>
              </span>
              <button
                onClick={logout}
                className="btn-secondary text-sm"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">¡Bienvenido al Sistema!</h2>
            <div className="space-y-2 text-gray-700">
              <p><strong>Usuario:</strong> {user?.nombre_usuario}</p>
              <p><strong>Rol:</strong> {user?.id_rol === 1 ? 'Broker' : 'Secretaria'}</p>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Módulos disponibles:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {user?.id_rol === 1 && (
                  <>
                    <div className="p-4 bg-primary-50 rounded-lg">
                      <h4 className="font-semibold text-primary-900">Empleados</h4>
                      <p className="text-sm text-primary-700">Gestión de empleados</p>
                    </div>
                    <div className="p-4 bg-primary-50 rounded-lg">
                      <h4 className="font-semibold text-primary-900">Roles</h4>
                      <p className="text-sm text-primary-700">Gestión de roles</p>
                    </div>
                  </>
                )}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900">Clientes</h4>
                  <p className="text-sm text-blue-700">Gestión de clientes</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-900">Propietarios</h4>
                  <p className="text-sm text-green-700">Gestión de propietarios</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-semibold text-yellow-900">Propiedades</h4>
                  <p className="text-sm text-yellow-700">Gestión de propiedades</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-900">Contratos</h4>
                  <p className="text-sm text-purple-700">Gestión de contratos</p>
                </div>
                <div className="p-4 bg-pink-50 rounded-lg">
                  <h4 className="font-semibold text-pink-900">Visitas</h4>
                  <p className="text-sm text-pink-700">Gestión de visitas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
