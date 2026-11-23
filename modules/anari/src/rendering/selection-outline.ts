// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert, Buffer, type Device, type RenderPass, type Texture} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {SELECTION_OUTLINE_SHADER} from './selection-outline-shaders';

export type SelectionOutlineOptions = {
  /** Borrowed, sampled r32uint texture containing visible placement identifiers. */
  identifierTexture: Texture;
  /** Exact uint32 snapshot identifier. Zero disables selection. */
  selectedIdentifier: number;
  /** Inward stroke width in output pixels, clamped to integer range 0–8. Default 2. */
  width?: number;
  /** Linear, straight-alpha color. Default opaque amber. */
  color?: readonly [number, number, number, number];
  /** Destination viewport origin in pixels. Texture pixels are not scaled. Default [0, 0]. */
  viewportOrigin?: readonly [number, number];
};

/** WebGPU overlay for visible selected placement boundaries. Input textures remain caller-owned. */
export class SelectionOutline {
  private readonly parameters = {
    blend: true,
    blendColorSrcFactor: 'one',
    blendColorDstFactor: 'one-minus-src-alpha',
    blendAlphaSrcFactor: 'one',
    blendAlphaDstFactor: 'one-minus-src-alpha'
  } as const;
  private readonly model: Model;
  private readonly uniforms: Buffer;

  constructor(device: Device) {
    // Selection outlines require WebGPU integer texture bindings.
    assert(device.type === 'webgpu');
    this.uniforms = device.createBuffer({byteLength: 32, usage: Buffer.UNIFORM | Buffer.COPY_DST});
    this.model = new Model(device, {
      id: 'selection-outline',
      source: SELECTION_OUTLINE_SHADER,
      vertexCount: 3,
      shaderLayout: {
        attributes: [],
        bindings: [
          {name: 'identifierImage', type: 'texture', group: 0, location: 0, sampleType: 'uint'},
          {name: 'uniforms', type: 'uniform', group: 0, location: 1}
        ]
      },
      parameters: this.parameters
    });
  }

  /**
   * Encode into a pass preserving scene color. Submit before changing options on this instance
   * or destroying the borrowed input texture.
   */
  draw(renderPass: RenderPass, options: SelectionOutlineOptions): boolean {
    const width = Math.min(8, Math.max(0, Math.floor(options.width ?? 2)));
    if (options.selectedIdentifier === 0 || width === 0) return false;
    // The identifier texture must preserve exact uint32 snapshot identifiers.
    assert(options.identifierTexture.format === 'r32uint');
    const bytes = new ArrayBuffer(32);
    new Float32Array(bytes, 0, 4).set(options.color ?? [1, 0.6, 0.05, 1]);
    new Uint32Array(bytes, 16, 2).set([options.selectedIdentifier, width]);
    new Int32Array(bytes, 24, 2).set(options.viewportOrigin ?? [0, 0]);
    this.uniforms.write(new Uint8Array(bytes));
    const framebuffer =
      renderPass.props.framebuffer ?? renderPass.device.getCanvasContext().getCurrentFramebuffer();
    this.model.setParameters({
      ...this.parameters,
      ...(framebuffer.depthStencilAttachment
        ? ({depthCompare: 'always', depthWriteEnabled: false} as const)
        : {})
    });
    this.model.setBindings({identifierImage: options.identifierTexture, uniforms: this.uniforms});
    return this.model.draw(renderPass);
  }

  destroy(): void {
    this.model.destroy();
    this.uniforms.destroy();
  }
}
