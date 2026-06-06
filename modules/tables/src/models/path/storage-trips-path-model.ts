// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import type {GPUVector} from '../../table/gpu-vector';
import type {VertexList} from '../../table/gpu-vector-format';
import {
  StoragePathModel,
  type StoragePathInputProps,
  type StoragePathModelProps
} from './storage-path-model';
import {assertModelGPUVectorInputs} from '../../engine/gpu-table-model-input-schema';
import type {ModelGPUInputSchema} from '../../engine/gpu-table-model-input-schema';

/** Props for storage-backed Trips-style path rendering. */
export type StorageTripsPathModelProps = StoragePathModelProps & {
  /** Prepared per-path Float32 temporal stream aligned with path vertices. */
  timestamps: GPUVector<VertexList<'float32'>>;
  /** Current animation time in the same unit as prepared timestamps. */
  currentTime: number;
  /** Visible trail length in the same unit as prepared timestamps. */
  trailLength: number;
  /** Whether older trail segments fade before they are discarded. Defaults to `true`. */
  fadeTrail?: boolean;
};

/** Prepared GPU inputs consumed by the storage-backed trips path model. */
export const ARROW_STORAGE_TRIPS_PATH_GPU_INPUT_SCHEMA = [
  {
    name: 'paths',
    kind: 'positions',
    required: true,
    formats: ['vertex-list<float32x2>', 'vertex-list<float32x3>', 'vertex-list<float32x4>'],
    source: 'source-mappable'
  },
  {
    name: 'colors',
    kind: 'colors',
    required: false,
    formats: ['unorm8x4', 'vertex-list<unorm8x4>'],
    source: 'source-mappable'
  },
  {
    name: 'widths',
    kind: 'scalars',
    required: false,
    formats: ['float32'],
    source: 'source-mappable'
  },
  {
    name: 'timestamps',
    kind: 'time',
    required: true,
    formats: ['vertex-list<float32>'],
    source: 'source-mappable'
  },
  {
    name: 'viewOrigins',
    kind: 'positions',
    required: false,
    formats: ['float32x4'],
    source: 'generated'
  }
] as const satisfies ModelGPUInputSchema;

const DEFAULT_STORAGE_TRIPS_PATH_SOURCE = /* wgsl */ `
  @group(0) @binding(auto) var<storage, read> pathValues : array<f32>;
  @group(0) @binding(auto) var<storage, read> pathRanges : array<vec4<u32>>;
  @group(0) @binding(auto) var<storage, read> pathViewOrigins : array<vec4<f32>>;
  @group(0) @binding(auto) var<storage, read> pathRowColors : array<u32>;
  @group(0) @binding(auto) var<storage, read> pathVertexColors : array<u32>;
  @group(0) @binding(auto) var<storage, read> pathRowWidths : array<f32>;
  @group(0) @binding(auto) var<storage, read> pathTimestamps : array<f32>;

struct PathStorageStyleConfig {
  constantColor : vec4<f32>,
  constantWidth : f32,
  useRowColors : u32,
  useRowWidths : u32,
  batchRowIndexBase : u32,
  pathComponentCount : u32,
  useViewOrigins : u32,
  useVertexColors : u32,
  _padding1 : u32,
};

struct TripPathConfig {
  currentTime : f32,
  trailLength : f32,
  fadeTrail : u32,
  _padding0 : u32,
};

@group(0) @binding(auto) var<uniform> pathStorageStyleConfig : PathStorageStyleConfig;
@group(0) @binding(auto) var<uniform> tripPathConfig : TripPathConfig;

struct VertexInputs {
  @builtin(vertex_index) vertexIndex : u32,
  @location(0) segmentStartPointIndices : u32,
  @location(1) segmentFlags : u32,
  @location(2) rowIndices : u32,
};

struct FragmentInputs {
  @builtin(position) position : vec4<f32>,
  @location(0) color : vec4<f32>,
  @location(1) time : f32,
};

fn unpackPathColor(colorWord: u32) -> vec4<f32> {
  return vec4<f32>(
    f32(colorWord & 0xffu),
    f32((colorWord >> 8u) & 0xffu),
    f32((colorWord >> 16u) & 0xffu),
    f32((colorWord >> 24u) & 0xffu)
  ) / 255.0;
}

fn readPathComponent(pointIndex: u32, componentIndex: u32) -> f32 {
  if (componentIndex >= pathStorageStyleConfig.pathComponentCount) {
    return 0.0;
  }
  return pathValues[pointIndex * pathStorageStyleConfig.pathComponentCount + componentIndex];
}

fn readPathPoint(pointIndex: u32) -> vec4<f32> {
  return vec4<f32>(
    readPathComponent(pointIndex, 0u),
    readPathComponent(pointIndex, 1u),
    readPathComponent(pointIndex, 2u),
    readPathComponent(pointIndex, 3u)
  );
}

fn readPathRange(globalRowIndex: u32) -> vec4<u32> {
  return pathRanges[globalRowIndex - pathStorageStyleConfig.batchRowIndexBase];
}

fn readPathViewOrigin(rowIndex: u32) -> vec4<f32> {
  if (pathStorageStyleConfig.useViewOrigins == 0u) {
    return vec4<f32>(0.0);
  }
  return pathViewOrigins[rowIndex];
}

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  let rowIndex = inputs.rowIndices - pathStorageStyleConfig.batchRowIndexBase;
  let pathRange = readPathRange(inputs.rowIndices);
  let segmentEndPointIndex = min(inputs.segmentStartPointIndices + 1u, pathRange.y - 1u);
  let pathWidth = select(
    pathStorageStyleConfig.constantWidth,
    pathRowWidths[rowIndex],
    pathStorageStyleConfig.useRowWidths != 0u
  );
  let useSegmentEnd = (inputs.vertexIndex & 1u) == 1u;
  let pathPosition = select(
    readPathPoint(inputs.segmentStartPointIndices),
    readPathPoint(segmentEndPointIndex),
    useSegmentEnd
  ) + readPathViewOrigin(rowIndex);
  var outputs : FragmentInputs;
  outputs.position = vec4<f32>(
    pathPosition.xyz + vec3<f32>(0.0, 0.0, pathWidth * 0.0),
    1.0
  );
  outputs.color = pathStorageStyleConfig.constantColor;
  if (pathStorageStyleConfig.useVertexColors != 0u) {
    outputs.color = select(
      unpackPathColor(pathVertexColors[inputs.segmentStartPointIndices]),
      unpackPathColor(pathVertexColors[segmentEndPointIndex]),
      useSegmentEnd
    );
  } else if (pathStorageStyleConfig.useRowColors != 0u) {
    outputs.color = unpackPathColor(pathRowColors[rowIndex]);
  }
  outputs.time = select(
    pathTimestamps[inputs.segmentStartPointIndices],
    pathTimestamps[segmentEndPointIndex],
    useSegmentEnd
  );
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  if (
    inputs.time > tripPathConfig.currentTime ||
    (tripPathConfig.fadeTrail != 0u &&
      inputs.time < tripPathConfig.currentTime - tripPathConfig.trailLength)
  ) {
    discard;
  }
  var color = inputs.color;
  if (tripPathConfig.fadeTrail != 0u) {
    color.a *= 1.0 - (tripPathConfig.currentTime - inputs.time) / tripPathConfig.trailLength;
  }
  return color;
}
`;

