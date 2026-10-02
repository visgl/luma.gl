// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type GPUCommandNode} from './gpu-command-node';
import {GPUCommandGraph, type GraphDataView, type GraphVectorView} from './gpu-command-graph';
import type {GPUGridIndexBounds, GPUGridIndexSize} from './gpu-grid-index';
import {
  doGraphDataViewsOverlap,
  createTransientView,
  getViewElementOffset,
  validatePackedUint32View,
  validatePackedView
} from './graph-data-view-utils';

import {createChunkNode, getGraphDataRange, validateChunkViews} from './gpu-chunk-utils';
import {alignGraphVectorViews, getGraphVectorData} from './graph-vector-view-utils';
import {
  getGPUGridIndexDispatchLayout,
  getGPUGridIndexInvocationIndexSource
} from './gpu-grid-index-internals';
import {GPUScatter} from './gpu-scatter';

/** Storage and domain contract consumed by {@link GPUGridIndexQuery}. */
export type GPUGridIndexView = {
  gridSize: GPUGridIndexSize;
  bounds: GPUGridIndexBounds;
  cellOffsets: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  objectIds: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
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
  output: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  /** Caller-owned row receiving the stored-index candidate count. */
  count: GraphDataView<'uint32'>;
  /** Caller-owned row receiving index or candidate-output overflow. */
  overflow: GraphDataView<'uint32'>;
  /** Optional source-ID-addressed candidate mask, cleared on every encoding. */
  outputMask?: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
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
  readonly output: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  readonly count: GraphDataView<'uint32'>;
  readonly overflow: GraphDataView<'uint32'>;
  readonly outputMask?: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
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
    for (const chunk of getGraphVectorData(this.output))
      validatePackedUint32View(chunk, `${this.id} output`);
    validatePackedUint32View(this.count, `${this.id} count`);
    validatePackedUint32View(this.overflow, `${this.id} overflow`);
    if (this.outputMask)
      for (const chunk of getGraphVectorData(this.outputMask))
        validatePackedUint32View(chunk, `${this.id} outputMask`);
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
    validateDisjointQueryViews(this.id, this.index, this.query, [
      this.output,
      this.count,
      this.overflow,
      ...(this.outputMask ? [this.outputMask] : [])
    ]);
  }

  /** Adds output initialization and candidate collection without submitting or reading back work. */
  getCommandNodes<Parameters>(
    graph: GPUCommandGraph<Parameters>
  ): readonly GPUCommandNode<Parameters>[] {
    validateChunkViews(
      graph,
      [
        this.index.cellOffsets,
        this.index.objectIds,
        this.index.count,
        this.index.overflow,
        this.query
      ],
      [this.output, this.count, this.overflow, ...(this.outputMask ? [this.outputMask] : [])]
    );
    const nodes: GPUCommandNode<Parameters>[] = [];
    const maximum = graph.device.limits.maxComputeWorkgroupsPerDimension;
    nodes.push(
      createChunkNode(graph, {
        id: `${this.id}-initialize`,
        inputs: {indexOverflow: this.index.overflow},
        outputs: {count: this.count, overflow: this.overflow},
        dispatch: {x: 1, y: 1, z: 1},
        workgroupSize: 1,
        source: `
@group(0) @binding(0) var<storage, read> indexOverflow: array<u32>;
@group(0) @binding(1) var<storage, read_write> count: array<u32>;
@group(0) @binding(2) var<storage, read_write> overflow: array<u32>;
@compute @workgroup_size(1)
fn main() {
  count[${getViewElementOffset(this.count)}u] = 0u;
  overflow[${getViewElementOffset(this.overflow)}u] = min(indexOverflow[${getViewElementOffset(this.index.overflow)}u], 1u);
}`
      })
    );
    for (const [chunkIndex, mask] of (this.outputMask
      ? getGraphVectorData(this.outputMask)
      : []
    ).entries()) {
      if (!mask.length) continue;
      const dispatch = getGPUGridIndexDispatchLayout(mask.length, maximum);
      nodes.push(
        createChunkNode(graph, {
          id: `${this.id}-clear-mask-${chunkIndex}`,
          outputs: {mask},
          dispatch,
          source: `
@group(0) @binding(0) var<storage, read_write> mask: array<u32>;
@compute @workgroup_size(256)
fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_index) localInvocationIndex: u32) {
  ${getGPUGridIndexInvocationIndexSource(dispatch)}
  if (index < ${mask.length}u) { mask[${getViewElementOffset(mask)}u + index] = 0u; }
}`
        })
      );
    }
    const cellCount = this.index.cellOffsets.length - 1;
    const cells = alignGraphVectorViews(graph, [
      getGraphDataRange(graph, this.index.cellOffsets, 0, cellCount),
      getGraphDataRange(graph, this.index.cellOffsets, 1, cellCount)
    ]);
    let objectStart = 0;
    for (const [objectChunkIndex, objectIds] of getGraphVectorData(
      this.index.objectIds
    ).entries()) {
      if (!objectIds.length) continue;
      const ranks = createTransientView(
        graph,
        `${this.id}-ranks-${objectChunkIndex}`,
        'uint32',
        objectIds.length
      );
      const dispatch = getGPUGridIndexDispatchLayout(objectIds.length, maximum);
      nodes.push(
        createChunkNode(graph, {
          id: `${this.id}-clear-ranks-${objectChunkIndex}`,
          outputs: {ranks},
          dispatch,
          source: `
@group(0) @binding(0) var<storage, read_write> ranks: array<u32>;
@compute @workgroup_size(256)
fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_index) localInvocationIndex: u32) {
  ${getGPUGridIndexInvocationIndexSource(dispatch)}
  if (index < ${objectIds.length}u) { ranks[index] = 0xffffffffu; }
}`
        })
      );
      let cellStart = 0;
      for (const [cellChunkIndex, [starts, ends]] of cells.entries()) {
        nodes.push(
          createChunkNode(graph, {
            id: `${this.id}-query-${objectChunkIndex}-${cellChunkIndex}`,
            inputs: {starts, ends, indexCount: this.index.count, queryValues: this.query},
            outputs: {ranks, outputCount: this.count, outputOverflow: this.overflow},
            dispatch,
            source: `
const WIDTH: u32 = ${this.index.gridSize[0]}u;
const HEIGHT: u32 = ${this.index.gridSize[1]}u;
const DEPTH: u32 = ${this.index.gridSize[2] ?? 1}u;
const QUERY_OFFSET: u32 = ${getViewElementOffset(this.query)}u;
@group(0) @binding(0) var<storage, read> starts: array<u32>;
@group(0) @binding(1) var<storage, read> ends: array<u32>;
@group(0) @binding(2) var<storage, read> indexCount: array<u32>;
@group(0) @binding(3) var<storage, read> queryValues: array<f32>;
@group(0) @binding(4) var<storage, read_write> ranks: array<u32>;
@group(0) @binding(5) var<storage, read_write> outputCount: array<atomic<u32>>;
@group(0) @binding(6) var<storage, read_write> outputOverflow: array<atomic<u32>>;
fn finite(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

fn getCoordinate(value: f32, minimum: f32, maximum: f32, size: u32) -> u32 {
  if (!finite(value)) { return 0u; }
  if (maximum == minimum || value == minimum) { return 0u; }
  if (value == maximum) { return size - 1u; }
  if (minimum < 0.0 && maximum > 0.0) {
    let scale = max(abs(minimum), abs(maximum));
    let scaledValue = value / scale;
    let scaledMinimum = minimum / scale;
    let scaledMaximum = maximum / scale;
    return min(
      u32((scaledValue - scaledMinimum) / (scaledMaximum - scaledMinimum) * f32(size)),
      size - 1u
    );
  }
  return min(u32((value - minimum) / (maximum - minimum) * f32(size)), size - 1u);
}
fn cellMinimum(coordinate: u32, size: u32, minimum: f32, maximum: f32) -> f32 {
  let ratio = f32(coordinate) / f32(size);
  return minimum * (1.0 - ratio) + maximum * ratio;
}

fn cellMaximum(coordinate: u32, size: u32, minimum: f32, maximum: f32) -> f32 {
  if (coordinate + 1u == size) { return maximum; }
  let ratio = f32(coordinate + 1u) / f32(size);
  return minimum * (1.0 - ratio) + maximum * ratio;
}

@compute @workgroup_size(256)
fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_index) localInvocationIndex: u32) {
  ${getGPUGridIndexInvocationIndexSource(dispatch)}
  if (index >= ${objectIds.length}u) { return; }
  let objectIndex = ${objectStart}u + index;
  if (objectIndex >= indexCount[${getViewElementOffset(this.index.count)}u]) { return; }
  var low = 0u;
  var high = ${ends.length}u;
  loop {
    if (low >= high) { break; }
    let middle = low + (high - low) / 2u;
    if (ends[${getViewElementOffset(ends)}u + middle] <= objectIndex) { low = middle + 1u; }
    else { high = middle; }
  }
  if (low == ${ends.length}u) { return; }
  if (starts[${getViewElementOffset(starts)}u + low] > objectIndex) { return; }
  let cellIndex = ${cellStart}u + low;
  let column = cellIndex % WIDTH;
  let row = (cellIndex / WIDTH) % HEIGHT;
  let layer = cellIndex / (WIDTH * HEIGHT);
  ${makeCellSelection(this)}
  if (selected) {
    let destination = atomicAdd(&outputCount[${getViewElementOffset(this.count)}u], 1u);
    ranks[index] = destination;
    if (destination >= ${this.output.length}u) { atomicStore(&outputOverflow[${getViewElementOffset(this.overflow)}u], 1u); }
  }
}`
          })
        );
        cellStart += starts.length;
      }
      nodes.push(
        ...new GPUScatter({
          id: `${this.id}-scatter-${objectChunkIndex}`,
          source: objectIds,
          indices: ranks,
          output: this.output
        }).getCommandNodes(graph)
      );
      let maskStart = 0;
      for (const [maskChunkIndex, mask] of (this.outputMask
        ? getGraphVectorData(this.outputMask)
        : []
      ).entries()) {
        if (mask.length)
          nodes.push(
            createChunkNode(graph, {
              id: `${this.id}-mask-${objectChunkIndex}-${maskChunkIndex}`,
              inputs: {objectIds, ranks},
              outputs: {mask},
              dispatch,
              source: `
@group(0) @binding(0) var<storage, read> objectIds: array<u32>;
@group(0) @binding(1) var<storage, read> ranks: array<u32>;
@group(0) @binding(2) var<storage, read_write> mask: array<atomic<u32>>;
@compute @workgroup_size(256)
fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_index) localInvocationIndex: u32) {
  ${getGPUGridIndexInvocationIndexSource(dispatch)}
  if (index >= ${objectIds.length}u) { return; }
  if (ranks[index] == 0xffffffffu) { return; }
  let objectId = objectIds[${getViewElementOffset(objectIds)}u + index];
  if (objectId >= ${maskStart}u && objectId - ${maskStart}u < ${mask.length}u) {
    atomicStore(&mask[${getViewElementOffset(mask)}u + objectId - ${maskStart}u], 1u);
  }
}`
            })
          );
        maskStart += mask.length;
      }
      objectStart += objectIds.length;
    }
    return nodes;
  }
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
  const closestPoints = axes
    .map(
      axis =>
        `let closest${axis.name.toUpperCase()} = clamp(query${axis.name.toUpperCase()}, cellMin${axis.name.toUpperCase()}, cellMax${axis.name.toUpperCase()});`
    )
    .join('\n  ');
  const scale = makeNestedMaximum([
    'radius',
    ...axes.flatMap(axis => [
      `abs(query${axis.name.toUpperCase()})`,
      `abs(closest${axis.name.toUpperCase()})`
    ])
  ]);
  const squaredDistance = axes
    .map(
      axis =>
        `(query${axis.name.toUpperCase()} / scale - closest${axis.name.toUpperCase()} / scale) * (query${axis.name.toUpperCase()} / scale - closest${axis.name.toUpperCase()} / scale)`
    )
    .join(' + ');
  return `${cellDeclarations}
  ${values}
  let radius = queryValues[QUERY_OFFSET + ${dimension}u];
  ${closestPoints}
  let scale = ${scale};
  let selected = ${validCenter} && finite(radius) && radius >= 0.0 && (scale == 0.0 || ${squaredDistance} <= (radius / scale) * (radius / scale));`;
}

