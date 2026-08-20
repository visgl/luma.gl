// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {
  GPUCommandGraph,
  GraphVectorView,
  type GraphBufferUse,
  type GraphDataView
} from './gpu-command-graph';
import type {GPUGridBinningBounds} from './gpu-grid-binning';
import {
  createTransientView,
  getViewBinding,
  getViewElementOffset,
  validateMatchingVectorTopology,
  validatePackedView
} from './graph-data-view-utils';
import {getGPUShaderSubgroupStrategy, getSubgroupBallotHelpersWGSL} from './gpu-subgroup-utils';

const GRID_AGGREGATION_WORKGROUP_SIZE = 256;
const MAXIMUM_SUBGROUP_COALESCED_CELL_COUNT = 16;

/** Packed point positions accepted by {@link GPUGridAggregation}. */
export type GPUGridAggregationPositions = GraphDataView<'float32x2'> | GraphVectorView<'float32x2'>;

/** Packed point weights accepted by {@link GPUGridAggregation}. */
export type GPUGridAggregationWeights = GraphDataView<'float32'> | GraphVectorView<'float32'>;

/** Floating-point statistic accumulated by {@link GPUGridAggregation}. */
export type GPUGridAggregationOperation = 'sum' | 'min' | 'max' | 'mean';

/** Properties for graph-native weighted two-dimensional grid aggregation. */
export type GPUGridAggregationProps = {
  /** Prefix for generated graph node IDs. */
  id?: string;
  /** One packed position view or an ordered vector of packed position chunks. */
  positions: GPUGridAggregationPositions;
  /** One finite floating-point contribution per position with identical chunk topology. */
  weights: GPUGridAggregationWeights;
  /** Caller-owned row-major floating-point cell statistics. */
  output: GraphDataView<'float32'>;
  /** Cell statistic to compute. Defaults to `'sum'`. */
  operation?: GPUGridAggregationOperation;
  /** Positive integer `[width, height]` cell dimensions. */
  gridSize: readonly [number, number];
  /** Inclusive literal or GPU-resident spatial bounds. */
  bounds: GPUGridBinningBounds;
};

/**
 * Graph-native weighted statistics for packed `float32x2` positions.
 *
 * Each accepted position contributes its paired finite `float32` weight to one row-major cell.
 * Output is initialized on every encoding. Sum and mean use atomic compare-exchange addition and
 * therefore follow ordinary `float32` rounding without a defined accumulation order. Minimum and
 * maximum use monotonically ordered float bits with native integer atomics. Empty sum cells
 * contain positive zero; other operations use NaN.
 */
export class GPUGridAggregation {
  /** Prefix for generated graph node IDs. */
  readonly id: string;
  /** Packed positions or ordered position vector. */
  readonly positions: GPUGridAggregationPositions;
  /** Packed weights with the same view kind and chunk topology as positions. */
  readonly weights: GPUGridAggregationWeights;
  /** Caller-owned row-major floating-point cell statistics. */
  readonly output: GraphDataView<'float32'>;
  /** Cell statistic computed by this aggregation. */
  readonly operation: GPUGridAggregationOperation;
  /** Positive integer grid dimensions. */
  readonly gridSize: readonly [number, number];
  /** Literal or GPU-resident spatial bounds. */
  readonly bounds: GPUGridBinningBounds;

  /**
   * Creates and validates a weighted grid-aggregation description.
   *
   * @throws If view layouts, paired chunk topology, grid dimensions, output length, ownership, or
   * bounds are invalid.
   */
  constructor(props: GPUGridAggregationProps) {
    this.id = props.id ?? 'gpu-grid-aggregation';
    this.positions = props.positions;
    this.weights = props.weights;
    this.output = props.output;
    this.operation = props.operation ?? 'sum';
    this.gridSize = props.gridSize;
    this.bounds = props.bounds;

    for (const chunk of getPositionChunks(this.positions)) {
      validatePackedView(chunk, ['float32x2'], `${this.id} positions`);
    }
    for (const chunk of getWeightChunks(this.weights)) {
      validatePackedView(chunk, ['float32'], `${this.id} weights`);
    }
    validateMatchingInputs(this.positions, this.weights, this.id);
    validatePackedView(this.output, ['float32'], `${this.id} output`);

    const [width, height] = this.gridSize;
    if (
      !Number.isSafeInteger(width) ||
      !Number.isSafeInteger(height) ||
      width <= 0 ||
      height <= 0
    ) {
      throw new Error(`${this.id} gridSize must contain two positive integers`);
    }
    if (this.output.length !== width * height) {
      throw new Error(`${this.id} output.length must equal gridSize width * height`);
    }
    if (!['sum', 'min', 'max', 'mean'].includes(this.operation)) {
      throw new Error(`${this.id} operation must be sum, min, max, or mean`);
    }
    if (this.operation === 'mean' && this.positions.length > 0xffffffff) {
      throw new Error(`${this.id} mean input length must fit in uint32 cell counts`);
    }
    if (
      getPositionChunks(this.positions).some(chunk => chunk.buffer === this.output.buffer) ||
      getWeightChunks(this.weights).some(chunk => chunk.buffer === this.output.buffer)
    ) {
      throw new Error(`${this.id} inputs and output must use separate buffers`);
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
      if (this.bounds.buffer === this.output.buffer) {
        throw new Error(`${this.id} bounds and output must use separate buffers`);
      }
    }
  }

