// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {log, Buffer, type BufferProps, type BufferMapCallback} from '@luma.gl/core';
import {type WebGPUDevice} from '../webgpu-device';

export class WebGPUBuffer extends Buffer {
  readonly device: WebGPUDevice;
  readonly handle: GPUBuffer;
  readonly byteLength: number;

  constructor(device: WebGPUDevice, props: BufferProps) {
    super(device, props);
    this.device = device;

    this.byteLength = props.byteLength || props.data?.byteLength || 0;
    const mappedAtCreation = Boolean(this.props.onMapped || props.data);

    // WebGPU buffers must be aligned to 4 bytes
    const size = Math.ceil(this.byteLength / 4) * 4;

    this.device.pushErrorScope('out-of-memory');
    this.device.pushErrorScope('validation');
    this.handle =
      this.props.handle ||
      this.device.handle.createBuffer({
        label: this.props.id,
        // usage defaults to vertex
        usage: this.props.usage || GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation,
        size
      });
    this.device.popErrorScope((error: GPUError) => {
      this.device.reportError(new Error(`${this} creation failed ${error.message}`), this)();
      this.device.debug();
    });
    this.device.popErrorScope((error: GPUError) => {
      this.device.reportError(new Error(`${this} out of memory: ${error.message}`), this)();
      this.device.debug();
    });

    this.device.pushErrorScope('validation');
    if (props.data || props.onMapped) {
      try {
        const arrayBuffer = this.handle.getMappedRange();
        if (props.data) {
          const typedArray = props.data;
          // @ts-expect-error
          new typedArray.constructor(arrayBuffer).set(typedArray);
        } else {
          props.onMapped?.(arrayBuffer, 'mapped');
        }
      } finally {
        this.handle.unmap();
      }
    }
    this.device.popErrorScope((error: GPUError) => {
      this.device.reportError(new Error(`${this} creation failed ${error.message}`), this)();
      this.device.debug();
    });
  }

  override destroy(): void {
    this.handle?.destroy();
    // @ts-expect-error readonly
    this.handle = null;
  }

  write(data: ArrayBufferLike | ArrayBufferView | SharedArrayBuffer, byteOffset = 0) {
    const arrayBuffer = ArrayBuffer.isView(data) ? data.buffer : data;
    const dataByteOffset = ArrayBuffer.isView(data) ? data.byteOffset : 0;

    this.device.pushErrorScope('validation');

    // WebGPU provides multiple ways to write a buffer, this is the simplest API
    this.device.handle.queue.writeBuffer(
      this.handle,
      byteOffset,
      arrayBuffer,
      dataByteOffset,
      data.byteLength
    );
    this.device.popErrorScope((error: GPUError) => {
      this.device.reportError(new Error(`${this}.write() ${error.message}`), this)();
      this.device.debug();
    });
  }

  async mapAndWriteAsync(
    callback: BufferMapCallback<void>,
    byteOffset: number = 0,
    byteLength: number = this.byteLength - byteOffset
  ): Promise<void> {
    // Unless the application created and supplied a mappable buffer, a staging buffer is needed
    const isMappable = (this.usage & Buffer.MAP_WRITE) === 0;
    const mappableBuffer: WebGPUBuffer | null = !isMappable
      ? this._getMappableBuffer(Buffer.MAP_WRITE | Buffer.COPY_SRC, 0, this.byteLength)
      : null;

    const writeBuffer = mappableBuffer || this;

    // const isWritable = this.usage & Buffer.MAP_WRITE;
    // Map the temp buffer and read the data.
    this.device.pushErrorScope('validation');
    try {
      await this.device.handle.queue.onSubmittedWorkDone();
      await writeBuffer.handle.mapAsync(GPUMapMode.WRITE, byteOffset, byteLength);
      const arrayBuffer = writeBuffer.handle.getMappedRange(byteOffset, byteLength);
      // eslint-disable-next-line @typescript-eslint/await-thenable
      await callback(arrayBuffer, 'mapped');
      writeBuffer.handle.unmap();
      if (mappableBuffer) {
        this._copyBuffer(mappableBuffer);
      }
    } finally {
      this.device.popErrorScope((error: GPUError) => {
        this.device.reportError(new Error(`${this}.mapAndWriteAsync() ${error.message}`), this)();
        this.device.debug();
      });
      mappableBuffer?.destroy();
    }
  }

