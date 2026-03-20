// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ShaderModule, generateShaderForModule, ShaderGenerationOptions} from '@luma.gl/shadertools';
import type {TapeTestFunction} from 'test/utils/vitest-tape';

const module: ShaderModule = {
  name: 'test',
  uniformTypes: {
    uProjectMatrix: 'mat4x4<f32>',
    uViewMatrix: 'mat4x4<f32>',
    uClipped: 'f32'
  }
};

const TEST_CASES: {module: ShaderModule; options: ShaderGenerationOptions; result: string}[] = [
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
  {
    module,
    options: {shaderLanguage: 'wgsl'},
    result: `\
struct Test {
  uProjectMatrix : mat4x4<f32>;
  uViewMatrix : mat4x4<f32>;
  uClipped : f32;
};
var<uniform> test : Test;`
  }
];

export function registerGenerateShaderTests(test: TapeTestFunction): void {
  test('shadertools#generateGLSLForModule', t => {
    for (const testCase of TEST_CASES) {
      const generatedShader = generateShaderForModule(testCase.module, testCase.options);
      t.equal(generatedShader, testCase.result, JSON.stringify(testCase.options));
    }

    t.throws(
      () =>
        generateShaderForModule(
          {
            name: 'broken',
            uniformTypes: {
              light: [{color: 'vec3<f32>'}, 1]
            }
          } as ShaderModule,
          {shaderLanguage: 'wgsl'}
        ),
      /Composite uniform types/,
      'WGSL generation rejects composite uniform types'
    );

    t.end();
  });
}
