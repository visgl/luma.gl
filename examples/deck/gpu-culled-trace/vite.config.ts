import {defineConfig} from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@deck.gl-community/arrow-layers': __dirname + '/../../../modules/deck-arrow-layers/src',
      '@luma.gl/arrow': __dirname + '/../../../modules/arrow/src',
      '@math.gl/geoarrow': __dirname + '/../../../modules/math-geoarrow/src',
      '@luma.gl/core': __dirname + '/../../../modules/core/src',
      '@luma.gl/engine': __dirname + '/../../../modules/engine/src',
      '@luma.gl/experimental': __dirname + '/../../../modules/experimental/src',
      '@luma.gl/shadertools': __dirname + '/../../../modules/shadertools/src',
      '@luma.gl/gpgpu': __dirname + '/../../../modules/gpgpu/src',
      '@luma.gl/text': __dirname + '/../../../modules/text/src'
    }
  },
  server: {open: true}
});
