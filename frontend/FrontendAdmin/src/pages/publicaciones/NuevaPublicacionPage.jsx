import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import publicacionService from '../../services/publicacionService';
import propiedadService from '../../services/propiedadService';
import imagenesService from '../../services/imagenesService';
import { PasoDetalles, PasoImagenes, PasoConfirmar } from './components/PasosPublicacion';

export default function NuevaPublicacionPage() {
  const navigate = useNavigate();
  
  // Estados
  const [loading, setLoading] = useState(false);
  const [propiedades, setPropiedades] = useState([]);
  const [loadingPropiedades, setLoadingPropiedades] = useState(true);
  
  // Paso del wizard
  const [paso, setPaso] = useState(1); // 1: Seleccionar, 2: Detalles, 3: Imágenes, 4: Confirmar
  
  // Datos del formulario
  const [propiedadSeleccionada, setPropiedadSeleccionada] = useState(null);
  const [imagenes, setImagenes] = useState([]);
  const [detalles, setDetalles] = useState({
    num_dormitorios: 0,
    num_banos: 0,
    capacidad_estacionamiento: 0,
    tiene_jardin: false,
    tiene_piscina: false,
    tiene_garaje_techado: false,
    tiene_area_servicio: false,
    tiene_buena_vista: false,
    tiene_ascensor: false,
    tiene_balcon: false,
    tiene_terraza: false,
    tiene_sala_estar: false,
    tiene_cocina_equipada: false,
    antiguedad_anios: null,
    estado_construccion: ''
  });

  useEffect(() => {
    loadPropiedadesDisponibles();
  }, []);

  const loadPropiedadesDisponibles = async () => {
    try {
      setLoadingPropiedades(true);
      // Obtener propiedades que NO están cerradas ni publicadas
      const data = await propiedadService.getAll();
      // La respuesta puede ser un array directo o un objeto con { items, total, ... }
      const propiedadesArray = Array.isArray(data) ? data : (data.items || []);
      const disponibles = propiedadesArray.filter(
        p => p.estado_propiedad !== 'Cerrada' && p.estado_propiedad !== 'Publicada'
      );
      setPropiedades(disponibles);
    } catch (error) {
      console.error('Error al cargar propiedades:', error);
      toast.error('Error al cargar propiedades disponibles');
    } finally {
      setLoadingPropiedades(false);
    }
  };

  const handleSeleccionarPropiedad = async (propiedad) => {
    setPropiedadSeleccionada(propiedad);
    
    // Cargar imágenes de la propiedad
    try {
      const imgs = await imagenesService.getImagenesPorPropiedad(propiedad.id_propiedad);
      setImagenes(imgs.map(img => ({ ...img, seleccionada: false })));
    } catch (error) {
      console.error('Error al cargar imágenes:', error);
      setImagenes([]);
    }
    
    setPaso(2);
  };

  const handleDetalleChange = (field, value) => {
    setDetalles(prev => ({ ...prev, [field]: value }));
  };

  const handleImagenToggle = (idImagen) => {
    setImagenes(prev =>
      prev.map(img =>
        img.id_imagen === idImagen
          ? { ...img, seleccionada: !img.seleccionada }
          : img
      )
    );
  };

  const handleMarcarPortada = (idImagen) => {
    setImagenes(prev =>
      prev.map(img => ({
        ...img,
        es_portada_imagen: img.id_imagen === idImagen
      }))
    );
  };

  const handleDeleteImage = async (idImagen, descripcion) => {
    const nombreImagen = descripcion || 'esta imagen';
    if (!window.confirm(`¿Estás seguro de eliminar "${nombreImagen}" de la base de datos?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    try {
      toast.loading('Eliminando imagen...', { id: 'delete' });
      
      await imagenesService.eliminarImagen(idImagen);
      
      // Actualizar estado local eliminando la imagen
      setImagenes(prev => prev.filter(img => img.id_imagen !== idImagen));
      
      toast.success('Imagen eliminada exitosamente', { id: 'delete' });
    } catch (error) {
      console.error('Error al eliminar imagen:', error);
      toast.error('Error al eliminar la imagen', { id: 'delete' });
    }
  };

  const handleUploadImages = async (files) => {
    if (!propiedadSeleccionada) {
      toast.error('No hay propiedad seleccionada');
      return;
    }

    try {
      toast.loading('Subiendo imágenes...', { id: 'upload' });
      
      const nuevasImagenes = await imagenesService.subirImagenes(
        propiedadSeleccionada.id_propiedad,
        files
      );

      // Agregar las nuevas imágenes al estado
      setImagenes(prev => [
        ...prev,
        ...nuevasImagenes.map(img => ({
          ...img,
          seleccionada: false,
          es_portada_imagen: false
        }))
      ]);

      toast.success(`${nuevasImagenes.length} imagen(es) subida(s) exitosamente`, { id: 'upload' });
      return nuevasImagenes;
    } catch (error) {
      console.error('Error al subir imágenes:', error);
      toast.error('Error al subir imágenes', { id: 'upload' });
      throw error;
    }
  };

  const handlePublicar = async () => {
    try {
      setLoading(true);

      // Validaciones
      if (!propiedadSeleccionada) {
        toast.error('Selecciona una propiedad');
        return;
      }

      const imagenesSeleccionadas = imagenes.filter(img => img.seleccionada);
      if (imagenesSeleccionadas.length === 0) {
        toast.error('Selecciona al menos una imagen');
        return;
      }

      const tienePortada = imagenesSeleccionadas.some(img => img.es_portada_imagen);
      if (!tienePortada) {
        toast.error('Marca una imagen como portada');
        return;
      }

      // Publicar
      await publicacionService.publicar(propiedadSeleccionada.id_propiedad, detalles);

      // Actualizar imágenes (las que no están seleccionadas, desmarcarlas como portada)
      // Nota: Esto debería hacerse con un endpoint específico si quieres gestionar qué imágenes se muestran

      toast.success('¡Propiedad publicada exitosamente!');
      navigate('/publicaciones');
    } catch (error) {
      console.error('Error al publicar:', error);
      toast.error('Error al publicar la propiedad');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      {/* Header con progreso */}
      <div className="max-w-6xl mx-auto mb-8">
        <button
          onClick={() => navigate('/publicaciones')}
          className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
        >
          ← Volver a publicaciones
        </button>

        <h1 className="text-3xl font-bold text-white mb-6">
          📢 Nueva Publicación
        </h1>

        {/* Indicador de pasos */}
        <div className="flex items-center gap-2 mb-6">
          {[
            { num: 1, label: 'Propiedad' },
            { num: 2, label: 'Detalles' },
            { num: 3, label: 'Imágenes' },
            { num: 4, label: 'Confirmar' }
          ].map((step, idx) => (
            <div key={step.num} className="flex items-center flex-1">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                  paso >= step.num
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-800 text-gray-500'
                }`}
              >
                {paso > step.num ? '✓' : step.num}
              </div>
              <div className="flex-1 ml-2">
                <div className={`text-sm ${paso >= step.num ? 'text-white' : 'text-gray-500'}`}>
                  {step.label}
                </div>
              </div>
              {idx < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 rounded ${
                    paso > step.num ? 'bg-green-600' : 'bg-gray-800'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contenido según paso */}
      <div className="max-w-6xl mx-auto">
        {paso === 1 && (
          <PasoSeleccionarPropiedad
            propiedades={propiedades}
            loading={loadingPropiedades}
            onSeleccionar={handleSeleccionarPropiedad}
          />
        )}

        {paso === 2 && propiedadSeleccionada && (
          <PasoDetalles
            detalles={detalles}
            onChange={handleDetalleChange}
            onNext={() => setPaso(3)}
            onBack={() => {
              setPropiedadSeleccionada(null);
              setPaso(1);
            }}
          />
        )}

        {paso === 3 && (
          <PasoImagenes
            imagenes={imagenes}
            onToggle={handleImagenToggle}
            onMarcarPortada={handleMarcarPortada}
            onUploadImages={handleUploadImages}
            onDeleteImage={handleDeleteImage}
            propiedadId={propiedadSeleccionada?.id_propiedad}
            onNext={() => setPaso(4)}
            onBack={() => setPaso(2)}
          />
        )}

        {paso === 4 && propiedadSeleccionada && (
          <PasoConfirmar
            propiedad={propiedadSeleccionada}
            detalles={detalles}
            imagenes={imagenes.filter(img => img.seleccionada)}
            onPublicar={handlePublicar}
            onBack={() => setPaso(3)}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}

// ========================================
// COMPONENTES DE CADA PASO
// ========================================

function PasoSeleccionarPropiedad({ propiedades, loading, onSeleccionar }) {
  const [search, setSearch] = useState('');

  const filtered = propiedades.filter(p =>
    p.titulo_propiedad?.toLowerCase().includes(search.toLowerCase()) ||
    p.codigo_publico_propiedad?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
        <p className="text-gray-400 mt-4">Cargando propiedades...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-white mb-4">
        Selecciona la propiedad a publicar
      </h2>

      <input
        type="text"
        placeholder="Buscar por título o código..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white mb-4"
      />

      {filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          {search ? 'No se encontraron propiedades' : 'No hay propiedades disponibles para publicar'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((prop) => (
            <button
              key={prop.id_propiedad}
              onClick={() => onSeleccionar(prop)}
              className="bg-gray-800 hover:bg-gray-700 p-4 rounded-lg text-left transition-colors border-2 border-transparent hover:border-green-600"
            >
              <div className="text-xs text-gray-500 mb-1">
                {prop.codigo_publico_propiedad || prop.id_propiedad}
              </div>
              <div className="text-white font-semibold mb-2">
                {prop.titulo_propiedad}
              </div>
              <div className="text-green-400 font-bold mb-2">
                ${prop.precio_publicado_propiedad?.toLocaleString() || 'N/A'}
              </div>
              <div className="flex gap-2 text-xs">
                <span className="bg-gray-900 text-gray-400 px-2 py-1 rounded">
                  {prop.tipo_operacion_propiedad || 'N/A'}
                </span>
                <span className="bg-blue-900/30 text-blue-400 px-2 py-1 rounded">
                  {prop.estado_propiedad}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Los componentes PasoDetalles, PasoImagenes y PasoConfirmar están en ./components/PasosPublicacion.jsx
