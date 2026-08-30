// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  Buffer,
  type Device,
  type Framebuffer,
  Texture,
  type TextureFormatColor,
  type TextureFormatDepthStencil,
  textureFormatDecoder
} from '@luma.gl/core';
import {Computation, type Geometry, Model} from '@luma.gl/engine';
import {type Light, PBR_TONE_MAP_MODE} from '@luma.gl/shadertools';
import {Matrix4, type NumericArray} from '@math.gl/core';
import {GPUBVH} from '@luma.gl/gpgpu/gpu-core';
import {
  type CompiledGPUCommandGraph,
  GPUCommandGraph,
  type GPUCommandGraphEncodingStats,
  type GraphDataView
} from '@luma.gl/gpgpu/gpu-core';
import {GPUSegmentedBVH, type GPUBVHSegment} from '@luma.gl/gpgpu/gpu-core';
import {GPUSegmentedSort, type GPUSortSegment} from '@luma.gl/gpgpu/gpu-core';
import {GPUSort} from '@luma.gl/gpgpu/gpu-core';
import {GPUTextureHistory} from '@luma.gl/gpgpu/gpu-core';
import {createTransientView, getViewBinding, getViewElementOffset} from '@luma.gl/gpgpu/gpu-core';
import {
  getRayTracingScenePresentationShader,
  RAY_TRACING_BOUNDS_SHADER,
  RAY_TRACING_HISTORY_CARRY_SHADER,
  RAY_TRACING_SCENE_SHADER
} from './ray-tracing-scene-shaders';
import type {
  RayTracingGraphStageStatistics,
  RayTracingGraphStatistics,
  SceneRenderOptions,
  SceneRenderStatistics,
  SceneSurface
} from './scene-renderer';

const PRIMITIVE_FLOAT_COUNT = 68;
const TRIANGLE_FLOAT_COUNT = 24;
const BLAS_NODE_FLOAT_COUNT = 8;
const LIGHT_FLOAT_COUNT = 16;
const UNIFORM_FLOAT_COUNT = 68;
const DEFAULT_RESOLUTION_SCALE = 0.5;
const DEFAULT_MINIMUM_RESOLUTION_SCALE = 0.25;
const DEFAULT_TARGET_FRAME_TIME_MILLISECONDS = 33.3;
const RESOLUTION_SCALES = [0.25, 0.375, 0.5, 0.75, 1] as const;
const FRAME_BUDGET_COOLDOWN_MILLISECONDS = 750;
const OVER_BUDGET_FRAME_TIME_RATIO = 1.2;
const UNDER_BUDGET_FRAME_TIME_RATIO = 0.65;
const OVER_BUDGET_FRAME_COUNT = 6;
const UNDER_BUDGET_FRAME_COUNT = 45;
const MINIMUM_HISTORY_FRAMES_FOR_SPARSE_SCHEDULING = 8;
const MAXIMUM_HISTORY_SAMPLES = 64;
const INVALID_PRIMITIVE_ID = 0xffffffff;
const MORTON_REBUILD_REFIT_INTERVAL = 32;
const MAXIMUM_SPARSE_PRIMITIVE_UPDATE_RATIO = 0.25;

const RAY_TRACING_SCENE_BOUNDS_INITIALIZE_SHADER = /* wgsl */ `
const INVALID_BOUND = 3.402823466e+38;

@group(0) @binding(0) var<storage, read_write> sceneBounds: array<atomic<u32>>;

fn encodeOrderedFloat(value: f32) -> u32 {
  let bits = bitcast<u32>(value);
  return select(bits ^ 0x80000000u, ~bits, (bits & 0x80000000u) != 0u);
}

@compute @workgroup_size(1)
fn main() {
  for (var axis = 0u; axis < 3u; axis++) {
    atomicStore(&sceneBounds[axis], encodeOrderedFloat(INVALID_BOUND));
    atomicStore(&sceneBounds[axis + 3u], encodeOrderedFloat(-INVALID_BOUND));
  }
}
`;

const RAY_TRACING_SCENE_BOUNDS_REDUCE_SHADER = /* wgsl */ `
const PRIMITIVE_CAPACITY = __PRIMITIVE_CAPACITY__u;

@group(0) @binding(0) var<storage, read> primitiveMinima: array<f32>;
@group(0) @binding(1) var<storage, read> primitiveMaxima: array<f32>;
@group(0) @binding(2) var<storage, read_write> sceneBounds: array<atomic<u32>>;

fn finite(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

fn encodeOrderedFloat(value: f32) -> u32 {
  let bits = bitcast<u32>(value);
  return select(bits ^ 0x80000000u, ~bits, (bits & 0x80000000u) != 0u);
}

@compute @workgroup_size(128)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let primitiveIndex = invocation.x;
  if (primitiveIndex >= PRIMITIVE_CAPACITY) {
    return;
  }

  let componentIndex = primitiveIndex * 3u;
  var minimum = vec3<f32>();
  var maximum = vec3<f32>();
  var valid = true;
  for (var axis = 0u; axis < 3u; axis++) {
    minimum[axis] = primitiveMinima[componentIndex + axis];
    maximum[axis] = primitiveMaxima[componentIndex + axis];
    valid = valid && finite(minimum[axis]) && finite(maximum[axis]) &&
      minimum[axis] <= maximum[axis];
  }
  if (!valid) {
    return;
  }

  for (var axis = 0u; axis < 3u; axis++) {
    atomicMin(&sceneBounds[axis], encodeOrderedFloat(minimum[axis]));
    atomicMax(&sceneBounds[axis + 3u], encodeOrderedFloat(maximum[axis]));
  }
}
`;

const RAY_TRACING_MORTON_KEYS_SHADER = /* wgsl */ `
const PRIMITIVE_CAPACITY = __PRIMITIVE_CAPACITY__u;
const INVALID_PRIMITIVE_ID = 0xffffffffu;

@group(0) @binding(0) var<storage, read> primitiveMinima: array<f32>;
@group(0) @binding(1) var<storage, read> primitiveMaxima: array<f32>;
@group(0) @binding(2) var<storage, read> sceneBounds: array<u32>;
@group(0) @binding(3) var<storage, read_write> mortonKeys: array<u32>;
@group(0) @binding(4) var<storage, read_write> primitiveIds: array<u32>;

fn finite(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

fn decodeOrderedFloat(value: u32) -> f32 {
  let bits = select(value ^ 0x80000000u, ~value, (value & 0x80000000u) == 0u);
  return bitcast<f32>(bits);
}

fn expandMortonBits(value: u32) -> u32 {
  var bits = value & 1023u;
  bits = (bits | (bits << 16u)) & 0x030000ffu;
  bits = (bits | (bits << 8u)) & 0x0300f00fu;
  bits = (bits | (bits << 4u)) & 0x030c30c3u;
  bits = (bits | (bits << 2u)) & 0x09249249u;
  return bits;
}

fn makeMortonKey(position: vec3<f32>) -> u32 {
  let coordinates = clamp(position, vec3<f32>(0.0), vec3<f32>(0.99999994)) * 1024.0;
  let quantized = vec3<u32>(
    u32(coordinates.x),
    u32(coordinates.y),
    u32(coordinates.z)
  );
  return expandMortonBits(quantized.x) * 4u +
    expandMortonBits(quantized.y) * 2u +
    expandMortonBits(quantized.z);
}

@compute @workgroup_size(128)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let primitiveIndex = invocation.x;
  if (primitiveIndex >= PRIMITIVE_CAPACITY) {
    return;
  }

  primitiveIds[primitiveIndex] = primitiveIndex;
  let componentIndex = primitiveIndex * 3u;
  var minimum = vec3<f32>();
  var maximum = vec3<f32>();
  var valid = true;
  for (var axis = 0u; axis < 3u; axis++) {
    minimum[axis] = primitiveMinima[componentIndex + axis];
    maximum[axis] = primitiveMaxima[componentIndex + axis];
    valid = valid && finite(minimum[axis]) && finite(maximum[axis]) &&
      minimum[axis] <= maximum[axis];
  }
  if (!valid) {
    mortonKeys[primitiveIndex] = INVALID_PRIMITIVE_ID;
    return;
  }

  var sceneMinimum = vec3<f32>();
  var sceneMaximum = vec3<f32>();
  for (var axis = 0u; axis < 3u; axis++) {
    sceneMinimum[axis] = decodeOrderedFloat(sceneBounds[axis]);
    sceneMaximum[axis] = decodeOrderedFloat(sceneBounds[axis + 3u]);
  }
  let extent = max(sceneMaximum - sceneMinimum, vec3<f32>(0.000001));
  let center = (minimum + maximum) * 0.5;
  mortonKeys[primitiveIndex] = makeMortonKey((center - sceneMinimum) / extent);
}
`;

const RAY_TRACING_GATHER_SORTED_BOUNDS_SHADER = /* wgsl */ `
const PRIMITIVE_CAPACITY = __PRIMITIVE_CAPACITY__u;
const INVALID_BOUND = 3.402823466e+38;

@group(0) @binding(0) var<storage, read> primitiveMinima: array<f32>;
@group(0) @binding(1) var<storage, read> primitiveMaxima: array<f32>;
@group(0) @binding(2) var<storage, read> sortedPrimitiveIds: array<u32>;
@group(0) @binding(3) var<storage, read_write> sortedMinima: array<f32>;
@group(0) @binding(4) var<storage, read_write> sortedMaxima: array<f32>;

@compute @workgroup_size(128)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let sortedIndex = invocation.x;
  if (sortedIndex >= PRIMITIVE_CAPACITY) {
    return;
  }

  let destinationComponent = sortedIndex * 3u;
  let primitiveIndex = sortedPrimitiveIds[sortedIndex];
  if (primitiveIndex >= PRIMITIVE_CAPACITY) {
    for (var axis = 0u; axis < 3u; axis++) {
      sortedMinima[destinationComponent + axis] = INVALID_BOUND;
      sortedMaxima[destinationComponent + axis] = -INVALID_BOUND;
    }
    return;
  }

  let sourceComponent = primitiveIndex * 3u;
  for (var axis = 0u; axis < 3u; axis++) {
    sortedMinima[destinationComponent + axis] = primitiveMinima[sourceComponent + axis];
    sortedMaxima[destinationComponent + axis] = primitiveMaxima[sourceComponent + axis];
  }
}
`;

const RAY_TRACING_TRIANGLE_BOUNDS_SHADER = /* wgsl */ `
const TRIANGLE_COUNT = __TRIANGLE_COUNT__u;

struct RayTriangle {
  firstPosition: vec4<f32>,
  secondPosition: vec4<f32>,
  thirdPosition: vec4<f32>,
  firstNormal: vec4<f32>,
  secondNormal: vec4<f32>,
  thirdNormal: vec4<f32>,
};

@group(0) @binding(0) var<storage, read> triangles: array<RayTriangle>;
@group(0) @binding(1) var<storage, read_write> triangleMinima: array<f32>;
@group(0) @binding(2) var<storage, read_write> triangleMaxima: array<f32>;

@compute @workgroup_size(128)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let triangleIndex = invocation.x;
  if (triangleIndex >= TRIANGLE_COUNT) {
    return;
  }

  let triangle = triangles[triangleIndex];
  let minimum = min(
    min(triangle.firstPosition.xyz, triangle.secondPosition.xyz),
    triangle.thirdPosition.xyz
  );
  let maximum = max(
    max(triangle.firstPosition.xyz, triangle.secondPosition.xyz),
    triangle.thirdPosition.xyz
  );
  let componentIndex = triangleIndex * 3u;
  for (var axis = 0u; axis < 3u; axis++) {
    triangleMinima[componentIndex + axis] = minimum[axis];
    triangleMaxima[componentIndex + axis] = maximum[axis];
  }
}
`;

const RAY_TRACING_BLAS_SCENE_BOUNDS_REDUCE_SHADER = /* wgsl */ `
const TRIANGLE_COUNT = __TRIANGLE_COUNT__u;
const MINIMA_OFFSET = __MINIMA_OFFSET__u;
const MAXIMA_OFFSET = __MAXIMA_OFFSET__u;

@group(0) @binding(0) var<storage, read> triangleMinima: array<f32>;
@group(0) @binding(1) var<storage, read> triangleMaxima: array<f32>;
@group(0) @binding(2) var<storage, read_write> sceneBounds: array<atomic<u32>>;

fn finite(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

fn encodeOrderedFloat(value: f32) -> u32 {
  let bits = bitcast<u32>(value);
  return select(bits ^ 0x80000000u, ~bits, (bits & 0x80000000u) != 0u);
}

@compute @workgroup_size(128)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let triangleIndex = invocation.x;
  if (triangleIndex >= TRIANGLE_COUNT) {
    return;
  }

  let componentIndex = triangleIndex * 3u;
  var minimum = vec3<f32>();
  var maximum = vec3<f32>();
  var valid = true;
  for (var axis = 0u; axis < 3u; axis++) {
    minimum[axis] = triangleMinima[MINIMA_OFFSET + componentIndex + axis];
    maximum[axis] = triangleMaxima[MAXIMA_OFFSET + componentIndex + axis];
    valid = valid && finite(minimum[axis]) && finite(maximum[axis]) &&
      minimum[axis] <= maximum[axis];
  }
  if (!valid) {
    return;
  }

  for (var axis = 0u; axis < 3u; axis++) {
    atomicMin(&sceneBounds[axis], encodeOrderedFloat(minimum[axis]));
    atomicMax(&sceneBounds[axis + 3u], encodeOrderedFloat(maximum[axis]));
  }
}
`;

const RAY_TRACING_BLAS_MORTON_KEYS_SHADER = /* wgsl */ `
const TRIANGLE_COUNT = __TRIANGLE_COUNT__u;
const MINIMA_OFFSET = __MINIMA_OFFSET__u;
const MAXIMA_OFFSET = __MAXIMA_OFFSET__u;
const MORTON_KEYS_OFFSET = __MORTON_KEYS_OFFSET__u;
const TRIANGLE_IDS_OFFSET = __TRIANGLE_IDS_OFFSET__u;

@group(0) @binding(0) var<storage, read> triangleMinima: array<f32>;
@group(0) @binding(1) var<storage, read> triangleMaxima: array<f32>;
@group(0) @binding(2) var<storage, read> sceneBounds: array<u32>;
@group(0) @binding(3) var<storage, read_write> mortonKeys: array<u32>;
@group(0) @binding(4) var<storage, read_write> triangleIds: array<u32>;

fn decodeOrderedFloat(value: u32) -> f32 {
  let bits = select(value ^ 0x80000000u, ~value, (value & 0x80000000u) == 0u);
  return bitcast<f32>(bits);
}

fn expandMortonBits(value: u32) -> u32 {
  var bits = value & 1023u;
  bits = (bits | (bits << 16u)) & 0x030000ffu;
  bits = (bits | (bits << 8u)) & 0x0300f00fu;
  bits = (bits | (bits << 4u)) & 0x030c30c3u;
  bits = (bits | (bits << 2u)) & 0x09249249u;
  return bits;
}

fn makeMortonKey(position: vec3<f32>) -> u32 {
  let coordinates = clamp(position, vec3<f32>(0.0), vec3<f32>(0.99999994)) * 1024.0;
  let quantized = vec3<u32>(
    u32(coordinates.x),
    u32(coordinates.y),
    u32(coordinates.z)
  );
  return expandMortonBits(quantized.x) * 4u +
    expandMortonBits(quantized.y) * 2u +
    expandMortonBits(quantized.z);
}

@compute @workgroup_size(128)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let triangleIndex = invocation.x;
  if (triangleIndex >= TRIANGLE_COUNT) {
    return;
  }

  triangleIds[TRIANGLE_IDS_OFFSET + triangleIndex] = triangleIndex;
  let componentIndex = triangleIndex * 3u;
  var minimum = vec3<f32>();
  var maximum = vec3<f32>();
  for (var axis = 0u; axis < 3u; axis++) {
    minimum[axis] = triangleMinima[MINIMA_OFFSET + componentIndex + axis];
    maximum[axis] = triangleMaxima[MAXIMA_OFFSET + componentIndex + axis];
  }

  var sceneMinimum = vec3<f32>();
  var sceneMaximum = vec3<f32>();
  for (var axis = 0u; axis < 3u; axis++) {
    sceneMinimum[axis] = decodeOrderedFloat(sceneBounds[axis]);
    sceneMaximum[axis] = decodeOrderedFloat(sceneBounds[axis + 3u]);
  }
  let extent = max(sceneMaximum - sceneMinimum, vec3<f32>(0.000001));
  let center = (minimum + maximum) * 0.5;
  mortonKeys[MORTON_KEYS_OFFSET + triangleIndex] =
    makeMortonKey((center - sceneMinimum) / extent);
}
`;

