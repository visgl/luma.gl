import {defineConfig} from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@deck.gl-community/arrow-layers': __dirname + '/../../../modules/deck-arrow-layers/src',
      '@luma.gl/arrow': __dirname + '/../../../modules/arrow/src',
      '@luma.gl/core': __dirname + '/../../../modules/core/src',
      '@luma.gl/engine/models': __dirname + '/../../../modules/engine/src/graph/models',
      '@luma.gl/engine/physics': __dirname + '/../../../modules/engine/src/graph/physics',
      '@luma.gl/engine/tables': __dirname + '/../../../modules/engine/src/graph/tables',
      '@luma.gl/engine': __dirname + '/../../../modules/engine/src',
      '@luma.gl/shadertools': __dirname + '/../../../modules/shadertools/src',
      '@luma.gl/gpgpu/_internal': __dirname + '/../../../modules/gpgpu/src/execution',
      '@luma.gl/gpgpu': __dirname + '/../../../modules/gpgpu/src',
      '@luma.gl/graph': __dirname + '/../../../modules/graph/src'
    }
  },
  server: {open: true}
});
