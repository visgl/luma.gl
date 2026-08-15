// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding, Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphDataView} from './gpu-command-graph';
import {getBoundedDispatchLayout, type GPUBoundedDispatchLayout} from './gpu-dispatch-utils';
import {getViewBinding, getViewElementOffset, validatePackedView} from './graph-data-view-utils';

/** Width and height of one workgroup-memory transpose tile. */
export const GPU_TRANSPOSE_TILE_SIZE = 16;

/** Packed scalar formats supported by {@link GPUTranspose}. */
export type GPUTransposeFormat = 'uint32' | 'sint32' | 'float32';

/** Construction properties for one graph-native matrix transpose. */
export type GPUTransposeProps<T extends GPUTransposeFormat = GPUTransposeFormat> = {
  /** Prefix for generated graph node IDs. */
  id?: string;
  /** Packed row-major source matrix. */
  input: GraphDataView<T>;
  /** Packed row-major destination matrix. */
  output: GraphDataView<T>;
  /** Source matrix row count. */
  rows: number;
  /** Source matrix column count. */
  columns: number;
};

/** Immutable logical and tiled-dispatch statistics for a transpose. */
export type GPUTransposeStats = {
  rows: number;
  columns: number;
  elementCount: number;
  tileRowCount: number;
  tileColumnCount: number;
  tileCount: number;
  workgroupSize: readonly [number, number, number];
};

/**
 * Tiled out-of-place transpose over a packed scalar {@link GraphDataView}.
 *
 * The primitive contributes one compute node to an existing command graph. Each workgroup reads a
 * 16 by 16 source tile through padded workgroup memory and writes it with coalesced transposed
 * addressing. Rectangular matrices and partial edge tiles are supported.
 */
export class GPUTranspose<T extends GPUTransposeFormat = GPUTransposeFormat> {
  readonly id: string;
  readonly input: GraphDataView<T>;
  readonly output: GraphDataView<T>;
  readonly rows: number;
  readonly columns: number;
  readonly stats: GPUTransposeStats;

  constructor(props: GPUTransposeProps<T>) {
    this.id = props.id ?? 'gpu-transpose';
    this.input = props.input;
    this.output = props.output;
    this.rows = props.rows;
    this.columns = props.columns;
    this.stats = makeGPUTransposeStats(props.rows, props.columns);

    validatePackedView(this.input, ['uint32', 'sint32', 'float32'], `${this.id} input`);
    validatePackedView(this.output, ['uint32', 'sint32', 'float32'], `${this.id} output`);
    if (this.output.format !== this.input.format) {
      throw new Error(`${this.id} input and output formats must match`);
    }
    if (this.input.length < this.stats.elementCount) {
      throw new Error(`${this.id} input must contain at least rows * columns rows`);
    }
    if (this.output.length < this.stats.elementCount) {
      throw new Error(`${this.id} output must contain at least rows * columns rows`);
    }
    if (this.input.buffer === this.output.buffer) {
      throw new Error(`${this.id} input and output must use separate buffers`);
    }
  }

