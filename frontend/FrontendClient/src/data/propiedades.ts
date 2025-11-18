// Tipos de datos para propiedades
export interface Propiedad {
  id: string;
  slug: string;
  estado: 'activa' | 'reservada' | 'vendida' | 'borrador';
  titulo: string;
  descripcion: string;
  descripcionBreve: string;
  tipoOperacion: 'venta' | 'alquiler';
  tipoPropiedad: 'casa' | 'apartamento' | 'terreno' | 'local' | 'oficina';
  zona: string;
  ciudad: string;
  direccionResumida: string;
  coordenadas?: {
    lat: number;
    lng: number;
  };
  precio: number;
  superficieTotal: number;
  superficieConstruida: number;
  dormitorios: number;
  banos: number;
  amenities: string[];
  imagenPortada: string;
  galeria: string[];
  destacada: boolean;
  fechaPublicacion: string;
}

// Datos ficticios de propiedades
export const propiedades: Propiedad[] = [
  {
    id: '1',
    slug: 'casa-moderna-zona-norte',
    estado: 'activa',
    titulo: 'Casa Moderna en Zona Norte',
    descripcion: 'Hermosa casa moderna con amplios espacios, jardín y excelente ubicación en la zona norte de la ciudad. Cuenta con acabados de primera calidad, cocina equipada, y espacios bien distribuidos. Ideal para familias que buscan comodidad y tranquilidad.',
    descripcionBreve: 'Casa moderna con jardín en excelente ubicación',
    tipoOperacion: 'venta',
    tipoPropiedad: 'casa',
    zona: 'Zona Norte',
    ciudad: 'Ciudad Principal',
    direccionResumida: 'Av. Los Pinos 123, Zona Norte',
    coordenadas: {
      lat: -12.0464,
      lng: -77.0428
    },
    precio: 250000,
    superficieTotal: 200,
    superficieConstruida: 150,
    dormitorios: 3,
    banos: 2,
    amenities: ['Jardín', 'Garaje', 'Cocina equipada', 'Terraza'],
    imagenPortada: '/images/casa-1.jpg',
    galeria: ['/images/casa-1.jpg', '/images/casa-1-2.jpg', '/images/casa-1-3.jpg'],
    destacada: true,
    fechaPublicacion: '2025-10-01'
  },
  {
    id: '2',
    slug: 'apartamento-centro-historico',
    estado: 'activa',
    titulo: 'Apartamento en Centro Histórico',
    descripcion: 'Acogedor apartamento en pleno centro histórico, cerca de todos los servicios y transporte público. Totalmente renovado con estilo contemporáneo conservando detalles originales. Perfecto para profesionales o parejas.',
    descripcionBreve: 'Apartamento renovado en el corazón de la ciudad',
    tipoOperacion: 'alquiler',
    tipoPropiedad: 'apartamento',
    zona: 'Centro',
    ciudad: 'Ciudad Principal',
    direccionResumida: 'Calle Mayor 45, Centro',
    coordenadas: {
      lat: -12.0565,
      lng: -77.0365
    },
    precio: 800,
    superficieTotal: 75,
    superficieConstruida: 75,
    dormitorios: 2,
    banos: 1,
    amenities: ['Balcón', 'Amueblado', 'Calefacción'],
    imagenPortada: '/images/apto-1.jpg',
    galeria: ['/images/apto-1.jpg', '/images/apto-1-2.jpg'],
    destacada: true,
    fechaPublicacion: '2025-10-05'
  },
  {
    id: '3',
    slug: 'terreno-zona-sur',
    estado: 'activa',
    titulo: 'Terreno Residencial Zona Sur',
    descripcion: 'Excelente terreno en zona residencial en crecimiento. Ideal para construcción de vivienda unifamiliar. Servicios básicos disponibles en la zona. Perfecto para inversión o construcción de la casa de tus sueños.',
    descripcionBreve: 'Terreno listo para construir en zona residencial',
    tipoOperacion: 'venta',
    tipoPropiedad: 'terreno',
    zona: 'Zona Sur',
    ciudad: 'Ciudad Principal',
    direccionResumida: 'Urbanización Los Álamos, Zona Sur',
    coordenadas: {
      lat: -12.0764,
      lng: -77.0528
    },
    precio: 80000,
    superficieTotal: 250,
    superficieConstruida: 0,
    dormitorios: 0,
    banos: 0,
    amenities: ['Agua', 'Luz', 'Alcantarillado', 'Áreas verdes cercanas'],
    imagenPortada: '/images/terreno-1.jpg',
    galeria: ['/images/terreno-1.jpg', '/images/terreno-1-2.jpg'],
    destacada: false,
    fechaPublicacion: '2025-10-08'
  },
  {
    id: '4',
    slug: 'local-comercial-centro',
    estado: 'reservada',
    titulo: 'Local Comercial en Centro',
    descripcion: 'Local comercial en excelente ubicación con gran flujo peatonal. Cuenta con vitrina amplia, baño y área de almacenamiento. Ideal para tienda, oficina o negocio de servicios.',
    descripcionBreve: 'Local con excelente ubicación comercial',
    tipoOperacion: 'alquiler',
    tipoPropiedad: 'local',
    zona: 'Centro',
    ciudad: 'Ciudad Principal',
    direccionResumida: 'Av. Comercio 789, Centro',
    coordenadas: {
      lat: -12.0532,
      lng: -77.0399
    },
    precio: 1200,
    superficieTotal: 60,
    superficieConstruida: 60,
    dormitorios: 0,
    banos: 1,
    amenities: ['Vitrina amplia', 'Almacén', 'Seguridad'],
    imagenPortada: '/images/local-1.jpg',
    galeria: ['/images/local-1.jpg'],
    destacada: false,
    fechaPublicacion: '2025-09-28'
  },
  {
    id: '5',
    slug: 'casa-playa-vista-mar',
    estado: 'activa',
    titulo: 'Casa de Playa con Vista al Mar',
    descripcion: 'Espectacular casa de playa con vista directa al mar. Amplios espacios, terrazas, piscina y acceso privado a la playa. Ideal para vacaciones familiares o inversión en alquiler turístico.',
    descripcionBreve: 'Casa de playa con acceso directo al mar',
    tipoOperacion: 'venta',
    tipoPropiedad: 'casa',
    zona: 'Zona Costera',
    ciudad: 'Ciudad Costera',
    direccionResumida: 'Playa Paraíso km 45',
    coordenadas: {
      lat: -12.1234,
      lng: -77.0128
    },
    precio: 450000,
    superficieTotal: 350,
    superficieConstruida: 220,
    dormitorios: 4,
    banos: 3,
    amenities: ['Piscina', 'Vista al mar', 'Acceso a playa', 'Jardín', 'BBQ'],
    imagenPortada: '/images/casa-playa-1.jpg',
    galeria: ['/images/casa-playa-1.jpg', '/images/casa-playa-1-2.jpg', '/images/casa-playa-1-3.jpg', '/images/casa-playa-1-4.jpg'],
    destacada: true,
    fechaPublicacion: '2025-10-10'
  },
  {
    id: '6',
    slug: 'apartamento-moderno-zona-este',
    estado: 'vendida',
    titulo: 'Apartamento Moderno Zona Este',
    descripcion: 'Apartamento moderno en edificio nuevo con todas las comodidades. Excelente iluminación natural, acabados de lujo y áreas comunes completas.',
    descripcionBreve: 'Apartamento de estreno con todas las comodidades',
    tipoOperacion: 'venta',
    tipoPropiedad: 'apartamento',
    zona: 'Zona Este',
    ciudad: 'Ciudad Principal',
    direccionResumida: 'Calle Nueva 234, Zona Este',
    coordenadas: {
      lat: -12.0464,
      lng: -77.0128
    },
    precio: 180000,
    superficieTotal: 95,
    superficieConstruida: 95,
    dormitorios: 2,
    banos: 2,
    amenities: ['Gimnasio', 'Piscina', 'Seguridad 24h', 'Estacionamiento'],
    imagenPortada: '/images/apto-2.jpg',
    galeria: ['/images/apto-2.jpg', '/images/apto-2-2.jpg'],
    destacada: false,
    fechaPublicacion: '2025-09-15'
  },
  {
    id: '7',
    slug: 'oficina-moderna-zona-financiera',
    estado: 'activa',
    titulo: 'Oficina Moderna Zona Financiera',
    descripcion: 'Oficina en edificio corporativo de última generación. Espacios abiertos, sala de reuniones, kitchenette y excelente conectividad. Zona con todos los servicios bancarios y comerciales.',
    descripcionBreve: 'Oficina equipada en zona empresarial premium',
    tipoOperacion: 'alquiler',
    tipoPropiedad: 'oficina',
    zona: 'Zona Financiera',
    ciudad: 'Ciudad Principal',
    direccionResumida: 'Torre Empresarial, piso 12',
    coordenadas: {
      lat: -12.0889,
      lng: -77.0456
    },
    precio: 2500,
    superficieTotal: 120,
    superficieConstruida: 120,
    dormitorios: 0,
    banos: 2,
    amenities: ['Aire acondicionado', 'Internet de alta velocidad', 'Estacionamiento', 'Seguridad 24h', 'Sala de reuniones'],
    imagenPortada: '/images/oficina-1.jpg',
    galeria: ['/images/oficina-1.jpg', '/images/oficina-1-2.jpg', '/images/oficina-1-3.jpg'],
    destacada: false,
    fechaPublicacion: '2025-10-12'
  },
  {
    id: '8',
    slug: 'casa-campo-amplio-terreno',
    estado: 'activa',
    titulo: 'Casa de Campo con Amplio Terreno',
    descripcion: 'Hermosa casa de campo rodeada de naturaleza. Cuenta con amplio terreno para cultivo o recreación, casa principal de dos pisos y casa de huéspedes. Ideal para retiro o proyecto agrícola.',
    descripcionBreve: 'Casa de campo con gran potencial',
    tipoOperacion: 'venta',
    tipoPropiedad: 'casa',
    zona: 'Zona Rural',
    ciudad: 'Afueras',
    direccionResumida: 'Km 25 Carretera Sur',
    precio: 320000,
    superficieTotal: 5000,
    superficieConstruida: 280,
    dormitorios: 5,
    banos: 3,
    amenities: ['Pozo de agua', 'Huerto', 'Establos', 'Casa de huéspedes', 'BBQ'],
    imagenPortada: '/images/casa-campo-1.jpg',
    galeria: ['/images/casa-campo-1.jpg', '/images/casa-campo-1-2.jpg'],
    destacada: false,
    fechaPublicacion: '2025-10-07'
  }
];

