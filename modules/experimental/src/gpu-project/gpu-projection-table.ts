// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuProj.

import {Buffer, type Device} from '@luma.gl/core';
import {GPUData} from '@luma.gl/gpgpu/gpu-data';
import type {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {GPURecordBatch} from '../gpu-tables/table/gpu-record-batch';
import {GPUTable} from '../gpu-tables/table/gpu-table';
import {GPUProjectionProgram} from './gpu-projection-program';
import type {CompiledProjection} from './projection-program';

export type GPUProjectionTableProps = {
  id: string;
  projection: CompiledProjection;
  table: GPUTable;
  /** Packed uint32x4 containing two little-endian IEEE binary64 coordinates per row. */
  positions: string;
  /** Optional packed uint32 mask, with zero meaning invalid and nonzero meaning valid. */
  inputValidity?: string;
};

export type ProjectedGPUTableColumns = {
  positions: 'float32x2' | 'float32x4';
  validity: 'uint32';
};

/**
 * Derived position/validity table. Borrows source chunks; owns output and parameter buffers.
 * Snapshots batch topology at construction. Never uploads, packs, submits or reads back rows.
 */
export class GPUProjectionTable {
  readonly table: GPUTable<ProjectedGPUTableColumns>;
  readonly projection: CompiledProjection;
  private readonly sources: {positions: GPUData<'uint32x4'>; validity?: GPUData<'uint32'>}[];
  private readonly contributors: GPUProjectionProgram[] = [];
  private readonly outputs: {
    positions: GPUData<'float32x2' | 'float32x4'>;
    validity: GPUData<'uint32'>;
  }[] = [];
  private registered = false;
  private destroyed = false;

  constructor(
    private readonly device: Device,
    private readonly props: GPUProjectionTableProps
  ) {
    this.projection = props.projection;
    if (props.projection.inputFormat !== 'uint32x4') {
      throw new Error('projection tables require binary64 input');
    }
    for (const [name, format] of [
      [props.positions, 'uint32x4'],
      ...(props.inputValidity ? [[props.inputValidity, 'uint32']] : [])
    ]) {
      if (props.table.schema.fields.find(field => field.name === name)?.format !== format) {
        throw new Error(`projection table column ${name} requires ${format}`);
      }
    }
    // Validate all batches before allocating any output or changing a graph.
    this.sources = props.table.batches.map(batch => {
      if (batch.gpuData['indices'] || (batch.nullCount && !props.inputValidity)) {
        throw new Error('projection tables require dense rows and explicit validity');
      }
      return {
        positions: getPackedColumn(device, batch, props.positions, 'uint32x4', 16),
        validity: props.inputValidity
          ? getPackedColumn(device, batch, props.inputValidity, 'uint32', 4)
          : undefined
      };
    });
    const format = props.projection.precision === 'double-single' ? 'float32x4' : 'float32x2';
    const owned: GPUData[] = [];
    const makeData = <Format extends 'float32x2' | 'float32x4' | 'uint32'>(
      name: string,
      format: Format,
      length: number,
      width: number
    ): GPUData<Format> => {
      const data = new GPUData({
        buffer: device.createBuffer({
          id: `${props.id}-${name}`,
          byteLength: Math.max(1, length) * width,
          usage: Buffer.STORAGE | Buffer.COPY_SRC
        }),
        format,
        length,
        ownsBuffer: true
      });
      owned.push(data);
      return data;
    };
    try {
      const batches = props.table.batches.map((batch, index) => {
        const gpuData = {
          positions: makeData(
            `positions-${index}`,
            format,
            batch.numRows,
            format === 'float32x4' ? 16 : 8
          ),
          validity: makeData(`validity-${index}`, 'uint32', batch.numRows, 4)
        };
        this.outputs.push(gpuData);
        return new GPURecordBatch<ProjectedGPUTableColumns>({
          gpuData,
          sourceInfo: batch.sourceInfo,
          // Preserve opaque batch provenance. CRS/output encoding lives on the transform, not in
          // copied source-field metadata. GPU row validity is not a CPU-known null count.
          metadata: new Map(batch.schema.metadata)
        });
      });
      this.table = batches.length
        ? new GPUTable({batches})
        : new GPUTable({
            schema: {
              fields: [
                {name: 'positions', format, nullable: false, metadata: new Map()},
                {name: 'validity', format: 'uint32', nullable: false, metadata: new Map()}
              ],
              metadata: new Map(props.table.schema.metadata)
            }
          });
    } catch (error) {
      for (const data of owned) data.destroy();
      throw error;
    }
  }

  /** Register once on a caller-owned graph; output is usable only after caller submission. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    if (this.destroyed || this.registered || graph.device !== this.device) {
      throw new Error('projection table requires a live, unregistered contributor on its device');
    }
    // A graph is not transactional. If registration fails, discard that graph and this contributor.
    this.registered = true;
    for (const [index, source] of this.sources.entries()) {
      if (!source.positions.length) continue;
      const id = `${this.props.id}-batch-${index}`;
      const output = this.outputs[index];
      const contributor = new GPUProjectionProgram({
        id,
        projection: this.projection,
        positions: graph.importGPUData(`${id}-input`, source.positions),
        inputValidity: source.validity
          ? graph.importGPUData(`${id}-mask`, source.validity)
          : undefined,
        output: graph.importGPUData(`${id}-output`, output.positions),
        validity: graph.importGPUData(`${id}-validity`, output.validity)
      });
      this.contributors.push(contributor);
      contributor.addToGraph(graph);
    }
  }

  /** Call after submitted work completes. Never destroys input data or the caller's graph. */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    for (const contributor of this.contributors) contributor.destroy();
    this.table.destroy();
  }
}

function getPackedColumn<Format extends 'uint32x4' | 'uint32'>(
  device: Device,
  batch: GPURecordBatch,
  name: string,
  format: Format,
  width: number
): GPUData<Format> {
  const data = batch.gpuData[name];
  if (
    !data ||
    data.format !== format ||
    !Number.isSafeInteger(data.length) ||
    data.length < 0 ||
    !Number.isSafeInteger(data.byteOffset) ||
    data.byteOffset < 0 ||
    data.length !== batch.numRows ||
    data.byteStride !== width ||
    data.rowByteLength !== width ||
    data.byteOffset % width !== 0 ||
    data.nullBitmap ||
    data.buffer.destroyed ||
    data.buffer.device !== device ||
    !(data.buffer.usage & Buffer.STORAGE) ||
    data.byteOffset + data.length * width > data.buffer.byteLength
  ) {
    throw new Error(
      `projection table column ${name} requires packed ${format} storage without a null bitmap`
    );
  }
  // The table's runtime field selection has been checked at this adapter boundary.
  return data as GPUData<Format>;
}
