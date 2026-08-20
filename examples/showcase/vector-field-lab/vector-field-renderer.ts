// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {Matrix4, radians} from '@math.gl/core';
import type {VectorFieldBuffers} from './vector-field-engine';
import {VECTOR_FIELD_SHADER} from './vector-field-shaders';

export type VectorFieldRenderOptions = {
  time: number;
  scalarMode: boolean;
  eye: readonly [number, number, number];
};

/** Synchronized four-panel ray marcher consuming graph-derived 3D volumes without readback. */
export class VectorFieldRenderer {
  readonly device: Device;
  readonly model: Model;
  readonly uniformBuffer: Buffer;
  readonly resolution: number;

  constructor(device: Device, buffers: VectorFieldBuffers, resolution: number) {
    this.device = device;
    this.resolution = resolution;
    this.uniformBuffer = device.createBuffer({
      id: 'vector-field-volume-uniforms',
      byteLength: 112,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    this.model = new Model(device, {
      id: 'vector-field-linked-volumes',
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
    const projection = new Matrix4().perspective({
      fovy: radians(46),
      aspect: width / Math.max(height, 1),
      near: 0.1,
      far: 20
    });
    const view = new Matrix4().lookAt({eye: options.eye, center: [0, 0, 0], up: [0, 1, 0]});
    const inverseViewProjection = new Matrix4(projection).multiplyRight(view).invert();
    const values = new Float32Array(28);
    values.set(inverseViewProjection, 0);
    values.set([...options.eye, options.time], 16);
    values.set([width, height, this.resolution, options.scalarMode ? 1 : 0], 20);
    values.set([72, 1.0, 0, 0], 24);
    this.uniformBuffer.write(values);
    this.model.predraw(this.device.commandEncoder);
    const pass = this.device.beginRenderPass({
      id: 'vector-field-volume-pass',
      framebuffer: canvasContext.getCurrentFramebuffer(),
      clearColor: [0.004, 0.008, 0.018, 1]
    });
    this.model.draw(pass);
    pass.end();
  }

  destroy(): void {
    this.model.destroy();
    this.uniformBuffer.destroy();
  }
}
