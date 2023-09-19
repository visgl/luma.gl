// luma.gl, MIT license

import type {Device, Buffer, VertexArrayProps, RenderPass, TypedArray} from '@luma.gl/core';
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
  /** Vertex Array is a helper class under WebGPU */
  readonly handle: never;

  /** * Attribute 0 can not be disable on most desktop OpenGL based browsers */
  static isConstantAttributeZeroSupported(device: Device): boolean {
    return device.info.type === 'webgl2' || getBrowser() === 'Chrome';
  }

  // Create a VertexArray
  constructor(device: WebGPUDevice, props?: VertexArrayProps) {
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

  /** Set a location in vertex attributes array to a buffer, enables the location, sets divisor */
  setBuffer(location: number, buffer: Buffer): void {
    // Sanity check target
    // if (buffer.usage === GL.ELEMENT_ARRAY_BUFFER) {
    //   throw new Error('Use setIndexBuffer');
    // }

    this.attributes[location] = buffer;
  }

  /** Set a location in vertex attributes array to a constant value, disables the location */
  override setConstant(location: number, value: TypedArray): void {
    log.warn(`${this.id} constant attributes not supported on WebGPU`)
  }

  override bindBeforeRender(renderPass: RenderPass, firstIndex?: number, indexCount?: number): void {
    const webgpuRenderPass = renderPass as WebGPURenderPass;
    const webgpuIndexBuffer = this.indexBuffer as WebGPUBuffer;
    webgpuRenderPass.handle.setIndexBuffer(webgpuIndexBuffer?.handle, webgpuIndexBuffer?.indexType);
    for (let location = 0; location < this.maxVertexAttributes; location++) {
      const webgpuBuffer = this.attributes[location] as WebGPUBuffer;
      webgpuRenderPass.handle.setVertexBuffer(location, webgpuBuffer.handle);
    }
    // TODO - emit warnings/errors/throw if constants have been set on this vertex array
  }

  override unbindAfterRender(renderPass: RenderPass): void {
    // On WebGPU we don't unbind
  }
}
