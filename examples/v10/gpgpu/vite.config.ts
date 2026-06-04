import {defineConfig} from 'vite';

const alias = {
  '@luma.gl/arrow': `${__dirname}/../../../modules/arrow/src`,
  '@luma.gl/core': `${__dirname}/../../../modules/core/src`,
  '@luma.gl/engine': `${__dirname}/../../../modules/engine/src`,
  '@luma.gl/experimental': `${__dirname}/../../../modules/experimental/src`,
  '@luma.gl/gltf': `${__dirname}/../../../modules/gltf/src`,
  '@luma.gl/gpgpu': `${__dirname}/../../../modules/gpgpu/src`,
  '@luma.gl/shadertools': `${__dirname}/../../../modules/shadertools/src`,
  '@luma.gl/tables': `${__dirname}/../../../modules/tables/src`,
  '@luma.gl/webgl/constants': `${__dirname}/../../../modules/webgl/src/constants`,
  '@luma.gl/webgl': `${__dirname}/../../../modules/webgl/src`,
  '@luma.gl/webgpu': `${__dirname}/../../../modules/webgpu/src`,
  '@math.gl/geoarrow': `${__dirname}/../../../modules/geoarrow/src`
};

export default defineConfig({
  resolve: {alias},
  server: {open: true}
});