  /** Adds one tiled compute node without compiling, submitting, or reading data back. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    validateGPUTransposeOwnership(graph, this.input, `${this.id} input`);
    validateGPUTransposeOwnership(graph, this.output, `${this.id} output`);
    if (this.stats.elementCount === 0) {
      return;
    }
    validateGPUTransposeDevice(graph.device, this.id);
    const dispatchLayout = getGPUTransposeDispatchLayout(
      this.stats.tileCount,
      graph.device.limits.maxComputeWorkgroupsPerDimension
    );
    addGPUTransposePass(graph, this, dispatchLayout);
  }
}

/** Builds the device-independent tile plan used by a transpose instance. */
export function makeGPUTransposeStats(rows: number, columns: number): GPUTransposeStats {
  validateGPUTransposeDimension('rows', rows);
  validateGPUTransposeDimension('columns', columns);
  const elementCount = rows * columns;
  if (!Number.isSafeInteger(elementCount) || elementCount > 0xffffffff) {
    throw new Error('GPUTranspose rows * columns must fit in a uint32 index range');
  }
  const tileRowCount = Math.ceil(rows / GPU_TRANSPOSE_TILE_SIZE);
  const tileColumnCount = Math.ceil(columns / GPU_TRANSPOSE_TILE_SIZE);
  return Object.freeze({
    rows,
    columns,
    elementCount,
    tileRowCount,
    tileColumnCount,
    tileCount: tileRowCount * tileColumnCount,
    workgroupSize: Object.freeze([
      GPU_TRANSPOSE_TILE_SIZE,
      GPU_TRANSPOSE_TILE_SIZE,
      1
    ]) as readonly [number, number, number]
  });
}

/** Returns the padded workgroup-memory WGSL used by one transpose node. @internal */
export function getGPUTransposeShaderSource(
  transpose: Pick<GPUTranspose, 'input' | 'output' | 'rows' | 'columns' | 'stats'>,
  dispatchLayout: GPUBoundedDispatchLayout
): string {
  const shaderType = getGPUTransposeShaderType(transpose.input.format as GPUTransposeFormat);
  return `const ROWS: u32 = ${transpose.rows}u;
const COLUMNS: u32 = ${transpose.columns}u;
const TILE_COLUMN_COUNT: u32 = ${transpose.stats.tileColumnCount}u;
const INPUT_OFFSET: u32 = ${getViewElementOffset(transpose.input)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(transpose.output)}u;

@group(0) @binding(0) var<storage, read> inputValues: array<${shaderType}>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<${shaderType}>;
var<workgroup> tile: array<array<${shaderType}, ${GPU_TRANSPOSE_TILE_SIZE + 1}>, ${GPU_TRANSPOSE_TILE_SIZE}>;

@compute @workgroup_size(${GPU_TRANSPOSE_TILE_SIZE}, ${GPU_TRANSPOSE_TILE_SIZE}, 1)
fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_id) localIdentifier: vec3u
) {
  let tileIndex = (workgroupId.z * ${dispatchLayout.y}u + workgroupId.y) *
    ${dispatchLayout.x}u + workgroupId.x;
  if (tileIndex >= ${transpose.stats.tileCount}u) { return; }
  let tileRow = tileIndex / TILE_COLUMN_COUNT;
  let tileColumn = tileIndex - tileRow * TILE_COLUMN_COUNT;
  let inputRow = tileRow * ${GPU_TRANSPOSE_TILE_SIZE}u + localIdentifier.y;
  let inputColumn = tileColumn * ${GPU_TRANSPOSE_TILE_SIZE}u + localIdentifier.x;
  if (inputRow < ROWS && inputColumn < COLUMNS) {
    tile[localIdentifier.y][localIdentifier.x] =
      inputValues[INPUT_OFFSET + inputRow * COLUMNS + inputColumn];
  }
  workgroupBarrier();
  let outputRow = tileColumn * ${GPU_TRANSPOSE_TILE_SIZE}u + localIdentifier.y;
  let outputColumn = tileRow * ${GPU_TRANSPOSE_TILE_SIZE}u + localIdentifier.x;
  if (outputRow < COLUMNS && outputColumn < ROWS) {
    outputValues[OUTPUT_OFFSET + outputRow * ROWS + outputColumn] =
      tile[localIdentifier.x][localIdentifier.y];
  }
}`;
}

function addGPUTransposePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  transpose: GPUTranspose,
  dispatchLayout: GPUBoundedDispatchLayout
): void {
  const source = getGPUTransposeShaderSource(transpose, dispatchLayout);
  graph.addComputePass({
    id: transpose.id,
    workload: {
      operation: 'GPUTranspose',
      commandCount: 1,
      maximumWorkgroupCount: transpose.stats.tileCount,
      maximumInvocationCount:
        transpose.stats.tileCount * GPU_TRANSPOSE_TILE_SIZE * GPU_TRANSPOSE_TILE_SIZE,
      readByteLength: transpose.stats.elementCount * Uint32Array.BYTES_PER_ELEMENT,
      writeByteLength: transpose.stats.elementCount * Uint32Array.BYTES_PER_ELEMENT
    },
    resources: [
      {buffer: transpose.input, usage: 'storage-read'},
      {buffer: transpose.output, usage: 'storage-write'}
    ],
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: transpose.id,
        source,
        shaderLayout: {
          bindings: [
            {name: 'inputValues', type: 'read-only-storage', group: 0, location: 0},
            {name: 'outputValues', type: 'storage', group: 0, location: 1}
          ]
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const bindings: Record<string, Binding> = {
            inputValues: getViewBinding(transpose.input, getBuffer),
            outputValues: getViewBinding(transpose.output, getBuffer)
          };
          computation.setBindings(bindings);
          computation.dispatch(computePass, dispatchLayout.x, dispatchLayout.y, dispatchLayout.z);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function getGPUTransposeDispatchLayout(
  tileCount: number,
  maxComputeWorkgroupsPerDimension: number
): GPUBoundedDispatchLayout {
  return getBoundedDispatchLayout(
    'GPUTranspose',
    tileCount * GPU_TRANSPOSE_TILE_SIZE * GPU_TRANSPOSE_TILE_SIZE,
    GPU_TRANSPOSE_TILE_SIZE * GPU_TRANSPOSE_TILE_SIZE,
    maxComputeWorkgroupsPerDimension
  );
}

function validateGPUTransposeDimension(name: string, dimension: number): void {
  if (!Number.isSafeInteger(dimension) || dimension < 0) {
    throw new Error(`GPUTranspose ${name} must be a non-negative safe integer`);
  }
}

function validateGPUTransposeOwnership<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  view: GraphDataView,
  name: string
): void {
  if (view.buffer.graph !== graph) {
    throw new Error(`${name} belongs to a different GPUCommandGraph`);
  }
}

function validateGPUTransposeDevice(device: Device, id: string): void {
  if (
    device.limits.maxComputeInvocationsPerWorkgroup <
      GPU_TRANSPOSE_TILE_SIZE * GPU_TRANSPOSE_TILE_SIZE ||
    device.limits.maxComputeWorkgroupSizeX < GPU_TRANSPOSE_TILE_SIZE ||
    device.limits.maxComputeWorkgroupSizeY < GPU_TRANSPOSE_TILE_SIZE
  ) {
    throw new Error(`${id} requires 16 by 16 compute workgroups`);
  }
}

function getGPUTransposeShaderType(format: GPUTransposeFormat): 'u32' | 'i32' | 'f32' {
  return format === 'uint32' ? 'u32' : format === 'sint32' ? 'i32' : 'f32';
}