const RAY_TRACING_BLAS_GATHER_SORTED_BOUNDS_SHADER = /* wgsl */ `
const TRIANGLE_COUNT = __TRIANGLE_COUNT__u;
const MINIMA_OFFSET = __MINIMA_OFFSET__u;
const MAXIMA_OFFSET = __MAXIMA_OFFSET__u;
const SORTED_TRIANGLE_IDS_OFFSET = __SORTED_TRIANGLE_IDS_OFFSET__u;
const SORTED_MINIMA_OFFSET = __SORTED_MINIMA_OFFSET__u;
const SORTED_MAXIMA_OFFSET = __SORTED_MAXIMA_OFFSET__u;

@group(0) @binding(0) var<storage, read> triangleMinima: array<f32>;
@group(0) @binding(1) var<storage, read> triangleMaxima: array<f32>;
@group(0) @binding(2) var<storage, read> sortedTriangleIds: array<u32>;
@group(0) @binding(3) var<storage, read_write> sortedMinima: array<f32>;
@group(0) @binding(4) var<storage, read_write> sortedMaxima: array<f32>;

@compute @workgroup_size(128)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let sortedIndex = invocation.x;
  if (sortedIndex >= TRIANGLE_COUNT) {
    return;
  }

  let triangleIndex = sortedTriangleIds[SORTED_TRIANGLE_IDS_OFFSET + sortedIndex];
  let sourceComponent = triangleIndex * 3u;
  let destinationComponent = sortedIndex * 3u;
  for (var axis = 0u; axis < 3u; axis++) {
    sortedMinima[SORTED_MINIMA_OFFSET + destinationComponent + axis] =
      triangleMinima[MINIMA_OFFSET + sourceComponent + axis];
    sortedMaxima[SORTED_MAXIMA_OFFSET + destinationComponent + axis] =
      triangleMaxima[MAXIMA_OFFSET + sourceComponent + axis];
  }
}
`;

const RAY_TRACING_BLAS_PACK_NODES_SHADER = /* wgsl */ `
const NODE_COUNT = __NODE_COUNT__u;
const NODE_MINIMA_OFFSET = __NODE_MINIMA_OFFSET__u;
const NODE_MAXIMA_OFFSET = __NODE_MAXIMA_OFFSET__u;
const PACKED_NODES_OFFSET = __PACKED_NODES_OFFSET__u;

@group(0) @binding(0) var<storage, read> nodeMinima: array<f32>;
@group(0) @binding(1) var<storage, read> nodeMaxima: array<f32>;
@group(0) @binding(2) var<storage, read_write> packedNodes: array<f32>;

@compute @workgroup_size(128)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let nodeIndex = invocation.x;
  if (nodeIndex >= NODE_COUNT) {
    return;
  }

  let sourceComponent = nodeIndex * 3u;
  let destinationComponent = nodeIndex * 8u;
  for (var axis = 0u; axis < 3u; axis++) {
    packedNodes[PACKED_NODES_OFFSET + destinationComponent + axis] =
      nodeMinima[NODE_MINIMA_OFFSET + sourceComponent + axis];
    packedNodes[PACKED_NODES_OFFSET + destinationComponent + 4u + axis] =
      nodeMaxima[NODE_MAXIMA_OFFSET + sourceComponent + axis];
  }
  packedNodes[PACKED_NODES_OFFSET + destinationComponent + 3u] = 0.0;
  packedNodes[PACKED_NODES_OFFSET + destinationComponent + 7u] = 0.0;
}
`;

/** Optional analytic primitive supplied by a format-specific scene adapter. */
export type RayTracingScenePrimitive = {
  type: 'sphere';
  radius: number;
};

/** Shared retained-scene inputs and software ray-tracing quality controls. */
export type RayTracingSceneRenderOptions = SceneRenderOptions & {
  /** Optional analytic primitive metadata keyed by retained surface identity. */
  primitives?: Readonly<Record<string, RayTracingScenePrimitive>>;
  /** Camera projection used to choose perspective or orthographic primary rays. */
  cameraProjection?: 'perspective' | 'orthographic';
  /** Number of primary-ray samples per pixel in one encoded frame. */
  samplesPerPixel?: number;
  /** Reserved future path-tracing bounce budget. */
  maxBounces?: number;
  /** Accumulates primary-ray samples across unchanged committed frames. */
  progressive?: boolean;
  /** Traces direct-light shadow rays when enabled. */
  shadows?: boolean;
  /** Initial internal ray-tracing resolution relative to the display resolution. */
  resolutionScale?: number;
  /** Lowest internal resolution available to adaptive frame budgeting. */
  minimumResolutionScale?: number;
  /** Adjusts ray workload toward the requested frame budget when enabled. */
  adaptiveResolution?: boolean;
  /** Target animation-frame duration used by the adaptive scheduler. */
  targetFrameTimeMilliseconds?: number;
  /** Reprojects compatible history while the camera or instances move. */
  temporalReprojection?: boolean;
  /** Maximum non-ambient shadowed light samples traced per pixel in one frame. */
  shadowSamplesPerFrame?: number;
};

type RayTracingScene = {
  primitives: Float32Array;
  triangles: Float32Array;
  lights: Float32Array;
  primitiveCount: number;
  lightCount: number;
  triangleCount: number;
};

type RayTracingGeometryLayout = {
  triangleStart: number;
  triangleCount: number;
  blasNodeStart: number;
  blasTriangleIdStart: number;
  blasInternalNodeCount: number;
  blasLeafCapacity: number;
  bounds: readonly [number, number, number, number];
};

type RayTracingTopology = {
  triangles: Float32Array;
  geometryLayouts: Map<string, RayTracingGeometryLayout>;
  triangleCount: number;
  blasNodeCount: number;
  blasTriangleIdCount: number;
};

type RayTracingPrimitiveData = {
  primitives: Float32Array;
  primitiveCount: number;
  triangleCount: number;
  previousTransforms: Map<string, Matrix4>;
  placements: Map<string, RayTracingPrimitivePlacement>;
};

type RayTracingPrimitivePlacement = {
  surface: SceneSurface;
  surfaceIndex: number;
  transformIndex: number;
  primitiveIndex: number;
  placementIdentifier: string;
};

type RayTracingQualityOptions = {
  resolutionScale: number;
  requestedResolutionScale: number;
  minimumResolutionScale: number;
  adaptiveResolution: boolean;
  targetFrameTimeMilliseconds: number;
};

type RayTracingTraceGraphParameters = {
  dispatchWidth: number;
  carryWidth: number;
  framebuffer?: Framebuffer;
};

type RayTracingAccelerationUpdateMode = 'rebuild' | 'refit' | 'none';

type RayTracingPresentationOptions = {
  colorFormat: TextureFormatColor;
  depthStencilFormat?: TextureFormatDepthStencil;
  toneMapMode: number;
  outputEncoding: number;
};

type RayTracingFrameResources = {
  displayWidth: number;
  displayHeight: number;
  presentation: RayTracingPresentationOptions;
  internalWidth: number;
  internalHeight: number;
  resolutionScale: number;
  requestedResolutionScale: number;
  minimumResolutionScale: number;
  adaptiveResolution: boolean;
  targetFrameTimeMilliseconds: number;
  phaseCount: number;
  phaseIndex: number;
  lastRenderTimeMilliseconds?: number;
  averageFrameTimeMilliseconds?: number;
  overBudgetFrameCount: number;
  underBudgetFrameCount: number;
  lastBudgetAdjustmentTimeMilliseconds: number;
  uniformBuffer: Buffer;
  primitiveBuffer: Buffer;
  triangleBuffer: Buffer;
  lightBuffer: Buffer;
  nodeMinimaBuffer: Buffer;
  nodeMaximaBuffer: Buffer;
  nodeChildrenBuffer: Buffer;
  leafIdsBuffer: Buffer;
  sortedPrimitiveIdsBuffer: Buffer;
  blasNodesBuffer: Buffer;
  blasTriangleIdsBuffer: Buffer;
  bvhCountBuffer: Buffer;
  bvhOverflowBuffer: Buffer;
  colorHistory: GPUTextureHistory;
  metadataHistory: GPUTextureHistory;
  topologyGraph: CompiledGPUCommandGraph;
  accelerationGraph: CompiledGPUCommandGraph;
  refitGraph: CompiledGPUCommandGraph;
  traceGraph: CompiledGPUCommandGraph<RayTracingTraceGraphParameters>;
  topologyRevision: string;
  primitiveRevision: string;
  transformRevision: string;
  materialRevision?: number;
  lightRevision: string;
  renderRevision: string;
  geometryLayouts: Map<string, RayTracingGeometryLayout>;
  retainedSurfaces: readonly SceneSurface[];
  previousTransforms: Map<string, Matrix4>;
  primitivePlacements: Map<string, RayTracingPrimitivePlacement>;
  pendingPreviousTransformInstanceIds: Set<string>;
  previousTransformsNeedCommit: boolean;
  previousViewProjection: Matrix4;
  previousCameraPosition: readonly number[];
  historyNeedsReset: boolean;
  topologyNeedsUpdate: boolean;
  accelerationUpdateMode: RayTracingAccelerationUpdateMode;
  refitsSinceMortonRebuild: number;
  frameIndex: number;
  accumulatedFrameCount: number;
  primitiveCount: number;
  primitiveCapacity: number;
  leafCapacity: number;
  lightCount: number;
  triangleCount: number;
};

type CompiledRayGeometry = {
  triangles: Float32Array;
  triangleCount: number;
  bounds: readonly [number, number, number, number];
};

type RayTracingSceneSurface = SceneSurface & {
  instanceIds?: readonly string[];
};

type RayTracingStatistics = {
  internalWidth: number;
  internalHeight: number;
  resolutionScale: number;
  sampledPixelCoverage: number;
  frameTimeMilliseconds: number;
  accumulatedSamples: number;
  graph: RayTracingGraphStatistics;
};

/** Shared WebGPU software ray tracer consuming the canonical retained-scene contract. */
export class RayTracingSceneRenderer {
  private readonly device: Device;
  private readonly frames = new Map<string, RayTracingFrameResources>();
  private readonly geometryCache = new Map<string, CompiledRayGeometry>();

  constructor(device: Device) {
    if (device.type !== 'webgpu') {
      throw new Error('Ray tracing scene rendering requires a WebGPU device.');
    }
    this.device = device;
  }

  render(options: RayTracingSceneRenderOptions): SceneRenderStatistics {
    const [displayWidth, displayHeight] = getRayTracingDisplaySize(this.device, options);
    const presentation = getRayTracingPresentationOptions(this.device, options);
    const lights = options.lights ?? [];
    const quality = getQualityOptions(options);
    const viewProjection = new Matrix4(options.camera.projectionMatrix).multiplyRight(
      options.camera.viewMatrix
    );
    const inverseViewProjection = new Matrix4(viewProjection).invert();
    const topologyRevision = getTopologyRevision(options);
    const transformRevision = getTransformRevision(options);
    const primitiveRevision = getPrimitiveRevision(options, transformRevision);
    const lightRevision = getLightRevision(options, lights);
    let resources = this.frames.get(options.id);
    const currentTimeMilliseconds = getTimestampMilliseconds();

    if (!resources) {
      const topology = makeRayTracingTopology(
        options.surfaces,
        options.primitives ?? {},
        this.geometryCache
      );
      const primitiveData = makePrimitiveData(
        options.surfaces,
        options.primitives ?? {},
        topology.geometryLayouts,
        new Map()
      );
      const scene = makeRayTracingScene(primitiveData, topology.triangles, lights);
      resources = this.createFrameResources({
        frameIdentifier: options.id,
        displayWidth,
        displayHeight,
        presentation,
        scene,
        topology,
        primitiveData,
        surfaces: options.surfaces,
        quality,
        viewProjection,
        cameraPosition: options.camera.position
      });
      resources.topologyRevision = topologyRevision;
      resources.primitiveRevision = primitiveRevision;
      resources.transformRevision = transformRevision;
      resources.materialRevision = options.sceneRevisions?.materials;
      resources.lightRevision = lightRevision;
      this.frames.set(options.id, resources);
    } else {
      updateFrameTiming(resources, currentTimeMilliseconds);
      if (updateQualityOptions(resources, quality)) {
        resources.historyNeedsReset = true;
      }

      const topologyChanged = resources.topologyRevision !== topologyRevision;
      const primitiveChanged = resources.primitiveRevision !== primitiveRevision;
      const transformChanged = resources.transformRevision !== transformRevision;
      const lightsChanged = resources.lightRevision !== lightRevision;
      const sparseTransformInstanceIds = getSparseTransformInstanceIds(
        options,
        resources,
        topologyChanged,
        transformChanged
      );
      const sparsePreviousTransformCommit =
        !topologyChanged &&
        !primitiveChanged &&
        resources.previousTransformsNeedCommit &&
        resources.pendingPreviousTransformInstanceIds.size > 0 &&
        resources.pendingPreviousTransformInstanceIds.size <=
          getMaximumSparsePrimitiveUpdateCount(resources);
      let topology: RayTracingTopology | undefined;
      let primitiveData: RayTracingPrimitiveData | undefined;
      let lightData: Float32Array | undefined;

      if (topologyChanged) {
        topology = makeRayTracingTopology(
          options.surfaces,
          options.primitives ?? {},
          this.geometryCache
        );
      }
      if (topologyChanged || (primitiveChanged && !sparseTransformInstanceIds)) {
        primitiveData = makePrimitiveData(
          options.surfaces,
          options.primitives ?? {},
          topology?.geometryLayouts ?? resources.geometryLayouts,
          resources.previousTransforms
        );
      } else if (
        resources.previousTransformsNeedCommit &&
        !sparseTransformInstanceIds &&
        !sparsePreviousTransformCommit
      ) {
        primitiveData = makePrimitiveData(
          options.surfaces,
          options.primitives ?? {},
          resources.geometryLayouts,
          resources.previousTransforms
        );
      }
      if (lightsChanged) {
        lightData = makeLightData(lights);
      }

      if (
        topologyChanged ||
        (primitiveData &&
          resources.primitiveBuffer.byteLength < primitiveData.primitives.byteLength) ||
        (topology && resources.triangleBuffer.byteLength < topology.triangles.byteLength) ||
        (lightData && resources.lightBuffer.byteLength < lightData.byteLength)
      ) {
        topology ??= makeRayTracingTopology(
          options.surfaces,
          options.primitives ?? {},
          this.geometryCache
        );
        primitiveData ??= makePrimitiveData(
          options.surfaces,
          options.primitives ?? {},
          topology.geometryLayouts,
          resources.previousTransforms
        );
        const scene = makeRayTracingScene(primitiveData, topology.triangles, lights);
        const previousTransformsNeedCommit =
          resources.previousTransformsNeedCommit || transformChanged;
        this.destroyFrame(options.id);
        resources = this.createFrameResources({
          frameIdentifier: options.id,
          displayWidth,
          displayHeight,
          presentation,
          scene,
          topology,
          primitiveData,
          surfaces: options.surfaces,
          quality,
          viewProjection,
          cameraPosition: options.camera.position
        });
        resources.previousTransformsNeedCommit = previousTransformsNeedCommit;
        const recreatedPrimitivePlacements = resources.primitivePlacements;
        resources.pendingPreviousTransformInstanceIds = new Set(
          previousTransformsNeedCommit
            ? (options.sceneRevisions?.dirtyInstanceIds ?? []).filter(instanceIdentifier =>
                recreatedPrimitivePlacements.has(instanceIdentifier)
              )
            : []
        );
        resources.topologyRevision = topologyRevision;
        resources.primitiveRevision = primitiveRevision;
        resources.transformRevision = transformRevision;
        resources.materialRevision = options.sceneRevisions?.materials;
        resources.lightRevision = lightRevision;
        this.frames.set(options.id, resources);
      } else {
        if (topology) {
          resources.triangleBuffer.write(topology.triangles);
          resources.geometryLayouts = topology.geometryLayouts;
          resources.historyNeedsReset = true;
          resources.accelerationUpdateMode = 'rebuild';
        }
        if (primitiveData) {
          resources.primitiveBuffer.write(primitiveData.primitives);
          resources.previousTransforms = primitiveData.previousTransforms;
          resources.primitivePlacements = primitiveData.placements;
          resources.retainedSurfaces = options.surfaces;
          const updatedPrimitivePlacements = primitiveData.placements;
          resources.pendingPreviousTransformInstanceIds = new Set(
            transformChanged
              ? (options.sceneRevisions?.dirtyInstanceIds ?? []).filter(instanceIdentifier =>
                  updatedPrimitivePlacements.has(instanceIdentifier)
                )
              : []
          );
          resources.previousTransformsNeedCommit = transformChanged;
          resources.primitiveCount = primitiveData.primitiveCount;
          resources.triangleCount = primitiveData.triangleCount;
          if (transformChanged) {
            scheduleTransformAccelerationUpdate(resources);
            if (!(options.temporalReprojection ?? true)) {
              resources.historyNeedsReset = true;
            }
          } else if (primitiveChanged) {
            resources.historyNeedsReset = true;
          }
        } else if (sparseTransformInstanceIds || sparsePreviousTransformCommit) {
          updateSparsePrimitiveTransforms(resources, sparseTransformInstanceIds ?? []);
          if (transformChanged) {
            scheduleTransformAccelerationUpdate(resources);
            if (!(options.temporalReprojection ?? true)) {
              resources.historyNeedsReset = true;
            }
          }
        }
        if (lightData) {
          const lightCountChanged = resources.lightCount !== lights.length;
          resources.lightBuffer.write(lightData);
          resources.lightCount = lights.length;
          if (lightCountChanged || !(options.temporalReprojection ?? true)) {
            resources.historyNeedsReset = true;
          }
        }
        resources.topologyRevision = topologyRevision;
        resources.primitiveRevision = primitiveRevision;
        resources.transformRevision = transformRevision;
        resources.materialRevision = options.sceneRevisions?.materials;
        resources.lightRevision = lightRevision;
      }
    }

    if (!resources.lastRenderTimeMilliseconds) {
      resources.lastRenderTimeMilliseconds = currentTimeMilliseconds;
    }
    const renderRevision = getRenderRevision(options, inverseViewProjection);
    if (resources.renderRevision !== renderRevision) {
      resources.renderRevision = renderRevision;
      resources.historyNeedsReset = true;
    }
    if (
      (options.temporalReprojection ?? true) &&
      isCameraCut(
        resources.previousViewProjection,
        viewProjection,
        resources.previousCameraPosition,
        options.camera.position
      )
    ) {
      resources.historyNeedsReset = true;
    }
    if (resources.displayWidth !== displayWidth || resources.displayHeight !== displayHeight) {
      resources.historyNeedsReset = true;
    }
    updateRayTracingAdaptiveBudget(resources, currentTimeMilliseconds);

    const internalDimensions = getInternalDimensions(
      displayWidth,
      displayHeight,
      resources.resolutionScale
    );
    if (
      resources.displayWidth !== displayWidth ||
      resources.displayHeight !== displayHeight ||
      resources.internalWidth !== internalDimensions.width ||
      resources.internalHeight !== internalDimensions.height
    ) {
      this.recreateTraceResources(
        options.id,
        resources,
        displayWidth,
        displayHeight,
        internalDimensions.width,
        internalDimensions.height,
        presentation
      );
    } else if (!areRayTracingPresentationOptionsEqual(resources.presentation, presentation)) {
      this.recreateTraceGraph(options.id, resources, presentation);
    }

    const progressive = options.progressive ?? true;
    if (resources.historyNeedsReset) {
      resources.accumulatedFrameCount = 0;
      resources.phaseCount = 1;
      resources.phaseIndex = 0;
    }
    const activePhaseCount = resources.historyNeedsReset ? 1 : resources.phaseCount;
    const activePhaseIndex = resources.historyNeedsReset
      ? 0
      : resources.phaseIndex % activePhaseCount;
    const accumulatedFrameCount = progressive ? resources.accumulatedFrameCount : 0;
    resources.uniformBuffer.write(
      makeUniformData({
        options,
        inverseViewProjection,
        previousViewProjection: resources.previousViewProjection,
        previousCameraPosition: resources.previousCameraPosition,
        displayWidth,
        displayHeight,
        internalWidth: resources.internalWidth,
        internalHeight: resources.internalHeight,
        resolutionScale: resources.resolutionScale,
        phaseIndex: activePhaseIndex,
        phaseCount: activePhaseCount,
        primitiveCount: resources.primitiveCount,
        primitiveCapacity: resources.primitiveCapacity,
        leafCapacity: resources.leafCapacity,
        lightCount: resources.lightCount,
        directLightCount: lights.reduce(
          (directLightCount, light) => directLightCount + Number(light.type !== 'ambient'),
          0
        ),
        accumulatedFrameCount,
        frameIndex: resources.frameIndex
      })
    );

    let topologyEncodingStats: GPUCommandGraphEncodingStats | undefined;
    let accelerationEncodingStats: GPUCommandGraphEncodingStats | undefined;
    let refitEncodingStats: GPUCommandGraphEncodingStats | undefined;
    if (resources.topologyNeedsUpdate) {
      topologyEncodingStats = resources.topologyGraph.encode(this.device.commandEncoder, {
        parameters: undefined
      }).stats;
      resources.topologyNeedsUpdate = false;
    }
    if (resources.accelerationUpdateMode === 'rebuild') {
      accelerationEncodingStats = resources.accelerationGraph.encode(this.device.commandEncoder, {
        parameters: undefined
      }).stats;
      resources.refitsSinceMortonRebuild = 0;
    } else if (resources.accelerationUpdateMode === 'refit') {
      refitEncodingStats = resources.refitGraph.encode(this.device.commandEncoder, {
        parameters: undefined
      }).stats;
      resources.refitsSinceMortonRebuild++;
    }
    resources.accelerationUpdateMode = 'none';
    const traceEncodingStats = resources.traceGraph.encode(this.device.commandEncoder, {
      parameters: {
        dispatchWidth: Math.ceil(resources.internalWidth / activePhaseCount),
        carryWidth:
          activePhaseCount > 1
            ? Math.ceil((resources.internalWidth * (activePhaseCount - 1)) / activePhaseCount)
            : 0,
        ...(options.framebuffer ? {framebuffer: options.framebuffer} : {})
      },
      textures: {
        ...resources.colorHistory.getBindings('history', 'output'),
        ...resources.metadataHistory.getBindings('history-metadata', 'output-metadata')
      }
    }).stats;
    resources.colorHistory.advance();
    resources.metadataHistory.advance();
    resources.previousViewProjection = new Matrix4(viewProjection);
    resources.previousCameraPosition = Array.from(options.camera.position);
    resources.historyNeedsReset = false;
    resources.phaseIndex = (activePhaseIndex + 1) % resources.phaseCount;
    resources.frameIndex++;
    resources.accumulatedFrameCount = progressive ? accumulatedFrameCount + 1 : 0;
    const samplesPerPixel = getSamplesPerPixel(options);

    const statistics = {
      surfaceCount: options.surfaces.length,
      instanceCount: resources.primitiveCount,
      drawCount: 1,
      triangleCount: resources.triangleCount,
      rayTracing: {
        internalWidth: resources.internalWidth,
        internalHeight: resources.internalHeight,
        resolutionScale: resources.resolutionScale,
        sampledPixelCoverage: 1 / activePhaseCount,
        frameTimeMilliseconds:
          resources.averageFrameTimeMilliseconds ?? resources.targetFrameTimeMilliseconds,
        accumulatedSamples: progressive
          ? Math.min(resources.accumulatedFrameCount * samplesPerPixel, MAXIMUM_HISTORY_SAMPLES)
          : samplesPerPixel,
        graph: makeRayTracingGraphStatistics({
          topology: topologyEncodingStats,
          acceleration: accelerationEncodingStats,
          refit: refitEncodingStats,
          trace: traceEncodingStats
        })
      } satisfies RayTracingStatistics
    };
    return statistics as SceneRenderStatistics;
  }

