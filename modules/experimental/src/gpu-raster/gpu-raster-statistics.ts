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
import {
  createTransientView,
  getViewBinding,
  getViewElementOffset
} from '../gpu-core/graph-data-view-utils';
import {GPUReduction} from '../gpu-core/gpu-reduction';
import {getRasterDeviceLimits} from './raster-device-limits';
import {
  assertRasterStorageBindingFits,
  getRasterDispatchSize,
  getRasterFloatLiteral,
  MAXIMUM_RASTER_PIXEL_COUNT,
  RASTER_WORKGROUP_DIMENSION,
  validateRasterBand,
  validateRasterScalarView
} from './raster-utils';
import type {GPURasterBufferBand} from './types';

/** Explicit caller-owned output buffers for nodata-aware float32 raster statistics. */
export type GPURasterStatisticsProps = {
  id?: string;
  width: number;
  height: number;
  /** Packed float32 samples, optional validity flags, nodata sentinel, and calibration. */
  input: GPURasterBufferBand<'float32'>;
  /** One uint32 containing the number of finite, unmasked, non-nodata pixels. */
  count: GraphDataView<'uint32'>;
  /** One float32 containing the sum of calibrated valid samples. */
  sum: GraphDataView<'float32'>;
  /** One float32 containing the calibrated valid mean, or zero when count is zero. */
  mean: GraphDataView<'float32'>;
  /** Two float32 rows containing the calibrated minimum and maximum, or [0, 0]. */
  extent: GraphDataView<'float32'>;
};

/**
 * Publishes calibrated count, sum, mean, minimum, and maximum without CPU synchronization.
 *
 * A graph-owned preparation pass canonicalizes source validity and materializes calibrated
 * values. Existing hierarchical reductions compute count, sum, and extent; the final one-thread
 * pass computes the mean from the caller-owned GPU outputs.
 */
export class GPURasterStatistics implements GPUCommandGraphContributor {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly input: GPURasterBufferBand<'float32'>;
  readonly count: GraphDataView<'uint32'>;
  readonly sum: GraphDataView<'float32'>;
  readonly mean: GraphDataView<'float32'>;
  readonly extent: GraphDataView<'float32'>;

  constructor(props: GPURasterStatisticsProps) {
    this.id = props.id ?? 'gpu-raster-statistics';
    this.width = props.width;
    this.height = props.height;
    this.input = props.input;
    this.count = props.count;
    this.sum = props.sum;
    this.mean = props.mean;
    this.extent = props.extent;

    if (
      !Number.isSafeInteger(this.width) ||
      this.width <= 0 ||
      !Number.isSafeInteger(this.height) ||
      this.height <= 0
    ) {
      throw new Error(`${this.id} dimensions must be positive integers`);
    }
    const pixelCount = this.width * this.height;
    if (!Number.isSafeInteger(pixelCount) || pixelCount > MAXIMUM_RASTER_PIXEL_COUNT) {
      throw new Error(`${this.id} pixel count must fit in uint32`);
    }
    if (this.input.storage.kind !== 'buffer' || this.input.format !== 'float32') {
      throw new Error(`${this.id} requires a float32 buffer-backed raster band`);
    }

    const owner = validateRasterBand(this.input, this, `${this.id} input`);
    validateRasterScalarView(this.count, 'uint32', 1, `${this.id} count`);
    validateRasterScalarView(this.sum, 'float32', 1, `${this.id} sum`);
    validateRasterScalarView(this.mean, 'float32', 1, `${this.id} mean`);
    validateRasterScalarView(this.extent, 'float32', 2, `${this.id} extent`);
    const outputs = [this.count, this.sum, this.mean, this.extent];
    if (outputs.some(output => output.buffer.graph !== owner)) {
      throw new Error(`${this.id} resources must belong to the same graph`);
    }
    const sourceBuffers = [
      this.input.storage.values.buffer,
      ...(this.input.validity ? [this.input.validity.buffer] : [])
    ];
    if (
      outputs.some((output, index) =>
        [...sourceBuffers, ...outputs.slice(index + 1).map(other => other.buffer)].includes(
          output.buffer
        )
      )
    ) {
      throw new Error(`${this.id} inputs and outputs must use separate buffers`);
    }
    getRasterFloatLiteral(this.input.scale ?? 1);
    getRasterFloatLiteral(this.input.offset ?? 0);
  }

