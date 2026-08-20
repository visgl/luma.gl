// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding, BindingDeclaration} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import type {
  GPUCommandGraph,
  GPUCommandGraphContributor,
  GraphDataView,
  GraphResourceUse
} from '../gpu-core/gpu-command-graph';
import {getViewBinding, getViewElementOffset} from '../gpu-core/graph-data-view-utils';
import {
  GPURasterTileCache,
  GPURasterTileLease,
  type GPURasterTileReleaseFence
} from './gpu-raster-tile-cache';
import type {
  GPURasterPixelBounds,
  GPURasterTileLevel,
  GPURasterTileRequest
} from './gpu-raster-tile-source';
import {
  assertRasterStorageBindingFits,
  getRasterDispatchSize,
  getRasterShaderScalarType,
  MAXIMUM_RASTER_PIXEL_COUNT,
  RASTER_WORKGROUP_DIMENSION,
  validateRasterBand,
  validateRasterScalarView,
  validateRasterValidityView
} from './raster-utils';
import type {GPURasterBufferBand, GPURasterScalarFormat} from './types';

/** One complete pipeline-stage receptive field, measured in overview-level source pixels. */
export type GPURasterHaloStage = {
  /** Composed contributors advertise their complete radius, including both morphology passes. */
  readonly requiredHalo: number;
  /** Anisotropic contributors may narrow their independently accumulated horizontal radius. */
  readonly horizontalRadius?: number;
  /** Anisotropic contributors may narrow their independently accumulated vertical radius. */
  readonly verticalRadius?: number;
};

/** One caller-owned core window and every ordered operator that can influence its result. */
export type GPURasterTileHaloRequest = GPURasterTileRequest & {
  readonly stages: readonly GPURasterHaloStage[];
};

/** Immutable overview-space ownership, available coverage, and exact resident source requests. */
export type GPURasterTileHaloPlan = {
  readonly level: number;
  readonly column: number;
  readonly row: number;
  readonly requiredHalo: number;
  readonly horizontalHalo: number;
  readonly verticalHalo: number;
  /** Independent ceiling-rounded full-resolution receptive-field distances. */
  readonly levelZeroHalo: readonly [number, number];
  /** Half-open pixels owned by this output; neighboring cores never overlap. */
  readonly corePixelBounds: GPURasterPixelBounds;
  /** Half-open assembled source pixels, clipped only at real dataset edges. */
  readonly availablePixelBounds: GPURasterPixelBounds;
  readonly width: number;
  readonly height: number;
  readonly coreWidth: number;
  readonly coreHeight: number;
  /** Canonical source requests; the owning core request is always first. */
  readonly requests: readonly GPURasterTileRequest[];
};

/** One borrowed packed native-format source tile and its absolute overview-level coverage. */
export type GPURasterTileHaloSource<Format extends GPURasterScalarFormat = GPURasterScalarFormat> =
  {
    pixelBounds: GPURasterPixelBounds;
    input: GPURasterBufferBand<Format>;
  };

/** Explicit GPU-native assembly into a caller-owned expanded source grid and validity mask. */
export type GPURasterTileHaloFillProps<
  Format extends GPURasterScalarFormat = GPURasterScalarFormat
> = {
  id?: string;
  pixelBounds: GPURasterPixelBounds;
  sources: readonly GPURasterTileHaloSource<Format>[];
  output: GraphDataView<Format>;
  outputValidity: GraphDataView<'uint32'>;
};

/** Explicit packed extraction of exactly one caller-owned half-open processed tile core. */
export type GPURasterTileCoreExtractProps<
  Format extends GPURasterScalarFormat = GPURasterScalarFormat
> = {
  id?: string;
  availablePixelBounds: GPURasterPixelBounds;
  corePixelBounds: GPURasterPixelBounds;
  input: GPURasterBufferBand<Format>;
  output: GraphDataView<Format>;
  outputValidity: GraphDataView<'uint32'>;
};

