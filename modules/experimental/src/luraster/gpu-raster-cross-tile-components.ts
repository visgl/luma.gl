// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding, BindingDeclaration} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import type {
  GPUCommandGraph,
  GPUCommandGraphContributor,
  GraphBufferUsage,
  GraphDataView,
  GraphResourceUse
} from '../gpu-primitives/gpu-command-graph';
import {GPUScan} from '../gpu-primitives/gpu-scan';
import {GPUSort} from '../gpu-primitives/gpu-sort';
import {
  createTransientView,
  getViewBinding,
  getViewElementOffset,
  validatePackedView
} from '../gpu-primitives/graph-data-view-utils';
import type {GPURasterConnectivity} from './gpu-raster-connected-components';
import type {GPURasterRegionMeasurementOutputs} from './gpu-raster-region-measurements';
import type {GPURasterPixelBounds} from './gpu-raster-tile-source';
import {
  assertRasterStorageBindingFits,
  getRasterDispatchSize,
  getRasterFloatLiteral,
  hasMatchingRasterCoordinateReferenceSystem,
  MAXIMUM_RASTER_PIXEL_COUNT,
  RASTER_WORKGROUP_DIMENSION,
  validateRasterMetadata,
  validateRasterScalarView,
  validateRasterValidityView
} from './raster-utils';
import type {GPURasterMetadata} from './types';

/** One disjoint, already-labeled tile with local mergeable measurements and global destinations. */
export type GPURasterCrossTile = {
  metadata: GPURasterMetadata;
  /** Owned half-open rectangle in the global metadata's current overview-level coordinates. */
  pixelBounds: GPURasterPixelBounds;
  labels: GraphDataView<'uint32'>;
  labelValidity: GraphDataView<'uint32'>;
  componentCount: GraphDataView<'uint32'>;
  converged: GraphDataView<'uint32'>;
  overflow: GraphDataView<'uint32'>;
  measurements: GPURasterRegionMeasurementOutputs;
  /** Caller-owned global dense labels; valid background remains distinct from missing values. */
  outputLabels: GraphDataView<'uint32'>;
  outputValidity: GraphDataView<'uint32'>;
};

/** Bounded tile identities, global dense status, and caller-owned merged region columns. */
export type GPURasterCrossTileComponentsProps = {
  id?: string;
  metadata: GPURasterMetadata;
  tiles: readonly GPURasterCrossTile[];
  connectivity?: GPURasterConnectivity;
  maximumIterations?: number;
  componentCount: GraphDataView<'uint32'>;
  requiredComponentCount?: GraphDataView<'uint32'>;
  converged: GraphDataView<'uint32'>;
  /** One on upstream, global-capacity, malformed-population, or unsigned count overflow. */
  overflow: GraphDataView<'uint32'>;
  output: GPURasterRegionMeasurementOutputs;
  capacity?: number;
};

type PlannedTile = {
  tile: GPURasterCrossTile;
  index: number;
  candidateOffset: number;
  candidateCount: number;
  width: number;
  height: number;
};

type TileSeam = {
  first: PlannedTile;
  second: PlannedTile;
  kind: 'horizontal' | 'vertical' | 'corner';
  start: number;
  length: number;
  firstCorner?: readonly [number, number];
  secondCorner?: readonly [number, number];
};

type CrossTileBinding = {
  name: string;
  view: GraphDataView;
  usage: Extract<GraphBufferUsage, 'storage-read' | 'storage-write' | 'storage-read-write'>;
};

type CrossTileScratch = {
  ready: GraphDataView<'uint32'>;
  changed: GraphDataView<'uint32'>;
  rootPositions: GraphDataView<'uint32'>;
  candidateIndices: GraphDataView<'uint32'>;
  sortedPositions: GraphDataView<'uint32'>;
  sortedCandidates: GraphDataView<'uint32'>;
  candidateRanks: GraphDataView<'uint32'>;
  parents: GraphDataView<'uint32'>;
  rootFlags: GraphDataView<'uint32'>;
  rootOffsets: GraphDataView<'uint32'>;
};

const MAXIMUM_CROSS_TILE_ITERATIONS = 64;
const MAXIMUM_SORT_CANDIDATE_COUNT = 0x80000000;
const MAXIMUM_PARENT_DEPTH = 32;
const LINEAR_WORKGROUP_SIZE = 256;

/**
 * Reconciles bounded tile-local regions into globally ordered, seam-aware connected components.
 *
 * Candidate representatives are ranked by their true global row-major pixel positions using the
 * shared stable {@link GPUSort}; atomic-min seam unions therefore agree with monolithic minimum
 * roots regardless of tile arrival order. Four-connectivity links touching edges; eight-connectivity
 * additionally links shifted edge diagonals and four-tile corner junctions. A bounded union budget,
 * explicit upstream status, caller-owned dense outputs, saturating unsigned populations, and merged
 * calibrated intensity/moment partials remain entirely inside the caller's command graph.
 */
export class GPURasterCrossTileComponents implements GPUCommandGraphContributor {
  readonly id: string;
  readonly metadata: GPURasterMetadata;
  readonly tiles: readonly GPURasterCrossTile[];
  readonly connectivity: GPURasterConnectivity;
  readonly maximumIterations: number;
  readonly componentCount: GraphDataView<'uint32'>;
  readonly requiredComponentCount?: GraphDataView<'uint32'>;
  readonly converged: GraphDataView<'uint32'>;
  readonly overflow: GraphDataView<'uint32'>;
  readonly output: GPURasterRegionMeasurementOutputs;
  readonly capacity: number;
  private readonly plannedTiles: readonly PlannedTile[];
  private readonly seams: readonly TileSeam[];
  private readonly candidateCount: number;

  constructor(props: GPURasterCrossTileComponentsProps) {
    this.id = props.id ?? 'gpu-raster-cross-tile-components';
    this.metadata = props.metadata;
    this.connectivity = props.connectivity ?? 4;
    this.componentCount = props.componentCount;
    this.requiredComponentCount = props.requiredComponentCount;
    this.converged = props.converged;
    this.overflow = props.overflow;
    this.output = props.output;
    validateRasterMetadata(this.metadata, `${this.id} metadata`);
    if (this.connectivity !== 4 && this.connectivity !== 8) {
      throw new Error(`${this.id} connectivity must be four or eight`);
    }
    if (!Array.isArray(props.tiles) || props.tiles.length === 0) {
      throw new Error(`${this.id} requires at least one explicitly owned tile`);
    }
    const sortedTiles = [...props.tiles].sort(compareTileBounds);
    this.tiles = sortedTiles;
    let candidateCount = 0;
    this.plannedTiles = sortedTiles.map((tile, index) => {
      validateTileMetadata(tile, this.metadata, `${this.id} tile ${index}`);
      const regionCount = validateMeasurementOutputs(tile.measurements, `${this.id} tile ${index}`);
      if (regionCount === 0) {
        throw new Error(`${this.id} tile region capacity must contain at least one candidate`);
      }
      const width = tile.pixelBounds[2] - tile.pixelBounds[0];
      const height = tile.pixelBounds[3] - tile.pixelBounds[1];
      const pixelCount = width * height;
      validateRasterScalarView(
        tile.labels,
        'uint32',
        pixelCount,
        `${this.id} tile ${index} labels`
      );
      validateRasterValidityView(
        tile.labelValidity,
        pixelCount,
        `${this.id} tile ${index} validity`
      );
      validateRasterValidityView(
        tile.componentCount,
        1,
        `${this.id} tile ${index} component count`
      );
      validateRasterValidityView(tile.converged, 1, `${this.id} tile ${index} convergence`);
      validateRasterValidityView(tile.overflow, 1, `${this.id} tile ${index} overflow`);
      validateRasterScalarView(
        tile.outputLabels,
        'uint32',
        pixelCount,
        `${this.id} tile ${index} global labels`
      );
      validateRasterValidityView(
        tile.outputValidity,
        pixelCount,
        `${this.id} tile ${index} global validity`
      );
      const plan = {
        tile,
        index,
        candidateOffset: candidateCount,
        candidateCount: regionCount,
        width,
        height
      };
      candidateCount += regionCount;
      if (candidateCount > MAXIMUM_SORT_CANDIDATE_COUNT) {
        throw new Error(
          `${this.id} total local region capacity exceeds the bounded uint32 GPU sort`
        );
      }
      return plan;
    });
    this.candidateCount = candidateCount;
    this.maximumIterations =
      props.maximumIterations ??
      Math.min(
        MAXIMUM_CROSS_TILE_ITERATIONS,
        Math.max(1, Math.ceil(Math.log2(candidateCount)) + 2)
      );
    if (
      !Number.isSafeInteger(this.maximumIterations) ||
      this.maximumIterations < 1 ||
      this.maximumIterations > MAXIMUM_CROSS_TILE_ITERATIONS
    ) {
      throw new Error(`${this.id} maximum iterations must be an integer from one through 64`);
    }

    const globalCapacity = validateMeasurementOutputs(this.output, `${this.id} global`);
    this.capacity = props.capacity ?? globalCapacity;
    if (
      !Number.isSafeInteger(this.capacity) ||
      this.capacity < 0 ||
      this.capacity > globalCapacity
    ) {
      throw new Error(
        `${this.id} global capacity must be an integer from zero through output length`
      );
    }
    validateRasterValidityView(this.componentCount, 1, `${this.id} global component count`);
    validateRasterValidityView(this.converged, 1, `${this.id} global convergence`);
    validateRasterValidityView(this.overflow, 1, `${this.id} global overflow`);
    if (this.requiredComponentCount) {
      validateRasterValidityView(
        this.requiredComponentCount,
        1,
        `${this.id} global required count`
      );
    }
    const owner = this.componentCount.buffer.graph;
    for (const view of this.getBorrowedViews()) {
      if (view.buffer.graph !== owner) {
        throw new Error(`${this.id} tile and global resources must belong to the same graph`);
      }
    }
    const writableViews = this.getWritableViews();
    const inputViews = this.getInputViews();
    for (const [index, output] of writableViews.entries()) {
      if (
        inputViews.some(input => input.buffer === output.buffer) ||
        writableViews.slice(index + 1).some(other => other.buffer === output.buffer)
      ) {
        throw new Error(
          `${this.id} caller-owned outputs must use distinct buffers separate from inputs`
        );
      }
    }
    this.seams = makeTileSeams(this.plannedTiles, this.connectivity, this.id);
    const [horizontalScale, horizontalShear, , verticalShear, verticalScale] = this.metadata.affine;
    getRasterFloatLiteral(
      Math.abs(horizontalScale * verticalScale - horizontalShear * verticalShear)
    );
  }