  destroyFrame(frameIdentifier: string): void {
    const resources = this.frames.get(frameIdentifier);
    if (!resources) {
      return;
    }
    resources.topologyGraph.destroy();
    resources.accelerationGraph.destroy();
    resources.refitGraph.destroy();
    resources.traceGraph.destroy();
    resources.uniformBuffer.destroy();
    resources.primitiveBuffer.destroy();
    resources.triangleBuffer.destroy();
    resources.lightBuffer.destroy();
    resources.nodeMinimaBuffer.destroy();
    resources.nodeMaximaBuffer.destroy();
    resources.nodeChildrenBuffer.destroy();
    resources.leafIdsBuffer.destroy();
    resources.sortedPrimitiveIdsBuffer.destroy();
    resources.blasNodesBuffer.destroy();
    resources.blasTriangleIdsBuffer.destroy();
    resources.bvhCountBuffer.destroy();
    resources.bvhOverflowBuffer.destroy();
    resources.colorHistory.destroy();
    resources.metadataHistory.destroy();
    this.frames.delete(frameIdentifier);
  }

  destroy(): void {
    for (const frameIdentifier of Array.from(this.frames.keys())) {
      this.destroyFrame(frameIdentifier);
    }
  }

  private createFrameResources(props: {
    frameIdentifier: string;
    displayWidth: number;
    displayHeight: number;
    presentation: RayTracingPresentationOptions;
    scene: RayTracingScene;
    topology: RayTracingTopology;
    primitiveData: RayTracingPrimitiveData;
    surfaces: readonly SceneSurface[];
    quality: RayTracingQualityOptions;
    viewProjection: Matrix4;
    cameraPosition: Readonly<NumericArray>;
  }): RayTracingFrameResources {
    const {frameIdentifier, scene} = props;
    const uniformBuffer = this.device.createBuffer({
      id: `${frameIdentifier}-ray-tracing-uniforms`,
      byteLength: UNIFORM_FLOAT_COUNT * Float32Array.BYTES_PER_ELEMENT,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    const primitiveBuffer = this.device.createBuffer({
      id: `${frameIdentifier}-ray-tracing-primitives`,
      data: scene.primitives,
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    const triangleBuffer = this.device.createBuffer({
      id: `${frameIdentifier}-ray-tracing-triangles`,
      data: scene.triangles,
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    const lightBuffer = this.device.createBuffer({
      id: `${frameIdentifier}-ray-tracing-lights`,
      data: scene.lights,
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    const primitiveCapacity = Math.max(
      1,
      Math.floor(
        primitiveBuffer.byteLength / (PRIMITIVE_FLOAT_COUNT * Float32Array.BYTES_PER_ELEMENT)
      )
    );
    const leafCapacity = 2 ** Math.ceil(Math.log2(primitiveCapacity));
    const nodeCount = leafCapacity * 2 - 1;
    const nodeMinimaBuffer = this.device.createBuffer({
      id: `${frameIdentifier}-ray-tracing-node-minima`,
      byteLength: nodeCount * 3 * Float32Array.BYTES_PER_ELEMENT,
      usage: Buffer.STORAGE
    });
    const nodeMaximaBuffer = this.device.createBuffer({
      id: `${frameIdentifier}-ray-tracing-node-maxima`,
      byteLength: nodeCount * 3 * Float32Array.BYTES_PER_ELEMENT,
      usage: Buffer.STORAGE
    });
    const nodeChildrenBuffer = this.device.createBuffer({
      id: `${frameIdentifier}-ray-tracing-node-children`,
      byteLength: nodeCount * 2 * Uint32Array.BYTES_PER_ELEMENT,
      usage: Buffer.STORAGE
    });
    const leafIdsBuffer = this.device.createBuffer({
      id: `${frameIdentifier}-ray-tracing-leaf-ids`,
      byteLength: leafCapacity * Uint32Array.BYTES_PER_ELEMENT,
      usage: Buffer.STORAGE
    });
    const sortedPrimitiveIdsBuffer = this.device.createBuffer({
      id: `${frameIdentifier}-ray-tracing-sorted-primitive-ids`,
      data: new Uint32Array(leafCapacity).fill(INVALID_PRIMITIVE_ID),
      usage: Buffer.STORAGE
    });
    const blasNodesBuffer = this.device.createBuffer({
      id: `${frameIdentifier}-ray-tracing-blas-nodes`,
      byteLength:
        Math.max(1, props.topology.blasNodeCount) *
        BLAS_NODE_FLOAT_COUNT *
        Float32Array.BYTES_PER_ELEMENT,
      usage: Buffer.STORAGE
    });
    const blasTriangleIdsBuffer = this.device.createBuffer({
      id: `${frameIdentifier}-ray-tracing-blas-triangle-ids`,
      data: new Uint32Array(Math.max(1, props.topology.blasTriangleIdCount)).fill(
        INVALID_PRIMITIVE_ID
      ),
      usage: Buffer.STORAGE
    });
    const bvhCountBuffer = this.device.createBuffer({
      id: `${frameIdentifier}-ray-tracing-bvh-count`,
      byteLength: Uint32Array.BYTES_PER_ELEMENT,
      usage: Buffer.STORAGE
    });
    const bvhOverflowBuffer = this.device.createBuffer({
      id: `${frameIdentifier}-ray-tracing-bvh-overflow`,
      byteLength: Uint32Array.BYTES_PER_ELEMENT,
      usage: Buffer.STORAGE
    });
    const internalDimensions = getInternalDimensions(
      props.displayWidth,
      props.displayHeight,
      props.quality.resolutionScale
    );
    const colorHistory = this.createTextureHistory(
      frameIdentifier,
      'history',
      internalDimensions.width,
      internalDimensions.height
    );
    const metadataHistory = this.createTextureHistory(
      frameIdentifier,
      'history-metadata',
      internalDimensions.width,
      internalDimensions.height
    );
    const topologyGraph = this.createTopologyGraph({
      frameIdentifier,
      topology: props.topology,
      triangleBuffer,
      blasNodesBuffer,
      blasTriangleIdsBuffer
    });
    const accelerationGraph = this.createAccelerationGraph({
      frameIdentifier,
      uniformBuffer,
      primitiveBuffer,
      blasNodesBuffer,
      primitiveCapacity,
      leafCapacity,
      nodeMinimaBuffer,
      nodeMaximaBuffer,
      nodeChildrenBuffer,
      leafIdsBuffer,
      sortedPrimitiveIdsBuffer,
      bvhCountBuffer,
      bvhOverflowBuffer
    });
    const refitGraph = this.createRefitGraph({
      frameIdentifier,
      uniformBuffer,
      primitiveBuffer,
      blasNodesBuffer,
      primitiveCapacity,
      leafCapacity,
      nodeMinimaBuffer,
      nodeMaximaBuffer,
      nodeChildrenBuffer,
      leafIdsBuffer,
      sortedPrimitiveIdsBuffer,
      bvhCountBuffer,
      bvhOverflowBuffer
    });
    const traceGraph = this.createTraceGraph({
      frameIdentifier,
      internalWidth: internalDimensions.width,
      internalHeight: internalDimensions.height,
      presentation: props.presentation,
      uniformBuffer,
      primitiveBuffer,
      triangleBuffer,
      lightBuffer,
      nodeMinimaBuffer,
      nodeMaximaBuffer,
      sortedPrimitiveIdsBuffer,
      blasNodesBuffer,
      blasTriangleIdsBuffer,
      colorHistory,
      metadataHistory
    });

    return {
      displayWidth: props.displayWidth,
      displayHeight: props.displayHeight,
      presentation: props.presentation,
      internalWidth: internalDimensions.width,
      internalHeight: internalDimensions.height,
      resolutionScale: props.quality.resolutionScale,
      requestedResolutionScale: props.quality.requestedResolutionScale,
      minimumResolutionScale: props.quality.minimumResolutionScale,
      adaptiveResolution: props.quality.adaptiveResolution,
      targetFrameTimeMilliseconds: props.quality.targetFrameTimeMilliseconds,
      phaseCount: 1,
      phaseIndex: 0,
      overBudgetFrameCount: 0,
      underBudgetFrameCount: 0,
      lastBudgetAdjustmentTimeMilliseconds: 0,
      uniformBuffer,
      primitiveBuffer,
      triangleBuffer,
      lightBuffer,
      nodeMinimaBuffer,
      nodeMaximaBuffer,
      nodeChildrenBuffer,
      leafIdsBuffer,
      sortedPrimitiveIdsBuffer,
      blasNodesBuffer,
      blasTriangleIdsBuffer,
      bvhCountBuffer,
      bvhOverflowBuffer,
      colorHistory,
      metadataHistory,
      topologyGraph,
      accelerationGraph,
      refitGraph,
      traceGraph,
      topologyRevision: '',
      primitiveRevision: '',
      transformRevision: '',
      lightRevision: '',
      renderRevision: '',
      geometryLayouts: props.topology.geometryLayouts,
      retainedSurfaces: props.surfaces,
      previousTransforms: props.primitiveData.previousTransforms,
      primitivePlacements: props.primitiveData.placements,
      pendingPreviousTransformInstanceIds: new Set(),
      previousTransformsNeedCommit: false,
      previousViewProjection: new Matrix4(props.viewProjection),
      previousCameraPosition: Array.from(props.cameraPosition),
      historyNeedsReset: true,
      topologyNeedsUpdate: true,
      accelerationUpdateMode: 'rebuild',
      refitsSinceMortonRebuild: 0,
      frameIndex: 0,
      accumulatedFrameCount: 0,
      primitiveCount: scene.primitiveCount,
      primitiveCapacity,
      leafCapacity,
      lightCount: scene.lightCount,
      triangleCount: scene.triangleCount
    };
  }

  private recreateTraceResources(
    frameIdentifier: string,
    resources: RayTracingFrameResources,
    displayWidth: number,
    displayHeight: number,
    internalWidth: number,
    internalHeight: number,
    presentation: RayTracingPresentationOptions
  ): void {
    resources.traceGraph.destroy();
    resources.colorHistory.destroy();
    resources.metadataHistory.destroy();
    resources.colorHistory = this.createTextureHistory(
      frameIdentifier,
      'history',
      internalWidth,
      internalHeight
    );
    resources.metadataHistory = this.createTextureHistory(
      frameIdentifier,
      'history-metadata',
      internalWidth,
      internalHeight
    );
    resources.traceGraph = this.createTraceGraph({
      frameIdentifier,
      internalWidth,
      internalHeight,
      presentation,
      uniformBuffer: resources.uniformBuffer,
      primitiveBuffer: resources.primitiveBuffer,
      triangleBuffer: resources.triangleBuffer,
      lightBuffer: resources.lightBuffer,
      nodeMinimaBuffer: resources.nodeMinimaBuffer,
      nodeMaximaBuffer: resources.nodeMaximaBuffer,
      sortedPrimitiveIdsBuffer: resources.sortedPrimitiveIdsBuffer,
      blasNodesBuffer: resources.blasNodesBuffer,
      blasTriangleIdsBuffer: resources.blasTriangleIdsBuffer,
      colorHistory: resources.colorHistory,
      metadataHistory: resources.metadataHistory
    });
    resources.displayWidth = displayWidth;
    resources.displayHeight = displayHeight;
    resources.presentation = presentation;
    resources.internalWidth = internalWidth;
    resources.internalHeight = internalHeight;
    resources.phaseIndex = 0;
    resources.historyNeedsReset = true;
  }

  private recreateTraceGraph(
    frameIdentifier: string,
    resources: RayTracingFrameResources,
    presentation: RayTracingPresentationOptions
  ): void {
    const traceGraph = this.createTraceGraph({
      frameIdentifier,
      internalWidth: resources.internalWidth,
      internalHeight: resources.internalHeight,
      presentation,
      uniformBuffer: resources.uniformBuffer,
      primitiveBuffer: resources.primitiveBuffer,
      triangleBuffer: resources.triangleBuffer,
      lightBuffer: resources.lightBuffer,
      nodeMinimaBuffer: resources.nodeMinimaBuffer,
      nodeMaximaBuffer: resources.nodeMaximaBuffer,
      sortedPrimitiveIdsBuffer: resources.sortedPrimitiveIdsBuffer,
      blasNodesBuffer: resources.blasNodesBuffer,
      blasTriangleIdsBuffer: resources.blasTriangleIdsBuffer,
      colorHistory: resources.colorHistory,
      metadataHistory: resources.metadataHistory
    });
    resources.traceGraph.destroy();
    resources.traceGraph = traceGraph;
    resources.presentation = presentation;
  }

  private createTextureHistory(
    frameIdentifier: string,
    suffix: string,
    width: number,
    height: number
  ): GPUTextureHistory {
    return new GPUTextureHistory(this.device, {
      id: `${frameIdentifier}-ray-tracing-${suffix}`,
      width,
      height,
      format: 'rgba16float',
      usage: Texture.SAMPLE | Texture.STORAGE
    });
  }

  private createTopologyGraph(props: {
    frameIdentifier: string;
    topology: RayTracingTopology;
    triangleBuffer: Buffer;
    blasNodesBuffer: Buffer;
    blasTriangleIdsBuffer: Buffer;
  }): CompiledGPUCommandGraph {
    const graph = new GPUCommandGraph(this.device, {
      id: `scene-${props.frameIdentifier}-ray-tracing-topology`
    });
    const triangles = graph.importBuffer(
      {
        id: 'triangles',
        byteLength: props.triangleBuffer.byteLength,
        usage: props.triangleBuffer.usage
      },
      props.triangleBuffer
    );
    const triangleCapacity = Math.max(1, props.topology.triangleCount);
    const blasNodeCount = Math.max(1, props.topology.blasNodeCount);
    const blasTriangleIdCount = Math.max(1, props.topology.blasTriangleIdCount);
    const triangleMinima: GraphDataView<'float32x3'> = createTransientView(
      graph,
      'triangle-minima',
      'float32x3',
      triangleCapacity
    );
    const triangleMaxima: GraphDataView<'float32x3'> = createTransientView(
      graph,
      'triangle-maxima',
      'float32x3',
      triangleCapacity
    );
    const mortonKeys: GraphDataView<'uint32'> = createTransientView(
      graph,
      'blas-morton-keys',
      'uint32',
      blasTriangleIdCount
    );
    const localTriangleIds: GraphDataView<'uint32'> = createTransientView(
      graph,
      'blas-local-triangle-ids',
      'uint32',
      blasTriangleIdCount
    );
    const sortedMortonKeys: GraphDataView<'uint32'> = createTransientView(
      graph,
      'blas-sorted-morton-keys',
      'uint32',
      blasTriangleIdCount
    );
    const sortedTriangleIds: GraphDataView<'uint32'> = createImportedView(
      graph,
      'blas-triangle-ids',
      props.blasTriangleIdsBuffer,
      'uint32',
      blasTriangleIdCount
    );
    const sortedMinima: GraphDataView<'float32x3'> = createTransientView(
      graph,
      'blas-sorted-minima',
      'float32x3',
      triangleCapacity
    );
    const sortedMaxima: GraphDataView<'float32x3'> = createTransientView(
      graph,
      'blas-sorted-maxima',
      'float32x3',
      triangleCapacity
    );
    const nodeMinima: GraphDataView<'float32x3'> = createTransientView(
      graph,
      'blas-node-minima',
      'float32x3',
      blasNodeCount
    );
    const nodeMaxima: GraphDataView<'float32x3'> = createTransientView(
      graph,
      'blas-node-maxima',
      'float32x3',
      blasNodeCount
    );
    const nodeChildren: GraphDataView<'uint32x2'> = createTransientView(
      graph,
      'blas-node-children',
      'uint32x2',
      blasNodeCount
    );
    const leafIds: GraphDataView<'uint32'> = createTransientView(
      graph,
      'blas-leaf-ids',
      'uint32',
      blasTriangleIdCount
    );
    const packedNodes: GraphDataView<'float32x4'> = createImportedView(
      graph,
      'blas-nodes',
      props.blasNodesBuffer,
      'float32x4',
      blasNodeCount * 2
    );
    const hierarchyCount = Math.max(1, props.topology.geometryLayouts.size);
    const blasCounts: GraphDataView<'uint32'> = createTransientView(
      graph,
      'blas-counts',
      'uint32',
      hierarchyCount
    );
    const blasOverflows: GraphDataView<'uint32'> = createTransientView(
      graph,
      'blas-overflows',
      'uint32',
      hierarchyCount
    );

    graph.addComputePass({
      id: `${props.frameIdentifier}-build-triangle-bounds`,
      resources: [
        {buffer: triangles, usage: 'storage-read'},
        {buffer: triangleMinima, usage: 'storage-write'},
        {buffer: triangleMaxima, usage: 'storage-write'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: `${props.frameIdentifier}-triangle-bounds-computation`,
          source: replaceShaderConstants(RAY_TRACING_TRIANGLE_BOUNDS_SHADER, {
            TRIANGLE_COUNT: props.topology.triangleCount
          }),
          shaderLayout: {
            bindings: [
              {name: 'triangles', type: 'read-only-storage', group: 0, location: 0},
              {name: 'triangleMinima', type: 'storage', group: 0, location: 1},
              {name: 'triangleMaxima', type: 'storage', group: 0, location: 2}
            ]
          }
        });
        return {
          encode: ({computePass, getBuffer}) => {
            computation.setBindings({
              triangles: getBuffer(triangles),
              triangleMinima: getViewBinding(triangleMinima, getBuffer),
              triangleMaxima: getViewBinding(triangleMaxima, getBuffer)
            });
            computation.dispatch(computePass, Math.ceil(triangleCapacity / 128));
          },
          destroy: () => computation.destroy()
        };
      }
    });

    const localSortSegments: GPUSortSegment[] = [];
    const localHierarchySegments: GPUBVHSegment[] = [];
    const deferredHierarchyPasses: Array<{
      addGatherPass: () => void;
      addHierarchyPass: () => void;
      addPackPass: () => void;
      usesSegmentedHierarchy: boolean;
    }> = [];

    for (const [geometryIndex, geometryLayout] of Array.from(
      props.topology.geometryLayouts.values()
    ).entries()) {
      if (geometryLayout.triangleCount === 0) {
        continue;
      }
      const geometryNodeCount = geometryLayout.blasLeafCapacity * 2 - 1;
      const geometryTriangleMinima = createDataSubview(
        graph,
        triangleMinima,
        'float32x3',
        geometryLayout.triangleStart,
        geometryLayout.triangleCount
      );
      const geometryTriangleMaxima = createDataSubview(
        graph,
        triangleMaxima,
        'float32x3',
        geometryLayout.triangleStart,
        geometryLayout.triangleCount
      );
      const geometryMortonKeys = createDataSubview(
        graph,
        mortonKeys,
        'uint32',
        geometryLayout.blasTriangleIdStart,
        geometryLayout.triangleCount
      );
      const geometryLocalTriangleIds = createDataSubview(
        graph,
        localTriangleIds,
        'uint32',
        geometryLayout.blasTriangleIdStart,
        geometryLayout.triangleCount
      );
      const geometrySortedMortonKeys = createDataSubview(
        graph,
        sortedMortonKeys,
        'uint32',
        geometryLayout.blasTriangleIdStart,
        geometryLayout.triangleCount
      );
      const geometrySortedTriangleIds = createDataSubview(
        graph,
        sortedTriangleIds,
        'uint32',
        geometryLayout.blasTriangleIdStart,
        geometryLayout.triangleCount
      );
      const geometrySortedMinima = createDataSubview(
        graph,
        sortedMinima,
        'float32x3',
        geometryLayout.triangleStart,
        geometryLayout.triangleCount
      );
      const geometrySortedMaxima = createDataSubview(
        graph,
        sortedMaxima,
        'float32x3',
        geometryLayout.triangleStart,
        geometryLayout.triangleCount
      );
      const geometryNodeMinima = createDataSubview(
        graph,
        nodeMinima,
        'float32x3',
        geometryLayout.blasNodeStart,
        geometryNodeCount
      );
      const geometryNodeMaxima = createDataSubview(
        graph,
        nodeMaxima,
        'float32x3',
        geometryLayout.blasNodeStart,
        geometryNodeCount
      );
      const geometryNodeChildren = createDataSubview(
        graph,
        nodeChildren,
        'uint32x2',
        geometryLayout.blasNodeStart,
        geometryNodeCount
      );
      const geometryLeafIds = createDataSubview(
        graph,
        leafIds,
        'uint32',
        geometryLayout.blasTriangleIdStart,
        geometryLayout.blasLeafCapacity
      );
      const geometryPackedNodes = createDataSubview(
        graph,
        packedNodes,
        'float32x4',
        geometryLayout.blasNodeStart * 2,
        geometryNodeCount * 2
      );
      const count = createDataSubview(graph, blasCounts, 'uint32', geometryIndex, 1);
      const overflow = createDataSubview(graph, blasOverflows, 'uint32', geometryIndex, 1);
      const usesSegmentedSort = geometryLayout.triangleCount <= 256;

      if (geometryLayout.triangleCount > 0) {
        const sceneBounds: GraphDataView<'uint32'> = createTransientView(
          graph,
          `blas-${geometryIndex}-scene-bounds`,
          'uint32',
          6
        );
        graph.addComputePass({
          id: `${props.frameIdentifier}-blas-${geometryIndex}-initialize-scene-bounds`,
          resources: [{buffer: sceneBounds, usage: 'storage-write'}],
          compile: ({device}) => {
            const computation = new Computation(device, {
              id: `${props.frameIdentifier}-blas-${geometryIndex}-scene-bounds-initialize-computation`,
              source: RAY_TRACING_SCENE_BOUNDS_INITIALIZE_SHADER,
              shaderLayout: {
                bindings: [{name: 'sceneBounds', type: 'storage', group: 0, location: 0}]
              }
            });
            return {
              encode: ({computePass, getBuffer}) => {
                computation.setBindings({
                  sceneBounds: getViewBinding(sceneBounds, getBuffer)
                });
                computation.dispatch(computePass, 1);
              },
              destroy: () => computation.destroy()
            };
          }
        });

        graph.addComputePass({
          id: `${props.frameIdentifier}-blas-${geometryIndex}-reduce-scene-bounds`,
          resources: [
            {buffer: geometryTriangleMinima, usage: 'storage-read'},
            {buffer: geometryTriangleMaxima, usage: 'storage-read'},
            {buffer: sceneBounds, usage: 'storage-read-write'}
          ],
          compile: ({device}) => {
            const computation = new Computation(device, {
              id: `${props.frameIdentifier}-blas-${geometryIndex}-scene-bounds-reduce-computation`,
              source: replaceShaderConstants(RAY_TRACING_BLAS_SCENE_BOUNDS_REDUCE_SHADER, {
                TRIANGLE_COUNT: geometryLayout.triangleCount,
                MINIMA_OFFSET: getViewElementOffset(geometryTriangleMinima),
                MAXIMA_OFFSET: getViewElementOffset(geometryTriangleMaxima)
              }),
              shaderLayout: {
                bindings: [
                  {name: 'triangleMinima', type: 'read-only-storage', group: 0, location: 0},
                  {name: 'triangleMaxima', type: 'read-only-storage', group: 0, location: 1},
                  {name: 'sceneBounds', type: 'storage', group: 0, location: 2}
                ]
              }
            });
            return {
              encode: ({computePass, getBuffer}) => {
                computation.setBindings({
                  triangleMinima: getViewBinding(geometryTriangleMinima, getBuffer),
                  triangleMaxima: getViewBinding(geometryTriangleMaxima, getBuffer),
                  sceneBounds: getViewBinding(sceneBounds, getBuffer)
                });
                computation.dispatch(computePass, Math.ceil(geometryLayout.triangleCount / 128));
              },
              destroy: () => computation.destroy()
            };
          }
        });

        graph.addComputePass({
          id: `${props.frameIdentifier}-blas-${geometryIndex}-build-morton-keys`,
          resources: [
            {buffer: geometryTriangleMinima, usage: 'storage-read'},
            {buffer: geometryTriangleMaxima, usage: 'storage-read'},
            {buffer: sceneBounds, usage: 'storage-read'},
            {buffer: geometryMortonKeys, usage: 'storage-write'},
            {buffer: geometryLocalTriangleIds, usage: 'storage-write'}
          ],
          compile: ({device}) => {
            const computation = new Computation(device, {
              id: `${props.frameIdentifier}-blas-${geometryIndex}-morton-keys-computation`,
              source: replaceShaderConstants(RAY_TRACING_BLAS_MORTON_KEYS_SHADER, {
                TRIANGLE_COUNT: geometryLayout.triangleCount,
                MINIMA_OFFSET: getViewElementOffset(geometryTriangleMinima),
                MAXIMA_OFFSET: getViewElementOffset(geometryTriangleMaxima),
                MORTON_KEYS_OFFSET: getViewElementOffset(geometryMortonKeys),
                TRIANGLE_IDS_OFFSET: getViewElementOffset(geometryLocalTriangleIds)
              }),
              shaderLayout: {
                bindings: [
                  {name: 'triangleMinima', type: 'read-only-storage', group: 0, location: 0},
                  {name: 'triangleMaxima', type: 'read-only-storage', group: 0, location: 1},
                  {name: 'sceneBounds', type: 'read-only-storage', group: 0, location: 2},
                  {name: 'mortonKeys', type: 'storage', group: 0, location: 3},
                  {name: 'triangleIds', type: 'storage', group: 0, location: 4}
                ]
              }
            });
            return {
              encode: ({computePass, getBuffer}) => {
                computation.setBindings({
                  triangleMinima: getViewBinding(geometryTriangleMinima, getBuffer),
                  triangleMaxima: getViewBinding(geometryTriangleMaxima, getBuffer),
                  sceneBounds: getViewBinding(sceneBounds, getBuffer),
                  mortonKeys: getViewBinding(geometryMortonKeys, getBuffer),
                  triangleIds: getViewBinding(geometryLocalTriangleIds, getBuffer)
                });
                computation.dispatch(computePass, Math.ceil(geometryLayout.triangleCount / 128));
              },
              destroy: () => computation.destroy()
            };
          }
        });

        if (usesSegmentedSort) {
          const segmentOffset = geometryLayout.blasTriangleIdStart;
          localSortSegments.push({
            keysOffset: segmentOffset,
            valuesOffset: segmentOffset,
            outputKeysOffset: segmentOffset,
            outputValuesOffset: segmentOffset,
            length: geometryLayout.triangleCount
          });
        } else {
          new GPUSort({
            id: `${props.frameIdentifier}-blas-${geometryIndex}-sort-triangle-morton-keys`,
            keys: geometryMortonKeys,
            values: geometryLocalTriangleIds,
            outputKeys: geometrySortedMortonKeys,
            outputValues: geometrySortedTriangleIds
          }).addToGraph(graph);
        }

        const addGatherPass = (): void => {
          graph.addComputePass({
            id: `${props.frameIdentifier}-blas-${geometryIndex}-gather-sorted-bounds`,
            resources: [
              {buffer: geometryTriangleMinima, usage: 'storage-read'},
              {buffer: geometryTriangleMaxima, usage: 'storage-read'},
              {buffer: geometrySortedTriangleIds, usage: 'storage-read'},
              {buffer: geometrySortedMinima, usage: 'storage-write'},
              {buffer: geometrySortedMaxima, usage: 'storage-write'}
            ],
            compile: ({device}) => {
              const computation = new Computation(device, {
                id: `${props.frameIdentifier}-blas-${geometryIndex}-gather-sorted-bounds-computation`,
                source: replaceShaderConstants(RAY_TRACING_BLAS_GATHER_SORTED_BOUNDS_SHADER, {
                  TRIANGLE_COUNT: geometryLayout.triangleCount,
                  MINIMA_OFFSET: getViewElementOffset(geometryTriangleMinima),
                  MAXIMA_OFFSET: getViewElementOffset(geometryTriangleMaxima),
                  SORTED_TRIANGLE_IDS_OFFSET: getViewElementOffset(geometrySortedTriangleIds),
                  SORTED_MINIMA_OFFSET: getViewElementOffset(geometrySortedMinima),
                  SORTED_MAXIMA_OFFSET: getViewElementOffset(geometrySortedMaxima)
                }),
                shaderLayout: {
                  bindings: [
                    {name: 'triangleMinima', type: 'read-only-storage', group: 0, location: 0},
                    {name: 'triangleMaxima', type: 'read-only-storage', group: 0, location: 1},
                    {name: 'sortedTriangleIds', type: 'read-only-storage', group: 0, location: 2},
                    {name: 'sortedMinima', type: 'storage', group: 0, location: 3},
                    {name: 'sortedMaxima', type: 'storage', group: 0, location: 4}
                  ]
                }
              });
              return {
                encode: ({computePass, getBuffer}) => {
                  computation.setBindings({
                    triangleMinima: getViewBinding(geometryTriangleMinima, getBuffer),
                    triangleMaxima: getViewBinding(geometryTriangleMaxima, getBuffer),
                    sortedTriangleIds: getViewBinding(geometrySortedTriangleIds, getBuffer),
                    sortedMinima: getViewBinding(geometrySortedMinima, getBuffer),
                    sortedMaxima: getViewBinding(geometrySortedMaxima, getBuffer)
                  });
                  computation.dispatch(computePass, Math.ceil(geometryLayout.triangleCount / 128));
                },
                destroy: () => computation.destroy()
              };
            }
          });
        };

        const addHierarchyPass = (): void => {
          const blas = new GPUBVH({
            id: `${props.frameIdentifier}-blas-${geometryIndex}-bvh`,
            minima: geometrySortedMinima,
            maxima: geometrySortedMaxima,
            leafCapacity: geometryLayout.blasLeafCapacity,
            nodeMinima: geometryNodeMinima,
            nodeMaxima: geometryNodeMaxima,
            nodeChildren: geometryNodeChildren,
            leafIds: geometryLeafIds,
            count,
            overflow
          });
          blas.addToGraph(graph);
        };

        const addPackPass = (): void => {
          graph.addComputePass({
            id: `${props.frameIdentifier}-blas-${geometryIndex}-pack-nodes`,
            resources: [
              {buffer: geometryNodeMinima, usage: 'storage-read'},
              {buffer: geometryNodeMaxima, usage: 'storage-read'},
              {buffer: geometryPackedNodes, usage: 'storage-write'}
            ],
            compile: ({device}) => {
              const computation = new Computation(device, {
                id: `${props.frameIdentifier}-blas-${geometryIndex}-pack-nodes-computation`,
                source: replaceShaderConstants(RAY_TRACING_BLAS_PACK_NODES_SHADER, {
                  NODE_COUNT: geometryNodeCount,
                  NODE_MINIMA_OFFSET: getViewElementOffset(geometryNodeMinima),
                  NODE_MAXIMA_OFFSET: getViewElementOffset(geometryNodeMaxima),
                  PACKED_NODES_OFFSET: getViewElementOffset(geometryPackedNodes)
                }),
                shaderLayout: {
                  bindings: [
                    {name: 'nodeMinima', type: 'read-only-storage', group: 0, location: 0},
                    {name: 'nodeMaxima', type: 'read-only-storage', group: 0, location: 1},
                    {name: 'packedNodes', type: 'storage', group: 0, location: 2}
                  ]
                }
              });
              return {
                encode: ({computePass, getBuffer}) => {
                  computation.setBindings({
                    nodeMinima: getViewBinding(geometryNodeMinima, getBuffer),
                    nodeMaxima: getViewBinding(geometryNodeMaxima, getBuffer),
                    packedNodes: getViewBinding(geometryPackedNodes, getBuffer)
                  });
                  computation.dispatch(computePass, Math.ceil(geometryNodeCount / 128));
                },
                destroy: () => computation.destroy()
              };
            }
          });
        };

        if (usesSegmentedSort) {
          const usesSegmentedHierarchy = geometryLayout.blasLeafCapacity <= 128;
          if (usesSegmentedHierarchy) {
            localHierarchySegments.push({
              sourceOffset: geometryLayout.triangleStart,
              sourceCount: geometryLayout.triangleCount,
              nodeOffset: geometryLayout.blasNodeStart,
              leafOffset: geometryLayout.blasTriangleIdStart,
              metadataOffset: geometryIndex,
              leafCapacity: geometryLayout.blasLeafCapacity
            });
          }
          deferredHierarchyPasses.push({
            addGatherPass,
            addHierarchyPass,
            addPackPass,
            usesSegmentedHierarchy
          });
        } else {
          addGatherPass();
          addHierarchyPass();
          addPackPass();
        }
      }
    }

    if (localSortSegments.length > 0) {
      new GPUSegmentedSort({
        id: `${props.frameIdentifier}-blas-sort-triangle-morton-keys`,
        keys: mortonKeys,
        values: localTriangleIds,
        outputKeys: sortedMortonKeys,
        outputValues: sortedTriangleIds,
        segments: localSortSegments
      }).addToGraph(graph);

      for (const hierarchyPasses of deferredHierarchyPasses) {
        hierarchyPasses.addGatherPass();
      }

      if (localHierarchySegments.length > 0) {
        new GPUSegmentedBVH({
          id: `${props.frameIdentifier}-blas-bvh`,
          minima: sortedMinima,
          maxima: sortedMaxima,
          nodeMinima,
          nodeMaxima,
          nodeChildren,
          leafIds,
          counts: blasCounts,
          overflows: blasOverflows,
          segments: localHierarchySegments
        }).addToGraph(graph);
      }

      for (const hierarchyPasses of deferredHierarchyPasses) {
        if (!hierarchyPasses.usesSegmentedHierarchy) {
          hierarchyPasses.addHierarchyPass();
        }
        hierarchyPasses.addPackPass();
      }
    }

    return graph.compile();
  }

  private createAccelerationGraph(props: {
    frameIdentifier: string;
    uniformBuffer: Buffer;
    primitiveBuffer: Buffer;
    blasNodesBuffer: Buffer;
    primitiveCapacity: number;
    leafCapacity: number;
    nodeMinimaBuffer: Buffer;
    nodeMaximaBuffer: Buffer;
    nodeChildrenBuffer: Buffer;
    leafIdsBuffer: Buffer;
    sortedPrimitiveIdsBuffer: Buffer;
    bvhCountBuffer: Buffer;
    bvhOverflowBuffer: Buffer;
  }): CompiledGPUCommandGraph {
    const graph = new GPUCommandGraph(this.device, {
      id: `scene-${props.frameIdentifier}-ray-tracing-acceleration`
    });
    const uniforms = graph.importBuffer(
      {
        id: 'uniforms',
        byteLength: props.uniformBuffer.byteLength,
        usage: props.uniformBuffer.usage
      },
      props.uniformBuffer
    );
    const primitives = graph.importBuffer(
      {
        id: 'primitives',
        byteLength: props.primitiveBuffer.byteLength,
        usage: props.primitiveBuffer.usage
      },
      props.primitiveBuffer
    );
    const blasNodes = graph.importBuffer(
      {
        id: 'blas-nodes',
        byteLength: props.blasNodesBuffer.byteLength,
        usage: props.blasNodesBuffer.usage
      },
      props.blasNodesBuffer
    );
    const primitiveMinima: GraphDataView<'float32x3'> = createTransientView(
      graph,
      'primitive-minima',
      'float32x3',
      props.primitiveCapacity
    );
    const primitiveMaxima: GraphDataView<'float32x3'> = createTransientView(
      graph,
      'primitive-maxima',
      'float32x3',
      props.primitiveCapacity
    );
    const sceneBounds: GraphDataView<'uint32'> = createTransientView(
      graph,
      'scene-bounds',
      'uint32',
      6
    );
    const mortonKeys: GraphDataView<'uint32'> = createTransientView(
      graph,
      'primitive-morton-keys',
      'uint32',
      props.primitiveCapacity
    );
    const primitiveIds: GraphDataView<'uint32'> = createTransientView(
      graph,
      'primitive-ids',
      'uint32',
      props.primitiveCapacity
    );
    const sortedMortonKeys: GraphDataView<'uint32'> = createTransientView(
      graph,
      'sorted-primitive-morton-keys',
      'uint32',
      props.primitiveCapacity
    );
    const sortedPrimitiveIds: GraphDataView<'uint32'> = createImportedView(
      graph,
      'sorted-primitive-ids',
      props.sortedPrimitiveIdsBuffer,
      'uint32',
      props.primitiveCapacity
    );
    const sortedMinima: GraphDataView<'float32x3'> = createTransientView(
      graph,
      'sorted-primitive-minima',
      'float32x3',
      props.primitiveCapacity
    );
    const sortedMaxima: GraphDataView<'float32x3'> = createTransientView(
      graph,
      'sorted-primitive-maxima',
      'float32x3',
      props.primitiveCapacity
    );
    const nodeCount = props.leafCapacity * 2 - 1;
    const nodeMinima = createImportedView(
      graph,
      'node-minima',
      props.nodeMinimaBuffer,
      'float32x3',
      nodeCount
    );
    const nodeMaxima = createImportedView(
      graph,
      'node-maxima',
      props.nodeMaximaBuffer,
      'float32x3',
      nodeCount
    );
    const nodeChildren = createImportedView(
      graph,
      'node-children',
      props.nodeChildrenBuffer,
      'uint32x2',
      nodeCount
    );
    const leafIds = createImportedView(
      graph,
      'leaf-ids',
      props.leafIdsBuffer,
      'uint32',
      props.leafCapacity
    );
    const acceleration = new GPUBVH({
      id: `${props.frameIdentifier}-ray-tracing-bvh`,
      minima: sortedMinima,
      maxima: sortedMaxima,
      leafCapacity: props.leafCapacity,
      nodeMinima,
      nodeMaxima,
      nodeChildren,
      leafIds,
      count: createImportedView(graph, 'bvh-count', props.bvhCountBuffer, 'uint32', 1),
      overflow: createImportedView(graph, 'bvh-overflow', props.bvhOverflowBuffer, 'uint32', 1)
    });

    graph.addComputePass({
      id: `${props.frameIdentifier}-build-primitive-bounds`,
      resources: [
        {buffer: uniforms, usage: 'uniform'},
        {buffer: primitives, usage: 'storage-read'},
        {buffer: primitiveMinima, usage: 'storage-write'},
        {buffer: primitiveMaxima, usage: 'storage-write'},
        {buffer: blasNodes, usage: 'storage-read'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: `${props.frameIdentifier}-primitive-bounds-computation`,
          source: RAY_TRACING_BOUNDS_SHADER,
          shaderLayout: {
            bindings: [
              {name: 'uniforms', type: 'uniform', group: 0, location: 0},
              {name: 'primitives', type: 'read-only-storage', group: 0, location: 1},
              {name: 'primitiveMinima', type: 'storage', group: 0, location: 2},
              {name: 'primitiveMaxima', type: 'storage', group: 0, location: 3},
              {name: 'blasNodes', type: 'read-only-storage', group: 0, location: 4}
            ]
          }
        });
        return {
          encode: ({computePass, getBuffer}) => {
            computation.setBindings({
              uniforms: getBuffer(uniforms),
              primitives: getBuffer(primitives),
              primitiveMinima: getViewBinding(primitiveMinima, getBuffer),
              primitiveMaxima: getViewBinding(primitiveMaxima, getBuffer),
              blasNodes: getBuffer(blasNodes)
            });
            computation.dispatch(computePass, Math.ceil(props.primitiveCapacity / 128));
          },
          destroy: () => computation.destroy()
        };
      }
    });

    graph.addComputePass({
      id: `${props.frameIdentifier}-initialize-scene-bounds`,
      resources: [{buffer: sceneBounds, usage: 'storage-write'}],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: `${props.frameIdentifier}-scene-bounds-initialize-computation`,
          source: RAY_TRACING_SCENE_BOUNDS_INITIALIZE_SHADER,
          shaderLayout: {
            bindings: [{name: 'sceneBounds', type: 'storage', group: 0, location: 0}]
          }
        });
        return {
          encode: ({computePass, getBuffer}) => {
            computation.setBindings({
              sceneBounds: getViewBinding(sceneBounds, getBuffer)
            });
            computation.dispatch(computePass, 1);
          },
          destroy: () => computation.destroy()
        };
      }
    });

    graph.addComputePass({
      id: `${props.frameIdentifier}-reduce-scene-bounds`,
      resources: [
        {buffer: primitiveMinima, usage: 'storage-read'},
        {buffer: primitiveMaxima, usage: 'storage-read'},
        {buffer: sceneBounds, usage: 'storage-read-write'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: `${props.frameIdentifier}-scene-bounds-reduce-computation`,
          source: RAY_TRACING_SCENE_BOUNDS_REDUCE_SHADER.replace(
            '__PRIMITIVE_CAPACITY__',
            String(props.primitiveCapacity)
          ),
          shaderLayout: {
            bindings: [
              {name: 'primitiveMinima', type: 'read-only-storage', group: 0, location: 0},
              {name: 'primitiveMaxima', type: 'read-only-storage', group: 0, location: 1},
              {name: 'sceneBounds', type: 'storage', group: 0, location: 2}
            ]
          }
        });
        return {
          encode: ({computePass, getBuffer}) => {
            computation.setBindings({
              primitiveMinima: getViewBinding(primitiveMinima, getBuffer),
              primitiveMaxima: getViewBinding(primitiveMaxima, getBuffer),
              sceneBounds: getViewBinding(sceneBounds, getBuffer)
            });
            computation.dispatch(computePass, Math.ceil(props.primitiveCapacity / 128));
          },
          destroy: () => computation.destroy()
        };
      }
    });

    graph.addComputePass({
      id: `${props.frameIdentifier}-build-morton-keys`,
      resources: [
        {buffer: primitiveMinima, usage: 'storage-read'},
        {buffer: primitiveMaxima, usage: 'storage-read'},
        {buffer: sceneBounds, usage: 'storage-read'},
        {buffer: mortonKeys, usage: 'storage-write'},
        {buffer: primitiveIds, usage: 'storage-write'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: `${props.frameIdentifier}-morton-keys-computation`,
          source: RAY_TRACING_MORTON_KEYS_SHADER.replace(
            '__PRIMITIVE_CAPACITY__',
            String(props.primitiveCapacity)
          ),
          shaderLayout: {
            bindings: [
              {name: 'primitiveMinima', type: 'read-only-storage', group: 0, location: 0},
              {name: 'primitiveMaxima', type: 'read-only-storage', group: 0, location: 1},
              {name: 'sceneBounds', type: 'read-only-storage', group: 0, location: 2},
              {name: 'mortonKeys', type: 'storage', group: 0, location: 3},
              {name: 'primitiveIds', type: 'storage', group: 0, location: 4}
            ]
          }
        });
        return {
          encode: ({computePass, getBuffer}) => {
            computation.setBindings({
              primitiveMinima: getViewBinding(primitiveMinima, getBuffer),
              primitiveMaxima: getViewBinding(primitiveMaxima, getBuffer),
              sceneBounds: getViewBinding(sceneBounds, getBuffer),
              mortonKeys: getViewBinding(mortonKeys, getBuffer),
              primitiveIds: getViewBinding(primitiveIds, getBuffer)
            });
            computation.dispatch(computePass, Math.ceil(props.primitiveCapacity / 128));
          },
          destroy: () => computation.destroy()
        };
      }
    });

    new GPUSort({
      id: `${props.frameIdentifier}-sort-primitive-morton-keys`,
      keys: mortonKeys,
      values: primitiveIds,
      outputKeys: sortedMortonKeys,
      outputValues: sortedPrimitiveIds
    }).addToGraph(graph);

    graph.addComputePass({
      id: `${props.frameIdentifier}-gather-sorted-bounds`,
      resources: [
        {buffer: primitiveMinima, usage: 'storage-read'},
        {buffer: primitiveMaxima, usage: 'storage-read'},
        {buffer: sortedPrimitiveIds, usage: 'storage-read'},
        {buffer: sortedMinima, usage: 'storage-write'},
        {buffer: sortedMaxima, usage: 'storage-write'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: `${props.frameIdentifier}-gather-sorted-bounds-computation`,
          source: RAY_TRACING_GATHER_SORTED_BOUNDS_SHADER.replace(
            '__PRIMITIVE_CAPACITY__',
            String(props.primitiveCapacity)
          ),
          shaderLayout: {
            bindings: [
              {name: 'primitiveMinima', type: 'read-only-storage', group: 0, location: 0},
              {name: 'primitiveMaxima', type: 'read-only-storage', group: 0, location: 1},
              {name: 'sortedPrimitiveIds', type: 'read-only-storage', group: 0, location: 2},
              {name: 'sortedMinima', type: 'storage', group: 0, location: 3},
              {name: 'sortedMaxima', type: 'storage', group: 0, location: 4}
            ]
          }
        });
        return {
          encode: ({computePass, getBuffer}) => {
            computation.setBindings({
              primitiveMinima: getViewBinding(primitiveMinima, getBuffer),
              primitiveMaxima: getViewBinding(primitiveMaxima, getBuffer),
              sortedPrimitiveIds: getViewBinding(sortedPrimitiveIds, getBuffer),
              sortedMinima: getViewBinding(sortedMinima, getBuffer),
              sortedMaxima: getViewBinding(sortedMaxima, getBuffer)
            });
            computation.dispatch(computePass, Math.ceil(props.primitiveCapacity / 128));
          },
          destroy: () => computation.destroy()
        };
      }
    });

    acceleration.addToGraph(graph);

    return graph.compile();
  }

