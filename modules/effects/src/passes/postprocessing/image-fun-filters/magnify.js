// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
const source = /* wgsl */ `\
uniform magnifyUniforms {
  screenXY: vec2f;
  radiusPixels: f32;
  zoom: f32;
  borderWidthPixels: f32;
  borderColor: vec4f;
};

@group(0) @binding(1) var<uniform> magnify: magnifyUniforms;

fn magnify_sampleColor(sampler2D source, vec2 texSize, vec2 texCoord) -> vec4f {
  vec2 pos = vec2(magnify.screenXY.x, 1.0 - magnify.screenXY.y);
  float dist = distance(texCoord * texSize, pos * texSize);
  if (dist < magnify.radiusPixels) {
    return texture(source, (texCoord - pos) / magnify.zoom + pos);
  }

  if (dist <= magnify.radiusPixels + magnify.borderWidthPixels) {
    return magnify.borderColor;
  }
  return texture(source, texCoord);
}
`;
const fs = /* glsl */ `\
uniform magnifyUniforms {
  vec2 screenXY;
  float radiusPixels;
  float zoom;
  float borderWidthPixels;
  vec4 borderColor;
} magnify;

vec4 magnify_sampleColor(sampler2D source, vec2 texSize, vec2 texCoord) {
  vec2 pos = vec2(magnify.screenXY.x, 1.0 - magnify.screenXY.y);
  float dist = distance(texCoord * texSize, pos * texSize);
  if (dist < magnify.radiusPixels) {
    return texture(source, (texCoord - pos) / magnify.zoom + pos);
  }

  if (dist <= magnify.radiusPixels + magnify.borderWidthPixels) {
    return magnify.borderColor;
  }
  return texture(source, texCoord);
}
`;
/**
 * Magnify - display a circle with magnify effect applied to surrounding the pixels given position
 */
export const magnify = {
    name: 'magnify',
    source,
    fs,
    uniformTypes: {
        screenXY: 'vec2<f32>',
        radiusPixels: 'f32',
        zoom: 'f32',
        borderWidthPixels: 'f32',
        borderColor: 'vec4<f32>'
    },
    propTypes: {
        // range 0 to 1
        screenXY: { value: [0, 0] },
        radiusPixels: 200,
        zoom: 2.0,
        borderWidthPixels: 0.0,
        borderColor: { value: [255, 255, 255, 255] }
    },
    passes: [{ sampler: true }]
};
