import {defineConfig} from 'vite';

const alias = {
  '@luma.gl/arrow': `${__dirname}/../../../modules/arrow/src`,
  '@luma.gl/core': `${__dirname}/../../../modules/core/src`,
  '@luma.gl/engine': `${__dirname}/../../../modules/engine/src`,
  '@luma.gl/shadertools': `${__dirname}/../../../modules/shadertools/src`,
  '@luma.gl/gpgpu': `${__dirname}/../../../modules/gpgpu/src`,
  '@luma.gl/graph': `${__dirname}/../../../modules/graph/src`,
  '@luma.gl/core/webgl': `${__dirname}/../../../modules/core/src/webgl`,
  '@luma.gl/core/webgpu': `${__dirname}/../../../modules/core/src/webgpu`
};

export default defineConfig({
  resolve: {alias},
  server: {open: true}
});
