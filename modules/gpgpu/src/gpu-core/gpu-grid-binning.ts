// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUCommandNode} from './gpu-command-node';
import {
  GPUCommandGraph,
  GraphVectorView,
  type GraphBufferUse,
  type GraphDataView
} from './gpu-command-graph';
import {
  getViewElementOffset,
  validatePackedUint32View,
  validatePackedView
} from './graph-data-view-utils';
import {
  getGPUShaderSubgroupStrategy,
  getSubgroupBallotHelpersWGSL,
  getSubgroupCoalescedAtomicAddWGSL
} from './gpu-subgroup-utils';

import {getGraphVectorData} from './graph-vector-view-utils';
import {getBoundedDispatchLayout, getBoundedInvocationIndexSource} from './gpu-dispatch-utils';
import {getSpatialCommandNodes, validateSpatialWrites} from './gpu-spatial-utils';

const GRID_WORKGROUP_SIZE = 256;
const MAXIMUM_LOCAL_CELL_COUNT = 256;
const MAXIMUM_SUBGROUP_COALESCED_CELL_COUNT = 16;

/** Literal `[minX, minY, maxX, maxY]` bounds or one GPU-resident `float32x4` row. */
export type GPUGridBinningBounds =
  | readonly [number, number, number, number]
  | GraphDataView<'float32x4'>;

/** Packed float32x2 graph data accepted by {@link GPUGridBinning}. */
export type GPUGridBinningPositions = GraphDataView<'float32x2'> | GraphVectorView<'float32x2'>;

/** Properties for graph-native two-dimensional grid counting. */
export type GPUGridBinningProps = {
  /** Prefix for generated graph node IDs. */
  id?: string;
  /** One packed position view or an ordered vector of packed position chunks. */
  positions: GPUGridBinningPositions;
  /** Caller-owned row-major cell counts. */
  output: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  /** Positive integer `[width, height]` cell dimensions. */
  gridSize: readonly [number, number];
  /** Inclusive literal or GPU-resident spatial bounds. */
  bounds: GPUGridBinningBounds;
};

/**
 * Graph-native row-major count accumulation for packed `float32x2` positions.
 *
 * Output is cleared on every encoding. Output chunks with up to 256 cells use workgroup-local atomics;
 * larger chunks use global atomics. Non-finite and out-of-bounds positions are ignored, while exact
 * maximum boundaries enter the final row or column.
 */
export class GPUGridBinning {
  /** Prefix for generated graph node IDs. */
  readonly id: string;
  /** Packed two-dimensional positions or ordered position vector. */
  readonly positions: GPUGridBinningPositions;
  /** Caller-owned row-major cell counts. */
  readonly output: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  /** Positive integer grid dimensions. */
  readonly gridSize: readonly [number, number];
  /** Literal or GPU-resident spatial bounds. */
  readonly bounds: GPUGridBinningBounds;

  /**
   * Creates and validates a two-dimensional grid-binning description.
   *
   * @throws If view layouts, grid dimensions, output length, ownership, or bounds are invalid.
   */
  constructor(props: GPUGridBinningProps) {
    this.id = props.id ?? 'gpu-grid-binning';
    this.positions = props.positions;
    this.output = props.output;
    this.gridSize = props.gridSize;
    this.bounds = props.bounds;
    for (const chunk of getPositionChunks(this.positions)) {
      validatePackedView(chunk, ['float32x2'], `${this.id} positions`);
    }
    for (const chunk of getGraphVectorData(this.output))
      validatePackedUint32View(chunk, `${this.id} output`);
    validateSpatialWrites(
      this.id,
      getPositionChunks(this.positions),
      getGraphVectorData(this.output)
    );
    const [width, height] = this.gridSize;
    if (
      !Number.isSafeInteger(width) ||
      !Number.isSafeInteger(height) ||
      width <= 0 ||
      height <= 0
    ) {
      throw new Error(`${this.id} gridSize must contain two positive integers`);
    }
    if (
      !Number.isSafeInteger(width * height) ||
      width * height > 0xffffffff ||
      this.output.length !== width * height
    ) {
      throw new Error(`${this.id} output.length must equal gridSize width * height`);
    }
    if (
      getPositionChunks(this.positions).some(chunk =>
        getGraphVectorData(this.output).some(output => chunk.buffer === output.buffer)
      )
    ) {
      throw new Error(`${this.id} positions and output must use separate buffers`);
    }
    if (Array.isArray(this.bounds)) {
      const [minimumX, minimumY, maximumX, maximumY] = this.bounds;
      if (
        this.bounds.length !== 4 ||
        !this.bounds.every(Number.isFinite) ||
        minimumX > maximumX ||
        minimumY > maximumY
      ) {
        throw new Error(`${this.id} literal bounds must be finite [minX, minY, maxX, maxY]`);
      }
    } else if (isGPUGridBoundsView(this.bounds)) {
      validatePackedView(this.bounds, ['float32x4'], `${this.id} bounds`);
      if (this.bounds.length !== 1) {
        throw new Error(`${this.id} GPU bounds must contain one float32x4 row`);
      }
      if (
        getGraphVectorData(this.output).some(
          output => output.buffer === (this.bounds as GraphDataView).buffer
        )
      ) {
        throw new Error(`${this.id} bounds and output must use separate buffers`);
      }
    }
  }

