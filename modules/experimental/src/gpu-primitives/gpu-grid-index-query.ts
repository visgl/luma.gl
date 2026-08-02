// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphBufferUse, type GraphDataView} from './gpu-command-graph';
import type {GPUGridIndexBounds, GPUGridIndexSize} from './gpu-grid-index';
import {
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View,
  validatePackedView
} from './graph-data-view-utils';

const GRID_QUERY_WORKGROUP_SIZE = 256;

/** Storage and domain contract consumed by {@link GPUGridIndexQuery}. */
export type GPUGridIndexView = {
  gridSize: GPUGridIndexSize;
  bounds: GPUGridIndexBounds;
  cellOffsets: GraphDataView<'uint32'>;
  objectIds: GraphDataView<'uint32'>;
  count: GraphDataView<'uint32'>;
  overflow: GraphDataView<'uint32'>;
};

/** Coarse spatial query evaluated against grid cells. */
export type GPUGridIndexQueryKind = 'point' | 'bounds' | 'radius';

/** Properties for one grid-index candidate query. */
export type GPUGridIndexQueryProps = {
  /** Prefix for generated graph node IDs. */
  id?: string;
  /** Grid storage and domain, commonly a `GPUGridIndex` instance. */
  index: GPUGridIndexView;
  /** Cell-selection rule. */
  kind: GPUGridIndexQueryKind;
  /** Packed query scalars: point, minima/maxima, or center/radius. */
  query: GraphDataView<'float32'>;
  /** Caller-owned capacity-bounded candidate IDs. */
  output: GraphDataView<'uint32'>;
  /** Caller-owned row receiving the stored-index candidate count. */
  count: GraphDataView<'uint32'>;
  /** Caller-owned row receiving index or candidate-output overflow. */
  overflow: GraphDataView<'uint32'>;
  /** Optional source-ID-addressed candidate mask, cleared on every encoding. */
  outputMask?: GraphDataView<'uint32'>;
};

/**
 * Queries a flat grid index for IDs in cells intersecting a point, bounds, or radius.
 *
 * Results are conservative cell candidates. Bounds and radius queries may include objects outside
 * the exact geometry, and point queries return every object in the containing cell. Output order is
 * unspecified because candidates append atomically.
 */
export class GPUGridIndexQuery {
  readonly id: string;
  readonly index: GPUGridIndexView;
  readonly kind: GPUGridIndexQueryKind;
  readonly query: GraphDataView<'float32'>;
  readonly output: GraphDataView<'uint32'>;
  readonly count: GraphDataView<'uint32'>;
  readonly overflow: GraphDataView<'uint32'>;
  readonly outputMask?: GraphDataView<'uint32'>;
  readonly dimension: 2 | 3;

  constructor(props: GPUGridIndexQueryProps) {
    this.id = props.id ?? 'gpu-grid-index-query';
    this.index = props.index;
    this.kind = props.kind;
    this.query = props.query;
    this.output = props.output;
    this.count = props.count;
    this.overflow = props.overflow;
    this.outputMask = props.outputMask;
    this.dimension = this.index.gridSize.length === 2 ? 2 : 3;

    validateIndexView(this.id, this.index, this.dimension);
    validatePackedView(this.query, ['float32'], `${this.id} query`);
    validatePackedUint32View(this.output, `${this.id} output`);
    validatePackedUint32View(this.count, `${this.id} count`);
    validatePackedUint32View(this.overflow, `${this.id} overflow`);
    if (this.outputMask) validatePackedUint32View(this.outputMask, `${this.id} outputMask`);
    if (this.count.length < 1 || this.overflow.length < 1) {
      throw new Error(`${this.id} count and overflow must each contain one uint32 row`);
    }
    const expectedQueryLength =
      this.kind === 'point'
        ? this.dimension
        : this.kind === 'bounds'
          ? this.dimension * 2
          : this.dimension + 1;
    if (this.query.length !== expectedQueryLength) {
      throw new Error(`${this.id} ${this.kind} query must contain ${expectedQueryLength} floats`);
    }
  }

