// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device, Buffer, VertexArrayProps, RenderPass} from '@luma.gl/core';
import {VertexArray, log} from '@luma.gl/core';
import {getBrowser} from '@probe.gl/env';

import {WebGPUDevice} from '../webgpu-device';
import {WebGPUBuffer} from '../resources/webgpu-buffer';

import {WebGPURenderPass} from './webgpu-render-pass';

/** VertexArrayObject wrapper */
export class WebGPUVertexArray extends VertexArray {
  override get [Symbol.toStringTag](): string {
    return 'WebGPUVertexArray';
  }

  readonly device: WebGPUDevice;
  /** Vertex Array is just a helper class under WebGPU */
  readonly handle = null;

  // Create a VertexArray
  constructor(device: WebGPUDevice, props: VertexArrayProps) {
    super(device, props);
    this.device = device;
  }

  override destroy(): void {}

  /**
   * Set an elements buffer, for indexed rendering.
   * Must be a Buffer bound to buffer with usage bit Buffer.INDEX set.
   */
  setIndexBuffer(buffer: Buffer | null): void {
    // assert(!elementBuffer || elementBuffer.glTarget === GL.ELEMENT_ARRAY_BUFFER, ERR_ELEMENTS);
    this.indexBuffer = buffer;
  }

  /** Set a bufferSlot in vertex attributes array to a buffer, enables the bufferSlot, sets divisor */
  setBuffer(bufferSlot: number, buffer: Buffer): void {
    // Sanity check target
    // if (buffer.glUsage === GL.ELEMENT_ARRAY_BUFFER) {
    //   throw new Error('Use setIndexBuffer');
    // }

    this.attributes[bufferSlot] = buffer;
  }

  override bindBeforeRender(
    renderPass: RenderPass,
    firstIndex?: number,
    indexCount?: number
  ): void {
    const webgpuRenderPass = renderPass as WebGPURenderPass;
    const webgpuIndexBuffer = this.indexBuffer as WebGPUBuffer;
    if (webgpuIndexBuffer?.handle) {
      // Note we can't unset an index buffer
      log.info(
        3,
        'setting index buffer',
        webgpuIndexBuffer?.handle,
        webgpuIndexBuffer?.indexType
      )();
      webgpuRenderPass.handle.setIndexBuffer(
        webgpuIndexBuffer?.handle,
        // @ts-expect-error TODO - we must enforce type
        webgpuIndexBuffer?.indexType
      );
    }
    for (let location = 0; location < this.maxVertexAttributes; location++) {
      const webgpuBuffer = this.attributes[location] as WebGPUBuffer;
      if (webgpuBuffer?.handle) {
        log.info(3, `setting vertex buffer ${location}`, webgpuBuffer?.handle)();
        webgpuRenderPass.handle.setVertexBuffer(location, webgpuBuffer?.handle);
      }
    }
    // TODO - emit warnings/errors/throw if constants have been set on this vertex array
  }

  override unbindAfterRender(renderPass: RenderPass): void {
    // On WebGPU we don't need to unbind.
    // In fact we can't easily do it. setIndexBuffer/setVertexBuffer don't accept null.
    // Unbinding presumably happens automatically when the render pass is ended.
  }

  // DEPRECATED METHODS

  /**
   * @deprecated is this even an issue for WebGPU?
   * Attribute 0 can not be disable on most desktop OpenGL based browsers
   */
  static isConstantAttributeZeroSupported(device: Device): boolean {
    return getBrowser() === 'Chrome';
  }
}
