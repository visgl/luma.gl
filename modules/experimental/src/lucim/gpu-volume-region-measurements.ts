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
import {
  getViewBinding,
  getViewElementOffset,
  validatePackedView
} from '../gpu-primitives/graph-data-view-utils';
import {
  assertVolumeStorageBindingFits,
  getVolumeDispatchSize,
  validateVolumeDimensions,
  validateVolumeScalarView,
  validateVolumeValidityView,
  VOLUME_WORKGROUP_DIMENSION
} from './volume-utils';

/** Caller-owned per-label counts and x/y/z index-space bounds. */
export type GPUVolumeRegionMeasurementOutputs = {
  /** Number of valid voxels for labels one through output capacity. */
  voxelCounts: GraphDataView<'uint32'>;
  /** Inclusive minimum x/y/z coordinates, or zero for an empty output slot. */
  minimumCoordinates: GraphDataView<'uint32x3'>;
  /** Exclusive maximum x/y/z coordinates, or zero for an empty output slot. */
  maximumCoordinates: GraphDataView<'uint32x3'>;
};

/** Sparse or dense labels and fixed-capacity caller-owned measurement destinations. */
export type GPUVolumeRegionMeasurementsProps = {
  id?: string;
  width: number;
  height: number;
  depth: number;
  /** Zero is background; positive labels address one-based output slots. */
  labels: GraphDataView<'uint32'>;
  /** Optional observation validity. Zero-valued entries do not participate. */
  labelValidity?: GraphDataView<'uint32'>;
  output: GPUVolumeRegionMeasurementOutputs;
  /** One caller-owned uint32 set when a positive label exceeds output capacity. */
  overflow: GraphDataView<'uint32'>;
};

type MeasurementBinding = {
  name: string;
  view: GraphDataView;
  usage: Extract<GraphBufferUsage, 'storage-read' | 'storage-write' | 'storage-read-write'>;
};

const LINEAR_WORKGROUP_SIZE = 256;

/**
 * Measures per-label voxel population and axis-aligned index-space bounds entirely on the GPU.
 *
 * Labels may be dense or sparse. Capacity overflow is explicit, empty output slots are zeroed,
 * and connected-component results can be consumed directly without readback.
 */
export class GPUVolumeRegionMeasurements implements GPUCommandGraphContributor {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly depth: number;
  readonly labels: GraphDataView<'uint32'>;
  readonly labelValidity?: GraphDataView<'uint32'>;
  readonly output: GPUVolumeRegionMeasurementOutputs;
  readonly overflow: GraphDataView<'uint32'>;
  readonly capacity: number;

  constructor(props: GPUVolumeRegionMeasurementsProps) {
    this.id = props.id ?? 'gpu-volume-region-measurements';
    this.width = props.width;
    this.height = props.height;
    this.depth = props.depth;
    this.labels = props.labels;
    this.labelValidity = props.labelValidity;
    this.output = props.output;
    this.overflow = props.overflow;
    this.capacity = this.output.voxelCounts.length;

    const voxelCount = validateVolumeDimensions(this, this.id);
    validateVolumeScalarView(this.labels, 'uint32', voxelCount, `${this.id} labels`);
    if (this.labelValidity) {
      validateVolumeValidityView(this.labelValidity, voxelCount, `${this.id} label validity`);
    }
    if (!Number.isSafeInteger(this.capacity) || this.capacity <= 0) {
      throw new Error(`${this.id} output capacity must be a positive safe integer`);
    }
    validateVolumeScalarView(
      this.output.voxelCounts,
      'uint32',
      this.capacity,
      `${this.id} voxel counts`
    );
    validateCoordinateView(
      this.output.minimumCoordinates,
      this.capacity,
      `${this.id} minimum coordinates`
    );
    validateCoordinateView(
      this.output.maximumCoordinates,
      this.capacity,
      `${this.id} maximum coordinates`
    );
    validateVolumeValidityView(this.overflow, 1, `${this.id} overflow`);

    const views = this.getViews();
    const owner = this.labels.buffer.graph;
    for (const [index, view] of views.entries()) {
      if (view.buffer.graph !== owner) {
        throw new Error(`${this.id} inputs and outputs must belong to the same graph`);
      }
      if (views.slice(index + 1).some(other => other.buffer === view.buffer)) {
        throw new Error(`${this.id} inputs and outputs must use separate buffers`);
      }
    }
  }

