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
import {GPUGroupAggregation} from '../gpu-primitives/gpu-group-aggregation';
import {
  createTransientView,
  getViewBinding,
  getViewElementOffset,
  validatePackedView
} from '../gpu-primitives/graph-data-view-utils';
import {
  assertRasterStorageBindingFits,
  getRasterDispatchSize,
  getRasterFloatLiteral,
  MAXIMUM_RASTER_PIXEL_COUNT,
  RASTER_WORKGROUP_DIMENSION,
  validateRasterBand,
  validateRasterMetadata,
  validateRasterScalarView,
  validateRasterValidityView
} from './raster-utils';
import type {GPURasterBufferBand, GPURasterMetadata} from './types';

/** Distinct caller-owned, equally sized dense region columns and mergeable partials. */
export type GPURasterRegionMeasurementOutputs = {
  /** Topological region population, independent of missing intensity observations. */
  pixelCounts: GraphDataView<'uint32'>;
  /** Population of finite, calibrated intensity observations in each topological region. */
  intensityCounts: GraphDataView<'uint32'>;
  /** Mergeable sum of finite calibrated float32 intensity observations. */
  intensitySums: GraphDataView<'float32'>;
  /** Smallest finite calibrated intensity; canonical NaN for an empty intensity population. */
  intensityMinimums: GraphDataView<'float32'>;
  /** Largest finite calibrated intensity; canonical NaN for an empty intensity population. */
  intensityMaximums: GraphDataView<'float32'>;
  /** Calibrated intensity sum divided by intensity count; canonical NaN for empty regions. */
  intensityMeans: GraphDataView<'float32'>;
  /** Mergeable local pixel-center column moment for every valid topological member. */
  columnSums: GraphDataView<'float32'>;
  /** Mergeable local pixel-center row moment for every valid topological member. */
  rowSums: GraphDataView<'float32'>;
  /** Local pixel-center centroid column; retain affine translation separately at JS precision. */
  centroidColumns: GraphDataView<'float32'>;
  /** Local pixel-center centroid row; retain affine translation separately at JS precision. */
  centroidRows: GraphDataView<'float32'>;
  /** Topological population multiplied by the absolute affine determinant, in CRS units². */
  areas: GraphDataView<'float32'>;
};

/** Borrowed bounded dense labels, float-only observations, convergence, and region destinations. */
export type GPURasterRegionMeasurementsProps = {
  id?: string;
  /** Affine coordinates already describe this local grid; tile origins are not applied again. */
  metadata: GPURasterMetadata;
  /** Converged dense component labels: zero is background, foreground starts at one. */
  labels: GraphDataView<'uint32'>;
  /** Separate dense-label observation validity, including capacity-truncated foreground. */
  labelValidity: GraphDataView<'uint32'>;
  /** Upstream component convergence scalar; zero invalidates every region row. */
  converged: GraphDataView<'uint32'>;
  /** Upstream bounded dense component count. Values above capacity invalidate every row. */
  componentCount: GraphDataView<'uint32'>;
  /** Upstream dense capacity-overflow scalar; nonzero invalidates every region row. */
  overflow: GraphDataView<'uint32'>;
  /** Explicitly float32 source; callers must promote integer samples deliberately. */
  intensity: GPURasterBufferBand<'float32'>;
  /** Equally sized caller-owned dense region columns. Row zero represents dense label one. */
  output: GPURasterRegionMeasurementOutputs;
  /** Optional limit below output capacity. Defaults to the common output column length. */
  capacity?: number;
};

type RegionBinding = {
  name: string;
  view: GraphDataView;
  usage: Extract<GraphBufferUsage, 'storage-read' | 'storage-write'>;
};

