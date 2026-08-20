// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import type {VectorFieldBuffers} from './vector-field-engine';
import {VECTOR_FIELD_SHADER} from './vector-field-shaders';

export type VectorFieldRenderOptions = {
  time: number;
  scalarMode: boolean;
  probe: readonly [number, number] | null;
};

/** Fullscreen four-panel field renderer consuming compute outputs without readback. */
export class VectorFieldRenderer {
  readonly device: Device;
  readonly model: Model;
  readonly uniformBuffer: Buffer;
  readonly resolution: number;

  constructor(device: Device, buffers: VectorFieldBuffers, resolution: number) {
    this.device = device;
    this.resolution = resolution;
    this.uniformBuffer = device.createBuffer({
      id: 'vector-field-render-uniforms',
      byteLength: 32,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    this.model = new Model(device, {
      id: 'vector-field-linked-views',
      source: VECTOR_FIELD_SHADER,
      vertexCount: 3,
      bindings: {
        scalarField: buffers.scalar,
        vectorField: buffers.vector,
        gradientField: buffers.gradient,
        laplacianField: buffers.laplacian,
        divergenceField: buffers.divergence,
        curlField: buffers.curl,
        uniforms: this.uniformBuffer
      },
      shaderLayout: {
        attributes: [],
        bindings: [
          {name: 'scalarField', type: 'read-only-storage', group: 0, location: 0},
          {name: 'vectorField', type: 'read-only-storage', group: 0, location: 1},
          {name: 'gradientField', type: 'read-only-storage', group: 0, location: 2},
          {name: 'laplacianField', type: 'read-only-storage', group: 0, location: 3},
          {name: 'divergenceField', type: 'read-only-storage', group: 0, location: 4},
          {name: 'curlField', type: 'read-only-storage', group: 0, location: 5},
          {name: 'uniforms', type: 'uniform', group: 0, location: 6}
        ]
      },
      parameters: {depthWriteEnabled: false, depthCompare: 'always'}
    });
  }

  render(options: VectorFieldRenderOptions): void {
    const canvasContext = this.device.getDefaultCanvasContext();
    const [width, height] = canvasContext.getDrawingBufferSize();
    const probe = options.probe ?? [0, 0];
    this.uniformBuffer.write(
      new Float32Array([
        width,
        height,
        this.resolution,
        options.scalarMode ? 1 : 0,
        options.time,
        probe[0],
        probe[1],
        options.probe ? 1 : 0
      ])
    );
    this.model.predraw(this.device.commandEncoder);
    const pass = this.device.beginRenderPass({
      id: 'vector-field-linked-view-pass',
      framebuffer: canvasContext.getCurrentFramebuffer(),
      clearColor: [0.01, 0.015, 0.03, 1]
    });
    this.model.draw(pass);
    pass.end();
  }

  destroy(): void {
    this.model.destroy();
    this.uniformBuffer.destroy();
  }
}
