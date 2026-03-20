// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Texture} from '../../core/src/index';
import type {ShaderModule} from '../../shadertools/src/index';
import {ShaderInputs} from '../src/shader-inputs';

type CompositeUniforms = {
  light: {
    transform: {
      position: [number, number, number];
      range: number;
    };
    intensity: number;
  };
  lights: {
    position: [number, number, number];
    intensity: number;
  }[];
};

type CompositeProps = {
  light?: {
    transform?: {
      position?: [number, number, number];
      range?: number;
    };
    intensity?: number;
  };
  lights?: ReadonlyArray<
    | {
        position?: [number, number, number];
        intensity?: number;
      }
    | undefined
  >;
  lightTexture?: Texture;
};

type CompositeBindings = {
  lightTexture: Texture;
};

const compositeModule = {
  name: 'composite-types',
  uniformTypes: {
    light: {
      transform: {
        position: 'vec3<f32>',
        range: 'f32'
      },
      intensity: 'f32'
    },
    lights: [
      {
        position: 'vec3<f32>',
        intensity: 'f32'
      },
      4
    ]
  },
  getUniforms: props => props as Partial<CompositeUniforms & CompositeBindings>
} as const satisfies ShaderModule<CompositeProps, CompositeUniforms, CompositeBindings>;

export function verifyCompositeShaderInputTypes(): void {
  const shaderInputs = new ShaderInputs<{
    composite: CompositeProps;
  }>({composite: compositeModule});

  shaderInputs.setProps({
    composite: {
      light: {
        transform: {
          position: [1, 2, 3]
        }
      }
    }
  });

  shaderInputs.setProps({
    composite: {
      lights: [undefined, {intensity: 0.5}, {position: [3, 2, 1]}]
    }
  });

  shaderInputs.setProps({
    composite: {
      lightTexture: {} as Texture
    }
  });

  shaderInputs.setProps({
    composite: {
      lights: [{position: [1, 2, 3], intensity: 1}]
    }
  });

  // @ts-expect-error position must remain a vec3-shaped tuple
  shaderInputs.setProps({composite: {light: {transform: {position: [1, 2]}}}});

  // @ts-expect-error lights array elements must match the struct shape
  shaderInputs.setProps({composite: {lights: [{range: 1}]}});

  // @ts-expect-error unknown nested light key
  shaderInputs.setProps({composite: {light: {transform: {falloff: 2}}}});

  // @ts-expect-error bindings must stay top-level props
  shaderInputs.setProps({composite: {light: {lightTexture: {} as Texture}}});
}
