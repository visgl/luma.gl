import {defineConfig} from 'vite';

const alias = {
  '@luma.gl/arrow': `${__dirname}/../../../modules/arrow/src`,
  '@math.gl/geoarrow': `${__dirname}/../../../modules/geoarrow/src`,
  '@luma.gl/core': `${__dirname}/../../../modules/core/src`,
  '@luma.gl/engine': `${__dirname}/../../../modules/engine/src`,
  '@luma.gl/shadertools': `${__dirname}/../../../modules/shadertools/src`,
  '@luma.gl/tables': `${__dirname}/../../../modules/tables/src`,
  '@luma.gl/webgl': `${__dirname}/../../../modules/webgl/src`,
  '@luma.gl/webgpu': `${__dirname}/../../../modules/webgpu/src`
};

export default defineConfig({
  resolve: {alias},
  server: {open: true}
});
