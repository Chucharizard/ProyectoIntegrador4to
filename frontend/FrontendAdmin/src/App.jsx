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
import PropiedadesList from './pages/propiedades/PropiedadesList';
import PropiedadForm from './pages/propiedades/PropiedadForm';
import CitasList from './pages/citas/CitasList';
import CitaForm from './pages/citas/CitaForm';

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
          {/* Ruta pública sin Layout */}
          <Route path="/login" element={<Login />} />
          
          {/* ✅ TODAS las rutas protegidas dentro de UN SOLO Layout persistente */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    {/* Dashboard */}
                    <Route path="/dashboard" element={<Dashboard />} />
                    
                    {/* Empleados */}
                    <Route path="/empleados" element={<EmpleadosList />} />
                    <Route path="/empleados/nuevo" element={<EmpleadoForm />} />
                    <Route path="/empleados/editar/:ci" element={<EmpleadoForm />} />
                    
                    {/* Usuarios */}
                    <Route path="/usuarios" element={<UsuariosList />} />
                    <Route path="/usuarios/nuevo" element={<UsuarioForm />} />
                    <Route path="/usuarios/editar/:id_usuario" element={<UsuarioForm />} />
                    
                    {/* Roles */}
                    <Route 
                      path="/roles" 
                      element={
                        <div className="p-8 text-center">
                          <h2 className="text-2xl font-bold text-gray-800">Módulo Roles</h2>
                          <p className="text-gray-600 mt-2">Próximamente...</p>
                        </div>
                      } 
                    />
                    
                    {/* Clientes */}
                    <Route path="/clientes" element={<ClientesList />} />
                    <Route path="/clientes/nuevo" element={<ClienteForm />} />
                    <Route path="/clientes/editar/:ci" element={<ClienteForm />} />
                    
                    {/* Propietarios */}
                    <Route path="/propietarios" element={<PropietariosList />} />
                    <Route path="/propietarios/nuevo" element={<PropietarioForm />} />
                    <Route path="/propietarios/editar/:ci" element={<PropietarioForm />} />
                    
                    {/* Propiedades */}
                    <Route path="/propiedades" element={<PropiedadesList />} />
                    <Route path="/propiedades/nuevo" element={<PropiedadForm />} />
                    <Route path="/propiedades/editar/:id" element={<PropiedadForm />} />
                    
                    {/* Citas/Visitas */}
                    <Route path="/citas" element={<CitasList />} />
                    <Route path="/citas/nuevo" element={<CitaForm />} />
                    <Route path="/citas/editar/:id" element={<CitaForm />} />
                    
                    {/* Contratos */}
                    <Route 
                      path="/contratos" 
                      element={
                        <div className="p-8 text-center">
                          <h2 className="text-2xl font-bold text-gray-800">Módulo Contratos</h2>
                          <p className="text-gray-600 mt-2">Próximamente...</p>
                        </div>
                      } 
                    />
                    
                    {/* Visitas */}
                    <Route 
                      path="/visitas" 
                      element={
                        <div className="p-8 text-center">
                          <h2 className="text-2xl font-bold text-gray-800">Módulo Visitas</h2>
                          <p className="text-gray-600 mt-2">Próximamente...</p>
                        </div>
                      } 
                    />
                    
                    {/* Redirecciones */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
