// Configuración de la API
const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Convierte una URL relativa de imagen a URL absoluta del backend
 */
export function getImagenUrl(url: string | undefined | null): string {
  if (!url) return '/images/placeholder.jpg';
  
  // Si ya es una URL completa (http:// o https://), devolverla tal cual
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Si comienza con /, quitarlo para evitar doble barra
  const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
  
  // Construir URL completa con el backend
  return `${API_BASE_URL}/${cleanUrl}`;
}

// Tipos de datos para propiedades (basados en el backend)
export interface Propiedad {
  id: string | number; // Soporta tanto UUID como números
  slug?: string;
  titulo: string;
  descripcion: string;
  tipo_operacion: 'Venta' | 'Alquiler';
  tipo_propiedad: string;
  precio: number;
  superficie_total: number;
  superficie_construida: number;
  estado_propiedad: string;
  publicado: boolean;
  direccion?: {
    calle: string;
    barrio: string;
    ciudad: string;
    codigo_postal?: string;
    latitud?: number;
    longitud?: number;
  };
  detalle?: {
    num_dormitorios?: number;
    num_banos?: number;
    num_garajes?: number;
    piscina?: boolean;
    jardin?: boolean;
    balcon?: boolean;
    terraza?: boolean;
    aire_acondicionado?: boolean;
    calefaccion?: boolean;
    amoblado?: boolean;
    cocina_equipada?: boolean;
    lavanderia?: boolean;
    seguridad?: boolean;
    ascensor?: boolean;
  };
  imagenes?: Array<{
    id: number;
    url: string;
    es_portada: boolean;
    orden?: number;
  }>;
  fecha_creacion?: string;
}

export interface PropiedadDetalle extends Propiedad {
  propietario?: any;
  empleado?: any;
}

export interface FiltrosPropiedad {
  zona?: string;
  ciudad?: string;
  tipoOperacion?: string;
  precioMin?: number;
  precioMax?: number;
  superficieMin?: number;
  superficieMax?: number;
  buscar?: string;
}

/**
 * Obtiene todas las propiedades publicadas
 */
export async function getPropiedadesPublicadas(filtros?: FiltrosPropiedad): Promise<Propiedad[]> {
  try {
    const params = new URLSearchParams();
    
    if (filtros?.buscar) params.append('buscar', filtros.buscar);
    if (filtros?.tipoOperacion) params.append('tipo_operacion', filtros.tipoOperacion);
    if (filtros?.zona) params.append('zona', filtros.zona);
    if (filtros?.ciudad) params.append('ciudad', filtros.ciudad);
    if (filtros?.precioMin) params.append('precio_min', filtros.precioMin.toString());
    if (filtros?.precioMax) params.append('precio_max', filtros.precioMax.toString());
    if (filtros?.superficieMin) params.append('superficie_min', filtros.superficieMin.toString());
    if (filtros?.superficieMax) params.append('superficie_max', filtros.superficieMax.toString());

    const url = `${API_BASE_URL}/api/propiedades/publicadas/lista${params.toString() ? `?${params.toString()}` : ''}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error al obtener propiedades: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📦 Datos recibidos del backend:', data);
    return data;
  } catch (error) {
    console.error('Error en getPropiedadesPublicadas:', error);
    return [];
  }
}

/**
 * Obtiene una propiedad publicada por su ID (UUID o número)
 * Usa el endpoint público que no requiere autenticación
 */
export async function getPropiedadById(id: string | number): Promise<PropiedadDetalle | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/propiedades/publicadas/${id}`);
    
    if (!response.ok) {
      throw new Error(`Error al obtener propiedad: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en getPropiedadById:', error);
    return null;
  }
}

/**
 * Obtiene el detalle de una publicación por ID de propiedad
 */
export async function getDetallePublicacion(propiedadId: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/publicaciones/${propiedadId}`);
    
    if (!response.ok) {
      throw new Error(`Error al obtener detalle de publicación: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en getDetallePublicacion:', error);
    return null;
  }
}

/**
 * Obtiene las imágenes de una propiedad
 */
export async function getImagenesPropiedad(propiedadId: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/imagenes-propiedad/propiedad/${propiedadId}`);
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en getImagenesPropiedad:', error);
    return [];
  }
}

/**
 * Helper: Obtiene la URL completa de una imagen
 */
export function getImageUrl(imagePath: string): string {
  if (!imagePath) return '/images/placeholder.jpg';
  if (imagePath.startsWith('http')) return imagePath;
  return `${API_BASE_URL}${imagePath}`;
}

/**
 * Helper: Formatea el precio
 */
export function formatearPrecio(precio: number, tipoOperacion: string): string {
  const formatter = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  const precioFormateado = formatter.format(precio);
  
  if (tipoOperacion === 'Alquiler') {
    return `${precioFormateado}/mes`;
  }
  
  return precioFormateado;
}

/**
 * Helper: Genera slug de una propiedad
 */
export function generarSlug(propiedad: Propiedad): string {
  if (propiedad.slug) return propiedad.slug;
  
  // Verificar que titulo exista
  if (!propiedad.titulo) {
    return `propiedad-${propiedad.id}`;
  }
  
  const titulo = propiedad.titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/-+/g, '-') // Múltiples guiones a uno
    .trim();
  
  return `${titulo}-${propiedad.id}`;
}

/**
 * Helper: Extrae lista de amenities de una propiedad
 */
export function getAmenities(detalle: Propiedad['detalle']): string[] {
  if (!detalle) return [];
  
  const amenities: string[] = [];
  
  // Soportar ambos formatos de nombres de campo
  if (detalle.tiene_piscina || detalle.piscina) amenities.push('Piscina');
  if (detalle.tiene_jardin || detalle.jardin) amenities.push('Jardín');
  if (detalle.tiene_balcon || detalle.balcon) amenities.push('Balcón');
  if (detalle.tiene_terraza || detalle.terraza) amenities.push('Terraza');
  if (detalle.tiene_aire_acondicionado || detalle.aire_acondicionado) amenities.push('Aire Acondicionado');
  if (detalle.tiene_calefaccion || detalle.calefaccion) amenities.push('Calefacción');
  if (detalle.esta_amoblado || detalle.amoblado) amenities.push('Amoblado');
  if (detalle.tiene_cocina_equipada || detalle.cocina_equipada) amenities.push('Cocina Equipada');
  if (detalle.tiene_lavanderia || detalle.lavanderia) amenities.push('Lavandería');
  if (detalle.tiene_seguridad || detalle.seguridad) amenities.push('Seguridad 24/7');
  if (detalle.tiene_ascensor || detalle.ascensor) amenities.push('Ascensor');
  
  const garajes = detalle.capacidad_estacionamiento || detalle.num_garajes || 0;
  if (garajes > 0) {
    amenities.push(`Estacionamiento (${garajes})`);
  }
  
  return amenities;
}