  private createRefitGraph(props: {
    frameIdentifier: string;
    uniformBuffer: Buffer;
    primitiveBuffer: Buffer;
    blasNodesBuffer: Buffer;
    primitiveCapacity: number;
    leafCapacity: number;
    nodeMinimaBuffer: Buffer;
    nodeMaximaBuffer: Buffer;
    nodeChildrenBuffer: Buffer;
    leafIdsBuffer: Buffer;
    sortedPrimitiveIdsBuffer: Buffer;
    bvhCountBuffer: Buffer;
    bvhOverflowBuffer: Buffer;
  }): CompiledGPUCommandGraph {
    const graph = new GPUCommandGraph(this.device, {
      id: `scene-${props.frameIdentifier}-ray-tracing-refit`
    });
    const uniforms = graph.importBuffer(
      {
        id: 'uniforms',
        byteLength: props.uniformBuffer.byteLength,
        usage: props.uniformBuffer.usage
      },
      props.uniformBuffer
    );
    const primitives = graph.importBuffer(
      {
        id: 'primitives',
        byteLength: props.primitiveBuffer.byteLength,
        usage: props.primitiveBuffer.usage
      },
      props.primitiveBuffer
    );
    const blasNodes = graph.importBuffer(
      {
        id: 'blas-nodes',
        byteLength: props.blasNodesBuffer.byteLength,
        usage: props.blasNodesBuffer.usage
      },
      props.blasNodesBuffer
    );
    const primitiveMinima: GraphDataView<'float32x3'> = createTransientView(
      graph,
      'primitive-minima',
      'float32x3',
      props.primitiveCapacity
    );
    const primitiveMaxima: GraphDataView<'float32x3'> = createTransientView(
      graph,
      'primitive-maxima',
      'float32x3',
      props.primitiveCapacity
    );
    const sortedPrimitiveIds: GraphDataView<'uint32'> = createImportedView(
      graph,
      'sorted-primitive-ids',
      props.sortedPrimitiveIdsBuffer,
      'uint32',
      props.primitiveCapacity
    );
    const sortedMinima: GraphDataView<'float32x3'> = createTransientView(
      graph,
      'sorted-primitive-minima',
      'float32x3',
      props.primitiveCapacity
    );
    const sortedMaxima: GraphDataView<'float32x3'> = createTransientView(
      graph,
      'sorted-primitive-maxima',
      'float32x3',
      props.primitiveCapacity
    );
    const nodeCount = props.leafCapacity * 2 - 1;
    const nodeMinima = createImportedView(
      graph,
      'node-minima',
      props.nodeMinimaBuffer,
      'float32x3',
      nodeCount
    );
    const nodeMaxima = createImportedView(
      graph,
      'node-maxima',
      props.nodeMaximaBuffer,
      'float32x3',
      nodeCount
    );
    const nodeChildren = createImportedView(
      graph,
      'node-children',
      props.nodeChildrenBuffer,
      'uint32x2',
      nodeCount
    );
    const leafIds = createImportedView(
      graph,
      'leaf-ids',
      props.leafIdsBuffer,
      'uint32',
      props.leafCapacity
    );
    const refit = new GPUBVH({
      id: `${props.frameIdentifier}-ray-tracing-refit-bvh`,
      minima: sortedMinima,
      maxima: sortedMaxima,
      leafCapacity: props.leafCapacity,
      nodeMinima,
      nodeMaxima,
      nodeChildren,
      leafIds,
      count: createImportedView(graph, 'bvh-count', props.bvhCountBuffer, 'uint32', 1),
      overflow: createImportedView(graph, 'bvh-overflow', props.bvhOverflowBuffer, 'uint32', 1)
    });

    graph.addComputePass({
      id: `${props.frameIdentifier}-refit-primitive-bounds`,
      resources: [
        {buffer: uniforms, usage: 'uniform'},
        {buffer: primitives, usage: 'storage-read'},
        {buffer: primitiveMinima, usage: 'storage-write'},
        {buffer: primitiveMaxima, usage: 'storage-write'},
        {buffer: blasNodes, usage: 'storage-read'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: `${props.frameIdentifier}-refit-primitive-bounds-computation`,
          source: RAY_TRACING_BOUNDS_SHADER,
          shaderLayout: {
            bindings: [
              {name: 'uniforms', type: 'uniform', group: 0, location: 0},
              {name: 'primitives', type: 'read-only-storage', group: 0, location: 1},
              {name: 'primitiveMinima', type: 'storage', group: 0, location: 2},
              {name: 'primitiveMaxima', type: 'storage', group: 0, location: 3},
              {name: 'blasNodes', type: 'read-only-storage', group: 0, location: 4}
            ]
          }
        });
        return {
          encode: ({computePass, getBuffer}) => {
            computation.setBindings({
              uniforms: getBuffer(uniforms),
              primitives: getBuffer(primitives),
              primitiveMinima: getViewBinding(primitiveMinima, getBuffer),
              primitiveMaxima: getViewBinding(primitiveMaxima, getBuffer),
              blasNodes: getBuffer(blasNodes)
            });
            computation.dispatch(computePass, Math.ceil(props.primitiveCapacity / 128));
          },
          destroy: () => computation.destroy()
        };
      }
    });

