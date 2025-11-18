import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import pagoService from '../../services/pagoService';
import contratoService from '../../services/contratoService';

function PagoForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const contratoIdFromUrl = searchParams.get('contrato');
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const isMounted = useRef(true);
  const abortControllerRef = useRef(null);

  const [formData, setFormData] = useState({
    id_contrato_operacion: contratoIdFromUrl || '',
    monto_pago: '',
    fecha_pago: new Date().toISOString().split('T')[0],
    numero_cuota_pago: '',
    estado_pago: 'Pendiente'
  });

  const [contratos, setContratos] = useState([]);
  const [contratoSeleccionado, setContratoSeleccionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    isMounted.current = true;
    loadInitialData();

    return () => {
      isMounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [id]);

  const loadInitialData = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoadingData(true);
      setError(null);

      // Cargar contratos activos
      const contratosData = await contratoService.getAll({ estado: 'Activo' }, controller.signal);

      if (!isMounted.current) return;

      setContratos(contratosData);

      // Si estamos editando, cargar datos del pago
      if (isEditing) {
        const pagoData = await pagoService.getById(id, controller.signal);
        
        if (!isMounted.current) return;

        setFormData({
          id_contrato_operacion: pagoData.id_contrato_operacion,
          monto_pago: pagoData.monto_pago,
          fecha_pago: pagoData.fecha_pago,
          numero_cuota_pago: pagoData.numero_cuota_pago || '',
          estado_pago: pagoData.estado_pago
        });

        // Buscar contrato seleccionado
        const contrato = contratosData.find(c => c.id_contrato_operacion === pagoData.id_contrato_operacion);
        setContratoSeleccionado(contrato);
      } else if (contratoIdFromUrl) {
        // Si viene un contrato desde la URL, preseleccionarlo
        const contrato = contratosData.find(c => c.id_contrato_operacion === contratoIdFromUrl);
        if (contrato) {
          setContratoSeleccionado(contrato);
        }
      }

    } catch (error) {
      if (error.name === 'CanceledError' || error.name === 'AbortError') {
        return;
      }
      console.error('Error al cargar datos:', error);
      if (isMounted.current) {
        setError('Error al cargar datos. Por favor, intente nuevamente.');
      }
    } finally {
      if (isMounted.current) {
        setLoadingData(false);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Si cambió el contrato, actualizar el contrato seleccionado
    if (name === 'id_contrato_operacion') {
      const contrato = contratos.find(c => c.id_contrato_operacion === value);
      setContratoSeleccionado(contrato);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.id_contrato_operacion) {
      alert('Por favor seleccione un contrato');
      return;
    }

    if (!formData.monto_pago || parseFloat(formData.monto_pago) <= 0) {
      alert('Por favor ingrese un monto válido');
      return;
    }

    if (!formData.fecha_pago) {
      alert('Por favor seleccione una fecha de pago');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const pagoData = {
        ...formData,
        monto_pago: parseFloat(formData.monto_pago),
        numero_cuota_pago: formData.numero_cuota_pago ? parseInt(formData.numero_cuota_pago) : null
      };

      if (isEditing) {
        await pagoService.update(id, pagoData);
      } else {
        await pagoService.create(pagoData);
      }

      navigate('/pagos');
    } catch (error) {
      console.error('Error al guardar pago:', error);
      setError(error.response?.data?.detail || 'Error al guardar el pago. Por favor, verifique los datos.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Editar Pago' : 'Registrar Nuevo Pago'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEditing ? 'Modifique los datos del pago' : 'Complete los datos del nuevo pago'}
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información del Contrato */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Información del Contrato
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contrato <span className="text-red-500">*</span>
              </label>
              <select
                name="id_contrato_operacion"
                value={formData.id_contrato_operacion}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isEditing}
              >
                <option value="">Seleccione un contrato activo</option>
                {contratos.map(contrato => (
                  <option key={contrato.id_contrato_operacion} value={contrato.id_contrato_operacion}>
                    {contrato.tipo_operacion_contrato} - Bs. {parseFloat(contrato.precio_cierre_contrato).toLocaleString('es-BO')} - {new Date(contrato.fecha_inicio_contrato).toLocaleDateString('es-BO')}
                  </option>
                ))}
              </select>
              {contratos.length === 0 && (
                <p className="text-sm text-amber-600 mt-1">
                  ⚠️ No hay contratos activos disponibles
                </p>
              )}
            </div>

            {contratoSeleccionado && (
              <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Resumen del Contrato</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">Tipo:</span>
                    <p className="text-blue-900">{contratoSeleccionado.tipo_operacion_contrato}</p>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Precio Total:</span>
                    <p className="text-blue-900 font-semibold">
                      Bs. {parseFloat(contratoSeleccionado.precio_cierre_contrato).toLocaleString('es-BO')}
                    </p>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Modalidad:</span>
                    <p className="text-blue-900">{contratoSeleccionado.modalidad_pago_contrato}</p>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Estado:</span>
                    <p className="text-blue-900">{contratoSeleccionado.estado_contrato}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Datos del Pago */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Datos del Pago
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto (Bs.) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="monto_pago"
                value={formData.monto_pago}
                onChange={handleChange}
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Cuota
              </label>
              <input
                type="number"
                name="numero_cuota_pago"
                value={formData.numero_cuota_pago}
                onChange={handleChange}
                min="1"
                placeholder="1, 2, 3... (opcional)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Déjelo vacío si es pago único</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Pago <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="fecha_pago"
                value={formData.fecha_pago}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado <span className="text-red-500">*</span>
              </label>
              <select
                name="estado_pago"
                value={formData.estado_pago}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Pendiente">Pendiente</option>
                <option value="Pagado">Pagado</option>
                <option value="Atrasado">Atrasado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => navigate('/pagos')}
            className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </span>
            ) : (isEditing ? 'Actualizar Pago' : 'Registrar Pago')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PagoForm;
