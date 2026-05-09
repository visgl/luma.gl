// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device, type CommandEncoder, Texture} from '@luma.gl/core';
import type {ShaderModule} from '@luma.gl/shadertools';
import {DynamicTexture} from '../dynamic-texture/dynamic-texture';
import {ClipSpace, ClipSpaceProps} from './clip-space';

const backgroundModule = {
  name: 'background',
  uniformTypes: {
    scale: 'vec2<f32>',
    flipY: 'i32'
  }
} as const satisfies ShaderModule<{}, {scale: [number, number]; flipY: number}>;

const BACKGROUND_FS_WGSL = /* wgsl */ `\
@group(0) @binding(auto) var backgroundTexture: texture_2d<f32>;
@group(0) @binding(auto) var backgroundTextureSampler: sampler;
struct backgroundUniforms {
  scale: vec2<f32>,
  flipY: i32,
};
@group(0) @binding(auto) var<uniform> background: backgroundUniforms;

fn billboardTexture_getTextureUV(uv: vec2<f32>) -> vec2<f32> {
  let scale: vec2<f32> = background.scale;
  var position: vec2<f32> = (uv - vec2<f32>(0.5, 0.5)) / scale + vec2<f32>(0.5, 0.5);
  if (background.flipY != 0) {
    position.y = 1.0 - position.y;
  }
  return position;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  let position: vec2<f32> = billboardTexture_getTextureUV(inputs.uv);
  return textureSample(backgroundTexture, backgroundTextureSampler, position);
}
`;

const BACKGROUND_FS = /* glsl */ `\
#version 300 es
precision highp float;

uniform sampler2D backgroundTexture;

layout(std140) uniform backgroundUniforms {
  vec2 scale;
  int flipY;
} background;

in vec2 coordinate;
out vec4 fragColor;

vec2 billboardTexture_getTextureUV(vec2 coord) {
  vec2 position = (coord - 0.5) / background.scale + 0.5;
  if (background.flipY != 0) {
    position.y = 1.0 - position.y;
  }
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
  /** If true, flip the sampled texture vertically before drawing. */
  flipY?: boolean;
};

/**
 * Model that renders a bitmap into the "background", i.e covering the screen
 */
export class BackgroundTextureModel extends ClipSpace {
  backgroundTexture: Texture = null!;
  flipY = false;

  constructor(device: Device, props: BackgroundTextureModelProps) {
    super(device, {
      ...props,
      id: props.id || 'background-texture-model',
      source: BACKGROUND_FS_WGSL,
      fs: BACKGROUND_FS,
      modules: [...(props.modules || []), backgroundModule],
      parameters: {
        depthWriteEnabled: false,
        ...(props.parameters || {}),
        ...(props.blend
          ? {
              blend: true,
              blendColorOperation: 'add',
              blendAlphaOperation: 'add',
              blendColorSrcFactor: 'one-minus-dst-alpha',
              blendColorDstFactor: 'one',
              blendAlphaSrcFactor: 'one-minus-dst-alpha',
              blendAlphaDstFactor: 'one'
            }
          : {})
      }
    });

    if (!props.backgroundTexture) {
      throw new Error('BackgroundTextureModel requires a backgroundTexture prop');
    }
    this.setProps(props);
  }

  /** Update the background texture */
  setProps(props: Partial<BackgroundTextureModelProps>): void {
    const {backgroundTexture} = props;
    if (props.flipY !== undefined) {
      this.flipY = props.flipY;
      if (this.backgroundTexture) {
        this.updateScale(this.backgroundTexture);
      }
    }

    if (backgroundTexture) {
      this.setBindings({backgroundTexture});

      if (backgroundTexture.isReady) {
        const texture =
          backgroundTexture instanceof DynamicTexture
            ? backgroundTexture.texture
            : backgroundTexture;
        this.backgroundTexture = texture;
        this.updateScale(texture);
      } else {
        backgroundTexture.ready.then(texture => {
          this.backgroundTexture = texture;
          this.updateScale(texture);
        });
      }
    }
  }

  override predraw(commandEncoder: CommandEncoder): void {
    // this.updateScale(this.backgroundTexture);
    super.predraw(commandEncoder);
  }

  updateScale(texture: Texture): void {
    if (!texture) {
      // Initial scale to avoid rendering issues before texture is loaded
      this.shaderInputs.setProps({background: {scale: [1, 1], flipY: 0}});
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

    this.shaderInputs.setProps({
      background: {scale: [scaleX, scaleY], flipY: this.flipY ? 1 : 0}
    });
  }
}
