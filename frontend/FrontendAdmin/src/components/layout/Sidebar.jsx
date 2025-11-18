import { useState, useEffect, useRef, memo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import {
  HomeIcon,
  UsersIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

// ✅ Componente del Canvas separado y memoizado
const ParticleCanvas = memo(() => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const sidebar = canvas.parentElement;
    canvas.width = sidebar.offsetWidth;
    canvas.height = sidebar.offsetHeight;

    const particles = [];
    const particleCount = 60;

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 3 + 1.5;
        this.opacity = Math.random() * 0.4 + 0.6;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > canvas.width) this.vx = -this.vx;
        if (this.y < 0 || this.y > canvas.height) this.vy = -this.vy;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 5);
        gradient.addColorStop(0, `rgba(16, 185, 129, ${this.opacity})`);
        gradient.addColorStop(0.3, `rgba(16, 185, 129, ${this.opacity * 0.6})`);
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity * 0.8})`;
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      animationRef.current = requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      canvas.width = sidebar.offsetWidth;
      canvas.height = sidebar.offsetHeight;
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none opacity-80"
      style={{ zIndex: 1 }}
    />
  );
});

ParticleCanvas.displayName = 'ParticleCanvas';

// ✅ Componente principal del Sidebar
const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isBroker = user?.id_rol === 1;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      setIsMobileMenuOpen(false);
    }
  };

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: HomeIcon,
      roles: [1, 2],
    },
    {
      name: 'Empleados',
      path: '/empleados',
      icon: UsersIcon,
      roles: [1],
    },
    {
      name: 'Usuarios',
      path: '/usuarios',
      icon: ShieldCheckIcon,
      roles: [1],
    },
    {
      name: 'Roles',
      path: '/roles',
      icon: ShieldCheckIcon,
      roles: [1],
    },
    {
      name: 'Clientes',
      path: '/clientes',
      icon: UserGroupIcon,
      roles: [1, 2],
    },
    {
      name: 'Propietarios',
      path: '/propietarios',
      icon: UserGroupIcon,
      roles: [1, 2],
    },
    {
      name: 'Propiedades',
      path: '/propiedades',
      icon: BuildingOfficeIcon,
      roles: [1, 2],
    },
    {
      name: 'Citas/Visitas',
      path: '/citas',
      icon: CalendarIcon,
      roles: [1, 2],
    },
    {
      name: 'Contratos',
      path: '/contratos',
      icon: DocumentTextIcon,
      roles: [1, 2],
    },
    {
      name: 'Pagos',
      path: '/pagos',
      icon: CurrencyDollarIcon,
      roles: [1, 2],
    },
  ];

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
          className="relative p-3 rounded-2xl bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl shadow-2xl text-gray-700 hover:text-secondary-600 transition-all duration-300 hover:scale-110 active:scale-95 border border-white/50 group overflow-hidden"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-secondary-500/20 to-accent-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          
          {isMobileMenuOpen ? (
            <XMarkIcon className="h-6 w-6 relative z-10 transition-transform group-hover:rotate-90 duration-300" />
          ) : (
            <Bars3Icon className="h-6 w-6 relative z-10 transition-transform group-hover:scale-110 duration-300" />
          )}
        </button>
      </div>

      {/* Overlay para móvil */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-primary-950/80 backdrop-blur-md z-40 animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - ✅ Estructura fija sin re-renders innecesarios */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-64
          bg-gradient-to-b from-primary-950 via-primary-900 to-primary-950
          transform transition-all duration-500 ease-out z-40
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 shadow-2xl border-r border-white/10
          overflow-hidden
        `}
      >
        {/* ✅ Canvas memoizado - NO se re-renderiza */}
        <ParticleCanvas />

        {/* Gradientes de fondo - ✅ Siempre presentes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-secondary-500/20 rounded-full filter blur-3xl animate-blob"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-accent-500/20 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 -right-20 w-48 h-48 bg-purple-500/10 rounded-full filter blur-2xl animate-blob animation-delay-4000"></div>
        </div>

        {/* ✅ Contenido con z-index fijo */}
        <div className="flex flex-col h-full relative" style={{ zIndex: 2 }}>
          {/* Logo/Header */}
          <div className="p-4 border-b border-white/10 backdrop-blur-sm bg-primary-900/30">
            <div className="flex flex-col items-center space-y-2">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-secondary-400 to-accent-400 rounded-xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                <div className="relative w-12 h-12 bg-gradient-to-br from-secondary-400 via-secondary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-2xl transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 animate-float">
                  <svg className="w-7 h-7 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
              </div>
              
              <div className="text-center">
                <h1 className="text-xl font-bold bg-gradient-to-r from-secondary-300 via-white to-accent-300 bg-clip-text text-transparent drop-shadow-lg animate-gradient-x">
                  InmoAdmin
                </h1>
                <div className="flex items-center justify-center space-x-1 mt-0.5">
                  <SparklesIcon className="w-2.5 h-2.5 text-secondary-400 animate-pulse" />
                  <p className="text-xs text-gray-400 font-medium">v1.0</p>
                  <SparklesIcon className="w-2.5 h-2.5 text-accent-400 animate-pulse animation-delay-200" />
                </div>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-3 border-b border-white/10 bg-primary-900/20 backdrop-blur-sm">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 rounded-xl backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
              
              <div className="relative flex items-center space-x-2.5 p-2.5 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 transition-all duration-300 group-hover:border-secondary-500/50 group-hover:shadow-lg group-hover:shadow-secondary-500/20">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-secondary-500 to-accent-500 rounded-lg blur-sm opacity-75 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative w-10 h-10 bg-gradient-to-br from-secondary-500 via-secondary-600 to-accent-500 rounded-lg flex items-center justify-center shadow-lg transform transition-all duration-300 group-hover:scale-105">
                    <span className="text-base font-bold text-white drop-shadow-md">
                      {user?.nombre_usuario?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-primary-900"></span>
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate drop-shadow-md">
                    {user?.nombre_usuario}
                  </p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium inline-block ${
                    isBroker 
                      ? 'bg-gradient-to-r from-secondary-500/20 to-accent-500/20 text-secondary-300 border border-secondary-500/30' 
                      : 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {isBroker ? '👨‍💼 Broker' : '📋 Secretaria'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto py-3 custom-scrollbar bg-primary-900/10 backdrop-blur-sm">
            <ul className="space-y-1 px-2.5">
              {filteredMenu.map((item, index) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={handleLinkClick}
                      className={`
                        relative flex items-center space-x-2.5 px-3 py-2.5 rounded-lg
                        transition-all duration-300 group overflow-hidden
                        ${
                          active
                            ? 'bg-gradient-to-r from-secondary-500 to-accent-500 shadow-lg shadow-secondary-500/30 text-white scale-105'
                            : 'hover:bg-white/10 text-gray-300 hover:text-white hover:scale-102 backdrop-blur-sm'
                        }
                      `}
                    >
                      {!active && (
                        <>
                          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                          <span className="absolute inset-0 rounded-lg border border-transparent group-hover:border-secondary-500/30 transition-colors duration-300"></span>
                        </>
                      )}
                      
                      <div className={`relative p-1.5 rounded-md transition-all duration-300 ${
                        active ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'
                      }`}>
                        <Icon className={`h-4 w-4 relative z-10 transition-all duration-300 ${
                          active ? '' : 'group-hover:scale-110'
                        }`} />
                      </div>
                      
                      <span className="font-semibold text-sm flex-1 relative z-10">
                        {item.name}
                      </span>
                      
                      {active && (
                        <ChevronRightIcon className="h-4 w-4 animate-pulse relative z-10" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout Button */}
          <div className="p-3 border-t border-white/10 backdrop-blur-sm bg-primary-900/30">
            <button
              onClick={handleLogout}
              className="w-full relative flex items-center justify-center space-x-2 px-3 py-2.5 rounded-lg overflow-hidden group transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-500 transition-transform duration-300 group-hover:scale-110"></span>
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
              <span className="absolute inset-0 rounded-lg shadow-lg shadow-red-500/0 group-hover:shadow-red-500/50 transition-shadow duration-300"></span>
              
              <ArrowRightOnRectangleIcon className="h-4 w-4 relative z-10 text-white transform transition-transform group-hover:translate-x-1" />
              <span className="font-semibold text-sm text-white relative z-10">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
