// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Device, type RenderPass} from '@luma.gl/core';
import {GPUData} from '@luma.gl/tables';

const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;
const DRAW_RECORD_WORDS = 4;
const DRAW_INDEXED_RECORD_WORDS = 5;

/** CPU description of one WebGPU `drawIndirect` record. */
export type DrawCommand = {
  /** Number of vertices drawn by each instance. */
  vertexCount: number;
  /** Number of instances. Defaults to `1`. */
  instanceCount?: number;
  /** First vertex. Defaults to `0`. */
  firstVertex?: number;
  /** First instance. Defaults to `0`. */
  firstInstance?: number;
};

/** CPU description of one WebGPU `drawIndexedIndirect` record. */
export type DrawIndexedCommand = {
  /** Number of indices drawn by each instance. */
  indexCount: number;
  /** Number of instances. Defaults to `1`. */
  instanceCount?: number;
  /** First index. Defaults to `0`. */
  firstIndex?: number;
  /** Signed vertex offset added to each index. Defaults to `0`. */
  baseVertex?: number;
  /** First instance. Defaults to `0`. */
  firstInstance?: number;
};

/** Properties for one typed WebGPU indirect-command buffer. */
export type DrawCommandBufferProps = {
  /** Buffer identifier. */
  id?: string;
  /** Indirect record layout. */
  type: 'draw' | 'draw-indexed';
  /** Record capacity. Defaults to `commands.length`. */
  capacity?: number;
  /** Optional initial CPU records. Unspecified capacity slots are zero-filled. */
  commands?: DrawCommand[] | DrawIndexedCommand[];
  /** Optional compatible caller-supplied buffer. */
  buffer?: Buffer;
  /** Whether `destroy()` should destroy a supplied buffer. Defaults to `false`. */
  ownsBuffer?: boolean;
};

/**
 * Typed owner or borrower of WebGPU indirect draw records.
 *
 * The backing buffer supports storage, indirect, and copy access so compute primitives can update
 * counts before a render pass consumes the same records.
 */
export class DrawCommandBuffer {
  /** WebGPU device owning the backing buffer. */
  readonly device: Device;
  /** Buffer identifier. */
  readonly id: string;
  /** Indirect record layout. */
  readonly type: 'draw' | 'draw-indexed';
  /** Maximum record count. */
  readonly capacity: number;
  /** Byte size of one indirect record. */
  readonly recordByteLength: number;
  /** Concrete storage/indirect buffer. */
  readonly buffer: Buffer;
  private ownsBuffer: boolean;
  private destroyed = false;

  /**
   * Creates or adopts an indirect-command buffer and optionally uploads initial records.
   *
   * @throws If the device, capacity, initial values, or supplied buffer are incompatible.
   */
  constructor(device: Device, props: DrawCommandBufferProps) {
    if (device.type !== 'webgpu') {
      throw new Error('DrawCommandBuffer requires a WebGPU device');
    }
    const commands = props.commands ?? [];
    const capacity = props.capacity ?? commands.length;
    if (!Number.isSafeInteger(capacity) || capacity < 1) {
      throw new Error('DrawCommandBuffer capacity must be a positive safe integer');
    }
    if (commands.length > capacity) {
      throw new Error('DrawCommandBuffer commands exceed capacity');
    }

    this.device = device;
    this.id = props.id ?? 'draw-command-buffer';
    this.type = props.type;
    this.capacity = capacity;
    this.recordByteLength =
      (props.type === 'draw-indexed' ? DRAW_INDEXED_RECORD_WORDS : DRAW_RECORD_WORDS) *
      UINT32_BYTE_LENGTH;
    const byteLength = capacity * this.recordByteLength;
    const requiredUsage = Buffer.STORAGE | Buffer.INDIRECT | Buffer.COPY_DST | Buffer.COPY_SRC;

    if (props.buffer) {
      if (props.buffer.device !== device) {
        throw new Error('DrawCommandBuffer buffer must belong to the supplied device');
      }
      if (props.buffer.byteLength < byteLength) {
        throw new Error('DrawCommandBuffer buffer is smaller than capacity');
      }
      if ((props.buffer.usage & requiredUsage) !== requiredUsage) {
        throw new Error(
          'DrawCommandBuffer buffer requires STORAGE, INDIRECT, COPY_DST, and COPY_SRC usage'
        );
      }
      this.buffer = props.buffer;
      this.ownsBuffer = props.ownsBuffer ?? false;
      if (commands.length > 0) {
        this.buffer.write(makeCommandData(props.type, capacity, commands));
      }
    } else {
      this.buffer = device.createBuffer({
        id: this.id,
        data: makeCommandData(props.type, capacity, commands),
        usage: requiredUsage
      });
      this.ownsBuffer = true;
    }
  }

