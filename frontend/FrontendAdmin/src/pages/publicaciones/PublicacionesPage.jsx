import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import publicacionService from '../../services/publicacionService';

// Helper para construir URL completa de imagen
const getImageUrl = (relativePath) => {
  if (!relativePath) return null;
  // Si ya es una URL completa, devolverla tal cual
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  // Construir URL completa con el backend
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  // Remover /api si existe al final de baseURL
  const cleanBaseURL = baseURL.replace(/\/api\/?$/, '');
  // Asegurar que relativePath empiece con /
  const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${cleanBaseURL}${cleanPath}`;
};

export default function PublicacionesPage() {
  const [publicaciones, setPublicaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPublicaciones();
  }, []);

  const loadPublicaciones = async () => {
    try {
      setLoading(true);
      const data = await publicacionService.getPublicadas();
      setPublicaciones(data);
    } catch (error) {
      console.error('Error al cargar publicaciones:', error);
      toast.error('Error al cargar las publicaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleDespublicar = async (idPropiedad, titulo) => {
    if (!window.confirm(`¿Retirar de publicación "${titulo}"?`)) return;

    try {
      await publicacionService.despublicar(idPropiedad);
      toast.success('Propiedad retirada de publicación');
      loadPublicaciones();
    } catch (error) {
      console.error('Error al despublicar:', error);
      toast.error('Error al retirar la publicación');
    }
  };

  const filteredPublicaciones = publicaciones.filter(pub =>
    pub.titulo_propiedad?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pub.codigo_publico_propiedad?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              📢 Publicaciones
            </h1>
            <p className="text-gray-400">
              {publicaciones.length} propiedades publicadas
            </p>
          </div>
          <Link
            to="/publicaciones/nueva"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <span>➕</span>
            Nueva Publicación
          </Link>
        </div>

        {/* Buscador */}
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por título o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <span className="absolute right-4 top-3.5 text-gray-500">🔍</span>
        </div>
      </div>

      {/* Lista de Publicaciones */}
      {filteredPublicaciones.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-gray-400 text-lg">
            {searchTerm ? 'No se encontraron publicaciones' : 'No hay propiedades publicadas'}
          </p>
          {!searchTerm && (
            <Link
              to="/publicaciones/nueva"
              className="inline-block mt-4 text-green-500 hover:text-green-400"
            >
              Publicar primera propiedad →
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPublicaciones.map((pub) => (
            <div
              key={pub.id_propiedad}
              className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-gray-700 transition-all"
            >
              {/* Imagen principal */}
              <div className="relative h-48 bg-gray-800">
                {pub.imagenes && pub.imagenes.length > 0 ? (
                  <img
                    src={getImageUrl(
                      pub.imagenes.find(img => img.es_portada_imagen)?.url_imagen || 
                      pub.imagenes[0]?.url_imagen
                    )}
                    alt={pub.titulo_propiedad}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<div class="flex items-center justify-center h-full text-gray-600 text-4xl">🏠</div>';
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-600 text-4xl">
                    🏠
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  📢 Publicada
                </div>
                {pub.imagenes && pub.imagenes.length > 0 && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                    🖼️ {pub.imagenes.length} fotos
                  </div>
                )}
              </div>

              {/* Contenido */}
              <div className="p-4">
                {/* Código */}
                {pub.codigo_publico_propiedad && (
                  <div className="text-xs text-gray-500 mb-2">
                    {pub.codigo_publico_propiedad}
                  </div>
                )}

                {/* Título */}
                <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2">
                  {pub.titulo_propiedad}
                </h3>

                {/* Precio */}
                <div className="text-green-400 font-bold text-xl mb-3">
                  ${pub.precio_publicado_propiedad?.toLocaleString() || 'N/A'}
                </div>

                {/* Características */}
                {pub.detalles && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {pub.detalles.num_dormitorios > 0 && (
                      <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs">
                        🛏️ {pub.detalles.num_dormitorios} dorm
                      </span>
                    )}
                    {pub.detalles.num_banos > 0 && (
                      <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs">
                        🚿 {pub.detalles.num_banos} baños
                      </span>
                    )}
                    {pub.detalles.capacidad_estacionamiento > 0 && (
                      <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs">
                        🚗 {pub.detalles.capacidad_estacionamiento}
                      </span>
                    )}
                    {pub.detalles.tiene_piscina && (
                      <span className="bg-blue-900/30 text-blue-400 px-2 py-1 rounded text-xs">
                        🏊 Piscina
                      </span>
                    )}
                    {pub.detalles.tiene_jardin && (
                      <span className="bg-green-900/30 text-green-400 px-2 py-1 rounded text-xs">
                        🌳 Jardín
                      </span>
                    )}
                  </div>
                )}

                {/* Dirección */}
                {pub.direccion && (
                  <div className="text-gray-400 text-sm mb-4 line-clamp-1">
                    📍 {pub.direccion.zona_direccion}, {pub.direccion.ciudad_direccion}
                  </div>
                )}

                {/* Acciones */}
                <div className="flex gap-2">
                  <Link
                    to={`/publicaciones/editar/${pub.id_propiedad}`}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-center text-sm transition-colors"
                  >
                    ✏️ Editar
                  </Link>
                  <button
                    onClick={() => handleDespublicar(pub.id_propiedad, pub.titulo_propiedad)}
                    className="flex-1 bg-red-900/50 hover:bg-red-900/70 text-red-400 px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    ❌ Retirar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
