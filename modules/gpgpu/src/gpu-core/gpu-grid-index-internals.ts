// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {
  type GPUCommandGraph,
  type GraphBufferUse,
  type GraphDataView,
  GraphVectorView
} from './gpu-command-graph';
import {
  type GPUBoundedDispatchLayout,
  getBoundedDispatchLayout,
  getBoundedInvocationIndexSource
} from './gpu-dispatch-utils';
import type {
  GPUGridIndex,
  GPUGridIndexBounds,
  GPUGridIndexPositions,
  GPUGridIndexSize,
  GPUGridIndexSourceIds
} from './gpu-grid-index';
import {addGPUScanToGraphWithDispatchLimit, GPUScan} from './gpu-scan';
import {createTransientView, getViewBinding, getViewElementOffset} from './graph-data-view-utils';

const GRID_INDEX_WORKGROUP_SIZE = 256;
type GPUGridIndexDispatchLayout = GPUBoundedDispatchLayout;

/** Adds an index rebuild using an explicit device dispatch limit. @internal */
export function addGPUGridIndexToGraphWithDispatchLimit<Parameters>(
  index: GPUGridIndex,
  graph: GPUCommandGraph<Parameters>,
  maxComputeWorkgroupsPerDimension: number
): void {
  const views = [
    ...getPositionChunks(index.positions),
    ...getSourceIdChunks(index.sourceIds),
    index.cellOffsets,
    index.objectIds,
    index.count,
    index.overflow
  ];
  if (views.some(view => view.buffer.graph !== graph)) {
    throw new Error(`${index.id} views must belong to the target graph`);
  }

  const cellCounts = createTransientView(
    graph,
    `${index.id}-cell-counts`,
    'uint32',
    index.cellCount
  );
  const cellCursors = createTransientView(
    graph,
    `${index.id}-cell-cursors`,
    'uint32',
    index.cellCount
  );
  const scannedOffsets = createTransientView(
    graph,
    `${index.id}-scanned-offsets`,
    'uint32',
    index.cellCount
  );

  addInitializePass(graph, index.id, cellCounts, cellCursors, {
    dispatchLayout: getGPUGridIndexDispatchLayout(
      cellCounts.length,
      maxComputeWorkgroupsPerDimension
    )
  });
  const positionChunks = getPositionChunks(index.positions);
  for (let chunkIndex = 0; chunkIndex < positionChunks.length; chunkIndex++) {
    const positions = positionChunks[chunkIndex];
    if (positions.length > 0) {
      addCountPass(graph, {
        id: `${index.id}-count-${chunkIndex}`,
        positions,
        cellCounts,
        gridSize: index.gridSize,
        bounds: index.bounds,
        dimension: index.dimension,
        dispatchLayout: getGPUGridIndexDispatchLayout(
          positions.length,
          maxComputeWorkgroupsPerDimension
        )
      });
    }
  }
  const scan = new GPUScan({
    id: `${index.id}-scan`,
    input: cellCounts,
    output: scannedOffsets
  });
  addGPUScanToGraphWithDispatchLimit(scan, graph, maxComputeWorkgroupsPerDimension);
  addFinalizePass(graph, {
    id: `${index.id}-finalize`,
    cellCounts,
    scannedOffsets,
    cellOffsets: index.cellOffsets,
    count: index.count,
    overflow: index.overflow,
    capacity: index.objectIds.length,
    dispatchLayout: getGPUGridIndexDispatchLayout(
      cellCounts.length,
      maxComputeWorkgroupsPerDimension
    )
  });

  const sourceIdChunks = getSourceIdChunks(index.sourceIds);
  let sourceBase = index.firstSourceIndex;
  for (let chunkIndex = 0; chunkIndex < positionChunks.length; chunkIndex++) {
    const positions = positionChunks[chunkIndex];
    if (positions.length > 0 && index.objectIds.length > 0) {
      addScatterPass(graph, {
        id: `${index.id}-scatter-${chunkIndex}`,
        positions,
        sourceIds: sourceIdChunks[chunkIndex],
        sourceBase,
        scannedOffsets,
        cellCursors,
        objectIds: index.objectIds,
        gridSize: index.gridSize,
        bounds: index.bounds,
        dimension: index.dimension,
        dispatchLayout: getGPUGridIndexDispatchLayout(
          positions.length,
          maxComputeWorkgroupsPerDimension
        )
      });
    }
    sourceBase += positions.length;
  }
}

function addInitializePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  cellCounts: GraphDataView<'uint32'>,
  cellCursors: GraphDataView<'uint32'>,
  props: {dispatchLayout: GPUGridIndexDispatchLayout}
): void {
  const source = /* wgsl */ `
const CELL_COUNT: u32 = ${cellCounts.length}u;
const COUNTS_OFFSET: u32 = ${getViewElementOffset(cellCounts)}u;
const CURSORS_OFFSET: u32 = ${getViewElementOffset(cellCursors)}u;
@group(0) @binding(0) var<storage, read_write> cellCounts: array<u32>;
@group(0) @binding(1) var<storage, read_write> cellCursors: array<u32>;
@compute @workgroup_size(${GRID_INDEX_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getGPUGridIndexInvocationIndexSource(props.dispatchLayout)}
  if (index >= CELL_COUNT) { return; }
  cellCounts[COUNTS_OFFSET + index] = 0u;
  cellCursors[CURSORS_OFFSET + index] = 0u;
}`;
  addComputationPass(graph, {
    id: `${id}-initialize`,
    source,
    resources: [
      {buffer: cellCounts, usage: 'storage-write'},
      {buffer: cellCursors, usage: 'storage-write'}
    ],
    bindings: {cellCounts, cellCursors},
    dispatchLayout: props.dispatchLayout
  });
}

function addCountPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    positions: GraphDataView<'float32x2'> | GraphDataView<'float32x3'>;
    cellCounts: GraphDataView<'uint32'>;
    gridSize: GPUGridIndexSize;
    bounds: GPUGridIndexBounds;
    dimension: 2 | 3;
    dispatchLayout: GPUGridIndexDispatchLayout;
  }
): void {
  const source = makePositionPassSource(
    props,
    /* wgsl */ `
  if (accepted) { atomicAdd(&cellCounts[COUNTS_OFFSET + cellIndex], 1u); }`,
    false
  );
  addComputationPass(graph, {
    id: props.id,
    source,
    resources: [
      {buffer: props.positions, usage: 'storage-read'},
      {buffer: props.cellCounts, usage: 'storage-read-write'}
    ],
    bindings: {positions: props.positions, cellCounts: props.cellCounts},
    dispatchLayout: props.dispatchLayout
  });
}

function addFinalizePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    cellCounts: GraphDataView<'uint32'>;
    scannedOffsets: GraphDataView<'uint32'>;
    cellOffsets: GraphDataView<'uint32'>;
    count: GraphDataView<'uint32'>;
    overflow: GraphDataView<'uint32'>;
    capacity: number;
    dispatchLayout: GPUGridIndexDispatchLayout;
  }
): void {
  const source = /* wgsl */ `
const CELL_COUNT: u32 = ${props.cellCounts.length}u;
const CAPACITY: u32 = ${props.capacity}u;
const COUNTS_OFFSET: u32 = ${getViewElementOffset(props.cellCounts)}u;
const SCANNED_OFFSET: u32 = ${getViewElementOffset(props.scannedOffsets)}u;
const OFFSETS_OFFSET: u32 = ${getViewElementOffset(props.cellOffsets)}u;
const COUNT_OFFSET: u32 = ${getViewElementOffset(props.count)}u;
const OVERFLOW_OFFSET: u32 = ${getViewElementOffset(props.overflow)}u;
@group(0) @binding(0) var<storage, read> cellCounts: array<u32>;
@group(0) @binding(1) var<storage, read> scannedOffsets: array<u32>;
@group(0) @binding(2) var<storage, read_write> cellOffsets: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputCount: array<u32>;
@group(0) @binding(4) var<storage, read_write> outputOverflow: array<u32>;
@compute @workgroup_size(${GRID_INDEX_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getGPUGridIndexInvocationIndexSource(props.dispatchLayout)}
  if (index < CELL_COUNT) {
    cellOffsets[OFFSETS_OFFSET + index] = scannedOffsets[SCANNED_OFFSET + index];
  }
  if (index == 0u) {
    let last = CELL_COUNT - 1u;
    let total = scannedOffsets[SCANNED_OFFSET + last] + cellCounts[COUNTS_OFFSET + last];
    cellOffsets[OFFSETS_OFFSET + CELL_COUNT] = total;
    outputCount[COUNT_OFFSET] = total;
    outputOverflow[OVERFLOW_OFFSET] = select(0u, 1u, total > CAPACITY);
  }
}`;
  addComputationPass(graph, {
    id: props.id,
    source,
    resources: [
      {buffer: props.cellCounts, usage: 'storage-read'},
      {buffer: props.scannedOffsets, usage: 'storage-read'},
      {buffer: props.cellOffsets, usage: 'storage-write'},
      {buffer: props.count, usage: 'storage-write'},
      {buffer: props.overflow, usage: 'storage-write'}
    ],
    bindings: {
      cellCounts: props.cellCounts,
      scannedOffsets: props.scannedOffsets,
      cellOffsets: props.cellOffsets,
      outputCount: props.count,
      outputOverflow: props.overflow
    },
    dispatchLayout: props.dispatchLayout
  });
}

function addScatterPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    positions: GraphDataView<'float32x2'> | GraphDataView<'float32x3'>;
    sourceIds?: GraphDataView<'uint32'>;
    sourceBase: number;
    scannedOffsets: GraphDataView<'uint32'>;
    cellCursors: GraphDataView<'uint32'>;
    objectIds: GraphDataView<'uint32'>;
    gridSize: GPUGridIndexSize;
    bounds: GPUGridIndexBounds;
    dimension: 2 | 3;
    dispatchLayout: GPUGridIndexDispatchLayout;
  }
): void {
  const sourceIdBinding = props.sourceIds
    ? '@group(0) @binding(4) var<storage, read> sourceIds: array<u32>;'
    : '';
  const sourceId = props.sourceIds
    ? 'sourceIds[SOURCE_IDS_OFFSET + index]'
    : `${props.sourceBase}u + index`;
  const body = /* wgsl */ `
  if (accepted) {
    let cellOffset = scannedOffsets[SCANNED_OFFSET + cellIndex];
    let cellIndexOffset = atomicAdd(&cellCursors[CURSORS_OFFSET + cellIndex], 1u);
    let outputIndex = cellOffset + cellIndexOffset;
    if (outputIndex < CAPACITY) { objectIds[OBJECT_IDS_OFFSET + outputIndex] = ${sourceId}; }
  }`;
  const source = makePositionPassSource(props, body, true).replace(
    '// SOURCE_ID_BINDING',
    sourceIdBinding
  );
  const resources: GraphBufferUse[] = [
    {buffer: props.positions, usage: 'storage-read'},
    {buffer: props.scannedOffsets, usage: 'storage-read'},
    {buffer: props.cellCursors, usage: 'storage-read-write'},
    {buffer: props.objectIds, usage: 'storage-write'},
    ...(props.sourceIds
      ? ([{buffer: props.sourceIds, usage: 'storage-read'}] as GraphBufferUse[])
      : [])
  ];
  addComputationPass(graph, {
    id: props.id,
    source,
    resources,
    bindings: {
      positions: props.positions,
      scannedOffsets: props.scannedOffsets,
      cellCursors: props.cellCursors,
      objectIds: props.objectIds,
      ...(props.sourceIds ? {sourceIds: props.sourceIds} : {})
    },
    dispatchLayout: props.dispatchLayout
  });
}

