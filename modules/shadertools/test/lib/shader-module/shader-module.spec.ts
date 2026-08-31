// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import type {ShaderModule} from '@luma.gl/shadertools';
import {
  initializeShaderModule,
  checkShaderModuleDeprecations,
  getGLSLUniformBlocks,
  getShaderModuleUniforms,
  getShaderModuleSource,
  getShaderModuleUniformBlockFields,
  getShaderModuleUniformLayoutValidationResult,
  validateShaderModuleUniformLayout
} from '@luma.gl/shadertools';

it('ShaderModule', () => {
  let shaderModule: ShaderModule = {name: 'empty-shader-module', uniformTypes: {}};

  expect(Boolean(getShaderModuleSource(shaderModule, 'vertex')), 'returns vertex shader').toBe(
    true
  );
  expect(Boolean(getShaderModuleSource(shaderModule, 'fragment')), 'returns fragment shader').toBe(
    true
  );

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

  expect(Boolean(getShaderModuleSource(shaderModule, 'vertex')), 'returns vertex shader').toBe(
    true
  );
  expect(Boolean(getShaderModuleSource(shaderModule, 'fragment')), 'returns fragment shader').toBe(
    true
  );
  // @ts-expect-error
  expect(() => getShaderModuleSource(shaderModule, ''), 'unknown shader type').toThrow();

  void 0;
});

it('checkShader', () => {
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

  expect(log.deprecatedCalled[0], 'log.deprecated called').toEqual([
    'project',
    'project_to_clipspace'
  ]);
  expect(log.removedCalled[0], 'log.removed called').toEqual(['viewMatrix', 'uViewMatrix']);

  void 0;
});

it('initializeShaderModule', () => {
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
  expect(uniforms, '').toEqual({
    center: [0.5, 0.5],
    strength: 0.3,
    enabled: false,
    sampler: null,
    range: new Float32Array([0, 1])
  });

  uniforms = getShaderModuleUniforms(module, {
    center: new Float32Array([0, 0]),
    sampler: {},
    range: [0, 2]
  });
  expect(uniforms, '').toEqual({
    center: new Float32Array([0, 0]),
    strength: 0.3,
    enabled: false,
    sampler: {},
    range: new Float32Array([0, 1])
  });

  expect(() => getShaderModuleUniforms(module, {strength: -1}), 'invalid uniform').toThrow();
  expect(() => getShaderModuleUniforms(module, {strength: 2}), 'invalid uniform').toThrow();
  expect(() => getShaderModuleUniforms(module, {center: 0.5}), 'invalid uniform').toThrow();

  void 0;
});

it('ShaderModule detects GLSL uniform block layout qualifiers', () => {
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

  expect(
    getGLSLUniformBlocks(shaderSource).map(block => ({
      blockName: block.blockName,
      instanceName: block.instanceName,
      hasLayoutQualifier: block.hasLayoutQualifier,
      isStd140: block.isStd140
    })),
    'extracts GLSL uniform blocks and std140 compliance'
  ).toEqual([
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
  ]);

  void 0;
});

it('ShaderModule uniform block validation parses GLSL precision-qualified fields', () => {
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

  expect(
    getShaderModuleUniformBlockFields(shaderModule, 'fragment'),
    'extracts precision-qualified GLSL uniform block fields'
  ).toEqual(['textureUnit', 'opacity', 'offsets']);
  expect(
    Boolean(getShaderModuleUniformLayoutValidationResult(shaderModule, 'fragment')?.matches),
    'validation accepts precision-qualified GLSL uniform block fields'
  ).toBe(true);

  void 0;
});

it('ShaderModule uniform block validation reports concise mismatch details', () => {
  const shaderModule: ShaderModule = {
    name: 'mismatchReporter',
    uniformTypes: {
      opacity: 'f32',
      color: 'vec4<f32>',
      uvTransform: 'mat3x3<f32>'
    },
    fs: `\
uniform mismatchReporterUniforms {
  float opacity;
  vec4 color;
} mismatchReporter;
`
  };

  expect(
    () => validateShaderModuleUniformLayout(shaderModule, 'fragment'),
    'mismatch errors report counts, first mismatch location, and missing uniforms'
  ).toThrow(
    /Expected 3 fields, found 2\..*Shader block ends after field 2; expected next field uvTransform\..*Missing from shader block \(1\): uvTransform\./
  );

  void 0;
});

it('ShaderModule uniform block validation accepts original deck project layout', () => {
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

  expect(
    getShaderModuleUniformBlockFields(shaderModule, 'vertex'),
    'extracts original deck project field order'
  ).toEqual([
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
  ]);
  expect(
    Boolean(getShaderModuleUniformLayoutValidationResult(shaderModule, 'vertex')?.matches),
    'validation accepts original deck project field order'
  ).toBe(true);

  void 0;
});