  /** Declares deterministic representative sorting, bounded seam unions, relabeling, and merges. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    if (graph.device.type !== 'webgpu') {
      throw new Error(`${this.id} cross-tile segmentation requires a WebGPU device`);
    }
    for (const view of this.getBorrowedViews()) {
      if (view.buffer.graph !== graph) {
        throw new Error(`${this.id} resources must belong to the target graph`);
      }
      if (view.length > 0) {
        assertRasterStorageBindingFits(graph.device, view, `${this.id} ${view.buffer.id}`);
      }
    }
    if (
      graph.device.limits.maxComputeInvocationsPerWorkgroup < LINEAR_WORKGROUP_SIZE ||
      graph.device.limits.maxComputeWorkgroupSizeX < LINEAR_WORKGROUP_SIZE
    ) {
      throw new Error(`${this.id} sorting and grouping exceed device workgroup limits`);
    }
    assertLinearDispatchFits(graph, this.candidateCount, this.id);
    if (this.output.pixelCounts.length > 0) {
      assertLinearDispatchFits(graph, this.output.pixelCounts.length, `${this.id} global regions`);
    }
    for (const plan of this.plannedTiles) {
      getRasterDispatchSize(graph.device, plan.width, plan.height, `${this.id} tile ${plan.index}`);
      assertLinearDispatchFits(graph, plan.candidateCount, `${this.id} tile ${plan.index} regions`);
    }

    const scratch: CrossTileScratch = {
      ready: createTransientView(graph, `${this.id}-ready`, 'uint32', 1),
      changed: createTransientView(graph, `${this.id}-changed`, 'uint32', 1),
      rootPositions: createTransientView(
        graph,
        `${this.id}-root-positions`,
        'uint32',
        this.candidateCount
      ),
      candidateIndices: createTransientView(
        graph,
        `${this.id}-candidate-indices`,
        'uint32',
        this.candidateCount
      ),
      sortedPositions: createTransientView(
        graph,
        `${this.id}-sorted-positions`,
        'uint32',
        this.candidateCount
      ),
      sortedCandidates: createTransientView(
        graph,
        `${this.id}-sorted-candidates`,
        'uint32',
        this.candidateCount
      ),
      candidateRanks: createTransientView(
        graph,
        `${this.id}-candidate-ranks`,
        'uint32',
        this.candidateCount
      ),
      parents: createTransientView(graph, `${this.id}-parents`, 'uint32', this.candidateCount),
      rootFlags: createTransientView(graph, `${this.id}-root-flags`, 'uint32', this.candidateCount),
      rootOffsets: createTransientView(
        graph,
        `${this.id}-root-offsets`,
        'uint32',
        this.candidateCount
      )
    };
    for (const view of Object.values(scratch)) {
      assertRasterStorageBindingFits(graph.device, view, `${this.id} ${view.buffer.id}`);
    }

    this.addControlInitialization(graph, scratch);
    for (const tile of this.plannedTiles) this.addTileInitialization(graph, scratch, tile);
    for (const tile of this.plannedTiles) this.addRepresentativePass(graph, scratch, tile);
    for (const tile of this.plannedTiles) this.addRepresentativeValidation(graph, scratch, tile);
    new GPUSort({
      id: `${this.id}-sort-global-roots`,
      keys: scratch.rootPositions,
      values: scratch.candidateIndices,
      outputKeys: scratch.sortedPositions,
      outputValues: scratch.sortedCandidates,
      direction: 'ascending'
    }).addToGraph(graph);
    this.addRankInitialization(graph, scratch);
    for (let iteration = 0; iteration < this.maximumIterations; iteration++) {
      for (const seam of this.seams) this.addSeamPass(graph, scratch, seam, iteration);
      this.addCompressionPass(graph, scratch, iteration);
      this.addConvergencePass(graph, scratch, iteration);
    }
    this.addRootFlagPass(graph, scratch);
    new GPUScan({
      id: `${this.id}-scan-global-roots`,
      input: scratch.rootFlags,
      output: scratch.rootOffsets,
      mode: 'exclusive'
    }).addToGraph(graph);
    this.addCountPublication(graph, scratch);
    for (const tile of this.plannedTiles) this.addTilePublication(graph, scratch, tile);
    if (this.output.pixelCounts.length > 0) {
      this.addOutputInitialization(graph);
      for (const tile of this.plannedTiles) this.addTileMeasurements(graph, scratch, tile);
      this.addIntensityFinalization(graph);
      this.addGeometryFinalization(graph);
    }
  }

  private addControlInitialization<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    scratch: CrossTileScratch
  ): void {
    const bindings: CrossTileBinding[] = [
      {name: 'readyValues', view: scratch.ready, usage: 'storage-write'},
      {name: 'changeValues', view: scratch.changed, usage: 'storage-write'},
      {name: 'globalCounts', view: this.componentCount, usage: 'storage-write'},
      {name: 'globalConvergence', view: this.converged, usage: 'storage-write'},
      {name: 'globalOverflow', view: this.overflow, usage: 'storage-write'},
      ...(this.requiredComponentCount
        ? [
            {
              name: 'requiredCounts',
              view: this.requiredComponentCount,
              usage: 'storage-write' as const
            }
          ]
        : [])
    ];
    addCrossTilePass(
      graph,
      `${this.id}-initialize`,
      bindings,
      locations => {
        const required = this.requiredComponentCount;
        return /* wgsl */ `
${declareBinding(locations, 'readyValues', scratch.ready, 'atomic')}
${declareBinding(locations, 'changeValues', scratch.changed, 'atomic')}
${declareBinding(locations, 'globalCounts', this.componentCount, 'write')}
${declareBinding(locations, 'globalConvergence', this.converged, 'write')}
${declareBinding(locations, 'globalOverflow', this.overflow, 'atomic')}
${required ? declareBinding(locations, 'requiredCounts', required, 'write') : ''}
@compute @workgroup_size(1)
fn main() {
  atomicStore(&readyValues[${getViewElementOffset(scratch.ready)}u], 1u);
  atomicStore(&changeValues[${getViewElementOffset(scratch.changed)}u], 0u);
  globalCounts[${getViewElementOffset(this.componentCount)}u] = 0u;
  globalConvergence[${getViewElementOffset(this.converged)}u] = 0u;
  atomicStore(&globalOverflow[${getViewElementOffset(this.overflow)}u], 0u);
  ${required ? `requiredCounts[${getViewElementOffset(required)}u] = 0u;` : ''}
}`;
      },
      [1, 1]
    );
  }

  private addTileInitialization<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    scratch: CrossTileScratch,
    plan: PlannedTile
  ): void {
    const {tile} = plan;
    addCrossTilePass(
      graph,
      `${this.id}-tile-${plan.index}-initialize`,
      [
        {name: 'tileCounts', view: tile.componentCount, usage: 'storage-read'},
        {name: 'tileConvergence', view: tile.converged, usage: 'storage-read'},
        {name: 'tileOverflow', view: tile.overflow, usage: 'storage-read'},
        {name: 'rootPositions', view: scratch.rootPositions, usage: 'storage-write'},
        {name: 'candidateIndices', view: scratch.candidateIndices, usage: 'storage-write'},
        {name: 'readyValues', view: scratch.ready, usage: 'storage-read-write'},
        {name: 'globalOverflow', view: this.overflow, usage: 'storage-read-write'}
      ],
      locations => /* wgsl */ `
${declareBinding(locations, 'tileCounts', tile.componentCount, 'read')}
${declareBinding(locations, 'tileConvergence', tile.converged, 'read')}
${declareBinding(locations, 'tileOverflow', tile.overflow, 'read')}
${declareBinding(locations, 'rootPositions', scratch.rootPositions, 'atomic')}
${declareBinding(locations, 'candidateIndices', scratch.candidateIndices, 'write')}
${declareBinding(locations, 'readyValues', scratch.ready, 'atomic')}
${declareBinding(locations, 'globalOverflow', this.overflow, 'atomic')}
@compute @workgroup_size(${LINEAR_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let localIndex = globalId.x;
  if (localIndex >= ${plan.candidateCount}u) { return; }
  let candidateIndex = ${plan.candidateOffset}u + localIndex;
  atomicStore(&rootPositions[${getViewElementOffset(scratch.rootPositions)}u + candidateIndex], 0xffffffffu);
  candidateIndices[${getViewElementOffset(scratch.candidateIndices)}u + candidateIndex] = candidateIndex;
  if (localIndex == 0u) {
    let invalidConvergence = tileConvergence[${getViewElementOffset(tile.converged)}u] == 0u;
    let invalidCount = tileCounts[${getViewElementOffset(tile.componentCount)}u] > ${plan.candidateCount}u;
    let overflowed = tileOverflow[${getViewElementOffset(tile.overflow)}u] != 0u;
    if (invalidConvergence || invalidCount || overflowed) {
      atomicAnd(&readyValues[${getViewElementOffset(scratch.ready)}u], 0u);
      if (invalidCount || overflowed) { atomicOr(&globalOverflow[${getViewElementOffset(this.overflow)}u], 1u); }
    }
  }
}`,
      [Math.ceil(plan.candidateCount / LINEAR_WORKGROUP_SIZE), 1]
    );
  }

  private addRepresentativePass<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    scratch: CrossTileScratch,
    plan: PlannedTile
  ): void {
    const {tile} = plan;
    const dispatch = getRasterDispatchSize(graph.device, plan.width, plan.height, this.id);
    addCrossTilePass(
      graph,
      `${this.id}-tile-${plan.index}-global-representatives`,
      [
        {name: 'tileLabels', view: tile.labels, usage: 'storage-read'},
        {name: 'tileValidity', view: tile.labelValidity, usage: 'storage-read'},
        {name: 'tileCounts', view: tile.componentCount, usage: 'storage-read'},
        {name: 'rootPositions', view: scratch.rootPositions, usage: 'storage-read-write'}
      ],
      locations => /* wgsl */ `
${declareBinding(locations, 'tileLabels', tile.labels, 'read')}
${declareBinding(locations, 'tileValidity', tile.labelValidity, 'read')}
${declareBinding(locations, 'tileCounts', tile.componentCount, 'read')}
${declareBinding(locations, 'rootPositions', scratch.rootPositions, 'atomic')}
@compute @workgroup_size(${RASTER_WORKGROUP_DIMENSION}, ${RASTER_WORKGROUP_DIMENSION})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x >= ${plan.width}u || globalId.y >= ${plan.height}u) { return; }
  let localIndex = globalId.y * ${plan.width}u + globalId.x;
  let localLabel = tileLabels[${getViewElementOffset(tile.labels)}u + localIndex];
  let localCount = tileCounts[${getViewElementOffset(tile.componentCount)}u];
  if (tileValidity[${getViewElementOffset(tile.labelValidity)}u + localIndex] == 0u ||
      localLabel == 0u || localLabel > localCount || localLabel > ${plan.candidateCount}u) { return; }
  let candidateIndex = ${plan.candidateOffset}u + localLabel - 1u;
  let globalColumn = ${tile.pixelBounds[0]}u + globalId.x;
  let globalRow = ${tile.pixelBounds[1]}u + globalId.y;
  let globalIndex = globalRow * ${this.metadata.width}u + globalColumn;
  atomicMin(&rootPositions[${getViewElementOffset(scratch.rootPositions)}u + candidateIndex], globalIndex);
}`,
      dispatch
    );
  }

  private addRepresentativeValidation<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    scratch: CrossTileScratch,
    plan: PlannedTile
  ): void {
    const {tile} = plan;
    addCrossTilePass(
      graph,
      `${this.id}-tile-${plan.index}-validate-representatives`,
      [
        {name: 'tileCounts', view: tile.componentCount, usage: 'storage-read'},
        {name: 'rootPositions', view: scratch.rootPositions, usage: 'storage-read'},
        {name: 'readyValues', view: scratch.ready, usage: 'storage-read-write'},
        {name: 'globalOverflow', view: this.overflow, usage: 'storage-read-write'}
      ],
      locations => /* wgsl */ `
${declareBinding(locations, 'tileCounts', tile.componentCount, 'read')}
${declareBinding(locations, 'rootPositions', scratch.rootPositions, 'read')}
${declareBinding(locations, 'readyValues', scratch.ready, 'atomic')}
${declareBinding(locations, 'globalOverflow', this.overflow, 'atomic')}
@compute @workgroup_size(${LINEAR_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x >= min(tileCounts[${getViewElementOffset(tile.componentCount)}u], ${plan.candidateCount}u)) { return; }
  let index = ${getViewElementOffset(scratch.rootPositions)}u + ${plan.candidateOffset}u + globalId.x;
  if (rootPositions[index] == 0xffffffffu) {
    atomicAnd(&readyValues[${getViewElementOffset(scratch.ready)}u], 0u);
    atomicOr(&globalOverflow[${getViewElementOffset(this.overflow)}u], 1u);
  }
}`,
      [Math.ceil(plan.candidateCount / LINEAR_WORKGROUP_SIZE), 1]
    );
  }

  private addRankInitialization<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    scratch: CrossTileScratch
  ): void {
    addCrossTilePass(
      graph,
      `${this.id}-initialize-global-ranks`,
      [
        {name: 'sortedPositions', view: scratch.sortedPositions, usage: 'storage-read'},
        {name: 'sortedCandidates', view: scratch.sortedCandidates, usage: 'storage-read'},
        {name: 'candidateRanks', view: scratch.candidateRanks, usage: 'storage-write'},
        {name: 'parentValues', view: scratch.parents, usage: 'storage-write'},
        {name: 'readyValues', view: scratch.ready, usage: 'storage-read'}
      ],
      locations => /* wgsl */ `
${declareBinding(locations, 'sortedPositions', scratch.sortedPositions, 'read')}
${declareBinding(locations, 'sortedCandidates', scratch.sortedCandidates, 'read')}
${declareBinding(locations, 'candidateRanks', scratch.candidateRanks, 'write')}
${declareBinding(locations, 'parentValues', scratch.parents, 'atomic')}
${declareBinding(locations, 'readyValues', scratch.ready, 'read')}
@compute @workgroup_size(${LINEAR_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x >= ${this.candidateCount}u) { return; }
  let position = sortedPositions[${getViewElementOffset(scratch.sortedPositions)}u + globalId.x];
  let candidate = sortedCandidates[${getViewElementOffset(scratch.sortedCandidates)}u + globalId.x];
  let candidateIsActive = position != 0xffffffffu && readyValues[${getViewElementOffset(scratch.ready)}u] != 0u;
  let rank = select(0u, globalId.x + 1u, candidateIsActive);
  candidateRanks[${getViewElementOffset(scratch.candidateRanks)}u + candidate] = rank;
  atomicStore(&parentValues[${getViewElementOffset(scratch.parents)}u + globalId.x], rank);
}`,
      [Math.ceil(this.candidateCount / LINEAR_WORKGROUP_SIZE), 1]
    );
  }

  private addSeamPass<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    scratch: CrossTileScratch,
    seam: TileSeam,
    iteration: number
  ): void {
    const first = seam.first;
    const second = seam.second;
    const id = `${this.id}-seam-${first.index}-${second.index}-${iteration}`;
    const bindings: CrossTileBinding[] = [
      {name: 'firstLabels', view: first.tile.labels, usage: 'storage-read'},
      {name: 'firstValidity', view: first.tile.labelValidity, usage: 'storage-read'},
      {name: 'secondLabels', view: second.tile.labels, usage: 'storage-read'},
      {name: 'secondValidity', view: second.tile.labelValidity, usage: 'storage-read'},
      {name: 'candidateRanks', view: scratch.candidateRanks, usage: 'storage-read'},
      {name: 'parentValues', view: scratch.parents, usage: 'storage-read-write'},
      {name: 'changeValues', view: scratch.changed, usage: 'storage-read-write'}
    ];
    addCrossTilePass(
      graph,
      id,
      bindings,
      locations => makeSeamShader(this, scratch, seam, locations),
      [Math.ceil(seam.length / LINEAR_WORKGROUP_SIZE), 1]
    );
  }

  private addCompressionPass<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    scratch: CrossTileScratch,
    iteration: number
  ): void {
    addCrossTilePass(
      graph,
      `${this.id}-compress-${iteration}`,
      [
        {name: 'parentValues', view: scratch.parents, usage: 'storage-read-write'},
        {name: 'changeValues', view: scratch.changed, usage: 'storage-read-write'}
      ],
      locations => /* wgsl */ `
${declareBinding(locations, 'parentValues', scratch.parents, 'atomic')}
${declareBinding(locations, 'changeValues', scratch.changed, 'atomic')}
${followParentFunction(scratch.parents)}
@compute @workgroup_size(${LINEAR_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x >= ${this.candidateCount}u) { return; }
  let index = ${getViewElementOffset(scratch.parents)}u + globalId.x;
  let current = atomicLoad(&parentValues[index]);
  if (current == 0u) { return; }
  let root = followRoot(current);
  let previous = atomicMin(&parentValues[index], root);
  if (previous > root) { atomicOr(&changeValues[${getViewElementOffset(scratch.changed)}u], 1u); }
}`,
      [Math.ceil(this.candidateCount / LINEAR_WORKGROUP_SIZE), 1]
    );
  }

  private addConvergencePass<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    scratch: CrossTileScratch,
    iteration: number
  ): void {
    addCrossTilePass(
      graph,
      `${this.id}-convergence-${iteration}`,
      [
        {name: 'changeValues', view: scratch.changed, usage: 'storage-read-write'},
        {name: 'readyValues', view: scratch.ready, usage: 'storage-read'},
        {name: 'globalConvergence', view: this.converged, usage: 'storage-write'}
      ],
      locations => /* wgsl */ `
${declareBinding(locations, 'changeValues', scratch.changed, 'atomic')}
${declareBinding(locations, 'readyValues', scratch.ready, 'read')}
${declareBinding(locations, 'globalConvergence', this.converged, 'write')}
@compute @workgroup_size(1)
fn main() {
  let changed = atomicLoad(&changeValues[${getViewElementOffset(scratch.changed)}u]);
  let ready = readyValues[${getViewElementOffset(scratch.ready)}u] != 0u;
  globalConvergence[${getViewElementOffset(this.converged)}u] = select(0u, 1u, ready && changed == 0u);
  atomicStore(&changeValues[${getViewElementOffset(scratch.changed)}u], 0u);
}`,
      [1, 1]
    );
  }

  private addRootFlagPass<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    scratch: CrossTileScratch
  ): void {
    addCrossTilePass(
      graph,
      `${this.id}-mark-global-roots`,
      [
        {name: 'parentValues', view: scratch.parents, usage: 'storage-read'},
        {name: 'rootFlags', view: scratch.rootFlags, usage: 'storage-write'},
        {name: 'globalConvergence', view: this.converged, usage: 'storage-read'}
      ],
      locations => /* wgsl */ `
${declareBinding(locations, 'parentValues', scratch.parents, 'read')}
${declareBinding(locations, 'rootFlags', scratch.rootFlags, 'write')}
${declareBinding(locations, 'globalConvergence', this.converged, 'read')}
@compute @workgroup_size(${LINEAR_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x >= ${this.candidateCount}u) { return; }
  let parent = parentValues[${getViewElementOffset(scratch.parents)}u + globalId.x];
  let accepted = globalConvergence[${getViewElementOffset(this.converged)}u] != 0u && parent == globalId.x + 1u;
  rootFlags[${getViewElementOffset(scratch.rootFlags)}u + globalId.x] = select(0u, 1u, accepted);
}`,
      [Math.ceil(this.candidateCount / LINEAR_WORKGROUP_SIZE), 1]
    );
  }

  private addCountPublication<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    scratch: CrossTileScratch
  ): void {
    const bindings: CrossTileBinding[] = [
      {name: 'rootFlags', view: scratch.rootFlags, usage: 'storage-read'},
      {name: 'rootOffsets', view: scratch.rootOffsets, usage: 'storage-read'},
      {name: 'globalConvergence', view: this.converged, usage: 'storage-read'},
      {name: 'globalCounts', view: this.componentCount, usage: 'storage-write'},
      {name: 'globalOverflow', view: this.overflow, usage: 'storage-read-write'},
      ...(this.requiredComponentCount
        ? [
            {
              name: 'requiredCounts',
              view: this.requiredComponentCount,
              usage: 'storage-write' as const
            }
          ]
        : [])
    ];
    addCrossTilePass(
      graph,
      `${this.id}-publish-counts`,
      bindings,
      locations => {
        const required = this.requiredComponentCount;
        return /* wgsl */ `
${declareBinding(locations, 'rootFlags', scratch.rootFlags, 'read')}
${declareBinding(locations, 'rootOffsets', scratch.rootOffsets, 'read')}
${declareBinding(locations, 'globalConvergence', this.converged, 'read')}
${declareBinding(locations, 'globalCounts', this.componentCount, 'write')}
${declareBinding(locations, 'globalOverflow', this.overflow, 'atomic')}
${required ? declareBinding(locations, 'requiredCounts', required, 'write') : ''}
@compute @workgroup_size(1)
fn main() {
  let lastIndex = ${this.candidateCount - 1}u;
  let required = rootOffsets[${getViewElementOffset(scratch.rootOffsets)}u + lastIndex] + rootFlags[${getViewElementOffset(scratch.rootFlags)}u + lastIndex];
  let count = select(0u, required, globalConvergence[${getViewElementOffset(this.converged)}u] != 0u);
  globalCounts[${getViewElementOffset(this.componentCount)}u] = min(count, ${this.capacity}u);
  ${required ? `requiredCounts[${getViewElementOffset(required)}u] = count;` : ''}
  if (count > ${this.capacity}u) { atomicOr(&globalOverflow[${getViewElementOffset(this.overflow)}u], 1u); }
}`;
      },
      [1, 1]
    );
  }

  private addTilePublication<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    scratch: CrossTileScratch,
    plan: PlannedTile
  ): void {
    const {tile} = plan;
    const dispatch = getRasterDispatchSize(graph.device, plan.width, plan.height, this.id);
    addCrossTilePass(
      graph,
      `${this.id}-tile-${plan.index}-publish-labels`,
      [
        {name: 'tileLabels', view: tile.labels, usage: 'storage-read'},
        {name: 'tileValidity', view: tile.labelValidity, usage: 'storage-read'},
        {name: 'candidateRanks', view: scratch.candidateRanks, usage: 'storage-read'},
        {name: 'parentValues', view: scratch.parents, usage: 'storage-read'},
        {name: 'rootOffsets', view: scratch.rootOffsets, usage: 'storage-read'},
        {name: 'globalConvergence', view: this.converged, usage: 'storage-read'},
        {name: 'outputLabels', view: tile.outputLabels, usage: 'storage-write'},
        {name: 'outputValidity', view: tile.outputValidity, usage: 'storage-write'}
      ],
      locations => /* wgsl */ `
${declareBinding(locations, 'tileLabels', tile.labels, 'read')}
${declareBinding(locations, 'tileValidity', tile.labelValidity, 'read')}
${declareBinding(locations, 'candidateRanks', scratch.candidateRanks, 'read')}
${declareBinding(locations, 'parentValues', scratch.parents, 'read')}
${declareBinding(locations, 'rootOffsets', scratch.rootOffsets, 'read')}
${declareBinding(locations, 'globalConvergence', this.converged, 'read')}
${declareBinding(locations, 'outputLabels', tile.outputLabels, 'write')}
${declareBinding(locations, 'outputValidity', tile.outputValidity, 'write')}
@compute @workgroup_size(${RASTER_WORKGROUP_DIMENSION}, ${RASTER_WORKGROUP_DIMENSION})
fn main(@builtin(global_invocation_id) globalId:vec3<u32>) {
  if(globalId.x>=${plan.width}u||globalId.y>=${plan.height}u){return;}
  let index=globalId.y*${plan.width}u+globalId.x;
  let label=tileLabels[${getViewElementOffset(tile.labels)}u+index];
  var valid=globalConvergence[${getViewElementOffset(this.converged)}u]!=0u&&tileValidity[${getViewElementOffset(tile.labelValidity)}u+index]!=0u;
  var globalLabel=0u;
  if(valid&&label!=0u){
    if(label<=${plan.candidateCount}u){
      let rank=candidateRanks[${getViewElementOffset(scratch.candidateRanks)}u+${plan.candidateOffset}u+label-1u];
      if(rank!=0u){
        let parent=parentValues[${getViewElementOffset(scratch.parents)}u+rank-1u];
        if(parent!=0u){globalLabel=rootOffsets[${getViewElementOffset(scratch.rootOffsets)}u+parent-1u]+1u;valid=globalLabel<=${this.capacity}u;}else{valid=false;}
      }else{valid=false;}
    }else{valid=false;}
  }
  outputLabels[${getViewElementOffset(tile.outputLabels)}u+index]=select(0u,globalLabel,valid);
  outputValidity[${getViewElementOffset(tile.outputValidity)}u+index]=select(0u,1u,valid);
}`,
      dispatch
    );
  }

  private addOutputInitialization<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const first: CrossTileBinding[] = [
      {name: 'pixelCounts', view: this.output.pixelCounts, usage: 'storage-write'},
      {name: 'intensityCounts', view: this.output.intensityCounts, usage: 'storage-write'},
      {name: 'intensitySums', view: this.output.intensitySums, usage: 'storage-write'},
      {name: 'columnSums', view: this.output.columnSums, usage: 'storage-write'},
      {name: 'rowSums', view: this.output.rowSums, usage: 'storage-write'},
      {name: 'regionAreas', view: this.output.areas, usage: 'storage-write'}
    ];
    addCrossTilePass(
      graph,
      `${this.id}-clear-global-populations`,
      first,
      locations => /* wgsl */ `
${first.map(binding => declareBinding(locations, binding.name, binding.view, 'atomic')).join('\n')}
@compute @workgroup_size(${LINEAR_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId:vec3<u32>){
 if(globalId.x>=${this.output.pixelCounts.length}u){return;}
 ${first.map(binding => `atomicStore(&${binding.name}[${getViewElementOffset(binding.view)}u+globalId.x],0u);`).join('\n ')}
}`,
      [Math.ceil(this.output.pixelCounts.length / LINEAR_WORKGROUP_SIZE), 1]
    );
    const second: CrossTileBinding[] = [
      {name: 'minimumValues', view: this.output.intensityMinimums, usage: 'storage-write'},
      {name: 'maximumValues', view: this.output.intensityMaximums, usage: 'storage-write'},
      {name: 'meanValues', view: this.output.intensityMeans, usage: 'storage-write'},
      {name: 'centroidColumns', view: this.output.centroidColumns, usage: 'storage-write'},
      {name: 'centroidRows', view: this.output.centroidRows, usage: 'storage-write'}
    ];
    addCrossTilePass(
      graph,
      `${this.id}-clear-global-statistics`,
      second,
      locations => /* wgsl */ `
${second.map(binding => declareBinding(locations, binding.name, binding.view, 'atomic')).join('\n')}
@compute @workgroup_size(${LINEAR_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId:vec3<u32>){
 if(globalId.x>=${this.output.pixelCounts.length}u){return;}
 atomicStore(&minimumValues[${getViewElementOffset(this.output.intensityMinimums)}u+globalId.x],0xffffffffu);
 atomicStore(&maximumValues[${getViewElementOffset(this.output.intensityMaximums)}u+globalId.x],0u);
 atomicStore(&meanValues[${getViewElementOffset(this.output.intensityMeans)}u+globalId.x],0x7fc00000u);
 atomicStore(&centroidColumns[${getViewElementOffset(this.output.centroidColumns)}u+globalId.x],0x7fc00000u);
 atomicStore(&centroidRows[${getViewElementOffset(this.output.centroidRows)}u+globalId.x],0x7fc00000u);
}`,
      [Math.ceil(this.output.pixelCounts.length / LINEAR_WORKGROUP_SIZE), 1]
    );
  }

  private addTileMeasurements<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    scratch: CrossTileScratch,
    plan: PlannedTile
  ): void {
    this.addPopulationMerge(graph, scratch, plan, 'pixel');
    this.addPopulationMerge(graph, scratch, plan, 'intensity');
    this.addFloatingMerge(graph, scratch, plan, 'sum');
    this.addFloatingMerge(graph, scratch, plan, 'minimum');
    this.addFloatingMerge(graph, scratch, plan, 'maximum');
    this.addFloatingMerge(graph, scratch, plan, 'column');
    this.addFloatingMerge(graph, scratch, plan, 'row');
  }

  private addPopulationMerge<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    scratch: CrossTileScratch,
    plan: PlannedTile,
    kind: 'pixel' | 'intensity'
  ): void {
    const local =
      kind === 'pixel'
        ? plan.tile.measurements.pixelCounts
        : plan.tile.measurements.intensityCounts;
    const output = kind === 'pixel' ? this.output.pixelCounts : this.output.intensityCounts;
    addCrossTilePass(
      graph,
      `${this.id}-tile-${plan.index}-merge-${kind}-counts`,
      [
        {name: 'localCounts', view: local, usage: 'storage-read'},
        {name: 'candidateRanks', view: scratch.candidateRanks, usage: 'storage-read'},
        {name: 'parentValues', view: scratch.parents, usage: 'storage-read'},
        {name: 'rootFlags', view: scratch.rootFlags, usage: 'storage-read'},
        {name: 'rootOffsets', view: scratch.rootOffsets, usage: 'storage-read'},
        {name: 'globalCounts', view: output, usage: 'storage-read-write'},
        {name: 'globalOverflow', view: this.overflow, usage: 'storage-read-write'}
      ],
      locations => /* wgsl */ `
${declareBinding(locations, 'localCounts', local, 'read')}
${declareBinding(locations, 'candidateRanks', scratch.candidateRanks, 'read')}
${declareBinding(locations, 'parentValues', scratch.parents, 'read')}
${declareBinding(locations, 'rootFlags', scratch.rootFlags, 'read')}
${declareBinding(locations, 'rootOffsets', scratch.rootOffsets, 'read')}
${declareBinding(locations, 'globalCounts', output, 'atomic')}
${declareBinding(locations, 'globalOverflow', this.overflow, 'atomic')}
${globalGroupFunction(scratch, plan, this.capacity)}
fn addSaturated(index:u32,value:u32){
  var previous=atomicLoad(&globalCounts[${getViewElementOffset(output)}u+index]);
  loop{
    let exhausted=value>0xffffffffu-previous;
    let next=select(previous+value,0xffffffffu,exhausted);
    let result=atomicCompareExchangeWeak(&globalCounts[${getViewElementOffset(output)}u+index],previous,next);
    if(result.exchanged){if(exhausted){atomicOr(&globalOverflow[${getViewElementOffset(this.overflow)}u],1u);}break;}
    previous=result.old_value;
  }
}
@compute @workgroup_size(${LINEAR_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId:vec3<u32>){
 if(globalId.x>=${plan.candidateCount}u){return;}
 let group=globalGroup(globalId.x);
 let count=localCounts[${getViewElementOffset(local)}u+globalId.x];
 if(group!=0xffffffffu&&count!=0u){addSaturated(group,count);}
}`,
      [Math.ceil(plan.candidateCount / LINEAR_WORKGROUP_SIZE), 1]
    );
  }

  private addFloatingMerge<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    scratch: CrossTileScratch,
    plan: PlannedTile,
    kind: 'sum' | 'minimum' | 'maximum' | 'column' | 'row'
  ): void {
    const source =
      kind === 'sum'
        ? plan.tile.measurements.intensitySums
        : kind === 'minimum'
          ? plan.tile.measurements.intensityMinimums
          : kind === 'maximum'
            ? plan.tile.measurements.intensityMaximums
            : kind === 'column'
              ? plan.tile.measurements.columnSums
              : plan.tile.measurements.rowSums;
    const counts =
      kind === 'column' || kind === 'row'
        ? plan.tile.measurements.pixelCounts
        : plan.tile.measurements.intensityCounts;
    const output =
      kind === 'sum'
        ? this.output.intensitySums
        : kind === 'minimum'
          ? this.output.intensityMinimums
          : kind === 'maximum'
            ? this.output.intensityMaximums
            : kind === 'column'
              ? this.output.columnSums
              : this.output.rowSums;
    const shifted =
      kind === 'column'
        ? ` + f32(count) * ${getRasterFloatLiteral(plan.tile.pixelBounds[0])}`
        : kind === 'row'
          ? ` + f32(count) * ${getRasterFloatLiteral(plan.tile.pixelBounds[1])}`
          : '';
    addCrossTilePass(
      graph,
      `${this.id}-tile-${plan.index}-merge-${kind}`,
      [
        {name: 'localValues', view: source, usage: 'storage-read'},
        {name: 'localCounts', view: counts, usage: 'storage-read'},
        {name: 'candidateRanks', view: scratch.candidateRanks, usage: 'storage-read'},
        {name: 'parentValues', view: scratch.parents, usage: 'storage-read'},
        {name: 'rootFlags', view: scratch.rootFlags, usage: 'storage-read'},
        {name: 'rootOffsets', view: scratch.rootOffsets, usage: 'storage-read'},
        {name: 'globalValues', view: output, usage: 'storage-read-write'},
        {name: 'globalOverflow', view: this.overflow, usage: 'storage-read-write'}
      ],
      locations => /* wgsl */ `
${declareBinding(locations, 'localValues', source, 'read')}
${declareBinding(locations, 'localCounts', counts, 'read')}
${declareBinding(locations, 'candidateRanks', scratch.candidateRanks, 'read')}
${declareBinding(locations, 'parentValues', scratch.parents, 'read')}
${declareBinding(locations, 'rootFlags', scratch.rootFlags, 'read')}
${declareBinding(locations, 'rootOffsets', scratch.rootOffsets, 'read')}
${declareBinding(locations, 'globalValues', output, 'atomic')}
${declareBinding(locations, 'globalOverflow', this.overflow, 'atomic')}
${globalGroupFunction(scratch, plan, this.capacity)}
fn encodeOrdered(value:f32)->u32{let bits=bitcast<u32>(value);return select(bits^0x80000000u,~bits,(bits&0x80000000u)!=0u);}
fn addFloat(index:u32,value:f32){
 var previous=atomicLoad(&globalValues[${getViewElementOffset(output)}u+index]);
 loop{let next=bitcast<u32>(bitcast<f32>(previous)+value);let result=atomicCompareExchangeWeak(&globalValues[${getViewElementOffset(output)}u+index],previous,next);if(result.exchanged){break;}previous=result.old_value;}
}
@compute @workgroup_size(${LINEAR_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId:vec3<u32>){
 if(globalId.x>=${plan.candidateCount}u){return;}
 let group=globalGroup(globalId.x);
 let count=localCounts[${getViewElementOffset(counts)}u+globalId.x];
 if(group==0xffffffffu||count==0u){return;}
 let value=localValues[${getViewElementOffset(source)}u+globalId.x]${shifted};
 if(!(value==value&&abs(value)<=3.402823466e+38)){atomicOr(&globalOverflow[${getViewElementOffset(this.overflow)}u],1u);return;}
 ${kind === 'minimum' ? `atomicMin(&globalValues[${getViewElementOffset(output)}u+group],encodeOrdered(value));` : kind === 'maximum' ? `atomicMax(&globalValues[${getViewElementOffset(output)}u+group],encodeOrdered(value));` : 'addFloat(group,value);'}
}`,
      [Math.ceil(plan.candidateCount / LINEAR_WORKGROUP_SIZE), 1]
    );
  }

  private addIntensityFinalization<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    addCrossTilePass(
      graph,
      `${this.id}-finalize-intensity`,
      [
        {name: 'intensityCounts', view: this.output.intensityCounts, usage: 'storage-read'},
        {name: 'intensitySums', view: this.output.intensitySums, usage: 'storage-read'},
        {name: 'minimumValues', view: this.output.intensityMinimums, usage: 'storage-read-write'},
        {name: 'maximumValues', view: this.output.intensityMaximums, usage: 'storage-read-write'},
        {name: 'meanValues', view: this.output.intensityMeans, usage: 'storage-write'}
      ],
      locations => /* wgsl */ `
${declareBinding(locations, 'intensityCounts', this.output.intensityCounts, 'read')}
${declareBinding(locations, 'intensitySums', this.output.intensitySums, 'read')}
${declareBinding(locations, 'minimumValues', this.output.intensityMinimums, 'atomic')}
${declareBinding(locations, 'maximumValues', this.output.intensityMaximums, 'atomic')}
${declareBinding(locations, 'meanValues', this.output.intensityMeans, 'atomic')}
fn decodeOrdered(value:u32)->f32{let bits=select(~value,value^0x80000000u,(value&0x80000000u)!=0u);return bitcast<f32>(bits);}
@compute @workgroup_size(${LINEAR_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId:vec3<u32>){
 if(globalId.x>=${this.output.pixelCounts.length}u){return;}
 let count=intensityCounts[${getViewElementOffset(this.output.intensityCounts)}u+globalId.x];
 let minimum=atomicLoad(&minimumValues[${getViewElementOffset(this.output.intensityMinimums)}u+globalId.x]);
 let maximum=atomicLoad(&maximumValues[${getViewElementOffset(this.output.intensityMaximums)}u+globalId.x]);
 if(count==0u){
  atomicStore(&minimumValues[${getViewElementOffset(this.output.intensityMinimums)}u+globalId.x],0x7fc00000u);
  atomicStore(&maximumValues[${getViewElementOffset(this.output.intensityMaximums)}u+globalId.x],0x7fc00000u);
  atomicStore(&meanValues[${getViewElementOffset(this.output.intensityMeans)}u+globalId.x],0x7fc00000u);
 }else{
  atomicStore(&minimumValues[${getViewElementOffset(this.output.intensityMinimums)}u+globalId.x],bitcast<u32>(decodeOrdered(minimum)));
  atomicStore(&maximumValues[${getViewElementOffset(this.output.intensityMaximums)}u+globalId.x],bitcast<u32>(decodeOrdered(maximum)));
  let mean=intensitySums[${getViewElementOffset(this.output.intensitySums)}u+globalId.x]/f32(count);
  atomicStore(&meanValues[${getViewElementOffset(this.output.intensityMeans)}u+globalId.x],bitcast<u32>(mean));
 }
}`,
      [Math.ceil(this.output.pixelCounts.length / LINEAR_WORKGROUP_SIZE), 1]
    );
  }

  private addGeometryFinalization<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const [a, b, , d, e] = this.metadata.affine;
    const area = getRasterFloatLiteral(Math.abs(a * e - b * d));
    addCrossTilePass(
      graph,
      `${this.id}-finalize-geometry`,
      [
        {name: 'pixelCounts', view: this.output.pixelCounts, usage: 'storage-read'},
        {name: 'columnSums', view: this.output.columnSums, usage: 'storage-read'},
        {name: 'rowSums', view: this.output.rowSums, usage: 'storage-read'},
        {name: 'centroidColumns', view: this.output.centroidColumns, usage: 'storage-write'},
        {name: 'centroidRows', view: this.output.centroidRows, usage: 'storage-write'},
        {name: 'regionAreas', view: this.output.areas, usage: 'storage-write'}
      ],
      locations => /* wgsl */ `
${declareBinding(locations, 'pixelCounts', this.output.pixelCounts, 'read')}
${declareBinding(locations, 'columnSums', this.output.columnSums, 'read')}
${declareBinding(locations, 'rowSums', this.output.rowSums, 'read')}
${declareBinding(locations, 'centroidColumns', this.output.centroidColumns, 'atomic')}
${declareBinding(locations, 'centroidRows', this.output.centroidRows, 'atomic')}
${declareBinding(locations, 'regionAreas', this.output.areas, 'atomic')}
@compute @workgroup_size(${LINEAR_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId:vec3<u32>){
 if(globalId.x>=${this.output.pixelCounts.length}u){return;}
 let count=pixelCounts[${getViewElementOffset(this.output.pixelCounts)}u+globalId.x];
 if(count==0u){
  atomicStore(&centroidColumns[${getViewElementOffset(this.output.centroidColumns)}u+globalId.x],0x7fc00000u);
  atomicStore(&centroidRows[${getViewElementOffset(this.output.centroidRows)}u+globalId.x],0x7fc00000u);
  atomicStore(&regionAreas[${getViewElementOffset(this.output.areas)}u+globalId.x],0u);
 }else{
  let column=columnSums[${getViewElementOffset(this.output.columnSums)}u+globalId.x]/f32(count);
  let row=rowSums[${getViewElementOffset(this.output.rowSums)}u+globalId.x]/f32(count);
  atomicStore(&centroidColumns[${getViewElementOffset(this.output.centroidColumns)}u+globalId.x],bitcast<u32>(column));
  atomicStore(&centroidRows[${getViewElementOffset(this.output.centroidRows)}u+globalId.x],bitcast<u32>(row));
  atomicStore(&regionAreas[${getViewElementOffset(this.output.areas)}u+globalId.x],bitcast<u32>(f32(count)*${area}));
 }
}`,
      [Math.ceil(this.output.pixelCounts.length / LINEAR_WORKGROUP_SIZE), 1]
    );
  }

  private getInputViews(): GraphDataView[] {
    return this.plannedTiles.flatMap(({tile}) => [
      tile.labels,
      tile.labelValidity,
      tile.componentCount,
      tile.converged,
      tile.overflow,
      ...getMeasurementViews(tile.measurements)
    ]);
  }

  private getWritableViews(): GraphDataView[] {
    return [
      this.componentCount,
      this.converged,
      this.overflow,
      ...(this.requiredComponentCount ? [this.requiredComponentCount] : []),
      ...getMeasurementViews(this.output),
      ...this.plannedTiles.flatMap(({tile}) => [tile.outputLabels, tile.outputValidity])
    ];
  }

  private getBorrowedViews(): GraphDataView[] {
    return [...this.getInputViews(), ...this.getWritableViews()];
  }
}

