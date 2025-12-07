import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { propiedadService } from '../../services/propiedadService';
import documentoPropiedadService from '../../services/documentoPropiedadService';
import { 
  DocumentTextIcon,
  ArrowUpTrayIcon,
  TrashIcon,
  EyeIcon,
  HomeIcon,
  XMarkIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import BackButton from '../../components/shared/BackButton';
import PageHeader from '../../components/shared/PageHeader';

export default function PropiedadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [propiedad, setPropiedad] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Form data para subir documento
  const [uploadForm, setUploadForm] = useState({
    tipo_documento: 'Título de propiedad',
    observaciones: '',
    file: null
  });

  const tiposDocumento = [
    'Título de propiedad',
    'Plano catastral',
    'Folio real',
    'Impuestos al día',
    'Certificado de tradición',
    'Contrato de compraventa',
    'Avalúo comercial',
    'Certificado de libertad',
    'Otro'
  ];

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [propData, docsData] = await Promise.all([
        propiedadService.getById(id),
        documentoPropiedadService.getByPropiedad(id)
      ]);
      
      setPropiedad(propData);
      setDocumentos(docsData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar la información');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamaño (máx 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('El archivo es muy grande. Máximo 10MB');
        return;
      }
      
      setUploadForm({ ...uploadForm, file });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadForm.file) {
      toast.error('Selecciona un archivo');
      return;
    }

    try {
      setUploading(true);
      await documentoPropiedadService.upload(
        id,
        uploadForm.tipo_documento,
        uploadForm.file,
        uploadForm.observaciones || null
      );
      
      toast.success('Documento subido exitosamente');
      setShowUploadModal(false);
      setUploadForm({
        tipo_documento: 'Título de propiedad',
        observaciones: '',
        file: null
      });
      
      // Recargar documentos
      const docsData = await documentoPropiedadService.getByPropiedad(id);
      setDocumentos(docsData);
    } catch (error) {
      console.error('Error subiendo documento:', error);
      toast.error(error.response?.data?.detail || 'Error al subir el documento');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (idDocumento, nombreArchivo) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${nombreArchivo}"?`)) {
      return;
    }

    try {
      await documentoPropiedadService.delete(idDocumento);
      toast.success('Documento eliminado exitosamente');
      
      // Recargar documentos
      const docsData = await documentoPropiedadService.getByPropiedad(id);
      setDocumentos(docsData);
    } catch (error) {
      console.error('Error eliminando documento:', error);
      toast.error('Error al eliminar el documento');
    }
  };

  const getFileIcon = (nombreArchivo) => {
    if (!nombreArchivo) return <DocumentTextIcon className="h-8 w-8" />;
    
    const ext = nombreArchivo.split('.').pop().toLowerCase();
    const iconClass = "h-8 w-8";
    
    if (['pdf'].includes(ext)) return <DocumentTextIcon className={`${iconClass} text-red-400`} />;
    if (['doc', 'docx'].includes(ext)) return <DocumentTextIcon className={`${iconClass} text-blue-400`} />;
    if (['jpg', 'jpeg', 'png'].includes(ext)) return <DocumentTextIcon className={`${iconClass} text-purple-400`} />;
    
    return <DocumentTextIcon className={iconClass} />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-BO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (url) => {
    // Placeholder - el tamaño real requeriría una petición HEAD
    return 'N/A';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando información...</p>
        </div>
      </div>
    );
  }

  if (!propiedad) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <HomeIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Propiedad no encontrada</p>
          <button
            onClick={() => navigate('/propiedades')}
            className="mt-4 text-green-400 hover:text-green-300"
          >
            Volver a Propiedades
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Button */}
        <BackButton to="/propiedades" label="Volver a Propiedades" />

        {/* Header */}
        <PageHeader
          title={propiedad.titulo_propiedad || 'Propiedad sin título'}
          description={`Código: ${propiedad.codigo_publico_propiedad || 'N/A'} - Documentos y archivos adjuntos`}
          buttonText="Subir Documento"
          onButtonClick={() => setShowUploadModal(true)}
          icon={ArrowUpTrayIcon}
        />

        {/* Info de la propiedad */}
        <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl border border-gray-800/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <HomeIcon className="h-5 w-5 text-green-400" />
            Información de la Propiedad
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Tipo de Operación:</span>
              <p className="text-gray-200 font-medium">{propiedad.tipo_operacion_propiedad || 'N/A'}</p>
            </div>
            <div>
              <span className="text-gray-400">Estado:</span>
              <p className="text-gray-200 font-medium">{propiedad.estado_propiedad || 'N/A'}</p>
            </div>
            <div>
              <span className="text-gray-400">Precio:</span>
              <p className="text-green-400 font-bold">
                {propiedad.precio_publicado_propiedad 
                  ? new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(propiedad.precio_publicado_propiedad)
                  : 'No especificado'}
              </p>
            </div>
          </div>
        </div>

        {/* Lista de documentos */}
        <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl border border-gray-800/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5 text-green-400" />
              Documentos ({documentos.length})
            </h3>
          </div>

          {documentos.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">No hay documentos subidos</p>
              <p className="text-gray-500 text-sm">Haz clic en "Subir Documento" para agregar archivos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documentos.map((doc) => (
                <div
                  key={doc.id_documento}
                  className="bg-gray-800/50 rounded-lg border border-gray-700/50 p-4 hover:border-green-500/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getFileIcon(doc.nombre_archivo_original)}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-200 truncate">
                          {doc.nombre_archivo_original || 'Archivo sin nombre'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {doc.tipo_documento || 'Sin tipo'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {doc.observaciones_documento && (
                    <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                      {doc.observaciones_documento}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>{formatDate(doc.fecha_subida_documento)}</span>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={doc.ruta_archivo_documento}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-sm font-medium transition-colors"
                    >
                      <EyeIcon className="h-4 w-4" />
                      Ver
                    </a>
                    <button
                      onClick={() => handleDelete(doc.id_documento, doc.nombre_archivo_original)}
                      className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal para subir documento */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-gray-900 rounded-xl border border-gray-800 max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ArrowUpTrayIcon className="h-6 w-6 text-green-400" />
                Subir Documento
              </h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              {/* Tipo de documento */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tipo de Documento <span className="text-red-400">*</span>
                </label>
                <select
                  value={uploadForm.tipo_documento}
                  onChange={(e) => setUploadForm({ ...uploadForm, tipo_documento: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:ring-2 focus:ring-green-500"
                >
                  {tiposDocumento.map((tipo) => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>

              {/* Archivo */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Archivo <span className="text-red-400">*</span>
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:ring-2 focus:ring-green-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-600 file:text-white file:cursor-pointer hover:file:bg-green-700"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formatos: PDF, Word, imágenes. Máximo 10MB
                </p>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Observaciones
                </label>
                <textarea
                  value={uploadForm.observaciones}
                  onChange={(e) => setUploadForm({ ...uploadForm, observaciones: e.target.value })}
                  rows={3}
                  placeholder="Notas adicionales sobre el documento..."
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <ArrowUpTrayIcon className="h-5 w-5" />
                      Subir
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
