// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {GPUCommandGraph, GraphDataView, type GraphBufferHandle} from './gpu-command-graph';

/** Scalar formats supported by the initial packed value arena. */
export type GPUValueFormat = 'float32' | 'uint32' | 'sint32';

/** Default logical capacity. 16 KiB = 4096 packed 32-bit values. */
export const DEFAULT_GPU_VALUE_ARENA_BYTE_LENGTH = 16 * 1024;

/** One typed logical value declared in a graph's value arena. */
export type GPUValueSlot<T extends GPUValueFormat = GPUValueFormat> = {
  /** Human-readable slot identifier. */
  id: string;
  /** Stored scalar format. */
  format: T;
  /** Byte offset inside the packed arena. Stable for the graph lifetime. */
  byteOffset: number;
};

const GRAPH_VALUE_ARENAS = new WeakMap<object, GPUValueArena>();

/** Returns the singleton packed value arena associated with a command graph. */
export function getGPUValueArena<Parameters>(graph: GPUCommandGraph<Parameters>): GPUValueArena {
  const key = graph as unknown as object;
  let arena = GRAPH_VALUE_ARENAS.get(key);
  if (!arena) {
    arena = new GPUValueArena(graph);
    GRAPH_VALUE_ARENAS.set(key, arena);
  }
  return arena;
}

/**
 * Graph-owned packed storage for small GPU-produced values.
 *
 * The arena creates one logical transient buffer handle during graph construction. Algorithms may
 * allocate stable typed slots and declare that handle as a resource immediately. No contributor
 * seals or materializes the arena: the normal command-graph compiler allocates the physical buffer
 * together with every other transient resource.
 *
 * A modest fixed logical capacity intentionally trades a few KiB for simple stable addresses and
 * avoids introducing mutable/deferred buffer descriptors into the graph resource model.
 */
export class GPUValueArena {
  readonly id: string;
  readonly graph: GPUCommandGraph<unknown>;
  /** Single logical transient buffer shared by every arena value. */
  readonly buffer: GraphBufferHandle;
  /** Logical capacity of the shared buffer. */
  readonly capacityByteLength: number;

  private nextByteOffset = 0;
  private readonly slots = new Map<string, GPUValueSlot>();
  private readonly views = new Map<string, GraphDataView>();

  /** @internal Use {@link getGPUValueArena} so a graph has one default arena. */
  constructor<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    id = 'gpu-value-arena',
    capacityByteLength = DEFAULT_GPU_VALUE_ARENA_BYTE_LENGTH
  ) {
    this.id = id;
    this.graph = graph as unknown as GPUCommandGraph<unknown>;
    if (!Number.isSafeInteger(capacityByteLength) || capacityByteLength <= 0 || capacityByteLength % 4 !== 0) {
      throw new Error(`${this.id} capacityByteLength must be a positive multiple of 4`);
    }
    this.capacityByteLength = capacityByteLength;
    this.buffer = graph.createTransientBuffer({
      id: `${this.id}-buffer`,
      byteLength: capacityByteLength,
      usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
    });
  }

  /** Declares one packed 32-bit logical value with a stable graph-lifetime offset. */
  allocate<T extends GPUValueFormat>(id: string, format: T): GPUValueSlot<T> {
    if (!id) throw new Error(`${this.id} slot id must not be empty`);
    if (this.slots.has(id)) throw new Error(`${this.id} slot "${id}" already exists`);
    if (!['float32', 'uint32', 'sint32'].includes(format)) {
      throw new Error(`${this.id} unsupported slot format ${format}`);
    }
    if (this.nextByteOffset + 4 > this.capacityByteLength) {
      throw new Error(`${this.id} capacity exceeded while allocating "${id}"`);
    }

    const slot: GPUValueSlot<T> = Object.freeze({id, format, byteOffset: this.nextByteOffset});
    this.nextByteOffset += 4;
    this.slots.set(id, slot);
    this.views.set(
      id,
      new GraphDataView(this.buffer, {
        format,
        length: 1,
        byteOffset: slot.byteOffset,
        byteStride: 4,
        rowByteLength: 4
      })
    );
    return slot;
  }

  /** Returns an allocated logical value by id. */
  get(id: string): GPUValueSlot | undefined {
    return this.slots.get(id);
  }

  /** Returns the typed one-row graph view for an allocated slot. */
  getView<T extends GPUValueFormat>(slot: GPUValueSlot<T>): GraphDataView<T> {
    const view = this.views.get(slot.id);
    if (!view) throw new Error(`${this.id} does not contain slot "${slot.id}"`);
    return view as GraphDataView<T>;
  }

  /** Number of bytes occupied by declared logical values. */
  get byteLength(): number {
    return this.nextByteOffset;
  }

  /** Number of declared logical values. */
  get size(): number {
    return this.slots.size;
  }

  /** Remaining logical capacity. */
  get availableByteLength(): number {
    return this.capacityByteLength - this.nextByteOffset;
  }
}
