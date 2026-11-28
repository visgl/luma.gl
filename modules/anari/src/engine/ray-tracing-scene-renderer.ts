// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  getRayMaterialTextures,
  getRayMaterialTextureShader,
  getRayMaterialTextureLayout,
  getRayMaterialTextureBindings,
  getRayMaterialTextureRevision
} from './ray-tracing-material-textures';
import {applyRaySkin, getRaySkin} from './ray-tracing-skin';
import {ScenegraphSurfaces} from './scenegraph-surfaces';
import {makeEmitterDistribution, type EmitterAreaCache} from './ray-tracing-emitter-distribution';
import {getEnvironmentMapDistribution, RAY_LIGHT_FLOAT_COUNT} from './ray-tracing-environment-map';
import type {ANARIFrameRadiance, ANARIRayTracingEnvironmentMap} from '../anari-types';
import type {RayTracingDebugView} from './ray-tracing-scene-capabilities';
import {
  assert,
  Buffer,
  type Device,
  type Framebuffer,
  Texture,
  type TextureFormatColor,
  type TextureFormatDepthStencil,
  textureFormatDecoder
} from '@luma.gl/core';
import {
  applyMorphTargets,
  Computation,
  decodeMorphTargetAttribute,
  type GroupNode,
  Model
} from '@luma.gl/engine';
import {type Light, PBR_TONE_MAP_MODE} from '@luma.gl/shaders';
import {Matrix4} from '@math.gl/core/matrix';
import {type NumericArray} from '@math.gl/core/types';
import {GPUBVH} from '@luma.gl/graph/gpu-core';
import {
  type CompiledGPUCommandGraph,
  GPUCommandGraph,
  type GPUCommandGraphEncoding,
  type GPUCommandGraphEncodingStats,
  type GraphDataView
} from '@luma.gl/graph/gpu-core';
import {GPUSegmentedBVH, type GPUBVHSegment} from '@luma.gl/graph/gpu-core';
import {GPUSegmentedSort, type GPUSortSegment} from '@luma.gl/graph/gpu-core';
import {GPUSort} from '@luma.gl/graph/gpu-core';
import {GPUTextureHistory} from '@luma.gl/graph/gpu-core';
import {createTransientView, getViewBinding, getViewElementOffset} from '@luma.gl/graph/gpu-core';
import {
  getRayTracingScenePresentationShader,
  rayTracingPresentationUsesGuides,
  RAY_TRACING_BOUNDS_SHADER,
  RAY_BLEND_ALPHA_MODE,
  RAY_OPAQUE_ALPHA_MODE,
  RAY_TRACING_HISTORY_CARRY_SHADER,
  getRayTracingMomentShader,
  getSampledRayTraversalShader,
  getSplitRayTracingHistoryShader,
  RAY_TRACING_SCENE_SHADER,
  RAY_TRACING_IRRADIANCE_SHADER,
  RAY_TRACING_PICK_SHADER,
  RAY_TRACING_CHANNEL_SHADER
} from './ray-tracing-scene-shaders';
import type {ANARIRayTraversalCounters} from '../anari-types';
import type {
  RayTracingGraphStageStatistics,
  RayTracingGraphStatistics,
  SceneRenderOptions,
  SceneRenderStatistics,
  SceneSurface
} from './scene-renderer';

const PRIMITIVE_FLOAT_COUNT = 104;
const TRIANGLE_FLOAT_COUNT = 56;
const BLAS_NODE_FLOAT_COUNT = 8;
const UNIFORM_FLOAT_COUNT = 92;
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
  secondaryCoordinates: array<vec4<f32>, 2>,
  colors: array<vec4<f32>, 3>,
  tangents: array<vec4<f32>, 3>,
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
  /** Uint32 seed for primary and secondary sampling; defaults to zero. */
  samplingSeed?: number;
  /** Full-image pixel coordinates for a full-resolution cropped render. */
  imageRegion?: RayTracingImageRegion;
  /** Explicit uint32 sample sequence frame, independent of retained render scheduling. */
  samplingFrameIndex?: number;
  /** Maximum retained samples per pixel, from 1 to 256; defaults to 64. */
  historySampleLimit?: number;
  /** Presentation-only guided filter radius in internal pixels; defaults to zero. */
  denoiseRadius?: 0 | 1 | 2;
  /** Retains log-luminance moments for variance-guided spatial filtering. */
  varianceGuidance?: boolean;
  /** Track first-interface diffuse and specular radiance independently in PBR transport. */
  separateLobeHistories?: boolean;
  /** Collect raw ray and node counts from one lane per 8×8 trace dispatch tile. */
  sampleTraversal?: boolean;
  /** Presentation diagnostics; defaults to color. */
  debugView?: RayTracingDebugView;
  /** Diffuse legacy transport or opt-in opaque metallic/roughness transport. */
  transportMode?: 'diffuse' | 'pbr';
  /** Number of secondary bounces, clamped to 0–8; defaults to zero. */
  maxBounces?: number;
  /** Samples emissive geometry explicitly; defaults to false. */
  emitterSampling?: boolean;
  /** Emitter selection distribution; defaults to uniform. Power uses area × luminance. */
  emitterSelection?: 'uniform' | 'power';
  /** Constant linear RGB environment illumination, independent of the camera backdrop. */
  environmentRadiance?: readonly [number, number, number];
  /** Immutable directional radiance map. Replace the object to change illumination. */
  environmentMap?: ANARIRayTracingEnvironmentMap;
  /** Accumulates primary-ray samples across unchanged committed frames. */
  progressive?: boolean;
  /** Traces direct-light shadow rays when enabled. */
  shadows?: boolean;
  /** Filters mipmapped triangle alpha masks for camera rays, secondary rays, shadows, and hit queries. */
  filteredCutouts?: boolean;
  /** Allows thin transmission and index-matched analytic spheres in PBR analytic-light shadows. */
  transmissiveShadows?: boolean;
  /** Use material roughness for GGX dielectric continuation in PBR mode. */
  roughDielectricTransmission?: boolean;
  /** Initial internal ray-tracing resolution relative to the display resolution. */
  resolutionScale?: number;
  /** Lowest internal resolution available to adaptive frame budgeting. */
  minimumResolutionScale?: number;
  /** Adjusts ray workload toward the requested frame budget when enabled. */
  adaptiveResolution?: boolean;
  /** Target animation-frame duration used by the adaptive scheduler. */
  targetFrameTimeMilliseconds?: number;
  /** Previous execution time excluding intentional pacing delays. Null skips this observation. */
  previousFrameExecutionMilliseconds?: number | null;
  /** Number of interleaved pixel batches per complete sweep. Preserves progressive history. */
  rayBatchPhaseCount?: 1 | 2 | 4 | 8;
  /** Reprojects compatible history while the camera or instances move. */
  temporalReprojection?: boolean;
  /** Maximum non-ambient shadowed light samples traced per pixel in one frame. */
  shadowSamplesPerFrame?: number;
};

/** Top-left crop origin and full-image dimensions; camera matrices describe the full image. */
export type RayTracingScenegraphRenderOptions = Omit<
  RayTracingSceneRenderOptions,
  'id' | 'surfaces'
> & {scene: GroupNode};

export type RayTracingImageRegion = {
  offset: readonly [number, number];
  fullSize: readonly [number, number];
};

/** Stable retained placement identity and a world-space primary-ray hit. */
export type RayTracingScenePickResult = {
  surfaceId: string;
  /** Adapter-provided instanceIds entry, or a surface/transform-index fallback. */
  placementId: string;
  position: readonly [number, number, number];
  normal: readonly [number, number, number];
  /** Distance from the primary ray origin; orthographic rays originate on the near plane. */
  distance: number;
};

/** Caller-owned GPU snapshot. Identifier zero denotes a miss. */
export type RayTracingSceneChannels = {
  /** Exact uint32 identifiers; identifiers[index] describes texel value index + 1. */
  identifiers: readonly Pick<RayTracingScenePickResult, 'surfaceId' | 'placementId'>[];
  identifierTexture: Texture;
  /** r32float ray-origin distance, not projected device depth. */
  distanceTexture: Texture;
  /** rgba32float world-space normal; alpha is one for a hit and zero for a miss. */
  normalTexture: Texture;
  /** r32float projected depth in WebGPU zero-to-one range; one denotes background. */
  projectedDepthTexture: Texture;
  /** Release all four textures after submitting their final GPU use. */
  destroy(): void;
};

type RayTracingPickIdentity = Pick<RayTracingScenePickResult, 'surfaceId' | 'placementId'>;

type RayTracingScene = {
  primitives: Float32Array;
  triangles: Float32Array;
  lights: Float32Array;
  primitiveCount: number;
  lightCount: number;
  emitterPrimitiveIndices: readonly number[];
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
  pickIdentities: readonly RayTracingPickIdentity[];
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
  denoiseRadius: 0 | 1 | 2;
  debugView: RayTracingDebugView;
};

type RayTracingShaderOptions = {
  /** Whether the trace graph retains luminance moments. */
  trackMoments: boolean;
  separateLobeHistories: boolean;
  sampleTraversal: boolean;
  /** Whether the color pipeline computes alpha-mask footprints. */
  filteredCutouts: boolean;
  /** Whether analytic shadow rays support thin transmission. */
  transmissiveShadows: boolean;
  environmentLighting: boolean;
  directionalEnvironment: boolean;
  pbrTransport: boolean;
  hasBounces: boolean;
  emitterSampling: boolean;
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
  /** Optional retained first and second log-luminance moments. */
  momentHistory?: GPUTextureHistory;
  traversalTexture?: Texture;
  topologyGraph: CompiledGPUCommandGraph;
  /** Lazily compiled mesh bounds update that reads the retained triangle order. */
  meshRefitGraph?: CompiledGPUCommandGraph;
  /** Number of mesh refits since the last Morton sort. */
  meshRefitsSinceRebuild: number;
  /** Packed layout to refresh before the scene hierarchy update. */
  pendingMeshRefit?: RayTracingTopology;
  accelerationGraph: CompiledGPUCommandGraph;
  refitGraph: CompiledGPUCommandGraph;
  traceGraph: CompiledGPUCommandGraph<RayTracingTraceGraphParameters>;
  shaderOptions: RayTracingShaderOptions;
  topologyRevision: string;
  /** Retained topology commits also include pose-only edits. */
  retainedTopologyRevision?: string;
  /** Snapshot of CPU morph weights and skin palettes used by the packed triangles. */
  deformationRevision: string;
  primitiveRevision: string;
  transformRevision: string;
  materialRevision?: number;
  lightRevision: string;
  environmentMap?: ANARIRayTracingEnvironmentMap;
  renderRevision: string;
  geometryLayouts: Map<string, RayTracingGeometryLayout>;
  retainedSurfaces: readonly SceneSurface[];
  materialTextureRevision: string;
  materialTextures: Texture[];
  materialSamplers: Texture['sampler'][];
  materialContentRevision: string;
  previousTransforms: Map<string, Matrix4>;
  primitivePlacements: Map<string, RayTracingPrimitivePlacement>;
  pickIdentities: readonly RayTracingPickIdentity[];
  pendingPreviousTransformInstanceIds: Set<string>;
  previousTransformsNeedCommit: boolean;
  previousViewProjection: Matrix4;
  previousCameraPosition: readonly number[];
  historyNeedsReset: boolean;
  /** Whether every internal pixel has guide metadata from the preceding frame. */
  hasGuideHistory: boolean;
  topologyNeedsUpdate: boolean;
  accelerationUpdateMode: RayTracingAccelerationUpdateMode;
  refitsSinceMortonRebuild: number;
  frameIndex: number;
  accumulatedFrameCount: number;
  /** Samples from completed full-coverage sweeps. */
  completedSweepSamples: number;
  /** Whether the preceding frame used a caller-supplied batch policy. */
  usedRayBatchOverride: boolean;
  primitiveCount: number;
  primitiveCapacity: number;
  leafCapacity: number;
  lightCount: number;
  emitterPrimitiveIndices: readonly number[];
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
  readGraphTimings?: NonNullable<SceneRenderStatistics['rayTracing']>['readGraphTimings'];
  readTraversalCounters?: NonNullable<SceneRenderStatistics['rayTracing']>['readTraversalCounters'];
  memory: NonNullable<NonNullable<SceneRenderStatistics['rayTracing']>['memory']>;
};

