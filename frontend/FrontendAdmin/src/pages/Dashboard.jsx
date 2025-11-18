import { useAuth } from '../auth/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  // Verificar si el usuario es Broker
  const isBroker = user?.id_rol === 1;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold">
          👋 ¡Bienvenido, {user?.nombre_usuario}!
        </h1>
        <p className="text-blue-100 mt-2">
          {isBroker
            ? 'Tienes acceso completo al sistema como Broker'
            : 'Gestiona clientes, propiedades y visitas como Secretaria'}
        </p>
      </div>

      {/* Contenido del Dashboard */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          📊 Panel de Control
        </h2>
        <p className="text-gray-600">
          Selecciona una opción del menú lateral para comenzar a gestionar el sistema.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
