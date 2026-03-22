import {defineConfig} from 'vite';

const alias = {
  '@luma.gl/core': `${__dirname}/../../../modules/core/src`,
  '@luma.gl/engine': `${__dirname}/../../../modules/engine/src`,
  '@luma.gl/shadertools': `${__dirname}/../../../modules/shadertools/src`,
  '@luma.gl/webgl/constants': `${__dirname}/../../../modules/webgl/src/constants`,
  '@luma.gl/webgl': `${__dirname}/../../../modules/webgl/src`
};

export default defineConfig({
  resolve: {alias},
  server: {open: true}
});
