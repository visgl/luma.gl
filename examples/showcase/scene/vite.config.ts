import {defineConfig} from 'vite';

const alias = {
  '@luma.gl/scene/schemas': `${__dirname}/../../../modules/scene/src/schemas.ts`,
  '@luma.gl/scene': `${__dirname}/../../../modules/scene/src`,
  '@luma.gl/core': `${__dirname}/../../../modules/core/src`,
  '@luma.gl/effects': `${__dirname}/../../../modules/effects/src`,
  '@luma.gl/engine': `${__dirname}/../../../modules/engine/src`,
  '@luma.gl/experimental': `${__dirname}/../../../modules/experimental/src`,
  '@luma.gl/gltf': `${__dirname}/../../../modules/gltf/src`,
  '@luma.gl/shadertools': `${__dirname}/../../../modules/shadertools/src`,
  '@luma.gl/gpgpu': `${__dirname}/../../../modules/gpgpu/src`,
  '@luma.gl/webgl/constants': `${__dirname}/../../../modules/webgl/src/constants`,
  '@luma.gl/webgl': `${__dirname}/../../../modules/webgl/src`,
  '@luma.gl/webgpu': `${__dirname}/../../../modules/webgpu/src`
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
