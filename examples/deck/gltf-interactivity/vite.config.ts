import {defineConfig} from 'vite';

export default defineConfig(({mode}) => ({
  base:
    mode === 'website'
      ? `${(process.env['WEBSITE_BASE_URL'] || '/').replace(/\/?$/, '/')}standalone-examples/gltf-interactivity/`
      : './',
  optimizeDeps: {
    exclude: ['@deck.gl/core'],
    include: ['@deck.gl/layers > earcut'],
    noDiscovery: true
  }
}));
