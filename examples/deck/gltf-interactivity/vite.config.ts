import {defineConfig} from 'vite';

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@luma.gl/gltf': `${__dirname}/../../../modules/gltf/src`,
      '@luma.gl/core': `${__dirname}/../../../modules/core/src`,
      '@luma.gl/engine': `${__dirname}/../../../modules/engine/src`,
      '@luma.gl/shadertools': `${__dirname}/../../../modules/shadertools/src`,
      '@luma.gl/webgl': `${__dirname}/../../../modules/webgl/src`,
      '@luma.gl/webgpu': `${__dirname}/../../../modules/webgpu/src`
    }
  },
  optimizeDeps: {exclude: ['@deck.gl/core'], noDiscovery: true}
});
