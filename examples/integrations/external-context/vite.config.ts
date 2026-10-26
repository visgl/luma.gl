import {defineConfig} from 'vite';

const alias = {
  '@luma.gl/core': `${__dirname}/../../../modules/core/src`,
  '@luma.gl/engine': `${__dirname}/../../../modules/engine/src`,
  '@luma.gl/shadertools': `${__dirname}/../../../modules/shadertools/src`,
  '@luma.gl/core/webgl-constants': `${__dirname}/../../../modules/core/src/webgl-constants`,
  '@luma.gl/core/webgl': `${__dirname}/../../../modules/core/src/webgl`
};

export default defineConfig({
  resolve: {alias},
  server: {open: true}
});