function getMeasurementViews(output: GPURasterRegionMeasurementOutputs): GraphDataView[] {
  return [
    output.pixelCounts,
    output.intensityCounts,
    output.intensitySums,
    output.intensityMinimums,
    output.intensityMaximums,
    output.intensityMeans,
    output.columnSums,
    output.rowSums,
    output.centroidColumns,
    output.centroidRows,
    output.areas
  ];
}

function validateMeasurementOutputs(
  output: GPURasterRegionMeasurementOutputs,
  label: string
): number {
  const views = getMeasurementViews(output);
  const count = output.pixelCounts.length;
  if (!Number.isSafeInteger(count) || count > MAXIMUM_RASTER_PIXEL_COUNT) {
    throw new Error(`${label} measurement capacity must fit in uint32`);
  }
  for (const [index, view] of views.entries()) {
    validatePackedView(
      view,
      [index < 2 ? 'uint32' : 'float32'],
      `${label} measurement column ${index}`
    );
    if (view.length !== count) {
      throw new Error(`${label} measurement columns must have identical lengths`);
    }
  }
  return count;
}

function compareTileBounds(first: GPURasterCrossTile, second: GPURasterCrossTile): number {
  return (
    first.pixelBounds[1] - second.pixelBounds[1] ||
    first.pixelBounds[0] - second.pixelBounds[0] ||
    first.pixelBounds[3] - second.pixelBounds[3] ||
    first.pixelBounds[2] - second.pixelBounds[2]
  );
}

