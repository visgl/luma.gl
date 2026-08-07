// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding, BindingDeclaration} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import type {DrawCommandBufferView} from '../gpu-primitives/draw-command-buffer';
import type {
  GPUCommandGraph,
  GPUCommandGraphContributor,
  GraphDataView,
  GraphResourceUse
} from '../gpu-primitives/gpu-command-graph';
import {GPUScan} from '../gpu-primitives/gpu-scan';
import {
  createTransientView,
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View,
  validatePackedView
} from '../gpu-primitives/graph-data-view-utils';
import {
  assertRasterStorageBindingFits,
  getRasterDispatchSize,
  getRasterFloatLiteral,
  getRasterScalarLiteral,
  getRasterShaderScalarType,
  MAXIMUM_RASTER_PIXEL_COUNT,
  RASTER_WORKGROUP_DIMENSION,
  validateRasterBand,
  validateRasterMetadata,
  validateRasterScalarView
} from './raster-utils';
import type {GPURasterBufferBand, GPURasterMetadata} from './types';

/** One fixed contour value, or one caller-owned GPU scalar updated between graph encodings. */
export type GPURasterContourLevel = number | GraphDataView<'float32'>;

/** Caller-owned per-cell outputs for reusable, GPU-native marching-squares classification. */
export type GPURasterContourClassifierProps = {
  id?: string;
  width: number;
  height: number;
  /** Exact source nodata is rejected before converting and calibrating numerical samples. */
  input: GPURasterBufferBand;
  /** A sample exactly equal to this level belongs to the high side. */
  level: GPURasterContourLevel;
  /** One packed case per cell: top-left=1, top-right=2, bottom-right=4, bottom-left=8. */
  cases: GraphDataView<'uint32'>;
  /** One packed zero, one, or two segment count for every row-major raster cell. */
  segmentCounts: GraphDataView<'uint32'>;
};

/** Bounded caller-owned geometry, scalar results, and optional indirect draw destination. */
export type GPURasterContoursProps = {
  id?: string;
  width: number;
  height: number;
  input: GPURasterBufferBand;
  level: GPURasterContourLevel;
  /** Two tightly packed local float32x2 positions are written for each emitted segment. */
  vertices: GraphDataView<'float32x2'>;
  /** Caller-owned scalar receiving min(requiredSegmentCount, vertex capacity / 2). */
  segmentCount: GraphDataView<'uint32'>;
  /** Caller-owned scalar receiving one when the available vertex capacity was insufficient. */
  overflow: GraphDataView<'uint32'>;
  /** Optional caller-owned scalar receiving the complete unclamped segment count. */
  requiredSegmentCount?: GraphDataView<'uint32'>;
  /** Optional graph-imported draw record, initially configured with exactly two vertices. */
  draw?: DrawCommandBufferView;
  /** Record whose instance count receives the GPU-generated clamped segment count. */
  drawCommandIndex?: number;
  /** Optional explicit limit below vertices.length / 2. Defaults to all available segments. */
  capacity?: number;
  /** Spatial metadata is retained without reprojection; area pixels use half-pixel centers. */
  metadata?: GPURasterMetadata;
};

type RasterContourDescription = Pick<
  GPURasterContourClassifierProps,
  'id' | 'width' | 'height' | 'input' | 'level'
>;

/**
 * Classifies row-major cells using a deterministic, validity-aware marching-squares policy.
 *
 * Values equal to the contour level are high; flat cells emit no segments. Ambiguous cases five
 * and ten use the bilinear asymptotic determinant. The 0x10 flag records the edge pairing, and an
 * exact determinant tie deterministically connects the high-valued diagonal. A missing corner, exact
 * raw nodata sentinel, nonfinite calibrated sample, or nonfinite GPU level clears the whole cell.
 */
export class GPURasterContourClassifier implements GPUCommandGraphContributor {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly input: GPURasterBufferBand;
  readonly level: GPURasterContourLevel;
  readonly cases: GraphDataView<'uint32'>;
  readonly segmentCounts: GraphDataView<'uint32'>;
  readonly cellCount: number;

