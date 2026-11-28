// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {CompiledGPUCommandGraph} from '@luma.gl/graph/gpu-core';

/** A retained executable and its optional contributor cleanup. */
type ChunkExecution = {graph: CompiledGPUCommandGraph<void>; destroy?: () => void};

/** Validates dirty indices and retains reusable graphs for a fixed physical chunk layout. */
export class MaterializedProjectionChunks {
  private readonly executions = new Map<string, ChunkExecution>();
  private destroyed = false;

  constructor(
    private readonly device: Device,
    private readonly lengths: readonly number[],
    private readonly createExecution: (indices: readonly number[]) => ChunkExecution,
    private readonly groupChunks = false
  ) {}

  /** Submits the selected nonempty chunks in one command buffer. */
  update(indices: readonly number[] = this.lengths.map((_, index) => index)): void {
    if (this.destroyed) throw new Error('Materialized projection source is destroyed');
    const dirty = [...new Set(indices)].sort((first, second) => first - second);
    for (const index of dirty) {
      if (!Number.isSafeInteger(index) || index < 0 || index >= this.lengths.length) {
        throw new Error(`Invalid projection chunk index ${index}`);
      }
    }
    const nonempty = dirty.filter(index => this.lengths[index]);
    if (!nonempty.length) return;
    const executions: ChunkExecution[] = [];
    for (let offset = 0; offset < nonempty.length; offset++) {
      const first = nonempty[offset];
      const second = nonempty[offset + 1];
      const pair = this.groupChunks && second === first + 1;
      const key = pair ? `${first}-${second}` : String(first);
      let execution = this.executions.get(key);
      if (!execution) {
        execution = this.createExecution(pair ? [first, second] : [first]);
        this.executions.set(key, execution);
      }
      executions.push(execution);
      if (pair) offset++;
    }
    const encoder = this.device.createCommandEncoder({id: 'update-materialized-projection'});
    let commandBuffer;
    try {
      for (const {graph} of executions) graph.encode(encoder, {parameters: undefined});
      commandBuffer = encoder.finish();
    } catch (error) {
      encoder.destroy();
      throw error;
    }
    this.device.submit(commandBuffer);
  }

  /** Releases graphs and parameters after submitted work completes. */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    for (const {graph, destroy} of this.executions.values()) {
      graph.destroy();
      destroy?.();
    }
    this.executions.clear();
  }
}