/**
 * Computes bounded topology, calibrated intensity, centroid, and affine-area columns per region.
 *
 * Dense labels become zero-based grouping keys, while independent topology and intensity masks
 * preserve geometric populations despite missing intensity samples. Existing graph-native
 * {@link GPUGroupAggregation} contributors produce unsigned counts and float32 mergeable sums,
 * extrema, and coordinate moments. Empty rows are cleared or receive canonical NaN on every
 * encoding. Nonconvergence, dense overflow, or an out-of-capacity count suppresses every row.
 *
 * Centroids remain local pixel coordinates so callers can apply the original affine translation
 * with {@link getRasterRegionWorldCentroid} at JavaScript double precision. Areas are square CRS
 * coordinate units, never implicitly square meters. Floating atomic sums are order-dependent.
 */
export class GPURasterRegionMeasurements implements GPUCommandGraphContributor {
  readonly id: string;
  readonly metadata: GPURasterMetadata;
  readonly width: number;
  readonly height: number;
  readonly labels: GraphDataView<'uint32'>;
  readonly labelValidity: GraphDataView<'uint32'>;
  readonly converged: GraphDataView<'uint32'>;
  readonly componentCount: GraphDataView<'uint32'>;
  readonly overflow: GraphDataView<'uint32'>;
  readonly intensity: GPURasterBufferBand<'float32'>;
  readonly output: GPURasterRegionMeasurementOutputs;
  readonly capacity: number;

  constructor(props: GPURasterRegionMeasurementsProps) {
    this.id = props.id ?? 'gpu-raster-region-measurements';
    this.metadata = props.metadata;
    this.width = props.metadata.width;
    this.height = props.metadata.height;
    this.labels = props.labels;
    this.labelValidity = props.labelValidity;
    this.converged = props.converged;
    this.componentCount = props.componentCount;
    this.overflow = props.overflow;
    this.intensity = props.intensity;
    this.output = props.output;

    const pixelCount = validateRasterMetadata(this.metadata, `${this.id} metadata`);
    if (this.intensity.storage.kind !== 'buffer' || this.intensity.format !== 'float32') {
      throw new Error(
        `${this.id} requires an explicitly promoted buffer-backed float32 intensity band`
      );
    }
    const owner = validateRasterBand(this.intensity, this.metadata, `${this.id} intensity`);
    validateRasterScalarView(this.labels, 'uint32', pixelCount, `${this.id} dense labels`);
    validateRasterValidityView(this.labelValidity, pixelCount, `${this.id} dense validity`);
    validateRasterValidityView(this.converged, 1, `${this.id} convergence state`);
    validateRasterValidityView(this.componentCount, 1, `${this.id} bounded component count`);
    validateRasterValidityView(this.overflow, 1, `${this.id} dense overflow`);

    const outputViews = this.getOutputViews();
    const outputLength = this.output.pixelCounts.length;
    if (!Number.isSafeInteger(outputLength) || outputLength > MAXIMUM_RASTER_PIXEL_COUNT) {
      throw new Error(`${this.id} output region capacity must fit in uint32`);
    }
    for (const [index, view] of outputViews.entries()) {
      const format = index < 2 ? 'uint32' : 'float32';
      validatePackedView(view, [format], `${this.id} region output ${index}`);
      if (view.length !== outputLength) {
        throw new Error(`${this.id} region output columns must have identical lengths`);
      }
    }
    this.capacity = props.capacity ?? outputLength;
    if (!Number.isSafeInteger(this.capacity) || this.capacity < 0 || this.capacity > outputLength) {
      throw new Error(
        `${this.id} region capacity must be an integer from zero through output length`
      );
    }

    const inputViews = this.getInputViews();
    for (const view of [...inputViews, ...outputViews]) {
      if (view.buffer.graph !== owner) {
        throw new Error(`${this.id} region inputs and outputs must belong to the same graph`);
      }
    }
    for (const [index, output] of outputViews.entries()) {
      if (
        inputViews.some(input => input.buffer === output.buffer) ||
        outputViews.slice(index + 1).some(other => other.buffer === output.buffer)
      ) {
        throw new Error(`${this.id} region outputs must use distinct buffers separate from inputs`);
      }
    }

    getRasterFloatLiteral(this.intensity.scale ?? 1);
    getRasterFloatLiteral(this.intensity.offset ?? 0);
    const [horizontalScale, horizontalShear, , verticalShear, verticalScale] = this.metadata.affine;
    getRasterFloatLiteral(
      Math.abs(horizontalScale * verticalScale - horizontalShear * verticalShear)
    );
    if (this.intensity.noDataValue !== undefined && !Number.isNaN(this.intensity.noDataValue)) {
      getRasterFloatLiteral(this.intensity.noDataValue);
    }
  }