  /**
   * Adds initialization, one accumulation pass per non-empty aligned chunk, and finalization when
   * required by the selected statistic.
   *
   * This method declares work only and does not submit or read back commands.
   */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const positionChunks = getPositionChunks(this.positions);
    const weightChunks = getWeightChunks(this.weights);
    if (
      positionChunks.some(chunk => chunk.buffer.graph !== graph) ||
      weightChunks.some(chunk => chunk.buffer.graph !== graph) ||
      this.output.buffer.graph !== graph
    ) {
      throw new Error(`${this.id} views must belong to the target graph`);
    }
    if (isGPUGridBoundsView(this.bounds) && this.bounds.buffer.graph !== graph) {
      throw new Error(`${this.id} bounds must belong to the target graph`);
    }

    const counts =
      this.operation === 'mean'
        ? createTransientView(graph, `${this.id}-counts`, 'uint32', this.output.length)
        : undefined;
    addInitializeGridAggregationPass(graph, this.id, this.output, this.operation, counts);
    for (let chunkIndex = 0; chunkIndex < positionChunks.length; chunkIndex++) {
      if (positionChunks[chunkIndex].length > 0) {
        addGridAggregationPass(graph, {
          id:
            this.positions instanceof GraphVectorView ? `${this.id}-chunk-${chunkIndex}` : this.id,
          positions: positionChunks[chunkIndex],
          weights: weightChunks[chunkIndex],
          output: this.output,
          operation: this.operation,
          counts,
          gridSize: this.gridSize,
          bounds: this.bounds
        });
      }
    }
    if (this.operation !== 'sum') {
      addFinalizeGridAggregationPass(graph, this.id, this.output, this.operation, counts);
    }
  }
}

/** Initializes every output cell and optional mean count before accumulation. */
function addInitializeGridAggregationPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  output: GraphDataView<'float32'>,
  operation: GPUGridAggregationOperation,
  counts?: GraphDataView<'uint32'>
): void {
  const initialBits = operation === 'min' ? '0xffffffffu' : '0u';
  const countBinding = counts
    ? '@group(0) @binding(1) var<storage, read_write> outputCounts: array<atomic<u32>>;'
    : '';
  const countInitialization = counts
    ? `atomicStore(&outputCounts[${getViewElementOffset(counts)}u + globalId.x], 0u);`
    : '';
  const source = /* wgsl */ `
const CELL_COUNT: u32 = ${output.length}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(output)}u;
@group(0) @binding(0) var<storage, read_write> outputValues: array<atomic<u32>>;
${countBinding}
@compute @workgroup_size(${GRID_AGGREGATION_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>
) {
  if (globalId.x < CELL_COUNT) {
    atomicStore(&outputValues[OUTPUT_OFFSET + globalId.x], ${initialBits});
    ${countInitialization}
  }
}`;
  addComputationPass(graph, {
    id: operation === 'sum' ? `${id}-clear` : `${id}-initialize`,
    source,
    resources: [
      {buffer: output, usage: 'storage-write'},
      ...(counts ? ([{buffer: counts, usage: 'storage-write'}] as GraphBufferUse[]) : [])
    ],
    bindings: {outputValues: output, ...(counts ? {outputCounts: counts} : {})},
    dispatchCount: Math.ceil(output.length / GRID_AGGREGATION_WORKGROUP_SIZE)
  });
}

