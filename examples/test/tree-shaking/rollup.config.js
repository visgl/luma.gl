import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import builtins from 'rollup-plugin-node-builtins';
import json from 'rollup-plugin-json';
import alias from 'rollup-plugin-alias';

import uglify from 'rollup-plugin-uglify';
import {minify} from 'uglify-js-harmony';

import sizes from 'rollup-plugin-sizes';

export default {
  entry: 'app.js',
  dest: 'dist/bundle-rollup.js', // equivalent to --output
  format: 'cjs',
  plugins: [
    alias({
      'luma.gl': '../../../dist-es6/index.js',
      buffer: '../../../dist-es6/rollup-buffer.js'
    }),
    builtins({
      buffer: false
    }),
    commonjs(),
    resolve(),
    json(),
    uglify({}, minify),
    sizes()
  ]
};
