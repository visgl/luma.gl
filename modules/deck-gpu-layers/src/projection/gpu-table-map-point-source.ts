// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {GPUCommandGraph} from '@luma.gl/graph/gpu-core';
import {GPUVector} from '@luma.gl/graph/gpu-data';
import {GPUProjectionTable, type GPUProjectionTableProps} from '@luma.gl/graph/gpu-project';
import {
  prepareMaterializedMapFrame,
  type MaterializedMapFrameOptions,
  type MaterializedMapProjectionSource
} from './materialized-map-frame';
import {MaterializedProjectionChunks} from './materialized-projection-chunks';

/** Borrowed resident table and fixed Web Mercator map frame. */
export type GPUTableMapPointSourceProps = Omit<
  GPUProjectionTableProps,
  'projection' | 'renderable'
> &
  MaterializedMapFrameOptions;

/** Materializes resident binary64 XY table columns as retained map positions. */
export class GPUTableMapPointSource implements MaterializedMapProjectionSource {
  /** Borrowed by render layers for the lifetime of this source. */
  readonly positions: GPUVector<'float32x2'>;
  /** One validity value per source row. */
  readonly validity: GPUVector<'uint32'>;
  /** The fixed source-to-map transform. */
  readonly transform: MaterializedMapProjectionSource['transform'];
  /** Absolute Deck common-space origin. */
  readonly commonOrigin: MaterializedMapProjectionSource['commonOrigin'];
  private readonly projected: GPUProjectionTable;
  private readonly chunks: MaterializedProjectionChunks;

  /** Allocates outputs and snapshots physical batches. Call updateChunks before drawing. */
  constructor(
    device: Device,
    {from, bounds, sourceOrigin, tolerance, ...props}: GPUTableMapPointSourceProps
  ) {
    if (device.type !== 'webgpu') throw new Error('Materialized map projection requires WebGPU');
    const {transform, commonOrigin} = prepareMaterializedMapFrame({
      from,
      bounds,
      sourceOrigin,
      tolerance
    });
    this.transform = transform;
    this.commonOrigin = commonOrigin;
    this.projected = new GPUProjectionTable(device, {
      ...props,
      projection: transform.compiled,
      renderable: true
    });
    const {gpuVectors} = this.projected.table;
    const positions = gpuVectors['positions'] as GPUVector<'float32x2'> | undefined;
    const validity = gpuVectors['validity'] as GPUVector<'uint32'> | undefined;
    this.positions =
      positions ?? new GPUVector({type: 'data', name: 'positions', format: 'float32x2', data: []});
    this.validity =
      validity ?? new GPUVector({type: 'data', name: 'validity', format: 'uint32', data: []});
    const graphs = new Map<number, GPUCommandGraph<void>>();
    this.chunks = new MaterializedProjectionChunks(
      device,
      this.positions.data.map(chunk => chunk.length),
      indices => {
        const [index] = indices;
        let graph = graphs.get(index);
        if (!graph) {
          graph = new GPUCommandGraph<void>(device);
          this.projected.addToGraph(graph, indices);
          graphs.set(index, graph);
        }
        return {graph: graph.compile()};
      }
    );
  }

  /** Submits only the requested physical batches. Omit indices to update all batches. */
  updateChunks(indices?: readonly number[]): void {
    this.chunks.update(indices);
  }

  /** Releases owned projection resources. Detach layers and finish queued work first. */
  destroy(): void {
    this.chunks.destroy();
    this.projected.destroy();
  }
}
