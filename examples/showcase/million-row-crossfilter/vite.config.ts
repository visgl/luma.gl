import {defineConfig} from 'vite';

const alias = {
  '@luma.gl/core': `${__dirname}/../../../modules/core/src`,
  '@luma.gl/engine': `${__dirname}/../../../modules/engine/src`,
  '@luma.gl/experimental': `${__dirname}/../../../modules/experimental/src`,
  '@luma.gl/shadertools': `${__dirname}/../../../modules/shadertools/src`,
  '@luma.gl/tables': `${__dirname}/../../../modules/tables/src`,
  '@luma.gl/webgpu': `${__dirname}/../../../modules/webgpu/src`
};

export default defineConfig({resolve: {alias}, server: {open: true}});