/** Shared WebGPU software ray tracer consuming the canonical retained-scene contract. */
export class RayTracingSceneRenderer {
  private readonly device: Device;
  private readonly scenegraphs = new Map<GroupNode, {id: string; adapter: ScenegraphSurfaces}>();
  private nextScenegraphId = 1;
  private readonly frames = new Map<string, RayTracingFrameResources>();
  private readonly emitterAreaCaches = new Map<string, EmitterAreaCache>();
  private readonly irradianceComputations = new Map<
    string,
    {source: string; computation: Computation}
  >();
  private readonly geometryCache = new Map<string, CompiledRayGeometry>();
  private pickMaterialRevision?: string;
  private channelMaterialRevision?: string;
  private pickComputation?: Computation;
  private channelComputation?: Computation;

  constructor(device: Device) {
    if (device.type !== 'webgpu') {
      throw new Error('Ray tracing scene rendering requires a WebGPU device.');
    }
    this.device = device;
  }

  render(
    input: RayTracingSceneRenderOptions | RayTracingScenegraphRenderOptions
  ): SceneRenderStatistics {
    let options: RayTracingSceneRenderOptions;
    if ('scene' in input) {
      let cached = this.scenegraphs.get(input.scene);
      if (!cached) {
        cached = {
          id: `ray-scenegraph-${this.nextScenegraphId++}`,
          adapter: new ScenegraphSurfaces()
        };
        this.scenegraphs.set(input.scene, cached);
      }
      const {scene, ...settings} = input;
      const surfaces = cached.adapter.getSurfaces(scene);
      // Ray geometry extraction needs CPU placements; GPU poses require an explicit snapshot.
      assert(surfaces.every(surface => !surface.gpuTransforms));
      options = {...settings, id: cached.id, surfaces};
    } else options = input;
    const [displayWidth, displayHeight] = getRayTracingDisplaySize(this.device, options);
    if (options.imageRegion) {
      const {offset, fullSize} = options.imageRegion;
      // A crop must lie inside an integer full-image pixel grid; uint32 seeds index that grid.
      assert(
        [...offset, ...fullSize].every(Number.isInteger) &&
          offset.every(value => value >= 0) &&
          fullSize.every(value => value > 0) &&
          fullSize[0] * fullSize[1] <= 0xffffffff &&
          offset[0] + displayWidth <= fullSize[0] &&
          offset[1] + displayHeight <= fullSize[1]
      );
      options = {
        ...options,
        resolutionScale: 1,
        adaptiveResolution: false,
        temporalReprojection: false
      };
    }
    // Explicit sampling frames must fit the shader's uint32 sequence counter.
    assert(
      options.samplingFrameIndex === undefined ||
        (Number.isInteger(options.samplingFrameIndex) &&
          options.samplingFrameIndex >= 0 &&
          options.samplingFrameIndex <= 0xffffffff)
    );
    const presentation = getRayTracingPresentationOptions(this.device, options);
    const shaderOptions: RayTracingShaderOptions = {
      separateLobeHistories:
        options.transportMode === 'pbr' && options.separateLobeHistories === true,
      sampleTraversal: options.sampleTraversal === true,
      trackMoments: options.varianceGuidance === true || options.debugView === 'variance',
      filteredCutouts: options.filteredCutouts === true,
      transmissiveShadows: options.transmissiveShadows === true,
      environmentLighting: Boolean(
        options.environmentMap || options.environmentRadiance?.some(channel => channel > 0)
      ),
      directionalEnvironment: Boolean(options.environmentMap),
      pbrTransport: options.transportMode === 'pbr',
      hasBounces: (options.maxBounces ?? 0) >= 1,
      emitterSampling: options.emitterSampling ?? false
    };
    const lights = options.lights ?? [];
    const quality = getQualityOptions(options);
    const viewProjection = new Matrix4(options.camera.projectionMatrix).multiplyRight(
      options.camera.viewMatrix
    );
    const inverseViewProjection = new Matrix4(viewProjection).invert();
    /** Pose data can change without altering the compiled graph layout. */
    const deformationRevision = getDeformationRevision(options);
    const transformRevision = getTransformRevision(options);
    const primitiveRevision = getPrimitiveRevision(options, transformRevision);
    const lightRevision = getLightRevision(options, lights);
    let resources = this.frames.get(options.id);
    /** Retained commits can skip comparing the structural snapshot on steady frames. */
    const retainedTopologyRevision = options.sceneRevisions
      ? `${options.sceneRevisions.identity}:${options.sceneRevisions.topology}`
      : undefined;
    /** Identity of the packed scene structure, independent of CPU pose. */
    const topologyRevision =
      retainedTopologyRevision && resources?.retainedTopologyRevision === retainedTopologyRevision
        ? resources.topologyRevision
        : getTopologyRevision(options);
    const currentTimeMilliseconds = getTimestampMilliseconds();
    /** Sparse batches carry metadata only when the view and scene pose are stable. */
    const stationaryBatch =
      resources?.transformRevision === transformRevision &&
      resources.lightRevision === lightRevision &&
      resources.previousCameraPosition.every(
        (value, index) => value === options.camera.position[index]
      ) &&
      resources.previousViewProjection.every((value, index) => value === viewProjection[index]);

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
      const scene = makeRayTracingScene(
        primitiveData,
        topology.triangles,
        lights,
        options.emitterSampling ?? false,
        options,
        this.getEmitterAreaCache(options.id)
      );
      resources = this.createFrameResources({
        frameIdentifier: options.id,
        shaderOptions,
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
      resources.retainedTopologyRevision = retainedTopologyRevision;
      resources.deformationRevision = deformationRevision;
      resources.primitiveRevision = primitiveRevision;
      resources.transformRevision = transformRevision;
      resources.materialRevision = options.sceneRevisions?.materials;
      resources.lightRevision = lightRevision;
      this.frames.set(options.id, resources);
    } else {
      updateFrameTiming(
        resources,
        currentTimeMilliseconds,
        options.previousFrameExecutionMilliseconds
      );
      if (updateQualityOptions(resources, quality)) {
        resources.historyNeedsReset = true;
      }

      /** Repack CPU-deformed triangles while retaining the graph when its layout still matches. */
      const deformationChanged = resources.deformationRevision !== deformationRevision;
      /** Retained pose commits may advance the world revision without altering its structure. */
      const topologyChanged =
        resources.topologyRevision !== topologyRevision ||
        (!deformationChanged && resources.retainedTopologyRevision !== retainedTopologyRevision);
      let topology: RayTracingTopology | undefined;
      if (topologyChanged || deformationChanged) {
        topology = makeRayTracingTopology(
          options.surfaces,
          options.primitives ?? {},
          this.geometryCache
        );
      }
      /** Pose changes can split or combine previously shared packed mesh layouts. */
      const recreateTopology =
        topologyChanged ||
        (topology !== undefined &&
          !hasMatchingPackedGeometryLayout(resources.geometryLayouts, topology.geometryLayouts));
      const primitiveChanged = resources.primitiveRevision !== primitiveRevision;
      const transformChanged = resources.transformRevision !== transformRevision;
      const environmentMapChanged = resources.environmentMap !== options.environmentMap;
      const lightsChanged = resources.lightRevision !== lightRevision || environmentMapChanged;
      if (environmentMapChanged) resources.historyNeedsReset = true;
      // A split diffuse history can reuse primary guides for a rigid pose update.
      // Other edits still invalidate the full path integral.
      const reprojectSplitPose =
        shaderOptions.separateLobeHistories &&
        (options.temporalReprojection ?? true) &&
        transformChanged &&
        !topology &&
        getPrimitiveRevision(options, resources.transformRevision) === resources.primitiveRevision;
      // Primary-hit reprojection cannot validate illumination from secondary surfaces.
      if (
        ((options.maxBounces ?? 0) > 0 ||
          options.emitterSampling ||
          shaderOptions.environmentLighting) &&
        ((primitiveChanged && !reprojectSplitPose) || lightsChanged)
      ) {
        resources.historyNeedsReset = true;
      }
      const sparseTransformInstanceIds = getSparseTransformInstanceIds(
        options,
        resources,
        topology !== undefined,
        transformChanged
      );
      const sparsePreviousTransformCommit =
        !topology &&
        !primitiveChanged &&
        resources.previousTransformsNeedCommit &&
        resources.pendingPreviousTransformInstanceIds.size > 0 &&
        resources.pendingPreviousTransformInstanceIds.size <=
          getMaximumSparsePrimitiveUpdateCount(resources);
      let primitiveData: RayTracingPrimitiveData | undefined;
      let lightData: Float32Array | undefined;

      if (topology || (primitiveChanged && !sparseTransformInstanceIds)) {
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
      const emitterPrimitiveIndices = primitiveData
        ? getEmissivePrimitiveIndices(primitiveData.primitives)
        : resources.emitterPrimitiveIndices;
      if (lightsChanged || (options.emitterSampling && (primitiveChanged || topology))) {
        lightData = makeLightData(
          lights,
          options.emitterSampling ? emitterPrimitiveIndices : [],
          options,
          this.getEmitterAreaCache(options.id)
        );
      }

      if (
        recreateTopology ||
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
        const scene = makeRayTracingScene(
          primitiveData,
          topology.triangles,
          lights,
          options.emitterSampling ?? false,
          options,
          this.getEmitterAreaCache(options.id)
        );
        const previousTransformsNeedCommit =
          resources.previousTransformsNeedCommit || transformChanged;
        this.destroyFrame(options.id);
        resources = this.createFrameResources({
          frameIdentifier: options.id,
          shaderOptions,
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
        resources.retainedTopologyRevision = retainedTopologyRevision;
        resources.deformationRevision = deformationRevision;
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
          if (resources.meshRefitsSinceRebuild >= MORTON_REBUILD_REFIT_INTERVAL) {
            resources.topologyNeedsUpdate = true;
          } else {
            resources.pendingMeshRefit = topology;
          }
          scheduleRefittableAccelerationUpdate(resources);
        }
        if (primitiveData) {
          resources.primitiveBuffer.write(primitiveData.primitives);
          resources.previousTransforms = primitiveData.previousTransforms;
          resources.primitivePlacements = primitiveData.placements;
          resources.pickIdentities = primitiveData.pickIdentities;
          resources.emitterPrimitiveIndices = emitterPrimitiveIndices;
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
            scheduleRefittableAccelerationUpdate(resources);
            if (!(options.temporalReprojection ?? true)) {
              resources.historyNeedsReset = true;
            }
          } else if (primitiveChanged) {
            resources.historyNeedsReset = true;
          }
        } else if (sparseTransformInstanceIds || sparsePreviousTransformCommit) {
          updateSparsePrimitiveTransforms(resources, sparseTransformInstanceIds ?? []);
          if (transformChanged) {
            scheduleRefittableAccelerationUpdate(resources);
            if (!(options.temporalReprojection ?? true)) {
              resources.historyNeedsReset = true;
            }
          }
        }
        if (lightData) {
          const lightCountChanged = resources.lightCount !== lights.length;
          resources.lightBuffer.write(lightData);
          resources.lightCount = lights.length;
          resources.emitterPrimitiveIndices = emitterPrimitiveIndices;
          if (lightCountChanged || !(options.temporalReprojection ?? true)) {
            resources.historyNeedsReset = true;
          }
        }
        resources.topologyRevision = topologyRevision;
        resources.retainedTopologyRevision = retainedTopologyRevision;
        resources.deformationRevision = deformationRevision;
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
    if (!options.rayBatchPhaseCount) {
      if (resources.usedRayBatchOverride) {
        resources.phaseCount = 1;
        resources.phaseIndex = 0;
        resources.accumulatedFrameCount = Math.floor(
          resources.completedSweepSamples / getSamplesPerPixel(options)
        );
        resources.overBudgetFrameCount = 0;
        resources.underBudgetFrameCount = 0;
      }
      updateRayTracingAdaptiveBudget(resources, currentTimeMilliseconds);
    }
    resources.usedRayBatchOverride = Boolean(options.rayBatchPhaseCount);

    const materialTextureRevision = getRayMaterialTextureRevision(options.surfaces);
    const materialTextures = getRayMaterialTextures(options.surfaces);
    const materialTexturesChanged =
      materialTextureRevision !== resources.materialTextureRevision ||
      materialTextures.length !== resources.materialTextures.length ||
      materialTextures.some(
        (texture, index) =>
          texture !== resources.materialTextures[index] ||
          texture.sampler !== resources.materialSamplers[index]
      );
    if (materialTexturesChanged) {
      resources.retainedSurfaces = options.surfaces;
    }
    const internalDimensions = getInternalDimensions(
      displayWidth,
      displayHeight,
      resources.resolutionScale
    );
    if (
      resources.shaderOptions.trackMoments !== shaderOptions.trackMoments ||
      resources.shaderOptions.sampleTraversal !== shaderOptions.sampleTraversal ||
      resources.shaderOptions.separateLobeHistories !== shaderOptions.separateLobeHistories ||
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
        presentation,
        shaderOptions
      );
    } else if (
      materialTexturesChanged ||
      resources.shaderOptions.environmentLighting !== shaderOptions.environmentLighting ||
      resources.shaderOptions.directionalEnvironment !== shaderOptions.directionalEnvironment ||
      resources.shaderOptions.filteredCutouts !== shaderOptions.filteredCutouts ||
      resources.shaderOptions.transmissiveShadows !== shaderOptions.transmissiveShadows ||
      resources.shaderOptions.pbrTransport !== shaderOptions.pbrTransport ||
      resources.shaderOptions.hasBounces !== shaderOptions.hasBounces ||
      resources.shaderOptions.emitterSampling !== shaderOptions.emitterSampling ||
      !areRayTracingPresentationOptionsEqual(resources.presentation, presentation)
    ) {
      this.recreateTraceGraph(options.id, resources, presentation, shaderOptions);
    }

    const materialContentRevision = JSON.stringify(
      options.surfaces.map(surface => surface.material.version)
    );
    if (materialContentRevision !== resources.materialContentRevision) {
      resources.materialContentRevision = materialContentRevision;
      resources.historyNeedsReset = true;
    }
    if (materialTexturesChanged) {
      resources.materialTextureRevision = materialTextureRevision;
      resources.materialTextures = materialTextures;
      resources.materialSamplers = materialTextures.map(texture => texture.sampler);
      resources.historyNeedsReset = true;
    }

    resources.environmentMap = options.environmentMap;
    const progressive = options.progressive ?? true;
    const temporalReprojection = options.temporalReprojection ?? true;
    if (resources.historyNeedsReset) {
      resources.accumulatedFrameCount = 0;
      resources.completedSweepSamples = 0;
      resources.phaseCount = 1;
      resources.phaseIndex = 0;
    }
    if (options.rayBatchPhaseCount && !resources.historyNeedsReset) {
      if (!stationaryBatch || !progressive) {
        resources.phaseCount = 1;
        resources.phaseIndex = 0;
      } else if (resources.phaseIndex === 0) {
        resources.phaseCount = options.rayBatchPhaseCount;
      }
    }
    const needsTemporalGuides = progressive && temporalReprojection;
    const needsGuides =
      needsTemporalGuides ||
      rayTracingPresentationUsesGuides(presentation.denoiseRadius, presentation.debugView);
    // If a display guide is enabled after color-only sampling, fill every guide
    // pixel before presentation. Color history remains valid.
    if (needsGuides && !resources.hasGuideHistory) {
      resources.phaseCount = 1;
      resources.phaseIndex = 0;
    }
    const needsGuideHitForStationaryHistory =
      needsTemporalGuides &&
      !(
        shaderOptions.separateLobeHistories ||
        (shaderOptions.pbrTransport && shaderOptions.hasBounces)
      );
    const reuseGuides =
      stationaryBatch &&
      resources.hasGuideHistory &&
      !resources.historyNeedsReset &&
      !needsGuideHitForStationaryHistory;
    const guideMode = needsGuides ? (reuseGuides ? 2 : 1) : 0;
    const activePhaseCount = resources.historyNeedsReset ? 1 : resources.phaseCount;
    const activePhaseIndex = resources.historyNeedsReset
      ? 0
      : resources.phaseIndex % activePhaseCount;
    const accumulatedFrameCount = progressive ? resources.accumulatedFrameCount : 0;
    resources.uniformBuffer.write(
      makeUniformData({
        options,
        inverseViewProjection,
        stationaryScene: stationaryBatch,
        guideMode,
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
        emitterCount: options.emitterSampling ? resources.emitterPrimitiveIndices.length : 0,
        directLightCount: lights.reduce(
          (directLightCount, light) => directLightCount + Number(light.type !== 'ambient'),
          0
        ),
        accumulatedFrameCount,
        frameIndex: progressive || temporalReprojection ? resources.frameIndex : 0
      })
    );

    let topologyEncoding: GPUCommandGraphEncoding | undefined;
    let topologyUpdate: 'build' | 'refit' | undefined;
    let accelerationEncoding: GPUCommandGraphEncoding | undefined;
    let refitEncoding: GPUCommandGraphEncoding | undefined;
    if (resources.topologyNeedsUpdate) {
      topologyUpdate = 'build';
      topologyEncoding = resources.topologyGraph.encode(this.device.commandEncoder, {
        parameters: undefined
      });
      resources.topologyNeedsUpdate = false;
      resources.meshRefitsSinceRebuild = 0;
      resources.pendingMeshRefit = undefined;
    } else if (resources.pendingMeshRefit) {
      resources.meshRefitGraph ??= this.createTopologyGraph({
        frameIdentifier: options.id,
        topology: resources.pendingMeshRefit,
        triangleBuffer: resources.triangleBuffer,
        blasNodesBuffer: resources.blasNodesBuffer,
        blasTriangleIdsBuffer: resources.blasTriangleIdsBuffer,
        reuseTriangleOrder: true
      });
      topologyUpdate = 'refit';
      topologyEncoding = resources.meshRefitGraph.encode(this.device.commandEncoder, {
        parameters: undefined
      });
      resources.pendingMeshRefit = undefined;
      resources.meshRefitsSinceRebuild++;
    }
    if (resources.accelerationUpdateMode === 'rebuild') {
      accelerationEncoding = resources.accelerationGraph.encode(this.device.commandEncoder, {
        parameters: undefined
      });
      resources.refitsSinceMortonRebuild = 0;
    } else if (resources.accelerationUpdateMode === 'refit') {
      refitEncoding = resources.refitGraph.encode(this.device.commandEncoder, {
        parameters: undefined
      });
      resources.refitsSinceMortonRebuild++;
    }
    resources.accelerationUpdateMode = 'none';
    const traceEncoding = resources.traceGraph.encode(this.device.commandEncoder, {
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
        ...resources.metadataHistory.getBindings('history-metadata', 'output-metadata'),
        ...resources.momentHistory?.getBindings('history-moments', 'output-moments')
      }
    });
    resources.colorHistory.advance();
    resources.metadataHistory.advance();
    resources.momentHistory?.advance();
    resources.previousViewProjection = new Matrix4(viewProjection);
    resources.previousCameraPosition = Array.from(options.camera.position);
    resources.historyNeedsReset = false;
    // A partial update during motion carries some guides from the old pose.
    // Require a complete refresh before those guides can be reused.
    resources.hasGuideHistory =
      needsGuides && (activePhaseCount === 1 || (stationaryBatch && resources.hasGuideHistory));
    resources.phaseIndex = (activePhaseIndex + 1) % resources.phaseCount;
    resources.frameIndex++;
    resources.accumulatedFrameCount = progressive ? accumulatedFrameCount + 1 : 0;
    const samplesPerPixel = getSamplesPerPixel(options);
    if (progressive && activePhaseIndex + 1 === activePhaseCount) {
      resources.completedSweepSamples = Math.min(
        resources.completedSweepSamples + samplesPerPixel,
        getHistorySampleLimit(options)
      );
    }

    const traversalTexture = resources.traversalTexture;
    const traversalWidth = 2 * Math.ceil(Math.ceil(resources.internalWidth / activePhaseCount) / 8);
    const encodedFrameIndex = resources.frameIndex;
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
          ? Math.min(
              options.rayBatchPhaseCount
                ? resources.completedSweepSamples
                : resources.accumulatedFrameCount * samplesPerPixel,
              getHistorySampleLimit(options)
            )
          : samplesPerPixel,
        memory: getRayTracingMemoryStatistics(resources),
        graph: makeRayTracingGraphStatistics({
          topology: topologyEncoding?.stats,
          acceleration: accelerationEncoding?.stats,
          refit: refitEncoding?.stats,
          trace: traceEncoding.stats
        }),
        ...((traceEncoding.canReadGPUTimings ||
          topologyEncoding?.canReadGPUTimings ||
          accelerationEncoding?.canReadGPUTimings ||
          refitEncoding?.canReadGPUTimings) && {
          readGraphTimings: async () => ({
            topology: await topologyEncoding?.readTimings(),
            topologyUpdate,
            acceleration: await accelerationEncoding?.readTimings(),
            refit: await refitEncoding?.readTimings(),
            trace: await traceEncoding.readTimings()
          })
        }),
        ...(traversalTexture && {
          readTraversalCounters: async () =>
            this.frames.get(options.id) === resources &&
            resources.frameIndex === encodedFrameIndex &&
            resources.traversalTexture === traversalTexture
              ? readSampledTraversalCounters(traversalTexture, traversalWidth)
              : null
        })
      } satisfies RayTracingStatistics
    };
    return statistics as SceneRenderStatistics;
  }

