// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device, Texture} from '@luma.gl/core';
import {AsyncTexture} from '../async-texture/async-texture';
import {ClipSpace} from './clip-space';

const BACKGROUND_FS = /* glsl */ `\
#version 300 es

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
      backgroundTexture: backgroundTexture
    });
  }

  override predraw(): void {
    this.shaderInputs.setProps({

    })
    super.predraw();
  }
}