  constructor(props: GPURasterContourClassifierProps) {
    this.id = props.id ?? 'gpu-raster-contour-classifier';
    this.width = props.width;
    this.height = props.height;
    this.input = props.input;
    this.level = props.level;
    this.cases = props.cases;
    this.segmentCounts = props.segmentCounts;
    this.cellCount = validateContourDescription(this);

    validateContourCellView(this.cases, this.cellCount, `${this.id} cases`);
    validateContourCellView(this.segmentCounts, this.cellCount, `${this.id} segmentCounts`);
    validateContourOwnership(this.id, this.input.storage.values.buffer.graph, [
      this.cases,
      this.segmentCounts
    ]);
    assertDistinctContourOutputs(
      this.id,
      [this.cases, this.segmentCounts],
      [
        this.input.storage.values,
        ...(this.input.validity ? [this.input.validity] : []),
        ...(getGPUContourLevel(this.level) ? [getGPUContourLevel(this.level)!] : [])
      ]
    );
  }

  /** Declares one bounded two-dimensional graph pass and never submits or reads back data. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const gpuLevel = getGPUContourLevel(this.level);
    validateContourGraphResources(this.id, graph, [
      this.input.storage.values,
      this.cases,
      this.segmentCounts,
      ...(this.input.validity ? [this.input.validity] : []),
      ...(gpuLevel ? [gpuLevel] : [])
    ]);
    if (this.cellCount === 0) return;

    const [horizontalCount, verticalCount] = getRasterDispatchSize(
      graph.device,
      this.width - 1,
      this.height - 1,
      this.id
    );
    const resources: GraphResourceUse[] = [
      {buffer: this.input.storage.values, usage: 'storage-read'},
      {buffer: this.cases, usage: 'storage-write'},
      {buffer: this.segmentCounts, usage: 'storage-write'}
    ];
    if (this.input.validity) resources.push({buffer: this.input.validity, usage: 'storage-read'});
    if (gpuLevel) resources.push({buffer: gpuLevel, usage: 'storage-read'});

    addContourComputePass(graph, {
      id: this.id,
      resources,
      source: getClassificationShaderSource(this, gpuLevel),
      bindings: [
        {name: 'sourceValues', view: this.input.storage.values, writable: false},
        {name: 'cellCases', view: this.cases, writable: true},
        {name: 'cellSegmentCounts', view: this.segmentCounts, writable: true},
        ...(this.input.validity
          ? [{name: 'sourceValidity', view: this.input.validity, writable: false}]
          : []),
        ...(gpuLevel ? [{name: 'levelValues', view: gpuLevel, writable: false}] : [])
      ],
      dispatch: [horizontalCount, verticalCount]
    });
  }
}

/**
 * Emits stable, bounded marching-squares line segments without host synchronization.
 *
 * Classification, exclusive {@link GPUScan}, geometry scatter, scalar publication, and optional
 * indirect instance-count updates are explicit graph passes. Scratch belongs to the compiled
 * graph; source samples, vertices, scalar destinations, and indirect command buffers stay owned
 * by their callers. Vertex positions remain local pixel-center coordinates: area pixels start at
 * (0.5, 0.5), point pixels at (0, 0). Apply the retained affine/CRS separately when rendering.
 */
export class GPURasterContours implements GPUCommandGraphContributor {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly input: GPURasterBufferBand;
  readonly level: GPURasterContourLevel;
  readonly vertices: GraphDataView<'float32x2'>;
  readonly segmentCount: GraphDataView<'uint32'>;
  readonly overflow: GraphDataView<'uint32'>;
  readonly requiredSegmentCount?: GraphDataView<'uint32'>;
  readonly draw?: DrawCommandBufferView;
  readonly drawCommandIndex: number;
  readonly capacity: number;
  readonly metadata?: GPURasterMetadata;
  readonly cellCount: number;