  /**
   * Picks the last submitted frame at a top-left-origin display pixel.
   * Submit render() before calling this method. The query submits its own command buffer;
   * it does not submit any pending application-owned render commands.
   */
  async pick(
    frameIdentifier: string,
    x: number,
    y: number
  ): Promise<RayTracingScenePickResult | null> {
    const resources = this.frames.get(frameIdentifier);
    if (
      !resources ||
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      x < 0 ||
      y < 0 ||
      x >= resources.displayWidth ||
      y >= resources.displayHeight
    ) {
      return null;
    }
    const identities = resources.pickIdentities;
    const coordinates = this.device.createBuffer({
      usage: Buffer.UNIFORM | Buffer.COPY_DST,
      data: new Float32Array([
        (Math.floor(x) + 0.5) / resources.displayWidth,
        (Math.floor(y) + 0.5) / resources.displayHeight,
        0,
        0
      ])
    });
    const result = this.device.createBuffer({
      usage: Buffer.STORAGE | Buffer.COPY_SRC,
      byteLength: 32
    });
    const commandEncoder = this.device.createCommandEncoder();
    let commandBuffer: ReturnType<typeof commandEncoder.finish> | undefined;
    try {
      if (this.pickMaterialRevision !== resources.materialTextureRevision) {
        this.pickComputation?.destroy();
        this.pickComputation = undefined;
        this.pickMaterialRevision = resources.materialTextureRevision;
      }
      this.pickComputation ??= new Computation(this.device, {
        id: 'ray-scene-picking',
        source: getRayMaterialTextureShader(
          RAY_TRACING_PICK_SHADER,
          resources.retainedSurfaces,
          true
        ),
        entryPoint: 'pick',
        shaderLayout: {
          bindings: [
            ...getRayMaterialTextureLayout(
              getRayMaterialTextures(resources.retainedSurfaces, true)
            ),
            {name: 'uniforms', type: 'uniform', group: 0, location: 0},
            {name: 'primitives', type: 'read-only-storage', group: 0, location: 1},
            {name: 'triangles', type: 'read-only-storage', group: 0, location: 2},
            {name: 'nodeMinima', type: 'read-only-storage', group: 0, location: 4},
            {name: 'nodeMaxima', type: 'read-only-storage', group: 0, location: 5},
            {name: 'leafPrimitiveIds', type: 'read-only-storage', group: 0, location: 6},
            {name: 'blasNodes', type: 'read-only-storage', group: 0, location: 7},
            {name: 'blasTriangleIds', type: 'read-only-storage', group: 0, location: 8},
            {name: 'pickResult', type: 'storage', group: 0, location: 13},
            {name: 'pickCoordinates', type: 'uniform', group: 0, location: 14}
          ]
        }
      });
      this.pickComputation.setBindings({
        ...getRayMaterialTextureBindings(getRayMaterialTextures(resources.retainedSurfaces, true)),
        uniforms: resources.uniformBuffer,
        primitives: resources.primitiveBuffer,
        triangles: resources.triangleBuffer,
        nodeMinima: resources.nodeMinimaBuffer,
        nodeMaxima: resources.nodeMaximaBuffer,
        leafPrimitiveIds: resources.sortedPrimitiveIdsBuffer,
        blasNodes: resources.blasNodesBuffer,
        blasTriangleIds: resources.blasTriangleIdsBuffer,
        pickResult: result,
        pickCoordinates: coordinates
      });
      const computePass = commandEncoder.beginComputePass();
      this.pickComputation.dispatch(computePass, 1);
      computePass.end();
      commandBuffer = commandEncoder.finish();
      this.device.submit(commandBuffer);
      const bytes = await result.readAsync();
      const values = new Float32Array(bytes.buffer, bytes.byteOffset, 8);
      const primitiveIdentifier = new Uint32Array(bytes.buffer, bytes.byteOffset, 8)[7];
      const identity = identities[primitiveIdentifier - 1];
      return identity
        ? {
            ...identity,
            position: [values[0], values[1], values[2]],
            distance: values[3],
            normal: [values[4], values[5], values[6]]
          }
        : null;
    } finally {
      commandBuffer?.destroy();
      commandEncoder.destroy();
      coordinates.destroy();
      result.destroy();
    }
  }

