// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Texture} from '@luma.gl/core';
import type {NumberArray3} from '@math.gl/core';
import type {ShaderPass, ShaderPassPipeline} from '@luma.gl/shadertools';

type DeferredAmbientLightingUniforms = {
  ambientColor: Readonly<NumberArray3>;
};

type DeferredAmbientLightingBindings = {
  depthTexture?: Texture;
  baseColorMetallicTexture?: Texture;
  emissiveOcclusionTexture?: Texture;
};

/** CPU-side uniforms and G-buffer bindings needed to isolate deferred ambient lighting. */
export type DeferredAmbientLightingProps = Partial<DeferredAmbientLightingUniforms> &
  DeferredAmbientLightingBindings;

/** Extracts only the ambient contribution consumed by ambient-only screen-space effects. */
export const deferredAmbientLighting = {
  name: 'deferredAmbientLighting',
  source: /* wgsl */ `\
struct DeferredAmbientLightingUniforms {
  ambientColor: vec3f,
};

@group(0) @binding(auto) var<uniform> deferredAmbientLighting: DeferredAmbientLightingUniforms;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
@group(0) @binding(auto) var baseColorMetallicTexture: texture_2d<f32>;
@group(0) @binding(auto) var baseColorMetallicTextureSampler: sampler;
@group(0) @binding(auto) var emissiveOcclusionTexture: texture_2d<u32>;

fn deferredAmbientLighting_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let depth = textureSampleLevel(depthTexture, depthTextureSampler, texCoord, 0);
  if (depth >= 0.99999) {
    return vec4f(0.0);
  }
  let baseColor = textureSampleLevel(
    baseColorMetallicTexture,
    baseColorMetallicTextureSampler,
    texCoord,
    0
  ).rgb;
  let materialCoordinates = vec2i(
    clamp(texCoord * texSize, vec2f(0.0), texSize - vec2f(1.0))
  );
  let materialOcclusion = f32(textureLoad(emissiveOcclusionTexture, materialCoordinates, 0).a) /
    255.0;
  return vec4f(baseColor * deferredAmbientLighting.ambientColor * materialOcclusion, 1.0);
}`,
  bindingLayout: [
    {name: 'depthTexture', group: 0},
    {name: 'baseColorMetallicTexture', group: 0},
    {name: 'emissiveOcclusionTexture', group: 0}
  ],
  props: {} as DeferredAmbientLightingProps,
  uniforms: {} as DeferredAmbientLightingUniforms,
  bindings: {} as DeferredAmbientLightingBindings,
  uniformTypes: {
    ambientColor: 'vec3<f32>'
  },
  propTypes: {
    ambientColor: {value: [0.04, 0.04, 0.05], private: true}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass<
  DeferredAmbientLightingProps,
  DeferredAmbientLightingUniforms,
  DeferredAmbientLightingBindings
>;

/** Creates a reusable fullscreen ambient-light extraction pass over deferred G-buffer material. */
export function createDeferredAmbientLightingShaderPassPipeline(): ShaderPassPipeline {
  return {
    name: 'deferredAmbientLightingShaderPassPipeline',
    steps: [
      {
        shaderPass: deferredAmbientLighting,
        inputs: {sourceTexture: 'previous'},
        output: 'previous'
      }
    ]
  };
}
