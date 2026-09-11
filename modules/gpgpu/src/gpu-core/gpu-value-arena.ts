// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {GPUCommandGraph, GraphDataView, type GraphBufferHandle} from './gpu-command-graph';

/** Scalar formats supported by the initial packed value arena. */
export type GPUValueFormat = 'float32' | 'uint32' | 'sint32';

/** One typed logical value stored inside a {@link GPUValueArena}. */
export type GPUValueSlot<T extends GPUValueFormat = GPUValueFormat> = {
  /** Human-readable slot identifier. */
  id: string;
  /** Stored scalar format. */
  format: T;
  /** Byte offset inside the shared arena buffer. */
  byteOffset: number;
  /** Typed one-row graph view suitable for graph resource declarations/bindings. */
  view: GraphDataView<T>;
};

export type GPUValueArenaProps = {
  /** Graph-wide identifier prefix. */
  id?: string;
  /** Fixed arena capacity. The first implementation uses 4-byte scalar slots. */
  byteLength: number;
};

/**
 * Packed graph-managed storage for small GPU-produced values.
 *
 * The arena owns one transient storage buffer and suballocates typed scalar slots within it. Slots
 * remain logically first-class while sharing one physical graph buffer, avoiding one storage-buffer
 * binding/allocation per scalar value.
 */
export class GPUValueArena {
  readonly id: string;
  readonly graph: GPUCommandGraph<unknown>;
  readonly buffer: GraphBufferHandle;
  readonly byteLength: number;

  private nextByteOffset = 0;
  private readonly slots = new Map<string, GPUValueSlot>();

  constructor<Parameters>(graph: GPUCommandGraph<Parameters>, props: GPUValueArenaProps) {
    this.id = props.id ?? 'gpu-value-arena';
    if (!Number.isInteger(props.byteLength) || props.byteLength <= 0 || props.byteLength % 4 !== 0) {
      throw new Error(`${this.id} byteLength must be a positive multiple of 4`);
    }
    this.graph = graph as unknown as GPUCommandGraph<unknown>;
    this.byteLength = props.byteLength;
    this.buffer = graph.createTransientBuffer({
      id: `${this.id}-buffer`,
      byteLength: this.byteLength,
      usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
    });
  }

  /** Allocates one 32-bit typed slot from the arena. */
  allocate<T extends GPUValueFormat>(id: string, format: T): GPUValueSlot<T> {
    if (!id) throw new Error(`${this.id} slot id must not be empty`);
    if (this.slots.has(id)) throw new Error(`${this.id} slot "${id}" already exists`);
    if (!['float32', 'uint32', 'sint32'].includes(format)) {
      throw new Error(`${this.id} unsupported slot format ${format}`);
    }
    if (this.nextByteOffset + 4 > this.byteLength) {
      throw new Error(`${this.id} capacity exceeded while allocating "${id}"`);
    }

    const byteOffset = this.nextByteOffset;
    this.nextByteOffset += 4;
    const view = new GraphDataView(this.buffer, {
      format,
      length: 1,
      byteOffset,
      byteStride: 4,
      rowByteLength: 4
    });
    const slot: GPUValueSlot<T> = Object.freeze({id, format, byteOffset, view});
    this.slots.set(id, slot);
    return slot;
  }

  /** Returns an allocated slot by id. */
  get(id: string): GPUValueSlot | undefined {
    return this.slots.get(id);
  }

  /** Number of bytes currently assigned to logical values. */
  get usedByteLength(): number {
    return this.nextByteOffset;
  }

  /** Number of bytes still available for additional values. */
  get availableByteLength(): number {
    return this.byteLength - this.nextByteOffset;
  }

  /** Number of allocated logical values. */
  get size(): number {
    return this.slots.size;
  }
}