  /**
   * Captures the last submitted frame into caller-owned full-resolution GPU textures.
   * Submit render() first. This submits only its own commands and performs no CPU readback.
   * Snapshots remain valid across subsequent renders and frame destruction.
   */
  /** Reads the latest submitted internal color history without tone mapping or denoising. */
  async readRadiance(
    frameIdentifier: string,
    lobe?: 'diffuse' | 'specular'
  ): Promise<ANARIFrameRadiance | null> {
    const resources = this.frames.get(frameIdentifier);
    if (!resources || (lobe && !resources.shaderOptions.separateLobeHistories)) return null;
    const texture = resources.colorHistory.previousTexture;
    const {width, height} = texture;
    const layer = resources.shaderOptions.separateLobeHistories
      ? {diffuse: 0, specular: 1, composite: 2}[lobe ?? 'composite']
      : 0;
    const readOptions = {width, height, z: layer};
    const layout = texture.computeMemoryLayout(readOptions);
    const buffer = this.device.createBuffer({
      byteLength: layout.byteLength,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });
    try {
      texture.readBuffer(readOptions, buffer);
      const bytes = await buffer.readAsync();
      const rowBytes = width * 8;
      const data = new Uint8Array(rowBytes * height);
      for (let row = 0; row < height; row++) {
        const offset = row * layout.bytesPerRow;
        data.set(bytes.subarray(offset, offset + rowBytes), row * rowBytes);
      }
      return {width, height, data};
    } finally {
      buffer.destroy();
    }
  }

  captureChannels(frameIdentifier: string): RayTracingSceneChannels | null {
    const resources = this.frames.get(frameIdentifier);
    if (!resources) return null;
    const createTexture = (format: 'r32uint' | 'r32float' | 'rgba32float') =>
      this.device.createTexture({
        width: resources.displayWidth,
        height: resources.displayHeight,
        format,
        usage: Texture.STORAGE | Texture.SAMPLE | Texture.COPY_SRC
      });
    const textures: Texture[] = [];
    const commandEncoder = this.device.createCommandEncoder();
    let projectionBuffer: Buffer | undefined;
    try {
      // render() stores its current projection here after encoding temporal reprojection.
      projectionBuffer = this.device.createBuffer({
        data: new Float32Array(resources.previousViewProjection),
        usage: Buffer.UNIFORM
      });
      const identifierTexture = createTexture('r32uint');
      textures.push(identifierTexture);
      const distanceTexture = createTexture('r32float');
      textures.push(distanceTexture);
      const normalTexture = createTexture('rgba32float');
      textures.push(normalTexture);
      const projectedDepthTexture = createTexture('r32float');
      textures.push(projectedDepthTexture);
      if (this.channelMaterialRevision !== resources.materialTextureRevision) {
        this.channelComputation?.destroy();
        this.channelComputation = undefined;
        this.channelMaterialRevision = resources.materialTextureRevision;
      }
      this.channelComputation ??= new Computation(this.device, {
        id: 'ray-scene-channels',
        source: getRayMaterialTextureShader(
          RAY_TRACING_CHANNEL_SHADER,
          resources.retainedSurfaces,
          true
        ),
        entryPoint: 'captureChannels',
        shaderLayout: {
          bindings: [
            ...getRayMaterialTextureLayout(
              getRayMaterialTextures(resources.retainedSurfaces, true)
            ),
            {name: 'uniforms', type: 'uniform', group: 0, location: 0},
            {name: 'primitives', type: 'read-only-storage', group: 0, location: 1},
            {name: 'triangles', type: 'read-only-storage', group: 0, location: 2},
            {name: 'nodeMinima', type: 'read-only-storage', group: 0, location: 4},
            {name: 'nodeMaxima', type: 'read-only-storage', group: 0, location: 5},
            {name: 'leafPrimitiveIds', type: 'read-only-storage', group: 0, location: 6},
            {name: 'blasNodes', type: 'read-only-storage', group: 0, location: 7},
            {name: 'blasTriangleIds', type: 'read-only-storage', group: 0, location: 8},
            {
              name: 'identifierImage',
              type: 'storage',
              group: 0,
              location: 13,
              access: 'write-only',
              format: 'r32uint'
            },
            {
              name: 'distanceImage',
              type: 'storage',
              group: 0,
              location: 14,
              access: 'write-only',
              format: 'r32float'
            },
            {
              name: 'normalImage',
              type: 'storage',
              group: 0,
              location: 15,
              access: 'write-only',
              format: 'rgba32float'
            },
            {
              name: 'projectedDepthImage',
              type: 'storage',
              group: 0,
              location: 16,
              access: 'write-only',
              format: 'r32float'
            },
            {name: 'channelViewProjection', type: 'uniform', group: 0, location: 17}
          ]
        }
      });
      this.channelComputation.setBindings({
        ...getRayMaterialTextureBindings(getRayMaterialTextures(resources.retainedSurfaces, true)),
        uniforms: resources.uniformBuffer,
        primitives: resources.primitiveBuffer,
        triangles: resources.triangleBuffer,
        nodeMinima: resources.nodeMinimaBuffer,
        nodeMaxima: resources.nodeMaximaBuffer,
        leafPrimitiveIds: resources.sortedPrimitiveIdsBuffer,
        blasNodes: resources.blasNodesBuffer,
        blasTriangleIds: resources.blasTriangleIdsBuffer,
        identifierImage: identifierTexture,
        distanceImage: distanceTexture,
        normalImage: normalTexture,
        projectedDepthImage: projectedDepthTexture,
        channelViewProjection: projectionBuffer
      });
      const computePass = commandEncoder.beginComputePass();
      this.channelComputation.dispatch(
        computePass,
        Math.ceil(resources.displayWidth / 8),
        Math.ceil(resources.displayHeight / 8)
      );
      computePass.end();
      this.device.submit(commandEncoder.finish());
      return {
        identifiers: resources.pickIdentities.slice(),
        identifierTexture,
        distanceTexture,
        normalTexture,
        projectedDepthTexture,
        destroy: () => {
          for (const texture of textures) texture.destroy();
        }
      };
    } catch (error) {
      for (const texture of textures) texture.destroy();
      throw error;
    } finally {
      projectionBuffer?.destroy();
      commandEncoder.destroy();
    }
  }

