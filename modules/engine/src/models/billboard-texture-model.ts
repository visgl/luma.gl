// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device, Texture} from '@luma.gl/core';
import type {ShaderModule} from '@luma.gl/shadertools';
import {DynamicTexture} from '../dynamic-texture/dynamic-texture';
import {ClipSpace, ClipSpaceProps} from './clip-space';

const backgroundModule = {
  name: 'background',
  uniformTypes: {
    scale: 'vec2<f32>'
  }
} as const satisfies ShaderModule<{}, {scale: [number, number]}>;

const BACKGROUND_FS_WGSL = /* wgsl */ `\
@group(0) @binding(0) var backgroundTexture: texture_2d<f32>;
@group(0) @binding(1) var backgroundTextureSampler: sampler;
struct backgroundUniforms {
  scale: vec2<f32>,
};
@group(0) @binding(2) var<uniform> background: backgroundUniforms;

fn billboardTexture_getTextureUV(coordinates: vec2<f32>) -> vec2<f32> {
        let scale: vec2<f32> = background.scale;
        var position: vec2<f32> = (coordinates - vec2<f32>(0.5, 0.5)) / scale + vec2<f32>(0.5, 0.5);
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

uniform backgroundUniforms {
  vec2 scale;
} background;

in vec2 coordinate;
out vec4 fragColor;

vec2 billboardTexture_getTextureUV(vec2 coord) {
  vec2 position = (coord - 0.5) / background.scale + 0.5;
  return position;
}

void main(void) {
  vec2 position = billboardTexture_getTextureUV(coordinate);
  fragColor = texture(backgroundTexture, position);
}
`;

/**
 * Props for a Model that renders a bitmap into the "background", i.e covering the screen
 */
export type BackgroundTextureModelProps = ClipSpaceProps & {
  /** id of this model */
  id?: string;
  /** The texture to render */
  backgroundTexture: Texture | DynamicTexture;
  /** If true, the texture is rendered into transparent areas of the screen only, i.e blended in where background alpha is small */
  blend?: boolean;
};

/**
 * Model that renders a bitmap into the "background", i.e covering the screen
 */
export class BackgroundTextureModel extends ClipSpace {
  backgroundTexture: Texture = null!;

  constructor(device: Device, props: BackgroundTextureModelProps) {
    super(device, {
      id: props.id || 'background-texture-model',
      source: BACKGROUND_FS_WGSL,
      fs: BACKGROUND_FS,
      modules: [backgroundModule],
      parameters: {
        depthWriteEnabled: false,
        ...(props.blend
          ? {
              blend: true,
              blendColorOperation: 'add',
              blendAlphaOperation: 'add',
              blendColorSrcFactor: 'one',
              blendColorDstFactor: 'one-minus-src',
              blendAlphaSrcFactor: 'one',
              blendAlphaDstFactor: 'one-minus-src-alpha'
            }
          : {})
      }
    });

    if (!props.backgroundTexture) {
      throw new Error('BackgroundTextureModel requires a backgroundTexture prop');
    }
    this.setProps(props);
  }

  setProps(props: Partial<BackgroundTextureModelProps>): void {
    const {backgroundTexture} = props;
    if (backgroundTexture) {
      this.setBindings({backgroundTexture});
      backgroundTexture.ready.then(texture => {
        this.backgroundTexture = texture;
        this.updateScale(texture);
      });
    }
  }

  override predraw(): void {
    // this.updateScale(this.backgroundTexture);
    super.predraw();
  }

  updateScale(texture: Texture): void {
    if (!texture) {
      // Initial scale to avoid rendering issues before texture is loaded
      this.shaderInputs.setProps({background: {scale: [1, 1]}});
      return;
    }
    const [screenWidth, screenHeight] = this.device.getCanvasContext().getDrawingBufferSize();

    const textureWidth = texture.width;
    const textureHeight = texture.height;

    const screenAspect = screenWidth / screenHeight;
    const textureAspect = textureWidth / textureHeight;

    let scaleX = 1;
    let scaleY = 1;
    if (screenAspect > textureAspect) {
      scaleY = screenAspect / textureAspect;
    } else {
      scaleX = textureAspect / screenAspect;
    }

    this.shaderInputs.setProps({background: {scale: [scaleX, scaleY]}});
  }
}
