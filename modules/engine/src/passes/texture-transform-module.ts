// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderModule} from '@luma.gl/shadertools';

export const textureTransform = {
  name: 'textureTransform',
  source: /* wgsl */ `
struct textureTransformUniforms {
  scale: vec2<f32>,
};
@group(0) @binding(auto) var<uniform> textureTransform: textureTransformUniforms;

fn shaderPassRenderer_getTextureUV(uv: vec2f) -> vec2f {
  return (uv - vec2f(0.5, 0.5)) / textureTransform.scale + vec2f(0.5, 0.5);
}

fn shaderPassRenderer_getRenderTargetUV(textureUV: vec2f) -> vec2f {
  let unscaledCoord = (textureUV - vec2f(0.5, 0.5)) * textureTransform.scale + vec2f(0.5, 0.5);
  return vec2f(unscaledCoord.x, 1.0 - unscaledCoord.y);
}
`,
  fs: /* glsl */ `
layout(std140) uniform textureTransformUniforms {
  vec2 scale;
} textureTransform;

vec2 shaderPassRenderer_getTextureUV(vec2 coord) {
  return (coord - 0.5) / textureTransform.scale + 0.5;
}

vec2 shaderPassRenderer_getRenderTargetUV(vec2 textureUV) {
  vec2 unscaledCoord = (textureUV - 0.5) * textureTransform.scale + 0.5;
  return vec2(unscaledCoord.x, 1.0 - unscaledCoord.y);
}
`,
  uniformTypes: {
    scale: 'vec2<f32>'
  }
} as const satisfies ShaderModule<{}, {scale: [number, number]}>;