  /** Declares bounded selection, seven existing grouped reductions, and deterministic finalizers. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    if (graph.device.type !== 'webgpu') {
      throw new Error(`${this.id} region measurements require a WebGPU device`);
    }
    const views = [...this.getInputViews(), ...this.getOutputViews()];
    for (const view of views) {
      if (view.buffer.graph !== graph) {
        throw new Error(`${this.id} resources must belong to the target graph`);
      }
      if (view.length > 0) {
        assertRasterStorageBindingFits(graph.device, view, `${this.id} ${view.buffer.id}`);
      }
    }
    const groupCount = this.output.pixelCounts.length;
    if (groupCount === 0) return;
    if (
      graph.device.limits.maxComputeInvocationsPerWorkgroup < 256 ||
      graph.device.limits.maxComputeWorkgroupSizeX < 256
    ) {
      throw new Error(`${this.id} grouped reductions exceed device workgroup limits`);
    }
    const groupDispatch = Math.ceil(groupCount / 256);
    if (groupDispatch > graph.device.limits.maxComputeWorkgroupsPerDimension) {
      throw new Error(`${this.id} region output count exceeds device dispatch limits`);
    }
    const rasterDispatch = getRasterDispatchSize(graph.device, this.width, this.height, this.id);
    const pixelCount = this.width * this.height;
    const groupKeys = createTransientView(graph, `${this.id}-group-keys`, 'uint32', pixelCount);
    const topologyMask = createTransientView(
      graph,
      `${this.id}-topology-mask`,
      'uint32',
      pixelCount
    );
    const intensityMask = createTransientView(
      graph,
      `${this.id}-intensity-mask`,
      'uint32',
      pixelCount
    );
    const intensityValues = createTransientView(
      graph,
      `${this.id}-calibrated-intensity`,
      'float32',
      pixelCount
    );
    const columnValues = createTransientView(
      graph,
      `${this.id}-column-values`,
      'float32',
      pixelCount
    );
    const rowValues = createTransientView(graph, `${this.id}-row-values`, 'float32', pixelCount);
    for (const view of [
      groupKeys,
      topologyMask,
      intensityMask,
      intensityValues,
      columnValues,
      rowValues
    ]) {
      assertRasterStorageBindingFits(graph.device, view, `${this.id} ${view.buffer.id}`);
    }

    this.addMembershipPass(graph, groupKeys, topologyMask, rasterDispatch);
    this.addSamplePass(
      graph,
      topologyMask,
      intensityMask,
      intensityValues,
      columnValues,
      rowValues,
      rasterDispatch
    );
    new GPUGroupAggregation({
      id: `${this.id}-pixel-count`,
      keys: groupKeys,
      mask: topologyMask,
      output: this.output.pixelCounts
    }).addToGraph(graph);
    new GPUGroupAggregation({
      id: `${this.id}-intensity-count`,
      keys: groupKeys,
      mask: intensityMask,
      output: this.output.intensityCounts
    }).addToGraph(graph);
    new GPUGroupAggregation({
      id: `${this.id}-intensity-sum`,
      keys: groupKeys,
      values: intensityValues,
      mask: intensityMask,
      output: this.output.intensitySums,
      operation: 'sum'
    }).addToGraph(graph);
    new GPUGroupAggregation({
      id: `${this.id}-intensity-minimum`,
      keys: groupKeys,
      values: intensityValues,
      mask: intensityMask,
      output: this.output.intensityMinimums,
      operation: 'min'
    }).addToGraph(graph);
    new GPUGroupAggregation({
      id: `${this.id}-intensity-maximum`,
      keys: groupKeys,
      values: intensityValues,
      mask: intensityMask,
      output: this.output.intensityMaximums,
      operation: 'max'
    }).addToGraph(graph);
    new GPUGroupAggregation({
      id: `${this.id}-column-sum`,
      keys: groupKeys,
      values: columnValues,
      mask: topologyMask,
      output: this.output.columnSums,
      operation: 'sum'
    }).addToGraph(graph);
    new GPUGroupAggregation({
      id: `${this.id}-row-sum`,
      keys: groupKeys,
      values: rowValues,
      mask: topologyMask,
      output: this.output.rowSums,
      operation: 'sum'
    }).addToGraph(graph);
    this.addIntensityMeanPass(graph, groupDispatch);
    this.addGeometryPass(graph, groupDispatch);
  }

  private addMembershipPass<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    groupKeys: GraphDataView<'uint32'>,
    topologyMask: GraphDataView<'uint32'>,
    dispatch: readonly [number, number]
  ): void {
    addRegionPass(
      graph,
      `${this.id}-prepare-membership`,
      [
        {name: 'denseLabels', view: this.labels, usage: 'storage-read'},
        {name: 'denseValidity', view: this.labelValidity, usage: 'storage-read'},
        {name: 'convergenceValues', view: this.converged, usage: 'storage-read'},
        {name: 'componentCounts', view: this.componentCount, usage: 'storage-read'},
        {name: 'overflowValues', view: this.overflow, usage: 'storage-read'},
        {name: 'groupKeys', view: groupKeys, usage: 'storage-write'},
        {name: 'topologyMask', view: topologyMask, usage: 'storage-write'}
      ],
      locations => /* wgsl */ `
const WIDTH: u32 = ${this.width}u;
const HEIGHT: u32 = ${this.height}u;
const CAPACITY: u32 = ${this.capacity}u;
const GROUP_COUNT: u32 = ${this.output.pixelCounts.length}u;
const LABEL_OFFSET: u32 = ${getViewElementOffset(this.labels)}u;
const VALIDITY_OFFSET: u32 = ${getViewElementOffset(this.labelValidity)}u;
const CONVERGENCE_OFFSET: u32 = ${getViewElementOffset(this.converged)}u;
const COUNT_OFFSET: u32 = ${getViewElementOffset(this.componentCount)}u;
const OVERFLOW_OFFSET: u32 = ${getViewElementOffset(this.overflow)}u;
const KEY_OFFSET: u32 = ${getViewElementOffset(groupKeys)}u;
const MASK_OFFSET: u32 = ${getViewElementOffset(topologyMask)}u;
@group(0) @binding(${locations.get('denseLabels')}) var<storage, read> denseLabels: array<u32>;
@group(0) @binding(${locations.get('denseValidity')}) var<storage, read> denseValidity: array<u32>;
@group(0) @binding(${locations.get('convergenceValues')}) var<storage, read> convergenceValues: array<u32>;
@group(0) @binding(${locations.get('componentCounts')}) var<storage, read> componentCounts: array<u32>;
@group(0) @binding(${locations.get('overflowValues')}) var<storage, read> overflowValues: array<u32>;
@group(0) @binding(${locations.get('groupKeys')}) var<storage, read_write> groupKeys: array<u32>;
@group(0) @binding(${locations.get('topologyMask')}) var<storage, read_write> topologyMask: array<u32>;

@compute @workgroup_size(${RASTER_WORKGROUP_DIMENSION}, ${RASTER_WORKGROUP_DIMENSION})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x >= WIDTH || globalId.y >= HEIGHT) { return; }
  let pixelIndex = globalId.y * WIDTH + globalId.x;
  let denseLabel = denseLabels[LABEL_OFFSET + pixelIndex];
  let publishedCount = componentCounts[COUNT_OFFSET];
  let accepted = convergenceValues[CONVERGENCE_OFFSET] != 0u &&
    overflowValues[OVERFLOW_OFFSET] == 0u && publishedCount <= CAPACITY &&
    publishedCount <= GROUP_COUNT && denseValidity[VALIDITY_OFFSET + pixelIndex] != 0u &&
    denseLabel != 0u && denseLabel <= publishedCount;
  groupKeys[KEY_OFFSET + pixelIndex] = select(0u, denseLabel - 1u, accepted);
  topologyMask[MASK_OFFSET + pixelIndex] = select(0u, 1u, accepted);
}`,
      dispatch
    );
  }

  private addSamplePass<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    topologyMask: GraphDataView<'uint32'>,
    intensityMask: GraphDataView<'uint32'>,
    intensityValues: GraphDataView<'float32'>,
    columnValues: GraphDataView<'float32'>,
    rowValues: GraphDataView<'float32'>,
    dispatch: readonly [number, number]
  ): void {
    const bindings: RegionBinding[] = [
      {name: 'sourceValues', view: this.intensity.storage.values, usage: 'storage-read'},
      {name: 'topologyMask', view: topologyMask, usage: 'storage-read'},
      {name: 'intensityMask', view: intensityMask, usage: 'storage-write'},
      {name: 'intensityValues', view: intensityValues, usage: 'storage-write'},
      {name: 'columnValues', view: columnValues, usage: 'storage-write'},
      {name: 'rowValues', view: rowValues, usage: 'storage-write'}
    ];
    if (this.intensity.validity) {
      bindings.push({name: 'sourceValidity', view: this.intensity.validity, usage: 'storage-read'});
    }
    addRegionPass(
      graph,
      `${this.id}-prepare-observations`,
      bindings,
      locations => {
        const sourceValidity = this.intensity.validity;
        const validityDeclaration = sourceValidity
          ? `@group(0) @binding(${locations.get('sourceValidity')}) var<storage, read> sourceValidity: array<u32>;
const SOURCE_VALIDITY_OFFSET: u32 = ${getViewElementOffset(sourceValidity)}u;`
          : '';
        const validityCondition = sourceValidity
          ? ' && sourceValidity[SOURCE_VALIDITY_OFFSET + pixelIndex] != 0u'
          : '';
        const noDataCondition =
          this.intensity.noDataValue !== undefined && !Number.isNaN(this.intensity.noDataValue)
            ? ` && rawSample != ${getRasterFloatLiteral(this.intensity.noDataValue)}`
            : '';
        const centerOffset = this.metadata.pixelInterpretation === 'area' ? '0.5' : '0.0';
        return /* wgsl */ `
const WIDTH: u32 = ${this.width}u;
const HEIGHT: u32 = ${this.height}u;
const SOURCE_OFFSET: u32 = ${getViewElementOffset(this.intensity.storage.values)}u;
const TOPOLOGY_OFFSET: u32 = ${getViewElementOffset(topologyMask)}u;
const INTENSITY_MASK_OFFSET: u32 = ${getViewElementOffset(intensityMask)}u;
const INTENSITY_OFFSET: u32 = ${getViewElementOffset(intensityValues)}u;
const COLUMN_OFFSET: u32 = ${getViewElementOffset(columnValues)}u;
const ROW_OFFSET: u32 = ${getViewElementOffset(rowValues)}u;
@group(0) @binding(${locations.get('sourceValues')}) var<storage, read> sourceValues: array<f32>;
@group(0) @binding(${locations.get('topologyMask')}) var<storage, read> topologyMask: array<u32>;
@group(0) @binding(${locations.get('intensityMask')}) var<storage, read_write> intensityMask: array<u32>;
@group(0) @binding(${locations.get('intensityValues')}) var<storage, read_write> intensityValues: array<f32>;
@group(0) @binding(${locations.get('columnValues')}) var<storage, read_write> columnValues: array<f32>;
@group(0) @binding(${locations.get('rowValues')}) var<storage, read_write> rowValues: array<f32>;
${validityDeclaration}

fn isFiniteValue(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

@compute @workgroup_size(${RASTER_WORKGROUP_DIMENSION}, ${RASTER_WORKGROUP_DIMENSION})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x >= WIDTH || globalId.y >= HEIGHT) { return; }
  let pixelIndex = globalId.y * WIDTH + globalId.x;
  let rawSample = sourceValues[SOURCE_OFFSET + pixelIndex];
  let calibratedSample = rawSample * ${getRasterFloatLiteral(this.intensity.scale ?? 1)} +
    ${getRasterFloatLiteral(this.intensity.offset ?? 0)};
  let accepted = topologyMask[TOPOLOGY_OFFSET + pixelIndex] != 0u${validityCondition}${noDataCondition} &&
    isFiniteValue(rawSample) && isFiniteValue(calibratedSample);
  intensityMask[INTENSITY_MASK_OFFSET + pixelIndex] = select(0u, 1u, accepted);
  intensityValues[INTENSITY_OFFSET + pixelIndex] = select(0.0, calibratedSample, accepted);
  columnValues[COLUMN_OFFSET + pixelIndex] = f32(globalId.x) + ${centerOffset};
  rowValues[ROW_OFFSET + pixelIndex] = f32(globalId.y) + ${centerOffset};
}`;
      },
      dispatch
    );
  }

  private addIntensityMeanPass<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    dispatch: number
  ): void {
    addRegionPass(
      graph,
      `${this.id}-finalize-intensity`,
      [
        {name: 'intensityCounts', view: this.output.intensityCounts, usage: 'storage-read'},
        {name: 'intensitySums', view: this.output.intensitySums, usage: 'storage-read'},
        {name: 'intensityMeans', view: this.output.intensityMeans, usage: 'storage-write'}
      ],
      locations => /* wgsl */ `
const GROUP_COUNT: u32 = ${this.output.pixelCounts.length}u;
const COUNT_OFFSET: u32 = ${getViewElementOffset(this.output.intensityCounts)}u;
const SUM_OFFSET: u32 = ${getViewElementOffset(this.output.intensitySums)}u;
const MEAN_OFFSET: u32 = ${getViewElementOffset(this.output.intensityMeans)}u;
@group(0) @binding(${locations.get('intensityCounts')}) var<storage, read> intensityCounts: array<u32>;
@group(0) @binding(${locations.get('intensitySums')}) var<storage, read> intensitySums: array<f32>;
@group(0) @binding(${locations.get('intensityMeans')}) var<storage, read_write> intensityMeans: array<f32>;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x >= GROUP_COUNT) { return; }
  let count = intensityCounts[COUNT_OFFSET + globalId.x];
  var mean = bitcast<f32>(0x7fc00000u | (globalId.x & 0u));
  if (count != 0u) {
    mean = intensitySums[SUM_OFFSET + globalId.x] / f32(count);
  }
  intensityMeans[MEAN_OFFSET + globalId.x] = mean;
}`,
      [dispatch, 1]
    );
  }

  private addGeometryPass<Parameters>(graph: GPUCommandGraph<Parameters>, dispatch: number): void {
    const [horizontalScale, horizontalShear, , verticalShear, verticalScale] = this.metadata.affine;
    const pixelArea = Math.abs(horizontalScale * verticalScale - horizontalShear * verticalShear);
    addRegionPass(
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
const GROUP_COUNT: u32 = ${this.output.pixelCounts.length}u;
const COUNT_OFFSET: u32 = ${getViewElementOffset(this.output.pixelCounts)}u;
const COLUMN_SUM_OFFSET: u32 = ${getViewElementOffset(this.output.columnSums)}u;
const ROW_SUM_OFFSET: u32 = ${getViewElementOffset(this.output.rowSums)}u;
const CENTROID_COLUMN_OFFSET: u32 = ${getViewElementOffset(this.output.centroidColumns)}u;
const CENTROID_ROW_OFFSET: u32 = ${getViewElementOffset(this.output.centroidRows)}u;
const AREA_OFFSET: u32 = ${getViewElementOffset(this.output.areas)}u;
@group(0) @binding(${locations.get('pixelCounts')}) var<storage, read> pixelCounts: array<u32>;
@group(0) @binding(${locations.get('columnSums')}) var<storage, read> columnSums: array<f32>;
@group(0) @binding(${locations.get('rowSums')}) var<storage, read> rowSums: array<f32>;
@group(0) @binding(${locations.get('centroidColumns')}) var<storage, read_write> centroidColumns: array<f32>;
@group(0) @binding(${locations.get('centroidRows')}) var<storage, read_write> centroidRows: array<f32>;
@group(0) @binding(${locations.get('regionAreas')}) var<storage, read_write> regionAreas: array<f32>;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x >= GROUP_COUNT) { return; }
  let count = pixelCounts[COUNT_OFFSET + globalId.x];
  var centroidColumn = bitcast<f32>(0x7fc00000u | (globalId.x & 0u));
  var centroidRow = bitcast<f32>(0x7fc00000u | (globalId.x & 0u));
  var area = 0.0;
  if (count != 0u) {
    centroidColumn = columnSums[COLUMN_SUM_OFFSET + globalId.x] / f32(count);
    centroidRow = rowSums[ROW_SUM_OFFSET + globalId.x] / f32(count);
    area = f32(count) * ${getRasterFloatLiteral(pixelArea)};
    if (!(area == area && abs(area) <= 3.402823466e+38)) {
      area = bitcast<f32>(0x7fc00000u | (globalId.x & 0u));
    }
  }
  centroidColumns[CENTROID_COLUMN_OFFSET + globalId.x] = centroidColumn;
  centroidRows[CENTROID_ROW_OFFSET + globalId.x] = centroidRow;
  regionAreas[AREA_OFFSET + globalId.x] = area;
}`,
      [dispatch, 1]
    );
  }

  private getInputViews(): GraphDataView[] {
    return [
      this.labels,
      this.labelValidity,
      this.converged,
      this.componentCount,
      this.overflow,
      this.intensity.storage.values,
      ...(this.intensity.validity ? [this.intensity.validity] : [])
    ];
  }

  private getOutputViews(): GraphDataView[] {
    return [
      this.output.pixelCounts,
      this.output.intensityCounts,
      this.output.intensitySums,
      this.output.intensityMinimums,
      this.output.intensityMaximums,
      this.output.intensityMeans,
      this.output.columnSums,
      this.output.rowSums,
      this.output.centroidColumns,
      this.output.centroidRows,
      this.output.areas
    ];
  }
}

/** Applies a retained local-grid affine at JavaScript double precision without adding tile origin. */
export function getRasterRegionWorldCentroid(
  metadata: GPURasterMetadata,
  column: number,
  row: number
): readonly [number, number] {
  validateRasterMetadata(metadata, 'Region centroid metadata');
  if (!Number.isFinite(column) || !Number.isFinite(row)) {
    throw new Error('Region centroid coordinates must be finite local pixel values');
  }
  const [
    horizontalScale,
    horizontalShear,
    horizontalOrigin,
    verticalShear,
    verticalScale,
    verticalOrigin
  ] = metadata.affine;
  return [
    horizontalScale * column + horizontalShear * row + horizontalOrigin,
    verticalShear * column + verticalScale * row + verticalOrigin
  ];
}

function addRegionPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  bindings: readonly RegionBinding[],
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
