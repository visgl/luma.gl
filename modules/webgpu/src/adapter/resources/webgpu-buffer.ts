// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, BufferProps} from '@luma.gl/core';
import type {WebGPUDevice} from '../webgpu-device';

function getByteLength(props: BufferProps): number {
  return props.byteLength || props.data?.byteLength || 0;
}

export class WebGPUBuffer extends Buffer {
  readonly device: WebGPUDevice;
  readonly handle: GPUBuffer;
  readonly byteLength: number;

  constructor(device: WebGPUDevice, props: BufferProps) {
    super(device, props);
    this.device = device;

    this.byteLength = getByteLength(props);
    const mapBuffer = Boolean(props.data);

    // WebGPU buffers must be aligned to 4 bytes
    const size = Math.ceil(this.byteLength / 4) * 4;

    this.device.pushErrorScope('out-of-memory');
    this.device.pushErrorScope('validation');
    this.handle =
      this.props.handle ||
      this.device.handle.createBuffer({
        size,
        // usage defaults to vertex
        usage: this.props.usage || GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: this.props.mappedAtCreation || mapBuffer,
        label: this.props.id
      });
    this.device.popErrorScope((error: GPUError) => {
      this.device.reportError(new Error(`${this} creation failed ${error.message}`), this)();
      this.device.debug();
    });
    this.device.popErrorScope((error: GPUError) => {
      this.device.reportError(new Error(`${this} out of memory: ${error.message}`), this)();
      this.device.debug();
    });

    if (props.data) {
      this._writeMapped(props.data);
      // this.handle.writeAsync({data: props.data, map: false, unmap: false});
    }

    if (mapBuffer && !props.mappedAtCreation) {
      this.handle.unmap();
    }
  }

  override destroy(): void {
    this.handle?.destroy();
    // @ts-expect-error readonly
    this.handle = null;
  }

  // WebGPU provides multiple ways to write a buffer...
  override write(data: ArrayBufferView, byteOffset = 0) {
    this.device.handle.queue.writeBuffer(
      this.handle,
      byteOffset,
      data.buffer,
      data.byteOffset,
      data.byteLength
    );
  }

  override async readAsync(
    byteOffset: number = 0,
    byteLength: number = this.byteLength
  ): Promise<Uint8Array> {
    // We need MAP_READ flag, but only COPY_DST buffers can have MAP_READ flag, so we need to create a temp buffer
    const tempBuffer = new WebGPUBuffer(this.device, {
      usage: Buffer.MAP_READ | Buffer.COPY_DST,
      byteLength
    });

    // Now do a GPU-side copy into the temp buffer we can actually read.
    // TODO - we are spinning up an independent command queue here, what does this mean
    const commandEncoder = this.device.handle.createCommandEncoder();
    commandEncoder.copyBufferToBuffer(this.handle, byteOffset, tempBuffer.handle, 0, byteLength);
    this.device.handle.queue.submit([commandEncoder.finish()]);

    // Map the temp buffer and read the data.
    await tempBuffer.handle.mapAsync(GPUMapMode.READ, byteOffset, byteLength);
    const arrayBuffer = tempBuffer.handle.getMappedRange().slice(0);
    tempBuffer.handle.unmap();
    tempBuffer.destroy();

    return new Uint8Array(arrayBuffer);
  }

  _writeMapped<TypedArray>(typedArray: TypedArray): void {
    const arrayBuffer = this.handle.getMappedRange();
    // @ts-expect-error
    new typedArray.constructor(arrayBuffer).set(typedArray);
  }

  // WEBGPU API

  mapAsync(mode: number, offset: number = 0, size?: number): Promise<void> {
    return this.handle.mapAsync(mode, offset, size);
  }

  getMappedRange(offset: number = 0, size?: number): ArrayBuffer {
    return this.handle.getMappedRange(offset, size);
  }

  unmap(): void {
    this.handle.unmap();
  }
}

/*
// Convenience API
  /** Read data from the buffer *
  async readAsync(options: {
    byteOffset?: number,
    byteLength?: number,
    map?: boolean,
    unmap?: boolean
  }): Promise<ArrayBuffer> {
    if (options.map ?? true) {
      await this.mapAsync(Buffer.MAP_READ, options.byteOffset, options.byteLength);
    }
    const arrayBuffer = this.getMappedRange(options.byteOffset, options.byteLength);
    if (options.unmap ?? true) {
      this.unmap();
    }
    return arrayBuffer;
  }

  /** Write data to the buffer *
  async writeAsync(options: {
    data: ArrayBuffer,
    byteOffset?: number,
    byteLength?: number,
    map?: boolean,
    unmap?: boolean
  }): Promise<void> {
    if (options.map ?? true) {
      await this.mapAsync(Buffer.MAP_WRITE, options.byteOffset, options.byteLength);
    }
    const arrayBuffer = this.getMappedRange(options.byteOffset, options.byteLength);
    const destArray = new Uint8Array(arrayBuffer);
    const srcArray = new Uint8Array(options.data);
    destArray.set(srcArray);
    if (options.unmap ?? true) {
      this.unmap();
    }
  }
  */

// Mapped API (WebGPU)

/** Maps the memory so that it can be read *
  // abstract mapAsync(mode, byteOffset, byteLength): Promise<void>

  /** Get the mapped range of data for reading or writing *
  // abstract getMappedRange(byteOffset, byteLength): ArrayBuffer;

  /** unmap makes the contents of the buffer available to the GPU again *
  // abstract unmap(): void;
*/
