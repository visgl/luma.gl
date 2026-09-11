// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {GPUCommandGraph, GraphDataView, type GraphBufferHandle} from './gpu-command-graph';

/** Scalar formats supported by the initial packed value arena. */
export type GPUValueFormat = 'float32' | 'uint32' | 'sint32';

/** One typed logical value declared in a graph's value arena. */
export type GPUValueSlot<T extends GPUValueFormat = GPUValueFormat> = {
  /** Human-readable slot identifier. */
  id: string;
  /** Stored scalar format. */
  format: T;
  /** Byte offset inside the packed arena. Stable once declared. */
  byteOffset: number;
};

/** Physical arena materialized after all logical values have been declared. */
export type GPUValueArenaBinding = {
  /** Shared transient storage buffer containing every declared value. */
  buffer: GraphBufferHandle;
  /** Exact packed arena byte length. */
  byteLength: number;
};

const GRAPH_VALUE_ARENAS = new WeakMap<object, GPUValueArena>();

/**
 * Returns the singleton packed value arena associated with a command graph.
 *
 * Callers declare logical values through the returned arena. Once declarations are complete,
 * {@link GPUValueArena.seal} materializes exactly one graph-owned storage buffer sized to the
 * declared slots.
 */
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
 * The arena has two phases:
 * 1. declaration: algorithms request typed logical slots; offsets are assigned densely;
 * 2. sealing: one exact-size transient storage buffer and typed one-row views are materialized.
 *
 * This keeps logical value count independent of WebGPU storage-buffer binding count while avoiding
 * caller-selected capacity guesses.
 */
export class GPUValueArena {
  readonly id: string;
  readonly graph: GPUCommandGraph<unknown>;

  private nextByteOffset = 0;
  private readonly slots = new Map<string, GPUValueSlot>();
  private readonly views = new Map<string, GraphDataView>();
  private binding: GPUValueArenaBinding | null = null;

  /** @internal Use {@link getGPUValueArena} so a graph has one default arena. */
  constructor<Parameters>(graph: GPUCommandGraph<Parameters>, id = 'gpu-value-arena') {
    this.id = id;
    this.graph = graph as unknown as GPUCommandGraph<unknown>;
  }

  /** Declares one packed 32-bit logical value. Declarations are closed after sealing. */
  allocate<T extends GPUValueFormat>(id: string, format: T): GPUValueSlot<T> {
    if (this.binding) throw new Error(`${this.id} is sealed; no additional values can be allocated`);
    if (!id) throw new Error(`${this.id} slot id must not be empty`);
    if (this.slots.has(id)) throw new Error(`${this.id} slot "${id}" already exists`);
    if (!['float32', 'uint32', 'sint32'].includes(format)) {
      throw new Error(`${this.id} unsupported slot format ${format}`);
    }

    const slot: GPUValueSlot<T> = Object.freeze({
      id,
      format,
      byteOffset: this.nextByteOffset
    });
    this.nextByteOffset += 4;
    this.slots.set(id, slot);
    return slot;
  }

  /**
   * Materializes the graph's exact-size physical arena.
   *
   * Repeated calls return the same binding. At least one value must have been declared.
   */
  seal(): GPUValueArenaBinding {
    if (this.binding) return this.binding;
    if (this.nextByteOffset === 0) {
      throw new Error(`${this.id} cannot be sealed before at least one value is declared`);
    }

    const buffer = this.graph.createTransientBuffer({
      id: `${this.id}-buffer`,
      byteLength: this.nextByteOffset,
      usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
    });

    for (const slot of this.slots.values()) {
      this.views.set(
        slot.id,
        new GraphDataView(buffer, {
          format: slot.format,
          length: 1,
          byteOffset: slot.byteOffset,
          byteStride: 4,
          rowByteLength: 4
        })
      );
    }

    this.binding = Object.freeze({buffer, byteLength: this.nextByteOffset});
    return this.binding;
  }

  /** Returns an allocated logical value by id. */
  get(id: string): GPUValueSlot | undefined {
    return this.slots.get(id);
  }

  /** Returns the one-row graph view for a slot after the arena has been sealed. */
  getView<T extends GPUValueFormat>(slot: GPUValueSlot<T>): GraphDataView<T> {
    if (!this.binding) throw new Error(`${this.id} must be sealed before requesting graph views`);
    const view = this.views.get(slot.id);
    if (!view) throw new Error(`${this.id} does not contain slot "${slot.id}"`);
    return view as GraphDataView<T>;
  }

  /** Exact packed byte length required by all declared values. */
  get byteLength(): number {
    return this.nextByteOffset;
  }

  /** Number of declared logical values. */
  get size(): number {
    return this.slots.size;
  }

  /** Whether the physical graph buffer has been materialized. */
  get sealed(): boolean {
    return this.binding !== null;
  }
}