    graph.addComputePass({
      id: `${props.frameIdentifier}-refit-gather-sorted-bounds`,
      resources: [
        {buffer: primitiveMinima, usage: 'storage-read'},
        {buffer: primitiveMaxima, usage: 'storage-read'},
        {buffer: sortedPrimitiveIds, usage: 'storage-read'},
        {buffer: sortedMinima, usage: 'storage-write'},
        {buffer: sortedMaxima, usage: 'storage-write'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: `${props.frameIdentifier}-refit-gather-sorted-bounds-computation`,
          source: RAY_TRACING_GATHER_SORTED_BOUNDS_SHADER.replace(
            '__PRIMITIVE_CAPACITY__',
            String(props.primitiveCapacity)
          ),
          shaderLayout: {
            bindings: [
              {name: 'primitiveMinima', type: 'read-only-storage', group: 0, location: 0},
              {name: 'primitiveMaxima', type: 'read-only-storage', group: 0, location: 1},
              {name: 'sortedPrimitiveIds', type: 'read-only-storage', group: 0, location: 2},
              {name: 'sortedMinima', type: 'storage', group: 0, location: 3},
              {name: 'sortedMaxima', type: 'storage', group: 0, location: 4}
            ]
          }
        });
        return {
          encode: ({computePass, getBuffer}) => {
            computation.setBindings({
              primitiveMinima: getViewBinding(primitiveMinima, getBuffer),
              primitiveMaxima: getViewBinding(primitiveMaxima, getBuffer),
              sortedPrimitiveIds: getViewBinding(sortedPrimitiveIds, getBuffer),
              sortedMinima: getViewBinding(sortedMinima, getBuffer),
              sortedMaxima: getViewBinding(sortedMaxima, getBuffer)
            });
            computation.dispatch(computePass, Math.ceil(props.primitiveCapacity / 128));
          },
          destroy: () => computation.destroy()
        };
      }
    });

    refit.addToGraph(graph);

    return graph.compile();
  }

  private createTraceGraph(props: {
    frameIdentifier: string;
    internalWidth: number;
    internalHeight: number;
    presentation: RayTracingPresentationOptions;
    uniformBuffer: Buffer;
    primitiveBuffer: Buffer;
    triangleBuffer: Buffer;
    lightBuffer: Buffer;
    nodeMinimaBuffer: Buffer;
    nodeMaximaBuffer: Buffer;
    sortedPrimitiveIdsBuffer: Buffer;
    blasNodesBuffer: Buffer;
    blasTriangleIdsBuffer: Buffer;
    colorHistory: GPUTextureHistory;
    metadataHistory: GPUTextureHistory;
  }): CompiledGPUCommandGraph<RayTracingTraceGraphParameters> {
    const graph = new GPUCommandGraph<RayTracingTraceGraphParameters>(this.device, {
      id: `scene-${props.frameIdentifier}-ray-tracing-trace`
    });
    const uniforms = graph.importBuffer(
      {
        id: 'uniforms',
        byteLength: props.uniformBuffer.byteLength,
        usage: props.uniformBuffer.usage
      },
      props.uniformBuffer
    );
    const primitives = graph.importBuffer(
      {
        id: 'primitives',
        byteLength: props.primitiveBuffer.byteLength,
        usage: props.primitiveBuffer.usage
      },
      props.primitiveBuffer
    );
    const triangles = graph.importBuffer(
      {
        id: 'triangles',
        byteLength: props.triangleBuffer.byteLength,
        usage: props.triangleBuffer.usage
      },
      props.triangleBuffer
    );
    const lights = graph.importBuffer(
      {id: 'lights', byteLength: props.lightBuffer.byteLength, usage: props.lightBuffer.usage},
      props.lightBuffer
    );
    const nodeCount = Math.max(
      1,
      Math.floor(props.nodeMinimaBuffer.byteLength / (3 * Float32Array.BYTES_PER_ELEMENT))
    );
    const nodeMinima = createImportedView(
      graph,
      'node-minima',
      props.nodeMinimaBuffer,
      'float32x3',
      nodeCount
    );
    const nodeMaxima = createImportedView(
      graph,
      'node-maxima',
      props.nodeMaximaBuffer,
      'float32x3',
      nodeCount
    );
    const leafPrimitiveIds = createImportedView(
      graph,
      'leaf-primitive-ids',
      props.sortedPrimitiveIdsBuffer,
      'uint32',
      Math.max(
        1,
        Math.floor(props.sortedPrimitiveIdsBuffer.byteLength / Uint32Array.BYTES_PER_ELEMENT)
      )
    );
    const blasNodes = createImportedView(
      graph,
      'blas-nodes',
      props.blasNodesBuffer,
      'float32x4',
      Math.max(
        1,
        Math.floor(props.blasNodesBuffer.byteLength / (4 * Float32Array.BYTES_PER_ELEMENT))
      )
    );
    const blasTriangleIds = createImportedView(
      graph,
      'blas-triangle-ids',
      props.blasTriangleIdsBuffer,
      'uint32',
      Math.max(
        1,
        Math.floor(props.blasTriangleIdsBuffer.byteLength / Uint32Array.BYTES_PER_ELEMENT)
      )
    );
    const history = graph.importTexture(
      {
        id: 'history',
        format: 'rgba16float',
        width: props.internalWidth,
        height: props.internalHeight,
        usage: Texture.SAMPLE | Texture.STORAGE
      },
      props.colorHistory.previousTexture
    );
    const historyMetadata = graph.importTexture(
      {
        id: 'history-metadata',
        format: 'rgba16float',
        width: props.internalWidth,
        height: props.internalHeight,
        usage: Texture.SAMPLE | Texture.STORAGE
      },
      props.metadataHistory.previousTexture
    );
    const output = graph.importTexture(
      {
        id: 'output',
        format: 'rgba16float',
        width: props.internalWidth,
        height: props.internalHeight,
        usage: Texture.SAMPLE | Texture.STORAGE
      },
      props.colorHistory.currentTexture
    );
    const outputMetadata = graph.importTexture(
      {
        id: 'output-metadata',
        format: 'rgba16float',
        width: props.internalWidth,
        height: props.internalHeight,
        usage: Texture.SAMPLE | Texture.STORAGE
      },
      props.metadataHistory.currentTexture
    );
    const historyView = graph.createTextureView(history);
    const historyMetadataView = graph.createTextureView(historyMetadata);
    const outputView = graph.createTextureView(output);
    const outputMetadataView = graph.createTextureView(outputMetadata);

    graph.addComputePass({
      id: `${props.frameIdentifier}-carry-ray-tracing-history`,
      resources: [
        {buffer: uniforms, usage: 'uniform'},
        {texture: historyView, usage: 'sampled'},
        {texture: historyMetadataView, usage: 'sampled'},
        {texture: outputView, usage: 'storage-write'},
        {texture: outputMetadataView, usage: 'storage-write'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: `${props.frameIdentifier}-ray-tracing-history-carry-computation`,
          source: RAY_TRACING_HISTORY_CARRY_SHADER,
          shaderLayout: {
            bindings: [
              {name: 'uniforms', type: 'uniform', group: 0, location: 0},
              {
                name: 'historyImage',
                type: 'texture',
                group: 0,
                location: 1,
                sampleType: 'unfilterable-float'
              },
              {
                name: 'historyMetadata',
                type: 'texture',
                group: 0,
                location: 2,
                sampleType: 'unfilterable-float'
              },
              {
                name: 'outputImage',
                type: 'storage',
                group: 0,
                location: 3,
                access: 'write-only',
                format: 'rgba16float'
              },
              {
                name: 'outputMetadata',
                type: 'storage',
                group: 0,
                location: 4,
                access: 'write-only',
                format: 'rgba16float'
              }
            ]
          }
        });
        return {
          encode: ({computePass, getBuffer, getTextureView, parameters}) => {
            if (parameters.carryWidth === 0) {
              return;
            }
            computation.setBindings({
              uniforms: getBuffer(uniforms),
              historyImage: getTextureView(historyView),
              historyMetadata: getTextureView(historyMetadataView),
              outputImage: getTextureView(outputView),
              outputMetadata: getTextureView(outputMetadataView)
            });
            computation.dispatch(
              computePass,
              Math.ceil(parameters.carryWidth / 8),
              Math.ceil(props.internalHeight / 8),
              1
            );
          },
          destroy: () => computation.destroy()
        };
      }
    });

    graph.addComputePass({
      id: `${props.frameIdentifier}-trace-rays`,
      resources: [
        {buffer: uniforms, usage: 'uniform'},
        {buffer: primitives, usage: 'storage-read'},
        {buffer: triangles, usage: 'storage-read'},
        {buffer: lights, usage: 'storage-read'},
        {buffer: nodeMinima, usage: 'storage-read'},
        {buffer: nodeMaxima, usage: 'storage-read'},
        {buffer: leafPrimitiveIds, usage: 'storage-read'},
        {buffer: blasNodes, usage: 'storage-read'},
        {buffer: blasTriangleIds, usage: 'storage-read'},
        {texture: historyView, usage: 'sampled'},
        {texture: historyMetadataView, usage: 'sampled'},
        {texture: outputView, usage: 'storage-write'},
        {texture: outputMetadataView, usage: 'storage-write'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: `${props.frameIdentifier}-ray-tracing-computation`,
          source: RAY_TRACING_SCENE_SHADER,
          shaderLayout: {
            bindings: [
              {name: 'uniforms', type: 'uniform', group: 0, location: 0},
              {name: 'primitives', type: 'read-only-storage', group: 0, location: 1},
              {name: 'triangles', type: 'read-only-storage', group: 0, location: 2},
              {name: 'lights', type: 'read-only-storage', group: 0, location: 3},
              {name: 'nodeMinima', type: 'read-only-storage', group: 0, location: 4},
              {name: 'nodeMaxima', type: 'read-only-storage', group: 0, location: 5},
              {name: 'leafPrimitiveIds', type: 'read-only-storage', group: 0, location: 6},
              {name: 'blasNodes', type: 'read-only-storage', group: 0, location: 7},
              {name: 'blasTriangleIds', type: 'read-only-storage', group: 0, location: 8},
              {
                name: 'historyImage',
                type: 'texture',
                group: 0,
                location: 9,
                sampleType: 'unfilterable-float'
              },
              {
                name: 'historyMetadata',
                type: 'texture',
                group: 0,
                location: 10,
                sampleType: 'unfilterable-float'
              },
              {
                name: 'outputImage',
                type: 'storage',
                group: 0,
                location: 11,
                access: 'write-only',
                format: 'rgba16float'
              },
              {
                name: 'outputMetadata',
                type: 'storage',
                group: 0,
                location: 12,
                access: 'write-only',
                format: 'rgba16float'
              }
            ]
          }
        });
        return {
          encode: ({computePass, getBuffer, getTextureView, parameters}) => {
            computation.setBindings({
              uniforms: getBuffer(uniforms),
              primitives: getBuffer(primitives),
              triangles: getBuffer(triangles),
              lights: getBuffer(lights),
              nodeMinima: getViewBinding(nodeMinima, getBuffer),
              nodeMaxima: getViewBinding(nodeMaxima, getBuffer),
              leafPrimitiveIds: getViewBinding(leafPrimitiveIds, getBuffer),
              blasNodes: getViewBinding(blasNodes, getBuffer),
              blasTriangleIds: getViewBinding(blasTriangleIds, getBuffer),
              historyImage: getTextureView(historyView),
              historyMetadata: getTextureView(historyMetadataView),
              outputImage: getTextureView(outputView),
              outputMetadata: getTextureView(outputMetadataView)
            });
            computation.dispatch(
              computePass,
              Math.ceil(parameters.dispatchWidth / 8),
              Math.ceil(props.internalHeight / 8),
              1
            );
          },
          destroy: () => computation.destroy()
        };
      }
    });

    graph.addRenderPass({
      id: `${props.frameIdentifier}-present-ray-tracing`,
      resources: [{texture: outputView, usage: 'sampled'}],
      compile: ({device}) => {
        const model = new Model(device, {
          id: `${props.frameIdentifier}-ray-tracing-presentation`,
          source: getRayTracingScenePresentationShader({
            toneMapMode: props.presentation.toneMapMode,
            outputEncoding: props.presentation.outputEncoding
          }),
          vertexCount: 3,
          colorAttachmentFormats: [props.presentation.colorFormat],
          ...(props.presentation.depthStencilFormat
            ? {depthStencilAttachmentFormat: props.presentation.depthStencilFormat}
            : {}),
          shaderLayout: {
            attributes: [],
            bindings: [
              {
                name: 'image',
                type: 'texture',
                group: 0,
                location: 0,
                sampleType: 'unfilterable-float'
              }
            ]
          },
          parameters: {
            depthWriteEnabled: false,
            ...(props.presentation.depthStencilFormat ? {depthCompare: 'always'} : {})
          }
        });
        return {
          getRenderPassProps: ({parameters}) => ({
            id: `${props.frameIdentifier}-present-ray-tracing`,
            ...(parameters.framebuffer ? {framebuffer: parameters.framebuffer} : {})
          }),
          encode: ({renderPass, getTextureView}) => {
            model.setBindings({image: getTextureView(outputView)});
            model.draw(renderPass);
          },
          destroy: () => model.destroy()
        };
      }
    });

    return graph.compile();
  }
}

