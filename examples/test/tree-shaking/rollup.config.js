import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import nodeBuiltins from 'rollup-plugin-node-builtins';
import json from 'rollup-plugin-json';
import alias from 'rollup-plugin-alias';

export default {
  entry: 'app.js',
  format: 'cjs',
  plugins: [
    alias({
      'luma.gl': '../../../dist-es6/index.js'
    }),
    nodeBuiltins(),
    commonjs(),
    resolve(),
    json()
  ],
  dest: 'bundle-rollup.js' // equivalent to --output
};