  constructor(props: GPURasterContoursProps) {
    this.id = props.id ?? 'gpu-raster-contours';
    this.width = props.width;
    this.height = props.height;
    this.input = props.input;
    this.level = props.level;
    this.vertices = props.vertices;
    this.segmentCount = props.segmentCount;
    this.overflow = props.overflow;
    this.requiredSegmentCount = props.requiredSegmentCount;
    this.draw = props.draw;
    this.drawCommandIndex = props.drawCommandIndex ?? 0;
    this.metadata = props.metadata;
    this.cellCount = validateContourDescription(this);
    this.capacity = props.capacity ?? this.vertices.length / 2;

    validatePackedView(this.vertices, ['float32x2'], `${this.id} vertices`);
    if (this.vertices.length % 2 !== 0) {
      throw new Error(`${this.id} vertices must contain an even number of positions`);
    }
    if (
      !Number.isSafeInteger(this.capacity) ||
      this.capacity < 0 ||
      this.capacity > this.vertices.length / 2
    ) {
      throw new Error(`${this.id} capacity must fit in the available vertex pairs`);
    }
    validateRasterScalarView(this.segmentCount, 'uint32', 1, `${this.id} segmentCount`);
    validateRasterScalarView(this.overflow, 'uint32', 1, `${this.id} overflow`);
    if (this.requiredSegmentCount) {
      validateRasterScalarView(
        this.requiredSegmentCount,
        'uint32',
        1,
        `${this.id} requiredSegmentCount`
      );
    }
    if (this.metadata) {
      validateRasterMetadata(this.metadata, `${this.id} metadata`);
      if (this.metadata.width !== this.width || this.metadata.height !== this.height) {
        throw new Error(`${this.id} metadata dimensions must match the raster grid`);
      }
    }
    if (!Number.isSafeInteger(this.drawCommandIndex) || this.drawCommandIndex < 0) {
      throw new Error(`${this.id} drawCommandIndex must be a non-negative integer`);
    }
    if (!this.draw && this.drawCommandIndex !== 0) {
      throw new Error(`${this.id} drawCommandIndex requires a draw command`);
    }
    if (this.draw) validateContourDraw(this.id, this.draw, this.drawCommandIndex);

    const outputs: GraphDataView[] = [
      this.vertices,
      this.segmentCount,
      this.overflow,
      ...(this.requiredSegmentCount ? [this.requiredSegmentCount] : []),
      ...(this.draw ? [this.draw.words] : [])
    ];
    validateContourOwnership(this.id, this.input.storage.values.buffer.graph, outputs);
    assertDistinctContourOutputs(this.id, outputs, [
      this.input.storage.values,
      ...(this.input.validity ? [this.input.validity] : []),
      ...(getGPUContourLevel(this.level) ? [getGPUContourLevel(this.level)!] : [])
    ]);
  }