function getRayTracingDisplaySize(
  device: Device,
  options: RayTracingSceneRenderOptions
): [number, number] {
  if (options.framebuffer) {
    return [options.framebuffer.width, options.framebuffer.height];
  }
  if (options.width !== undefined && options.height !== undefined) {
    return [options.width, options.height];
  }
  const [defaultWidth, defaultHeight] = device.getDefaultCanvasContext().getDrawingBufferSize();
  return [options.width ?? defaultWidth, options.height ?? defaultHeight];
}

function getRayTracingPresentationOptions(
  device: Device,
  options: RayTracingSceneRenderOptions
): RayTracingPresentationOptions {
  const colorFormat =
    (options.framebuffer?.colorAttachments[0]?.texture.format as TextureFormatColor | undefined) ??
    device.preferredColorFormat;
  const formatInformation = textureFormatDecoder.getInfo(colorFormat);
  const floatingPoint = Boolean(
    formatInformation.dataType?.startsWith('float') || colorFormat.endsWith('ufloat')
  );
  const depthStencilFormat = options.framebuffer
    ? (options.framebuffer.depthStencilAttachment?.texture.format as
        | TextureFormatDepthStencil
        | undefined)
    : 'depth24plus';

  return {
    colorFormat,
    ...(depthStencilFormat ? {depthStencilFormat} : {}),
    toneMapMode:
      options.toneMapMode ??
      (floatingPoint ? PBR_TONE_MAP_MODE.NONE : PBR_TONE_MAP_MODE.KHRONOS_PBR_NEUTRAL),
    outputEncoding: options.outputColorSpace
      ? Number(options.outputColorSpace === 'srgb')
      : Number(!floatingPoint && !colorFormat.endsWith('-srgb'))
  };
}

