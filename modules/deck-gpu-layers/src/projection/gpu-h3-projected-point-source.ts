// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, type CompiledGPUCommandGraph} from '@luma.gl/graph/gpu-core';
import {GPUData, GPUVector} from '@luma.gl/graph/gpu-data';
import {GPUH3CellProjection} from '@luma.gl/graph/gpu-h3';
import {GPUProjectionProgram, type CompiledProjection} from '@luma.gl/graph/gpu-project';
import type {ProjectionRenderTransform} from '@luma.gl/graph/gpu-project-crs';
import {getGPUDataBuffer} from '../layers/gpu-vector-layer-utils';

/** Inputs for materializing resident H3 cell centers in a fixed Cartesian render frame. */
export type GPUH3ProjectedPointSourceProps = {
  /** Borrowed storage buffers with packed little-endian H3 IDs. Buffer contents may change in place. */
  cells: GPUVector<'uint32x2'>;
  /** CRS projection and local Cartesian frame. The CRS source must be longitude/latitude. */
  transform: ProjectionRenderTransform;
  /** Pair adjacent dirty chunks on supported adapters. Defaults to one dispatch per chunk. */
  groupChunks?: boolean;
};

/** An executable for one chunk or one pair, with its owned projection parameters. */
type ChunkExecution = {
  /** Graph that writes the retained render buffers. */
  graph: CompiledGPUCommandGraph<void>;
  /** Contributor that owns the parameter buffer. */
  program: GPUProjectionProgram;
};

/** Owns materialized coordinates for a fixed set of resident H3 chunks. */
export class GPUH3ProjectedPointSource {
  /** Local float32 positions, retaining the physical input chunk boundaries. */
  readonly positions: GPUVector<'float32x2'>;
  /** Validity mask aligned to positions. */
  readonly validity: GPUVector<'uint32'>;
  /** Retained transform for rendering and optional CPU picking metadata. */
  readonly transform: ProjectionRenderTransform;
  /** Borrowed input descriptors in source row order. */
  private readonly cells: readonly GPUData<'uint32x2'>[];
  /** Intermediate longitude/latitude positions produced by the H3 kernel. */
  private readonly centers: GPUVector<'float32x2'>;
  /** Intermediate H3 validity consumed by the projection graph. */
  private readonly centerValidity: GPUVector<'uint32'>;
  /** Compiled Cartesian projection for the producer's longitude/latitude format. */
  private readonly projection: CompiledProjection;
  /** Whether supported dirty chunks may share a projection dispatch. */
  private readonly groupChunks: boolean;
  /** Cached single- and paired-chunk executables. */
  private readonly executables = new Map<string, ChunkExecution>();
  /** Whether the retained graphs and buffers have been released. */
  private destroyed = false;

  /** Allocates retained buffers. Call updateChunks before displaying the source. */
  constructor(
    private readonly device: Device,
    {cells, transform, groupChunks = false}: GPUH3ProjectedPointSourceProps
  ) {
    if (device.type !== 'webgpu') throw new Error('H3 materialized points require WebGPU');
    this.cells = [...cells.data];
    this.transform = transform;
    this.groupChunks = groupChunks && device.limits.maxStorageBuffersPerShaderStage >= 9;
    this.projection = transform.compileForInputFormat('float32x2');

    for (const chunk of this.cells) {
      const buffer = getGPUDataBuffer(chunk);
      if (buffer.device !== device || !(buffer.usage & Buffer.STORAGE) || chunk.nullBitmap) {
        throw new Error('H3 cells require same-device storage buffers without null bitmaps');
      }
    }

    const allocated: GPUData[] = [];
    const allocate = <Format extends 'float32x2' | 'uint32'>(
      name: string,
      format: Format,
      bytesPerRow: number,
      usage: number
    ): GPUVector<Format> =>
      new GPUVector({
        type: 'data',
        name,
        format,
        ownsData: true,
        data: this.cells.map(({length}, index) => {
          const buffer = device.createBuffer({
            id: `${name}-${index}`,
            byteLength: Math.max(1, length) * bytesPerRow,
            usage
          });
          const data = new GPUData({format, length, buffer, ownsBuffer: true});
          allocated.push(data);
          return data;
        })
      });
    try {
      this.centers = allocate('h3-centers', 'float32x2', 8, Buffer.STORAGE);
      this.centerValidity = allocate('h3-validity', 'uint32', 4, Buffer.STORAGE);
      this.positions = allocate(
        'h3-render-positions',
        'float32x2',
        8,
        Buffer.STORAGE | Buffer.VERTEX
      );
      this.validity = allocate('h3-render-validity', 'uint32', 4, Buffer.STORAGE | Buffer.VERTEX);
    } catch (error) {
      allocated.forEach(data => data.destroy());
      throw error;
    }
  }

