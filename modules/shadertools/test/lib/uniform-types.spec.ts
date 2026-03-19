// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {NumberArray16, NumberArray3, NumberArray4} from '@math.gl/core';
import type {ShaderModule, UniformTypes} from '@luma.gl/shadertools';

type CompositeUniforms = {
  light: {
    position: NumberArray3;
    range: number;
  };
  lights: {
    position: NumberArray3;
    intensity: number;
  }[];
  color: NumberArray4;
  modelMatrix: NumberArray16;
  jointMatrix: NumberArray16[];
};

export const compositeUniformTypes = {
  light: {
    position: 'vec3<f32>',
    range: 'f32'
  },
  lights: [
    {
      position: 'vec3<f32>',
      intensity: 'f32'
    },
    2
  ],
  color: 'vec4<f32>',
  modelMatrix: 'mat4x4<f32>'
} as const satisfies Required<UniformTypes<Omit<CompositeUniforms, 'jointMatrix'>>>;

export const compositeModule = {
  name: 'composite',
  uniformTypes: compositeUniformTypes
} as const satisfies ShaderModule<{}, Omit<CompositeUniforms, 'jointMatrix'>>;

export const legacyArrayModule = {
  name: 'legacy-array',
  uniformTypes: {
    jointMatrix: 'mat4x4<f32>'
  },
  uniformSizes: {
    jointMatrix: 64
  }
} as const satisfies ShaderModule<{}, Pick<CompositeUniforms, 'jointMatrix'>>;

export const tupleUniformTypes = {
  color: 'vec4<f32>',
  modelMatrix: 'mat4x4<f32>'
} as const satisfies Required<UniformTypes<Pick<CompositeUniforms, 'color' | 'modelMatrix'>>>;

export const invalidCompositeModule = {
  name: 'invalid-composite',
  uniformTypes: {
    light: {
      // @ts-expect-error position must remain a vec3 descriptor
      position: 'f32',
      range: 'f32'
    }
  }
} as const satisfies ShaderModule<{}, Pick<CompositeUniforms, 'light'>>;
