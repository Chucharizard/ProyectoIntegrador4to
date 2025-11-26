import { useState, useRef } from 'react';

// Componentes para los pasos del formulario de publicación

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

export function PasoDetalles({ detalles, onChange, onNext, onBack }) {
  const caracteristicas = [
    { key: 'tiene_jardin', label: '🌳 Jardín', icon: '🌳' },
    { key: 'tiene_piscina', label: '🏊 Piscina', icon: '🏊' },
    { key: 'tiene_garaje_techado', label: '🚗 Garaje techado', icon: '🚗' },
    { key: 'tiene_area_servicio', label: '🧹 Área de servicio', icon: '🧹' },
    { key: 'tiene_buena_vista', label: '🌄 Buena vista', icon: '🌄' },
    { key: 'tiene_ascensor', label: '🛗 Ascensor', icon: '🛗' },
    { key: 'tiene_balcon', label: '🏘️ Balcón', icon: '🏘️' },
    { key: 'tiene_terraza', label: '☀️ Terraza', icon: '☀️' },
    { key: 'tiene_sala_estar', label: '🛋️ Sala de estar', icon: '🛋️' },
    { key: 'tiene_cocina_equipada', label: '🍳 Cocina equipada', icon: '🍳' }
  ];

  return (
    <div className="bg-gray-900 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-white mb-6">
        Detalles de la propiedad
      </h2>

      {/* Números */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            🛏️ Dormitorios
          </label>
          <input
            type="number"
            min="0"
            value={detalles.num_dormitorios}
            onChange={(e) => onChange('num_dormitorios', parseInt(e.target.value) || 0)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            🚿 Baños
          </label>
          <input
            type="number"
            min="0"
            value={detalles.num_banos}
            onChange={(e) => onChange('num_banos', parseInt(e.target.value) || 0)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            🚗 Estacionamiento
          </label>
          <input
            type="number"
            min="0"
            value={detalles.capacidad_estacionamiento}
            onChange={(e) => onChange('capacidad_estacionamiento', parseInt(e.target.value) || 0)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
          />
        </div>
      </div>

      {/* Características (Checkboxes) */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          ✨ Características
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {caracteristicas.map((car) => (
            <label
              key={car.key}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                detalles[car.key]
                  ? 'bg-green-900/30 border-green-600'
                  : 'bg-gray-800 border-gray-700 hover:border-gray-600'
              }`}
            >
              <input
                type="checkbox"
                checked={detalles[car.key]}
                onChange={(e) => onChange(car.key, e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-green-600 focus:ring-green-500"
              />
              <span className="text-white">{car.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Otros detalles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            📅 Antigüedad (años)
          </label>
          <input
            type="number"
            min="0"
            placeholder="Opcional"
            value={detalles.antiguedad_anios || ''}
            onChange={(e) => onChange('antiguedad_anios', parseInt(e.target.value) || null)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            🏗️ Estado de construcción
          </label>
          <select
            value={detalles.estado_construccion}
            onChange={(e) => onChange('estado_construccion', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
          >
            <option value="">Seleccionar...</option>
            <option value="Nuevo">Nuevo</option>
            <option value="A estrenar">A estrenar</option>
            <option value="Buen estado">Buen estado</option>
            <option value="A refaccionar">A refaccionar</option>
          </select>
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          ← Anterior
        </button>
        <button
          onClick={onNext}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}

export function PasoImagenes({ imagenes, onToggle, onMarcarPortada, onNext, onBack, onUploadImages, propiedadId }) {
  const seleccionadas = imagenes.filter(img => img.seleccionada);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Debug: Ver qué imágenes llegan
  console.log('🖼️ [DEBUG] Imágenes recibidas:', imagenes);  
  console.log('🖼️ [DEBUG] Primera imagen URL:', imagenes[0]?.url_imagen);

  const handleFileChange = async (files) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadedImages = await onUploadImages(files);
      console.log('✅ Imágenes subidas:', uploadedImages);
    } catch (error) {
      console.error('❌ Error subiendo imágenes:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      handleFileChange(files);
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-white mb-2">
        Seleccionar imágenes para la publicación
      </h2>
      <p className="text-gray-400 mb-4">
        {seleccionadas.length} de {imagenes.length} imágenes seleccionadas
        {seleccionadas.length > 0 && ` · ${seleccionadas.some(img => img.es_portada_imagen) ? '✓' : '⚠️'} Portada ${seleccionadas.some(img => img.es_portada_imagen) ? 'marcada' : 'no marcada'}`}
      </p>

      {/* Upload Zone */}
      <div
        className={`mb-6 border-2 border-dashed rounded-lg p-6 text-center transition-all ${
          dragActive
            ? 'border-green-500 bg-green-900/20'
            : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFileChange(Array.from(e.target.files))}
          className="hidden"
        />
        
        <div className="flex flex-col items-center gap-3">
          <div className="text-4xl">
            {uploading ? '⏳' : '📸'}
          </div>
          <div className="text-white font-semibold">
            {uploading ? 'Subiendo imágenes...' : 'Agregar nuevas imágenes'}
          </div>
          <div className="text-gray-400 text-sm">
            Arrastra archivos aquí o{' '}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-green-400 hover:text-green-300 underline disabled:opacity-50"
            >
              selecciona desde tu dispositivo
            </button>
          </div>
          <div className="text-gray-500 text-xs">
            Formatos: JPG, PNG, WEBP · Máx: 5MB por imagen
          </div>
        </div>
      </div>

      {imagenes.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          Esta propiedad no tiene imágenes aún
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {imagenes.map((img) => (
            <div
              key={img.id_imagen}
              className={`relative rounded-lg overflow-hidden border-4 transition-all ${
                img.seleccionada
                  ? 'border-green-600'
                  : 'border-gray-800'
              }`}
            >
              {/* Imagen */}
              <img
                src={getImageUrl(img.url_imagen)}
                alt={img.descripcion_imagen || 'Imagen'}
                className="w-full h-48 object-cover bg-gray-800"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23374151" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239CA3AF" font-family="sans-serif" font-size="16"%3EImagen no disponible%3C/text%3E%3C/svg%3E';
                  console.error('❌ Error cargando imagen:', img.url_imagen);
                }}
                onLoad={() => console.log('✅ Imagen cargada:', getImageUrl(img.url_imagen))}
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity">
                {/* Checkbox Seleccionar */}
                <button
                  onClick={() => onToggle(img.id_imagen)}
                  className={`px-4 py-2 rounded-lg font-semibold ${
                    img.seleccionada
                      ? 'bg-red-600 text-white'
                      : 'bg-green-600 text-white'
                  }`}
                >
                  {img.seleccionada ? '✓ Seleccionada' : 'Seleccionar'}
                </button>

                {/* Botón Portada */}
                {img.seleccionada && (
                  <button
                    onClick={() => onMarcarPortada(img.id_imagen)}
                    className={`px-4 py-2 rounded-lg font-semibold ${
                      img.es_portada_imagen
                        ? 'bg-yellow-600 text-white'
                        : 'bg-gray-700 text-white'
                    }`}
                  >
                    {img.es_portada_imagen ? '⭐ Portada' : 'Marcar portada'}
                  </button>
                )}
              </div>

              {/* Badges */}
              {img.seleccionada && (
                <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">
                  ✓
                </div>
              )}
              {img.es_portada_imagen && img.seleccionada && (
                <div className="absolute top-2 right-2 bg-yellow-600 text-white px-2 py-1 rounded text-xs font-semibold">
                  ⭐ Portada
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Botones */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          ← Anterior
        </button>
        <button
          onClick={onNext}
          disabled={seleccionadas.length === 0 || !seleccionadas.some(img => img.es_portada_imagen)}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}

export function PasoConfirmar({ propiedad, detalles, imagenes, onPublicar, onBack, loading }) {
  const caracteristicasActivas = Object.entries(detalles)
    .filter(([key, value]) => key.startsWith('tiene_') && value === true)
    .map(([key]) => {
      const labels = {
        tiene_jardin: '🌳 Jardín',
        tiene_piscina: '🏊 Piscina',
        tiene_garaje_techado: '🚗 Garaje techado',
        tiene_area_servicio: '🧹 Área de servicio',
        tiene_buena_vista: '🌄 Buena vista',
        tiene_ascensor: '🛗 Ascensor',
        tiene_balcon: '🏘️ Balcón',
        tiene_terraza: '☀️ Terraza',
        tiene_sala_estar: '🛋️ Sala de estar',
        tiene_cocina_equipada: '🍳 Cocina equipada'
      };
      return labels[key] || key;
    });

  return (
    <div className="bg-gray-900 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-white mb-6">
        Confirmar publicación
      </h2>

      {/* Propiedad */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-green-400 mb-3">🏠 Propiedad</h3>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-white font-semibold mb-2">{propiedad.titulo_propiedad}</div>
          <div className="text-green-400 font-bold text-xl">
            ${propiedad.precio_publicado_propiedad?.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Detalles */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-green-400 mb-3">📋 Detalles</h3>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl mb-1">🛏️</div>
              <div className="text-white font-semibold">{detalles.num_dormitorios}</div>
              <div className="text-gray-400 text-sm">Dormitorios</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">🚿</div>
              <div className="text-white font-semibold">{detalles.num_banos}</div>
              <div className="text-gray-400 text-sm">Baños</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">🚗</div>
              <div className="text-white font-semibold">{detalles.capacidad_estacionamiento}</div>
              <div className="text-gray-400 text-sm">Estacionamiento</div>
            </div>
          </div>

          {caracteristicasActivas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {caracteristicasActivas.map((car, idx) => (
                <span key={idx} className="bg-green-900/30 text-green-400 px-3 py-1 rounded text-sm">
                  {car}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Imágenes */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-green-400 mb-3">
          🖼️ Imágenes ({imagenes.length})
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {imagenes.map((img) => (
            <div key={img.id_imagen} className="relative">
              <img
                src={getImageUrl(img.url_imagen)}
                alt="Imagen"
                className="w-full h-24 object-cover rounded-lg"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect fill="%23374151" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239CA3AF" font-family="sans-serif" font-size="10"%3E❌%3C/text%3E%3C/svg%3E';
                }}
              />
              {img.es_portada_imagen && (
                <div className="absolute top-1 right-1 bg-yellow-600 text-white px-2 py-0.5 rounded text-xs font-semibold">
                  ⭐
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          disabled={loading}
          className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          ← Anterior
        </button>
        <button
          onClick={onPublicar}
          disabled={loading}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Publicando...
            </>
          ) : (
            '📢 Publicar Propiedad'
          )}
        </button>
      </div>
    </div>
  );
}