function validateTileMetadata(
  tile: GPURasterCrossTile,
  global: GPURasterMetadata,
  label: string
): void {
  validateRasterMetadata(tile.metadata, `${label} metadata`);
  const bounds = tile.pixelBounds;
  if (
    bounds.length !== 4 ||
    !bounds.every(Number.isSafeInteger) ||
    bounds[0] < 0 ||
    bounds[1] < 0 ||
    bounds[2] <= bounds[0] ||
    bounds[3] <= bounds[1] ||
    bounds[2] > global.width ||
    bounds[3] > global.height
  ) {
    throw new Error(`${label} must own nonempty in-bounds half-open overview pixels`);
  }
  if (
    tile.metadata.width !== bounds[2] - bounds[0] ||
    tile.metadata.height !== bounds[3] - bounds[1]
  ) {
    throw new Error(`${label} metadata dimensions must equal its owned bounds`);
  }
  if ((tile.metadata.level ?? 0) !== (global.level ?? 0)) {
    throw new Error(`${label} overview level must match global metadata`);
  }
  if (tile.metadata.pixelInterpretation !== global.pixelInterpretation) {
    throw new Error(`${label} pixel interpretation must match global metadata`);
  }
  if (
    !hasMatchingRasterCoordinateReferenceSystem(
      tile.metadata.coordinateReferenceSystem,
      global.coordinateReferenceSystem
    )
  ) {
    throw new Error(`${label} coordinate reference system must match global metadata`);
  }
  const [a, b, c, d, e, f] = global.affine;
  const expected = [
    a,
    b,
    c + a * bounds[0] + b * bounds[1],
    d,
    e,
    f + d * bounds[0] + e * bounds[1]
  ];
  for (let index = 0; index < 6; index++) {
    const tolerance = Math.max(1, Math.abs(expected[index]!)) * 1e-10;
    if (Math.abs(tile.metadata.affine[index]! - expected[index]!) > tolerance) {
      throw new Error(`${label} affine must describe its translated global overview grid`);
    }
  }
}

