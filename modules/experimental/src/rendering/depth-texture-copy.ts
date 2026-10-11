// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert, Buffer, type Device, type RenderPass, type Texture} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';

export const DEPTH_TEXTURE_COPY_SHADER = /* wgsl */ `
@group(0) @binding(0) var depthImage: texture_2d<f32>;
@group(0) @binding(1) var<uniform> viewportOrigin: vec2<i32>;

@vertex
fn vertexMain(@builtin(vertex_index) index: u32) -> @builtin(position) vec4<f32> {
  let positions = array<vec2<f32>, 3>(vec2<f32>(-1.0, -1.0), vec2<f32>(3.0, -1.0), vec2<f32>(-1.0, 3.0));
  return vec4<f32>(positions[index], 0.0, 1.0);
}

@fragment
fn fragmentMain(@builtin(position) position: vec4<f32>) -> @builtin(frag_depth) f32 {
  let pixel = vec2<i32>(position.xy) - viewportOrigin;
  if (any(pixel < vec2<i32>(0)) || any(pixel >= vec2<i32>(textureDimensions(depthImage)))) {
    discard;
    return 1.0;
  }
  return textureLoad(depthImage, pixel, 0).r;
}
`;

/** Copies zero-to-one projected depth into a WebGPU depth attachment, preserving color. */
export class DepthTextureCopy {
  private readonly model: Model;
  private readonly uniforms: Buffer;

  constructor(device: Device) {
    // Fragment depth writes require WebGPU in this helper.
    assert(device.type === 'webgpu');
    this.uniforms = device.createBuffer({byteLength: 8, usage: Buffer.UNIFORM | Buffer.COPY_DST});
    this.model = new Model(device, {
      id: 'depth-texture-copy',
      source: DEPTH_TEXTURE_COPY_SHADER,
      vertexCount: 3,
      shaderLayout: {
        attributes: [],
        bindings: [
          {
            name: 'depthImage',
            type: 'texture',
            group: 0,
            location: 0,
            sampleType: 'unfilterable-float'
          },
          {name: 'viewportOrigin', type: 'uniform', group: 0, location: 1}
        ]
      },
      parameters: {depthCompare: 'always', depthWriteEnabled: true, colorMask: 0}
    });
  }

  /** Submit before changing options on this instance or destroying the borrowed texture. */
  draw(
    renderPass: RenderPass,
    options: {
      depthTexture: Texture;
      viewportOrigin?: readonly [number, number];
    }
  ): boolean {
    // The source stores projected depth, not ray distance.
    assert(options.depthTexture.format === 'r32float');
    const framebuffer =
      renderPass.props.framebuffer ?? renderPass.device.getCanvasContext().getCurrentFramebuffer();
    // The destination must have a depth attachment.
    assert(framebuffer.depthStencilAttachment);
    this.uniforms.write(new Int32Array(options.viewportOrigin ?? [0, 0]));
    this.model.setBindings({depthImage: options.depthTexture, viewportOrigin: this.uniforms});
    return this.model.draw(renderPass);
  }

  destroy(): void {
    this.model.destroy();
    this.uniforms.destroy();
  }
}
