# Imágenes de Placeholder

Este directorio contiene las imágenes de las propiedades. En producción, estas imágenes serían almacenadas en un CDN o servicio de almacenamiento en la nube.

## Estructura recomendada:

```
images/
├── casa-1.jpg
├── casa-1-2.jpg
├── casa-1-3.jpg
├── apto-1.jpg
├── apto-1-2.jpg
├── apto-2.jpg
├── apto-2-2.jpg
├── terreno-1.jpg
├── terreno-1-2.jpg
├── local-1.jpg
├── casa-playa-1.jpg
├── casa-playa-1-2.jpg
├── casa-playa-1-3.jpg
├── casa-playa-1-4.jpg
├── oficina-1.jpg
├── oficina-1-2.jpg
├── oficina-1-3.jpg
├── casa-campo-1.jpg
└── casa-campo-1-2.jpg
```

## Servicios recomendados para producción:

- **Cloudinary** - Optimización y transformación automática
- **AWS S3 + CloudFront** - Almacenamiento y CDN
- **Vercel Image Optimization** - Si deploys en Vercel
- **ImageKit** - CDN especializado en imágenes

## Optimizaciones para aplicar:

1. **Formatos modernos**: WebP, AVIF
2. **Responsive images**: Múltiples tamaños
3. **Lazy loading**: Carga diferida
4. **Compresión**: Reducir peso sin perder calidad
5. **Blur placeholder**: Efecto de carga progresiva

## Dimensiones recomendadas:

- **Portada de tarjeta**: 800x600px (4:3)
- **Galería principal**: 1920x1080px (16:9)
- **Thumbnails**: 300x225px (4:3)
- **OG Image**: 1200x630px (para redes sociales)
