import {defineConfig} from 'vite';

export default defineConfig(({mode}) => ({
  base:
    mode === 'website'
      ? `${(process.env['WEBSITE_BASE_URL'] || '/').replace(/\/?$/, '/')}standalone-examples/gltf-interactivity/`
      : './',
  resolve: {
    alias: {
      '@luma.gl/engine/gltf': `${__dirname}/../../../modules/engine/src/gltf`,
      '@luma.gl/core': `${__dirname}/../../../modules/core/src`,
      '@luma.gl/engine/models': `${__dirname}/../../../modules/engine/src/graph/models`,
      '@luma.gl/engine/physics': `${__dirname}/../../../modules/engine/src/graph/physics`,
      '@luma.gl/engine/tables': `${__dirname}/../../../modules/engine/src/graph/tables`,
      '@luma.gl/engine/gltf-physics': `${__dirname}/../../../modules/engine/src/gltf/physics`,
      '@luma.gl/engine/text-fonts': `${__dirname}/../../../modules/engine/src/text/fonts`,
      '@luma.gl/engine/text-3d': `${__dirname}/../../../modules/engine/src/text/text-3d`,
      '@luma.gl/engine/text-experimental': `${__dirname}/../../../modules/engine/src/text/experimental.ts`,
      '@luma.gl/engine/text': `${__dirname}/../../../modules/engine/src/text`,
      '@luma.gl/engine/effects': `${__dirname}/../../../modules/engine/src/effects`,
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