/** Adds one direct global-atomic weighted-statistic accumulation pass. */
function addGridAggregationPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  aggregation: {
    id: string;
    positions: GraphDataView<'float32x2'>;
    weights: GraphDataView<'float32'>;
    output: GraphDataView<'float32'>;
    operation: GPUGridAggregationOperation;
    counts?: GraphDataView<'uint32'>;
    gridSize: readonly [number, number];
    bounds: GPUGridBinningBounds;
  }
): void {
  const [width, height] = aggregation.gridSize;
  const useSubgroups =
    aggregation.output.length <= MAXIMUM_SUBGROUP_COALESCED_CELL_COUNT &&
    getGPUShaderSubgroupStrategy(graph.device) === 'subgroups';
  const gpuBounds = isGPUGridBoundsView(aggregation.bounds);
  const literalBounds = aggregation.bounds as readonly [number, number, number, number];
  const boundsBinding = gpuBounds
    ? '@group(0) @binding(2) var<storage, read> boundsValues: array<f32>;'
    : '';
  const outputBinding = gpuBounds ? 3 : 2;
  const countsBinding = aggregation.counts
    ? `@group(0) @binding(${outputBinding + 1}) var<storage, read_write> outputCounts: array<atomic<u32>>;`
    : '';
  const boundsInitialization = gpuBounds
    ? `let minimumX = boundsValues[BOUNDS_OFFSET];
  let minimumY = boundsValues[BOUNDS_OFFSET + 1u];
  let maximumX = boundsValues[BOUNDS_OFFSET + 2u];
  let maximumY = boundsValues[BOUNDS_OFFSET + 3u];`
    : `let minimumX = ${getFloatLiteral(literalBounds[0])};
  let minimumY = ${getFloatLiteral(literalBounds[1])};
  let maximumX = ${getFloatLiteral(literalBounds[2])};
  let maximumY = ${getFloatLiteral(literalBounds[3])};`;
  const accumulation = useSubgroups
    ? getSubgroupGridAggregationWGSL(
        aggregation.operation,
        aggregation.output.length,
        aggregation.counts
      )
    : `  if (accepted) {
    ${getAggregationCall(aggregation.operation)}
    ${aggregation.counts ? `atomicAdd(&outputCounts[${getViewElementOffset(aggregation.counts)}u + cellIndex], 1u);` : ''}
  }`;
  const source = /* wgsl */ `
${useSubgroups ? 'enable subgroups;' : ''}
const ELEMENT_COUNT: u32 = ${aggregation.positions.length}u;
const WIDTH: u32 = ${width}u;
const HEIGHT: u32 = ${height}u;
const POSITIONS_OFFSET: u32 = ${getViewElementOffset(aggregation.positions)}u;
const WEIGHTS_OFFSET: u32 = ${getViewElementOffset(aggregation.weights)}u;
${gpuBounds ? `const BOUNDS_OFFSET: u32 = ${getViewElementOffset(aggregation.bounds as GraphDataView)}u;` : ''}
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(aggregation.output)}u;
@group(0) @binding(0) var<storage, read> positions: array<f32>;
@group(0) @binding(1) var<storage, read> weights: array<f32>;
${boundsBinding}
@group(0) @binding(${outputBinding}) var<storage, read_write> outputValues: array<atomic<u32>>;
${countsBinding}

fn getCoordinate(value: f32, minimum: f32, maximum: f32, size: u32) -> u32 {
  if (maximum == minimum || value == minimum) { return 0u; }
  if (value == maximum) { return size - 1u; }
  return min(u32((value - minimum) / (maximum - minimum) * f32(size)), size - 1u);
}

${getAggregationFunction(aggregation.operation)}
${useSubgroups ? getSubgroupBallotHelpersWGSL() : ''}

@compute @workgroup_size(${GRID_AGGREGATION_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>${useSubgroups ? ',\n  @builtin(subgroup_invocation_id) subgroupInvocationId: u32' : ''}
) {
  let index = globalId.x;
  ${boundsInitialization}
  var accepted = false;
  var cellIndex = 0u;
  var weight = 0.0;
  if (index < ELEMENT_COUNT && maximumX >= minimumX && maximumY >= minimumY) {
    let x = positions[POSITIONS_OFFSET + index * 2u];
    let y = positions[POSITIONS_OFFSET + index * 2u + 1u];
    weight = weights[WEIGHTS_OFFSET + index];
    let finitePosition = x == x && y == y && abs(x) <= 3.402823466e+38 && abs(y) <= 3.402823466e+38;
    let finiteWeight = weight == weight && abs(weight) <= 3.402823466e+38;
    let inX = x >= minimumX && x <= maximumX && (maximumX != minimumX || x == minimumX);
    let inY = y >= minimumY && y <= maximumY && (maximumY != minimumY || y == minimumY);
    if (finitePosition && finiteWeight && inX && inY) {
      let column = getCoordinate(x, minimumX, maximumX, WIDTH);
      let row = getCoordinate(y, minimumY, maximumY, HEIGHT);
      cellIndex = row * WIDTH + column;
      accepted = true;
    }
  }
${accumulation}
}`;
  const resources: GraphBufferUse[] = [
    {buffer: aggregation.positions, usage: 'storage-read'},
    {buffer: aggregation.weights, usage: 'storage-read'},
    ...(gpuBounds
      ? ([{buffer: aggregation.bounds as GraphDataView, usage: 'storage-read'}] as GraphBufferUse[])
      : []),
    {buffer: aggregation.output, usage: 'storage-read-write'},
    ...(aggregation.counts
      ? ([{buffer: aggregation.counts, usage: 'storage-read-write'}] as GraphBufferUse[])
      : [])
  ];
  addComputationPass(graph, {
    id: `${aggregation.id}-${aggregation.operation}`,
    source,
    resources,
    bindings: {
      positions: aggregation.positions,
      weights: aggregation.weights,
      ...(gpuBounds ? {boundsValues: aggregation.bounds as GraphDataView} : {}),
      outputValues: aggregation.output,
      ...(aggregation.counts ? {outputCounts: aggregation.counts} : {})
    },
    dispatchCount: Math.ceil(aggregation.positions.length / GRID_AGGREGATION_WORKGROUP_SIZE)
  });
}

