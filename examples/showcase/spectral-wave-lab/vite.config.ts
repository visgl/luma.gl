import {defineConfig} from 'vite';
const alias = {
  '@luma.gl/core': `${__dirname}/../../../modules/core/src`,
  '@luma.gl/engine': `${__dirname}/../../../modules/engine/src`,
  '@luma.gl/gpgpu': `${__dirname}/../../../modules/gpgpu/src`,
  '@luma.gl/gpu-graph': `${__dirname}/../../../modules/gpu-graph/src`,
  '@luma.gl/core/webgpu': `${__dirname}/../../../modules/core/src/webgpu`
};
export default defineConfig({resolve: {alias}, server: {open: true}});
