// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GraphDataView} from './gpu-command-graph';
import {getGPUValueArena, type GPUValueArena, type GPUValueFormat, type GPUValueSlot} from './gpu-value-arena';
import type {GPUCommandGraph} from './gpu-command-graph';

/** First-class logical scalar backed by one slot in a graph-owned GPUValueArena. */
export class GPUScalar<T extends GPUValueFormat = GPUValueFormat> {
  readonly id: string;
  readonly format: T;
  readonly arena: GPUValueArena;
  /** @internal Physical slot metadata remains an implementation detail of the arena-backed scalar. */
  readonly slot: GPUValueSlot<T>;

  /** @internal Use {@link createGPUScalar}. */
  constructor(arena: GPUValueArena, slot: GPUValueSlot<T>) {
    this.id = slot.id;
    this.format = slot.format;
    this.arena = arena;
    this.slot = slot;
  }

  /** Stable byte offset assigned during graph construction. */
  get byteOffset(): number {
    return this.slot.byteOffset;
  }

  /** 32-bit word index used by generated WGSL arena accessors. */
  get wordOffset(): number {
    return this.slot.byteOffset >>> 2;
  }

  /** Returns the typed one-row graph view after the owning arena has been sealed. */
  get view(): GraphDataView<T> {
    return this.arena.getView(this.slot);
  }
}

/** Declares one logical GPU-produced scalar in the graph-owned packed value arena. */
export function createGPUScalar<Parameters, T extends GPUValueFormat>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  format: T
): GPUScalar<T> {
  const arena = getGPUValueArena(graph);
  return new GPUScalar(arena, arena.allocate(id, format));
}

/** WGSL type corresponding to one arena scalar format. */
export function getGPUScalarWGSLType(format: GPUValueFormat): 'f32' | 'u32' | 'i32' {
  switch (format) {
    case 'float32': return 'f32';
    case 'uint32': return 'u32';
    case 'sint32': return 'i32';
  }
}

/**
 * Generates one WGSL load expression for a scalar stored in an arena bound as `arenaExpression`.
 * The arena is represented as `array<u32>` so all scalar formats share one physical binding.
 */
export function getGPUScalarWGSLLoad(
  scalar: GPUScalar,
  arenaExpression = 'gpuValues'
): string {
  const word = `${arenaExpression}[${scalar.wordOffset}u]`;
  switch (scalar.format) {
    case 'float32': return `bitcast<f32>(${word})`;
    case 'uint32': return word;
    case 'sint32': return `bitcast<i32>(${word})`;
  }
}

/** Generates one WGSL statement that stores a typed expression into an arena-backed scalar. */
export function getGPUScalarWGSLStore(
  scalar: GPUScalar,
  valueExpression: string,
  arenaExpression = 'gpuValues'
): string {
  const target = `${arenaExpression}[${scalar.wordOffset}u]`;
  switch (scalar.format) {
    case 'float32': return `${target} = bitcast<u32>(${valueExpression});`;
    case 'uint32': return `${target} = ${valueExpression};`;
    case 'sint32': return `${target} = bitcast<u32>(${valueExpression});`;
  }
}

/** Standard WGSL declaration for a read/write packed value arena binding. */
export function getGPUValueArenaWGSLBinding(group: number, binding: number, name = 'gpuValues'): string {
  return `@group(${group}) @binding(${binding}) var<storage, read_write> ${name}: array<u32>;`;
}
