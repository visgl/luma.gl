// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type CommandEncoder, type Device} from '@luma.gl/core';

/** Construction properties for {@link GPUReadbackRing}. */
export type GPUReadbackRingProps = {
  /** Prefix for the staging-buffer IDs. */
  id?: string;
  /** Capacity of every staging buffer, in bytes. Must be a positive multiple of four. */
  byteLength: number;
  /** Number of independently reusable staging buffers. Defaults to three. */
  slotCount?: number;
};

type GPUReadbackTicketState = 'reserved' | 'encoded' | 'reading' | 'released';

/**
 * One exclusive reservation in a {@link GPUReadbackRing}.
 *
 * A ticket may record one copy, or expose its buffer to another encoder and call `markEncoded()`.
 * The application submits the encoder before calling `read()`. A slot is returned to the ring only
 * after mapping finishes, so a mapped or in-flight staging buffer is never reused.
 */
export class GPUReadbackTicket {
  /** Caller-visible staging buffer for graph imports and texture-to-buffer copies. */
  readonly buffer: Buffer;

  private readonly ring: GPUReadbackRing;
  private state: GPUReadbackTicketState = 'reserved';
  private copiedByteOffset = 0;
  private copiedByteLength: number;
  private cancelled = false;

  /** @internal */
  constructor(ring: GPUReadbackRing, buffer: Buffer) {
    this.ring = ring;
    this.buffer = buffer;
    this.copiedByteLength = buffer.byteLength;
  }

  /** Records a buffer copy into this ticket without submitting the command encoder. */
  copyFrom(
    commandEncoder: CommandEncoder,
    sourceBuffer: Buffer,
    options: {sourceOffset?: number; destinationOffset?: number; byteLength?: number} = {}
  ): void {
    this.assertReserved();
    const sourceOffset = options.sourceOffset ?? 0;
    const destinationOffset = options.destinationOffset ?? 0;
    const byteLength = options.byteLength ?? sourceBuffer.byteLength - sourceOffset;
    validateCopyRange(sourceBuffer, this.buffer, sourceOffset, destinationOffset, byteLength);
    commandEncoder.copyBufferToBuffer({
      sourceBuffer,
      sourceOffset,
      destinationBuffer: this.buffer,
      destinationOffset,
      size: byteLength
    });
    this.copiedByteOffset = destinationOffset;
    this.copiedByteLength = byteLength;
    this.state = 'encoded';
  }

  /**
   * Marks a copy encoded by another abstraction, such as a command graph texture-copy node.
   */
  markEncoded(options: {byteOffset?: number; byteLength?: number} = {}): void {
    this.assertReserved();
    const byteOffset = options.byteOffset ?? 0;
    const byteLength = options.byteLength ?? this.buffer.byteLength - byteOffset;
    validateAlignedRange(this.buffer.byteLength, byteOffset, byteLength, 'readback');
    this.copiedByteOffset = byteOffset;
    this.copiedByteLength = byteLength;
    this.state = 'encoded';
  }

  /**
   * Maps and copies the encoded bytes after the application submits its command encoder.
   *
   * Mapping errors, including device loss, release the slot before they are rethrown.
   */
  async read(): Promise<Uint8Array> {
    if (this.state !== 'encoded') {
      throw new Error('GPU readback ticket must be encoded before reading');
    }
    this.state = 'reading';
    try {
      const data = await this.buffer.readAsync(this.copiedByteOffset, this.copiedByteLength);
      if (this.cancelled) {
        throw new Error('GPU readback ticket was cancelled');
      }
      return data;
    } finally {
      this.release();
    }
  }

  /**
   * Cancels an unused reservation, or discards a read already in progress.
   *
   * An encoded ticket cannot be released safely until its submitted copy finishes; start `read()`
   * first, then cancel it when its value is no longer needed.
   */
  cancel(): void {
    if (this.state === 'reserved') {
      this.cancelled = true;
      this.release();
      return;
    }
    if (this.state === 'reading') {
      this.cancelled = true;
      return;
    }
    if (this.state === 'encoded') {
      throw new Error('Start reading an encoded GPU readback ticket before cancelling it');
    }
  }

  private assertReserved(): void {
    if (this.state !== 'reserved') {
      throw new Error('GPU readback ticket has already been used');
    }
  }

