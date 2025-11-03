import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { clienteService } from '../../services/clienteService';
import toast from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const ClienteForm = () => {
  const navigate = useNavigate();
  const { ci } = useParams();
  const isEditing = Boolean(ci);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    ci_cliente: '',
    nombres_completo_cliente: '',
    apellidos_completo_cliente: '',
    telefono_cliente: '',
    correo_electronico_cliente: '',
    preferencia_zona_cliente: '',
    presupuesto_max_cliente: '',
    origen_cliente: '',
  });

  // ✅ useEffect optimizado con AbortController
  useEffect(() => {
    if (!isEditing) return;

    const controller = new AbortController();
    let isMounted = true;

    const loadCliente = async () => {
      try {
        setLoading(true);
        const data = await clienteService.getById(ci, controller.signal);
        
        if (isMounted) {
          setFormData({
            ci_cliente: data.ci_cliente || '',
            nombres_completo_cliente: data.nombres_completo_cliente || '',
            apellidos_completo_cliente: data.apellidos_completo_cliente || '',
            telefono_cliente: data.telefono_cliente || '',
            correo_electronico_cliente: data.correo_electronico_cliente || '',
            preferencia_zona_cliente: data.preferencia_zona_cliente || '',
            presupuesto_max_cliente: data.presupuesto_max_cliente || '',
            origen_cliente: data.origen_cliente || '',
          });
        }
      } catch (error) {
        if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError') {
          return;
        }

        if (isMounted) {
          console.error('Error al cargar cliente:', error);
          toast.error('Error al cargar los datos del cliente');
          navigate('/clientes');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadCliente();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [ci, isEditing, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!formData.ci_cliente.trim()) {
      toast.error('El CI es obligatorio');
      return;
    }
    if (!formData.nombres_completo_cliente.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    if (!formData.apellidos_completo_cliente.trim()) {
      toast.error('Los apellidos son obligatorios');
      return;
    }

    try {
      setLoading(true);

      // Preparar datos (convertir strings vacíos a null)
      const dataToSend = {
        ...formData,
        telefono_cliente: formData.telefono_cliente || null,
        correo_electronico_cliente: formData.correo_electronico_cliente || null,
        preferencia_zona_cliente: formData.preferencia_zona_cliente || null,
        presupuesto_max_cliente: formData.presupuesto_max_cliente
          ? parseFloat(formData.presupuesto_max_cliente)
          : null,
        origen_cliente: formData.origen_cliente || null,
      };

      if (isEditing) {
        await clienteService.update(ci, dataToSend);
        toast.success('Cliente actualizado correctamente');
      } else {
        await clienteService.create(dataToSend);
        toast.success('Cliente creado correctamente');
      }

      navigate('/clientes');
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      toast.error(
        error.response?.data?.detail || 'Error al guardar el cliente'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/clientes')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-150"
          >
            <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEditing
                ? 'Modifica la información del cliente'
                : 'Completa los datos del nuevo cliente'}
            </p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-6">
            {/* Información Personal */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Información Personal
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CI <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="ci_cliente"
                    value={formData.ci_cliente}
                    onChange={handleChange}
                    disabled={isEditing}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isEditing ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    placeholder="Ej: 12345678"
                    required
                  />
                  {isEditing && (
                    <p className="text-xs text-gray-500 mt-1">
                      El CI no se puede modificar
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="telefono_cliente"
                    value={formData.telefono_cliente}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: 70123456"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombres <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nombres_completo_cliente"
                    value={formData.nombres_completo_cliente}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Juan Carlos"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellidos <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="apellidos_completo_cliente"
                    value={formData.apellidos_completo_cliente}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Pérez García"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    name="correo_electronico_cliente"
                    value={formData.correo_electronico_cliente}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: juan.perez@email.com"
                  />
                </div>
              </div>
            </div>

            {/* Preferencias */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Preferencias
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zona Preferida
                  </label>
                  <input
                    type="text"
                    name="preferencia_zona_cliente"
                    value={formData.preferencia_zona_cliente}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Zona Sur, Centro"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Presupuesto Máximo (Bs.)
                  </label>
                  <input
                    type="number"
                    name="presupuesto_max_cliente"
                    value={formData.presupuesto_max_cliente}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: 150000"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Origen/Fuente
                  </label>
                  <select
                    name="origen_cliente"
                    value={formData.origen_cliente}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Referido">Referido</option>
                    <option value="Redes Sociales">Redes Sociales</option>
                    <option value="Sitio Web">Sitio Web</option>
                    <option value="Llamada Directa">Llamada Directa</option>
                    <option value="Oficina">Oficina</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-4 mt-6 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/clientes')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-150"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <span>{isEditing ? 'Actualizar' : 'Crear'} Cliente</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default ClienteForm;