function makeTileSeams(
  tiles: readonly PlannedTile[],
  connectivity: GPURasterConnectivity,
  label: string
): TileSeam[] {
  const seams: TileSeam[] = [];
  for (let firstIndex = 0; firstIndex < tiles.length; firstIndex++) {
    for (let secondIndex = firstIndex + 1; secondIndex < tiles.length; secondIndex++) {
      let first = tiles[firstIndex]!;
      let second = tiles[secondIndex]!;
      const left = Math.max(first.tile.pixelBounds[0], second.tile.pixelBounds[0]);
      const right = Math.min(first.tile.pixelBounds[2], second.tile.pixelBounds[2]);
      const top = Math.max(first.tile.pixelBounds[1], second.tile.pixelBounds[1]);
      const bottom = Math.min(first.tile.pixelBounds[3], second.tile.pixelBounds[3]);
      if (left < right && top < bottom) {
        throw new Error(`${label} tile cores must not overlap`);
      }
      if (
        first.tile.pixelBounds[2] === second.tile.pixelBounds[0] ||
        second.tile.pixelBounds[2] === first.tile.pixelBounds[0]
      ) {
        if (second.tile.pixelBounds[2] === first.tile.pixelBounds[0]) {
          [first, second] = [second, first];
        }
        const start = Math.max(
          first.tile.pixelBounds[1],
          second.tile.pixelBounds[1] - (connectivity === 8 ? 1 : 0)
        );
        const end = Math.min(
          first.tile.pixelBounds[3],
          second.tile.pixelBounds[3] + (connectivity === 8 ? 1 : 0)
        );
        if (start < end) {
          seams.push({first, second, kind: 'horizontal', start, length: end - start});
          continue;
        }
      }
      if (
        first.tile.pixelBounds[3] === second.tile.pixelBounds[1] ||
        second.tile.pixelBounds[3] === first.tile.pixelBounds[1]
      ) {
        if (second.tile.pixelBounds[3] === first.tile.pixelBounds[1]) {
          [first, second] = [second, first];
        }
        const start = Math.max(
          first.tile.pixelBounds[0],
          second.tile.pixelBounds[0] - (connectivity === 8 ? 1 : 0)
        );
        const end = Math.min(
          first.tile.pixelBounds[2],
          second.tile.pixelBounds[2] + (connectivity === 8 ? 1 : 0)
        );
        if (start < end) {
          seams.push({first, second, kind: 'vertical', start, length: end - start});
          continue;
        }
      }
      if (connectivity === 8) {
        const horizontalTouch =
          first.tile.pixelBounds[2] === second.tile.pixelBounds[0] ||
          second.tile.pixelBounds[2] === first.tile.pixelBounds[0];
        const verticalTouch =
          first.tile.pixelBounds[3] === second.tile.pixelBounds[1] ||
          second.tile.pixelBounds[3] === first.tile.pixelBounds[1];
        if (horizontalTouch && verticalTouch) {
          const firstColumn =
            first.tile.pixelBounds[2] === second.tile.pixelBounds[0] ? first.width - 1 : 0;
          const secondColumn =
            first.tile.pixelBounds[2] === second.tile.pixelBounds[0] ? 0 : second.width - 1;
          const firstRow =
            first.tile.pixelBounds[3] === second.tile.pixelBounds[1] ? first.height - 1 : 0;
          const secondRow =
            first.tile.pixelBounds[3] === second.tile.pixelBounds[1] ? 0 : second.height - 1;
          seams.push({
            first,
            second,
            kind: 'corner',
            start: 0,
            length: 1,
            firstCorner: [firstColumn, firstRow],
            secondCorner: [secondColumn, secondRow]
          });
        }
      }
    }
  }
  return seams;
}

