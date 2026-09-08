import path from 'node:path';
import {defineConfig} from 'vite';

const alias = [
  {
    find: /^apache-arrow\/type$/,
    replacement: path.resolve(__dirname, 'apache-arrow-type-compat.js')
  },
  {find: '@luma.gl/core', replacement: `${__dirname}/../../../modules/core/src`},
  {find: '@luma.gl/engine', replacement: `${__dirname}/../../../modules/engine/src`},
  {find: '@luma.gl/gpgpu', replacement: `${__dirname}/../../../modules/gpgpu/src`},
  {find: '@luma.gl/shadertools', replacement: `${__dirname}/../../../modules/shadertools/src`},
  {find: '@luma.gl/webgpu', replacement: `${__dirname}/../../../modules/webgpu/src`}
];

export default defineConfig({resolve: {alias}, server: {open: true}});
