import {defineConfig} from 'vite';

const alias = {
  '@deck.gl-community/gpu-layers': `${__dirname}/../../../modules/deck-gpu-layers/src`,
  '@luma.gl/core': `${__dirname}/../../../modules/core/src`,
  '@luma.gl/engine': `${__dirname}/../../../modules/engine/src`,
  '@luma.gl/experimental': `${__dirname}/../../../modules/experimental/src`,
  '@luma.gl/shadertools': `${__dirname}/../../../modules/shadertools/src`,
  '@luma.gl/gpgpu': `${__dirname}/../../../modules/gpgpu/src`,
  '@luma.gl/webgpu': `${__dirname}/../../../modules/webgpu/src`
};

export default defineConfig({
  resolve: {
    alias,
    dedupe: [
      '@deck.gl-community/gpu-layers',
      '@luma.gl/core',
      '@luma.gl/engine',
      '@luma.gl/experimental',
      '@luma.gl/shadertools',
      '@luma.gl/gpgpu',
      '@luma.gl/webgpu'
    ]
  },
  optimizeDeps: {exclude: Object.keys(alias)},
  server: {open: true}
});