  /** Adds initialization, atomic accumulation, and empty-slot canonicalization passes. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    if (graph.device.type !== 'webgpu') {
      throw new Error(`${this.id} region measurements require a WebGPU device`);
    }
    for (const view of this.getViews()) {
      if (view.buffer.graph !== graph) {
        throw new Error(`${this.id} resources must belong to the target graph`);
      }
      assertVolumeStorageBindingFits(graph.device, view, `${this.id} ${view.buffer.id}`);
    }
    if (
      graph.device.limits.maxComputeInvocationsPerWorkgroup < LINEAR_WORKGROUP_SIZE ||
      graph.device.limits.maxComputeWorkgroupSizeX < LINEAR_WORKGROUP_SIZE
    ) {
      throw new Error(`${this.id} exceeds device workgroup limits`);
    }
    const regionDispatch = Math.ceil(this.capacity / LINEAR_WORKGROUP_SIZE);
    if (regionDispatch > graph.device.limits.maxComputeWorkgroupsPerDimension) {
      throw new Error(`${this.id} exceeds device dispatch limits`);
    }
    const volumeDispatch = getVolumeDispatchSize(
      graph.device,
      this.width,
      this.height,
      this.depth,
      this.id
    );

    this.addInitializationPass(graph, regionDispatch);
    this.addAccumulationPass(graph, volumeDispatch);
    this.addFinalizationPass(graph, regionDispatch);
  }

  private addInitializationPass<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    dispatch: number
  ): void {
    addMeasurementPass(
      graph,
      `${this.id}-initialize`,
      [
        {name: 'voxelCounts', view: this.output.voxelCounts, usage: 'storage-write'},
        {
          name: 'minimumCoordinates',
          view: this.output.minimumCoordinates,
          usage: 'storage-write'
        },
        {
          name: 'maximumCoordinates',
          view: this.output.maximumCoordinates,
          usage: 'storage-write'
        },
        {name: 'overflowValues', view: this.overflow, usage: 'storage-write'}
      ],
      locations => /* wgsl */ `
const CAPACITY: u32 = ${this.capacity}u;
const COUNT_OFFSET: u32 = ${getViewElementOffset(this.output.voxelCounts)}u;
const MINIMUM_OFFSET: u32 = ${getViewElementOffset(this.output.minimumCoordinates)}u;
const MAXIMUM_OFFSET: u32 = ${getViewElementOffset(this.output.maximumCoordinates)}u;
const OVERFLOW_OFFSET: u32 = ${getViewElementOffset(this.overflow)}u;
@group(0) @binding(${locations.get('voxelCounts')}) var<storage, read_write> voxelCounts: array<atomic<u32>>;
@group(0) @binding(${locations.get('minimumCoordinates')}) var<storage, read_write> minimumCoordinates: array<atomic<u32>>;
@group(0) @binding(${locations.get('maximumCoordinates')}) var<storage, read_write> maximumCoordinates: array<atomic<u32>>;
@group(0) @binding(${locations.get('overflowValues')}) var<storage, read_write> overflowValues: array<atomic<u32>>;

@compute @workgroup_size(${LINEAR_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let regionIndex = globalId.x;
  if (regionIndex >= CAPACITY) { return; }
  atomicStore(&voxelCounts[COUNT_OFFSET + regionIndex], 0u);
  let coordinateIndex = regionIndex * 3u;
  atomicStore(&minimumCoordinates[MINIMUM_OFFSET + coordinateIndex], 0xffffffffu);
  atomicStore(&minimumCoordinates[MINIMUM_OFFSET + coordinateIndex + 1u], 0xffffffffu);
  atomicStore(&minimumCoordinates[MINIMUM_OFFSET + coordinateIndex + 2u], 0xffffffffu);
  atomicStore(&maximumCoordinates[MAXIMUM_OFFSET + coordinateIndex], 0u);
  atomicStore(&maximumCoordinates[MAXIMUM_OFFSET + coordinateIndex + 1u], 0u);
  atomicStore(&maximumCoordinates[MAXIMUM_OFFSET + coordinateIndex + 2u], 0u);
  if (regionIndex == 0u) {
    atomicStore(&overflowValues[OVERFLOW_OFFSET], 0u);
  }
}`,
      [dispatch, 1, 1]
    );
  }

  private addAccumulationPass<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    dispatch: readonly [number, number, number]
  ): void {
    const bindings: MeasurementBinding[] = [
      {name: 'labelValues', view: this.labels, usage: 'storage-read'},
      {name: 'voxelCounts', view: this.output.voxelCounts, usage: 'storage-read-write'},
      {
        name: 'minimumCoordinates',
        view: this.output.minimumCoordinates,
        usage: 'storage-read-write'
      },
      {
        name: 'maximumCoordinates',
        view: this.output.maximumCoordinates,
        usage: 'storage-read-write'
      },
      {name: 'overflowValues', view: this.overflow, usage: 'storage-read-write'}
    ];
    if (this.labelValidity) {
      bindings.push({name: 'labelValidity', view: this.labelValidity, usage: 'storage-read'});
    }
    addMeasurementPass(
      graph,
      `${this.id}-accumulate`,
      bindings,
      locations => {
        const validityDeclaration = this.labelValidity
          ? `@group(0) @binding(${locations.get('labelValidity')}) var<storage, read> labelValidity: array<u32>;\nconst VALIDITY_OFFSET: u32 = ${getViewElementOffset(this.labelValidity)}u;`
          : '';
        const validityCondition = this.labelValidity
          ? 'labelValidity[VALIDITY_OFFSET + voxelIndex] != 0u'
          : 'true';
        return /* wgsl */ `
const WIDTH: u32 = ${this.width}u;
const HEIGHT: u32 = ${this.height}u;
const DEPTH: u32 = ${this.depth}u;
const CAPACITY: u32 = ${this.capacity}u;
const LABEL_OFFSET: u32 = ${getViewElementOffset(this.labels)}u;
const COUNT_OFFSET: u32 = ${getViewElementOffset(this.output.voxelCounts)}u;
const MINIMUM_OFFSET: u32 = ${getViewElementOffset(this.output.minimumCoordinates)}u;
const MAXIMUM_OFFSET: u32 = ${getViewElementOffset(this.output.maximumCoordinates)}u;
const OVERFLOW_OFFSET: u32 = ${getViewElementOffset(this.overflow)}u;
@group(0) @binding(${locations.get('labelValues')}) var<storage, read> labelValues: array<u32>;
@group(0) @binding(${locations.get('voxelCounts')}) var<storage, read_write> voxelCounts: array<atomic<u32>>;
@group(0) @binding(${locations.get('minimumCoordinates')}) var<storage, read_write> minimumCoordinates: array<atomic<u32>>;
@group(0) @binding(${locations.get('maximumCoordinates')}) var<storage, read_write> maximumCoordinates: array<atomic<u32>>;
@group(0) @binding(${locations.get('overflowValues')}) var<storage, read_write> overflowValues: array<atomic<u32>>;
${validityDeclaration}

@compute @workgroup_size(${VOLUME_WORKGROUP_DIMENSION}, ${VOLUME_WORKGROUP_DIMENSION}, ${VOLUME_WORKGROUP_DIMENSION})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x >= WIDTH || globalId.y >= HEIGHT || globalId.z >= DEPTH) { return; }
  let voxelIndex = (globalId.z * HEIGHT + globalId.y) * WIDTH + globalId.x;
  if (!(${validityCondition})) { return; }
  let label = labelValues[LABEL_OFFSET + voxelIndex];
  if (label == 0u) { return; }
  let regionIndex = label - 1u;
  if (regionIndex >= CAPACITY) {
    atomicOr(&overflowValues[OVERFLOW_OFFSET], 1u);
    return;
  }
  atomicAdd(&voxelCounts[COUNT_OFFSET + regionIndex], 1u);
  let coordinateIndex = regionIndex * 3u;
  atomicMin(&minimumCoordinates[MINIMUM_OFFSET + coordinateIndex], globalId.x);
  atomicMin(&minimumCoordinates[MINIMUM_OFFSET + coordinateIndex + 1u], globalId.y);
  atomicMin(&minimumCoordinates[MINIMUM_OFFSET + coordinateIndex + 2u], globalId.z);
  atomicMax(&maximumCoordinates[MAXIMUM_OFFSET + coordinateIndex], globalId.x + 1u);
  atomicMax(&maximumCoordinates[MAXIMUM_OFFSET + coordinateIndex + 1u], globalId.y + 1u);
  atomicMax(&maximumCoordinates[MAXIMUM_OFFSET + coordinateIndex + 2u], globalId.z + 1u);
}`;
      },
      dispatch
    );
  }

  private addFinalizationPass<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    dispatch: number
  ): void {
    addMeasurementPass(
      graph,
      `${this.id}-finalize`,
      [
        {name: 'voxelCounts', view: this.output.voxelCounts, usage: 'storage-read'},
        {
          name: 'minimumCoordinates',
          view: this.output.minimumCoordinates,
          usage: 'storage-read-write'
        },
        {
          name: 'maximumCoordinates',
          view: this.output.maximumCoordinates,
          usage: 'storage-read-write'
        }
      ],
      locations => /* wgsl */ `
const CAPACITY: u32 = ${this.capacity}u;
const COUNT_OFFSET: u32 = ${getViewElementOffset(this.output.voxelCounts)}u;
const MINIMUM_OFFSET: u32 = ${getViewElementOffset(this.output.minimumCoordinates)}u;
const MAXIMUM_OFFSET: u32 = ${getViewElementOffset(this.output.maximumCoordinates)}u;
@group(0) @binding(${locations.get('voxelCounts')}) var<storage, read> voxelCounts: array<u32>;
@group(0) @binding(${locations.get('minimumCoordinates')}) var<storage, read_write> minimumCoordinates: array<atomic<u32>>;
@group(0) @binding(${locations.get('maximumCoordinates')}) var<storage, read_write> maximumCoordinates: array<atomic<u32>>;

@compute @workgroup_size(${LINEAR_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let regionIndex = globalId.x;
  if (regionIndex >= CAPACITY || voxelCounts[COUNT_OFFSET + regionIndex] != 0u) { return; }
  let coordinateIndex = regionIndex * 3u;
  atomicStore(&minimumCoordinates[MINIMUM_OFFSET + coordinateIndex], 0u);
  atomicStore(&minimumCoordinates[MINIMUM_OFFSET + coordinateIndex + 1u], 0u);
  atomicStore(&minimumCoordinates[MINIMUM_OFFSET + coordinateIndex + 2u], 0u);
  atomicStore(&maximumCoordinates[MAXIMUM_OFFSET + coordinateIndex], 0u);
  atomicStore(&maximumCoordinates[MAXIMUM_OFFSET + coordinateIndex + 1u], 0u);
  atomicStore(&maximumCoordinates[MAXIMUM_OFFSET + coordinateIndex + 2u], 0u);
}`,
      [dispatch, 1, 1]
    );
  }

  private getViews(): GraphDataView[] {
    return [
      this.labels,
      ...(this.labelValidity ? [this.labelValidity] : []),
      this.output.voxelCounts,
      this.output.minimumCoordinates,
      this.output.maximumCoordinates,
      this.overflow
    ];
  }
}

function validateCoordinateView(view: GraphDataView, capacity: number, label: string): void {
  validatePackedView(view, ['uint32x3'], label);
  if (view.length !== capacity) {
    throw new Error(`${label} must contain exactly one coordinate per output slot`);
  }
}

function addMeasurementPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  bindings: readonly MeasurementBinding[],
  makeShader: (locations: ReadonlyMap<string, number>) => string,
  dispatch: readonly [number, number, number]
): void {
  if (bindings.length > graph.device.limits.maxStorageBuffersPerShaderStage) {
    throw new Error(`${id} exceeds the device storage binding count`);
  }
  const resources: GraphResourceUse[] = [];
  const declarations: BindingDeclaration[] = [];
  const locations = new Map<string, number>();
  for (const [index, binding] of bindings.entries()) {
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
          computation.dispatch(computePass, dispatch[0], dispatch[1], dispatch[2]);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}
