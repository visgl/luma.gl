import {defineConfig} from 'vite';

// Keep the experimental example runnable as a small standalone WebGPU application.

const alias = {
  '@luma.gl/core': `${__dirname}/../../../modules/core/src`,
  '@luma.gl/engine': `${__dirname}/../../../modules/engine/src`,
  '@luma.gl/experimental': `${__dirname}/../../../modules/experimental/src`,
  '@luma.gl/shadertools': `${__dirname}/../../../modules/shadertools/src`,
  '@luma.gl/webgpu': `${__dirname}/../../../modules/webgpu/src`
};

export default defineConfig({resolve: {alias}, server: {open: true}});
