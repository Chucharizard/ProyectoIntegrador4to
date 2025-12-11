// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  // Configura la URL base de tu sitio para SEO y canonical URLs
  // En desarrollo usará localhost, en producción cambia esto a tu dominio real
  site: import.meta.env.PROD 
    ? 'https://tu-proyecto.vercel.app' 
    : 'http://localhost:4321',
  
  // Modo SSR para generar páginas dinámicamente
  output: 'server',
  adapter: vercel()
});