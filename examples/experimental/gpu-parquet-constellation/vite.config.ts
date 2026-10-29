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
  {find: '@luma.gl/shaders', replacement: `${__dirname}/../../../modules/shaders/src`},
  {find: '@luma.gl/core/webgpu', replacement: `${__dirname}/../../../modules/core/src/webgpu`}
];

export default defineConfig({resolve: {alias}, server: {open: true}});