  /** Encode one indirect irradiance sample from borrowed world-position/chart and normal textures.
   * Call render and submit first to prepare the retained scene. Caller owns input/output textures and submission.
   * The renderer owns and caches the computation until destroyFrame or destroy.
   */
  encodeIrradiance(
    frameIdentifier: string,
    positions: Texture,
    normals: Texture,
    output: Texture
  ): void {
    const resources = this.frames.get(frameIdentifier);
    assert(
      resources &&
        positions.device === this.device &&
        normals.device === this.device &&
        output.device === this.device
    );
    assert(
      positions.width === normals.width &&
        positions.height === normals.height &&
        output.width === positions.width &&
        output.height === positions.height
    );
    assert(output.format === 'rgba16float');
    const textures = getRayMaterialTextures(resources.retainedSurfaces);
    const source = getRayMaterialTextureShader(
      RAY_TRACING_IRRADIANCE_SHADER,
      resources.retainedSurfaces
    );
    let cached = this.irradianceComputations.get(frameIdentifier);
    if (cached?.source !== source) {
      cached?.computation.destroy();
      const computation = new Computation(this.device, {
        source,
        entryPoint: 'bakeIrradiance',
        shaderLayout: {
          bindings: [
            ...getRayMaterialTextureLayout(textures),
            {name: 'uniforms', type: 'uniform', group: 0, location: 0},
            ...[
              'primitives',
              'triangles',
              'lights',
              'nodeMinima',
              'nodeMaxima',
              'leafPrimitiveIds',
              'blasNodes',
              'blasTriangleIds'
            ].map((name, index) => ({
              name,
              type: 'read-only-storage' as const,
              group: 0,
              location: index + 1
            })),
            {
              name: 'outputImage',
              type: 'storage',
              group: 0,
              location: 11,
              access: 'write-only',
              format: 'rgba16float'
            },
            {
              name: 'receiverPositions',
              type: 'texture',
              group: 0,
              location: 13,
              sampleType: 'unfilterable-float'
            },
            {
              name: 'receiverNormals',
              type: 'texture',
              group: 0,
              location: 14,
              sampleType: 'unfilterable-float'
            }
          ]
        }
      });
      cached = {source, computation};
      this.irradianceComputations.set(frameIdentifier, cached);
    }
    const {computation} = cached;
    computation.setBindings({
      ...getRayMaterialTextureBindings(textures),
      uniforms: resources.uniformBuffer,
      primitives: resources.primitiveBuffer,
      triangles: resources.triangleBuffer,
      lights: resources.lightBuffer,
      nodeMinima: resources.nodeMinimaBuffer,
      nodeMaxima: resources.nodeMaximaBuffer,
      leafPrimitiveIds: resources.sortedPrimitiveIdsBuffer,
      blasNodes: resources.blasNodesBuffer,
      blasTriangleIds: resources.blasTriangleIdsBuffer,
      receiverPositions: positions,
      receiverNormals: normals,
      outputImage: output
    });
    const pass = this.device.beginComputePass();
    computation.dispatch(pass, Math.ceil(output.width / 8), Math.ceil(output.height / 8));
    pass.end();
  }

  private getEmitterAreaCache(frameIdentifier: string): EmitterAreaCache {
    let cache = this.emitterAreaCaches.get(frameIdentifier);
    if (!cache) {
      cache = new Map();
      this.emitterAreaCaches.set(frameIdentifier, cache);
    }
    return cache;
  }

  destroyFrame(frameIdentifier: string): void {
    this.irradianceComputations.get(frameIdentifier)?.computation.destroy();
    this.irradianceComputations.delete(frameIdentifier);
    this.emitterAreaCaches.delete(frameIdentifier);
    const resources = this.frames.get(frameIdentifier);
    if (!resources) {
      return;
    }
    resources.topologyGraph.destroy();
    resources.meshRefitGraph?.destroy();
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
    resources.momentHistory?.destroy();
    resources.traversalTexture?.destroy();
    this.frames.delete(frameIdentifier);
  }

  destroyScene(scene: GroupNode): void {
    const cached = this.scenegraphs.get(scene);
    if (!cached) return;
    this.destroyFrame(cached.id);
    cached.adapter.destroy();
    this.scenegraphs.delete(scene);
  }

  destroy(): void {
    for (const scene of this.scenegraphs.keys()) this.destroyScene(scene);
    for (const frameIdentifier of Array.from(this.frames.keys())) {
      this.destroyFrame(frameIdentifier);
    }
    this.emitterAreaCaches.clear();
    this.pickComputation?.destroy();
    this.pickComputation = undefined;
    this.channelComputation?.destroy();
    this.channelComputation = undefined;
  }

  private createFrameResources(props: {
    frameIdentifier: string;
    shaderOptions: RayTracingShaderOptions;
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
      internalDimensions.height,
      'rgba16float',
      props.shaderOptions.separateLobeHistories
    );
    const metadataHistory = this.createTextureHistory(
      frameIdentifier,
      'history-metadata',
      internalDimensions.width,
      internalDimensions.height
    );
    const momentHistory = props.shaderOptions.trackMoments
      ? this.createTextureHistory(
          frameIdentifier,
          'history-moments',
          internalDimensions.width,
          internalDimensions.height,
          'rg32float'
        )
      : undefined;
    const traversalTexture = props.shaderOptions.sampleTraversal
      ? this.createTraversalTexture(internalDimensions.width, internalDimensions.height)
      : undefined;
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
      surfaces: props.surfaces,
      shaderOptions: props.shaderOptions,
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
      metadataHistory,
      momentHistory,
      traversalTexture
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
      momentHistory,
      traversalTexture,
      topologyGraph,
      accelerationGraph,
      refitGraph,
      traceGraph,
      shaderOptions: props.shaderOptions,
      topologyRevision: '',
      deformationRevision: '',
      primitiveRevision: '',
      transformRevision: '',
      lightRevision: '',
      renderRevision: '',
      geometryLayouts: props.topology.geometryLayouts,
      retainedSurfaces: props.surfaces,
      materialTextureRevision: getRayMaterialTextureRevision(props.surfaces),
      materialTextures: getRayMaterialTextures(props.surfaces),
      materialSamplers: getRayMaterialTextures(props.surfaces).map(texture => texture.sampler),
      materialContentRevision: JSON.stringify(
        props.surfaces.map(surface => surface.material.version)
      ),
      previousTransforms: props.primitiveData.previousTransforms,
      primitivePlacements: props.primitiveData.placements,
      pickIdentities: props.primitiveData.pickIdentities,
      pendingPreviousTransformInstanceIds: new Set(),
      previousTransformsNeedCommit: false,
      previousViewProjection: new Matrix4(props.viewProjection),
      previousCameraPosition: Array.from(props.cameraPosition),
      historyNeedsReset: true,
      hasGuideHistory: false,
      topologyNeedsUpdate: true,
      meshRefitsSinceRebuild: 0,
      accelerationUpdateMode: 'rebuild',
      refitsSinceMortonRebuild: 0,
      frameIndex: 0,
      accumulatedFrameCount: 0,
      completedSweepSamples: 0,
      usedRayBatchOverride: false,
      primitiveCount: scene.primitiveCount,
      primitiveCapacity,
      leafCapacity,
      lightCount: scene.lightCount,
      emitterPrimitiveIndices: scene.emitterPrimitiveIndices,
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
    presentation: RayTracingPresentationOptions,
    shaderOptions: RayTracingShaderOptions
  ): void {
    resources.traceGraph.destroy();
    resources.colorHistory.destroy();
    resources.metadataHistory.destroy();
    resources.momentHistory?.destroy();
    resources.traversalTexture?.destroy();
    resources.colorHistory = this.createTextureHistory(
      frameIdentifier,
      'history',
      internalWidth,
      internalHeight,
      'rgba16float',
      shaderOptions.separateLobeHistories
    );
    resources.metadataHistory = this.createTextureHistory(
      frameIdentifier,
      'history-metadata',
      internalWidth,
      internalHeight
    );
    resources.momentHistory = shaderOptions.trackMoments
      ? this.createTextureHistory(
          frameIdentifier,
          'history-moments',
          internalWidth,
          internalHeight,
          'rg32float'
        )
      : undefined;
    resources.traversalTexture = shaderOptions.sampleTraversal
      ? this.createTraversalTexture(internalWidth, internalHeight)
      : undefined;
    resources.traceGraph = this.createTraceGraph({
      surfaces: resources.retainedSurfaces,
      shaderOptions,
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
      metadataHistory: resources.metadataHistory,
      traversalTexture: resources.traversalTexture,
      momentHistory: resources.momentHistory
    });
    resources.displayWidth = displayWidth;
    resources.shaderOptions = shaderOptions;
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
    presentation: RayTracingPresentationOptions,
    shaderOptions: RayTracingShaderOptions
  ): void {
    const traceGraph = this.createTraceGraph({
      surfaces: resources.retainedSurfaces,
      shaderOptions,
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
      metadataHistory: resources.metadataHistory,
      traversalTexture: resources.traversalTexture,
      momentHistory: resources.momentHistory
    });
    resources.traceGraph.destroy();
    resources.traceGraph = traceGraph;
    resources.shaderOptions = shaderOptions;
    resources.presentation = presentation;
  }

  private createTraversalTexture(width: number, height: number): Texture {
    return this.device.createTexture({
      id: 'anari-sampled-ray-traversal',
      width: 2 * Math.ceil(width / 8),
      height: Math.ceil(height / 8),
      format: 'rgba32uint',
      usage: Texture.STORAGE | Texture.COPY_SRC
    });
  }

  private createTextureHistory(
    frameIdentifier: string,
    suffix: string,
    width: number,
    height: number,
    format: TextureFormatColor = 'rgba16float',
    separateLobes = false
  ): GPUTextureHistory {
    return new GPUTextureHistory(this.device, {
      id: `${frameIdentifier}-ray-tracing-${suffix}`,
      width,
      height,
      format,
      ...(separateLobes ? {dimension: '2d-array', depth: 3} : {}),
      usage: Texture.SAMPLE | Texture.STORAGE | (suffix === 'history' ? Texture.COPY_SRC : 0)
    });
  }