type RasterTransfer<Format extends GPURasterScalarFormat> = {
  id: string;
  source: GPURasterBufferBand<Format>;
  sourceWidth: number;
  sourceHeight: number;
  sourceOrigin: readonly [number, number];
  destinationWidth: number;
  destinationOrigin: readonly [number, number];
  width: number;
  height: number;
  output: GraphDataView<Format>;
  outputValidity: GraphDataView<'uint32'>;
};

/**
 * Computes cumulative, anisotropic receptive fields and pins every intersecting source tile.
 *
 * Dataset transport, decoding, cache admission, graph assembly, submission, and synchronization
 * remain explicit. No complete raster or padded CPU array is allocated by this coordinator.
 */
export class GPURasterTileHaloAssembler {
  readonly cache: GPURasterTileCache;

  constructor(cache: GPURasterTileCache) {
    if (!(cache instanceof GPURasterTileCache)) {
      throw new Error('Raster halo assembly requires an existing bounded tile cache');
    }
    this.cache = cache;
  }

  /** Resolves source defaults, cumulative stage radii, ragged edges, and all diagonal neighbors. */
  plan(request: GPURasterTileHaloRequest): GPURasterTileHaloPlan {
    if (!request || !Array.isArray(request.stages)) {
      throw new Error('Raster halo assembly requires an explicit ordered stage list');
    }
    const normalized = this.cache.reader.normalizeTileRequest(request);
    const level = this.cache.reader.metadata.levels.find(
      candidate => candidate.level === normalized.level
    )!;
    const corePixelBounds = normalized.pixelBounds!;
    const [horizontalHalo, verticalHalo] = accumulateStageHalos(request.stages);
    const availablePixelBounds: GPURasterPixelBounds = Object.freeze([
      Math.max(0, corePixelBounds[0] - horizontalHalo),
      Math.max(0, corePixelBounds[1] - verticalHalo),
      Math.min(level.width, corePixelBounds[2] + horizontalHalo),
      Math.min(level.height, corePixelBounds[3] + verticalHalo)
    ]);
    const width = availablePixelBounds[2] - availablePixelBounds[0];
    const height = availablePixelBounds[3] - availablePixelBounds[1];
    assertPixelCount(width, height, 'Raster halo assembly');
    const requests = makeNeighborhoodRequests(normalized, availablePixelBounds, level, this.cache);
    return Object.freeze({
      level: normalized.level,
      column: normalized.column ?? 0,
      row: normalized.row ?? 0,
      requiredHalo: Math.max(horizontalHalo, verticalHalo),
      horizontalHalo,
      verticalHalo,
      levelZeroHalo: Object.freeze([
        Math.ceil(horizontalHalo * level.downsample[0]),
        Math.ceil(verticalHalo * level.downsample[1])
      ]) as readonly [number, number],
      corePixelBounds: Object.freeze([...corePixelBounds]) as GPURasterPixelBounds,
      availablePixelBounds,
      width,
      height,
      coreWidth: corePixelBounds[2] - corePixelBounds[0],
      coreHeight: corePixelBounds[3] - corePixelBounds[1],
      requests: Object.freeze(requests)
    });
  }

  /** Acquires all source leases; aborts and admission failures release every partial pin. */
  async acquire(
    request: GPURasterTileHaloRequest,
    signal: AbortSignal = new AbortController().signal
  ): Promise<GPURasterTileHaloLease> {
    signal.throwIfAborted();
    const plan = this.plan(request);
    const leases: GPURasterTileLease[] = [];
    try {
      for (const tileRequest of plan.requests) {
        signal.throwIfAborted();
        leases.push(await this.cache.acquire(tileRequest, signal));
      }
      signal.throwIfAborted();
      return new GPURasterTileHaloLease(plan, leases);
    } catch (error) {
      for (const lease of leases) lease.release();
      throw error;
    }
  }
}