  /** Adds validity preparation, hierarchical scalar reductions, and GPU mean finalization. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const inputViews = [
      this.input.storage.values,
      ...(this.input.validity ? [this.input.validity] : [])
    ];
    const outputs = [this.count, this.sum, this.mean, this.extent];
    for (const view of [...inputViews, ...outputs]) {
      if (view.buffer.graph !== graph) {
        throw new Error(`${this.id} resources must belong to the target graph`);
      }
      assertRasterStorageBindingFits(graph.device, view, `${this.id} ${view.buffer.id}`);
    }
    // Hierarchical reductions use 256-thread workgroups even though preparation uses 8x8.
    const limits = getRasterDeviceLimits(graph.device);
    const pixelCount = this.width * this.height;
    if (pixelCount > limits.maxDispatchElementCount) {
      throw new Error(`${this.id} input exceeds one bounded scalar-analysis dispatch`);
    }
    const [horizontalCount, verticalCount] = getRasterDispatchSize(
      graph.device,
      this.width,
      this.height,
      this.id
    );
    const calibratedValues = createTransientView(
      graph,
      `${this.id}-calibrated-values`,
      'float32',
      pixelCount
    );
    const resolvedValidity = createTransientView(
      graph,
      `${this.id}-resolved-validity`,
      'uint32',
      pixelCount
    );
    assertRasterStorageBindingFits(graph.device, calibratedValues, `${this.id} calibrated values`);
    assertRasterStorageBindingFits(graph.device, resolvedValidity, `${this.id} resolved validity`);

    this.addPreparationPass(graph, calibratedValues, resolvedValidity, [
      horizontalCount,
      verticalCount
    ]);
    new GPUReduction({
      id: `${this.id}-count`,
      input: resolvedValidity,
      output: this.count,
      operation: 'sum'
    }).addToGraph(graph);
    new GPUReduction({
      id: `${this.id}-sum`,
      input: calibratedValues,
      mask: resolvedValidity,
      output: this.sum,
      operation: 'sum'
    }).addToGraph(graph);
    new GPUReduction({
      id: `${this.id}-extent`,
      input: calibratedValues,
      mask: resolvedValidity,
      output: this.extent,
      operation: 'extent'
    }).addToGraph(graph);
    this.addMeanPass(graph);
  }

  private addPreparationPass<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    calibratedValues: GraphDataView<'float32'>,
    resolvedValidity: GraphDataView<'uint32'>,
    dispatchSize: readonly [number, number]
  ): void {
    const resources: GraphResourceUse[] = [
      {buffer: this.input.storage.values, usage: 'storage-read'},
      {buffer: calibratedValues, usage: 'storage-write'},
      {buffer: resolvedValidity, usage: 'storage-write'}
    ];
    if (this.input.validity) resources.push({buffer: this.input.validity, usage: 'storage-read'});

    graph.addComputePass({
      id: `${this.id}-prepare`,
      resources,
      compile: ({device}) => {
        const bindings: BindingDeclaration[] = [
          {name: 'sourceValues', type: 'read-only-storage', group: 0, location: 0},
          {name: 'calibratedValues', type: 'storage', group: 0, location: 1},
          {name: 'resolvedValidity', type: 'storage', group: 0, location: 2}
        ];
        if (this.input.validity) {
          bindings.push({name: 'sourceValidity', type: 'read-only-storage', group: 0, location: 3});
        }
        const computation = new Computation(device, {
          id: `${this.id}-prepare`,
          source: this.getPreparationShader(calibratedValues, resolvedValidity),
          shaderLayout: {bindings}
        });
        return {
          encode: ({computePass, getBuffer}) => {
            const resolvedBindings: Record<string, Binding> = {
              sourceValues: getViewBinding(this.input.storage.values, getBuffer),
              calibratedValues: getViewBinding(calibratedValues, getBuffer),
              resolvedValidity: getViewBinding(resolvedValidity, getBuffer)
            };
            if (this.input.validity) {
              resolvedBindings['sourceValidity'] = getViewBinding(this.input.validity, getBuffer);
            }
            computation.setBindings(resolvedBindings);
            computation.dispatch(computePass, dispatchSize[0], dispatchSize[1]);
          },
          destroy: () => computation.destroy()
        };
      }
    });
  }

  private getPreparationShader(
    calibratedValues: GraphDataView<'float32'>,
    resolvedValidity: GraphDataView<'uint32'>
  ): string {
    const sourceValidity = this.input.validity;
    const validityDeclaration = sourceValidity
      ? `@group(0) @binding(3) var<storage, read> sourceValidity: array<u32>;\nconst SOURCE_VALIDITY_OFFSET: u32 = ${getViewElementOffset(sourceValidity)}u;`
      : '';
    const conditions = ['isFiniteValue(rawSample)', 'isFiniteValue(calibratedSample)'];
    if (sourceValidity) {
      conditions.push('sourceValidity[SOURCE_VALIDITY_OFFSET + pixelIndex] != 0u');
    }
    if (this.input.noDataValue !== undefined && !Number.isNaN(this.input.noDataValue)) {
      conditions.push(`rawSample != ${getRasterFloatLiteral(this.input.noDataValue)}`);
    }

    return /* wgsl */ `
const WIDTH: u32 = ${this.width}u;
const HEIGHT: u32 = ${this.height}u;
const SOURCE_OFFSET: u32 = ${getViewElementOffset(this.input.storage.values)}u;
const CALIBRATED_OFFSET: u32 = ${getViewElementOffset(calibratedValues)}u;
const VALIDITY_OFFSET: u32 = ${getViewElementOffset(resolvedValidity)}u;
@group(0) @binding(0) var<storage, read> sourceValues: array<f32>;
@group(0) @binding(1) var<storage, read_write> calibratedValues: array<f32>;
@group(0) @binding(2) var<storage, read_write> resolvedValidity: array<u32>;
${validityDeclaration}

fn isFiniteValue(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

@compute @workgroup_size(${RASTER_WORKGROUP_DIMENSION}, ${RASTER_WORKGROUP_DIMENSION})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x >= WIDTH || globalId.y >= HEIGHT) { return; }
  let pixelIndex = globalId.y * WIDTH + globalId.x;
  let rawSample = sourceValues[SOURCE_OFFSET + pixelIndex];
  let calibratedSample = rawSample * ${getRasterFloatLiteral(this.input.scale ?? 1)} + ${getRasterFloatLiteral(this.input.offset ?? 0)};
  let validSample = ${conditions.join(' && ')};
  calibratedValues[CALIBRATED_OFFSET + pixelIndex] = select(0.0, calibratedSample, validSample);
  resolvedValidity[VALIDITY_OFFSET + pixelIndex] = select(0u, 1u, validSample);
}`;
  }

  private addMeanPass<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    graph.addComputePass({
      id: `${this.id}-mean`,
      resources: [
        {buffer: this.count, usage: 'storage-read'},
        {buffer: this.sum, usage: 'storage-read'},
        {buffer: this.mean, usage: 'storage-write'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: `${this.id}-mean`,
          source: /* wgsl */ `
@group(0) @binding(0) var<storage, read> countValues: array<u32>;
@group(0) @binding(1) var<storage, read> sumValues: array<f32>;
@group(0) @binding(2) var<storage, read_write> meanValues: array<f32>;

@compute @workgroup_size(1)
fn main() {
  let count = countValues[${getViewElementOffset(this.count)}u];
  let sum = sumValues[${getViewElementOffset(this.sum)}u];
  meanValues[${getViewElementOffset(this.mean)}u] = select(0.0, sum / f32(max(count, 1u)), count > 0u);
}`,
          shaderLayout: {
            bindings: [
              {name: 'countValues', type: 'read-only-storage', group: 0, location: 0},
              {name: 'sumValues', type: 'read-only-storage', group: 0, location: 1},
              {name: 'meanValues', type: 'storage', group: 0, location: 2}
            ]
          }
        });
        return {
          encode: ({computePass, getBuffer}) => {
            computation.setBindings({
              countValues: getViewBinding(this.count, getBuffer),
              sumValues: getViewBinding(this.sum, getBuffer),
              meanValues: getViewBinding(this.mean, getBuffer)
            });
            computation.dispatch(computePass, 1);
          },
          destroy: () => computation.destroy()
        };
      }
    });
  }
}
