// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import type {ShaderModule} from '@luma.gl/shadertools';
import {initializeShaderModule, checkShaderModuleDeprecations} from '@luma.gl/shadertools';
import {getShaderModuleUniforms, getShaderModuleSource} from '@luma.gl/shadertools';

test('ShaderModule', t => {
  let shaderModule: ShaderModule = {name: 'empty-shader-module', uniformTypes: {}};

  t.ok(getShaderModuleSource(shaderModule, 'vertex'), 'returns vertex shader');
  t.ok(getShaderModuleSource(shaderModule, 'fragment'), 'returns fragment shader');

  shaderModule = {
    name: 'test-shader-module',
    uniformTypes: {},
    vs: `
uniform mat4 uProjectMatrix;
uniform mat4 uViewMatrix;
varying float vClipped;
`,
    fs: `
varying float vClipped;
`
  };
  initializeShaderModule(shaderModule);

  t.ok(getShaderModuleSource(shaderModule, 'vertex'), 'returns vertex shader');
  t.ok(getShaderModuleSource(shaderModule, 'fragment'), 'returns fragment shader');
  // @ts-expect-error
  t.throws(() => getShaderModuleSource(shaderModule, ''), 'unknown shader type');

  t.end();
});

test('checkShader', t => {
  const shaderModule = {
    name: 'test-shader-module',
    uniformTypes: {},
    deprecations: [
      {type: 'function', old: 'project', new: 'project_to_clipspace', deprecated: true},
      {type: 'vec4', old: 'viewMatrix', new: 'uViewMatrix'}
    ]
  };
  initializeShaderModule(shaderModule);
  const testShader = `
uniform vec4 viewMatrix;
attribute vec3 instancePositions;
varying vec4 vPos;
void main() {
  vPos = viewMatrix * vec4(instancePositions, 1.0);
  gl_Position = project(instancePositions);
}
`;

  const log = {
    deprecatedCalled: [],
    deprecated: function deprecated() {
      this.deprecatedCalled.push(Array.from(arguments));
      return () => {};
    },
    removedCalled: [],
    removed: function removed() {
      this.removedCalled.push(Array.from(arguments));
      return () => {};
    }
  };

  checkShaderModuleDeprecations(shaderModule, testShader, log);

  t.deepEqual(
    log.deprecatedCalled[0],
    ['project', 'project_to_clipspace'],
    'log.deprecated called'
  );
  t.deepEqual(log.removedCalled[0], ['viewMatrix', 'uViewMatrix'], 'log.removed called');

  t.end();
});

test('initializeShaderModule', t => {
  const module: ShaderModule = {
    name: 'test-shader-module',
    uniformPropTypes: {
      // @ts-expect-error
      center: [0.5, 0.5],
      strength: {type: 'number', value: 0.3, min: 0, max: 1},
      // @ts-expect-error
      enabled: false,
      // @ts-ignore
      sampler: null,
      range: {value: new Float32Array([0, 1]), private: true}
    }
  };

  initializeShaderModule(module);

  let uniforms = getShaderModuleUniforms(module, {});
  t.deepEqual(uniforms, {
    center: [0.5, 0.5],
    strength: 0.3,
    enabled: false,
    sampler: null,
    range: [0, 1]
  });

  uniforms = getShaderModuleUniforms(module, {
    center: new Float32Array([0, 0]),
    sampler: {},
    range: [0, 2]
  });
  t.deepEqual(uniforms, {
    center: [0, 0],
    strength: 0.3,
    enabled: false,
    sampler: {},
    range: [0, 1]
  });

  t.throws(() => getShaderModuleUniforms(module, {strength: -1}), 'invalid uniform');
  t.throws(() => getShaderModuleUniforms(module, {strength: 2}), 'invalid uniform');
  t.throws(() => getShaderModuleUniforms(module, {center: 0.5}), 'invalid uniform');

  t.end();
});