function followParentFunction(parents: GraphDataView<'uint32'>): string {
  return /* wgsl */ `
fn followRoot(rank:u32)->u32{
 var root=rank;
 for(var depth=0u;depth<${MAXIMUM_PARENT_DEPTH}u;depth++){
  let parent=atomicLoad(&parentValues[${getViewElementOffset(parents)}u+root-1u]);
  if(parent==0u||parent==root){break;}
  root=parent;
 }
 return root;
}`;
}

function globalGroupFunction(
  scratch: CrossTileScratch,
  plan: PlannedTile,
  capacity: number
): string {
  return /* wgsl */ `
fn globalGroup(localIndex:u32)->u32{
 let rank=candidateRanks[${getViewElementOffset(scratch.candidateRanks)}u+${plan.candidateOffset}u+localIndex];
 if(rank==0u){return 0xffffffffu;}
 let parent=parentValues[${getViewElementOffset(scratch.parents)}u+rank-1u];
 if(parent==0u||rootFlags[${getViewElementOffset(scratch.rootFlags)}u+parent-1u]==0u){return 0xffffffffu;}
 let group=rootOffsets[${getViewElementOffset(scratch.rootOffsets)}u+parent-1u];
 return select(0xffffffffu,group,group<${capacity}u);
}`;
}