function makeNestedMaximum(values: string[]): string {
  return values.slice(1).reduce((maximum, value) => `max(${maximum}, ${value})`, values[0]);
}

function validateDisjointQueryViews(
  id: string,
  index: GPUGridIndexView,
  query: GraphDataView<'float32'>,
  outputs: (GraphDataView<'uint32'> | GraphVectorView<'uint32'>)[]
): void {
  const inputs: [string, GraphDataView | GraphVectorView][] = [
    ['index cellOffsets', index.cellOffsets],
    ['index objectIds', index.objectIds],
    ['index count', index.count],
    ['index overflow', index.overflow],
    ['query', query]
  ];
  const outputNames = ['output', 'count', 'overflow', 'outputMask'];
  for (let outputIndex = 0; outputIndex < outputs.length; outputIndex++) {
    const output = outputs[outputIndex];
    for (const [inputName, input] of inputs) {
      if (
        getGraphVectorData(output).some(write =>
          getGraphVectorData(input).some(read => doGraphDataViewsOverlap(write, read))
        )
      ) {
        throw new Error(`${id} ${outputNames[outputIndex]} and ${inputName} must not overlap`);
      }
    }
    for (let previousIndex = 0; previousIndex < outputIndex; previousIndex++) {
      if (
        getGraphVectorData(output).some(write =>
          getGraphVectorData(outputs[previousIndex]).some(previous =>
            doGraphDataViewsOverlap(write, previous)
          )
        )
      ) {
        throw new Error(
          `${id} ${outputNames[outputIndex]} and ${outputNames[previousIndex]} must not overlap`
        );
      }
    }
  }
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
    for (const chunk of getGraphVectorData(view))
      validatePackedUint32View(chunk, `${id} index ${name}`);
  }
  if (index.cellOffsets.length !== cellCount + 1) {
    throw new Error(`${id} index cellOffsets.length must equal cellCount + 1`);
  }
  if (index.count.length < 1 || index.overflow.length < 1) {
    throw new Error(`${id} index count and overflow must each contain one uint32 row`);
  }
}

function getFloatLiteral(value: number): string {
  const literal = `${Math.fround(value)}`;
  return literal.includes('.') || literal.includes('e') ? literal : `${literal}.0`;
}