/** WebGPU storage-backed path model with TripsLayer-style temporal filtering. */
export class StorageTripsPathModel extends StoragePathModel {
  /** Prepared GPU vectors consumed by the storage-backed trips path model. */
  static override readonly gpuInputSchema: ModelGPUInputSchema =
    ARROW_STORAGE_TRIPS_PATH_GPU_INPUT_SCHEMA;

  private tripProps: StorageTripsPathModelProps;
  private tripConfigBuffer: DynamicBuffer;

  /** Creates a WebGPU storage-backed Trips-style path model. */
  constructor(device: Device, props: StorageTripsPathModelProps) {
    if (hasStorageTripsPathInputProps(props)) {
      assertModelGPUVectorInputs('StorageTripsPathModel', StorageTripsPathModel.gpuInputSchema, {
        paths: props.paths,
        colors: props.colors,
        widths: props.widths,
        timestamps: props.timestamps,
        viewOrigins: props.viewOrigins
      });
    }
    const tripConfigBuffer = createTripPathConfigBuffer(device, props);
    super(device, {
      ...props,
      source: props.source ?? DEFAULT_STORAGE_TRIPS_PATH_SOURCE,
      bindings: {
        ...(props.bindings || {}),
        tripPathConfig: tripConfigBuffer
      }
    });
    this.tripProps = props;
    this.tripConfigBuffer = tripConfigBuffer;
  }

  /** Updates current-time and trail props while retaining storage path resources. */
  override setProps(props: Partial<StorageTripsPathModelProps>): void {
    const nextProps = {...this.tripProps, ...props} as StorageTripsPathModelProps;
    if (
      props.currentTime !== undefined ||
      props.trailLength !== undefined ||
      props.fadeTrail !== undefined
    ) {
      this.tripConfigBuffer.write(makeTripPathConfigData(nextProps));
    }
    this.tripProps = nextProps;
    super.setProps({
      ...props,
      bindings: {
        ...(props.bindings || this.tripProps.bindings || {}),
        tripPathConfig: this.tripConfigBuffer
      }
    } as Partial<StoragePathModelProps>);
  }

  /** Releases Trips config storage plus inherited storage path resources. */
  override destroy(): void {
    this.tripConfigBuffer.destroy();
    super.destroy();
  }
}

function hasStorageTripsPathInputProps(
  props: StorageTripsPathModelProps
): props is StoragePathInputProps & StorageTripsPathModelProps {
  return 'paths' in props;
}

function createTripPathConfigBuffer(
  device: Device,
  props: Pick<StorageTripsPathModelProps, 'id' | 'currentTime' | 'trailLength' | 'fadeTrail'>
): DynamicBuffer {
  return new DynamicBuffer(device, {
    id: `${props.id || 'storage-trips-path-model'}-trip-config`,
    usage: Buffer.UNIFORM | Buffer.COPY_DST | Buffer.COPY_SRC,
    data: makeTripPathConfigData(props)
  });
}

function makeTripPathConfigData(
  props: Pick<StorageTripsPathModelProps, 'currentTime' | 'trailLength' | 'fadeTrail'>
): Uint32Array {
  const arrayBuffer = new ArrayBuffer(16);
  const floatValues = new Float32Array(arrayBuffer);
  const uintValues = new Uint32Array(arrayBuffer);
  floatValues[0] = props.currentTime;
  floatValues[1] = props.trailLength;
  uintValues[2] = props.fadeTrail === false ? 0 : 1;
  return uintValues;
}