/** Composite pin for the owning tile and every source contributing its GPU-assembled halo. */
export class GPURasterTileHaloLease {
  readonly plan: GPURasterTileHaloPlan;
  readonly core: GPURasterTileLease;
  readonly tiles: readonly GPURasterTileLease[];

  private releasePromise: Promise<void> | null = null;

  /** @internal Instances are returned by GPURasterTileHaloAssembler.acquire. */
  constructor(plan: GPURasterTileHaloPlan, tiles: readonly GPURasterTileLease[]) {
    if (tiles.length === 0 || !(tiles[0] instanceof GPURasterTileLease)) {
      throw new Error('Raster halo leases require a pinned owning core tile');
    }
    this.plan = plan;
    this.core = tiles[0];
    this.tiles = Object.freeze([...tiles]);
  }

  /** Releases unencoded or already-completed core and neighbor pins exactly once. */
  release(): void {
    if (this.releasePromise) return;
    for (const tile of this.tiles) tile.release();
  }

  /** Defers destruction of every imported source until the same post-submit fence settles. */
  releaseAfter(fence: GPURasterTileReleaseFence): Promise<void> {
    this.releasePromise ??= Promise.all(this.tiles.map(tile => tile.releaseAfter(fence))).then(
      () => undefined
    );
    return this.releasePromise;
  }
}

/**
 * Assembles disjoint neighboring tiles with explicit graph-declared GPU compute passes.
 *
 * Each source receives its own bounded pass so a 3×3 neighborhood does not exceed portable
 * storage-binding limits. Raw scalar bits, source validity, nodata sentinels, and calibration
 * metadata remain untouched; downstream analytics apply source calibration exactly once.
 */
