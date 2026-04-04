// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device, Buffer, VertexArrayProps, RenderPass} from '@luma.gl/core';
import {VertexArray, log} from '@luma.gl/core';
import {getBrowser} from '@probe.gl/env';

import {WebGPUDevice} from '../webgpu-device';
import {WebGPUBuffer} from '../resources/webgpu-buffer';
import {
  getBufferSlots,
  resolveVertexBufferLayouts,
  type ResolvedVertexBufferSlot
} from '../helpers/get-vertex-buffer-layout';

import {WebGPURenderPass} from './webgpu-render-pass';

/** VertexArrayObject wrapper */
export class WebGPUVertexArray extends VertexArray {
  override get [Symbol.toStringTag](): string {
    return 'VertexArray';
  }

  readonly device: WebGPUDevice;
  /** Vertex Array is just a helper class under WebGPU */
  readonly handle = null;
  /** Physical WebGPU vertex-buffer slots derived from the logical buffer layout. */
  private readonly resolvedBufferSlots: ResolvedVertexBufferSlot[];
  /** Logical vertex-array slot lookup keyed by buffer name. */
  private readonly logicalBufferSlots: Record<string, number>;

  /** Creates a WebGPU vertex array helper for draw-time buffer rebinding. */
  constructor(device: WebGPUDevice, props: VertexArrayProps) {
    super(device, props);
    this.device = device;
    const {resolvedSlots} = resolveVertexBufferLayouts(props.shaderLayout, props.bufferLayout);
    this.resolvedBufferSlots = resolvedSlots;
    this.logicalBufferSlots = getBufferSlots(props.shaderLayout, props.bufferLayout);
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

  /** Sets the buffer stored in one logical vertex-array slot. */
  setBuffer(bufferSlot: number, buffer: Buffer): void {
    // Sanity check target
    // if (buffer.glUsage === GL.ELEMENT_ARRAY_BUFFER) {
    //   throw new Error('Use setIndexBuffer');
    // }

    this.attributes[bufferSlot] = buffer;
  }

  /**
   * Binds index and vertex buffers for the current draw call.
   * Repeats logical buffers across multiple WebGPU slots when the resolved layout was expanded.
   */
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
    for (const resolvedSlot of this.resolvedBufferSlots) {
      const logicalBufferSlot =
        this.logicalBufferSlots[resolvedSlot.bufferName] ?? resolvedSlot.shaderSlot;
      const webgpuBuffer = this.attributes[logicalBufferSlot] as WebGPUBuffer;
      if (webgpuBuffer?.handle) {
        log.info(
          3,
          `setting vertex buffer ${resolvedSlot.shaderSlot}`,
          webgpuBuffer?.handle,
          resolvedSlot.bindingOffset
        )();
        webgpuRenderPass.handle.setVertexBuffer(
          resolvedSlot.shaderSlot,
          webgpuBuffer?.handle,
          resolvedSlot.bindingOffset
        );
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
