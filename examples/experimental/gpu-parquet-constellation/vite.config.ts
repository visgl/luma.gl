import path from 'node:path';
import {defineConfig} from 'vite';

const alias = [
  {
    find: /^apache-arrow\/type$/,
    replacement: path.resolve(__dirname, 'apache-arrow-type-compat.js')
  },
  {find: '@luma.gl/core', replacement: `${__dirname}/../../../modules/core/src`}
];

export default defineConfig({resolve: {alias}, server: {open: true}});
