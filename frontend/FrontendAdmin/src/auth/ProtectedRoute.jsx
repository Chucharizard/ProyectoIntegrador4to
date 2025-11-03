import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children, requireBroker = false }) => {
  const { isAuthenticated, loading, isBroker } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si requiere ser broker y no lo es, redirigir al dashboard
  if (requireBroker && !isBroker()) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
