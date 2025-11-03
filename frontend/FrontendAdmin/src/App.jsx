import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/layout/Layout';
import ClientesList from './pages/clientes/ClientesList';
import ClienteForm from './pages/clientes/ClienteForm';
import EmpleadosList from './pages/empleados/EmpleadosList';
import EmpleadoForm from './pages/empleados/EmpleadoForm';
import UsuariosList from './pages/usuarios/UsuariosList';
import UsuarioForm from './pages/usuarios/UsuarioForm';
import PropietariosList from './pages/propietarios/PropietariosList';
import PropietarioForm from './pages/propietarios/PropietarioForm';

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
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Rutas de Empleados */}
          <Route
            path="/empleados"
            element={
              <ProtectedRoute>
                <EmpleadosList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/empleados/nuevo"
            element={
              <ProtectedRoute>
                <EmpleadoForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/empleados/editar/:ci"
            element={
              <ProtectedRoute>
                <EmpleadoForm />
              </ProtectedRoute>
            }
          />
          
          {/* ✅ Rutas de Usuarios - Ahora usan UUID */}
          <Route
            path="/usuarios"
            element={
              <ProtectedRoute>
                <UsuariosList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/usuarios/nuevo"
            element={
              <ProtectedRoute>
                <UsuarioForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/usuarios/editar/:id_usuario"
            element={
              <ProtectedRoute>
                <UsuarioForm />
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
          {/* Rutas de Propietarios */}
          <Route
            path="/propietarios"
            element={
              <ProtectedRoute>
                <PropietariosList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/propietarios/nuevo"
            element={
              <ProtectedRoute>
                <PropietarioForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/propietarios/editar/:ci"
            element={
              <ProtectedRoute>
                <PropietarioForm />
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
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