  /** Adds output initialization and candidate collection without submitting or reading back work. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const views = [
      this.index.cellOffsets,
      this.index.objectIds,
      this.index.count,
      this.index.overflow,
      this.query,
      this.output,
      this.count,
      this.overflow,
      ...(this.outputMask ? [this.outputMask] : [])
    ];
    if (views.some(view => view.buffer.graph !== graph)) {
      throw new Error(`${this.id} views must belong to the target graph`);
    }

    addInitializePass(graph, this);
    if (this.index.objectIds.length > 0) addQueryPass(graph, this);
  }
}

function addInitializePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  query: GPUGridIndexQuery
): void {
  const maskBinding = query.outputMask
    ? '@group(0) @binding(3) var<storage, read_write> outputMask: array<u32>;'
    : '';
  const maskClear = query.outputMask
    ? `if (index < MASK_LENGTH) { outputMask[MASK_OFFSET + index] = 0u; }`
    : '';
  const source = /* wgsl */ `
const INDEX_OVERFLOW_OFFSET: u32 = ${getViewElementOffset(query.index.overflow)}u;
const COUNT_OFFSET: u32 = ${getViewElementOffset(query.count)}u;
const OVERFLOW_OFFSET: u32 = ${getViewElementOffset(query.overflow)}u;
${
  query.outputMask
    ? `const MASK_OFFSET: u32 = ${getViewElementOffset(query.outputMask)}u;
const MASK_LENGTH: u32 = ${query.outputMask.length}u;`
    : ''
}
@group(0) @binding(0) var<storage, read> indexOverflow: array<u32>;
@group(0) @binding(1) var<storage, read_write> outputCount: array<u32>;
@group(0) @binding(2) var<storage, read_write> outputOverflow: array<u32>;
${maskBinding}
@compute @workgroup_size(${GRID_QUERY_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>
) {
  let index = globalId.x;
  if (index == 0u) {
    outputCount[COUNT_OFFSET] = 0u;
    outputOverflow[OVERFLOW_OFFSET] = min(indexOverflow[INDEX_OVERFLOW_OFFSET], 1u);
  }
  ${maskClear}
}`;
  const resources: GraphBufferUse[] = [
    {buffer: query.index.overflow, usage: 'storage-read'},
    {buffer: query.count, usage: 'storage-write'},
    {buffer: query.overflow, usage: 'storage-write'},
    ...(query.outputMask
      ? ([{buffer: query.outputMask, usage: 'storage-write'}] as GraphBufferUse[])
      : [])
  ];
  addComputationPass(graph, {
    id: `${query.id}-initialize`,
    source,
    resources,
    bindings: {
      indexOverflow: query.index.overflow,
      outputCount: query.count,
      outputOverflow: query.overflow,
      ...(query.outputMask ? {outputMask: query.outputMask} : {})
    },
    dispatchCount: Math.ceil(Math.max(query.outputMask?.length ?? 0, 1) / GRID_QUERY_WORKGROUP_SIZE)
  });
}

function addQueryPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  query: GPUGridIndexQuery
): void {
  const dimension = query.dimension;
  const width = query.index.gridSize[0];
  const height = query.index.gridSize[1];
  const depth = dimension === 3 ? query.index.gridSize[2] : 1;
  const cellCount = query.index.gridSize.reduce((product, size) => product * size, 1);
  const maskBinding = query.outputMask
    ? '@group(0) @binding(7) var<storage, read_write> outputMask: array<atomic<u32>>;'
    : '';
  const maskWrite = query.outputMask
    ? `if (objectId < MASK_LENGTH) {
      atomicStore(&outputMask[MASK_OFFSET + objectId], 1u);
    }`
    : '';
  const source = /* wgsl */ `
const CELL_COUNT: u32 = ${cellCount}u;
const WIDTH: u32 = ${width}u;
const HEIGHT: u32 = ${height}u;
const DEPTH: u32 = ${depth}u;
const INDEX_CAPACITY: u32 = ${query.index.objectIds.length}u;
const OUTPUT_CAPACITY: u32 = ${query.output.length}u;
const CELL_OFFSETS_OFFSET: u32 = ${getViewElementOffset(query.index.cellOffsets)}u;
const OBJECT_IDS_OFFSET: u32 = ${getViewElementOffset(query.index.objectIds)}u;
const INDEX_COUNT_OFFSET: u32 = ${getViewElementOffset(query.index.count)}u;
const QUERY_OFFSET: u32 = ${getViewElementOffset(query.query)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(query.output)}u;
const COUNT_OFFSET: u32 = ${getViewElementOffset(query.count)}u;
const OVERFLOW_OFFSET: u32 = ${getViewElementOffset(query.overflow)}u;
${
  query.outputMask
    ? `const MASK_OFFSET: u32 = ${getViewElementOffset(query.outputMask)}u;
const MASK_LENGTH: u32 = ${query.outputMask.length}u;`
    : ''
}
@group(0) @binding(0) var<storage, read> cellOffsets: array<u32>;
@group(0) @binding(1) var<storage, read> objectIds: array<u32>;
@group(0) @binding(2) var<storage, read> indexCount: array<u32>;
@group(0) @binding(3) var<storage, read> queryValues: array<f32>;
@group(0) @binding(4) var<storage, read_write> outputIds: array<u32>;
@group(0) @binding(5) var<storage, read_write> outputCount: array<atomic<u32>>;
@group(0) @binding(6) var<storage, read_write> outputOverflow: array<atomic<u32>>;
${maskBinding}

fn finite(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

fn getCoordinate(value: f32, minimum: f32, maximum: f32, size: u32) -> u32 {
  if (!finite(value)) { return 0u; }
  if (maximum == minimum || value == minimum) { return 0u; }
  if (value == maximum) { return size - 1u; }
  return min(u32((value - minimum) / (maximum - minimum) * f32(size)), size - 1u);
}

fn findCellIndex(objectIndex: u32) -> u32 {
  var low = 0u;
  var high = CELL_COUNT;
  loop {
    if (low >= high) { break; }
    let middle = low + (high - low) / 2u;
    if (cellOffsets[CELL_OFFSETS_OFFSET + middle + 1u] <= objectIndex) {
      low = middle + 1u;
    } else {
      high = middle;
    }
  }
  return min(low, CELL_COUNT - 1u);
}

fn cellMinimum(coordinate: u32, size: u32, minimum: f32, maximum: f32) -> f32 {
  return minimum + (maximum - minimum) * f32(coordinate) / f32(size);
}

fn cellMaximum(coordinate: u32, size: u32, minimum: f32, maximum: f32) -> f32 {
  if (coordinate + 1u == size) { return maximum; }
  return minimum + (maximum - minimum) * f32(coordinate + 1u) / f32(size);
}

@compute @workgroup_size(${GRID_QUERY_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>
) {
  let objectIndex = globalId.x;
  let storedCount = min(indexCount[INDEX_COUNT_OFFSET], INDEX_CAPACITY);
  if (objectIndex >= storedCount) { return; }
  let cellIndex = findCellIndex(objectIndex);
  let column = cellIndex % WIDTH;
  let row = (cellIndex / WIDTH) % HEIGHT;
  let layer = cellIndex / (WIDTH * HEIGHT);
  ${makeCellSelection(query)}
  if (selected) {
    let objectId = objectIds[OBJECT_IDS_OFFSET + objectIndex];
    let outputIndex = atomicAdd(&outputCount[COUNT_OFFSET], 1u);
    if (outputIndex < OUTPUT_CAPACITY) {
      outputIds[OUTPUT_OFFSET + outputIndex] = objectId;
    } else {
      atomicStore(&outputOverflow[OVERFLOW_OFFSET], 1u);
    }
    ${maskWrite}
  }
}`;
  const resources: GraphBufferUse[] = [
    {buffer: query.index.cellOffsets, usage: 'storage-read'},
    {buffer: query.index.objectIds, usage: 'storage-read'},
    {buffer: query.index.count, usage: 'storage-read'},
    {buffer: query.query, usage: 'storage-read'},
    {buffer: query.output, usage: 'storage-write'},
    {buffer: query.count, usage: 'storage-read-write'},
    {buffer: query.overflow, usage: 'storage-read-write'},
    ...(query.outputMask
      ? ([{buffer: query.outputMask, usage: 'storage-read-write'}] as GraphBufferUse[])
      : [])
  ];
  addComputationPass(graph, {
    id: query.id,
    source,
    resources,
    bindings: {
      cellOffsets: query.index.cellOffsets,
      objectIds: query.index.objectIds,
      indexCount: query.index.count,
      queryValues: query.query,
      outputIds: query.output,
      outputCount: query.count,
      outputOverflow: query.overflow,
      ...(query.outputMask ? {outputMask: query.outputMask} : {})
    },
    dispatchCount: Math.ceil(query.index.objectIds.length / GRID_QUERY_WORKGROUP_SIZE)
  });
}

