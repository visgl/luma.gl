import {defineConfig} from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@luma.gl/anari': `${__dirname}/../../../modules/anari/src`,
      '@luma.gl/graph/_internal': `${__dirname}/../../../modules/graph/src/execution`,
      '@luma.gl/core': `${__dirname}/../../../modules/core/src`,
      '@luma.gl/engine': `${__dirname}/../../../modules/engine/src`,
      '@luma.gl/shaders': `${__dirname}/../../../modules/shaders/src`
    }
  }
});
