// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import {GPUVector} from '@luma.gl/tables';
import {ArrowStoragePathModel, type ArrowStoragePathModelProps} from './arrow-storage-path-model';

/** Props for storage-backed Trips-style path rendering. */
export type ArrowStorageTripsPathModelProps = ArrowStoragePathModelProps & {
  /** Prepared per-path Float32 temporal stream aligned with path vertices. */
  timestamps: GPUVector;
  /** Current animation time in the same unit as prepared timestamps. */
  currentTime: number;
  /** Visible trail length in the same unit as prepared timestamps. */
  trailLength: number;
  /** Whether older trail segments fade before they are discarded. Defaults to `true`. */
  fadeTrail?: boolean;
};

const DEFAULT_ARROW_STORAGE_TRIPS_PATH_SOURCE = /* wgsl */ `
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
export class ArrowStorageTripsPathModel extends ArrowStoragePathModel {
  private tripProps: ArrowStorageTripsPathModelProps;
  private tripConfigBuffer: DynamicBuffer;

  /** Creates a WebGPU storage-backed Trips-style path model. */
  constructor(device: Device, props: ArrowStorageTripsPathModelProps) {
    const tripConfigBuffer = createTripPathConfigBuffer(device, props);
    super(device, {
      ...props,
      source: props.source ?? DEFAULT_ARROW_STORAGE_TRIPS_PATH_SOURCE,
      bindings: {
        ...(props.bindings || {}),
        tripPathConfig: tripConfigBuffer
      }
    });
    this.tripProps = props;
    this.tripConfigBuffer = tripConfigBuffer;
  }

  /** Updates current-time and trail props while retaining storage path resources. */
  override setProps(props: Partial<ArrowStorageTripsPathModelProps>): void {
    const nextProps = {...this.tripProps, ...props} as ArrowStorageTripsPathModelProps;
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
    } as Partial<ArrowStoragePathModelProps>);
  }

  /** Releases Trips config storage plus inherited storage path resources. */
  override destroy(): void {
    this.tripConfigBuffer.destroy();
    super.destroy();
  }
}

function createTripPathConfigBuffer(
  device: Device,
  props: Pick<ArrowStorageTripsPathModelProps, 'id' | 'currentTime' | 'trailLength' | 'fadeTrail'>
): DynamicBuffer {
  return new DynamicBuffer(device, {
    id: `${props.id || 'arrow-storage-trips-path-model'}-trip-config`,
    usage: Buffer.UNIFORM | Buffer.COPY_DST | Buffer.COPY_SRC,
    data: makeTripPathConfigData(props)
  });
}

function makeTripPathConfigData(
  props: Pick<ArrowStorageTripsPathModelProps, 'currentTime' | 'trailLength' | 'fadeTrail'>
): Uint32Array {
  const arrayBuffer = new ArrayBuffer(16);
  const floatValues = new Float32Array(arrayBuffer);
  const uintValues = new Uint32Array(arrayBuffer);
  floatValues[0] = props.currentTime;
  floatValues[1] = props.trailLength;
  uintValues[2] = props.fadeTrail === false ? 0 : 1;
  return uintValues;
}
