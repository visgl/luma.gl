import {defineConfig} from 'vite';

export default defineConfig(({mode}) => ({
  base:
    mode === 'website'
      ? `${(process.env['WEBSITE_BASE_URL'] || '/').replace(/\/?$/, '/')}standalone-examples/gltf-interactivity/`
      : './',
  resolve: {
    alias: {
      '@luma.gl/gltf': `${__dirname}/../../../modules/gltf/src`,
      '@luma.gl/core': `${__dirname}/../../../modules/core/src`,
      '@luma.gl/engine': `${__dirname}/../../../modules/engine/src`,
      '@luma.gl/shadertools': `${__dirname}/../../../modules/shadertools/src`,
      '@luma.gl/core/webgl': `${__dirname}/../../../modules/core/src/webgl`,
      '@luma.gl/core/webgpu': `${__dirname}/../../../modules/core/src/webgpu`
    }
  },
  optimizeDeps: {
    exclude: ['@deck.gl/core'],
    include: ['@deck.gl/layers > earcut'],
    noDiscovery: true
  }
}));