/** Converts aggregate identities into empty-cell NaNs and divides sums for means. */
function addFinalizeGridAggregationPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  output: GraphDataView<'float32'>,
  operation: Exclude<GPUGridAggregationOperation, 'sum'>,
  counts?: GraphDataView<'uint32'>
): void {
  const countBinding = counts
    ? '@group(0) @binding(1) var<storage, read> outputCounts: array<u32>;'
    : '';
  const finalizeStatement =
    operation === 'mean'
      ? `let count = outputCounts[${getViewElementOffset(counts as GraphDataView)}u + index];
    if (count == 0u) {
      outputValues[OUTPUT_OFFSET + index] = 0x7fc00000u;
    } else {
      let sum = bitcast<f32>(outputValues[OUTPUT_OFFSET + index]);
      outputValues[OUTPUT_OFFSET + index] = bitcast<u32>(sum / f32(count));
    }`
      : `let orderedValue = outputValues[OUTPUT_OFFSET + index];
    if (orderedValue == ${operation === 'min' ? '0xffffffffu' : '0u'}) {
      outputValues[OUTPUT_OFFSET + index] = 0x7fc00000u;
    } else {
      outputValues[OUTPUT_OFFSET + index] = bitcast<u32>(decodeOrderedFloat(orderedValue));
    }`;
  const decodeFunction =
    operation === 'mean'
      ? ''
      : `fn decodeOrderedFloat(value: u32) -> f32 {
  let bits = select(~value, value ^ 0x80000000u, (value & 0x80000000u) != 0u);
  return bitcast<f32>(bits);
}`;
  const source = /* wgsl */ `
const CELL_COUNT: u32 = ${output.length}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(output)}u;
@group(0) @binding(0) var<storage, read_write> outputValues: array<u32>;
${countBinding}
${decodeFunction}
@compute @workgroup_size(${GRID_AGGREGATION_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>
) {
  let index = globalId.x;
  if (index < CELL_COUNT) {
    ${finalizeStatement}
  }
}`;
  addComputationPass(graph, {
    id: `${id}-finalize`,
    source,
    resources: [
      {buffer: output, usage: 'storage-read-write'},
      ...(counts ? ([{buffer: counts, usage: 'storage-read'}] as GraphBufferUse[]) : [])
    ],
    bindings: {outputValues: output, ...(counts ? {outputCounts: counts} : {})},
    dispatchCount: Math.ceil(output.length / GRID_AGGREGATION_WORKGROUP_SIZE)
  });
}

/** Returns the WGSL helper for one cell operation. */
function getAggregationFunction(operation: GPUGridAggregationOperation): string {
  if (operation === 'min' || operation === 'max') {
    return `fn encodeOrderedFloat(value: f32) -> u32 {
  let bits = bitcast<u32>(value);
  return select(bits ^ 0x80000000u, ~bits, (bits & 0x80000000u) != 0u);
}`;
  }
  return `fn atomicAddFloat(destination: ptr<storage, atomic<u32>, read_write>, value: f32) {
  var oldBits = atomicLoad(destination);
  loop {
    let newBits = bitcast<u32>(bitcast<f32>(oldBits) + value);
    let result = atomicCompareExchangeWeak(destination, oldBits, newBits);
    if (result.exchanged) { break; }
    oldBits = result.old_value;
  }
}`;
}

