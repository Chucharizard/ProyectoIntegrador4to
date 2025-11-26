import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import publicacionService from '../../services/publicacionService';
import propiedadService from '../../services/propiedadService';
import imagenesService from '../../services/imagenesService';
import { PasoDetalles, PasoImagenes, PasoConfirmar } from './components/PasosPublicacion';

export default function EditarPublicacionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paso, setPaso] = useState(1); // Empezar en paso 1: Detalles
  
  // Datos
  const [propiedad, setPropiedad] = useState(null);
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
    const cargarDatos = async () => {
      try {
        setLoading(true);
        
        // Cargar propiedad
        const propData = await propiedadService.getById(id);
        setPropiedad(propData);

        // Cargar detalles existentes
        try {
          const detallesData = await publicacionService.getDetalles(id);
          setDetalles(detallesData);
        } catch (err) {
          console.log('No hay detalles previos, usando valores por defecto', err);
        }

        // Cargar imágenes
        const imgs = await imagenesService.getImagenesPorPropiedad(id);
        setImagenes(imgs.map(img => ({
          ...img,
          seleccionada: true, // Por defecto todas seleccionadas al editar
        })));

      } catch (error) {
        console.error('Error cargando datos:', error);
        toast.error('Error al cargar la publicación');
        navigate('/publicaciones');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [id, navigate]);

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

  const handleUploadImages = async (files) => {
    try {
      toast.loading('Subiendo imágenes...', { id: 'upload' });
      
      const nuevasImagenes = await imagenesService.subirImagenes(id, files);

      setImagenes(prev => [
        ...prev,
        ...nuevasImagenes.map(img => ({
          ...img,
          seleccionada: true,
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

  const handleGuardar = async () => {
    setSaving(true);
    try {
      // Validar que haya al menos una imagen seleccionada
      const imagenesSeleccionadas = imagenes.filter(img => img.seleccionada);
      if (imagenesSeleccionadas.length === 0) {
        toast.error('Selecciona al menos una imagen');
        return;
      }

      // Validar que haya una portada
      const tienePortada = imagenesSeleccionadas.some(img => img.es_portada_imagen);
      if (!tienePortada) {
        toast.error('Marca una imagen como portada');
        return;
      }

      // Guardar detalles
      await publicacionService.guardarDetalles(id, detalles);

      // TODO: Actualizar cuáles imágenes mostrar (si el backend lo soporta)

      toast.success('✅ Publicación actualizada exitosamente');
      navigate('/publicaciones');
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.error('❌ Error al actualizar la publicación');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando publicación...</p>
        </div>
      </div>
    );
  }

  if (!propiedad) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl">❌ Publicación no encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/publicaciones')}
            className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
          >
            ← Volver a publicaciones
          </button>

          <h1 className="text-3xl font-bold text-white mb-2">
            ✏️ Editar Publicación
          </h1>
          <p className="text-gray-400">
            {propiedad.titulo_propiedad} - {propiedad.codigo_publico_propiedad}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            {[
              { num: 1, label: 'Detalles' },
              { num: 2, label: 'Imágenes' },
              { num: 3, label: 'Confirmar' }
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
                {idx < 2 && (
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
        <div>
          {paso === 1 && (
            <PasoDetalles
              detalles={detalles}
              onChange={handleDetalleChange}
              onNext={() => setPaso(2)}
              onBack={() => navigate('/publicaciones')}
            />
          )}

          {paso === 2 && (
            <PasoImagenes
              imagenes={imagenes}
              onToggle={handleImagenToggle}
              onMarcarPortada={handleMarcarPortada}
              onUploadImages={handleUploadImages}
              propiedadId={id}
              onNext={() => setPaso(3)}
              onBack={() => setPaso(1)}
            />
          )}

          {paso === 3 && (
            <PasoConfirmar
              propiedad={propiedad}
              detalles={detalles}
              imagenes={imagenes.filter(img => img.seleccionada)}
              onPublicar={handleGuardar}
              onBack={() => setPaso(2)}
              loading={saving}
            />
          )}
        </div>
      </div>
    </div>
  );
}
