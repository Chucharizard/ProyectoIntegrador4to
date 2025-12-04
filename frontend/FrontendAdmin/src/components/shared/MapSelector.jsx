import { useState, useEffect } from 'react';
import { MapPinIcon, XMarkIcon } from '@heroicons/react/24/outline';

const MapSelector = ({ initialLat, initialLng, onLocationSelect, onClose }) => {
  const [position, setPosition] = useState({
    lat: initialLat || -19.0479,
    lng: initialLng || -65.2595
  });

  useEffect(() => {
    // Cargar el script de OpenStreetMap (Leaflet)
    const loadLeaflet = () => {
      // CSS de Leaflet
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // JS de Leaflet
      if (!window.L) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = initializeMap;
        document.body.appendChild(script);
      } else {
        initializeMap();
      }
    };

    const initializeMap = () => {
      // Esperar un momento para que el DOM esté listo
      setTimeout(() => {
        const mapContainer = document.getElementById('map-selector');
        if (!mapContainer) return;

        // Limpiar el contenedor si ya existe un mapa
        mapContainer.innerHTML = '';

        // Crear el mapa
        const map = window.L.map('map-selector').setView([position.lat, position.lng], 13);

        // Añadir capa de OpenStreetMap
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map);

        // Añadir marcador
        const marker = window.L.marker([position.lat, position.lng], {
          draggable: true
        }).addTo(map);

        // Actualizar posición cuando se arrastra el marcador
        marker.on('dragend', function(e) {
          const newPos = e.target.getLatLng();
          setPosition({ lat: newPos.lat, lng: newPos.lng });
        });

        // Permitir hacer clic en el mapa para mover el marcador
        map.on('click', function(e) {
          marker.setLatLng(e.latlng);
          setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
        });

        // Guardar referencia del mapa para limpieza
        mapContainer._leafletMap = map;
      }, 100);
    };

    loadLeaflet();

    return () => {
      const mapContainer = document.getElementById('map-selector');
      if (mapContainer && mapContainer._leafletMap) {
        mapContainer._leafletMap.remove();
      }
    };
  }, []);

  const handleConfirm = () => {
    onLocationSelect(position.lat.toFixed(6), position.lng.toFixed(6));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl border border-green-500/30 shadow-2xl w-full max-w-4xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <MapPinIcon className="h-6 w-6 text-green-400" />
            <h3 className="text-lg font-semibold text-green-400">Seleccionar Ubicación</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        {/* Coordenadas actuales */}
        <div className="p-4 bg-gray-900/50 border-b border-gray-700">
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-gray-400">Latitud:</span>
              <span className="ml-2 text-green-400 font-mono">{position.lat.toFixed(6)}</span>
            </div>
            <div>
              <span className="text-gray-400">Longitud:</span>
              <span className="ml-2 text-green-400 font-mono">{position.lng.toFixed(6)}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 Arrastra el marcador o haz clic en el mapa para seleccionar la ubicación exacta
          </p>
        </div>

        {/* Mapa */}
        <div 
          id="map-selector" 
          className="w-full h-96 bg-gray-900"
          style={{ minHeight: '400px' }}
        />

        {/* Footer con botones */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <MapPinIcon className="h-5 w-5" />
            Confirmar Ubicación
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapSelector;
