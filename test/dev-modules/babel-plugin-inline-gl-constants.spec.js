import babel from '@babel/core';
import plugin from 'dev-modules/babel-plugin-inline-webgl-constants';
import test from 'tape-promise/tape';

const ES6_ENV = {
  targets: {chrome: '60'},
  modules: false
};

const TEST_CASES = [
  {
    title: 'simple',
    input: 'const x = gl.FLOAT;',
    output: 'const x = 5126;'
  },
  {
    title: 'undefined constant',
    input: 'const x = gl.FLOAT32;',
    error: true
  },
  {
    title: 'complex',
    input: `
      const TEXTURE_FORMATS = {
        [GL.RGBA]: {dataFormat: GL.RGBA, types: [GL.UNSIGNED_BYTE, GL.UNSIGNED_SHORT_4_4_4_4, GL.UNSIGNED_SHORT_5_5_5_1]},
      };
      gl.texImage2D(0, 0, GL.RGBA, TEXTURE_FORMATS[GL.RGBA].dataFormat, TEXTURE_FORMATS[GL.RGBA].type, data);
    `,
    output: `
      const TEXTURE_FORMATS = {
        [6408]: {
          dataFormat: 6408,
          types: [5121, 32819, 32820]
        }
      };
      gl.texImage2D(0, 0, 6408, TEXTURE_FORMATS[6408].dataFormat, TEXTURE_FORMATS[6408].type, data);
    `
  },
  {
    title: 'remove import',
    input: `
      import GL from '@luma.gl/constants';
      const x = GL.FLOAT;
    `,
    output: 'const x = 5126;'
  }
];

// Remove whitespace before comparing
function clean(code) {
  return code.replace('"use strict";', '').replace(/\n\s+/g, '\n').trim();
}

// TODO - restore
/* eslint-disable */
test.skip('InlineGLSLConstants Babel Plugin', (t) => {
  TEST_CASES.forEach((testCase) => {
    const transform = () =>
      babel.transform(testCase.input, {
        presets: [['@babel/env', ES6_ENV]],
        plugins: [[plugin, {debug: true}]],
        filename: 'test.js',
        configFile: false
      });
    if (testCase.error) {
      t.throws(transform, testCase.title);
    } else {
      const {code} = transform();
      t.is(clean(code), clean(testCase.output), testCase.title);
    }
  });

  t.end();
});