  /** Returns the byte offset of one indirect record after validating its index. */
  getCommandByteOffset(commandIndex: number): number {
    this.validateCommandIndex(commandIndex);
    return commandIndex * this.recordByteLength;
  }

  /** Returns the byte offset of one record's GPU-writable `instanceCount` field. */
  getInstanceCountByteOffset(commandIndex: number): number {
    return this.getCommandByteOffset(commandIndex) + UINT32_BYTE_LENGTH;
  }

  /** Returns a borrowed table view over one command's GPU-written instance count. */
  getInstanceCountData(commandIndex: number): GPUData<'uint32'> {
    return new GPUData({
      buffer: this.buffer,
      format: 'uint32',
      length: 1,
      byteOffset: this.getInstanceCountByteOffset(commandIndex),
      byteStride: UINT32_BYTE_LENGTH,
      rowByteLength: UINT32_BYTE_LENGTH,
      ownsBuffer: false
    });
  }

  /** Records one indirect draw from this buffer. */
  draw(renderPass: RenderPass, commandIndex: number): void {
    const byteOffset = this.getCommandByteOffset(commandIndex);
    if (this.type === 'draw-indexed') {
      renderPass.drawIndexedIndirect(this.buffer, byteOffset);
    } else {
      renderPass.drawIndirect(this.buffer, byteOffset);
    }
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
      throw new Error(`DrawCommandBuffer command index ${commandIndex} is out of range`);
    }
  }
}

/** Encodes validated CPU command descriptions into little-endian WebGPU indirect records. */
function makeCommandData(
  type: 'draw' | 'draw-indexed',
  capacity: number,
  commands: DrawCommand[] | DrawIndexedCommand[]
): Uint32Array {
  const recordByteLength =
    (type === 'draw-indexed' ? DRAW_INDEXED_RECORD_WORDS : DRAW_RECORD_WORDS) * UINT32_BYTE_LENGTH;
  const data = new ArrayBuffer(capacity * recordByteLength);
  const view = new DataView(data);
  commands.forEach((command, commandIndex) => {
    const byteOffset = commandIndex * recordByteLength;
    if (type === 'draw-indexed') {
      const indexedCommand = command as DrawIndexedCommand;
      setUint32(view, byteOffset, indexedCommand.indexCount, 'indexCount');
      setUint32(view, byteOffset + 4, indexedCommand.instanceCount ?? 1, 'instanceCount');
      setUint32(view, byteOffset + 8, indexedCommand.firstIndex ?? 0, 'firstIndex');
      setInt32(view, byteOffset + 12, indexedCommand.baseVertex ?? 0, 'baseVertex');
      setUint32(view, byteOffset + 16, indexedCommand.firstInstance ?? 0, 'firstInstance');
    } else {
      const drawCommand = command as DrawCommand;
      setUint32(view, byteOffset, drawCommand.vertexCount, 'vertexCount');
      setUint32(view, byteOffset + 4, drawCommand.instanceCount ?? 1, 'instanceCount');
      setUint32(view, byteOffset + 8, drawCommand.firstVertex ?? 0, 'firstVertex');
      setUint32(view, byteOffset + 12, drawCommand.firstInstance ?? 0, 'firstInstance');
    }
  });
  return new Uint32Array(data);
}

/** Validates and writes one unsigned indirect-record component. */
function setUint32(view: DataView, byteOffset: number, value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0 || value > 0xffffffff) {
    throw new Error(`DrawCommandBuffer ${name} must be a uint32 value`);
  }
  view.setUint32(byteOffset, value, true);
}

/** Validates and writes one signed indirect-record component. */
function setInt32(view: DataView, byteOffset: number, value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < -0x80000000 || value > 0x7fffffff) {
    throw new Error(`DrawCommandBuffer ${name} must be an int32 value`);
  }
  view.setInt32(byteOffset, value, true);
}