export class GPURasterTileHaloFill<Format extends GPURasterScalarFormat = GPURasterScalarFormat>
  implements GPUCommandGraphContributor
{
  readonly id: string;
  readonly pixelBounds: GPURasterPixelBounds;
  readonly sources: readonly GPURasterTileHaloSource<Format>[];
  readonly output: GraphDataView<Format>;
  readonly outputValidity: GraphDataView<'uint32'>;
  readonly width: number;
  readonly height: number;

  constructor(props: GPURasterTileHaloFillProps<Format>) {
    this.id = props.id ?? 'gpu-raster-tile-halo-fill';
    this.pixelBounds = freezeBounds(props.pixelBounds, `${this.id} destination bounds`);
    this.width = this.pixelBounds[2] - this.pixelBounds[0];
    this.height = this.pixelBounds[3] - this.pixelBounds[1];
    this.output = props.output;
    this.outputValidity = props.outputValidity;
    if (!Array.isArray(props.sources) || props.sources.length === 0) {
      throw new Error(`${this.id} requires at least one borrowed source tile`);
    }
    this.sources = Object.freeze(
      props.sources.map(source => ({
        pixelBounds: freezeBounds(source.pixelBounds, `${this.id} source bounds`),
        input: source.input
      }))
    );
    const pixelCount = assertPixelCount(this.width, this.height, this.id);
    const firstBand = this.sources[0].input;
    validateRasterScalarView(this.output, firstBand.format, pixelCount, `${this.id} output`);
    validateRasterValidityView(this.outputValidity, pixelCount, `${this.id} output validity`);
    if (this.output.buffer === this.outputValidity.buffer) {
      throw new Error(`${this.id} output samples and validity must use separate buffers`);
    }

    const intersections: GPURasterPixelBounds[] = [];
    let coveredPixels = 0;
    for (const source of this.sources) {
      const sourceWidth = source.pixelBounds[2] - source.pixelBounds[0];
      const sourceHeight = source.pixelBounds[3] - source.pixelBounds[1];
      const owner = validateRasterBand(
        source.input,
        {width: sourceWidth, height: sourceHeight},
        `${this.id} source`
      );
      if (
        source.input.id !== firstBand.id ||
        source.input.format !== firstBand.format ||
        !Object.is(source.input.noDataValue, firstBand.noDataValue) ||
        !Object.is(source.input.scale, firstBand.scale) ||
        !Object.is(source.input.offset, firstBand.offset)
      ) {
        throw new Error(`${this.id} sources must preserve identical band and calibration metadata`);
      }
      if (this.output.buffer.graph !== owner || this.outputValidity.buffer.graph !== owner) {
        throw new Error(`${this.id} resources must belong to the same graph`);
      }
      assertSeparateTransferBuffers(source.input, this.output, this.outputValidity, this.id);
      const intersection = intersectBounds(this.pixelBounds, source.pixelBounds);
      if (!intersection) {
        throw new Error(`${this.id} source must intersect the assembled destination`);
      }
      if (intersections.some(previous => intersectBounds(previous, intersection))) {
        throw new Error(`${this.id} source coverage must be nonoverlapping`);
      }
      intersections.push(intersection);
      coveredPixels += (intersection[2] - intersection[0]) * (intersection[3] - intersection[1]);
    }
    if (coveredPixels !== pixelCount) {
      throw new Error(`${this.id} sources must cover every destination pixel exactly once`);
    }
  }

  /** Declares one portable, source-isolated GPU gather pass per intersecting resident tile. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    for (const [sourceIndex, source] of this.sources.entries()) {
      const intersection = intersectBounds(this.pixelBounds, source.pixelBounds)!;
      addRasterTransferPass(graph, {
        id: `${this.id}-${sourceIndex}`,
        source: source.input,
        sourceWidth: source.pixelBounds[2] - source.pixelBounds[0],
        sourceHeight: source.pixelBounds[3] - source.pixelBounds[1],
        sourceOrigin: [
          intersection[0] - source.pixelBounds[0],
          intersection[1] - source.pixelBounds[1]
        ],
        destinationWidth: this.width,
        destinationOrigin: [
          intersection[0] - this.pixelBounds[0],
          intersection[1] - this.pixelBounds[1]
        ],
        width: intersection[2] - intersection[0],
        height: intersection[3] - intersection[1],
        output: this.output,
        outputValidity: this.outputValidity
      });
    }
  }
}

/** Copies only an owned half-open processed core; padded halo pixels are never published. */
export class GPURasterTileCoreExtract<Format extends GPURasterScalarFormat = GPURasterScalarFormat>
  implements GPUCommandGraphContributor
{
  readonly id: string;
  readonly availablePixelBounds: GPURasterPixelBounds;
  readonly corePixelBounds: GPURasterPixelBounds;
  readonly input: GPURasterBufferBand<Format>;
  readonly output: GraphDataView<Format>;
  readonly outputValidity: GraphDataView<'uint32'>;
  readonly width: number;
  readonly height: number;

  constructor(props: GPURasterTileCoreExtractProps<Format>) {
    this.id = props.id ?? 'gpu-raster-tile-core-extract';
    this.availablePixelBounds = freezeBounds(
      props.availablePixelBounds,
      `${this.id} available bounds`
    );
    this.corePixelBounds = freezeBounds(props.corePixelBounds, `${this.id} core bounds`);
    if (
      this.corePixelBounds[0] < this.availablePixelBounds[0] ||
      this.corePixelBounds[1] < this.availablePixelBounds[1] ||
      this.corePixelBounds[2] > this.availablePixelBounds[2] ||
      this.corePixelBounds[3] > this.availablePixelBounds[3]
    ) {
      throw new Error(`${this.id} owned core must lie inside its assembled coverage`);
    }
    this.width = this.corePixelBounds[2] - this.corePixelBounds[0];
    this.height = this.corePixelBounds[3] - this.corePixelBounds[1];
    this.input = props.input;
    this.output = props.output;
    this.outputValidity = props.outputValidity;
    const availableWidth = this.availablePixelBounds[2] - this.availablePixelBounds[0];
    const availableHeight = this.availablePixelBounds[3] - this.availablePixelBounds[1];
    assertPixelCount(availableWidth, availableHeight, `${this.id} available coverage`);
    const owner = validateRasterBand(
      this.input,
      {width: availableWidth, height: availableHeight},
      `${this.id} input`
    );
    const pixelCount = assertPixelCount(this.width, this.height, this.id);
    validateRasterScalarView(this.output, this.input.format, pixelCount, `${this.id} output`);
    validateRasterValidityView(this.outputValidity, pixelCount, `${this.id} output validity`);
    if (this.output.buffer.graph !== owner || this.outputValidity.buffer.graph !== owner) {
      throw new Error(`${this.id} resources must belong to the same graph`);
    }
    if (this.output.buffer === this.outputValidity.buffer) {
      throw new Error(`${this.id} output samples and validity must use separate buffers`);
    }
    assertSeparateTransferBuffers(this.input, this.output, this.outputValidity, this.id);
  }

  /** Contributes one exact-format, validity-preserving packed core publication pass. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    addRasterTransferPass(graph, {
      id: this.id,
      source: this.input,
      sourceWidth: this.availablePixelBounds[2] - this.availablePixelBounds[0],
      sourceHeight: this.availablePixelBounds[3] - this.availablePixelBounds[1],
      sourceOrigin: [
        this.corePixelBounds[0] - this.availablePixelBounds[0],
        this.corePixelBounds[1] - this.availablePixelBounds[1]
      ],
      destinationWidth: this.width,
      destinationOrigin: [0, 0],
      width: this.width,
      height: this.height,
      output: this.output,
      outputValidity: this.outputValidity
    });
  }
}

function accumulateStageHalos(stages: readonly GPURasterHaloStage[]): readonly [number, number] {
  let horizontalHalo = 0;
  let verticalHalo = 0;
  for (const stage of stages) {
    if (!stage || !Number.isSafeInteger(stage.requiredHalo) || stage.requiredHalo < 0) {
      throw new Error('Raster halo stages require non-negative safe integer receptive fields');
    }
    const horizontalRadius = stage.horizontalRadius ?? stage.requiredHalo;
    const verticalRadius = stage.verticalRadius ?? stage.requiredHalo;
    if (
      !Number.isSafeInteger(horizontalRadius) ||
      !Number.isSafeInteger(verticalRadius) ||
      horizontalRadius < 0 ||
      verticalRadius < 0 ||
      horizontalRadius > stage.requiredHalo ||
      verticalRadius > stage.requiredHalo
    ) {
      throw new Error('Raster halo stage axes must fit inside their declared receptive field');
    }
    horizontalHalo += horizontalRadius;
    verticalHalo += verticalRadius;
    if (!Number.isSafeInteger(horizontalHalo) || !Number.isSafeInteger(verticalHalo)) {
      throw new Error('Cumulative raster halo radii must remain safe integers');
    }
  }
  return [horizontalHalo, verticalHalo];
}

function makeNeighborhoodRequests(
  core: GPURasterTileRequest,
  availablePixelBounds: GPURasterPixelBounds,
  level: GPURasterTileLevel,
  cache: GPURasterTileCache
): GPURasterTileRequest[] {
  if (core.column === undefined || core.row === undefined) {
    return [
      Object.freeze(
        cache.reader.normalizeTileRequest({
          level: core.level,
          bandIds: core.bandIds,
          pixelBounds: availablePixelBounds
        })
      )
    ];
  }

  const minimumColumn = Math.floor(availablePixelBounds[0] / level.tileWidth);
  const maximumColumn = Math.floor((availablePixelBounds[2] - 1) / level.tileWidth);
  const minimumRow = Math.floor(availablePixelBounds[1] / level.tileHeight);
  const maximumRow = Math.floor((availablePixelBounds[3] - 1) / level.tileHeight);
  const requests: GPURasterTileRequest[] = [];
  const makeRequest = (column: number, row: number): GPURasterTileRequest =>
    Object.freeze(
      cache.reader.normalizeTileRequest({
        level: core.level,
        column,
        row,
        bandIds: core.bandIds
      })
    );
  requests.push(makeRequest(core.column, core.row));
  for (let row = minimumRow; row <= maximumRow; row++) {
    for (let column = minimumColumn; column <= maximumColumn; column++) {
      if (column !== core.column || row !== core.row) {
        requests.push(makeRequest(column, row));
      }
    }
  }
  return requests;
}

function addRasterTransferPass<Parameters, Format extends GPURasterScalarFormat>(
  graph: GPUCommandGraph<Parameters>,
  transfer: RasterTransfer<Format>
): void {
  const views = [
    transfer.source.storage.values,
    transfer.output,
    transfer.outputValidity,
    ...(transfer.source.validity ? [transfer.source.validity] : [])
  ];
  for (const view of views) {
    if (view.buffer.graph !== graph) {
      throw new Error(`${transfer.id} resources must belong to the target graph`);
    }
    assertRasterStorageBindingFits(graph.device, view, `${transfer.id} ${view.buffer.id}`);
  }
  if (views.length > graph.device.limits.maxStorageBuffersPerShaderStage) {
    throw new Error(`${transfer.id} exceeds the device storage binding count`);
  }
  const dispatch = getRasterDispatchSize(
    graph.device,
    transfer.width,
    transfer.height,
    transfer.id
  );
  const resources: GraphResourceUse[] = [
    {buffer: transfer.source.storage.values, usage: 'storage-read'},
    {buffer: transfer.output, usage: 'storage-write'},
    {buffer: transfer.outputValidity, usage: 'storage-write'}
  ];
  if (transfer.source.validity) {
    resources.push({buffer: transfer.source.validity, usage: 'storage-read'});
  }

  graph.addComputePass({
    id: transfer.id,
    resources,
    compile: ({device}) => {
      const bindings: BindingDeclaration[] = [
        {name: 'sourceValues', type: 'read-only-storage', group: 0, location: 0},
        {name: 'outputValues', type: 'storage', group: 0, location: 1},
        {name: 'outputValidity', type: 'storage', group: 0, location: 2}
      ];
      if (transfer.source.validity) {
        bindings.push({name: 'sourceValidity', type: 'read-only-storage', group: 0, location: 3});
      }
      const computation = new Computation(device, {
        id: transfer.id,
        source: makeTransferShader(transfer),
        shaderLayout: {bindings}
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const resolvedBindings: Record<string, Binding> = {
            sourceValues: getViewBinding(transfer.source.storage.values, getBuffer),
            outputValues: getViewBinding(transfer.output, getBuffer),
            outputValidity: getViewBinding(transfer.outputValidity, getBuffer)
          };
          if (transfer.source.validity) {
            resolvedBindings['sourceValidity'] = getViewBinding(
              transfer.source.validity,
              getBuffer
            );
          }
          computation.setBindings(resolvedBindings);
          computation.dispatch(computePass, dispatch[0], dispatch[1]);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function makeTransferShader<Format extends GPURasterScalarFormat>(
  transfer: RasterTransfer<Format>
): string {
  const scalarType = getRasterShaderScalarType(transfer.source.format);
  const validityDeclaration = transfer.source.validity
    ? `@group(0) @binding(3) var<storage, read> sourceValidity: array<u32>;
const SOURCE_VALIDITY_OFFSET: u32 = ${getViewElementOffset(transfer.source.validity)}u;`
    : '';
  const validityExpression = transfer.source.validity
    ? 'sourceValidity[SOURCE_VALIDITY_OFFSET + sourceIndex]'
    : '1u';

  return /* wgsl */ `
const WIDTH: u32 = ${transfer.width}u;
const HEIGHT: u32 = ${transfer.height}u;
const SOURCE_WIDTH: u32 = ${transfer.sourceWidth}u;
const SOURCE_ORIGIN_X: u32 = ${transfer.sourceOrigin[0]}u;
const SOURCE_ORIGIN_Y: u32 = ${transfer.sourceOrigin[1]}u;
const OUTPUT_WIDTH: u32 = ${transfer.destinationWidth}u;
const OUTPUT_ORIGIN_X: u32 = ${transfer.destinationOrigin[0]}u;
const OUTPUT_ORIGIN_Y: u32 = ${transfer.destinationOrigin[1]}u;
const SOURCE_OFFSET: u32 = ${getViewElementOffset(transfer.source.storage.values)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(transfer.output)}u;
const OUTPUT_VALIDITY_OFFSET: u32 = ${getViewElementOffset(transfer.outputValidity)}u;
@group(0) @binding(0) var<storage, read> sourceValues: array<${scalarType}>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<${scalarType}>;
@group(0) @binding(2) var<storage, read_write> outputValidity: array<u32>;
${validityDeclaration}

@compute @workgroup_size(${RASTER_WORKGROUP_DIMENSION}, ${RASTER_WORKGROUP_DIMENSION})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x >= WIDTH || globalId.y >= HEIGHT) { return; }
  let sourceIndex =
    (SOURCE_ORIGIN_Y + globalId.y) * SOURCE_WIDTH + SOURCE_ORIGIN_X + globalId.x;
  let outputIndex =
    (OUTPUT_ORIGIN_Y + globalId.y) * OUTPUT_WIDTH + OUTPUT_ORIGIN_X + globalId.x;
  outputValues[OUTPUT_OFFSET + outputIndex] = sourceValues[SOURCE_OFFSET + sourceIndex];
  outputValidity[OUTPUT_VALIDITY_OFFSET + outputIndex] = ${validityExpression};
}`;
}

function assertSeparateTransferBuffers(
  input: GPURasterBufferBand,
  output: GraphDataView,
  outputValidity: GraphDataView<'uint32'>,
  label: string
): void {
  if (
    input.storage.values.buffer === output.buffer ||
    input.storage.values.buffer === outputValidity.buffer ||
    input.validity?.buffer === output.buffer ||
    input.validity?.buffer === outputValidity.buffer
  ) {
    throw new Error(`${label} source and destination buffers must remain separate`);
  }
}

function freezeBounds(bounds: GPURasterPixelBounds, label: string): GPURasterPixelBounds {
  if (
    !Array.isArray(bounds) ||
    bounds.length !== 4 ||
    !bounds.every(value => Number.isSafeInteger(value) && value >= 0) ||
    bounds[0] >= bounds[2] ||
    bounds[1] >= bounds[3]
  ) {
    throw new Error(`${label} must be a nonempty half-open pixel rectangle`);
  }
  return Object.freeze([...bounds]) as GPURasterPixelBounds;
}

function intersectBounds(
  first: GPURasterPixelBounds,
  second: GPURasterPixelBounds
): GPURasterPixelBounds | null {
  const minimumColumn = Math.max(first[0], second[0]);
  const minimumRow = Math.max(first[1], second[1]);
  const maximumColumn = Math.min(first[2], second[2]);
  const maximumRow = Math.min(first[3], second[3]);
  return minimumColumn < maximumColumn && minimumRow < maximumRow
    ? [minimumColumn, minimumRow, maximumColumn, maximumRow]
    : null;
}

function assertPixelCount(width: number, height: number, label: string): number {
  const pixelCount = width * height;
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width <= 0 ||
    height <= 0 ||
    !Number.isSafeInteger(pixelCount) ||
    pixelCount > MAXIMUM_RASTER_PIXEL_COUNT
  ) {
    throw new Error(`${label} pixel count must be positive and fit in uint32`);
  }
  return pixelCount;
}
