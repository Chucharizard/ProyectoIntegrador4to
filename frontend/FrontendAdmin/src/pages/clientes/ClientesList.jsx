import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clienteService } from '../../services/clienteService';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  PhoneIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

const ClientesList = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await clienteService.getAll(controller.signal);
        
        if (isMounted) {
          setClientes(data);
        }
      } catch (error) {
        if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError') {
          console.log('Petición cancelada');
          return;
        }

        if (isMounted) {
          console.error('Error al cargar clientes:', error);
          toast.error('Error al cargar la lista de clientes');
          setClientes([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const filteredClientes = clientes.filter((cliente) => {
    if (!searchTerm.trim()) return true;
    
    const term = searchTerm.toLowerCase();
    return (
      cliente.nombres_completo_cliente?.toLowerCase().includes(term) ||
      cliente.apellidos_completo_cliente?.toLowerCase().includes(term) ||
      cliente.ci_cliente?.toLowerCase().includes(term) ||
      cliente.telefono_cliente?.toLowerCase().includes(term)
    );
  });

  const handleDelete = async (ci, nombre) => {
    if (window.confirm(`¿Estás seguro de eliminar al cliente ${nombre}?`)) {
      try {
        await clienteService.delete(ci);
        toast.success('Cliente eliminado correctamente');
        
        const data = await clienteService.getAll();
        setClientes(data);
      } catch (error) {
        console.error('Error al eliminar cliente:', error);
        toast.error('Error al eliminar el cliente');
      }
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '-';
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-BO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const stats = {
    total: clientes.length,
    filtered: filteredClientes.length,
    conPresupuesto: clientes.filter((c) => c.presupuesto_max_cliente).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600 mt-1">
            Gestiona la información de tus clientes
          </p>
        </div>
        <button
          onClick={() => navigate('/clientes/nuevo')}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Búsqueda */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, CI o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Tabla de Clientes */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredClientes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre Completo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Presupuesto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zona Preferida
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Registro
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClientes.map((cliente) => (
                  <tr
                    key={cliente.ci_cliente}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {cliente.ci_cliente}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {cliente.nombres_completo_cliente} {cliente.apellidos_completo_cliente}
                      </div>
                      {cliente.origen_cliente && (
                        <div className="text-xs text-gray-500">
                          Origen: {cliente.origen_cliente}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {cliente.telefono_cliente && (
                          <div className="flex items-center text-sm text-gray-600">
                            <PhoneIcon className="h-4 w-4 mr-1 text-gray-400" />
                            {cliente.telefono_cliente}
                          </div>
                        )}
                        {cliente.correo_electronico_cliente && (
                          <div className="flex items-center text-sm text-gray-600">
                            <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-400" />
                            {cliente.correo_electronico_cliente}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(cliente.presupuesto_max_cliente)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {cliente.preferencia_zona_cliente || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(cliente.fecha_registro_cliente)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => navigate(`/clientes/editar/${cliente.ci_cliente}`)}
                          className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors duration-150"
                          title="Editar"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(
                              cliente.ci_cliente,
                              `${cliente.nombres_completo_cliente} ${cliente.apellidos_completo_cliente}`
                            )
                          }
                          className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors duration-150"
                          title="Eliminar"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">Total Clientes</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {stats.total}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">Resultados de Búsqueda</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {stats.filtered}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">Con Presupuesto Definido</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {stats.conPresupuesto}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientesList;