function areRayTracingPresentationOptionsEqual(
  first: RayTracingPresentationOptions,
  second: RayTracingPresentationOptions
): boolean {
  return (
    first.colorFormat === second.colorFormat &&
    first.depthStencilFormat === second.depthStencilFormat &&
    first.toneMapMode === second.toneMapMode &&
    first.outputEncoding === second.outputEncoding
  );
}

function makeRayTracingGraphStageStatistics(
  statistics: GPUCommandGraphEncodingStats
): RayTracingGraphStageStatistics {
  return {
    nodeCount: statistics.nodeCount,
    computePassCount: statistics.computePassCount,
    coalescedComputeNodeCount: statistics.coalescedComputeNodeCount,
    cpuEncodeTimeMilliseconds: statistics.cpuEncodeTimeMilliseconds
  };
}

function makeRayTracingGraphStatistics(props: {
  topology?: GPUCommandGraphEncodingStats;
  acceleration?: GPUCommandGraphEncodingStats;
  refit?: GPUCommandGraphEncodingStats;
  trace: GPUCommandGraphEncodingStats;
}): RayTracingGraphStatistics {
  const topology = props.topology && makeRayTracingGraphStageStatistics(props.topology);
  const acceleration = props.acceleration && makeRayTracingGraphStageStatistics(props.acceleration);
  const refit = props.refit && makeRayTracingGraphStageStatistics(props.refit);
  const trace = makeRayTracingGraphStageStatistics(props.trace);
  const stages = [topology, acceleration, refit, trace].filter(
    (stage): stage is RayTracingGraphStageStatistics => Boolean(stage)
  );

  return {
    nodeCount: stages.reduce((total, stage) => total + stage.nodeCount, 0),
    computePassCount: stages.reduce((total, stage) => total + stage.computePassCount, 0),
    coalescedComputeNodeCount: stages.reduce(
      (total, stage) => total + stage.coalescedComputeNodeCount,
      0
    ),
    cpuEncodeTimeMilliseconds: stages.reduce(
      (total, stage) => total + stage.cpuEncodeTimeMilliseconds,
      0
    ),
    ...(topology ? {topology} : {}),
    ...(acceleration ? {acceleration} : {}),
    ...(refit ? {refit} : {}),
    trace
  };
}

function getMaximumSparsePrimitiveUpdateCount(resources: RayTracingFrameResources): number {
  return Math.max(1, Math.floor(resources.primitiveCount * MAXIMUM_SPARSE_PRIMITIVE_UPDATE_RATIO));
}

function getSparseTransformInstanceIds(
  options: RayTracingSceneRenderOptions,
  resources: RayTracingFrameResources,
  topologyChanged: boolean,
  transformChanged: boolean
): readonly string[] | undefined {
  const sceneRevisions = options.sceneRevisions;
  const dirtyInstanceIds = sceneRevisions?.dirtyInstanceIds;
  if (
    topologyChanged ||
    !transformChanged ||
    !sceneRevisions ||
    !dirtyInstanceIds ||
    dirtyInstanceIds.length === 0 ||
    options.surfaces !== resources.retainedSurfaces ||
    resources.materialRevision !== sceneRevisions.materials
  ) {
    return undefined;
  }

  const uniqueInstanceIds = Array.from(new Set(dirtyInstanceIds));
  if (
    uniqueInstanceIds.length > getMaximumSparsePrimitiveUpdateCount(resources) ||
    uniqueInstanceIds.some(instanceIdentifier => {
      const placement = resources.primitivePlacements.get(instanceIdentifier);
      return (
        !placement ||
        options.surfaces[placement.surfaceIndex] !== placement.surface ||
        placement.surface.instanceIds?.[placement.transformIndex] !== instanceIdentifier
      );
    })
  ) {
    return undefined;
  }
  return uniqueInstanceIds;
}

function updateSparsePrimitiveTransforms(
  resources: RayTracingFrameResources,
  changedInstanceIds: readonly string[]
): void {
  const changedInstances = new Set(changedInstanceIds);
  for (const instanceIdentifier of resources.pendingPreviousTransformInstanceIds) {
    if (changedInstances.has(instanceIdentifier)) {
      continue;
    }
    const placement = resources.primitivePlacements.get(instanceIdentifier);
    if (!placement) {
      continue;
    }
    const transform = resources.previousTransforms.get(placement.placementIdentifier);
    if (transform) {
      resources.primitiveBuffer.write(
        Float32Array.from(transform),
        (placement.primitiveIndex * PRIMITIVE_FLOAT_COUNT + 52) * Float32Array.BYTES_PER_ELEMENT
      );
    }
  }

  for (const instanceIdentifier of changedInstances) {
    const placement = resources.primitivePlacements.get(instanceIdentifier);
    if (!placement) {
      continue;
    }
    const transform = placement.surface.transforms[placement.transformIndex];
    const previousTransform =
      resources.previousTransforms.get(placement.placementIdentifier) ?? transform;
    const transformValues = new Float32Array(32);
    transformValues.set(transform);
    transformValues.set(new Matrix4(transform).invert(), 16);
    const primitiveByteOffset =
      placement.primitiveIndex * PRIMITIVE_FLOAT_COUNT * Float32Array.BYTES_PER_ELEMENT;
    resources.primitiveBuffer.write(transformValues, primitiveByteOffset);
    resources.primitiveBuffer.write(
      Float32Array.from(previousTransform),
      primitiveByteOffset + 52 * Float32Array.BYTES_PER_ELEMENT
    );
    resources.previousTransforms.set(placement.placementIdentifier, new Matrix4(transform));
  }

  resources.pendingPreviousTransformInstanceIds = changedInstances;
  resources.previousTransformsNeedCommit = changedInstances.size > 0;
}

function scheduleTransformAccelerationUpdate(resources: RayTracingFrameResources): void {
  if (resources.accelerationUpdateMode === 'rebuild') {
    return;
  }
  resources.accelerationUpdateMode =
    resources.refitsSinceMortonRebuild >= MORTON_REBUILD_REFIT_INTERVAL ? 'rebuild' : 'refit';
}

function getTopologyRevision(options: RayTracingSceneRenderOptions): string {
  if (options.sceneRevisions) {
    return `${options.sceneRevisions.identity}:${options.sceneRevisions.topology}`;
  }
  return JSON.stringify(
    options.surfaces.map(surface => [
      surface.id,
      surface.geometry.id,
      surface.geometryVersion,
      surface.transforms.length,
      surface.morphWeights,
      options.primitives?.[surface.id]
    ])
  );
}

function getPrimitiveRevision(
  options: RayTracingSceneRenderOptions,
  transformRevision: string
): string {
  if (options.sceneRevisions) {
    return `${transformRevision}:${options.sceneRevisions.materials}`;
  }
  return JSON.stringify([
    transformRevision,
    options.surfaces.map(surface => [
      surface.material.id,
      surface.material.version,
      surface.material.uniforms,
      options.primitives?.[surface.id]
    ])
  ]);
}

function getTransformRevision(options: RayTracingSceneRenderOptions): string {
  if (options.sceneRevisions) {
    return `${options.sceneRevisions.identity}:${options.sceneRevisions.transforms}`;
  }
  return JSON.stringify(
    options.surfaces.map(surface => [
      surface.id,
      surface.transforms.map(transform => Array.from(transform)),
      (surface as RayTracingSceneSurface).instanceIds
    ])
  );
}

function getLightRevision(options: RayTracingSceneRenderOptions, lights: readonly Light[]): string {
  if (options.sceneRevisions) {
    return `${options.sceneRevisions.identity}:${options.sceneRevisions.lights}`;
  }
  return JSON.stringify(lights);
}

function getRenderRevision(
  options: RayTracingSceneRenderOptions,
  inverseViewProjection: Matrix4
): string {
  // Scene adapters may recommit an unchanged camera every animation tick. Temporal mode keeps
  // ordinary camera motion out of this reset key and rejects incompatible history in the shader.
  const cameraRevision =
    (options.temporalReprojection ?? true)
      ? undefined
      : [Array.from(inverseViewProjection), Array.from(options.camera.position)];
  return JSON.stringify([
    options.cameraProjection,
    cameraRevision,
    options.background,
    options.exposure,
    options.fogColor,
    options.fogDensity,
    options.samplesPerPixel,
    options.maxBounces,
    options.progressive,
    options.shadows,
    options.temporalReprojection,
    options.shadowSamplesPerFrame
  ]);
}

function makeRayTracingTopology(
  surfaces: readonly SceneSurface[],
  primitives: Readonly<Record<string, RayTracingScenePrimitive>>,
  geometryCache: Map<string, CompiledRayGeometry>
): RayTracingTopology {
  const triangleValues: number[] = [];
  const geometryLayouts = new Map<string, RayTracingGeometryLayout>();
  let blasNodeCount = 0;
  let blasTriangleIdCount = 0;

  for (const surface of surfaces) {
    if (primitives[surface.id]?.type === 'sphere') {
      continue;
    }
    const geometryIdentifier = getGeometryIdentifier(surface);
    if (geometryLayouts.has(geometryIdentifier)) {
      continue;
    }
    const compiledGeometry = compileRayGeometry(surface, geometryCache);
    const triangleStart = triangleValues.length / TRIANGLE_FLOAT_COUNT;
    const blasLeafCapacity = getNextPowerOfTwo(Math.max(1, compiledGeometry.triangleCount));
    const geometryBlasNodeCount = blasLeafCapacity * 2 - 1;
    // Imported meshes can contain enough triangle floats to exceed the JavaScript argument
    // limit if this typed array is spread into one Array#push call.
    for (const triangleValue of compiledGeometry.triangles) {
      triangleValues.push(triangleValue);
    }
    geometryLayouts.set(geometryIdentifier, {
      triangleStart,
      triangleCount: compiledGeometry.triangleCount,
      blasNodeStart: blasNodeCount,
      blasTriangleIdStart: blasTriangleIdCount,
      blasInternalNodeCount: blasLeafCapacity - 1,
      blasLeafCapacity,
      bounds: compiledGeometry.bounds
    });
    blasNodeCount += geometryBlasNodeCount;
    blasTriangleIdCount += blasLeafCapacity;
  }

  return {
    triangles: makeStorageData(triangleValues, TRIANGLE_FLOAT_COUNT),
    geometryLayouts,
    triangleCount: triangleValues.length / TRIANGLE_FLOAT_COUNT,
    blasNodeCount,
    blasTriangleIdCount
  };
}

function makePrimitiveData(
  surfaces: readonly SceneSurface[],
  primitives: Readonly<Record<string, RayTracingScenePrimitive>>,
  geometryLayouts: Map<string, RayTracingGeometryLayout>,
  previousTransforms: Map<string, Matrix4>
): RayTracingPrimitiveData {
  const primitiveCount = surfaces.reduce(
    (surfacePrimitiveCount, surface) => surfacePrimitiveCount + surface.transforms.length,
    0
  );
  const primitiveValues = new Float32Array(Math.max(primitiveCount, 1) * PRIMITIVE_FLOAT_COUNT);
  const nextPreviousTransforms = new Map<string, Matrix4>();
  const placements = new Map<string, RayTracingPrimitivePlacement>();
  let primitiveIndex = 0;
  let triangleCount = 0;

  for (const [surfaceIndex, surface] of surfaces.entries()) {
    const primitive = primitives[surface.id];
    const sphereRadius = primitive?.type === 'sphere' ? primitive.radius : 0;
    const geometryLayout =
      sphereRadius > 0 ? undefined : geometryLayouts.get(getGeometryIdentifier(surface));
    const bounds = geometryLayout?.bounds ?? [0, 0, 0, sphereRadius];
    const materialUniforms = surface.material.uniforms;
    const baseColor = materialUniforms?.baseColorFactor ?? [0.8, 0.8, 0.8, 1];
    const emissive = materialUniforms?.emissiveFactor ?? [0, 0, 0];
    const emissiveStrength = materialUniforms?.emissiveStrength ?? 1;
    const metallicRoughness = materialUniforms?.metallicRoughnessValues ?? [0, 0.5];
    const instanceIds = (surface as RayTracingSceneSurface).instanceIds;

    for (let transformIndex = 0; transformIndex < surface.transforms.length; transformIndex++) {
      const transform = surface.transforms[transformIndex];
      const inverseTransform = new Matrix4(transform).invert();
      const instanceIdentifier = instanceIds?.[transformIndex] ?? String(transformIndex);
      const placementIdentifier = `${surface.id}:${instanceIdentifier}`;
      const previousTransform = previousTransforms.get(placementIdentifier) ?? transform;
      const primitiveOffset = primitiveIndex * PRIMITIVE_FLOAT_COUNT;
      primitiveValues.set(transform, primitiveOffset);
      primitiveValues.set(inverseTransform, primitiveOffset + 16);
      primitiveValues[primitiveOffset + 32] = baseColor[0];
      primitiveValues[primitiveOffset + 33] = baseColor[1];
      primitiveValues[primitiveOffset + 34] = baseColor[2];
      primitiveValues[primitiveOffset + 35] = baseColor[3] ?? 1;
      primitiveValues[primitiveOffset + 36] = emissive[0] * emissiveStrength;
      primitiveValues[primitiveOffset + 37] = emissive[1] * emissiveStrength;
      primitiveValues[primitiveOffset + 38] = emissive[2] * emissiveStrength;
      primitiveValues[primitiveOffset + 39] = metallicRoughness[0];
      primitiveValues[primitiveOffset + 40] = metallicRoughness[1];
      primitiveValues[primitiveOffset + 41] = sphereRadius;
      primitiveValues[primitiveOffset + 42] = geometryLayout?.triangleStart ?? 0;
      primitiveValues[primitiveOffset + 43] = geometryLayout?.triangleCount ?? 0;
      primitiveValues[primitiveOffset + 44] = bounds[0];
      primitiveValues[primitiveOffset + 45] = bounds[1];
      primitiveValues[primitiveOffset + 46] = bounds[2];
      primitiveValues[primitiveOffset + 47] = bounds[3];
      primitiveValues[primitiveOffset + 48] = geometryLayout?.blasNodeStart ?? 0;
      primitiveValues[primitiveOffset + 49] = geometryLayout?.blasTriangleIdStart ?? 0;
      primitiveValues[primitiveOffset + 50] = geometryLayout?.blasInternalNodeCount ?? 0;
      primitiveValues[primitiveOffset + 51] = geometryLayout?.blasLeafCapacity ?? 0;
      primitiveValues.set(previousTransform, primitiveOffset + 52);
      nextPreviousTransforms.set(placementIdentifier, new Matrix4(transform));
      placements.set(instanceIds?.[transformIndex] ?? placementIdentifier, {
        surface,
        surfaceIndex,
        transformIndex,
        primitiveIndex,
        placementIdentifier
      });
      primitiveIndex++;
      triangleCount += geometryLayout?.triangleCount ?? 0;
    }
  }

  return {
    primitives: primitiveValues,
    primitiveCount,
    triangleCount,
    previousTransforms: nextPreviousTransforms,
    placements
  };
}

function makeRayTracingScene(
  primitiveData: RayTracingPrimitiveData,
  triangles: Float32Array,
  lights: readonly Light[]
): RayTracingScene {
  return {
    primitives: primitiveData.primitives,
    triangles,
    lights: makeLightData(lights),
    primitiveCount: primitiveData.primitiveCount,
    lightCount: lights.length,
    triangleCount: primitiveData.triangleCount
  };
}

