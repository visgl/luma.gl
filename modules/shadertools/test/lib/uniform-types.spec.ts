// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {NumberArray16, NumberArray3, NumberArray4} from '@math.gl/core';
import type {ShaderModule, UniformTypes} from '../../src/index';

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

export const arrayModule = {
  name: 'array',
  uniformTypes: {
    jointMatrix: ['mat4x4<f32>', 64]
  }
} as const satisfies ShaderModule<{}, Pick<CompositeUniforms, 'jointMatrix'>>;

export const tupleUniformTypes = {
  color: 'vec4<f32>',
  modelMatrix: 'mat4x4<f32>'
} as const satisfies Required<UniformTypes<Pick<CompositeUniforms, 'color' | 'modelMatrix'>>>;

type NestedCompositeUniforms = {
  cluster: {
    keyLight: {
      color: NumberArray4;
      direction: NumberArray3;
    };
    fillLights: {
      position: NumberArray3;
      intensity: number;
    }[];
  };
};

export const nestedCompositeUniformTypes = {
  cluster: {
    keyLight: {
      color: 'vec4<f32>',
      direction: 'vec3<f32>'
    },
    fillLights: [
      {
        position: 'vec3<f32>',
        intensity: 'f32'
      },
      4
    ]
  }
} as const satisfies Required<UniformTypes<NestedCompositeUniforms>>;

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

export const invalidArrayElementModule = {
  name: 'invalid-array-element',
  uniformTypes: {
    // @ts-expect-error jointMatrix arrays must keep mat4x4 element descriptors
    jointMatrix: ['f32', 64]
  }
} as const satisfies ShaderModule<{}, Pick<CompositeUniforms, 'jointMatrix'>>;

export const invalidStructArrayModule = {
  name: 'invalid-struct-array',
  uniformTypes: {
    lights: [
      {
        position: 'vec3<f32>',
        // @ts-expect-error intensity must remain an f32 descriptor
        intensity: 'vec2<f32>'
      },
      2
    ]
  }
} as const satisfies ShaderModule<{}, Pick<CompositeUniforms, 'lights'>>;