/** Returns the WGSL statement that contributes one accepted weight. */
function getAggregationCall(
  operation: GPUGridAggregationOperation,
  cellIndex: string = 'cellIndex',
  valueExpression: string = 'weight'
): string {
  if (operation === 'min' || operation === 'max') {
    const atomicOperation = operation === 'min' ? 'atomicMin' : 'atomicMax';
    return `${atomicOperation}(&outputValues[OUTPUT_OFFSET + ${cellIndex}], encodeOrderedFloat(${valueExpression}));`;
  }
  return `atomicAddFloat(&outputValues[OUTPUT_OFFSET + ${cellIndex}], ${valueExpression});`;
}

/** Coalesces equal cell keys and emits one statistic atomic per represented subgroup cell. */
function getSubgroupGridAggregationWGSL(
  operation: GPUGridAggregationOperation,
  cellCount: number,
  counts?: GraphDataView<'uint32'>
): string {
  const orderedOperation = operation === 'min' || operation === 'max';
  const selectedWeight = orderedOperation
    ? `select(${operation === 'min' ? '0xffffffffu' : '0u'}, encodeOrderedFloat(weight), matchingCell)`
    : 'select(0.0, weight, matchingCell)';
  const collective =
    operation === 'min'
      ? 'subgroupMin(selectedWeight)'
      : operation === 'max'
        ? 'subgroupMax(selectedWeight)'
        : 'subgroupAdd(selectedWeight)';
  const aggregationCall = orderedOperation
    ? `${operation === 'min' ? 'atomicMin' : 'atomicMax'}(&outputValues[OUTPUT_OFFSET + leaderCell], aggregatedWeight);`
    : getAggregationCall(operation, 'leaderCell', 'aggregatedWeight');
  return /* wgsl */ `
  var subgroupPending = accepted;
  for (var subgroupCell = 0u; subgroupCell < ${cellCount}u; subgroupCell++) {
    let pendingBallot = subgroupBallot(subgroupPending);
    let hasPending = any(pendingBallot != vec4<u32>(0u));
    let leaderInvocation = getFirstBallotLane(pendingBallot);
    let leaderCell = subgroupShuffle(cellIndex, leaderInvocation);
    let matchingCell = hasPending && subgroupPending && cellIndex == leaderCell;
    let matchingBallot = subgroupBallot(matchingCell);
    let selectedWeight = ${selectedWeight};
    let aggregatedWeight = ${collective};
    if (hasPending && subgroupInvocationId == leaderInvocation) {
      ${aggregationCall}
      ${counts ? `atomicAdd(&outputCounts[${getViewElementOffset(counts)}u + leaderCell], getBallotLaneCount(matchingBallot));` : ''}
    }
    subgroupPending = subgroupPending && !matchingCell;
  }`;
}

/** Wraps generated WGSL in a graph compute node with deferred physical buffer resolution. */
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

/** Formats a finite JavaScript number as a WGSL `f32` literal. */
function getFloatLiteral(value: number): string {
  return Number.isInteger(value) ? `${value}.0` : `${value}`;
}

/** Narrows grid bounds to their GPU-resident `float32x4` view form. */
function isGPUGridBoundsView(bounds: GPUGridBinningBounds): bounds is GraphDataView<'float32x4'> {
  return !Array.isArray(bounds);
}

function getPositionChunks(
  positions: GPUGridAggregationPositions
): readonly GraphDataView<'float32x2'>[] {
  return positions instanceof GraphVectorView ? positions.data : [positions];
}

function getWeightChunks(weights: GPUGridAggregationWeights): readonly GraphDataView<'float32'>[] {
  return weights instanceof GraphVectorView ? weights.data : [weights];
}

/** Requires row-aligned atomic views or vectors with identical ordered chunk boundaries. */
function validateMatchingInputs(
  positions: GPUGridAggregationPositions,
  weights: GPUGridAggregationWeights,
  id: string
): void {
  if (positions instanceof GraphVectorView && weights instanceof GraphVectorView) {
    validateMatchingVectorTopology(positions, weights, `${id} positions and weights`);
  } else if (positions instanceof GraphVectorView || weights instanceof GraphVectorView) {
    throw new Error(`${id} positions and weights must both be data views or both be vectors`);
  } else if (positions.length !== weights.length) {
    throw new Error(`${id} positions and weights must contain the same number of rows`);
  }
}
