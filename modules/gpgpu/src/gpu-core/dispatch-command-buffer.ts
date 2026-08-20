// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUData} from '@luma.gl/gpgpu/gpu-data';

const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;
const DISPATCH_RECORD_WORDS = 3;

/** CPU description of one WebGPU `dispatchWorkgroupsIndirect` record. */
export type DispatchCommand = {
  /** Workgroup count in the X dimension. */
  x: number;
  /** Workgroup count in the Y dimension. Defaults to `1`. */
  y?: number;
  /** Workgroup count in the Z dimension. Defaults to `1`. */
  z?: number;
};

/** Properties for one typed WebGPU indirect-dispatch buffer. */
export type DispatchCommandBufferProps = {
  /** Buffer identifier. */
  id?: string;
  /** Record capacity. Defaults to `commands.length`. */
  capacity?: number;
  /** Optional initial CPU records. Unspecified capacity slots are zero-filled. */
  commands?: DispatchCommand[];
  /** Optional compatible caller-supplied buffer. */
  buffer?: Buffer;
  /** Whether `destroy()` should destroy a supplied buffer. Defaults to `false`. */
  ownsBuffer?: boolean;
};

/** Typed owner or borrower of GPU-writable WebGPU indirect-dispatch records. */
export class DispatchCommandBuffer {
  /** Byte size of one indirect dispatch record. */
  static readonly recordByteLength = DISPATCH_RECORD_WORDS * UINT32_BYTE_LENGTH;

  /** WebGPU device owning the backing buffer. */
  readonly device: Device;
  /** Buffer identifier. */
  readonly id: string;
  /** Maximum record count. */
  readonly capacity: number;
  /** Concrete storage/indirect buffer. */
  readonly buffer: Buffer;
  private ownsBuffer: boolean;
  private destroyed = false;

  /** Creates or adopts an indirect-dispatch buffer and optionally uploads initial records. */
  constructor(device: Device, props: DispatchCommandBufferProps) {
    if (device.type !== 'webgpu') {
      throw new Error('DispatchCommandBuffer requires a WebGPU device');
    }
    const commands = props.commands ?? [];
    const capacity = props.capacity ?? commands.length;
    if (!Number.isSafeInteger(capacity) || capacity < 1) {
      throw new Error('DispatchCommandBuffer capacity must be a positive safe integer');
    }
    if (commands.length > capacity) {
      throw new Error('DispatchCommandBuffer commands exceed capacity');
    }

    this.device = device;
    this.id = props.id ?? 'dispatch-command-buffer';
    this.capacity = capacity;
    const byteLength = capacity * DispatchCommandBuffer.recordByteLength;
    const requiredUsage = Buffer.STORAGE | Buffer.INDIRECT | Buffer.COPY_DST | Buffer.COPY_SRC;

    if (props.buffer) {
      if (props.buffer.device !== device) {
        throw new Error('DispatchCommandBuffer buffer must belong to the supplied device');
      }
      if (props.buffer.byteLength < byteLength) {
        throw new Error('DispatchCommandBuffer buffer is smaller than capacity');
      }
      if ((props.buffer.usage & requiredUsage) !== requiredUsage) {
        throw new Error(
          'DispatchCommandBuffer buffer requires STORAGE, INDIRECT, COPY_DST, and COPY_SRC usage'
        );
      }
      this.buffer = props.buffer;
      this.ownsBuffer = props.ownsBuffer ?? false;
      if (commands.length > 0) {
        this.buffer.write(makeDispatchCommandData(capacity, commands));
      }
    } else {
      this.buffer = device.createBuffer({
        id: this.id,
        byteLength,
        usage: requiredUsage
      });
      this.buffer.write(makeDispatchCommandData(capacity, commands));
      this.ownsBuffer = true;
    }
  }

  /** Returns the byte offset of one indirect record after validating its index. */
  getCommandByteOffset(commandIndex: number): number {
    this.validateCommandIndex(commandIndex);
    return commandIndex * DispatchCommandBuffer.recordByteLength;
  }

  /** Returns a borrowed table view over one complete three-word dispatch record. */
  getCommandData(commandIndex: number): GPUData<'uint32'> {
    return new GPUData({
      buffer: this.buffer,
      format: 'uint32',
      length: DISPATCH_RECORD_WORDS,
      byteOffset: this.getCommandByteOffset(commandIndex),
      byteStride: UINT32_BYTE_LENGTH,
      rowByteLength: UINT32_BYTE_LENGTH,
      ownsBuffer: false
    });
  }

  /** Releases the backing buffer only when this wrapper owns it. */
  destroy(): void {
    if (this.destroyed) {
      return;
    }
    if (this.ownsBuffer) {
      this.buffer.destroy();
      this.ownsBuffer = false;
    }
    this.destroyed = true;
  }

  private validateCommandIndex(commandIndex: number): void {
    if (!Number.isSafeInteger(commandIndex) || commandIndex < 0 || commandIndex >= this.capacity) {
      throw new Error(`DispatchCommandBuffer command index ${commandIndex} is out of range`);
    }
  }
}

/** Encodes validated CPU command descriptions into little-endian WebGPU indirect records. */
function makeDispatchCommandData(capacity: number, commands: DispatchCommand[]): Uint32Array {
  const data = new Uint32Array(capacity * DISPATCH_RECORD_WORDS);
  commands.forEach((command, commandIndex) => {
    const wordOffset = commandIndex * DISPATCH_RECORD_WORDS;
    data[wordOffset] = validateUint32(command.x, 'x');
    data[wordOffset + 1] = validateUint32(command.y ?? 1, 'y');
    data[wordOffset + 2] = validateUint32(command.z ?? 1, 'z');
  });
  return data;
}

/** Validates one unsigned indirect-record component. */
function validateUint32(value: number, name: string): number {
  if (!Number.isSafeInteger(value) || value < 0 || value > 0xffffffff) {
    throw new Error(`DispatchCommandBuffer ${name} must be a uint32 value`);
  }
  return value;
}