  /** Adds classification, an unsigned scan, bounded geometry scatter, and scalar publication. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const gpuLevel = getGPUContourLevel(this.level);
    validateContourGraphResources(this.id, graph, [
      this.input.storage.values,
      this.vertices,
      this.segmentCount,
      this.overflow,
      ...(this.input.validity ? [this.input.validity] : []),
      ...(gpuLevel ? [gpuLevel] : []),
      ...(this.requiredSegmentCount ? [this.requiredSegmentCount] : []),
      ...(this.draw ? [this.draw.words] : [])
    ]);
    if (
      this.cellCount > 0 &&
      (graph.device.limits.maxComputeInvocationsPerWorkgroup < 256 ||
        graph.device.limits.maxComputeWorkgroupSizeX < 256)
    ) {
      throw new Error(`${this.id} scan exceeds device workgroup limits`);
    }

    const cases = createTransientView(graph, `${this.id}-cases`, 'uint32', this.cellCount);
    const segmentCounts = createTransientView(
      graph,
      `${this.id}-segment-counts`,
      'uint32',
      this.cellCount
    );
    const segmentOffsets = createTransientView(
      graph,
      `${this.id}-segment-offsets`,
      'uint32',
      this.cellCount
    );
    new GPURasterContourClassifier({
      id: `${this.id}-classify`,
      width: this.width,
      height: this.height,
      input: this.input,
      level: this.level,
      cases,
      segmentCounts
    }).addToGraph(graph);
    new GPUScan({
      id: `${this.id}-scan`,
      input: segmentCounts,
      output: segmentOffsets,
      mode: 'exclusive'
    }).addToGraph(graph);
    if (this.cellCount > 0 && this.capacity > 0) {
      this.addScatterPass(graph, cases, segmentOffsets, gpuLevel);
    }
    this.addSummaryPass(graph, segmentCounts, segmentOffsets);
  }

  private addScatterPass<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    cases: GraphDataView<'uint32'>,
    segmentOffsets: GraphDataView<'uint32'>,
    gpuLevel?: GraphDataView<'float32'>
  ): void {
    const [horizontalCount, verticalCount] = getRasterDispatchSize(
      graph.device,
      this.width - 1,
      this.height - 1,
      `${this.id}-scatter`
    );
    const resources: GraphResourceUse[] = [
      {buffer: this.input.storage.values, usage: 'storage-read'},
      {buffer: cases, usage: 'storage-read'},
      {buffer: segmentOffsets, usage: 'storage-read'},
      {buffer: this.vertices, usage: 'storage-write'}
    ];
    if (gpuLevel) resources.push({buffer: gpuLevel, usage: 'storage-read'});
    addContourComputePass(graph, {
      id: `${this.id}-scatter`,
      resources,
      source: getScatterShaderSource(this, cases, segmentOffsets, gpuLevel),
      bindings: [
        {name: 'sourceValues', view: this.input.storage.values, writable: false},
        {name: 'cellCases', view: cases, writable: false},
        {name: 'cellOffsets', view: segmentOffsets, writable: false},
        {name: 'outputVertices', view: this.vertices, writable: true},
        ...(gpuLevel ? [{name: 'levelValues', view: gpuLevel, writable: false}] : [])
      ],
      dispatch: [horizontalCount, verticalCount]
    });
  }

  private addSummaryPass<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    segmentCounts: GraphDataView<'uint32'>,
    segmentOffsets: GraphDataView<'uint32'>
  ): void {
    const hasCells = this.cellCount > 0;
    const bindings: ContourBinding[] = [
      ...(hasCells ? [{name: 'cellSegmentCounts', view: segmentCounts, writable: false}] : []),
      ...(hasCells ? [{name: 'cellOffsets', view: segmentOffsets, writable: false}] : []),
      {name: 'outputSegmentCount', view: this.segmentCount, writable: true},
      {name: 'outputOverflow', view: this.overflow, writable: true},
      ...(this.requiredSegmentCount
        ? [{name: 'outputRequiredCount', view: this.requiredSegmentCount, writable: true}]
        : []),
      ...(this.draw ? [{name: 'drawCommandWords', view: this.draw.words, writable: true}] : [])
    ];
    addContourComputePass(graph, {
      id: `${this.id}-publish`,
      resources: bindings.map(({view, writable}) => ({
        buffer: view,
        usage: writable ? 'storage-write' : 'storage-read'
      })),
      source: getSummaryShaderSource(this, segmentCounts, segmentOffsets, bindings),
      bindings,
      dispatch: [1, 1]
    });
  }
}

type ContourBinding = {name: string; view: GraphDataView; writable: boolean};

function addContourComputePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    resources: GraphResourceUse[];
    source: string;
    bindings: ContourBinding[];
    dispatch: readonly [number, number];
  }
): void {
  graph.addComputePass({
    id: props.id,
    resources: props.resources,
    compile: ({device}) => {
      const declarations: BindingDeclaration[] = props.bindings.map((binding, index) => ({
        name: binding.name,
        type: binding.writable ? 'storage' : 'read-only-storage',
        group: 0,
        location: index
      }));
      const computation = new Computation(device, {
        id: props.id,
        source: props.source,
        shaderLayout: {bindings: declarations}
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const resolvedBindings: Record<string, Binding> = {};
          for (const binding of props.bindings) {
            resolvedBindings[binding.name] = getViewBinding(binding.view, getBuffer);
          }
          computation.setBindings(resolvedBindings);
          computation.dispatch(computePass, props.dispatch[0], props.dispatch[1]);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function validateContourDescription(description: RasterContourDescription): number {
  const id = description.id ?? 'gpu-raster-contours';
  if (
    !Number.isSafeInteger(description.width) ||
    description.width <= 0 ||
    !Number.isSafeInteger(description.height) ||
    description.height <= 0
  ) {
    throw new Error(`${id} dimensions must be positive integers`);
  }
  const pixelCount = description.width * description.height;
  if (!Number.isSafeInteger(pixelCount) || pixelCount > MAXIMUM_RASTER_PIXEL_COUNT) {
    throw new Error(`${id} pixel count must fit in uint32`);
  }
  const cellCount = (description.width - 1) * (description.height - 1);
  if (cellCount * 2 > MAXIMUM_RASTER_PIXEL_COUNT) {
    throw new Error(`${id} maximum segment count must fit in uint32`);
  }
  if (description.input.storage.kind !== 'buffer') {
    throw new Error(`${id} requires a buffer-backed raster band`);
  }
  const owner = validateRasterBand(description.input, description, `${id} input`);
  getRasterFloatLiteral(description.input.scale ?? 1);
  getRasterFloatLiteral(description.input.offset ?? 0);
  if (typeof description.level === 'number') {
    if (!Number.isFinite(description.level)) {
      throw new Error(`${id} contour level must be finite`);
    }
    getRasterFloatLiteral(description.level);
  } else {
    validateRasterScalarView(description.level, 'float32', 1, `${id} level`);
    if (description.level.buffer.graph !== owner) {
      throw new Error(`${id} contour level must belong to the same graph`);
    }
  }
  return cellCount;
}

function validateContourCellView(view: GraphDataView, cellCount: number, label: string): void {
  validatePackedUint32View(view, label);
  if (view.length !== cellCount) {
    throw new Error(`${label} must contain exactly one value per raster cell`);
  }
}

function validateContourOwnership(
  id: string,
  owner: GraphDataView['buffer']['graph'],
  views: GraphDataView[]
): void {
  if (views.some(view => view.buffer.graph !== owner)) {
    throw new Error(`${id} resources must belong to the same graph`);
  }
}

function assertDistinctContourOutputs(
  id: string,
  outputs: GraphDataView[],
  inputs: GraphDataView[]
): void {
  const outputBuffers = new Set(outputs.map(output => output.buffer));
  if (
    outputBuffers.size !== outputs.length ||
    inputs.some(input => outputBuffers.has(input.buffer))
  ) {
    throw new Error(`${id} input and output resources must use separate buffers`);
  }
}

function validateContourDraw(id: string, draw: DrawCommandBufferView, index: number): void {
  if (draw.type !== 'draw' || draw.recordByteLength !== 16) {
    throw new Error(`${id} requires non-indexed two-vertex indirect draw records`);
  }
  if (index >= draw.capacity) {
    throw new Error(`${id} drawCommandIndex exceeds the indirect draw capacity`);
  }
  validatePackedUint32View(draw.words, `${id} indirect command words`);
  if (draw.words.buffer !== draw.buffer || draw.words.length < draw.capacity * 4) {
    throw new Error(`${id} indirect command words must span every draw record`);
  }
}

function validateContourGraphResources<Parameters>(
  id: string,
  graph: GPUCommandGraph<Parameters>,
  views: GraphDataView[]
): void {
  for (const view of views) {
    if (view.buffer.graph !== graph) {
      throw new Error(`${id} resources must belong to the target graph`);
    }
    assertRasterStorageBindingFits(graph.device, view, `${id} ${view.buffer.id}`);
  }
}

function getGPUContourLevel(level: GPURasterContourLevel): GraphDataView<'float32'> | undefined {
  return typeof level === 'number' ? undefined : level;
}

function getClassificationShaderSource(
  classifier: GPURasterContourClassifier,
  gpuLevel?: GraphDataView<'float32'>
): string {
  const validity = classifier.input.validity;
  const validityLocation = 3;
  const levelLocation = validity ? 4 : 3;
  const validityDeclaration = validity
    ? `@group(0) @binding(${validityLocation}) var<storage, read> sourceValidity: array<u32>;
const VALIDITY_OFFSET: u32 = ${getViewElementOffset(validity)}u;`
    : '';
  const levelDeclaration = gpuLevel
    ? `@group(0) @binding(${levelLocation}) var<storage, read> levelValues: array<f32>;
const LEVEL_OFFSET: u32 = ${getViewElementOffset(gpuLevel)}u;`
    : '';
  const levelExpression = gpuLevel
    ? 'levelValues[LEVEL_OFFSET]'
    : getRasterFloatLiteral(classifier.level as number);
  const rawNoData =
    classifier.input.noDataValue !== undefined && !Number.isNaN(classifier.input.noDataValue)
      ? ` && rawValue != ${getRasterScalarLiteral(classifier.input.noDataValue, classifier.input.format)}`
      : '';
  const validityExpression = validity ? ' && sourceValidity[VALIDITY_OFFSET + index] != 0u' : '';
  const rawFinite = classifier.input.format === 'float32' ? ' && isFiniteValue(rawValue)' : '';

  return /* wgsl */ `
const WIDTH: u32 = ${classifier.width}u;
const CELL_WIDTH: u32 = ${classifier.width - 1}u;
const CELL_HEIGHT: u32 = ${classifier.height - 1}u;
const SOURCE_OFFSET: u32 = ${getViewElementOffset(classifier.input.storage.values)}u;
const CASE_OFFSET: u32 = ${getViewElementOffset(classifier.cases)}u;
const COUNT_OFFSET: u32 = ${getViewElementOffset(classifier.segmentCounts)}u;
@group(0) @binding(0) var<storage, read> sourceValues: array<${getRasterShaderScalarType(classifier.input.format)}>;
@group(0) @binding(1) var<storage, read_write> cellCases: array<u32>;
@group(0) @binding(2) var<storage, read_write> cellSegmentCounts: array<u32>;
${validityDeclaration}
${levelDeclaration}

fn isFiniteValue(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

fn isValidSample(index: u32, rawValue: ${getRasterShaderScalarType(classifier.input.format)}, value: f32) -> bool {
  return isFiniteValue(value)${rawFinite}${rawNoData}${validityExpression};
}

@compute @workgroup_size(${RASTER_WORKGROUP_DIMENSION}, ${RASTER_WORKGROUP_DIMENSION})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x >= CELL_WIDTH || globalId.y >= CELL_HEIGHT) { return; }
  let cellIndex = globalId.y * CELL_WIDTH + globalId.x;
  let topLeftIndex = globalId.y * WIDTH + globalId.x;
  let topRightIndex = topLeftIndex + 1u;
  let bottomLeftIndex = topLeftIndex + WIDTH;
  let bottomRightIndex = bottomLeftIndex + 1u;
  let topLeftRaw = sourceValues[SOURCE_OFFSET + topLeftIndex];
  let topRightRaw = sourceValues[SOURCE_OFFSET + topRightIndex];
  let bottomRightRaw = sourceValues[SOURCE_OFFSET + bottomRightIndex];
  let bottomLeftRaw = sourceValues[SOURCE_OFFSET + bottomLeftIndex];
  let topLeft = f32(topLeftRaw) * ${getRasterFloatLiteral(classifier.input.scale ?? 1)} + ${getRasterFloatLiteral(classifier.input.offset ?? 0)};
  let topRight = f32(topRightRaw) * ${getRasterFloatLiteral(classifier.input.scale ?? 1)} + ${getRasterFloatLiteral(classifier.input.offset ?? 0)};
  let bottomRight = f32(bottomRightRaw) * ${getRasterFloatLiteral(classifier.input.scale ?? 1)} + ${getRasterFloatLiteral(classifier.input.offset ?? 0)};
  let bottomLeft = f32(bottomLeftRaw) * ${getRasterFloatLiteral(classifier.input.scale ?? 1)} + ${getRasterFloatLiteral(classifier.input.offset ?? 0)};
  let contourLevel = ${levelExpression};
  if (!isFiniteValue(contourLevel) ||
      !isValidSample(topLeftIndex, topLeftRaw, topLeft) ||
      !isValidSample(topRightIndex, topRightRaw, topRight) ||
      !isValidSample(bottomRightIndex, bottomRightRaw, bottomRight) ||
      !isValidSample(bottomLeftIndex, bottomLeftRaw, bottomLeft)) {
    cellCases[CASE_OFFSET + cellIndex] = 0u;
    cellSegmentCounts[COUNT_OFFSET + cellIndex] = 0u;
    return;
  }

  let caseIndex = select(0u, 1u, topLeft >= contourLevel) |
    select(0u, 2u, topRight >= contourLevel) |
    select(0u, 4u, bottomRight >= contourLevel) |
    select(0u, 8u, bottomLeft >= contourLevel);
  var encodedCase = caseIndex;
  var segmentCount = select(1u, 0u, caseIndex == 0u || caseIndex == 15u);
  if (caseIndex == 5u || caseIndex == 10u) {
    let magnitude = max(1.0, max(abs(contourLevel),
      max(max(abs(topLeft), abs(topRight)), max(abs(bottomRight), abs(bottomLeft)))));
    let topLeftDelta = topLeft / magnitude - contourLevel / magnitude;
    let topRightDelta = topRight / magnitude - contourLevel / magnitude;
    let bottomRightDelta = bottomRight / magnitude - contourLevel / magnitude;
    let bottomLeftDelta = bottomLeft / magnitude - contourLevel / magnitude;
    let determinant = topLeftDelta * bottomRightDelta - topRightDelta * bottomLeftDelta;
    let topRightPair = determinant > 0.0 || (determinant == 0.0 && caseIndex == 5u);
    encodedCase = caseIndex | select(0u, 16u, topRightPair);
    segmentCount = 2u;
  }
  cellCases[CASE_OFFSET + cellIndex] = encodedCase;
  cellSegmentCounts[COUNT_OFFSET + cellIndex] = segmentCount;
}`;
}

function getScatterShaderSource(
  contours: GPURasterContours,
  cases: GraphDataView<'uint32'>,
  segmentOffsets: GraphDataView<'uint32'>,
  gpuLevel?: GraphDataView<'float32'>
): string {
  const levelDeclaration = gpuLevel
    ? `@group(0) @binding(4) var<storage, read> levelValues: array<f32>;
const LEVEL_OFFSET: u32 = ${getViewElementOffset(gpuLevel)}u;`
    : '';
  const levelExpression = gpuLevel
    ? 'levelValues[LEVEL_OFFSET]'
    : getRasterFloatLiteral(contours.level as number);
  const pixelOffset = contours.metadata?.pixelInterpretation === 'point' ? '0.0' : '0.5';

  return /* wgsl */ `
const WIDTH: u32 = ${contours.width}u;
const CELL_WIDTH: u32 = ${contours.width - 1}u;
const CELL_HEIGHT: u32 = ${contours.height - 1}u;
const SEGMENT_CAPACITY: u32 = ${contours.capacity}u;
const SOURCE_OFFSET: u32 = ${getViewElementOffset(contours.input.storage.values)}u;
const CASE_OFFSET: u32 = ${getViewElementOffset(cases)}u;
const CELL_OFFSET: u32 = ${getViewElementOffset(segmentOffsets)}u;
const VERTEX_OFFSET: u32 = ${getViewElementOffset(contours.vertices)}u;
@group(0) @binding(0) var<storage, read> sourceValues: array<${getRasterShaderScalarType(contours.input.format)}>;
@group(0) @binding(1) var<storage, read> cellCases: array<u32>;
@group(0) @binding(2) var<storage, read> cellOffsets: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputVertices: array<f32>;
${levelDeclaration}

fn isFiniteValue(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

fn getInterpolation(first: f32, second: f32, contourLevel: f32) -> f32 {
  let directNumerator = contourLevel - first;
  let directDenominator = second - first;
  if (isFiniteValue(directNumerator) && isFiniteValue(directDenominator) &&
      directDenominator != 0.0) {
    return clamp(directNumerator / directDenominator, 0.0, 1.0);
  }
  let magnitude = max(1.0, max(abs(contourLevel), max(abs(first), abs(second))));
  let numerator = contourLevel / magnitude - first / magnitude;
  let denominator = second / magnitude - first / magnitude;
  if (denominator == 0.0) { return 0.5; }
  return clamp(numerator / denominator, 0.0, 1.0);
}

fn getEdgePosition(
  edge: u32,
  topLeft: f32,
  topRight: f32,
  bottomRight: f32,
  bottomLeft: f32,
  contourLevel: f32,
  origin: vec2<f32>
) -> vec2<f32> {
  switch edge {
    case 0u: {
      return origin + vec2<f32>(getInterpolation(topLeft, topRight, contourLevel), 0.0);
    }
    case 1u: {
      return origin + vec2<f32>(1.0, getInterpolation(topRight, bottomRight, contourLevel));
    }
    case 2u: {
      return origin + vec2<f32>(getInterpolation(bottomLeft, bottomRight, contourLevel), 1.0);
    }
    default: {
      return origin + vec2<f32>(0.0, getInterpolation(topLeft, bottomLeft, contourLevel));
    }
  }
}

fn writeSegment(
  segmentIndex: u32,
  firstEdge: u32,
  secondEdge: u32,
  topLeft: f32,
  topRight: f32,
  bottomRight: f32,
  bottomLeft: f32,
  contourLevel: f32,
  origin: vec2<f32>
) {
  if (segmentIndex >= SEGMENT_CAPACITY) { return; }
  let first = getEdgePosition(
    firstEdge, topLeft, topRight, bottomRight, bottomLeft, contourLevel, origin
  );
  let second = getEdgePosition(
    secondEdge, topLeft, topRight, bottomRight, bottomLeft, contourLevel, origin
  );
  let outputIndex = VERTEX_OFFSET + segmentIndex * 4u;
  outputVertices[outputIndex] = first.x;
  outputVertices[outputIndex + 1u] = first.y;
  outputVertices[outputIndex + 2u] = second.x;
  outputVertices[outputIndex + 3u] = second.y;
}

@compute @workgroup_size(${RASTER_WORKGROUP_DIMENSION}, ${RASTER_WORKGROUP_DIMENSION})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x >= CELL_WIDTH || globalId.y >= CELL_HEIGHT) { return; }
  let cellIndex = globalId.y * CELL_WIDTH + globalId.x;
  let encodedCase = cellCases[CASE_OFFSET + cellIndex];
  let caseIndex = encodedCase & 15u;
  if (caseIndex == 0u || caseIndex == 15u) { return; }
  let segmentIndex = cellOffsets[CELL_OFFSET + cellIndex];
  if (segmentIndex >= SEGMENT_CAPACITY) { return; }
  let topLeftIndex = globalId.y * WIDTH + globalId.x;
  let topLeft = f32(sourceValues[SOURCE_OFFSET + topLeftIndex]) * ${getRasterFloatLiteral(contours.input.scale ?? 1)} + ${getRasterFloatLiteral(contours.input.offset ?? 0)};
  let topRight = f32(sourceValues[SOURCE_OFFSET + topLeftIndex + 1u]) * ${getRasterFloatLiteral(contours.input.scale ?? 1)} + ${getRasterFloatLiteral(contours.input.offset ?? 0)};
  let bottomLeft = f32(sourceValues[SOURCE_OFFSET + topLeftIndex + WIDTH]) * ${getRasterFloatLiteral(contours.input.scale ?? 1)} + ${getRasterFloatLiteral(contours.input.offset ?? 0)};
  let bottomRight = f32(sourceValues[SOURCE_OFFSET + topLeftIndex + WIDTH + 1u]) * ${getRasterFloatLiteral(contours.input.scale ?? 1)} + ${getRasterFloatLiteral(contours.input.offset ?? 0)};
  let contourLevel = ${levelExpression};
  let origin = vec2<f32>(f32(globalId.x) + ${pixelOffset}, f32(globalId.y) + ${pixelOffset});
  var firstEdge = 0u;
  var secondEdge = 0u;
  switch caseIndex {
    case 1u, 14u: { firstEdge = 3u; secondEdge = 0u; }
    case 2u, 13u: { firstEdge = 0u; secondEdge = 1u; }
    case 3u, 12u: { firstEdge = 3u; secondEdge = 1u; }
    case 4u, 11u: { firstEdge = 1u; secondEdge = 2u; }
    case 6u, 9u: { firstEdge = 0u; secondEdge = 2u; }
    case 7u, 8u: { firstEdge = 2u; secondEdge = 3u; }
    default: {
      let topRightPair = (encodedCase & 16u) != 0u;
      firstEdge = select(3u, 0u, topRightPair);
      secondEdge = select(0u, 1u, topRightPair);
      let thirdEdge = select(1u, 2u, topRightPair);
      let fourthEdge = select(2u, 3u, topRightPair);
      writeSegment(segmentIndex + 1u, thirdEdge, fourthEdge, topLeft, topRight,
        bottomRight, bottomLeft, contourLevel, origin);
    }
  }
  writeSegment(segmentIndex, firstEdge, secondEdge, topLeft, topRight,
    bottomRight, bottomLeft, contourLevel, origin);
}`;
}

function getSummaryShaderSource(
  contours: GPURasterContours,
  segmentCounts: GraphDataView<'uint32'>,
  segmentOffsets: GraphDataView<'uint32'>,
  bindings: ContourBinding[]
): string {
  const declarations = bindings
    .map(
      (binding, index) =>
        `@group(0) @binding(${index}) var<storage, ${binding.writable ? 'read_write' : 'read'}> ${binding.name}: array<u32>;`
    )
    .join('\n');
  const requiredExpression =
    contours.cellCount > 0
      ? `cellOffsets[${getViewElementOffset(segmentOffsets)}u + ${contours.cellCount - 1}u] + cellSegmentCounts[${getViewElementOffset(segmentCounts)}u + ${contours.cellCount - 1}u]`
      : '0u';
  const requiredOutput = contours.requiredSegmentCount
    ? `outputRequiredCount[${getViewElementOffset(contours.requiredSegmentCount)}u] = requiredCount;`
    : '';
  let drawOutput = '';
  if (contours.draw) {
    const commandWordOffset =
      getViewElementOffset(contours.draw.words) + contours.drawCommandIndex * 4;
    drawOutput = `drawCommandWords[${commandWordOffset}u] = 2u;
  drawCommandWords[${commandWordOffset + 1}u] = clampedCount;
  drawCommandWords[${commandWordOffset + 2}u] = 0u;
  drawCommandWords[${commandWordOffset + 3}u] = 0u;`;
  }

  return /* wgsl */ `
${declarations}

@compute @workgroup_size(1)
fn main() {
  let requiredCount = ${requiredExpression};
  let clampedCount = min(requiredCount, ${contours.capacity}u);
  outputSegmentCount[${getViewElementOffset(contours.segmentCount)}u] = clampedCount;
  outputOverflow[${getViewElementOffset(contours.overflow)}u] = select(0u, 1u, requiredCount > ${contours.capacity}u);
  ${requiredOutput}
  ${drawOutput}
}`;
}
