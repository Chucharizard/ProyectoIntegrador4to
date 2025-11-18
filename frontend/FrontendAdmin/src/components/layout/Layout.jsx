import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/30 to-secondary-50/20">
      {/* Sidebar FUERA del árbol de navegación */}
      <Sidebar />

      {/* Main Content */}
      <div className="lg:ml-64 transition-all duration-300">
        {/* Navbar */}
        <Navbar />

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8 animate-fade-in">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