function compileRayGeometry(
  surface: SceneSurface,
  geometryCache: Map<string, CompiledRayGeometry>
): CompiledRayGeometry {
  const geometryIdentifier = getGeometryIdentifier(surface);
  const cachedGeometry = geometryCache.get(geometryIdentifier);
  if (cachedGeometry) {
    return cachedGeometry;
  }

  const engineGeometry = surface.geometry;
  const positions = engineGeometry.attributes['POSITION']?.value;
  const normals = engineGeometry.attributes['NORMAL']?.value;
  if (!positions || !normals) {
    throw new Error('Ray tracing scene geometry requires positions and normals.');
  }

  const triangleValues: number[] = [];
  const bounds = getGeometryBounds(engineGeometry);
  const indices = engineGeometry.indices?.value;
  const vertexCount = indices?.length ?? positions.length / 3;
  for (let vertexIndex = 0; vertexIndex + 2 < vertexCount; vertexIndex += 3) {
    for (let cornerIndex = 0; cornerIndex < 3; cornerIndex++) {
      const positionIndex =
        Number(indices?.[vertexIndex + cornerIndex] ?? vertexIndex + cornerIndex) * 3;
      triangleValues.push(
        Number(positions[positionIndex]),
        Number(positions[positionIndex + 1]),
        Number(positions[positionIndex + 2]),
        0
      );
    }
    for (let cornerIndex = 0; cornerIndex < 3; cornerIndex++) {
      const normalIndex =
        Number(indices?.[vertexIndex + cornerIndex] ?? vertexIndex + cornerIndex) * 3;
      triangleValues.push(
        Number(normals[normalIndex]),
        Number(normals[normalIndex + 1]),
        Number(normals[normalIndex + 2]),
        0
      );
    }
  }

  const compiledGeometry: CompiledRayGeometry = {
    triangles: new Float32Array(triangleValues),
    triangleCount: triangleValues.length / TRIANGLE_FLOAT_COUNT,
    bounds
  };
  geometryCache.set(geometryIdentifier, compiledGeometry);
  return compiledGeometry;
}

function getGeometryIdentifier(surface: SceneSurface): string {
  return `${surface.geometry.id}:${surface.geometryVersion ?? 0}`;
}

function getGeometryBounds(geometry: Geometry): readonly [number, number, number, number] {
  const positions = geometry.attributes['POSITION']?.value;
  if (!positions || positions.length === 0) {
    return [0, 0, 0, 0];
  }

  const minimum = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
  const maximum = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];
  for (let positionIndex = 0; positionIndex + 2 < positions.length; positionIndex += 3) {
    for (let componentIndex = 0; componentIndex < 3; componentIndex++) {
      const position = Number(positions[positionIndex + componentIndex]);
      minimum[componentIndex] = Math.min(minimum[componentIndex], position);
      maximum[componentIndex] = Math.max(maximum[componentIndex], position);
    }
  }

  const center = minimum.map((value, componentIndex) => (value + maximum[componentIndex]) * 0.5);
  let radiusSquared = 0;
  for (let positionIndex = 0; positionIndex + 2 < positions.length; positionIndex += 3) {
    const distanceSquared =
      (Number(positions[positionIndex]) - center[0]) ** 2 +
      (Number(positions[positionIndex + 1]) - center[1]) ** 2 +
      (Number(positions[positionIndex + 2]) - center[2]) ** 2;
    radiusSquared = Math.max(radiusSquared, distanceSquared);
  }
  return [center[0], center[1], center[2], Math.sqrt(radiusSquared) + 0.0001];
}

function makeLightData(lights: readonly Light[]): Float32Array {
  const values: number[] = [];
  for (const light of lights) {
    const color = light.color ?? [1, 1, 1];
    const intensity = light.intensity ?? 1;
    const position = light.type === 'point' || light.type === 'spot' ? light.position : [0, 0, 0];
    const direction =
      light.type === 'directional' || light.type === 'spot' ? light.direction : [0, -1, 0];
    const attenuation =
      light.type === 'point' || light.type === 'spot'
        ? (light.attenuation ?? [1, 0, 0])
        : [1, 0, 0];
    const type =
      light.type === 'ambient'
        ? 0
        : light.type === 'directional'
          ? 1
          : light.type === 'point'
            ? 2
            : 3;
    const innerCone = light.type === 'spot' ? Math.cos(light.innerConeAngle ?? 0.35) : 1;
    const outerCone = light.type === 'spot' ? Math.cos(light.outerConeAngle ?? 0.5) : 0;

    values.push(
      color[0],
      color[1],
      color[2],
      intensity,
      position[0],
      position[1],
      position[2],
      innerCone,
      direction[0],
      direction[1],
      direction[2],
      type,
      attenuation[0],
      attenuation[1],
      attenuation[2],
      outerCone
    );
  }
  return makeStorageData(values, LIGHT_FLOAT_COUNT);
}

function makeStorageData(values: number[], minimumFloatCount: number): Float32Array {
  return values.length > 0 ? new Float32Array(values) : new Float32Array(minimumFloatCount);
}

function makeUniformData(props: {
  options: RayTracingSceneRenderOptions;
  inverseViewProjection: Matrix4;
  previousViewProjection: Matrix4;
  previousCameraPosition: readonly number[];
  displayWidth: number;
  displayHeight: number;
  internalWidth: number;
  internalHeight: number;
  resolutionScale: number;
  phaseIndex: number;
  phaseCount: number;
  primitiveCount: number;
  primitiveCapacity: number;
  leafCapacity: number;
  lightCount: number;
  directLightCount: number;
  accumulatedFrameCount: number;
  frameIndex: number;
}): Float32Array {
  const data = new Float32Array(UNIFORM_FLOAT_COUNT);
  const unsignedData = new Uint32Array(data.buffer);
  const background = props.options.background ?? [0.015, 0.018, 0.038, 1];
  const fogColor = props.options.fogColor ?? [0.025, 0.035, 0.075];

  data.set(props.inverseViewProjection, 0);
  data.set(props.options.camera.position, 16);
  data[19] = props.options.cameraProjection === 'orthographic' ? 1 : 0;
  data.set(background, 20);
  unsignedData[24] = props.internalWidth;
  unsignedData[25] = props.internalHeight;
  unsignedData[26] = props.primitiveCount;
  unsignedData[27] = props.lightCount;
  data[28] = props.options.exposure ?? 1.35;
  data[29] = props.accumulatedFrameCount;
  data[30] = props.options.samplesPerPixel ?? 1;
  data[31] = (props.options.shadows ?? true) ? 1 : 0;
  data.set(fogColor, 32);
  data[35] = props.options.fogDensity ?? 0;
  unsignedData[36] = props.leafCapacity - 1;
  unsignedData[37] = props.leafCapacity;
  unsignedData[38] = props.primitiveCapacity;
  unsignedData[39] = props.frameIndex;
  unsignedData[40] = props.displayWidth;
  unsignedData[41] = props.displayHeight;
  unsignedData[42] = props.phaseIndex;
  unsignedData[43] = props.phaseCount;
  data[44] = props.resolutionScale;
  data[45] = props.directLightCount;
  data[46] = props.options.shadowSamplesPerFrame ?? 1;
  data[47] = (props.options.temporalReprojection ?? true) ? 1 : 0;
  data.set(props.previousViewProjection, 48);
  data.set(props.previousCameraPosition, 64);
  data[67] = (props.options.progressive ?? true) ? 1 : 0;
  return data;
}

type RayTracingGraphViewFormat = 'float32x3' | 'float32x4' | 'uint32x2' | 'uint32';

function createDataSubview<Format extends RayTracingGraphViewFormat, Parameters>(
  graph: GPUCommandGraph<Parameters>,
  view: GraphDataView<Format>,
  format: Format,
  elementOffset: number,
  length: number
): GraphDataView<Format> {
  return graph.createDataView(view.buffer, {
    format,
    length,
    byteOffset: view.byteOffset + elementOffset * view.byteStride
  });
}

function createImportedView<Format extends RayTracingGraphViewFormat, Parameters>(
  graph: GPUCommandGraph<Parameters>,
  identifier: string,
  buffer: Buffer,
  format: Format,
  length: number
): GraphDataView<Format> {
  const handle = graph.importBuffer(
    {id: identifier, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format, length});
}

function replaceShaderConstants(
  source: string,
  constants: Readonly<Record<string, number>>
): string {
  let replacedSource = source;
  for (const [name, value] of Object.entries(constants)) {
    replacedSource = replacedSource.replaceAll(`__${name}__`, String(value));
  }
  return replacedSource;
}

function getNextPowerOfTwo(value: number): number {
  return 2 ** Math.ceil(Math.log2(Math.max(1, value)));
}

function getQualityOptions(options: RayTracingSceneRenderOptions): RayTracingQualityOptions {
  const adaptiveResolution = options.adaptiveResolution ?? true;
  const minimumResolutionScale = clampResolutionScale(
    options.minimumResolutionScale ?? DEFAULT_MINIMUM_RESOLUTION_SCALE,
    0.125,
    1
  );
  const requestedResolutionScale = clampResolutionScale(
    options.resolutionScale ?? DEFAULT_RESOLUTION_SCALE,
    minimumResolutionScale,
    1
  );
  return {
    resolutionScale: requestedResolutionScale,
    requestedResolutionScale,
    minimumResolutionScale,
    adaptiveResolution,
    targetFrameTimeMilliseconds: Math.max(
      1,
      options.targetFrameTimeMilliseconds ?? DEFAULT_TARGET_FRAME_TIME_MILLISECONDS
    )
  };
}

function updateQualityOptions(
  resources: RayTracingFrameResources,
  quality: RayTracingQualityOptions
): boolean {
  if (
    resources.minimumResolutionScale === quality.minimumResolutionScale &&
    resources.adaptiveResolution === quality.adaptiveResolution &&
    resources.targetFrameTimeMilliseconds === quality.targetFrameTimeMilliseconds &&
    resources.requestedResolutionScale === quality.requestedResolutionScale
  ) {
    return false;
  }
  resources.resolutionScale = quality.resolutionScale;
  resources.requestedResolutionScale = quality.requestedResolutionScale;
  resources.minimumResolutionScale = quality.minimumResolutionScale;
  resources.adaptiveResolution = quality.adaptiveResolution;
  resources.targetFrameTimeMilliseconds = quality.targetFrameTimeMilliseconds;
  resources.phaseCount = 1;
  resources.phaseIndex = 0;
  resources.overBudgetFrameCount = 0;
  resources.underBudgetFrameCount = 0;
  resources.averageFrameTimeMilliseconds = undefined;
  return true;
}

function updateFrameTiming(
  resources: RayTracingFrameResources,
  currentTimeMilliseconds: number
): void {
  const previousTimeMilliseconds = resources.lastRenderTimeMilliseconds;
  resources.lastRenderTimeMilliseconds = currentTimeMilliseconds;
  if (previousTimeMilliseconds === undefined) {
    return;
  }
  const frameTimeMilliseconds = currentTimeMilliseconds - previousTimeMilliseconds;
  if (frameTimeMilliseconds <= 0 || frameTimeMilliseconds > 1000) {
    return;
  }
  resources.averageFrameTimeMilliseconds =
    resources.averageFrameTimeMilliseconds === undefined
      ? frameTimeMilliseconds
      : resources.averageFrameTimeMilliseconds * 0.8 + frameTimeMilliseconds * 0.2;
}

type RayTracingAdaptiveBudgetState = Pick<
  RayTracingFrameResources,
  | 'resolutionScale'
  | 'requestedResolutionScale'
  | 'minimumResolutionScale'
  | 'adaptiveResolution'
  | 'targetFrameTimeMilliseconds'
  | 'phaseCount'
  | 'phaseIndex'
  | 'averageFrameTimeMilliseconds'
  | 'overBudgetFrameCount'
  | 'underBudgetFrameCount'
  | 'lastBudgetAdjustmentTimeMilliseconds'
  | 'historyNeedsReset'
  | 'accumulatedFrameCount'
>;

/** @internal Advances the conservative adaptive ray-work scheduler for one frame. */
export function updateRayTracingAdaptiveBudget(
  resources: RayTracingAdaptiveBudgetState,
  currentTimeMilliseconds: number
): void {
  if (resources.historyNeedsReset) {
    resources.phaseCount = 1;
    resources.phaseIndex = 0;
    resources.overBudgetFrameCount = 0;
    resources.underBudgetFrameCount = 0;
    return;
  }
  if (!resources.adaptiveResolution || resources.averageFrameTimeMilliseconds === undefined) {
    return;
  }
  const frameTimeMilliseconds = resources.averageFrameTimeMilliseconds;
  const targetFrameTimeMilliseconds = resources.targetFrameTimeMilliseconds;
  if (frameTimeMilliseconds > targetFrameTimeMilliseconds * OVER_BUDGET_FRAME_TIME_RATIO) {
    resources.overBudgetFrameCount = Math.min(
      OVER_BUDGET_FRAME_COUNT,
      resources.overBudgetFrameCount + 1
    );
    resources.underBudgetFrameCount = 0;
  } else if (frameTimeMilliseconds < targetFrameTimeMilliseconds * UNDER_BUDGET_FRAME_TIME_RATIO) {
    resources.underBudgetFrameCount = Math.min(
      UNDER_BUDGET_FRAME_COUNT,
      resources.underBudgetFrameCount + 1
    );
    resources.overBudgetFrameCount = 0;
  } else {
    resources.overBudgetFrameCount = 0;
    resources.underBudgetFrameCount = 0;
  }
  if (
    currentTimeMilliseconds - resources.lastBudgetAdjustmentTimeMilliseconds <
    FRAME_BUDGET_COOLDOWN_MILLISECONDS
  ) {
    return;
  }

  if (resources.overBudgetFrameCount >= OVER_BUDGET_FRAME_COUNT) {
    const lowerResolutionScale = getAdjacentResolutionScale(
      resources.resolutionScale,
      resources.minimumResolutionScale,
      resources.requestedResolutionScale,
      -1
    );
    if (lowerResolutionScale < resources.resolutionScale) {
      resources.resolutionScale = lowerResolutionScale;
      resources.historyNeedsReset = true;
    } else if (resources.accumulatedFrameCount >= MINIMUM_HISTORY_FRAMES_FOR_SPARSE_SCHEDULING) {
      resources.phaseCount = Math.min(4, resources.phaseCount * 2);
      resources.phaseIndex %= resources.phaseCount;
    } else {
      return;
    }
    resources.overBudgetFrameCount = 0;
    resources.lastBudgetAdjustmentTimeMilliseconds = currentTimeMilliseconds;
    return;
  }

  if (resources.underBudgetFrameCount >= UNDER_BUDGET_FRAME_COUNT) {
    if (resources.phaseCount > 1) {
      resources.phaseCount = Math.max(1, resources.phaseCount / 2);
      resources.phaseIndex %= resources.phaseCount;
    } else {
      const higherResolutionScale = getAdjacentResolutionScale(
        resources.resolutionScale,
        resources.minimumResolutionScale,
        resources.requestedResolutionScale,
        1
      );
      if (higherResolutionScale <= resources.resolutionScale) {
        resources.underBudgetFrameCount = 0;
        return;
      }
      resources.resolutionScale = higherResolutionScale;
      resources.historyNeedsReset = true;
    }
    resources.underBudgetFrameCount = 0;
    resources.lastBudgetAdjustmentTimeMilliseconds = currentTimeMilliseconds;
  }
}

function getInternalDimensions(
  displayWidth: number,
  displayHeight: number,
  resolutionScale: number
): {width: number; height: number} {
  return {
    width: Math.max(1, Math.ceil(displayWidth * resolutionScale)),
    height: Math.max(1, Math.ceil(displayHeight * resolutionScale))
  };
}

function getAdjacentResolutionScale(
  currentResolutionScale: number,
  minimumResolutionScale: number,
  maximumResolutionScale: number,
  direction: -1 | 1
): number {
  const scales = getAvailableResolutionScales(minimumResolutionScale, maximumResolutionScale);
  const currentIndex = scales.findIndex(scale => scale >= currentResolutionScale - 0.0001);
  const index = currentIndex < 0 ? scales.length - 1 : currentIndex;
  return scales[Math.max(0, Math.min(scales.length - 1, index + direction))];
}

function getAvailableResolutionScales(
  minimumResolutionScale: number,
  maximumResolutionScale: number
): number[] {
  const scales = [
    minimumResolutionScale,
    ...RESOLUTION_SCALES.filter(
      scale => scale > minimumResolutionScale && scale < maximumResolutionScale
    ),
    maximumResolutionScale
  ].sort((leftScale, rightScale) => leftScale - rightScale);
  return scales.filter(
    (scale, index) => index === 0 || Math.abs(scale - scales[index - 1]) > 0.0001
  );
}

function clampResolutionScale(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, Number.isFinite(value) ? value : minimum));
}

function getSamplesPerPixel(options: RayTracingSceneRenderOptions): number {
  return Math.max(1, Math.min(16, Math.floor(options.samplesPerPixel ?? 1)));
}

function isCameraCut(
  previousViewProjection: Matrix4,
  viewProjection: Matrix4,
  previousCameraPosition: readonly number[],
  cameraPosition: Readonly<NumericArray>
): boolean {
  let maximumMatrixDifference = 0;
  for (let index = 0; index < 16; index++) {
    maximumMatrixDifference = Math.max(
      maximumMatrixDifference,
      Math.abs(Number(previousViewProjection[index]) - Number(viewProjection[index]))
    );
  }
  const cameraDistance = Math.hypot(
    Number(previousCameraPosition[0] ?? 0) - Number(cameraPosition[0] ?? 0),
    Number(previousCameraPosition[1] ?? 0) - Number(cameraPosition[1] ?? 0),
    Number(previousCameraPosition[2] ?? 0) - Number(cameraPosition[2] ?? 0)
  );
  return maximumMatrixDifference > 0.75 || cameraDistance > 4;
}

function getTimestampMilliseconds(): number {
  return globalThis.performance?.now() ?? Date.now();
}
