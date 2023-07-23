// luma.gl, MIT license

import test from 'tape-promise/tape';
import {ShaderModule, generateShaderForModule, ShaderGenerationOptions} from '@luma.gl/shadertools';

const module: ShaderModule = {
  name: 'test',
  uniformFormats: {
    uProjectMatrix: 'mat4x4<f32>',
    uViewMatrix: 'mat4x4<f32>',
    uClipped: 'f32',
  },
};

const TEST_CASES: {module: ShaderModule; options: ShaderGenerationOptions, result: string}[] = [
  {
    module, 
    options: {shaderLanguage: 'glsl', uniforms: 'uniforms'}, 
    result: `\
uniform mat4 test_uProjectMatrix;
uniform mat4 test_uViewMatrix;
uniform float test_uClipped;
`
  },
  {
    module, 
    options: {shaderLanguage: 'glsl', uniforms: 'unscoped-interface-blocks'}, 
    result: `\
uniform Test {
  mat4 test_uProjectMatrix;
  mat4 test_uViewMatrix;
  float test_uClipped;
};
`
  },
  {
    module, 
    options: {shaderLanguage: 'glsl', uniforms: 'scoped-interface-blocks'}, 
    result: `\
uniform Test {
  mat4 uProjectMatrix;
  mat4 uViewMatrix;
  float uClipped;
} test;
`
  },
];


test('shadertools#generateGLSLForModule', (t) => {
  for (const tc of TEST_CASES) {
    const glsl = generateShaderForModule(tc.module, tc.options);
    t.equal(glsl, tc.result, JSON.stringify(tc.options));
  }
  t.end();
});