  async readAsync(
    byteOffset: number = 0,
    byteLength = this.byteLength - byteOffset
  ): Promise<Uint8Array> {
    return this.mapAndReadAsync(
      arrayBuffer => new Uint8Array(arrayBuffer.slice(0)),
      byteOffset,
      byteLength
    );
  }

  async mapAndReadAsync<T>(
    callback: BufferMapCallback<T>,
    byteOffset = 0,
    byteLength = this.byteLength - byteOffset
  ): Promise<T> {
    if (byteOffset % 8 !== 0 || byteLength % 4 !== 0) {
      throw new Error('byteOffset must be multiple of 8 and byteLength multiple of 4');
    }
    if (byteOffset + byteLength > this.handle.size) {
      throw new Error('Mapping range exceeds buffer size');
    }

    // Unless the application created and supplied a mappable buffer, a staging buffer is needed
    const isMappable = (this.usage & Buffer.MAP_READ) === 0;
    const mappableBuffer: WebGPUBuffer | null = !isMappable
      ? this._getMappableBuffer(Buffer.MAP_READ | Buffer.COPY_DST, 0, this.byteLength)
      : null;

    const readBuffer = mappableBuffer || this;

    // Map the temp buffer and read the data.
    this.device.pushErrorScope('validation');
    try {
      await this.device.handle.queue.onSubmittedWorkDone();
      await readBuffer.handle.mapAsync(GPUMapMode.READ, byteOffset, byteLength);
      if (mappableBuffer) {
        mappableBuffer._copyBuffer(this);
      }
      const arrayBuffer = readBuffer.handle.getMappedRange(byteOffset, byteLength);
      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await callback(arrayBuffer, 'mapped');
      readBuffer.handle.unmap();
      return result;
    } finally {
      this.device.popErrorScope((error: GPUError) => {
        this.device.reportError(new Error(`${this}.mapAndReadAsync() ${error.message}`), this)();
        this.device.debug();
      });
      mappableBuffer?.destroy();
    }
  }

  readSyncWebGL(byteOffset?: number, byteLength?: number): Uint8Array<ArrayBuffer> {
    throw new Error('Not implemented');
  }

  // INTERNAL METHODS

  /**
   * @todo - A small set of mappable buffers could be cached on the device,
   * however this goes against the goal of keeping core as a thin GPU API layer.
   */
  protected _getMappableBuffer(
    usage: number, // Buffer.MAP_READ | Buffer.MAP_WRITE,
    byteOffset: number,
    byteLength: number
  ): WebGPUBuffer {
    log.warn(`${this} is not readable, creating a temporary Buffer`);
    const readableBuffer = new WebGPUBuffer(this.device, {usage, byteLength});

    return readableBuffer;
  }

  protected _copyBuffer(
    sourceBuffer: WebGPUBuffer,
    byteOffset: number = 0,
    byteLength: number = this.byteLength
  ) {
    // Now do a GPU-side copy into the temp buffer we can actually read.
    // TODO - we are spinning up an independent command queue here, what does this mean
    this.device.pushErrorScope('validation');
    const commandEncoder = this.device.handle.createCommandEncoder();
    commandEncoder.copyBufferToBuffer(sourceBuffer.handle, byteOffset, this.handle, 0, byteLength);
    this.device.handle.queue.submit([commandEncoder.finish()]);
    this.device.popErrorScope((error: GPUError) => {
      this.device.reportError(new Error(`${this}._getReadableBuffer() ${error.message}`), this)();
      this.device.debug();
    });
  }
}
