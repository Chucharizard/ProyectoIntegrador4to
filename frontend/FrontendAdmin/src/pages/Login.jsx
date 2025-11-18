import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const canvasRef = useRef(null);
  
  const [formData, setFormData] = useState({
    nombre_usuario: '',
    contrasenia_usuario: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [inputFocused, setInputFocused] = useState({ username: false, password: false });

  // Efecto de constelaciones mejorado
  // Efecto de constelaciones OPTIMIZADO para móvil
useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  
  // ✅ AJUSTE DINÁMICO según tamaño de pantalla
  const isMobile = window.innerWidth < 768;
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
  
  const particleCount = isMobile ? 40 : isTablet ? 80 : 150; // 📱 40 móvil, 💻 80 tablet, 🖥️ 150 desktop
  const maxDistance = isMobile ? 100 : isTablet ? 140 : 180; // Menor distancia en móvil
  const particleSpeed = isMobile ? 0.3 : 0.8; // Más lento en móvil

  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * particleSpeed;
      this.vy = (Math.random() - 0.5) * particleSpeed;
      this.radius = isMobile ? Math.random() * 2 + 1 : Math.random() * 3 + 1.5; // Más pequeñas en móvil
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
      
      // ✅ Gradiente más suave en móvil
      const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2);
      const glowIntensity = isMobile ? 0.8 : 1; // Menos glow en móvil
      gradient.addColorStop(0, `rgba(16, 185, 129, ${glowIntensity})`);
      gradient.addColorStop(0.5, `rgba(16, 185, 129, ${0.6 * glowIntensity})`);
      gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
      ctx.fillStyle = gradient;
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

    // Dibujar líneas entre partículas cercanas
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < maxDistance) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          const opacityMultiplier = isMobile ? 0.6 : 0.9; // Líneas más tenues en móvil
          const opacity = (1 - distance / maxDistance) * opacityMultiplier;
          ctx.strokeStyle = `rgba(16, 185, 129, ${opacity})`;
          ctx.lineWidth = isMobile ? 1 : 1.5; // Líneas más delgadas en móvil
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(animate);
  }

  animate();

  const handleResize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    if (errors[name]) {
      setErrors({...errors, [name]: ''});
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nombre_usuario.trim()) {
      newErrors.nombre_usuario = 'El usuario es requerido';
    }
    
    if (!formData.contrasenia_usuario.trim()) {
      newErrors.contrasenia_usuario = 'La contraseña es requerida';
    } else if (formData.contrasenia_usuario.length < 6) {
      newErrors.contrasenia_usuario = 'Mínimo 6 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor completa todos los campos correctamente');
      return;
    }

    setLoading(true);

    try {
      const result = await login(formData);
      
      if (result.success) {
        toast.success('¡Bienvenido de nuevo!', {
          icon: '👋',
          style: {
            borderRadius: '10px',
            background: '#10b981',
            color: '#fff',
          },
        });
        navigate('/dashboard', { replace: true });
      } else {
        setErrors({ general: result.error || 'Credenciales incorrectas' });
        toast.error(result.error || 'Credenciales incorrectas');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Error al iniciar sesión';
      
      if (error.response?.status === 401) {
        errorMessage = 'Usuario o contraseña incorrectos';
        setErrors({ general: errorMessage });
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'No se puede conectar con el servidor';
        setErrors({ general: errorMessage });
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 flex items-center justify-center py-6 px-4">
      {/* Canvas de constelaciones - CON Z-INDEX MÁXIMO */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ 
          opacity: 0.8,
          zIndex: 10,
          pointerEvents: 'none' // ✅ CRÍTICO: No bloquea clics
        }}
      />

      {/* Efectos de fondo adicionales - DETRÁS */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        {/* Gradiente overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-secondary-900/10 via-transparent to-accent-900/10"></div>
        
        {/* Círculos decorativos */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-secondary-500/10 rounded-full mix-blend-overlay filter blur-3xl animate-blob"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000"></div>
      </div>

      {/* Card principal - Z-INDEX MEDIO */}
      <div className="relative w-full max-w-6xl mx-auto animate-fade-in" style={{ zIndex: 5 }}>
        {/* Card con transparencia para ver el canvas */}
        <div className="grid lg:grid-cols-2 bg-primary-900/60 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border border-white/10">
          
          {/* LADO IZQUIERDO */}
          <div className="hidden lg:flex flex-col items-center justify-center p-10 xl:p-12 bg-gradient-to-br from-primary-900/80 via-primary-800/80 to-secondary-900/80 backdrop-blur-sm relative overflow-hidden">
            {/* Patrón de puntos */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '30px 30px'
            }}></div>

            {/* Contenido centrado */}
            <div className="relative z-10 text-center space-y-6">
              {/* Logo */}
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-secondary-400 via-secondary-500 to-secondary-600 rounded-3xl shadow-2xl mb-6 animate-float">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>

              {/* Título */}
              <div className="space-y-3">
                <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
                  Inmobiliaria
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-secondary-300 to-accent-300">
                    App
                  </span>
                </h1>
                <div className="w-16 h-1 bg-gradient-to-r from-secondary-400 to-accent-400 mx-auto rounded-full"></div>
              </div>

              {/* Subtítulo */}
              <p className="text-lg text-gray-300 max-w-sm mx-auto leading-relaxed">
                Sistema de gestión inmobiliaria profesional
              </p>

              {/* Indicadores */}
              <div className="flex items-center justify-center space-x-2 pt-6">
                <div className="w-2 h-2 bg-secondary-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-secondary-400 rounded-full animate-pulse animation-delay-200"></div>
                <div className="w-2 h-2 bg-secondary-400 rounded-full animate-pulse animation-delay-400"></div>
              </div>
            </div>

            {/* Versión */}
            <div className="absolute bottom-6 left-0 right-0 text-center">
              <p className="text-sm text-gray-400">v1.0.0 • Admin Panel</p>
            </div>
          </div>

          {/* LADO DERECHO - MUY TRANSPARENTE */}
          <div className="p-6 lg:p-10 xl:px-12 xl:py-8 flex items-center bg-primary-900/40 backdrop-blur-sm">
            <div className="w-full max-w-md mx-auto relative" style={{ zIndex: 20 }}>
              {/* Logo móvil */}
              <div className="lg:hidden text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-2xl mb-3 shadow-lg">
                  <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-white drop-shadow-lg">InmobiliariaApp</h1>
              </div>

              {/* Header */}
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Bienvenido</h2>
                <p className="text-white/90 drop-shadow-md">Ingresa tus credenciales para continuar</p>
              </div>

              {/* Error general */}
              {errors.general && (
                <div className="mb-5 p-3.5 bg-red-500/95 backdrop-blur-md border-l-4 border-red-700 rounded-r-xl flex items-start animate-shake shadow-xl" role="alert">
                  <svg className="w-5 h-5 text-white mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-white">{errors.general}</span>
                </div>
              )}

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* Campo Usuario */}
                <div>
                  <label htmlFor="nombre_usuario" className="block text-sm font-bold text-white mb-2 drop-shadow-md">
                    Usuario
                  </label>
                  <div className="relative group">
                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-all duration-200 ${
                      inputFocused.username ? 'text-secondary-600 scale-110' : 'text-gray-500'
                    }`}>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      id="nombre_usuario"
                      name="nombre_usuario"
                      type="text"
                      autoComplete="username"
                      required
                      aria-required="true"
                      aria-invalid={errors.nombre_usuario ? "true" : "false"}
                      aria-describedby={errors.nombre_usuario ? "username-error" : undefined}
                      className={`w-full pl-12 pr-4 py-3 bg-white/95 backdrop-blur-sm border-2 rounded-xl transition-all duration-200 outline-none shadow-lg ${
                        errors.nombre_usuario 
                          ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                          : 'border-gray-200 focus:border-secondary-500 focus:ring-4 focus:ring-secondary-100 focus:bg-white group-hover:border-gray-300'
                      }`}
                      placeholder="correo@ejemplo.com"
                      value={formData.nombre_usuario}
                      onChange={handleChange}
                      onFocus={() => setInputFocused({...inputFocused, username: true})}
                      onBlur={() => setInputFocused({...inputFocused, username: false})}
                      disabled={loading}
                      autoFocus
                    />
                    {formData.nombre_usuario && !errors.nombre_usuario && (
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-secondary-500 animate-scale-in" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {errors.nombre_usuario && (
                    <p className="mt-1.5 text-sm text-red-100 flex items-center animate-slide-down font-medium drop-shadow-md" id="username-error">
                      <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.nombre_usuario}
                    </p>
                  )}
                </div>

                {/* Campo Contraseña */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="contrasenia_usuario" className="block text-sm font-bold text-white drop-shadow-md">
                      Contraseña
                    </label>
                    <a href="#" className="text-sm font-medium text-secondary-300 hover:text-secondary-200 transition-colors drop-shadow-md">
                      ¿Olvidaste tu contraseña?
                    </a>
                  </div>
                  <div className="relative group">
                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-all duration-200 ${
                      inputFocused.password ? 'text-secondary-600 scale-110' : 'text-gray-500'
                    }`}>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      id="contrasenia_usuario"
                      name="contrasenia_usuario"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      aria-required="true"
                      aria-invalid={errors.contrasenia_usuario ? "true" : "false"}
                      aria-describedby={errors.contrasenia_usuario ? "password-error" : undefined}
                      className={`w-full pl-12 pr-12 py-3 bg-white/95 backdrop-blur-sm border-2 rounded-xl transition-all duration-200 outline-none shadow-lg ${
                        errors.contrasenia_usuario 
                          ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                          : 'border-gray-200 focus:border-secondary-500 focus:ring-4 focus:ring-secondary-100 focus:bg-white group-hover:border-gray-300'
                      }`}
                      placeholder="••••••••"
                      value={formData.contrasenia_usuario}
                      onChange={handleChange}
                      onFocus={() => setInputFocused({...inputFocused, password: true})}
                      onBlur={() => setInputFocused({...inputFocused, password: false})}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center hover:scale-110 transition-transform"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5 text-gray-500 hover:text-gray-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-gray-500 hover:text-gray-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.contrasenia_usuario && (
                    <p className="mt-1.5 text-sm text-red-100 flex items-center animate-slide-down font-medium drop-shadow-md" id="password-error">
                      <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.contrasenia_usuario}
                    </p>
                  )}
                </div>

                {/* Recordar sesión */}
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-gray-300 rounded transition-colors cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="ml-2.5 block text-sm text-white cursor-pointer select-none font-medium drop-shadow-md">
                    Mantener sesión iniciada
                  </label>
                </div>

                {/* Botón de Login */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full relative group bg-gradient-to-r from-secondary-600 to-secondary-500 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 hover:shadow-2xl hover:shadow-secondary-500/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center overflow-hidden"
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-secondary-500 to-secondary-400 transition-opacity duration-300 opacity-0 group-hover:opacity-100"></span>
                  <span className="relative flex items-center text-base">
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Iniciando sesión...
                      </>
                    ) : (
                      <>
                        Iniciar Sesión
                        <svg className="w-5 h-5 ml-2.5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    )}
                  </span>
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/30"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white/95 backdrop-blur-md text-gray-800 font-medium shadow-md rounded-full">Acceso seguro</span>
                </div>
              </div>

              {/* Badge de seguridad */}
              <div className="flex items-center justify-center space-x-2 text-sm text-white bg-white/15 backdrop-blur-md rounded-xl py-2.5 px-4 border border-white/20 shadow-lg">
                <svg className="w-5 h-5 text-secondary-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span className="font-medium drop-shadow-md">Conexión cifrada SSL</span>
              </div>

              {/* Credenciales de prueba */}
              {import.meta.env.DEV && (
                <div className="mt-5 p-3.5 bg-gradient-to-br from-amber-500/95 to-orange-500/95 backdrop-blur-md border border-amber-300/60 rounded-2xl shadow-xl">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-white mb-2">🔧 Modo Desarrollo</p>
                      <div className="text-xs text-white space-y-0.5 font-mono bg-white/30 rounded-lg p-2.5 mb-2.5 border border-white/40">
                        <p><span className="font-semibold">Usuario:</span> broker_admin</p>
                        <p><span className="font-semibold">Contraseña:</span> password123</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            nombre_usuario: 'broker_admin',
                            contrasenia_usuario: 'password123'
                          });
                          toast.success('Credenciales cargadas', { icon: '✅', duration: 2000 });
                        }}
                        className="w-full text-xs bg-white hover:bg-gray-100 text-amber-900 font-semibold px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                      >
                        ⚡ Autocompletar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-5 text-sm text-white/90 drop-shadow-xl">
          <p>© 2025 Sistema de Gestión Inmobiliaria • Todos los derechos reservados</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