  /**
   * Adds a clear and non-empty input accumulation passes for each output chunk.
   *
   * This method declares work only and does not submit or read back commands.
   */
  getCommandNodes<Parameters>(
    graph: GPUCommandGraph<Parameters>
  ): readonly GPUCommandNode<Parameters>[] {
    const nodes: GPUCommandNode<Parameters>[] = [];
    if (
      getPositionChunks(this.positions).some(chunk => chunk.buffer.graph !== graph) ||
      getGraphVectorData(this.output).some(chunk => chunk.buffer.graph !== graph)
    ) {
      throw new Error(`${this.id} views must belong to the target graph`);
    }
    if (isGPUGridBoundsView(this.bounds) && this.bounds.buffer.graph !== graph) {
      throw new Error(`${this.id} bounds must belong to the target graph`);
    }
    let outputStart = 0;
    for (const [outputIndex, output] of getGraphVectorData(this.output).entries()) {
      if (output.length) {
        const id = `${this.id}-output-${outputIndex}`;
        nodes.push(...addClearGridPass(graph, id, output));
        for (const [chunkIndex, positions] of getPositionChunks(this.positions).entries()) {
          if (positions.length)
            nodes.push(
              ...addGridPass(graph, {
                id: `${id}-input-${chunkIndex}`,
                positions,
                output,
                outputStart,
                gridSize: this.gridSize,
                bounds: this.bounds
              })
            );
        }
      }
      outputStart += output.length;
    }

    return nodes;
  }
}

/** Clears every output cell before accumulation for the current graph encoding. */
function addClearGridPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  output: GraphDataView<'uint32'>
): readonly GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
  const passId = `${id}-clear`;
  const dispatch = getBoundedDispatchLayout(
    id,
    output.length,
    GRID_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = /* wgsl */ `
const CELL_COUNT: u32 = ${output.length}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(output)}u;
@group(0) @binding(0) var<storage, read_write> outputCounts: array<atomic<u32>>;
@compute @workgroup_size(${GRID_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatch, GRID_WORKGROUP_SIZE)}
  if (index < CELL_COUNT) { atomicStore(&outputCounts[OUTPUT_OFFSET + index], 0u); }
}`;
  nodes.push(
    ...getSpatialCommandNodes(graph, {
      id: passId,
      source,
      resources: [{buffer: output, usage: 'storage-write'}],
      bindings: {outputCounts: output},
      dispatch
    })
  );

  return nodes;
}

