import {defineConfig} from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@deck.gl-community/arrow-layers': __dirname + '/../../../modules/arrow-layers/src',
      '@luma.gl/arrow': __dirname + '/../../../modules/arrow/src',
      '@math.gl/geoarrow': __dirname + '/../../../modules/geoarrow/src',
      '@luma.gl/core': __dirname + '/../../../modules/core/src',
      '@luma.gl/engine': __dirname + '/../../../modules/engine/src',
      '@luma.gl/shadertools': __dirname + '/../../../modules/shadertools/src',
      '@luma.gl/tables': __dirname + '/../../../modules/tables/src'
    }
  },
  server: {open: true}
});
