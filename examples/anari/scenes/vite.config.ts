import {defineConfig} from 'vite';

const alias = {
  '@luma.gl/anari/schemas': `${__dirname}/../../../modules/anari/src/schemas.ts`,
  '@luma.gl/anari': `${__dirname}/../../../modules/anari/src`,
  '@luma.gl/core': `${__dirname}/../../../modules/core/src`,
  '@luma.gl/effects': `${__dirname}/../../../modules/effects/src`,
  '@luma.gl/engine': `${__dirname}/../../../modules/engine/src`,
  '@luma.gl/gltf': `${__dirname}/../../../modules/gltf/src`,
  '@luma.gl/shadertools': `${__dirname}/../../../modules/shadertools/src`,
  '@luma.gl/gpgpu': `${__dirname}/../../../modules/gpgpu/src`,
  '@luma.gl/graph': `${__dirname}/../../../modules/graph/src`,
  '@luma.gl/core/webgl-constants': `${__dirname}/../../../modules/core/src/webgl-constants`,
  '@luma.gl/core/webgl': `${__dirname}/../../../modules/core/src/webgl`,
  '@luma.gl/core/webgpu': `${__dirname}/../../../modules/core/src/webgpu`
};

export default defineConfig({
  base: './',
  resolve: {alias},
  server: {open: true},
  build: {
    rollupOptions: {
      input: {
        showcase: `${__dirname}/index.html`,
        playground: `${__dirname}/playground.html`
      }
    }
  }
});
