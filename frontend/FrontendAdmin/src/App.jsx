import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/layout/Layout';
import ClientesList from './pages/clientes/ClientesList';
import ClienteForm from './pages/clientes/ClienteForm';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<Login />} />
          
          {/* Rutas protegidas */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Placeholder para futuras rutas */}
          <Route
            path="/empleados"
            element={
              <ProtectedRoute>
                <Layout>
                  <div className="p-8 text-center">
                    <h2 className="text-2xl font-bold text-gray-800">Módulo Empleados</h2>
                    <p className="text-gray-600 mt-2">Próximamente...</p>
                  </div>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/roles"
            element={
              <ProtectedRoute>
                <Layout>
                  <div className="p-8 text-center">
                    <h2 className="text-2xl font-bold text-gray-800">Módulo Roles</h2>
                    <p className="text-gray-600 mt-2">Próximamente...</p>
                  </div>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/clientes"
            element={
              <ProtectedRoute>
                <ClientesList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clientes/nuevo"
            element={
              <ProtectedRoute>
                <ClienteForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clientes/editar/:ci"
            element={
              <ProtectedRoute>
                <ClienteForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/propietarios"
            element={
              <ProtectedRoute>
                <Layout>
                  <div className="p-8 text-center">
                    <h2 className="text-2xl font-bold text-gray-800">Módulo Propietarios</h2>
                    <p className="text-gray-600 mt-2">Próximamente...</p>
                  </div>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/propiedades"
            element={
              <ProtectedRoute>
                <Layout>
                  <div className="p-8 text-center">
                    <h2 className="text-2xl font-bold text-gray-800">Módulo Propiedades</h2>
                    <p className="text-gray-600 mt-2">Próximamente...</p>
                  </div>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/contratos"
            element={
              <ProtectedRoute>
                <Layout>
                  <div className="p-8 text-center">
                    <h2 className="text-2xl font-bold text-gray-800">Módulo Contratos</h2>
                    <p className="text-gray-600 mt-2">Próximamente...</p>
                  </div>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/visitas"
            element={
              <ProtectedRoute>
                <Layout>
                  <div className="p-8 text-center">
                    <h2 className="text-2xl font-bold text-gray-800">Módulo Visitas</h2>
                    <p className="text-gray-600 mt-2">Próximamente...</p>
                  </div>
                </Layout>
              </ProtectedRoute>
            }
          />
          
          {/* Redirect a dashboard por defecto */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
