// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device, Texture} from '@luma.gl/core';
import {AsyncTexture} from '../async-texture/async-texture';
import {ClipSpace} from './clip-space';

const BACKGROUND_FS_WGSL = /* wgsl */ `\
@group(0) @binding(0) var backgroundTexture: texture_2d<f32>;
@group(0) @binding(1) var backgroundTextureSampler: sampler;

fn billboardTexture_getTextureUV(coordinates: vec2<f32>) -> vec2<f32> {
	let iTexSize: vec2<u32> = textureDimensions(backgroundTexture, 0) * 2;
	let texSize: vec2<f32> = vec2<f32>(f32(iTexSize.x), f32(iTexSize.y));
	var position: vec2<f32> = coordinates.xy / texSize;
	return position;
} 

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
	let position: vec2<f32> = billboardTexture_getTextureUV(inputs.coordinate);
	return textureSample(backgroundTexture, backgroundTextureSampler, position);
}
`;

const BACKGROUND_FS = /* glsl */ `\
#version 300 es
precision highp float;

uniform sampler2D backgroundTexture;
out vec4 fragColor;

vec2 billboardTexture_getTextureUV() {
  ivec2 iTexSize = textureDimensions(backgroundTexture, 0) * 2;
  vec2 texSize = vec2(float(iTexSize.x), float(iTexSize.y));
  vec2 position = gl_FragCoord.xy / texSize;
  return position;
}

void main(void) {
  vec2 position = billboardTexture_getTextureUV();
  fragColor = texture(backgroundTexture, position);
}
`;

/**
 * Props for a Model that renders a bitmap into the "background", i.e covering the screen
 */
export type BackgroundTextureModelProps = {
  /** id of this model */
  id?: string;
  /** The texture to render */
  backgroundTexture: Texture | AsyncTexture;
  /** If true, the texture is rendered into transparent areas of the screen only, i.e blended in where background alpha is small */
  blend?: boolean;
};

/**
 * Model that renders a bitmap into the "background", i.e covering the screen
 */
export class BackgroundTextureModel extends ClipSpace {
  constructor(device: Device, props: BackgroundTextureModelProps) {
    super(device, {
      id: props.id || 'background-texture-model',
      source: BACKGROUND_FS_WGSL,
      fs: BACKGROUND_FS,
      parameters: {
        depthWriteEnabled: false,
        depthCompare: 'always',
        ...(props.blend
          ? {
              blend: true,
              blendColorOperation: 'add',
              blendAlphaOperation: 'add',
              blendColorSrcFactor: 'one',
              blendColorDstFactor: 'one-minus-src-color',
              blendAlphaSrcFactor: 'one',
              blendAlphaDstFactor: 'one-minus-src-alpha'
            }
          : {})
      }
    });

    this.setTexture(props.backgroundTexture);
  }

  setTexture(backgroundTexture: Texture | AsyncTexture): void {
    this.setBindings({
      backgroundTexture
    });
  }

  override predraw(): void {
    this.shaderInputs.setProps({});
    super.predraw();
  }
}