  private release(): void {
    if (this.state !== 'released') {
      this.state = 'released';
      this.ring.release(this.buffer);
    }
  }
}

/**
 * Fixed-capacity ring of reusable asynchronous GPU-to-CPU staging buffers.
 *
 * `tryAcquire()` makes drop-on-pressure policy explicit. `acquire()` instead waits for the next
 * completed slot. Neither path submits commands or hides queue synchronization.
 */
export class GPUReadbackRing {
  /** Capacity of every staging buffer, in bytes. */
  readonly byteLength: number;
  /** Total number of staging slots. */
  readonly slotCount: number;

  private readonly buffers: Buffer[];
  private readonly availableBuffers: Buffer[];
  private readonly waiters: Array<{
    resolve: (ticket: GPUReadbackTicket) => void;
    reject: (error: Error) => void;
  }> = [];
  private destroyed = false;

  constructor(device: Device, props: GPUReadbackRingProps) {
    const slotCount = props.slotCount ?? 3;
    validateAlignedRange(Number.MAX_SAFE_INTEGER, 0, props.byteLength, 'ring');
    if (!Number.isSafeInteger(slotCount) || slotCount <= 0) {
      throw new Error('GPUReadbackRing slotCount must be a positive integer');
    }
    this.byteLength = props.byteLength;
    this.slotCount = slotCount;
    const id = props.id ?? 'gpu-readback-ring';
    this.buffers = Array.from({length: slotCount}, (_, slotIndex) =>
      device.createBuffer({
        id: `${id}-slot-${slotIndex}`,
        byteLength: props.byteLength,
        usage: Buffer.COPY_DST | Buffer.MAP_READ
      })
    );
    this.availableBuffers = [...this.buffers];
    void device.lost.then(() => this.destroy());
  }

  /** Number of slots that can be reserved immediately. */
  get availableSlotCount(): number {
    return this.availableBuffers.length;
  }

  /** Reserves a slot immediately, or returns `null` when the ring is under backpressure. */
  tryAcquire(): GPUReadbackTicket | null {
    if (this.destroyed) {
      return null;
    }
    const buffer = this.availableBuffers.shift();
    return buffer ? new GPUReadbackTicket(this, buffer) : null;
  }

  /** Waits for and reserves the next available slot. */
  acquire(): Promise<GPUReadbackTicket> {
    const ticket = this.tryAcquire();
    if (ticket) {
      return Promise.resolve(ticket);
    }
    if (this.destroyed) {
      return Promise.reject(new Error('GPUReadbackRing has been destroyed'));
    }
    return new Promise((resolve, reject) => this.waiters.push({resolve, reject}));
  }

  /** Rejects pending waiters and destroys idle slots; active slots are destroyed on release. */
  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    for (const waiter of this.waiters.splice(0)) {
      waiter.reject(new Error('GPUReadbackRing has been destroyed'));
    }
    for (const buffer of this.availableBuffers.splice(0)) {
      buffer.destroy();
    }
  }

  /** @internal */
  release(buffer: Buffer): void {
    if (this.destroyed) {
      buffer.destroy();
      return;
    }
    const waiter = this.waiters.shift();
    if (waiter) {
      waiter.resolve(new GPUReadbackTicket(this, buffer));
    } else {
      this.availableBuffers.push(buffer);
    }
  }
}

function validateCopyRange(
  sourceBuffer: Buffer,
  destinationBuffer: Buffer,
  sourceOffset: number,
  destinationOffset: number,
  byteLength: number
): void {
  if (sourceBuffer.device !== destinationBuffer.device) {
    throw new Error('GPU readback source and staging buffers must belong to the same device');
  }
  validateAlignedRange(sourceBuffer.byteLength, sourceOffset, byteLength, 'source');
  validateAlignedRange(destinationBuffer.byteLength, destinationOffset, byteLength, 'destination');
}

function validateAlignedRange(
  capacity: number,
  byteOffset: number,
  byteLength: number,
  name: string
): void {
  if (
    !Number.isSafeInteger(byteOffset) ||
    !Number.isSafeInteger(byteLength) ||
    byteOffset < 0 ||
    byteLength <= 0 ||
    byteOffset % 4 !== 0 ||
    byteLength % 4 !== 0 ||
    byteOffset + byteLength > capacity
  ) {
    throw new Error(`${name} byte range must be positive, four-byte aligned, and in bounds`);
  }
}