  /** Submits only the requested physical chunks. An omitted list updates all nonempty chunks. */
  updateChunks(chunkIndices: readonly number[] = this.cells.map((_, index) => index)): void {
    if (this.destroyed) throw new Error('H3 materialized point source is destroyed');
    const indices = [...new Set(chunkIndices)].sort((first, second) => first - second);
    for (const index of indices) {
      if (!Number.isSafeInteger(index) || index < 0 || index >= this.cells.length) {
        throw new Error(`Invalid H3 chunk index ${index}`);
      }
    }
    const dirty = indices.filter(index => this.cells[index].length);
    if (!dirty.length) return;
    const executions: ChunkExecution[] = [];
    for (let offset = 0; offset < dirty.length; offset++) {
      const first = dirty[offset];
      const second = dirty[offset + 1];
      const pair = this.groupChunks && second === first + 1;
      executions.push(this.getExecution(pair ? [first, second] : [first]));
      if (pair) offset++;
    }
    const encoder = this.device.createCommandEncoder({id: 'update-h3-materialized-points'});
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

  /** Releases owned buffers and graphs after the layer is detached and queued work completes. */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    for (const {graph, program} of this.executables.values()) {
      graph.destroy();
      program.destroy();
    }
    this.executables.clear();
    this.centers.destroy();
    this.centerValidity.destroy();
    this.positions.destroy();
    this.validity.destroy();
  }

  /** Returns the cached graph for these dirty chunks, creating it on first use. */
  private getExecution(indices: readonly number[]): ChunkExecution {
    const key = indices.join('-');
    const cached = this.executables.get(key);
    if (cached) return cached;
    const graph = new GPUCommandGraph(this.device);
    const importChunks = <Format extends 'float32x2' | 'uint32'>(
      id: string,
      format: Format,
      vector: GPUVector<Format>
    ) => {
      const data = indices.map(index => vector.data[index]);
      return graph.importGPUVector(id, {
        format,
        data,
        length: data.reduce((sum, chunk) => sum + chunk.length, 0)
      });
    };
    const centers = importChunks('h3-centers', 'float32x2', this.centers);
    const validity = importChunks('h3-validity', 'uint32', this.centerValidity);
    indices.forEach((index, offset) => {
      new GPUH3CellProjection({
        id: `h3-centers-${index}`,
        cells: graph.importGPUData(`h3-cells-${index}`, this.cells[index]),
        output: centers.data[offset],
        validity: validity.data[offset]
      }).addToGraph(graph);
    });
    const program = new GPUProjectionProgram({
      id: `h3-projection-${key}`,
      groupChunks: indices.length === 2,
      projection: this.projection,
      positions: centers,
      inputValidity: validity,
      output: importChunks('h3-render-positions', 'float32x2', this.positions),
      validity: importChunks('h3-render-validity', 'uint32', this.validity)
    });
    try {
      program.addToGraph(graph);
      const execution = {graph: graph.compile(), program};
      this.executables.set(key, execution);
      return execution;
    } catch (error) {
      program.destroy();
      throw error;
    }
  }
}
