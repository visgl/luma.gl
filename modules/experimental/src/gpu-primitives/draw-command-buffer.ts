// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Device, type RenderPass} from '@luma.gl/core';
import {GPUData} from '@luma.gl/tables';

const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;
const DRAW_RECORD_WORDS = 4;
const DRAW_INDEXED_RECORD_WORDS = 5;

export type DrawCommand = {
  vertexCount: number;
  instanceCount?: number;
  firstVertex?: number;
  firstInstance?: number;
};

export type DrawIndexedCommand = {
  indexCount: number;
  instanceCount?: number;
  firstIndex?: number;
  baseVertex?: number;
  firstInstance?: number;
};

export type DrawCommandBufferProps = {
  id?: string;
  type: 'draw' | 'draw-indexed';
  capacity?: number;
  commands?: DrawCommand[] | DrawIndexedCommand[];
  buffer?: Buffer;
  ownsBuffer?: boolean;
};

/** Typed owner or borrower of WebGPU indirect draw records. */
export class DrawCommandBuffer {
  readonly device: Device;
  readonly id: string;
  readonly type: 'draw' | 'draw-indexed';
  readonly capacity: number;
  readonly recordByteLength: number;
  readonly buffer: Buffer;
  private ownsBuffer: boolean;
  private destroyed = false;

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

  getCommandByteOffset(commandIndex: number): number {
    this.validateCommandIndex(commandIndex);
    return commandIndex * this.recordByteLength;
  }

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

function setUint32(view: DataView, byteOffset: number, value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0 || value > 0xffffffff) {
    throw new Error(`DrawCommandBuffer ${name} must be a uint32 value`);
  }
  view.setUint32(byteOffset, value, true);
}

function setInt32(view: DataView, byteOffset: number, value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < -0x80000000 || value > 0x7fffffff) {
    throw new Error(`DrawCommandBuffer ${name} must be an int32 value`);
  }
  view.setInt32(byteOffset, value, true);
}