  private createTopologyGraph(props: {
    frameIdentifier: string;
    topology: RayTracingTopology;
    triangleBuffer: Buffer;
    blasNodesBuffer: Buffer;
    blasTriangleIdsBuffer: Buffer;
    reuseTriangleOrder?: boolean;
  }): CompiledGPUCommandGraph {
    const graph = new GPUCommandGraph(this.device, {
      id: `scene-${props.frameIdentifier}-ray-tracing-${props.reuseTriangleOrder ? 'mesh-refit' : 'topology'}`
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

      if (!props.reuseTriangleOrder) {
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
          graph.add(
            new GPUSort({
              id: `${props.frameIdentifier}-blas-${geometryIndex}-sort-triangle-morton-keys`,
              keys: geometryMortonKeys,
              values: geometryLocalTriangleIds,
              outputKeys: geometrySortedMortonKeys,
              outputValues: geometrySortedTriangleIds
            })
          );
        }
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
        graph.add(blas);
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

    if (localSortSegments.length > 0) {
      graph.add(
        new GPUSegmentedSort({
          id: `${props.frameIdentifier}-blas-sort-triangle-morton-keys`,
          keys: mortonKeys,
          values: localTriangleIds,
          outputKeys: sortedMortonKeys,
          outputValues: sortedTriangleIds,
          segments: localSortSegments
        })
      );
    }

    if (deferredHierarchyPasses.length > 0) {
      for (const hierarchyPasses of deferredHierarchyPasses) {
        hierarchyPasses.addGatherPass();
      }

      if (localHierarchySegments.length > 0) {
        graph.add(
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
          })
        );
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

    graph.add(
      new GPUSort({
        id: `${props.frameIdentifier}-sort-primitive-morton-keys`,
        keys: mortonKeys,
        values: primitiveIds,
        outputKeys: sortedMortonKeys,
        outputValues: sortedPrimitiveIds
      })
    );

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

    graph.add(acceleration);

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

    graph.add(refit);

    return graph.compile();
  }

  private createTraceGraph(props: {
    surfaces: readonly SceneSurface[];
    shaderOptions: RayTracingShaderOptions;
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
    /** Optional retained moments shared by carry, trace, and presentation. */
    momentHistory?: GPUTextureHistory;
    traversalTexture?: Texture;
  }): CompiledGPUCommandGraph<RayTracingTraceGraphParameters> {
    const graph = new GPUCommandGraph<RayTracingTraceGraphParameters>(this.device, {
      id: `scene-${props.frameIdentifier}-ray-tracing-trace`
    });
    // CORE guarantees 16 sampled textures per stage, including the history inputs.
    const materialTextureLimit = props.momentHistory ? 13 : 14;
    const materialTextures = getRayMaterialTextures(props.surfaces, false, materialTextureLimit);
    const materialViews = materialTextures.map((texture, index) =>
      graph.createTextureView(
        graph.importTexture(
          {
            id: `material-texture-${index}`,
            format: texture.format,
            width: texture.width,
            height: texture.height,
            mipLevels: texture.mipLevels,
            usage: Texture.SAMPLE
          },
          texture
        )
      )
    );
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
    const splitHistory = props.shaderOptions.separateLobeHistories;
    const colorDimension = splitHistory ? ('2d-array' as const) : ('2d' as const);
    const specializeHistory = (source: string) =>
      splitHistory ? getSplitRayTracingHistoryShader(source) : source;
    const history = graph.importTexture(
      {
        id: 'history',
        dimension: colorDimension,
        depth: splitHistory ? 3 : 1,
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
        dimension: colorDimension,
        depth: splitHistory ? 3 : 1,
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

    const compositeView = splitHistory
      ? graph.createTextureView(output, {dimension: '2d', baseArrayLayer: 2, arrayLayerCount: 1})
      : outputView;

    /** Imports a role of the optional ping-pong moments as a sampled/storage view. */
    const importMomentView = (id: string, texture: Texture) =>
      graph.createTextureView(
        graph.importTexture(
          {
            id,
            format: 'rg32float',
            width: props.internalWidth,
            height: props.internalHeight,
            usage: Texture.SAMPLE | Texture.STORAGE
          },
          texture
        )
      );
    const momentViews = props.momentHistory && {
      history: importMomentView('history-moments', props.momentHistory.previousTexture),
      output: importMomentView('output-moments', props.momentHistory.currentTexture)
    };
    const momentResources = momentViews
      ? [
          {texture: momentViews.history, usage: 'sampled' as const},
          {texture: momentViews.output, usage: 'storage-write' as const}
        ]
      : [];
    /** Declares the moment bindings after each compute pipeline's existing bindings. */
    const momentLayout = (location: number) =>
      momentViews
        ? ([
            {
              name: 'historyMoments',
              type: 'texture',
              group: 0,
              location,
              sampleType: 'unfilterable-float'
            },
            {
              name: 'outputMoments',
              type: 'storage',
              group: 0,
              location: location + 1,
              access: 'write-only',
              format: 'rg32float'
            }
          ] as const)
        : [];
    const usesPresentationGuides = rayTracingPresentationUsesGuides(
      props.presentation.denoiseRadius,
      props.presentation.debugView
    );
    const presentMoments =
      momentViews &&
      (props.presentation.denoiseRadius > 0 || props.presentation.debugView === 'variance');

    graph.addComputePass({
      id: `${props.frameIdentifier}-carry-ray-tracing-history`,
      condition: {
        id: 'sparse-history-carry',
        source: 'cpu',
        evaluate: parameters => parameters.carryWidth > 0
      },
      resources: [
        {buffer: uniforms, usage: 'uniform'},
        {texture: historyView, usage: 'sampled'},
        {texture: historyMetadataView, usage: 'sampled'},
        {texture: outputView, usage: 'storage-write'},
        {texture: outputMetadataView, usage: 'storage-write'},
        ...momentResources
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: `${props.frameIdentifier}-ray-tracing-history-carry-computation`,
          source: specializeHistory(
            momentViews
              ? getRayTracingMomentShader(RAY_TRACING_HISTORY_CARRY_SHADER, true)
              : RAY_TRACING_HISTORY_CARRY_SHADER
          ),
          shaderLayout: {
            bindings: [
              {name: 'uniforms', type: 'uniform', group: 0, location: 0},
              {
                name: 'historyImage',
                viewDimension: colorDimension,
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
                viewDimension: colorDimension,
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
              },
              ...momentLayout(5)
            ]
          }
        });
        return {
          encode: ({computePass, getBuffer, getTextureView, parameters}) => {
            computation.setBindings({
              uniforms: getBuffer(uniforms),
              historyImage: getTextureView(historyView),
              historyMetadata: getTextureView(historyMetadataView),
              outputImage: getTextureView(outputView),
              outputMetadata: getTextureView(outputMetadataView),
              ...(momentViews && {
                historyMoments: getTextureView(momentViews.history),
                outputMoments: getTextureView(momentViews.output)
              })
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

    const traversalView =
      props.traversalTexture &&
      graph.createTextureView(
        graph.importTexture(
          {
            id: 'sampled-traversal',
            format: 'rgba32uint',
            width: props.traversalTexture.width,
            height: props.traversalTexture.height,
            usage: Texture.STORAGE
          },
          props.traversalTexture
        )
      );
    const traceSource = momentViews
      ? getRayTracingMomentShader(RAY_TRACING_SCENE_SHADER)
      : RAY_TRACING_SCENE_SHADER;
    graph.addComputePass({
      id: `${props.frameIdentifier}-trace-rays`,
      resources: [
        ...materialViews.map(texture => ({texture, usage: 'sampled' as const})),
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
        {texture: outputMetadataView, usage: 'storage-write'},
        ...momentResources,
        ...(traversalView ? [{texture: traversalView, usage: 'storage-write' as const}] : [])
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: `${props.frameIdentifier}-ray-tracing-computation`,
          // Avoid compiling the transport and sampling paths the frame cannot use.
          source: getRayMaterialTextureShader(
            specializeHistory(
              traversalView ? getSampledRayTraversalShader(traceSource) : traceSource
            )
              .replace(
                '/* PBR_TRANSPORT_ENABLED */ uniforms.sampling.w > 0u',
                String(props.shaderOptions.pbrTransport)
              )
              .replace('/* PATH_BOUNCES_ENABLED */ true', String(props.shaderOptions.hasBounces))
              .replace('/* FILTERED_CUTOUTS */ true', String(props.shaderOptions.filteredCutouts))
              .replace(
                '/* TRANSMISSIVE_SHADOWS */ false',
                String(props.shaderOptions.transmissiveShadows)
              )
              .replace(
                '/* ENVIRONMENT_LIGHTING_ENABLED */ false',
                String(props.shaderOptions.environmentLighting)
              )
              .replace(
                '/* DIRECTIONAL_ENVIRONMENT_ENABLED */ false',
                String(props.shaderOptions.directionalEnvironment)
              )
              .replace(
                '/* EMITTER_SAMPLING_ENABLED */ true',
                String(props.shaderOptions.emitterSampling)
              )
              .replace(
                '/* EMITTER_MIS_ENABLED */ true',
                String(props.shaderOptions.emitterSampling && props.shaderOptions.hasBounces)
              ),
            props.surfaces,
            false,
            materialTextureLimit
          ),
          shaderLayout: {
            bindings: [
              ...getRayMaterialTextureLayout(materialTextures),
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
                viewDimension: colorDimension,
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
                viewDimension: colorDimension,
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
              },
              ...momentLayout(13),
              ...(traversalView
                ? [
                    {
                      name: 'traversalOutput',
                      type: 'storage' as const,
                      group: 0,
                      location: 15,
                      access: 'write-only' as const,
                      format: 'rgba32uint' as const
                    }
                  ]
                : [])
            ]
          }
        });
        return {
          encode: ({computePass, getBuffer, getTextureView, parameters}) => {
            computation.setBindings({
              ...Object.fromEntries(
                materialViews.flatMap((view, index) => [
                  [`materialTexture${index}`, getTextureView(view)],
                  [`materialSampler${index}`, materialTextures[index].sampler]
                ])
              ),
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
              outputMetadata: getTextureView(outputMetadataView),
              ...(traversalView && {traversalOutput: getTextureView(traversalView)}),
              ...(momentViews && {
                historyMoments: getTextureView(momentViews.history),
                outputMoments: getTextureView(momentViews.output)
              })
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
      resources: [
        {texture: compositeView, usage: 'sampled'},
        ...(presentMoments ? [{texture: momentViews.output, usage: 'sampled' as const}] : []),
        ...(usesPresentationGuides
          ? [{texture: outputMetadataView, usage: 'sampled' as const}]
          : [])
      ],
      compile: ({device}) => {
        const model = new Model(device, {
          id: `${props.frameIdentifier}-ray-tracing-presentation`,
          source: getRayTracingScenePresentationShader({
            toneMapMode: props.presentation.toneMapMode,
            outputEncoding: props.presentation.outputEncoding,
            denoiseRadius: props.presentation.denoiseRadius,
            debugView: props.presentation.debugView,
            varianceGuidance: Boolean(presentMoments)
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
              },
              ...(presentMoments
                ? [
                    {
                      name: 'momentsImage',
                      type: 'texture' as const,
                      group: 0,
                      location: 2,
                      sampleType: 'unfilterable-float' as const
                    }
                  ]
                : []),
              ...(usesPresentationGuides
                ? [
                    {
                      name: 'metadata',
                      type: 'texture' as const,
                      group: 0,
                      location: 1,
                      sampleType: 'unfilterable-float' as const
                    }
                  ]
                : [])
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
            model.setBindings({
              image: getTextureView(compositeView),
              ...(presentMoments ? {momentsImage: getTextureView(momentViews.output)} : {}),
              ...(usesPresentationGuides ? {metadata: getTextureView(outputMetadataView)} : {})
            });
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
    denoiseRadius: options.denoiseRadius ?? 0,
    debugView: options.debugView ?? 'color',
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
    first.outputEncoding === second.outputEncoding &&
    first.denoiseRadius === second.denoiseRadius &&
    first.debugView === second.debugView
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

async function readSampledTraversalCounters(
  texture: Texture,
  width: number
): Promise<ANARIRayTraversalCounters> {
  const options = {width};
  const {byteLength, bytesPerRow} = texture.computeMemoryLayout(options);
  const buffer = texture.device.createBuffer({
    byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    texture.readBuffer(options, buffer);
    const bytes = await buffer.readAsync();
    const values = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const totals = Array<number>(8).fill(0);
    for (let row = 0; row < texture.height; row++) {
      for (let offset = 0; offset < width * 16; offset += 32) {
        for (let counter = 0; counter < totals.length; counter++) {
          totals[counter] += values.getUint32(row * bytesPerRow + offset + counter * 4, true);
        }
      }
    }
    const [
      primaryRays,
      guideRays,
      shadowRays,
      continuationRays,
      tlasNodes,
      blasNodes,
      triangleTests,
      sampledPixels
    ] = totals;
    return {
      sampledPixels,
      primaryRays,
      guideRays,
      shadowRays,
      continuationRays,
      tlasNodes,
      blasNodes,
      triangleTests
    };
  } finally {
    buffer.destroy();
  }
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

/** Requests a TLAS refit with a periodic rebuild to restore spatial ordering. */
function scheduleRefittableAccelerationUpdate(resources: RayTracingFrameResources): void {
  if (resources.accelerationUpdateMode === 'rebuild') {
    return;
  }
  resources.accelerationUpdateMode =
    resources.refitsSinceMortonRebuild >= MORTON_REBUILD_REFIT_INTERVAL ? 'rebuild' : 'refit';
}

/** Snapshots mutable joint values so in-place pose updates invalidate packed geometry. */
function getRaySkinRevision(surface: SceneSurface): number[] | undefined {
  const palette = getRaySkin(surface)?.palette;
  return palette && Array.from(palette);
}

/** Compares the ordered mesh ranges used by the compiled bottom-level graph. */
function hasMatchingPackedGeometryLayout(
  previous: ReadonlyMap<string, RayTracingGeometryLayout>,
  next: ReadonlyMap<string, RayTracingGeometryLayout>
): boolean {
  if (previous.size !== next.size) return false;
  /** Packed offsets and capacities derive from the ordered triangle counts. */
  const previousLayouts = Array.from(previous.values());
  return Array.from(next.values()).every(
    (layout, index) => layout.triangleCount === previousLayouts[index].triangleCount
  );
}

/** Snapshots CPU deformation inputs separately from structural scene changes. */
function getDeformationRevision(options: RayTracingSceneRenderOptions): string {
  return JSON.stringify(
    options.surfaces
      .filter(
        surface =>
          options.primitives?.[surface.id]?.type !== 'sphere' &&
          (surface.morphTargets?.length || surface.skin?.jointMatrices?.length)
      )
      .map(surface => [surface.id, surface.morphWeights, getRaySkinRevision(surface)])
  );
}

/** Identifies changes to geometry, placements, or primitive types that require new graphs. */
function getTopologyRevision(options: RayTracingSceneRenderOptions): string {
  return JSON.stringify([
    options.sceneRevisions?.identity,
    options.surfaces.map(surface => [
      surface.id,
      surface.geometry.id,
      surface.geometryVersion,
      surface.transforms.length,
      (surface as RayTracingSceneSurface).instanceIds,
      options.primitives?.[surface.id]
    ])
  ]);
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
      surface.material.alphaMode,
      surface.material.doubleSided,
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
    return `${options.sceneRevisions.identity}:${options.sceneRevisions.lights}:${options.emitterSampling ?? false}:${options.emitterSelection ?? 'uniform'}`;
  }
  return JSON.stringify([lights, options.emitterSampling, options.emitterSelection]);
}

function getRenderRevision(
  options: RayTracingSceneRenderOptions,
  inverseViewProjection: Matrix4
): string {
  // Primary-hit reprojection cannot validate view-dependent secondary reflections.
  // Keep ordinary diffuse camera reprojection, but reset reflective paths on camera changes.
  const reflectiveTransport =
    options.transportMode === 'pbr' &&
    ((options.maxBounces ?? 0) > 0 ||
      options.emitterSampling === true ||
      Boolean(options.environmentMap || options.environmentRadiance?.some(channel => channel > 0)));
  const cameraRevision =
    (options.temporalReprojection ?? true) &&
    (!reflectiveTransport || options.separateLobeHistories)
      ? undefined
      : [Array.from(inverseViewProjection), Array.from(options.camera.position)];
  return JSON.stringify([
    options.cameraProjection,
    cameraRevision,
    options.background,
    options.environmentRadiance,
    options.exposure,
    options.fogColor,
    options.fogDensity,
    options.samplesPerPixel,
    options.samplingSeed,
    options.imageRegion,
    options.historySampleLimit,
    options.maxBounces,
    options.transportMode,
    options.emitterSampling,
    options.emitterSelection,
    options.progressive,
    options.shadows,
    options.filteredCutouts,
    options.transmissiveShadows,
    options.roughDielectricTransmission,
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
  const pickIdentities: RayTracingPickIdentity[] = [];
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
      primitiveValues[primitiveOffset + 68] =
        surface.material.alphaMode === 'MASK'
          ? (materialUniforms?.alphaCutoff ?? 0.5)
          : surface.material.alphaMode === 'BLEND'
            ? RAY_BLEND_ALPHA_MODE
            : RAY_OPAQUE_ALPHA_MODE;
      primitiveValues[primitiveOffset + 69] = materialUniforms?.transmissionFactor ?? 0;
      primitiveValues[primitiveOffset + 70] = materialUniforms?.ior ?? 1.5;
      primitiveValues[primitiveOffset + 71] = surfaceIndex;
      const attenuationColor = materialUniforms?.attenuationColor ?? [1, 1, 1];
      primitiveValues.set(attenuationColor, primitiveOffset + 72);
      const attenuationDistance = materialUniforms?.attenuationDistance;
      primitiveValues[primitiveOffset + 75] =
        attenuationDistance && Number.isFinite(attenuationDistance) && attenuationDistance > 0
          ? attenuationDistance
          : 0;
      primitiveValues.set(materialUniforms?.specularColorFactor ?? [1, 1, 1], primitiveOffset + 76);
      primitiveValues[primitiveOffset + 79] = materialUniforms?.specularIntensityFactor ?? 1;
      primitiveValues[primitiveOffset + 80] = materialUniforms?.clearcoatFactor ?? 0;
      primitiveValues[primitiveOffset + 81] = materialUniforms?.clearcoatRoughnessFactor ?? 0.18;
      primitiveValues[primitiveOffset + 82] = materialUniforms?.occlusionStrength ?? 1;
      primitiveValues[primitiveOffset + 83] = 1;
      primitiveValues.set(materialUniforms?.sheenColorFactor ?? [0, 0, 0], primitiveOffset + 84);
      primitiveValues[primitiveOffset + 87] = materialUniforms?.sheenRoughnessFactor ?? 0.5;
      const thicknessRange = materialUniforms?.iridescenceThicknessRange ?? [100, 400];
      primitiveValues[primitiveOffset + 88] = materialUniforms?.iridescenceFactor ?? 0;
      primitiveValues[primitiveOffset + 89] = materialUniforms?.iridescenceIor ?? 1.3;
      primitiveValues[primitiveOffset + 90] = thicknessRange[0];
      primitiveValues[primitiveOffset + 91] = thicknessRange[1];
      const anisotropyDirection = materialUniforms?.anisotropyDirection ?? [1, 0];
      primitiveValues[primitiveOffset + 92] = anisotropyDirection[0];
      primitiveValues[primitiveOffset + 93] = anisotropyDirection[1];
      primitiveValues[primitiveOffset + 94] = materialUniforms?.anisotropyStrength ?? 0;
      primitiveValues[primitiveOffset + 95] = materialUniforms?.anisotropyRotation ?? 0;
      const transmissionColor = materialUniforms?.diffuseTransmissionColorFactor ?? [1, 1, 1];
      primitiveValues.set(transmissionColor, primitiveOffset + 96);
      primitiveValues[primitiveOffset + 99] = materialUniforms?.diffuseTransmissionFactor ?? 0;
      primitiveValues[primitiveOffset + 100] = Number(materialUniforms?.unlit ?? false);
      primitiveValues[primitiveOffset + 101] = Math.max(0, materialUniforms?.dispersion ?? 0);
      // Keep legacy direct scene materials two-sided unless they explicitly opt out.
      primitiveValues[primitiveOffset + 102] = Number(surface.material.doubleSided === false);
      nextPreviousTransforms.set(placementIdentifier, new Matrix4(transform));
      placements.set(instanceIds?.[transformIndex] ?? placementIdentifier, {
        surface,
        surfaceIndex,
        transformIndex,
        primitiveIndex,
        placementIdentifier
      });
      pickIdentities.push({
        surfaceId: surface.id,
        placementId: instanceIds?.[transformIndex] ?? placementIdentifier
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
    placements,
    pickIdentities
  };
}

function makeRayTracingScene(
  primitiveData: RayTracingPrimitiveData,
  triangles: Float32Array,
  lights: readonly Light[],
  emitterSampling: boolean,
  options: RayTracingSceneRenderOptions,
  areaCache: EmitterAreaCache
): RayTracingScene {
  const emitterPrimitiveIndices = getEmissivePrimitiveIndices(primitiveData.primitives);
  return {
    primitives: primitiveData.primitives,
    triangles,
    lights: makeLightData(
      lights,
      emitterSampling ? emitterPrimitiveIndices : [],
      options,
      areaCache
    ),
    emitterPrimitiveIndices,
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
  const positionAttribute = engineGeometry.attributes['POSITION'];
  const normalAttribute = engineGeometry.attributes['NORMAL'];
  const tangentAttribute = engineGeometry.attributes['TANGENT'];
  const baseTangents =
    tangentAttribute?.size === 4 ? decodeMorphTargetAttribute(tangentAttribute) : undefined;
  const coordinates = engineGeometry.attributes['TEXCOORD_0']?.value;
  if (!positionAttribute || !normalAttribute) {
    throw new Error('Ray tracing scene geometry requires positions and normals.');
  }

  const skin = getRaySkin(surface);
  const {morphTargets, morphWeights} = surface;
  const needsMorph = morphTargets?.length && morphWeights?.some(Boolean);
  const base =
    skin || needsMorph
      ? {
          POSITION: decodeMorphTargetAttribute(positionAttribute),
          NORMAL: decodeMorphTargetAttribute(normalAttribute),
          TANGENT: baseTangents
        }
      : undefined;
  const morphed =
    base && morphTargets?.length && morphWeights?.some(Boolean)
      ? applyMorphTargets(base, morphTargets, morphWeights)
      : undefined;
  const posed =
    skin && base
      ? applyRaySkin(skin, {
          POSITION: morphed?.POSITION ?? base.POSITION,
          NORMAL: morphed?.NORMAL ?? base.NORMAL,
          TANGENT: morphed?.TANGENT ?? base.TANGENT
        })
      : morphed;
  const positions = posed?.POSITION ?? positionAttribute.value;
  const normals = posed?.NORMAL ?? normalAttribute.value;
  const tangents = posed?.TANGENT ?? baseTangents;
  const colorAttribute = engineGeometry.attributes['COLOR_0'];
  const colors = colorAttribute && decodeMorphTargetAttribute(colorAttribute);
  const triangleValues: number[] = [];
  const bounds = getGeometryBounds(positions);
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
        Number(coordinates?.[(positionIndex / 3) * 2] ?? 0)
      );
    }
    for (let cornerIndex = 0; cornerIndex < 3; cornerIndex++) {
      const normalIndex =
        Number(indices?.[vertexIndex + cornerIndex] ?? vertexIndex + cornerIndex) * 3;
      triangleValues.push(
        Number(normals[normalIndex]),
        Number(normals[normalIndex + 1]),
        Number(normals[normalIndex + 2]),
        Number(coordinates?.[(normalIndex / 3) * 2 + 1] ?? 0)
      );
    }
    const secondaryCoordinates = engineGeometry.attributes['TEXCOORD_1']?.value;
    for (let cornerIndex = 0; cornerIndex < 3; cornerIndex++) {
      const coordinateIndex =
        Number(indices?.[vertexIndex + cornerIndex] ?? vertexIndex + cornerIndex) * 2;
      triangleValues.push(
        Number(secondaryCoordinates?.[coordinateIndex] ?? 0),
        Number(secondaryCoordinates?.[coordinateIndex + 1] ?? 0)
      );
    }
    triangleValues.push(0, 0);
    for (let cornerIndex = 0; cornerIndex < 3; cornerIndex++) {
      const vertex = Number(indices?.[vertexIndex + cornerIndex] ?? vertexIndex + cornerIndex);
      const colorSize = colorAttribute?.size ?? 0;
      const offset = vertex * colorSize;
      triangleValues.push(
        colors?.[offset] ?? 1,
        colors?.[offset + 1] ?? 1,
        colors?.[offset + 2] ?? 1,
        colorSize === 4 ? (colors?.[offset + 3] ?? 1) : 1
      );
    }
    for (let cornerIndex = 0; cornerIndex < 3; cornerIndex++) {
      const offset = Number(indices?.[vertexIndex + cornerIndex] ?? vertexIndex + cornerIndex) * 4;
      triangleValues.push(
        tangents?.[offset] ?? 0,
        tangents?.[offset + 1] ?? 0,
        tangents?.[offset + 2] ?? 0,
        tangents?.[offset + 3] ?? 0
      );
    }
  }

  const compiledGeometry: CompiledRayGeometry = {
    triangles: new Float32Array(triangleValues),
    triangleCount: triangleValues.length / TRIANGLE_FLOAT_COUNT,
    bounds
  };
  if (!posed) geometryCache.set(geometryIdentifier, compiledGeometry);
  return compiledGeometry;
}

function getGeometryIdentifier(surface: SceneSurface): string {
  const base = `${surface.geometry.id}:${surface.geometryVersion ?? 0}`;
  // A posed surface shares geometry across its instances, but not with other poses.
  return getRaySkin(surface) ||
    (surface.morphTargets?.length && surface.morphWeights?.some(Boolean))
    ? JSON.stringify([base, surface.id])
    : base;
}

function getGeometryBounds(
  positions: ArrayLike<number>
): readonly [number, number, number, number] {
  if (positions.length === 0) {
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

function getEmissivePrimitiveIndices(primitives: Float32Array): number[] {
  const indices: number[] = [];
  for (let offset = 0; offset < primitives.length; offset += PRIMITIVE_FLOAT_COUNT) {
    const visible =
      primitives[offset + 68] < 0 || primitives[offset + 35] >= primitives[offset + 68];
    if (
      visible &&
      primitives[offset + 100] === 0 &&
      (primitives[offset + 41] > 0 || primitives[offset + 43] > 0) &&
      Math.max(primitives[offset + 36], primitives[offset + 37], primitives[offset + 38]) > 0
    ) {
      indices.push(offset / PRIMITIVE_FLOAT_COUNT);
    }
  }
  return indices;
}

function makeLightData(
  lights: readonly Light[],
  emitterPrimitiveIndices: readonly number[],
  options: RayTracingSceneRenderOptions,
  areaCache: EmitterAreaCache
): Float32Array {
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
  const distribution = makeEmitterDistribution(emitterPrimitiveIndices, options, areaCache);
  for (const [index, primitiveIndex] of emitterPrimitiveIndices.entries()) {
    values.push(
      primitiveIndex,
      distribution[index].probability,
      distribution[index].cumulative,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      4,
      0,
      0,
      0,
      0
    );
  }
  const map = options.environmentMap;
  if (!map) return makeStorageData(values, RAY_LIGHT_FLOAT_COUNT);
  const environmentDistribution = getEnvironmentMapDistribution(map);
  const packed = new Float32Array(values.length + environmentDistribution.length);
  packed.set(values);
  packed.set(environmentDistribution, values.length);
  return packed;
}

function makeStorageData(values: number[], minimumFloatCount: number): Float32Array {
  return values.length > 0 ? new Float32Array(values) : new Float32Array(minimumFloatCount);
}

function makeUniformData(props: {
  options: RayTracingSceneRenderOptions;
  inverseViewProjection: Matrix4;
  /** Whether the camera, transforms and lights match the preceding frame. */
  stationaryScene: boolean;
  guideMode: number;
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
  emitterCount: number;
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
  const environmentRadiance = props.options.environmentRadiance;
  data[80] = Math.max(0, environmentRadiance?.[0] ?? 0);
  data[81] = Math.max(0, environmentRadiance?.[1] ?? 0);
  data[82] = Math.max(0, environmentRadiance?.[2] ?? 0);
  unsignedData[84] = props.options.environmentMap?.width ?? 0;
  unsignedData[85] = props.options.environmentMap?.height ?? 0;
  unsignedData[86] = props.guideMode;
  unsignedData[90] = Number(props.options.roughDielectricTransmission ?? false);
  unsignedData[91] = Number(props.stationaryScene);
  unsignedData[88] = Number(props.options.filteredCutouts ?? false);
  unsignedData[89] = Number(
    props.options.surfaces.some(surface => surface.material.alphaMode === 'BLEND')
  );
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
  unsignedData[39] = props.options.samplingFrameIndex ?? props.frameIndex;
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
  unsignedData[76] = props.emitterCount;
  unsignedData[77] = Number(props.options.emitterSampling ?? false);
  unsignedData[78] = Number(props.options.emitterSelection === 'power');
  unsignedData[71] = Number(props.options.transportMode === 'pbr');
  unsignedData[70] = getHistorySampleLimit(props.options);
  unsignedData[68] = props.options.samplingSeed ?? 0;
  unsignedData[69] = Math.min(8, Math.max(0, Math.floor(props.options.maxBounces ?? 0)));
  if (props.options.imageRegion) {
    unsignedData.set(props.options.imageRegion.offset, 72);
    unsignedData.set(props.options.imageRegion.fullSize, 74);
  }
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
  currentTimeMilliseconds: number,
  previousFrameExecutionMilliseconds?: number | null
): void {
  const previousTimeMilliseconds = resources.lastRenderTimeMilliseconds;
  resources.lastRenderTimeMilliseconds = currentTimeMilliseconds;
  const frameTimeMilliseconds =
    previousFrameExecutionMilliseconds === undefined
      ? currentTimeMilliseconds - (previousTimeMilliseconds ?? currentTimeMilliseconds)
      : previousFrameExecutionMilliseconds;
  if (frameTimeMilliseconds === null) return;
  if (
    !Number.isFinite(frameTimeMilliseconds) ||
    frameTimeMilliseconds <= 0 ||
    (previousFrameExecutionMilliseconds === undefined && frameTimeMilliseconds > 1000)
  ) {
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

function getHistorySampleLimit(options: RayTracingSceneRenderOptions): number {
  return Math.min(
    256,
    Math.max(1, Math.floor(options.historySampleLimit ?? MAXIMUM_HISTORY_SAMPLES))
  );
}

function getRayTracingMemoryStatistics(
  resources: RayTracingFrameResources
): RayTracingStatistics['memory'] {
  const sceneBufferBytes = [
    resources.uniformBuffer,
    resources.primitiveBuffer,
    resources.triangleBuffer,
    resources.lightBuffer,
    resources.nodeMinimaBuffer,
    resources.nodeMaximaBuffer,
    resources.nodeChildrenBuffer,
    resources.leafIdsBuffer,
    resources.sortedPrimitiveIdsBuffer,
    resources.blasNodesBuffer,
    resources.blasTriangleIdsBuffer,
    resources.bvhCountBuffer,
    resources.bvhOverflowBuffer
  ].reduce((total, buffer) => total + buffer.byteLength, 0);
  // Double-buffered metadata, composite color, optional lobes, and optional moments.
  const historyTextureBytes =
    resources.internalWidth *
    resources.internalHeight *
    (32 +
      (resources.momentHistory ? 16 : 0) +
      (resources.shaderOptions.separateLobeHistories ? 32 : 0));
  const graphTransientBytes = [
    resources.topologyGraph,
    resources.meshRefitGraph,
    resources.accelerationGraph,
    resources.refitGraph,
    resources.traceGraph
  ].reduce((total, graph) => total + (graph?.stats.physicalTransientResourceBytes ?? 0), 0);
  const traversalCounterBytes = resources.traversalTexture
    ? resources.traversalTexture.width * resources.traversalTexture.height * 16
    : 0;
  return {
    sceneBufferBytes,
    historyTextureBytes,
    ...(traversalCounterBytes ? {traversalCounterBytes} : {}),
    graphTransientBytes,
    totalBytes: sceneBufferBytes + historyTextureBytes + graphTransientBytes + traversalCounterBytes
  };
}
