// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import type {ShaderModule} from '@luma.gl/shadertools';
import {
  initializeShaderModule,
  checkShaderModuleDeprecations,
  getGLSLUniformBlocks,
  getShaderModuleUniforms,
  getShaderModuleSource,
  getShaderModuleUniformBlockFields,
  getShaderModuleUniformLayoutValidationResult
} from '@luma.gl/shadertools';

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
in vec3 instancePositions;
out vec4 vPos;
void main() {
  vPos = viewMatrix * vec4(instancePositions, 1.0);
  gl_Position = project(instancePositions);
}
`;

  const log = {
    deprecatedCalled: [],
    deprecated: function deprecated(...args) {
      this.deprecatedCalled.push(args);
      return () => {};
    },
    removedCalled: [],
    removed: function removed(...args) {
      this.removedCalled.push(args);
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
    propTypes: {
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

test('ShaderModule detects GLSL uniform block layout qualifiers', t => {
  const shaderSource = `\
layout(std140) uniform Std140Block {
  float opacity;
} std140Block;

uniform DefaultBlock {
  float opacity;
} defaultBlock;

layout(
  shared
) uniform SharedBlock {
  float opacity;
} sharedBlock;

layout(std430) uniform StorageStyleBlock {
  float opacity;
} storageStyleBlock;
`;

  t.deepEqual(
    getGLSLUniformBlocks(shaderSource).map(block => ({
      blockName: block.blockName,
      instanceName: block.instanceName,
      hasLayoutQualifier: block.hasLayoutQualifier,
      isStd140: block.isStd140
    })),
    [
      {
        blockName: 'Std140Block',
        instanceName: 'std140Block',
        hasLayoutQualifier: true,
        isStd140: true
      },
      {
        blockName: 'DefaultBlock',
        instanceName: 'defaultBlock',
        hasLayoutQualifier: false,
        isStd140: false
      },
      {
        blockName: 'SharedBlock',
        instanceName: 'sharedBlock',
        hasLayoutQualifier: true,
        isStd140: false
      },
      {
        blockName: 'StorageStyleBlock',
        instanceName: 'storageStyleBlock',
        hasLayoutQualifier: true,
        isStd140: false
      }
    ],
    'extracts GLSL uniform blocks and std140 compliance'
  );

  t.end();
});

test('ShaderModule uniform block validation parses GLSL precision-qualified fields', t => {
  const shaderModule: ShaderModule = {
    name: 'precisionQualified',
    uniformTypes: {
      textureUnit: 'i32',
      opacity: 'f32',
      offsets: 'vec2<f32>'
    },
    fs: `\
uniform precisionQualifiedUniforms {
  highp int textureUnit;
  mediump float opacity;
  vec2 offsets;
} precisionQualified;
`
  };

  t.deepEqual(
    getShaderModuleUniformBlockFields(shaderModule, 'fragment'),
    ['textureUnit', 'opacity', 'offsets'],
    'extracts precision-qualified GLSL uniform block fields'
  );
  t.ok(
    getShaderModuleUniformLayoutValidationResult(shaderModule, 'fragment')?.matches,
    'validation accepts precision-qualified GLSL uniform block fields'
  );

  t.end();
});

test('ShaderModule uniform block validation accepts original deck project layout', t => {
  // Mirrors deck.gl master:
  // modules/core/src/shaderlib/project/project.ts
  // modules/core/src/shaderlib/project/project.glsl.ts
  const shaderModule: ShaderModule = {
    name: 'project',
    uniformTypes: {
      wrapLongitude: 'f32',
      coordinateSystem: 'i32',
      commonUnitsPerMeter: 'vec3<f32>',
      projectionMode: 'i32',
      scale: 'f32',
      commonUnitsPerWorldUnit: 'vec3<f32>',
      commonUnitsPerWorldUnit2: 'vec3<f32>',
      center: 'vec4<f32>',
      modelMatrix: 'mat4x4<f32>',
      viewProjectionMatrix: 'mat4x4<f32>',
      viewportSize: 'vec2<f32>',
      devicePixelRatio: 'f32',
      focalDistance: 'f32',
      cameraPosition: 'vec3<f32>',
      coordinateOrigin: 'vec3<f32>',
      commonOrigin: 'vec3<f32>',
      pseudoMeters: 'f32'
    },
    vs: `\
uniform projectUniforms {
  bool wrapLongitude;
  int coordinateSystem;
  vec3 commonUnitsPerMeter;
  int projectionMode;
  float scale;
  vec3 commonUnitsPerWorldUnit;
  vec3 commonUnitsPerWorldUnit2;
  vec4 center;
  mat4 modelMatrix;
  mat4 viewProjectionMatrix;
  vec2 viewportSize;
  float devicePixelRatio;
  float focalDistance;
  vec3 cameraPosition;
  vec3 coordinateOrigin;
  vec3 commonOrigin;
  bool pseudoMeters;
} project;
`
  };

  t.deepEqual(
    getShaderModuleUniformBlockFields(shaderModule, 'vertex'),
    [
      'wrapLongitude',
      'coordinateSystem',
      'commonUnitsPerMeter',
      'projectionMode',
      'scale',
      'commonUnitsPerWorldUnit',
      'commonUnitsPerWorldUnit2',
      'center',
      'modelMatrix',
      'viewProjectionMatrix',
      'viewportSize',
      'devicePixelRatio',
      'focalDistance',
      'cameraPosition',
      'coordinateOrigin',
      'commonOrigin',
      'pseudoMeters'
    ],
    'extracts original deck project field order'
  );
  t.ok(
    getShaderModuleUniformLayoutValidationResult(shaderModule, 'vertex')?.matches,
    'validation accepts original deck project field order'
  );

  t.end();
});
