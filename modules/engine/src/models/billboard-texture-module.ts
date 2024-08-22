// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ShaderModule} from '@luma.gl/shadertools';

const BACKGROUND_FS = /* glsl */ `\
#version 300 es

uniform billboardTextureUniforms {
  vec2 topLeft;
  vec2 bottomRight;
} billboardTexture;

precision highp float;
uniform sampler2D backgroundTexture;
out vec4 fragColor;

vec2 billboardTexture_getTextureUV() {
  ivec2 iTexSize = textureSize(backgroundTexture, 0) * 2;
  vec2 texSize = vec2(float(iTexSize.x), float(iTexSize.y));
  vec2 position = gl_FragCoord.xy / texSize;
  return position;
}

void main(void) {
  vec2 position = billboardTexture_getTextureUV();
  fragColor = texture(backgroundTexture, position);
}
`;

type BillboardTextureProps = {
  aspect: number;
};

type BillboardTextureUniforms = {
  topLeft: [number, number];
  bottomRight: [number, number];
};

export const billboardTexture = {
  name: 'billboardTexture',
  fs: BACKGROUND_FS,
  dependencies: [],
  uniformTypes: {
    topLeft: 'vec2<f32>',
    bottomRight: 'vec2<f32>'
  }
} as const satisfies ShaderModule<BillboardTextureProps, BillboardTextureUniforms>;