function makeCellSelection(query: GPUGridIndexQuery): string {
  const dimension = query.dimension;
  const bounds = query.index.bounds;
  const maximaOffset = dimension;
  const axes = [
    {
      name: 'x',
      coordinate: 'column',
      size: 'WIDTH',
      minimum: bounds[0],
      maximum: bounds[maximaOffset]
    },
    {
      name: 'y',
      coordinate: 'row',
      size: 'HEIGHT',
      minimum: bounds[1],
      maximum: bounds[maximaOffset + 1]
    },
    ...(dimension === 3
      ? [
          {
            name: 'z',
            coordinate: 'layer',
            size: 'DEPTH',
            minimum: bounds[2]!,
            maximum: bounds[5]!
          }
        ]
      : [])
  ];
  const cellDeclarations = axes
    .map(
      axis => `let cellMin${axis.name.toUpperCase()} = cellMinimum(${axis.coordinate}, ${axis.size}, ${getFloatLiteral(axis.minimum)}, ${getFloatLiteral(axis.maximum)});
  let cellMax${axis.name.toUpperCase()} = cellMaximum(${axis.coordinate}, ${axis.size}, ${getFloatLiteral(axis.minimum)}, ${getFloatLiteral(axis.maximum)});`
    )
    .join('\n  ');

  if (query.kind === 'point') {
    const values = axes
      .map(
        (axis, axisIndex) =>
          `let query${axis.name.toUpperCase()} = queryValues[QUERY_OFFSET + ${axisIndex}u];`
      )
      .join('\n  ');
    const valid = axes
      .map(
        axis =>
          `finite(query${axis.name.toUpperCase()}) && query${axis.name.toUpperCase()} >= ${getFloatLiteral(axis.minimum)} && query${axis.name.toUpperCase()} <= ${getFloatLiteral(axis.maximum)}`
      )
      .join(' && ');
    const queryCoordinates = axes
      .map(
        axis =>
          `let query${axis.name.toUpperCase()}Coordinate = getCoordinate(query${axis.name.toUpperCase()}, ${getFloatLiteral(axis.minimum)}, ${getFloatLiteral(axis.maximum)}, ${axis.size});`
      )
      .join('\n  ');
    const queryCell =
      dimension === 2
        ? 'queryYCoordinate * WIDTH + queryXCoordinate'
        : '(queryZCoordinate * HEIGHT + queryYCoordinate) * WIDTH + queryXCoordinate';
    return `${values}
  ${queryCoordinates}
  let selected = ${valid} && cellIndex == ${queryCell};`;
  }

  if (query.kind === 'bounds') {
    const values = axes
      .map(
        (axis, axisIndex) =>
          `let queryMin${axis.name.toUpperCase()} = queryValues[QUERY_OFFSET + ${axisIndex}u];
  let queryMax${axis.name.toUpperCase()} = queryValues[QUERY_OFFSET + ${axisIndex + dimension}u];`
      )
      .join('\n  ');
    const valid = axes
      .map(
        axis =>
          `finite(queryMin${axis.name.toUpperCase()}) && finite(queryMax${axis.name.toUpperCase()}) && queryMin${axis.name.toUpperCase()} <= queryMax${axis.name.toUpperCase()}`
      )
      .join(' && ');
    const selected = axes
      .map(
        axis =>
          `cellMax${axis.name.toUpperCase()} >= queryMin${axis.name.toUpperCase()} && cellMin${axis.name.toUpperCase()} <= queryMax${axis.name.toUpperCase()}`
      )
      .join(' && ');
    return `${cellDeclarations}
  ${values}
  let selected = ${valid} && ${selected};`;
  }

  const values = axes
    .map(
      (axis, axisIndex) =>
        `let query${axis.name.toUpperCase()} = queryValues[QUERY_OFFSET + ${axisIndex}u];`
    )
    .join('\n  ');
  const validCenter = axes.map(axis => `finite(query${axis.name.toUpperCase()})`).join(' && ');
  const distances = axes
    .map(
      axis =>
        `let closest${axis.name.toUpperCase()} = clamp(query${axis.name.toUpperCase()}, cellMin${axis.name.toUpperCase()}, cellMax${axis.name.toUpperCase()});
  let distance${axis.name.toUpperCase()} = query${axis.name.toUpperCase()} - closest${axis.name.toUpperCase()};`
    )
    .join('\n  ');
  const squaredDistance = axes
    .map(axis => `distance${axis.name.toUpperCase()} * distance${axis.name.toUpperCase()}`)
    .join(' + ');
  return `${cellDeclarations}
  ${values}
  let radius = queryValues[QUERY_OFFSET + ${dimension}u];
  ${distances}
  let selected = ${validCenter} && finite(radius) && radius >= 0.0 && ${squaredDistance} <= radius * radius;`;
}