function makePositionPassSource(
  props: {
    positions: GraphDataView<'float32x2'> | GraphDataView<'float32x3'>;
    gridSize: GPUGridIndexSize;
    bounds: GPUGridIndexBounds;
    dimension: 2 | 3;
    cellCounts?: GraphDataView<'uint32'>;
    scannedOffsets?: GraphDataView<'uint32'>;
    cellCursors?: GraphDataView<'uint32'>;
    objectIds?: GraphDataView<'uint32'>;
    sourceIds?: GraphDataView<'uint32'>;
    dispatchLayout: GPUGridIndexDispatchLayout;
  },
  body: string,
  scatter: boolean
): string {
  const width = props.gridSize[0];
  const height = props.gridSize[1];
  const depth = props.dimension === 3 ? props.gridSize[2] : 1;
  const maximaOffset = props.dimension;
  const zDeclarations =
    props.dimension === 3
      ? `let z = positions[POSITIONS_OFFSET + index * 3u + 2u];
    let finiteZ = z == z && abs(z) <= 3.402823466e+38;
    let inZ = z >= ${getFloatLiteral(props.bounds[2]!)} && z <= ${getFloatLiteral(props.bounds[5]!)};`
      : 'let finiteZ = true;\n    let inZ = true;';
  const zCoordinate =
    props.dimension === 3
      ? `let layer = getCoordinate(z, ${getFloatLiteral(props.bounds[2]!)}, ${getFloatLiteral(props.bounds[5]!)}, DEPTH);`
      : 'let layer = 0u;';
  const extraConstants = scatter
    ? `const SCANNED_OFFSET: u32 = ${getViewElementOffset(props.scannedOffsets!)}u;
const CURSORS_OFFSET: u32 = ${getViewElementOffset(props.cellCursors!)}u;
const OBJECT_IDS_OFFSET: u32 = ${getViewElementOffset(props.objectIds!)}u;
const CAPACITY: u32 = ${props.objectIds!.length}u;
${props.sourceIds ? `const SOURCE_IDS_OFFSET: u32 = ${getViewElementOffset(props.sourceIds)}u;` : ''}`
    : `const COUNTS_OFFSET: u32 = ${getViewElementOffset(props.cellCounts!)}u;`;
  const bindings = scatter
    ? `@group(0) @binding(1) var<storage, read> scannedOffsets: array<u32>;
@group(0) @binding(2) var<storage, read_write> cellCursors: array<atomic<u32>>;
@group(0) @binding(3) var<storage, read_write> objectIds: array<u32>;
// SOURCE_ID_BINDING`
    : '@group(0) @binding(1) var<storage, read_write> cellCounts: array<atomic<u32>>;';
  return /* wgsl */ `
const ELEMENT_COUNT: u32 = ${props.positions.length}u;
const POSITIONS_OFFSET: u32 = ${getViewElementOffset(props.positions)}u;
const WIDTH: u32 = ${width}u;
const HEIGHT: u32 = ${height}u;
const DEPTH: u32 = ${depth}u;
${extraConstants}
@group(0) @binding(0) var<storage, read> positions: array<f32>;
${bindings}

fn getCoordinate(value: f32, minimum: f32, maximum: f32, size: u32) -> u32 {
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

@compute @workgroup_size(${GRID_INDEX_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getGPUGridIndexInvocationIndexSource(props.dispatchLayout)}
  var accepted = false;
  var cellIndex = 0u;
  if (index < ELEMENT_COUNT) {
    let x = positions[POSITIONS_OFFSET + index * ${props.dimension}u];
    let y = positions[POSITIONS_OFFSET + index * ${props.dimension}u + 1u];
    ${zDeclarations}
    let finiteXY = x == x && y == y && abs(x) <= 3.402823466e+38 && abs(y) <= 3.402823466e+38;
    let inX = x >= ${getFloatLiteral(props.bounds[0])} && x <= ${getFloatLiteral(props.bounds[maximaOffset])};
    let inY = y >= ${getFloatLiteral(props.bounds[1])} && y <= ${getFloatLiteral(props.bounds[maximaOffset + 1])};
    if (finiteXY && finiteZ && inX && inY && inZ) {
      accepted = true;
      let column = getCoordinate(x, ${getFloatLiteral(props.bounds[0])}, ${getFloatLiteral(props.bounds[maximaOffset])}, WIDTH);
      let row = getCoordinate(y, ${getFloatLiteral(props.bounds[1])}, ${getFloatLiteral(props.bounds[maximaOffset + 1])}, HEIGHT);
      ${zCoordinate}
      cellIndex = (layer * HEIGHT + row) * WIDTH + column;
    }
  }
  ${body}
}`;
}

function addComputationPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    source: string;
    resources: GraphBufferUse[];
    bindings: Record<string, GraphDataView>;
    dispatchLayout: GPUGridIndexDispatchLayout;
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
          computation.dispatch(
            computePass,
            props.dispatchLayout.x,
            props.dispatchLayout.y,
            props.dispatchLayout.z
          );
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

/** Plans a bounded three-dimensional dispatch for one grid-index pass. @internal */
export function getGPUGridIndexDispatchLayout(
  elementCount: number,
  maxComputeWorkgroupsPerDimension: number
): GPUGridIndexDispatchLayout {
  return getBoundedDispatchLayout(
    'GPUGridIndex',
    elementCount,
    GRID_INDEX_WORKGROUP_SIZE,
    maxComputeWorkgroupsPerDimension
  );
}

/** Returns WGSL that maps a bounded 3D dispatch to one linear element index. @internal */
export function getGPUGridIndexInvocationIndexSource(layout: GPUGridIndexDispatchLayout): string {
  return getBoundedInvocationIndexSource(layout, GRID_INDEX_WORKGROUP_SIZE);
}

function getPositionChunks(
  positions: GPUGridIndexPositions
): readonly (GraphDataView<'float32x2'> | GraphDataView<'float32x3'>)[] {
  return positions instanceof GraphVectorView ? positions.data : [positions];
}

function getSourceIdChunks(sourceIds?: GPUGridIndexSourceIds): readonly GraphDataView<'uint32'>[] {
  if (!sourceIds) return [];
  return sourceIds instanceof GraphVectorView ? sourceIds.data : [sourceIds];
}

function getFloatLiteral(value: number): string {
  const literal = `${Math.fround(value)}`;
  return literal.includes('.') || literal.includes('e') ? literal : `${literal}.0`;
}