function makeSeamShader(
  contributor: GPURasterCrossTileComponents,
  scratch: CrossTileScratch,
  seam: TileSeam,
  locations: ReadonlyMap<string, number>
): string {
  const first = seam.first;
  const second = seam.second;
  let body = '';
  if (seam.kind === 'horizontal') {
    const offsets = contributor.connectivity === 8 ? [-1, 0, 1] : [0];
    body = `let globalRow=i32(${seam.start}u+globalId.x);\n${offsets.map(offset => `  connect(i32(${first.width - 1}),globalRow-i32(${first.tile.pixelBounds[1]}),0,globalRow+${offset}-i32(${second.tile.pixelBounds[1]}));`).join('\n')}`;
  } else if (seam.kind === 'vertical') {
    const offsets = contributor.connectivity === 8 ? [-1, 0, 1] : [0];
    body = `let globalColumn=i32(${seam.start}u+globalId.x);\n${offsets.map(offset => `  connect(globalColumn-i32(${first.tile.pixelBounds[0]}),i32(${first.height - 1}),globalColumn+${offset}-i32(${second.tile.pixelBounds[0]}),0);`).join('\n')}`;
  } else {
    body = `connect(${seam.firstCorner![0]},${seam.firstCorner![1]},${seam.secondCorner![0]},${seam.secondCorner![1]});`;
  }
  return /* wgsl */ `
${declareBinding(locations, 'firstLabels', first.tile.labels, 'read')}
${declareBinding(locations, 'firstValidity', first.tile.labelValidity, 'read')}
${declareBinding(locations, 'secondLabels', second.tile.labels, 'read')}
${declareBinding(locations, 'secondValidity', second.tile.labelValidity, 'read')}
${declareBinding(locations, 'candidateRanks', scratch.candidateRanks, 'read')}
${declareBinding(locations, 'parentValues', scratch.parents, 'atomic')}
${declareBinding(locations, 'changeValues', scratch.changed, 'atomic')}
${followParentFunction(scratch.parents)}
fn connect(firstColumn:i32,firstRow:i32,secondColumn:i32,secondRow:i32){
 if(firstColumn<0||firstRow<0||secondColumn<0||secondRow<0||firstColumn>=${first.width}||firstRow>=${first.height}||secondColumn>=${second.width}||secondRow>=${second.height}){return;}
 let firstIndex=u32(firstRow)*${first.width}u+u32(firstColumn);
 let secondIndex=u32(secondRow)*${second.width}u+u32(secondColumn);
 if(firstValidity[${getViewElementOffset(first.tile.labelValidity)}u+firstIndex]==0u||secondValidity[${getViewElementOffset(second.tile.labelValidity)}u+secondIndex]==0u){return;}
 let firstLabel=firstLabels[${getViewElementOffset(first.tile.labels)}u+firstIndex];
 let secondLabel=secondLabels[${getViewElementOffset(second.tile.labels)}u+secondIndex];
 if(firstLabel==0u||secondLabel==0u||firstLabel>${first.candidateCount}u||secondLabel>${second.candidateCount}u){return;}
 let firstRank=candidateRanks[${getViewElementOffset(scratch.candidateRanks)}u+${first.candidateOffset}u+firstLabel-1u];
 let secondRank=candidateRanks[${getViewElementOffset(scratch.candidateRanks)}u+${second.candidateOffset}u+secondLabel-1u];
 if(firstRank==0u||secondRank==0u){return;}
 let firstRoot=followRoot(firstRank);
 let secondRoot=followRoot(secondRank);
 if(firstRoot==secondRoot){return;}
 let lower=min(firstRoot,secondRoot);
 let upper=max(firstRoot,secondRoot);
 let previous=atomicMin(&parentValues[${getViewElementOffset(scratch.parents)}u+upper-1u],lower);
 if(previous>lower){atomicOr(&changeValues[${getViewElementOffset(scratch.changed)}u],1u);}
}
@compute @workgroup_size(${LINEAR_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId:vec3<u32>){
 if(globalId.x>=${seam.length}u){return;}
 ${body}
}`;
}

