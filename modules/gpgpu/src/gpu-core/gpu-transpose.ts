// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type GPUCommandNode, createGPUComputeCommandNode} from './gpu-command-node';
import type {Binding, Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {getGPUVectorChunks} from '@luma.gl/gpgpu/gpu-data';
import {GPUCommandGraph, type GraphDataView, type GraphVectorView} from './gpu-command-graph';
import {getBoundedDispatchLayout, type GPUBoundedDispatchLayout} from './gpu-dispatch-utils';
import {
  doGraphDataViewsOverlap,
  getGraphDataPrefix,
  getViewBinding,
  getViewElementOffset,
  validatePackedView
} from './graph-data-view-utils';
import {getGraphVectorData} from './graph-vector-view-utils';

/** Width and height of one workgroup-memory transpose tile. */
export const GPU_TRANSPOSE_TILE_SIZE = 16;

/** Packed scalar formats supported by {@link GPUTranspose}. */
export type GPUTransposeFormat = 'uint32' | 'sint32' | 'float32';

/** Construction properties for one graph-native matrix transpose. */
export type GPUTransposeProps<T extends GPUTransposeFormat = GPUTransposeFormat> = {
  /** Prefix for generated graph node IDs. */
  id?: string;
  /** Packed row-major source matrix. */
  input: GraphDataView<T> | GraphVectorView<T>;
  /** Packed row-major destination matrix. */
  output: GraphDataView<T> | GraphVectorView<T>;
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
 * Tiled out-of-place transpose over packed scalar views with independent chunk boundaries.
 *
 * The primitive contributes compute nodes to an existing command graph. Each workgroup reads a
 * 16 by 16 source tile through padded workgroup memory and writes it with coalesced transposed
 * addressing. Rectangular matrices and partial edge tiles are supported.
 */
export class GPUTranspose<T extends GPUTransposeFormat = GPUTransposeFormat> {
  readonly id: string;
  readonly input: GraphDataView<T> | GraphVectorView<T>;
  readonly output: GraphDataView<T> | GraphVectorView<T>;
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

    for (const [name, view] of [
      ['input', this.input],
      ['output', this.output]
    ] as const) {
      for (const chunk of getGraphVectorData(view)) {
        validatePackedView(chunk, ['uint32', 'sint32', 'float32'], `${this.id} ${name}`);
      }
    }
    if (this.output.format !== this.input.format) {
      throw new Error(`${this.id} input and output formats must match`);
    }
    if (this.input.length < this.stats.elementCount) {
      throw new Error(`${this.id} input must contain at least rows * columns rows`);
    }
    if (this.output.length < this.stats.elementCount) {
      throw new Error(`${this.id} output must contain at least rows * columns rows`);
    }
    const inputBuffers = new Set(getGraphVectorData(this.input).map(chunk => chunk.buffer));
    const outputChunks = getGraphVectorData(this.output);
    if (outputChunks.some(chunk => inputBuffers.has(chunk.buffer))) {
      throw new Error(`${this.id} input and output must use separate buffers`);
    }
    for (const [index, chunk] of outputChunks.entries()) {
      if (outputChunks.slice(0, index).some(previous => doGraphDataViewsOverlap(previous, chunk))) {
        throw new Error(`${this.id} output chunks must not overlap`);
      }
    }
  }

  /** Adds tiled compute nodes without compiling, submitting, or reading data back. */
  getCommandNodes<Parameters>(
    graph: GPUCommandGraph<Parameters>
  ): readonly GPUCommandNode<Parameters>[] {
    const nodes: GPUCommandNode<Parameters>[] = [];
    validateGPUTransposeOwnership(graph, this.input, `${this.id} input`);
    validateGPUTransposeOwnership(graph, this.output, `${this.id} output`);
    if (this.stats.elementCount === 0) {
      return nodes;
    }
    validateGPUTransposeDevice(graph.device, this.id);
    const input = getGraphDataPrefix(graph, this.input, this.stats.elementCount);
    const output = getGraphDataPrefix(graph, this.output, this.stats.elementCount);
    const sources = getGPUVectorChunks(getGraphVectorData(input)).filter(chunk => chunk.length);
    const destinations = getGPUVectorChunks(getGraphVectorData(output)).filter(
      chunk => chunk.length
    );
    for (const [inputIndex, source] of sources.entries()) {
      for (const [outputIndex, destination] of destinations.entries()) {
        const region = makeTransposeRegion(
          source.offset,
          source.length,
          destination.offset,
          destination.length,
          this.rows,
          this.columns
        );
        if (!region) continue;
        const dispatchLayout = getGPUTransposeDispatchLayout(
          region.tileCount,
          graph.device.limits.maxComputeWorkgroupsPerDimension
        );
        nodes.push(
          ...addGPUTransposePass(
            graph,
            {
              ...this,
              id:
                sources.length === 1 && destinations.length === 1
                  ? this.id
                  : `${this.id}-input-${inputIndex}-output-${outputIndex}`,
              input: source.data,
              output: destination.data
            },
            dispatchLayout,
            region
          )
        );
      }
    }

    return nodes;
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
  transpose: AtomicTranspose,
  dispatchLayout: GPUBoundedDispatchLayout,
  region: TransposeRegion = {
    inputOffset: 0,
    outputOffset: 0,
    tileRowOffset: 0,
    tileColumnOffset: 0,
    tileColumnCount: transpose.stats.tileColumnCount,
    tileCount: transpose.stats.tileCount,
    elementCount: transpose.stats.elementCount
  }
): string {
  const wholeInput =
    region.inputOffset === 0 && transpose.input.length >= transpose.stats.elementCount;
  const wholeOutput =
    region.outputOffset === 0 && transpose.output.length >= transpose.stats.elementCount;
  return `const ROWS: u32 = ${transpose.rows}u;
const COLUMNS: u32 = ${transpose.columns}u;
const TILE_COLUMN_COUNT: u32 = ${region.tileColumnCount}u;
const INPUT_START: u32 = ${region.inputOffset}u;
const INPUT_LENGTH: u32 = ${transpose.input.length}u;
const OUTPUT_START: u32 = ${region.outputOffset}u;
const OUTPUT_LENGTH: u32 = ${transpose.output.length}u;
const INPUT_OFFSET: u32 = ${getViewElementOffset(transpose.input)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(transpose.output)}u;

// Move raw words so signed zeros, NaN payloads, and integer bits survive unchanged.
@group(0) @binding(0) var<storage, read> inputValues: array<u32>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<u32>;
var<workgroup> tile: array<array<u32, ${GPU_TRANSPOSE_TILE_SIZE + 1}>, ${GPU_TRANSPOSE_TILE_SIZE}>;

@compute @workgroup_size(${GPU_TRANSPOSE_TILE_SIZE}, ${GPU_TRANSPOSE_TILE_SIZE}, 1)
fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_id) localIdentifier: vec3u
) {
  let tileIndex = (workgroupId.z * ${dispatchLayout.y}u + workgroupId.y) *
    ${dispatchLayout.x}u + workgroupId.x;
  if (tileIndex >= ${region.tileCount}u) { return; }
  let localTileRow = tileIndex / TILE_COLUMN_COUNT;
  let tileRow = localTileRow + ${region.tileRowOffset}u;
  let tileColumn = tileIndex - localTileRow * TILE_COLUMN_COUNT + ${region.tileColumnOffset}u;
  let inputRow = tileRow * ${GPU_TRANSPOSE_TILE_SIZE}u + localIdentifier.y;
  let inputColumn = tileColumn * ${GPU_TRANSPOSE_TILE_SIZE}u + localIdentifier.x;
  let inputIndex = inputRow * COLUMNS + inputColumn;
  let destinationIndex = inputColumn * ROWS + inputRow;
  if (inputRow < ROWS && inputColumn < COLUMNS
      ${wholeInput ? '' : '&& inputIndex >= INPUT_START && inputIndex - INPUT_START < INPUT_LENGTH'}
      ${wholeOutput ? '' : '&& destinationIndex >= OUTPUT_START && destinationIndex - OUTPUT_START < OUTPUT_LENGTH'}) {
    tile[localIdentifier.y][localIdentifier.x] =
      inputValues[INPUT_OFFSET + inputIndex - INPUT_START];
  }
  workgroupBarrier();
  let outputRow = tileColumn * ${GPU_TRANSPOSE_TILE_SIZE}u + localIdentifier.y;
  let outputColumn = tileRow * ${GPU_TRANSPOSE_TILE_SIZE}u + localIdentifier.x;
  let outputIndex = outputRow * ROWS + outputColumn;
  let sourceIndex = outputColumn * COLUMNS + outputRow;
  if (outputRow < COLUMNS && outputColumn < ROWS
      ${wholeOutput ? '' : '&& outputIndex >= OUTPUT_START && outputIndex - OUTPUT_START < OUTPUT_LENGTH'}
      ${wholeInput ? '' : '&& sourceIndex >= INPUT_START && sourceIndex - INPUT_START < INPUT_LENGTH'}) {
    outputValues[OUTPUT_OFFSET + outputIndex - OUTPUT_START] =
      tile[localIdentifier.x][localIdentifier.y];
  }
}`;
}

function addGPUTransposePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  transpose: AtomicTranspose,
  dispatchLayout: GPUBoundedDispatchLayout,
  region: TransposeRegion
): readonly GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
  const source = getGPUTransposeShaderSource(transpose, dispatchLayout, region);
  nodes.push(
    createGPUComputeCommandNode<Parameters>({
      id: transpose.id,
      workload: {
        operation: 'GPUTranspose',
        commandCount: 1,
        maximumWorkgroupCount: region.tileCount,
        maximumInvocationCount:
          region.tileCount * GPU_TRANSPOSE_TILE_SIZE * GPU_TRANSPOSE_TILE_SIZE,
        readByteLength: region.elementCount * Uint32Array.BYTES_PER_ELEMENT,
        writeByteLength: region.elementCount * Uint32Array.BYTES_PER_ELEMENT
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
    })
  );

  return nodes;
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
  view: GraphDataView | GraphVectorView,
  name: string
): void {
  if (getGraphVectorData(view).some(chunk => chunk.buffer.graph !== graph)) {
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

type AtomicTranspose = Pick<GPUTranspose, 'id' | 'rows' | 'columns' | 'stats'> & {
  input: GraphDataView;
  output: GraphDataView;
};

type TransposeRegion = {
  inputOffset: number;
  outputOffset: number;
  tileRowOffset: number;
  tileColumnOffset: number;
  tileColumnCount: number;
  tileCount: number;
  elementCount: number;
};

type MatrixRectangle = {rowStart: number; rowEnd: number; columnStart: number; columnEnd: number};

/** A contiguous row-major chunk is at most two partial rows and one full-row rectangle. */
function getChunkRectangles(offset: number, length: number, columns: number): MatrixRectangle[] {
  const firstRow = Math.floor(offset / columns);
  const lastRow = Math.floor((offset + length - 1) / columns);
  const firstColumn = offset % columns;
  const lastColumn = ((offset + length - 1) % columns) + 1;
  if (firstRow === lastRow) {
    return [
      {rowStart: firstRow, rowEnd: firstRow + 1, columnStart: firstColumn, columnEnd: lastColumn}
    ];
  }
  const rectangles = [
    {rowStart: firstRow, rowEnd: firstRow + 1, columnStart: firstColumn, columnEnd: columns},
    {rowStart: lastRow, rowEnd: lastRow + 1, columnStart: 0, columnEnd: lastColumn}
  ];
  if (firstRow + 1 < lastRow)
    rectangles.push({rowStart: firstRow + 1, rowEnd: lastRow, columnStart: 0, columnEnd: columns});
  return rectangles;
}

/** Finds the shared tiles and exact element count without walking matrix rows or allocating GPU storage. */
function makeTransposeRegion(
  inputOffset: number,
  inputLength: number,
  outputOffset: number,
  outputLength: number,
  rows: number,
  columns: number
): TransposeRegion | undefined {
  let rowStart = rows;
  let rowEnd = 0;
  let columnStart = columns;
  let columnEnd = 0;
  let elementCount = 0;
  for (const input of getChunkRectangles(inputOffset, inputLength, columns)) {
    for (const output of getChunkRectangles(outputOffset, outputLength, rows)) {
      const firstRow = Math.max(input.rowStart, output.columnStart);
      const lastRow = Math.min(input.rowEnd, output.columnEnd);
      const firstColumn = Math.max(input.columnStart, output.rowStart);
      const lastColumn = Math.min(input.columnEnd, output.rowEnd);
      if (firstRow >= lastRow || firstColumn >= lastColumn) continue;
      elementCount += (lastRow - firstRow) * (lastColumn - firstColumn);
      rowStart = Math.min(rowStart, firstRow);
      rowEnd = Math.max(rowEnd, lastRow);
      columnStart = Math.min(columnStart, firstColumn);
      columnEnd = Math.max(columnEnd, lastColumn);
    }
  }
  if (!elementCount) return undefined;
  const tileRowOffset = Math.floor(rowStart / GPU_TRANSPOSE_TILE_SIZE);
  const tileColumnOffset = Math.floor(columnStart / GPU_TRANSPOSE_TILE_SIZE);
  const tileColumnCount = Math.ceil(columnEnd / GPU_TRANSPOSE_TILE_SIZE) - tileColumnOffset;
  return {
    inputOffset,
    outputOffset,
    tileRowOffset,
    tileColumnOffset,
    tileColumnCount,
    tileCount: (Math.ceil(rowEnd / GPU_TRANSPOSE_TILE_SIZE) - tileRowOffset) * tileColumnCount,
    elementCount
  };
}