// Funciones helper
export function obtenerPropiedadPorSlug(slug: string): Propiedad | undefined {
  return propiedades.find(p => p.slug === slug);
}

export function obtenerPropiedadPorId(id: string): Propiedad | undefined {
  return propiedades.find(p => p.id === id);
}

export function obtenerPropiedadesDestacadas(): Propiedad[] {
  return propiedades.filter(p => p.destacada && p.estado === 'activa');
}

export function filtrarPropiedades(filtros: {
  zona?: string;
  tipoOperacion?: string;
  tipoPropiedad?: string;
  precioMin?: number;
  precioMax?: number;
  estado?: string;
}): Propiedad[] {
  return propiedades.filter(p => {
    if (filtros.zona && p.zona !== filtros.zona) return false;
    if (filtros.tipoOperacion && p.tipoOperacion !== filtros.tipoOperacion) return false;
    if (filtros.tipoPropiedad && p.tipoPropiedad !== filtros.tipoPropiedad) return false;
    if (filtros.precioMin && p.precio < filtros.precioMin) return false;
    if (filtros.precioMax && p.precio > filtros.precioMax) return false;
    if (filtros.estado && p.estado !== filtros.estado) return false;
    return true;
  });
}

export const zonas = [
  'Zona Norte',
  'Centro',
  'Zona Sur',
  'Zona Este',
  'Zona Oeste',
  'Zona Costera',
  'Zona Financiera',
  'Zona Rural'
];

export const tiposPropiedad = [
  { value: 'casa', label: 'Casa' },
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'local', label: 'Local Comercial' },
  { value: 'oficina', label: 'Oficina' }
];

export const tiposOperacion = [
  { value: 'venta', label: 'Venta' },
  { value: 'alquiler', label: 'Alquiler' }
];