function validateIndexView(id: string, index: GPUGridIndexView, dimension: 2 | 3): void {
  if (index.bounds.length !== dimension * 2) {
    throw new Error(`${id} index gridSize and bounds must have matching dimensions`);
  }
  if (index.gridSize.some(size => !Number.isSafeInteger(size) || size <= 0)) {
    throw new Error(`${id} index gridSize must contain positive integers`);
  }
  if (
    !index.bounds.every(Number.isFinite) ||
    Array.from({length: dimension}, (_, axis) => axis).some(
      axis => index.bounds[axis]! > index.bounds[axis + dimension]!
    )
  ) {
    throw new Error(`${id} index bounds must contain finite ordered minima and maxima`);
  }
  const cellCount = index.gridSize.reduce((product, size) => product * size, 1);
  for (const [name, view] of [
    ['cellOffsets', index.cellOffsets],
    ['objectIds', index.objectIds],
    ['count', index.count],
    ['overflow', index.overflow]
  ] as const) {
    validatePackedUint32View(view, `${id} index ${name}`);
  }
  if (index.cellOffsets.length !== cellCount + 1) {
    throw new Error(`${id} index cellOffsets.length must equal cellCount + 1`);
  }
  if (index.count.length < 1 || index.overflow.length < 1) {
    throw new Error(`${id} index count and overflow must each contain one uint32 row`);
  }
}

function addComputationPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    source: string;
    resources: GraphBufferUse[];
    bindings: Record<string, GraphDataView>;
    dispatchCount: number;
  }
): void {
  graph.addComputePass({
    id: props.id,
    resources: props.resources,
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: props.id,
        source: props.source,
        shaderLayout: {
          bindings: Object.keys(props.bindings).map((name, location) => ({
            name,
            type: 'storage' as const,
            group: 0,
            location
          }))
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const bindings: Record<string, Binding> = {};
          for (const [name, view] of Object.entries(props.bindings)) {
            bindings[name] = getViewBinding(view, getBuffer);
          }
          computation.setBindings(bindings);
          computation.dispatch(computePass, props.dispatchCount);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function getFloatLiteral(value: number): string {
  return Number.isInteger(value) ? `${value}.0` : `${value}`;
}
