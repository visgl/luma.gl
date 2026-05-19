// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type PrimitiveTopology} from '@luma.gl/core';
import {DynamicBuffer, GPUGeometry} from '@luma.gl/engine';
import {GPUTable} from './gpu-table';

/** Props for exposing one packed GPU table as GPU geometry. */
export type GPUTableGeometryProps = {
  /** Single-batch or already-packed GPU table supplying static geometry buffers. */
  table: GPUTable;
  /** Determines how vertices are assembled into primitives. */
  topology: PrimitiveTopology;
  /** Optional GPU index buffer. Indexed geometry requires `vertexCount`. */
  indices?: Buffer | null;
  /** Explicit draw vertex/index count. Defaults to `table.numRows` for non-indexed geometry. */
  vertexCount?: number;
  /** Whether geometry destruction also destroys the supplied table. */
  ownsTable?: boolean;
};

/**
 * Static geometry view over one packed `GPUTable`.
 *
 * Dynamic table buffers stay outside this first geometry contract. The table is
 * borrowed unless ownership is explicitly requested.
 */
export class GPUTableGeometry extends GPUGeometry {
  /** Backing table whose GPU buffers are exposed as geometry vertex buffers. */
  readonly table: GPUTable;
  private ownsTableStorage: boolean;
  private destroyed = false;

  constructor(props: GPUTableGeometryProps) {
    const {table, topology, indices = null, ownsTable = false} = props;
    if (table.batches.length !== 1) {
      throw new Error('GPUTableGeometry requires a single-batch or packed GPUTable');
    }
    if (indices && props.vertexCount === undefined) {
      throw new Error('GPUTableGeometry indexed geometry requires an explicit vertexCount');
    }

    const attributes = getStaticGeometryAttributes(table);
    super({
      topology,
      indices,
      vertexCount: props.vertexCount ?? table.numRows,
      attributes,
      bufferLayout: table.bufferLayout
    });
    this.table = table;
    this.ownsTableStorage = ownsTable;
  }

  /** Destroys owned indices and optionally the borrowed table storage. */
  override destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.indices?.destroy();
    if (this.ownsTableStorage) {
      this.table.destroy();
      this.ownsTableStorage = false;
    }
    this.destroyed = true;
  }
}

function getStaticGeometryAttributes(table: GPUTable): Record<string, Buffer> {
  const attributes: Record<string, Buffer> = {};
  for (const layout of table.bufferLayout) {
    const vector = table.gpuVectors[layout.name];
    const buffer = vector?.buffer;
    if (!buffer) {
      throw new Error(`GPUTableGeometry requires GPU vector "${layout.name}"`);
    }
    if (buffer instanceof DynamicBuffer) {
      throw new Error('GPUTableGeometry does not support DynamicBuffer-backed attributes');
    }
    attributes[layout.name] = buffer;
  }
  return attributes;
}