function declareBinding(
  locations: ReadonlyMap<string, number>,
  name: string,
  view: GraphDataView,
  access: 'read' | 'write' | 'atomic'
): string {
  const scalar = view.format === 'float32' ? 'f32' : 'u32';
  const type = access === 'atomic' ? 'atomic<u32>' : scalar;
  const mode = access === 'read' ? 'read' : 'read_write';
  return `@group(0) @binding(${locations.get(name)}) var<storage, ${mode}> ${name}: array<${type}>;`;
}

function assertLinearDispatchFits<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  count: number,
  label: string
): void {
  if (
    Math.ceil(count / LINEAR_WORKGROUP_SIZE) > graph.device.limits.maxComputeWorkgroupsPerDimension
  ) {
    throw new Error(`${label} exceeds bounded one-dimensional device dispatch limits`);
  }
}

function addCrossTilePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  bindings: readonly CrossTileBinding[],
  makeShader: (locations: ReadonlyMap<string, number>) => string,
  dispatch: readonly [number, number]
): void {
  if (bindings.length > graph.device.limits.maxStorageBuffersPerShaderStage) {
    throw new Error(`${id} exceeds the device storage binding count`);
  }
  const resources: GraphResourceUse[] = [];
  const declarations: BindingDeclaration[] = [];
  const locations = new Map<string, number>();
  for (const [index, binding] of bindings.entries()) {
    if (binding.view.buffer.graph !== graph) {
      throw new Error(`${id} resources must belong to the target graph`);
    }
    assertRasterStorageBindingFits(graph.device, binding.view, `${id} ${binding.view.buffer.id}`);
    resources.push({buffer: binding.view, usage: binding.usage});
    declarations.push({
      name: binding.name,
      type: binding.usage === 'storage-read' ? 'read-only-storage' : 'storage',
      group: 0,
      location: index
    });
    locations.set(binding.name, index);
  }
  graph.addComputePass({
    id,
    resources,
    compile: ({device}) => {
      const computation = new Computation(device, {
        id,
        source: makeShader(locations),
        shaderLayout: {bindings: declarations}
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const resolved: Record<string, Binding> = {};
          for (const binding of bindings) {
            resolved[binding.name] = getViewBinding(binding.view, getBuffer);
          }
          computation.setBindings(resolved);
          computation.dispatch(computePass, dispatch[0], dispatch[1]);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}
