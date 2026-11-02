// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert, Buffer, type CommandEncoder, type Device} from '@luma.gl/core';
import {GPUVector} from '@luma.gl/graph/gpu-data';
import type {GPUGraphVector} from './gpu-graph-value';
import {
  allocateVector,
  getDataBuffer,
  validateVector,
  validateWritableTarget
} from './gpu-graph-vector-utils';

export type GPUGraphStateBindings = Readonly<Record<string, GPUVector>>;
export type GPUGraphStateOptions =
  | {copy?: false; commandEncoder?: never}
  | {copy: true; commandEncoder?: CommandEncoder};

/** One mutable state instance; compiled programs never own its resources. */
export class GPUGraphState {
  readonly values: GPUGraphStateBindings;
  readonly ownsValues: boolean;
  private readonly shapes: readonly {
    name: string;
    format: string;
    length: number;
    chunkLengths: readonly number[];
  }[];
  private activeExecutions = 0;
  private destroyed = false;

  /** @internal Use CompiledGPUGraph.createState(). */
  constructor(
    readonly device: Device,
    private readonly owner: object,
    declarations: readonly GPUGraphVector[],
    bindings: GPUGraphStateBindings,
    options: GPUGraphStateOptions = {}
  ) {
    this.ownsValues = options.copy ?? false;
    for (const name of Object.keys(bindings)) {
      if (!declarations.some(value => value.id === name))
        throw new Error(`Invalid state binding ${name}`);
    }
    for (const declaration of declarations) {
      const value = bindings[declaration.id];
      if (!(value instanceof GPUVector)) throw new Error(`Missing state binding ${declaration.id}`);
      validateVector(
        device,
        value,
        declaration.format,
        declaration.length,
        declaration.chunkLengths
      );
    }
    this.shapes = declarations.map(declaration => {
      const value = bindings[declaration.id];
      return {
        name: declaration.id,
        format: declaration.format,
        length: value.length,
        chunkLengths: value.data.map(chunk => chunk.length)
      };
    });
    const stateValues: Record<string, GPUVector> = Object.create(null);
    try {
      for (const declaration of declarations) {
        const input = bindings[declaration.id];
        stateValues[declaration.id] = this.ownsValues
          ? allocateVector(
              device,
              declaration.id,
              input.data.map(chunk => chunk.length),
              declaration.format
            )
          : input;
      }
      const stateEntries = new Map(Object.entries(stateValues));
      for (const [name, value] of stateEntries) validateWritableTarget(name, value, stateEntries);
      this.values = Object.freeze(stateValues);
      if (options.copy) {
        if (options.commandEncoder) this.encodeReset(options.commandEncoder, bindings);
        else this.reset(bindings);
      }
    } catch (error) {
      if (this.ownsValues) for (const value of Object.values(stateValues)) value.destroy();
      throw error;
    }
  }

  /** Copy a complete set of initial values and submit once; never read back or resize. */
  reset(bindings: GPUGraphStateBindings): void {
    // Submit or abandon prepared executions first. Use encodeReset for ordered composition.
    assert(!this.destroyed && this.activeExecutions === 0);
    const encoder = this.device.createCommandEncoder();
    try {
      this.encodeReset(encoder, bindings);
      this.device.submit(encoder.finish());
    } finally {
      encoder.destroy();
    }
  }

  /** Append a reset to a caller-owned encoder; retain sources and state through submission. */
  encodeReset(commandEncoder: CommandEncoder, bindings: GPUGraphStateBindings): void {
    // A reset and its state must belong to the same live device.
    assert(!this.destroyed && commandEncoder.device === this.device);
    this.validateBindings(this.values);
    this.validateBindings(bindings);
    const destinations = new Set(
      Object.values(this.values).flatMap(value =>
        value.data.filter(chunk => chunk.length).map(getDataBuffer)
      )
    );
    // Validate every source before encoding anything, including cross-name aliases.
    for (const [name, source] of Object.entries(bindings)) {
      for (const [index, chunk] of source.data.entries()) {
        if (!chunk.length) continue;
        const sourceBuffer = getDataBuffer(chunk);
        const destinationBuffer = getDataBuffer(this.values[name].data[index]);
        // Resets need copy usage and distinct source/destination storage; snapshots are explicit.
        assert(!destinations.has(sourceBuffer));
        assert(
          Boolean(sourceBuffer.usage & Buffer.COPY_SRC) &&
            Boolean(destinationBuffer.usage & Buffer.COPY_DST)
        );
      }
    }
    for (const [name, source] of Object.entries(bindings)) {
      for (const [index, chunk] of source.data.entries()) {
        if (!chunk.length) continue;
        const destination = this.values[name].data[index];
        commandEncoder.copyBufferToBuffer({
          sourceBuffer: getDataBuffer(chunk),
          sourceOffset: chunk.byteOffset,
          destinationBuffer: getDataBuffer(destination),
          destinationOffset: destination.byteOffset,
          size: chunk.length * chunk.rowByteLength
        });
      }
    }
  }

  /** Destroy owned copies only, after all prepared executions and submissions using them. */
  destroy(): void {
    if (this.destroyed) return;
    // Prepared executions retain state until their own cleanup after submission or cancellation.
    assert(this.activeExecutions === 0);
    this.destroyed = true;
    if (this.ownsValues) for (const value of Object.values(this.values)) value.destroy();
  }

  /** @internal */
  getBindings(owner: object): GPUGraphStateBindings {
    // State belongs to the compiled program that created it, even when declarations match.
    assert(!this.destroyed && owner === this.owner);
    this.validateBindings(this.values);
    return this.values;
  }

  /** @internal */
  retain(owner: object): () => void {
    assert(!this.destroyed && owner === this.owner);
    this.activeExecutions++;
    return () => {
      this.activeExecutions--;
    };
  }

  private validateBindings(bindings: GPUGraphStateBindings): void {
    for (const name of Object.keys(bindings)) {
      if (!this.shapes.some(shape => shape.name === name))
        throw new Error(`Invalid state binding ${name}`);
    }
    for (const shape of this.shapes) {
      const value = bindings[shape.name];
      if (!(value instanceof GPUVector)) throw new Error(`Missing state binding ${shape.name}`);
      validateVector(this.device, value, shape.format, shape.length, shape.chunkLengths);
    }
  }
}