/** Adds the local- or global-atomic row-major grid accumulation pass. */
function addGridPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  binning: {
    id: string;
    positions: GraphDataView<'float32x2'>;
    output: GraphDataView<'uint32'>;
    outputStart: number;
    gridSize: readonly [number, number];
    bounds: GPUGridBinningBounds;
  }
): readonly GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
  const [width, height] = binning.gridSize;
  const dispatch = getBoundedDispatchLayout(
    binning.id,
    binning.positions.length,
    GRID_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const local = binning.output.length <= MAXIMUM_LOCAL_CELL_COUNT;
  const useSubgroups =
    local &&
    binning.output.length <= MAXIMUM_SUBGROUP_COALESCED_CELL_COUNT &&
    getGPUShaderSubgroupStrategy(graph.device) === 'subgroups';
  const gpuBounds = isGPUGridBoundsView(binning.bounds);
  const literalBounds = binning.bounds as readonly [number, number, number, number];
  const boundsBinding = gpuBounds
    ? '@group(0) @binding(1) var<storage, read> boundsValues: array<f32>;'
    : '';
  const outputBinding = gpuBounds ? 2 : 1;
  const boundsInitialization = gpuBounds
    ? `let minimumX = boundsValues[BOUNDS_OFFSET];
  let minimumY = boundsValues[BOUNDS_OFFSET + 1u];
  let maximumX = boundsValues[BOUNDS_OFFSET + 2u];
  let maximumY = boundsValues[BOUNDS_OFFSET + 3u];`
    : `let minimumX = ${getFloatLiteral(literalBounds[0])};
  let minimumY = ${getFloatLiteral(literalBounds[1])};
  let maximumX = ${getFloatLiteral(literalBounds[2])};
  let maximumY = ${getFloatLiteral(literalBounds[3])};`;
  const localAccumulation = useSubgroups
    ? getSubgroupCoalescedAtomicAddWGSL(
        'accepted',
        'cellIndex',
        'localCounts',
        binning.output.length
      )
    : '  if (accepted) { atomicAdd(&localCounts[cellIndex], 1u); }';
  const accumulation = local
    ? `${localAccumulation}
  workgroupBarrier();
  if (lane < CELL_COUNT) {
    atomicAdd(&outputCounts[OUTPUT_OFFSET + lane], atomicLoad(&localCounts[lane]));
  }`
    : 'if (accepted) { atomicAdd(&outputCounts[OUTPUT_OFFSET + cellIndex], 1u); }';
  const source = /* wgsl */ `
${useSubgroups ? 'enable subgroups;' : ''}
const ELEMENT_COUNT: u32 = ${binning.positions.length}u;
const WIDTH: u32 = ${width}u;
const HEIGHT: u32 = ${height}u;
const CELL_COUNT: u32 = ${binning.output.length}u;
const OUTPUT_START: u32 = ${binning.outputStart}u;
const POSITIONS_OFFSET: u32 = ${getViewElementOffset(binning.positions)}u;
${gpuBounds ? `const BOUNDS_OFFSET: u32 = ${getViewElementOffset(binning.bounds as GraphDataView)}u;` : ''}
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(binning.output)}u;
@group(0) @binding(0) var<storage, read> positions: array<f32>;
${boundsBinding}
@group(0) @binding(${outputBinding}) var<storage, read_write> outputCounts: array<atomic<u32>>;
${local ? `var<workgroup> localCounts: array<atomic<u32>, ${binning.output.length}>;` : ''}
${useSubgroups ? getSubgroupBallotHelpersWGSL() : ''}

fn getCoordinate(value: f32, minimum: f32, maximum: f32, size: u32) -> u32 {
  if (maximum == minimum || value == minimum) { return 0u; }
  if (value == maximum) { return size - 1u; }
  return min(u32((value - minimum) / (maximum - minimum) * f32(size)), size - 1u);
}

@compute @workgroup_size(${GRID_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(local_invocation_id) localId: vec3<u32>${useSubgroups ? ',\n  @builtin(subgroup_invocation_id) subgroupInvocationId: u32' : ''}
) {
  ${getBoundedInvocationIndexSource(dispatch, GRID_WORKGROUP_SIZE)}
  let lane = localId.x;
  ${boundsInitialization}
  ${local ? 'if (lane < CELL_COUNT) { atomicStore(&localCounts[lane], 0u); }\n  workgroupBarrier();' : ''}
  var accepted = false;
  var cellIndex = 0u;
  if (index < ELEMENT_COUNT && maximumX >= minimumX && maximumY >= minimumY) {
    let x = positions[POSITIONS_OFFSET + index * 2u];
    let y = positions[POSITIONS_OFFSET + index * 2u + 1u];
    let finite = x == x && y == y && abs(x) <= 3.402823466e+38 && abs(y) <= 3.402823466e+38;
    let inX = x >= minimumX && x <= maximumX && (maximumX != minimumX || x == minimumX);
    let inY = y >= minimumY && y <= maximumY && (maximumY != minimumY || y == minimumY);
    if (finite && inX && inY) {
      let column = getCoordinate(x, minimumX, maximumX, WIDTH);
      let row = getCoordinate(y, minimumY, maximumY, HEIGHT);
      let globalCell = row * WIDTH + column;
      accepted = globalCell >= OUTPUT_START && globalCell - OUTPUT_START < CELL_COUNT;
      if (accepted) { cellIndex = globalCell - OUTPUT_START; }
    }
  }
  ${accumulation}
}`;
  const resources: GraphBufferUse[] = [
    {buffer: binning.positions, usage: 'storage-read'},
    ...(gpuBounds
      ? ([{buffer: binning.bounds as GraphDataView, usage: 'storage-read'}] as GraphBufferUse[])
      : []),
    {buffer: binning.output, usage: 'storage-read-write'}
  ];
  nodes.push(
    ...getSpatialCommandNodes(graph, {
      id: `${binning.id}-${local ? 'local' : 'global'}`,
      source,
      resources,
      bindings: {
        positions: binning.positions,
        ...(gpuBounds ? {boundsValues: binning.bounds as GraphDataView} : {}),
        outputCounts: binning.output
      },
      dispatch
    })
  );

  return nodes;
}

/** Formats a finite JavaScript number as a WGSL `f32` literal. */
function getFloatLiteral(value: number): string {
  return Number.isInteger(value) ? `${value}.0` : `${value}`;
}

/** Narrows grid bounds to their GPU-resident `float32x4` view form. */
function isGPUGridBoundsView(bounds: GPUGridBinningBounds): bounds is GraphDataView<'float32x4'> {
  return !Array.isArray(bounds);
}

function getPositionChunks(
  positions: GPUGridBinningPositions
): readonly GraphDataView<'float32x2'>[] {
  return positions instanceof GraphVectorView ? positions.data : [positions];
}
