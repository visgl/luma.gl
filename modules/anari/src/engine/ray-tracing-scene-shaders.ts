// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {RayTracingDebugView} from './ray-tracing-scene-capabilities';

/** Packed alpha selector for opaque ray materials. Nonnegative values are MASK cutoffs. */
export const RAY_OPAQUE_ALPHA_MODE = -1;
/** Packed alpha selector for stochastic blend coverage. */
export const RAY_BLEND_ALPHA_MODE = -2;

const RAY_TRACING_SCENE_TYPES = /* wgsl */ `
struct RayTracingUniforms {
  inverseViewProjection: mat4x4<f32>,
  cameraPosition: vec4<f32>,
  background: vec4<f32>,
  dimensions: vec4<u32>,
  settings: vec4<f32>,
  fog: vec4<f32>,
  acceleration: vec4<u32>,
  displayPhase: vec4<u32>,
  temporal: vec4<f32>,
  previousViewProjection: mat4x4<f32>,
  previousCameraPosition: vec4<f32>,
  sampling: vec4<u32>,
  imageRegion: vec4<u32>,
  emitters: vec4<u32>,
  environmentRadiance: vec4<f32>,
  environmentMap: vec4<u32>, // Width, height, guide mode, reserved.
  visibility: vec4<u32>,
};

struct RayPrimitive {
  transform: mat4x4<f32>,
  inverseTransform: mat4x4<f32>,
  baseColor: vec4<f32>,
  emissive: vec4<f32>,
  properties: vec4<f32>,
  bounds: vec4<f32>,
  blas: vec4<f32>,
  previousTransform: mat4x4<f32>,
  material: vec4<f32>,
  attenuation: vec4<f32>,
  specular: vec4<f32>,
  clearcoatOcclusion: vec4<f32>, // Coat strength, coat roughness, occlusion strength, occlusion sample.
  sheen: vec4<f32>,
  iridescence: vec4<f32>, // Strength, film IOR, minimum thickness, effective thickness in nm.
  anisotropy: vec4<f32>, // Tangent-space direction, strength, rotation in radians.
  diffuseTransmission: vec4<f32>, // Tint and fraction of the diffuse lobe.
  materialFlags: vec4<f32>, // Unlit flag, dispersion, one-sided flag, reserved.
};

struct RayBlasNode {
  minimum: vec4<f32>,
  maximum: vec4<f32>,
};
`;

/** Publishes conservative world-space instance bounds for the graph-owned GPU BVH. */
export const RAY_TRACING_BOUNDS_SHADER = /* wgsl */ `
${RAY_TRACING_SCENE_TYPES}

@group(0) @binding(0) var<uniform> uniforms: RayTracingUniforms;
@group(0) @binding(1) var<storage, read> primitives: array<RayPrimitive>;
@group(0) @binding(2) var<storage, read_write> primitiveMinima: array<f32>;
@group(0) @binding(3) var<storage, read_write> primitiveMaxima: array<f32>;
@group(0) @binding(4) var<storage, read> blasNodes: array<RayBlasNode>;

const INVALID_BOUND = 3.402823466e+38;

@compute @workgroup_size(128)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let primitiveIndex = invocation.x;
  if (primitiveIndex >= uniforms.acceleration.z) {
    return;
  }

  let componentIndex = primitiveIndex * 3u;
  if (primitiveIndex >= uniforms.dimensions.z) {
    for (var axis = 0u; axis < 3u; axis++) {
      primitiveMinima[componentIndex + axis] = INVALID_BOUND;
      primitiveMaxima[componentIndex + axis] = -INVALID_BOUND;
    }
    return;
  }

  let primitive = primitives[primitiveIndex];
  var localCenter = primitive.bounds.xyz;
  var localExtent = vec3<f32>(max(primitive.bounds.w, 0.0));
  let usesMeshBounds = primitive.properties.y <= 0.0 && primitive.properties.w > 0.0;
  if (usesMeshBounds) {
    let rootNode = blasNodes[u32(primitive.blas.x)];
    localCenter = (rootNode.minimum.xyz + rootNode.maximum.xyz) * 0.5;
    localExtent = max((rootNode.maximum.xyz - rootNode.minimum.xyz) * 0.5, vec3<f32>(0.0));
  }
  let center = (primitive.transform * vec4<f32>(localCenter, 1.0)).xyz;
  let firstRow = vec3<f32>(
    primitive.transform[0].x,
    primitive.transform[1].x,
    primitive.transform[2].x
  );
  let secondRow = vec3<f32>(
    primitive.transform[0].y,
    primitive.transform[1].y,
    primitive.transform[2].y
  );
  let thirdRow = vec3<f32>(
    primitive.transform[0].z,
    primitive.transform[1].z,
    primitive.transform[2].z
  );
  let sphereExtent = vec3<f32>(length(firstRow), length(secondRow), length(thirdRow)) *
    max(primitive.bounds.w, 0.0);
  let meshExtent = vec3<f32>(
    dot(abs(firstRow), localExtent),
    dot(abs(secondRow), localExtent),
    dot(abs(thirdRow), localExtent)
  );
  let extent = select(sphereExtent, meshExtent, usesMeshBounds);
  let minimum = center - extent;
  let maximum = center + extent;
  for (var axis = 0u; axis < 3u; axis++) {
    primitiveMinima[componentIndex + axis] = minimum[axis];
    primitiveMaxima[componentIndex + axis] = maximum[axis];
  }
}
`;

/** Carries only unsampled sparse-phase pixels forward without full-frame texture copies. */
export const RAY_TRACING_HISTORY_CARRY_SHADER = /* wgsl */ `
${RAY_TRACING_SCENE_TYPES}

@group(0) @binding(0) var<uniform> uniforms: RayTracingUniforms;
@group(0) @binding(1) var historyImage: texture_2d<f32>;
@group(0) @binding(2) var historyMetadata: texture_2d<f32>;
@group(0) @binding(3) var outputImage: texture_storage_2d<rgba16float, write>;
@group(0) @binding(4) var outputMetadata: texture_storage_2d<rgba16float, write>;
/* MOMENT_BINDINGS */

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let phaseCount = max(uniforms.displayPhase.w, 1u);
  if (phaseCount <= 1u || invocation.y >= uniforms.dimensions.y) {
    return;
  }

  let untouchedPhaseCount = phaseCount - 1u;
  let compactWidth =
    (uniforms.dimensions.x * untouchedPhaseCount + phaseCount - 1u) / phaseCount;
  if (invocation.x >= compactWidth) {
    return;
  }

  let selectedPhase = (uniforms.displayPhase.z + invocation.y) % phaseCount;
  let blockIndex = invocation.x / untouchedPhaseCount;
  let laneIndex = invocation.x % untouchedPhaseCount;
  let pixelX = blockIndex * phaseCount + laneIndex + select(0u, 1u, laneIndex >= selectedPhase);
  if (pixelX >= uniforms.dimensions.x) {
    return;
  }

  let pixel = vec2<i32>(i32(pixelX), i32(invocation.y));
  textureStore(outputImage, pixel, textureLoad(historyImage, pixel, 0));
  if (uniforms.environmentMap.z != 0u) {
    textureStore(outputMetadata, pixel, textureLoad(historyMetadata, pixel, 0));
  }
  /* MOMENT_CARRY */
}
`;

/** Direct-light software ray tracer shared by every retained-scene rendering frontend. */
export const RAY_TRACING_SCENE_SHADER = /* wgsl */ `
${RAY_TRACING_SCENE_TYPES}

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

struct RayLight {
  colorIntensity: vec4<f32>,
  positionInnerCone: vec4<f32>,
  directionType: vec4<f32>,
  attenuationOuterCone: vec4<f32>,
};

struct Ray {
  origin: vec3<f32>,
  direction: vec3<f32>,
  footprint: vec2<f32>,
  // Zero selects deterministic visibility for picking and guide buffers.
  coverageSeed: u32,
};

fn makeRay(origin: vec3<f32>, direction: vec3<f32>) -> Ray {
  return Ray(origin, direction, vec2<f32>(0.0), 0u);
}

struct RayHit {
  distance: f32,
  normal: vec3<f32>,
  primitiveIndex: u32,
  entering: bool,
  coordinates: vec2<f32>,
  secondaryCoordinates: vec2<f32>,
  triangleIndex: u32,
  footprint: f32,
  vertexColor: vec4<f32>,
  barycentrics: vec2<f32>,
};

struct PendingRayNode {
  nodeIndex: u32,
  entryDistance: f32,
};

struct HistoricalRaySample {
  color: vec3<f32>,
  sampleCount: f32,
  valid: bool,
  moments: vec2<f32>,
};

@group(0) @binding(0) var<uniform> uniforms: RayTracingUniforms;
@group(0) @binding(1) var<storage, read> primitives: array<RayPrimitive>;
@group(0) @binding(2) var<storage, read> triangles: array<RayTriangle>;
@group(0) @binding(3) var<storage, read> lights: array<RayLight>;
@group(0) @binding(4) var<storage, read> nodeMinima: array<f32>;
@group(0) @binding(5) var<storage, read> nodeMaxima: array<f32>;
@group(0) @binding(6) var<storage, read> leafPrimitiveIds: array<u32>;
@group(0) @binding(7) var<storage, read> blasNodes: array<RayBlasNode>;
@group(0) @binding(8) var<storage, read> blasTriangleIds: array<u32>;
@group(0) @binding(9) var historyImage: texture_2d<f32>;
@group(0) @binding(10) var historyMetadata: texture_2d<f32>;
@group(0) @binding(11) var outputImage: texture_storage_2d<rgba16float, write>;
@group(0) @binding(12) var outputMetadata: texture_storage_2d<rgba16float, write>;
/* MOMENT_BINDINGS */

fn loadHistoryMoments(pixel: vec2<i32>) -> vec2<f32> {
  /* MOMENT_LOAD */
  return vec2<f32>(0.0);
}

const RAY_EPSILON = 0.0005;
const RAY_INFINITY = 1.0e20;
const PI = 3.141592653589793;
const BVH_STACK_CAPACITY = 32u;
const BLAS_STACK_CAPACITY = 32u;
fn getHistorySampleLimit() -> f32 {
  return f32(clamp(select(64u, uniforms.sampling.z, uniforms.sampling.z > 0u), 1u, 256u));
}
const MINIMUM_HISTORY_NORMAL_ALIGNMENT = 0.75;
const MAXIMUM_HISTORY_RELATIVE_DEPTH_DIFFERENCE = 0.06;
const MAXIMUM_EXACT_HISTORY_PRIMITIVE_INDEX = 2047u;
const OVERFLOW_HISTORY_PRIMITIVE_IDENTIFIER = 65504.0;

fn hashRaySample(seed: u32) -> u32 {
  var value = seed * 747796405u + 2891336453u;
  value = ((value >> ((value >> 28u) + 4u)) ^ value) * 277803737u;
  return (value >> 22u) ^ value;
}

fn makeRandom(seed: u32) -> f32 {
  return f32(hashRaySample(seed)) / 4294967295.0;
}

fn makeCameraRayAtFullCoordinates(coordinates: vec2<f32>) -> Ray {
  let clipCoordinates = vec2<f32>(coordinates.x * 2.0 - 1.0, 1.0 - coordinates.y * 2.0);
  let farPoint = uniforms.inverseViewProjection * vec4<f32>(clipCoordinates, 1.0, 1.0);
  let farPosition = farPoint.xyz / farPoint.w;
  var origin = uniforms.cameraPosition.xyz;
  if (uniforms.cameraPosition.w > 0.5) {
    let nearPoint = uniforms.inverseViewProjection * vec4<f32>(clipCoordinates, -1.0, 1.0);
    origin = nearPoint.xyz / nearPoint.w;
  }
  return makeRay(origin, normalize(farPosition - origin));
}

const FILTERED_CUTOUTS = /* FILTERED_CUTOUTS */ true;

// Continuation and explicit light rays from the same vertex share an incident cone.
fn makeSurfaceRay(incoming: Ray, distance: f32, origin: vec3<f32>, direction: vec3<f32>) -> Ray {
  var outgoing = makeRay(origin, direction);
  if (incoming.coverageSeed != 0u) {
    let directionBits = bitcast<vec3<u32>>(direction);
    outgoing.coverageSeed = hashRaySample(incoming.coverageSeed ^
      directionBits.x ^ (directionBits.y * 1973u) ^ (directionBits.z * 26699u)) | 1u;
  }
  if (FILTERED_CUTOUTS && MATERIAL_HAS_MIPMAPS) {
    outgoing.footprint = vec2<f32>(incoming.footprint.x + incoming.footprint.y * distance,
      incoming.footprint.y);
  }
  return outgoing;
}

fn getCutoutFootprint(ray: Ray, hit: RayHit) -> f32 {
  if (!FILTERED_CUTOUTS || !MATERIAL_HAS_MIPMAPS || !any(ray.footprint > vec2<f32>(0.0))) {
    return 0.0;
  }
  return getSecondaryFootprint(ray, hit, ray.footprint.x + ray.footprint.y * hit.distance);
}


// Use the internal pixel spacing for visibility in both rendering and display-resolution queries.
fn makeVisibilityCameraRay(coordinates: vec2<f32>, pixelStep: vec2<f32>) -> Ray {
  var ray = makeCameraRayAtFullCoordinates(coordinates);
  if (FILTERED_CUTOUTS && MATERIAL_HAS_MIPMAPS && uniforms.visibility.x != 0u) {
    let horizontal = makeCameraRayAtFullCoordinates(coordinates + vec2<f32>(pixelStep.x, 0.0));
    let vertical = makeCameraRayAtFullCoordinates(coordinates + vec2<f32>(0.0, pixelStep.y));
    ray.footprint = vec2<f32>(
      max(length(horizontal.origin - ray.origin), length(vertical.origin - ray.origin)),
      max(length(horizontal.direction - ray.direction), length(vertical.direction - ray.direction))
    );
  }
  return ray;
}

fn makeCameraRayAtCoordinates(coordinates: vec2<f32>) -> Ray {
  if (uniforms.imageRegion.z > 0u) {
    let size = vec2<f32>(uniforms.imageRegion.zw);
    return makeVisibilityCameraRay((coordinates * vec2<f32>(uniforms.displayPhase.xy)
      + vec2<f32>(uniforms.imageRegion.xy)) / size, 1.0 / size);
  }
  return makeVisibilityCameraRay(coordinates, 1.0 / vec2<f32>(uniforms.dimensions.xy));
}

fn getFullSampleCoordinates(pixel: vec2<u32>, offset: vec2<f32>) -> vec2<f32> {
  if (uniforms.imageRegion.z > 0u) {
    return (vec2<f32>(pixel + uniforms.imageRegion.xy) + offset) / vec2<f32>(uniforms.imageRegion.zw);
  }
  return (vec2<f32>(pixel) + offset) / vec2<f32>(uniforms.dimensions.xy);
}

fn makeCameraRayAtOffset(pixel: vec2<u32>, offset: vec2<f32>) -> Ray {
  let size = select(uniforms.dimensions.xy, uniforms.imageRegion.zw, uniforms.imageRegion.z > 0u);
  return makeVisibilityCameraRay(getFullSampleCoordinates(pixel, offset), 1.0 / vec2<f32>(size));
}

fn getSamplingPixelIndex(pixel: vec2<u32>) -> u32 {
  if (uniforms.imageRegion.z > 0u) {
    let fullPixel = pixel + uniforms.imageRegion.xy;
    return fullPixel.y * uniforms.imageRegion.z + fullPixel.x;
  }
  return pixel.y * uniforms.dimensions.x + pixel.x;
}

fn makeRadianceSampleOffset(pixel: vec2<u32>, sampleIndex: u32) -> vec2<f32> {
  let pixelIndex = getSamplingPixelIndex(pixel);
  let pixelRotation = vec2<f32>(
    makeRandom((pixelIndex * 1973u + 17u) ^ uniforms.sampling.x),
    makeRandom((pixelIndex * 26699u + 101u) ^ uniforms.sampling.x)
  );
  let sequenceIndex = uniforms.acceleration.w * 16u + sampleIndex;
  let lowDiscrepancyOffset = vec2<f32>(
    f32(sequenceIndex) * 0.7548776662466927,
    f32(sequenceIndex) * 0.5698402909980532
  );
  return fract(pixelRotation + lowDiscrepancyOffset);
}

fn makeCameraRay(pixel: vec2<u32>, sampleIndex: u32) -> Ray {
  var ray = makeCameraRayAtOffset(pixel, makeRadianceSampleOffset(pixel, sampleIndex));
  if (uniforms.visibility.y != 0u) {
    let sequenceIndex = uniforms.acceleration.w * 16u + sampleIndex;
    ray.coverageSeed = hashRaySample(uniforms.sampling.x ^ 0xa11faceu ^
      (getSamplingPixelIndex(pixel) * 1973u) ^ (sequenceIndex * 26699u)) | 1u;
  }
  return ray;
}

fn makeGuideCameraRay(pixel: vec2<u32>) -> Ray {
  return makeCameraRayAtOffset(pixel, vec2<f32>(0.5));
}

fn intersectSphere(ray: Ray, radius: f32, minimumDistance: f32, maximumDistance: f32) -> f32 {
  let directionLength = dot(ray.direction, ray.direction);
  let halfProjection = dot(ray.origin, ray.direction);
  let discriminant = halfProjection * halfProjection -
    directionLength * (dot(ray.origin, ray.origin) - radius * radius);
  if (discriminant < 0.0) {
    return RAY_INFINITY;
  }
  let root = sqrt(discriminant);
  let firstDistance = (-halfProjection - root) / directionLength;
  let secondDistance = (-halfProjection + root) / directionLength;
  let distance = select(secondDistance, firstDistance, firstDistance > minimumDistance);
  return select(RAY_INFINITY, distance, distance > minimumDistance && distance < maximumDistance);
}

// Counters are private to a sampled invocation. Each sampled lane owns its output texels.
const SAMPLE_TRAVERSAL = /* SAMPLE_TRAVERSAL */ false;
var<private> traversalSampled: bool;
var<private> rayCounts: vec4<u32>;
var<private> traversalCounts: vec3<u32>;
/* TRAVERSAL_COUNTER_BINDING */

fn intersectTriangle(ray: Ray, triangle: RayTriangle, maximumDistance: f32) -> vec3<f32> {
  if (SAMPLE_TRAVERSAL && traversalSampled) { traversalCounts.z++; }
  let firstEdge = triangle.secondPosition.xyz - triangle.firstPosition.xyz;
  let secondEdge = triangle.thirdPosition.xyz - triangle.firstPosition.xyz;
  let perpendicular = cross(ray.direction, secondEdge);
  let determinant = dot(firstEdge, perpendicular);
  if (abs(determinant) < 0.0000001) {
    return vec3<f32>(RAY_INFINITY, 0.0, 0.0);
  }
  let inverseDeterminant = 1.0 / determinant;
  let originOffset = ray.origin - triangle.firstPosition.xyz;
  let firstWeight = dot(originOffset, perpendicular) * inverseDeterminant;
  if (firstWeight < 0.0 || firstWeight > 1.0) {
    return vec3<f32>(RAY_INFINITY, 0.0, 0.0);
  }
  let projectedOrigin = cross(originOffset, firstEdge);
  let secondWeight = dot(ray.direction, projectedOrigin) * inverseDeterminant;
  if (secondWeight < 0.0 || firstWeight + secondWeight > 1.0) {
    return vec3<f32>(RAY_INFINITY, 0.0, 0.0);
  }
  let distance = dot(secondEdge, projectedOrigin) * inverseDeterminant;
  if (distance <= RAY_EPSILON || distance >= maximumDistance) {
    return vec3<f32>(RAY_INFINITY, 0.0, 0.0);
  }
  return vec3<f32>(distance, firstWeight, secondWeight);
}

fn makeInverseRayDirection(direction: vec3<f32>) -> vec3<f32> {
  let parallelAxes = abs(direction) < vec3<f32>(0.0000001);
  let safeDirection = select(direction, vec3<f32>(1.0), parallelAxes);
  return vec3<f32>(1.0) / safeDirection;
}

fn intersectNodeBounds(
  ray: Ray,
  inverseDirection: vec3<f32>,
  nodeIndex: u32,
  maximumDistance: f32
) -> f32 {
  var nearestDistance = 0.0;
  var farthestDistance = maximumDistance;
  let componentIndex = nodeIndex * 3u;

  for (var axis = 0u; axis < 3u; axis++) {
    let minimum = nodeMinima[componentIndex + axis];
    let maximum = nodeMaxima[componentIndex + axis];
    if (minimum > maximum) {
      return RAY_INFINITY;
    }

    let origin = ray.origin[axis];
    let direction = ray.direction[axis];
    if (abs(direction) < 0.0000001) {
      if (origin < minimum || origin > maximum) {
        return RAY_INFINITY;
      }
    } else {
      let firstDistance = (minimum - origin) * inverseDirection[axis];
      let secondDistance = (maximum - origin) * inverseDirection[axis];
      nearestDistance = max(nearestDistance, min(firstDistance, secondDistance));
      farthestDistance = min(farthestDistance, max(firstDistance, secondDistance));
      if (nearestDistance > farthestDistance) {
        return RAY_INFINITY;
      }
    }
  }

  if (farthestDistance <= RAY_EPSILON || nearestDistance >= maximumDistance) {
    return RAY_INFINITY;
  }
  return nearestDistance;
}

fn intersectBlasNodeBounds(
  ray: Ray,
  inverseDirection: vec3<f32>,
  nodeIndex: u32,
  maximumDistance: f32
) -> f32 {
  var nearestDistance = 0.0;
  var farthestDistance = maximumDistance;
  let node = blasNodes[nodeIndex];

  for (var axis = 0u; axis < 3u; axis++) {
    let minimum = node.minimum[axis];
    let maximum = node.maximum[axis];
    if (minimum > maximum) {
      return RAY_INFINITY;
    }

    let origin = ray.origin[axis];
    let direction = ray.direction[axis];
    if (abs(direction) < 0.0000001) {
      if (origin < minimum || origin > maximum) {
        return RAY_INFINITY;
      }
    } else {
      let firstDistance = (minimum - origin) * inverseDirection[axis];
      let secondDistance = (maximum - origin) * inverseDirection[axis];
      nearestDistance = max(nearestDistance, min(firstDistance, secondDistance));
      farthestDistance = min(farthestDistance, max(firstDistance, secondDistance));
      if (nearestDistance > farthestDistance) {
        return RAY_INFINITY;
      }
    }
  }

  if (farthestDistance <= RAY_EPSILON || nearestDistance >= maximumDistance) {
    return RAY_INFINITY;
  }
  return nearestDistance;
}

fn isOneSidedTriangle(primitive: RayPrimitive) -> bool {
  return primitive.properties.y <= 0.0 && primitive.materialFlags.z > 0.0 &&
    primitive.material.y <= 0.0;
}

fn intersectPrimitive(ray: Ray, primitiveIndex: u32, maximumDistance: f32) -> RayHit {
  var closestHit = RayHit(maximumDistance, vec3<f32>(0.0), 0u, true, vec2<f32>(0.0), vec2<f32>(0.0), 0xffffffffu, 0.0, vec4<f32>(1.0), vec2<f32>(0.0));
  let primitive = primitives[primitiveIndex];
  let localOrigin = (primitive.inverseTransform * vec4<f32>(ray.origin, 1.0)).xyz;
  let localDirection = (primitive.inverseTransform * vec4<f32>(ray.direction, 0.0)).xyz;
  let localRay = makeRay(localOrigin, localDirection);
  let sphereRadius = primitive.properties.y;
  if (sphereRadius > 0.0) {
    var minimumDistance = RAY_EPSILON;
    // A cutout on the near side must still allow an opaque far-side intersection.
    for (var interfaceIndex = 0u; interfaceIndex < 2u; interfaceIndex++) {
      let distance = intersectSphere(localRay, sphereRadius, minimumDistance, maximumDistance);
      if (distance >= maximumDistance) { break; }
      let localNormal = normalize(localOrigin + localDirection * distance);
      let worldNormal = normalize((transpose(primitive.inverseTransform) *
        vec4<f32>(localNormal, 0.0)).xyz);
      let candidate = RayHit(distance, worldNormal, primitiveIndex, dot(worldNormal, ray.direction) < 0.0, vec2<f32>(atan2(localNormal.z, localNormal.x) / (2.0 * PI) + 0.5, acos(clamp(localNormal.y, -1.0, 1.0)) / PI), vec2<f32>(0.0), 0xffffffffu, 0.0, vec4<f32>(1.0), vec2<f32>(0.0));
      if (isMaterialVisible(candidate, ray.coverageSeed)) { return candidate; }
      minimumDistance = distance;
    }
    return closestHit;
  }

  let triangleStart = u32(primitive.properties.z);
  let triangleCount = u32(primitive.properties.w);
  let packedNodeStart = u32(primitive.blas.x);
  let triangleIdStart = u32(primitive.blas.y);
  let internalNodeCount = u32(primitive.blas.z);
  let leafCapacity = u32(primitive.blas.w);
  if (triangleCount == 0u || leafCapacity == 0u) {
    return closestHit;
  }

  let inverseLocalDirection = makeInverseRayDirection(localDirection);
  let rootBlasDistance = intersectBlasNodeBounds(
    localRay,
    inverseLocalDirection,
    packedNodeStart,
    closestHit.distance
  );
  if (rootBlasDistance >= closestHit.distance) {
    return closestHit;
  }

  var pendingBlasNodes: array<PendingRayNode, BLAS_STACK_CAPACITY>;
  var pendingBlasCount = 1u;
  pendingBlasNodes[0] = PendingRayNode(0u, rootBlasDistance);
  while (pendingBlasCount > 0u) {
    if (SAMPLE_TRAVERSAL && traversalSampled) { traversalCounts.y++; }
    pendingBlasCount--;
    let pendingBlasNode = pendingBlasNodes[pendingBlasCount];
    if (pendingBlasNode.entryDistance >= closestHit.distance) {
      continue;
    }
    let localNodeIndex = pendingBlasNode.nodeIndex;

    if (localNodeIndex >= internalNodeCount) {
      let leafIndex = localNodeIndex - internalNodeCount;
      if (leafIndex < leafCapacity) {
        let localTriangleIndex = blasTriangleIds[triangleIdStart + leafIndex];
        if (localTriangleIndex < triangleCount) {
          let triangleIndex = triangleStart + localTriangleIndex;
          let triangle = triangles[triangleIndex];
          let intersection = intersectTriangle(localRay, triangle, closestHit.distance);
          if (intersection.x < closestHit.distance) {
            let normalWeight = 1.0 - intersection.y - intersection.z;
            var localNormal = normalize(triangle.firstNormal.xyz * normalWeight +
              triangle.secondNormal.xyz * intersection.y +
              triangle.thirdNormal.xyz * intersection.z);
            let entering = dot(cross(triangle.secondPosition.xyz - triangle.firstPosition.xyz,
              triangle.thirdPosition.xyz - triangle.firstPosition.xyz), localDirection) < 0.0;
            // Transmission needs both interfaces of a closed mesh.
            if (!entering && isOneSidedTriangle(primitive)) { continue; }
            if (dot(localNormal, localDirection) > 0.0) {
              localNormal = -localNormal;
            }
            let worldNormal = normalize((transpose(primitive.inverseTransform) *
              vec4<f32>(localNormal, 0.0)).xyz);
            var candidate = RayHit(intersection.x, worldNormal, primitiveIndex, entering,
              vec2<f32>(triangle.firstPosition.w, triangle.firstNormal.w) * normalWeight +
              vec2<f32>(triangle.secondPosition.w, triangle.secondNormal.w) * intersection.y +
              vec2<f32>(triangle.thirdPosition.w, triangle.thirdNormal.w) * intersection.z,
              triangle.secondaryCoordinates[0].xy * normalWeight + triangle.secondaryCoordinates[0].zw * intersection.y + triangle.secondaryCoordinates[1].xy * intersection.z, triangleIndex, 0.0,
              triangle.colors[0] * normalWeight + triangle.colors[1] * intersection.y + triangle.colors[2] * intersection.z, intersection.yz);
            if (primitive.material.x != OPAQUE_ALPHA_MODE) {
              candidate.footprint = getCutoutFootprint(ray, candidate);
            }
            if (isMaterialVisible(candidate, ray.coverageSeed)) { closestHit = candidate; }
          }
        }
      }
      continue;
    }

    let leftNode = localNodeIndex * 2u + 1u;
    let rightNode = leftNode + 1u;
    let leftBlasDistance = intersectBlasNodeBounds(
      localRay,
      inverseLocalDirection,
      packedNodeStart + leftNode,
      closestHit.distance
    );
    let rightBlasDistance = intersectBlasNodeBounds(
      localRay,
      inverseLocalDirection,
      packedNodeStart + rightNode,
      closestHit.distance
    );
    let leftFirst = leftBlasDistance <= rightBlasDistance;
    let nearerNode = select(rightNode, leftNode, leftFirst);
    let fartherNode = select(leftNode, rightNode, leftFirst);
    let nearerBlasDistance = min(leftBlasDistance, rightBlasDistance);
    let fartherBlasDistance = max(leftBlasDistance, rightBlasDistance);

    if (fartherBlasDistance < closestHit.distance) {
      pendingBlasNodes[pendingBlasCount] = PendingRayNode(fartherNode, fartherBlasDistance);
      pendingBlasCount++;
    }
    if (nearerBlasDistance < closestHit.distance) {
      pendingBlasNodes[pendingBlasCount] = PendingRayNode(nearerNode, nearerBlasDistance);
      pendingBlasCount++;
    }
  }
  return closestHit;
}

fn intersectsPrimitive(ray: Ray, primitiveIndex: u32, maximumDistance: f32) -> bool {
  let primitive = primitives[primitiveIndex];
  // Share alpha traversal with primary rays, including UVs and both sphere interfaces.
  if (primitive.material.x != OPAQUE_ALPHA_MODE || isOneSidedTriangle(primitive)) {
    return intersectPrimitive(ray, primitiveIndex, maximumDistance).distance < maximumDistance;
  }
  let localOrigin = (primitive.inverseTransform * vec4<f32>(ray.origin, 1.0)).xyz;
  let localDirection = (primitive.inverseTransform * vec4<f32>(ray.direction, 0.0)).xyz;
  let localRay = makeRay(localOrigin, localDirection);
  let sphereRadius = primitive.properties.y;
  if (sphereRadius > 0.0) {
    return intersectSphere(localRay, sphereRadius, RAY_EPSILON, maximumDistance) < maximumDistance;
  }

  let triangleStart = u32(primitive.properties.z);
  let triangleCount = u32(primitive.properties.w);
  let packedNodeStart = u32(primitive.blas.x);
  let triangleIdStart = u32(primitive.blas.y);
  let internalNodeCount = u32(primitive.blas.z);
  let leafCapacity = u32(primitive.blas.w);
  if (triangleCount == 0u || leafCapacity == 0u) {
    return false;
  }

  let inverseLocalDirection = makeInverseRayDirection(localDirection);
  let rootBlasDistance = intersectBlasNodeBounds(
    localRay,
    inverseLocalDirection,
    packedNodeStart,
    maximumDistance
  );
  if (rootBlasDistance >= maximumDistance) {
    return false;
  }

  var pendingBlasNodes: array<PendingRayNode, BLAS_STACK_CAPACITY>;
  var pendingBlasCount = 1u;
  pendingBlasNodes[0] = PendingRayNode(0u, rootBlasDistance);
  while (pendingBlasCount > 0u) {
    if (SAMPLE_TRAVERSAL && traversalSampled) { traversalCounts.y++; }
    pendingBlasCount--;
    let pendingBlasNode = pendingBlasNodes[pendingBlasCount];
    if (pendingBlasNode.entryDistance >= maximumDistance) {
      continue;
    }
    let localNodeIndex = pendingBlasNode.nodeIndex;

    if (localNodeIndex >= internalNodeCount) {
      let leafIndex = localNodeIndex - internalNodeCount;
      if (leafIndex < leafCapacity) {
        let localTriangleIndex = blasTriangleIds[triangleIdStart + leafIndex];
        if (localTriangleIndex < triangleCount) {
          let triangleIndex = triangleStart + localTriangleIndex;
          if (intersectTriangle(localRay, triangles[triangleIndex], maximumDistance).x <
              maximumDistance) {
            return true;
          }
        }
      }
      continue;
    }

    let leftNode = localNodeIndex * 2u + 1u;
    let rightNode = leftNode + 1u;
    let leftBlasDistance = intersectBlasNodeBounds(
      localRay,
      inverseLocalDirection,
      packedNodeStart + leftNode,
      maximumDistance
    );
    let rightBlasDistance = intersectBlasNodeBounds(
      localRay,
      inverseLocalDirection,
      packedNodeStart + rightNode,
      maximumDistance
    );
    let leftFirst = leftBlasDistance <= rightBlasDistance;
    let nearerNode = select(rightNode, leftNode, leftFirst);
    let fartherNode = select(leftNode, rightNode, leftFirst);
    let nearerBlasDistance = min(leftBlasDistance, rightBlasDistance);
    let fartherBlasDistance = max(leftBlasDistance, rightBlasDistance);

    if (fartherBlasDistance < maximumDistance) {
      pendingBlasNodes[pendingBlasCount] = PendingRayNode(fartherNode, fartherBlasDistance);
      pendingBlasCount++;
    }
    if (nearerBlasDistance < maximumDistance) {
      pendingBlasNodes[pendingBlasCount] = PendingRayNode(nearerNode, nearerBlasDistance);
      pendingBlasCount++;
    }
  }
  return false;
}

fn intersectScene(ray: Ray, maximumDistance: f32) -> RayHit {
  var closestHit = RayHit(maximumDistance, vec3<f32>(0.0), 0u, true, vec2<f32>(0.0), vec2<f32>(0.0), 0xffffffffu, 0.0, vec4<f32>(1.0), vec2<f32>(0.0));
  if (uniforms.dimensions.z == 0u) {
    return closestHit;
  }

  let inverseDirection = makeInverseRayDirection(ray.direction);
  let rootDistance = intersectNodeBounds(ray, inverseDirection, 0u, closestHit.distance);
  if (rootDistance >= closestHit.distance) {
    return closestHit;
  }

  var pendingNodes: array<PendingRayNode, BVH_STACK_CAPACITY>;
  var pendingCount = 1u;
  pendingNodes[0] = PendingRayNode(0u, rootDistance);

  while (pendingCount > 0u) {
    if (SAMPLE_TRAVERSAL && traversalSampled) { traversalCounts.x++; }
    pendingCount--;
    let pendingNode = pendingNodes[pendingCount];
    if (pendingNode.entryDistance >= closestHit.distance) {
      continue;
    }
    let nodeIndex = pendingNode.nodeIndex;

    if (nodeIndex >= uniforms.acceleration.x) {
      let leafIndex = nodeIndex - uniforms.acceleration.x;
      let primitiveIndex = leafPrimitiveIds[leafIndex];
      if (primitiveIndex < uniforms.dimensions.z) {
        let primitiveHit = intersectPrimitive(ray, primitiveIndex, closestHit.distance);
        if (primitiveHit.distance < closestHit.distance) {
          closestHit = primitiveHit;
        }
      }
      continue;
    }

    let leftNode = nodeIndex * 2u + 1u;
    let rightNode = leftNode + 1u;
    let leftDistance = intersectNodeBounds(ray, inverseDirection, leftNode, closestHit.distance);
    let rightDistance = intersectNodeBounds(ray, inverseDirection, rightNode, closestHit.distance);
    let leftFirst = leftDistance <= rightDistance;
    let nearerNode = select(rightNode, leftNode, leftFirst);
    let fartherNode = select(leftNode, rightNode, leftFirst);
    let nearerDistance = min(leftDistance, rightDistance);
    let fartherDistance = max(leftDistance, rightDistance);

    if (fartherDistance < closestHit.distance) {
      pendingNodes[pendingCount] = PendingRayNode(fartherNode, fartherDistance);
      pendingCount++;
    }
    if (nearerDistance < closestHit.distance) {
      pendingNodes[pendingCount] = PendingRayNode(nearerNode, nearerDistance);
      pendingCount++;
    }
  }
  return closestHit;
}

fn intersectsScene(ray: Ray, maximumDistance: f32) -> bool {
  if (SAMPLE_TRAVERSAL && traversalSampled) { rayCounts.z++; }
  if (uniforms.dimensions.z == 0u || maximumDistance <= RAY_EPSILON) {
    return false;
  }

  let inverseDirection = makeInverseRayDirection(ray.direction);
  let rootDistance = intersectNodeBounds(ray, inverseDirection, 0u, maximumDistance);
  if (rootDistance >= maximumDistance) {
    return false;
  }

  var pendingNodes: array<PendingRayNode, BVH_STACK_CAPACITY>;
  var pendingCount = 1u;
  pendingNodes[0] = PendingRayNode(0u, rootDistance);

  while (pendingCount > 0u) {
    if (SAMPLE_TRAVERSAL && traversalSampled) { traversalCounts.x++; }
    pendingCount--;
    let pendingNode = pendingNodes[pendingCount];
    if (pendingNode.entryDistance >= maximumDistance) {
      continue;
    }
    let nodeIndex = pendingNode.nodeIndex;

    if (nodeIndex >= uniforms.acceleration.x) {
      let leafIndex = nodeIndex - uniforms.acceleration.x;
      let primitiveIndex = leafPrimitiveIds[leafIndex];
      if (primitiveIndex < uniforms.dimensions.z &&
          intersectsPrimitive(ray, primitiveIndex, maximumDistance)) {
        return true;
      }
      continue;
    }

    let leftNode = nodeIndex * 2u + 1u;
    let rightNode = leftNode + 1u;
    let leftDistance = intersectNodeBounds(ray, inverseDirection, leftNode, maximumDistance);
    let rightDistance = intersectNodeBounds(ray, inverseDirection, rightNode, maximumDistance);
    let leftFirst = leftDistance <= rightDistance;
    let nearerNode = select(rightNode, leftNode, leftFirst);
    let fartherNode = select(leftNode, rightNode, leftFirst);
    let nearerDistance = min(leftDistance, rightDistance);
    let fartherDistance = max(leftDistance, rightDistance);

    if (fartherDistance < maximumDistance) {
      pendingNodes[pendingCount] = PendingRayNode(fartherNode, fartherDistance);
      pendingCount++;
    }
    if (nearerDistance < maximumDistance) {
      pendingNodes[pendingCount] = PendingRayNode(nearerNode, nearerDistance);
      pendingCount++;
    }
  }
  return false;
}

/* MATERIAL_TEXTURE_DECLARATIONS */
fn sampleMaterialTexture(identifier: u32, coordinates: vec2<f32>, footprint: vec2<f32>) -> vec4<f32> {
  switch identifier {
    /* MATERIAL_TEXTURE_CASES */
    default: { return vec4<f32>(1.0); }
  }
}
// Convert a world-space pixel footprint into a conservative UV extent using
// the dual basis of the transformed triangle edges.
fn getMaterialFootprint(hit: RayHit, transform: mat3x3<f32>, secondary: bool) -> vec2<f32> {
  if (hit.footprint <= 0.0 || hit.triangleIndex == 0xffffffffu) { return vec2<f32>(0.0); }
  let triangle = triangles[hit.triangleIndex];
  let model = primitives[hit.primitiveIndex].transform;
  let firstEdge = (model * vec4<f32>(triangle.secondPosition.xyz - triangle.firstPosition.xyz, 0.0)).xyz;
  let secondEdge = (model * vec4<f32>(triangle.thirdPosition.xyz - triangle.firstPosition.xyz, 0.0)).xyz;
  let face = cross(firstEdge, secondEdge);
  let areaSquared = dot(face, face);
  if (areaSquared <= 0.0) { return vec2<f32>(0.0); }
  let firstGradient = cross(secondEdge, face) / areaSquared;
  let secondGradient = cross(face, firstEdge) / areaSquared;
  let first = select(vec2<f32>(triangle.firstPosition.w, triangle.firstNormal.w), triangle.secondaryCoordinates[0].xy, secondary);
  let second = select(vec2<f32>(triangle.secondPosition.w, triangle.secondNormal.w), triangle.secondaryCoordinates[0].zw, secondary);
  let third = select(vec2<f32>(triangle.thirdPosition.w, triangle.thirdNormal.w), triangle.secondaryCoordinates[1].xy, secondary);
  let firstUV = (transform * vec3<f32>(second - first, 0.0)).xy;
  let secondUV = (transform * vec3<f32>(third - first, 0.0)).xy;
  return hit.footprint * vec2<f32>(
    length(firstGradient * firstUV.x + secondGradient * secondUV.x),
    length(firstGradient * firstUV.y + secondGradient * secondUV.y));
}

// Negative sentinels leave the nonnegative range available for alpha cutoffs.
const OPAQUE_ALPHA_MODE = ${RAY_OPAQUE_ALPHA_MODE}.0;
const BLEND_ALPHA_MODE = ${RAY_BLEND_ALPHA_MODE}.0;

fn isMaterialVisible(hit: RayHit, coverageSeed: u32) -> bool {
  let alphaMode = primitives[hit.primitiveIndex].material.x;
  if (alphaMode == OPAQUE_ALPHA_MODE) { return true; }
  let opacity = getMaterialOpacity(hit);
  if (alphaMode != BLEND_ALPHA_MODE) { return opacity >= alphaMode; }
  if (opacity <= 0.0) { return false; }
  if (opacity >= 1.0 || coverageSeed == 0u) { return true; }
  // Key each candidate independently so BVH traversal order cannot change coverage.
  let candidateSeed = hashRaySample(hit.primitiveIndex ^ 0x92d68ca2u) ^
    hashRaySample(hit.triangleIndex ^ select(0x85ebca6bu, 0u, hit.entering));
  return makeRandom(coverageSeed ^ candidateSeed) < opacity;
}

fn getMaterialOpacity(hit: RayHit) -> f32 {
  var opacity = primitives[hit.primitiveIndex].baseColor.a * hit.vertexColor.a;
  switch u32(primitives[hit.primitiveIndex].material.w) {
    /* MATERIAL_OPACITY_CASES */
    default: {}
  }
  return opacity;
}
fn getMaterialEmission(hit: RayHit) -> vec3<f32> {
  let primitive = primitives[hit.primitiveIndex];
  var emission = primitive.emissive.rgb;
  switch u32(primitive.material.w) {
    /* MATERIAL_EMISSION_CASES */
    default: {}
  }
  return emission;
}
fn getShadedPrimitive(hit: RayHit) -> RayPrimitive {
  var primitive = primitives[hit.primitiveIndex];
  primitive.baseColor *= hit.vertexColor;
  switch u32(primitive.material.w) {
    /* MATERIAL_SURFACE_CASES */
    default: {}
  }
  return primitive;
}

// Use authored tangents when available, or derive the frame from the sampled UV chart.
fn getTriangleTangentFrame(hit: RayHit, normal: vec3<f32>, uvTransform: mat3x3<f32>,
    secondary: bool) -> mat2x3<f32> {
  if (hit.triangleIndex == 0xffffffffu) { return mat2x3<f32>(); }
  let triangle = triangles[hit.triangleIndex];
  let weights = vec3<f32>(1.0 - hit.barycentrics.x - hit.barycentrics.y, hit.barycentrics);
  let authored = triangle.tangents[0] * weights.x +
    triangle.tangents[1] * weights.y + triangle.tangents[2] * weights.z;
  let transform = primitives[hit.primitiveIndex].transform;
  if (authored.w != 0.0) {
    let direction = (transform * vec4<f32>(authored.xyz, 0.0)).xyz;
    let projected = direction - normal * dot(normal, direction);
    if (dot(projected, projected) > 0.0) {
      let tangent = normalize(projected);
      let linearTransform = mat3x3<f32>(transform[0].xyz, transform[1].xyz, transform[2].xyz);
      let orientation = select(-1.0, 1.0, determinant(linearTransform) >= 0.0);
      let bitangent = cross(normal, tangent) * sign(authored.w) * orientation;
      return mat2x3<f32>(tangent, bitangent);
    }
  }
  let first = select(vec2<f32>(triangle.firstPosition.w, triangle.firstNormal.w),
    triangle.secondaryCoordinates[0].xy, secondary);
  let second = select(vec2<f32>(triangle.secondPosition.w, triangle.secondNormal.w),
    triangle.secondaryCoordinates[0].zw, secondary);
  let third = select(vec2<f32>(triangle.thirdPosition.w, triangle.thirdNormal.w),
    triangle.secondaryCoordinates[1].xy, secondary);
  let firstUVEdge = (uvTransform * vec3<f32>(second - first, 0.0)).xy;
  let secondUVEdge = (uvTransform * vec3<f32>(third - first, 0.0)).xy;
  let determinant = firstUVEdge.x * secondUVEdge.y - secondUVEdge.x * firstUVEdge.y;
  if (abs(determinant) <= 0.000001 * length(firstUVEdge) * length(secondUVEdge)) {
    return mat2x3<f32>();
  }

  let firstEdge = (transform * vec4<f32>(triangle.secondPosition.xyz - triangle.firstPosition.xyz, 0.0)).xyz;
  let secondEdge = (transform * vec4<f32>(triangle.thirdPosition.xyz - triangle.firstPosition.xyz, 0.0)).xyz;
  let tangentDirection = (firstEdge * secondUVEdge.y - secondEdge * firstUVEdge.y) * sign(determinant);
  let bitangentDirection = (secondEdge * firstUVEdge.x - firstEdge * secondUVEdge.x) * sign(determinant);
  let projectedTangent = tangentDirection - normal * dot(normal, tangentDirection);
  if (dot(projectedTangent, projectedTangent) <= 0.0) { return mat2x3<f32>(); }
  let tangent = normalize(projectedTangent);
  let bitangent = cross(normal, tangent);
  let handedness = select(-1.0, 1.0, dot(bitangent, bitangentDirection) >= 0.0);
  return mat2x3<f32>(tangent, bitangent * handedness);
}

fn applyNormalMap(hit: RayHit, uvTransform: mat3x3<f32>, secondary: bool,
    sampled: vec3<f32>, scale: f32) -> vec3<f32> {
  if (scale == 0.0) { return hit.normal; }
  let frame = getTriangleTangentFrame(hit, hit.normal, uvTransform, secondary);
  if (dot(frame[0], frame[0]) == 0.0) { return hit.normal; }
  let tangentNormal = sampled * 2.0 - vec3<f32>(1.0);
  let mapped = (frame * tangentNormal.xy) * scale +
    hit.normal * tangentNormal.z;
  if (dot(mapped, hit.normal) <= 0.000001) { return hit.normal; }
  return normalize(mapped);
}

fn getShadingNormal(hit: RayHit) -> vec3<f32> {
  if (hit.triangleIndex == 0xffffffffu) { return hit.normal; }
  switch u32(primitives[hit.primitiveIndex].material.w) {
    /* MATERIAL_NORMAL_CASES */
    default: {}
  }
  return hit.normal;
}

fn getFaceNormal(hit: RayHit, ray: Ray) -> vec3<f32> {
  if (hit.triangleIndex == 0xffffffffu) {
    return faceForward(hit.normal, ray.direction, hit.normal);
  }
  let triangle = triangles[hit.triangleIndex];
  let transform = primitives[hit.primitiveIndex].transform;
  let firstEdge = (transform * vec4<f32>(triangle.secondPosition.xyz - triangle.firstPosition.xyz, 0.0)).xyz;
  let secondEdge = (transform * vec4<f32>(triangle.thirdPosition.xyz - triangle.firstPosition.xyz, 0.0)).xyz;
  let normal = normalize(cross(firstEdge, secondEdge));
  return faceForward(normal, ray.direction, normal);
}

fn getDielectricReflectance(primitive: RayPrimitive) -> vec3<f32> {
  return clamp(primitive.specular.rgb * 0.04, vec3<f32>(0.0), vec3<f32>(1.0)) *
    clamp(primitive.specular.w, 0.0, 1.0);
}

fn getGrazingReflectance(primitive: RayPrimitive, reflectance: vec3<f32>, metallic: f32) -> vec3<f32> {
  let maximumReflectance = max(reflectance.r, max(reflectance.g, reflectance.b));
  return vec3<f32>(min(clamp(maximumReflectance * 25.0, 0.0, 1.0),
    mix(clamp(primitive.specular.w, 0.0, 1.0), 1.0, metallic)));
}

fn getClearcoatNormal(hit: RayHit) -> vec3<f32> {
  if (hit.triangleIndex == 0xffffffffu) { return hit.normal; }
  switch u32(primitives[hit.primitiveIndex].material.w) {
    /* MATERIAL_CLEARCOAT_NORMAL_CASES */
    default: {}
  }
  return hit.normal;
}

const MATERIAL_HAS_ANISOTROPY = /* MATERIAL_HAS_ANISOTROPY */ false;

struct AnisotropicGGX {
  tangent: vec3<f32>,
  bitangent: vec3<f32>,
  alpha: vec2<f32>,
};

fn getAnisotropyFrame(hit: RayHit, primitive: RayPrimitive, normal: vec3<f32>) -> mat2x3<f32> {
  switch u32(primitive.material.w) {
    /* MATERIAL_ANISOTROPY_CASES */
    default: {}
  }
  return getTriangleTangentFrame(hit, normal,
    mat3x3<f32>(vec3<f32>(1.0, 0.0, 0.0), vec3<f32>(0.0, 1.0, 0.0), vec3<f32>(0.0, 0.0, 1.0)), false);
}

fn getAnisotropicGGX(hit: RayHit, primitive: RayPrimitive, normal: vec3<f32>, alpha: f32) -> AnisotropicGGX {
  let isotropic = AnisotropicGGX(vec3<f32>(0.0), vec3<f32>(0.0), vec2<f32>(alpha));
  let strength = clamp(primitive.anisotropy.z, 0.0, 1.0);
  if (!MATERIAL_HAS_ANISOTROPY || strength <= 0.0) { return isotropic; }
  let frame = getAnisotropyFrame(hit, primitive, normal);
  if (dot(frame[0], frame[0]) == 0.0) { return isotropic; }
  var direction = primitive.anisotropy.xy;
  if (dot(direction, direction) <= 0.000001) { direction = vec2<f32>(1.0, 0.0); }
  let rotation = primitive.anisotropy.w;
  let axis = vec2<f32>(cos(rotation), sin(rotation));
  let rotated = vec2<f32>(dot(direction, vec2<f32>(axis.x, -axis.y)),
    dot(direction, axis.yx));
  let tangent = normalize(frame * rotated);
  return AnisotropicGGX(tangent, cross(normal, tangent),
    vec2<f32>(mix(alpha, 1.0, strength * strength), alpha));
}

fn getGGXDistribution(lobe: AnisotropicGGX, halfDirection: vec3<f32>,
    normalHalf: f32, isotropicDistribution: f32) -> f32 {
  if (!MATERIAL_HAS_ANISOTROPY || lobe.alpha.x == lobe.alpha.y) { return isotropicDistribution; }
  let projected = vec2<f32>(dot(lobe.tangent, halfDirection), dot(lobe.bitangent, halfDirection)) / lobe.alpha;
  let denominator = dot(projected, projected) + normalHalf * normalHalf;
  return 1.0 / (PI * lobe.alpha.x * lobe.alpha.y * denominator * denominator);
}

fn getGGXVisibility(lobe: AnisotropicGGX, direction: vec3<f32>, normalCosine: f32,
    isotropicVisibility: f32) -> f32 {
  if (!MATERIAL_HAS_ANISOTROPY || lobe.alpha.x == lobe.alpha.y) { return isotropicVisibility; }
  let projected = vec2<f32>(dot(lobe.tangent, direction), dot(lobe.bitangent, direction)) * lobe.alpha;
  return 2.0 * normalCosine / max(normalCosine + sqrt(normalCosine * normalCosine + dot(projected, projected)), 0.000001);
}

// Airy reflectance from the two interface amplitudes and their round-trip phase.
fn airyReflectance(first: f32, second: vec3<f32>, phaseCosine: vec3<f32>) -> vec3<f32> {
  let product = first * second;
  let interference = 2.0 * product * phaseCosine;
  return (vec3<f32>(first * first) + second * second + interference) /
    max(vec3<f32>(1.0) + product * product + interference, vec3<f32>(0.000001));
}

fn evaluateBaseFresnel(primitive: RayPrimitive, reflectance: vec3<f32>,
    grazingReflectance: vec3<f32>, viewHalf: f32) -> vec3<f32> {
  let cosine = clamp(viewHalf, 0.0, 1.0);
  let baseFresnel = reflectance + (grazingReflectance - reflectance) * pow(1.0 - cosine, 5.0);
  let film = primitive.iridescence;
  if (film.x <= 0.0 || film.w <= 0.0) { return baseFresnel; }

  let filmIndex = max(film.y, 1.0);
  // Choose a real substrate index per RGB channel from its normal-incidence reflectance.
  let rootReflectance = sqrt(clamp(reflectance, vec3<f32>(0.0), vec3<f32>(0.999)));
  let substrateIndex = (vec3<f32>(1.0) + rootReflectance) / (vec3<f32>(1.0) - rootReflectance);
  let incidentSineSquared = 1.0 - cosine * cosine;
  let filmCosine = sqrt(max(1.0 - incidentSineSquared / (filmIndex * filmIndex), 0.0));
  let substrateCosine = sqrt(max(vec3<f32>(1.0) - vec3<f32>(incidentSineSquared) / (substrateIndex * substrateIndex), vec3<f32>(0.0)));
  let filmNormal = filmIndex * filmCosine;
  let substrateNormal = substrateIndex * substrateCosine;
  let firstPerpendicular = (cosine - filmNormal) / max(cosine + filmNormal, 0.000001);
  let secondPerpendicular = (vec3<f32>(filmNormal) - substrateNormal) / max(vec3<f32>(filmNormal) + substrateNormal, vec3<f32>(0.000001));
  let firstParallel = (filmIndex * cosine - filmCosine) / max(filmIndex * cosine + filmCosine, 0.000001);
  let secondParallel = (substrateIndex * filmCosine - filmIndex * substrateCosine) /
    max(substrateIndex * filmCosine + filmIndex * substrateCosine, vec3<f32>(0.000001));
  // Approximate visible spectra by sampling representative RGB wavelengths.
  let phaseCosine = cos(vec3<f32>(4.0 * PI * film.w * filmNormal) / vec3<f32>(650.0, 550.0, 460.0));
  let filmFresnel = 0.5 * (airyReflectance(firstPerpendicular, secondPerpendicular, phaseCosine) +
    airyReflectance(firstParallel, secondParallel, phaseCosine));
  return mix(baseFresnel, clamp(filmFresnel, vec3<f32>(0.0), vec3<f32>(1.0)), clamp(film.x, 0.0, 1.0));
}

fn getSheenBaseWeight(strength: f32, roughness: f32, cosine: f32) -> f32 {
  return 1.0 - strength * mix(0.5, 0.157, cosine) * (1.0 - 0.5 * roughness);
}

fn getClearcoatFresnel(strength: f32, cosine: f32) -> f32 {
  return strength * (0.04 + 0.96 * pow(clamp(1.0 - cosine, 0.0, 1.0), 5.0));
}

// Charlie distribution with a compact visibility and base attenuation approximation.
fn applySheen(baseResponse: vec3<f32>, sheen: vec4<f32>, normalHalf: f32,
    normalView: f32, normalLight: f32, includeReflection: bool) -> vec3<f32> {
  let color = clamp(sheen.rgb, vec3<f32>(0.0), vec3<f32>(1.0));
  let strength = max(color.r, max(color.g, color.b));
  if (strength <= 0.0 || normalLight <= 0.0) { return baseResponse; }
  let roughness = clamp(sheen.w, 0.04, 1.0);
  let exponent = 1.0 / (roughness * roughness);
  let halfSineSquared = max(1.0 - normalHalf * normalHalf, 0.0);
  let distribution = (2.0 + exponent) * pow(halfSineSquared, 0.5 * exponent) / (2.0 * PI);
  let visibility = 0.25 / max(normalLight + normalView - normalLight * normalView, 0.000001);
  let enteringCosine = min(normalLight, normalView);
  let baseWeight = getSheenBaseWeight(strength, roughness, enteringCosine);
  return baseResponse * baseWeight + select(vec3<f32>(0.0),
    color * (distribution * visibility * normalLight), includeReflection);
}

// Apply the coat's Fresnel attenuation and reflection using its own normal.
fn applyClearcoat(baseResponse: vec3<f32>, clearcoat: vec2<f32>, hit: RayHit,
    viewDirection: vec3<f32>, lightDirection: vec3<f32>,
    halfDirection: vec3<f32>, viewHalf: f32, includeReflection: bool) -> vec3<f32> {
  let strength = clamp(clearcoat.x, 0.0, 1.0);
  if (strength == 0.0) { return baseResponse; }
  let mappedNormal = getClearcoatNormal(hit);
  let normal = select(mappedNormal, -mappedNormal, dot(hit.normal, viewDirection) < 0.0);
  let normalView = dot(normal, viewDirection);
  let normalLight = dot(normal, lightDirection);
  if (normalView <= 0.0 || normalLight <= 0.0) { return baseResponse; }
  let normalHalf = max(dot(normal, halfDirection), 0.0);
  let roughness = clamp(clearcoat.y, 0.04, 1.0);
  let alpha = roughness * roughness;
  let alphaSquared = alpha * alpha;
  let normalHalfSquared = normalHalf * normalHalf;
  let denominator = (1.0 - normalHalfSquared) + alphaSquared * normalHalfSquared;
  let distribution = alphaSquared / (PI * denominator * denominator);
  let lightVisibility = 2.0 * normalLight / (normalLight + sqrt(alphaSquared +
    (1.0 - alphaSquared) * normalLight * normalLight));
  let viewVisibility = 2.0 * normalView / (normalView + sqrt(alphaSquared +
    (1.0 - alphaSquared) * normalView * normalView));
  let fresnel = getClearcoatFresnel(strength, viewHalf);
  let coatResponse = fresnel * distribution * lightVisibility * viewVisibility / (4.0 * normalView);
  return baseResponse * (1.0 - fresnel) + vec3<f32>(select(0.0, coatResponse, includeReflection));
}

const MATERIAL_HAS_DIFFUSE_TRANSMISSION = /* MATERIAL_HAS_DIFFUSE_TRANSMISSION */ false;
const SPLIT_HISTORY = /* SPLIT_HISTORY */ false;
const PATH_BOUNCES_ENABLED = /* PATH_BOUNCES_ENABLED */ true;

fn usePBRTransport() -> bool {
  return /* PBR_TRANSPORT_ENABLED */ uniforms.sampling.w > 0u;
}

fn getDiffuseTransmission(primitive: RayPrimitive) -> f32 {
  if (!MATERIAL_HAS_DIFFUSE_TRANSMISSION || !usePBRTransport()) { return 0.0; }
  return clamp(primitive.diffuseTransmission.w, 0.0, 1.0);
}

fn getDiffuseTransmissionTint(primitive: RayPrimitive, hit: RayHit,
    viewDirection: vec3<f32>, viewCosine: f32, lightCosine: f32) -> vec3<f32> {
  let sheen = clamp(primitive.sheen.rgb, vec3<f32>(0.0), vec3<f32>(1.0));
  let sheenWeight = getSheenBaseWeight(max(sheen.r, max(sheen.g, sheen.b)),
    clamp(primitive.sheen.w, 0.04, 1.0), min(viewCosine, lightCosine));
  let coatStrength = clamp(primitive.clearcoatOcclusion.x, 0.0, 1.0);
  var coatWeight = 1.0;
  if (coatStrength > 0.0) {
    // Use the outgoing coat crossing for the thin-surface approximation.
    let coatCosine = abs(dot(getClearcoatNormal(hit), viewDirection));
    coatWeight = 1.0 - getClearcoatFresnel(coatStrength, coatCosine);
  }
  let reflectance = getDielectricReflectance(primitive);
  let grazing = getGrazingReflectance(primitive, reflectance, 0.0);
  let fresnel = evaluateBaseFresnel(primitive, reflectance, grazing, viewCosine);
  return clamp(primitive.diffuseTransmission.rgb, vec3<f32>(0.0), vec3<f32>(1.0)) *
    (vec3<f32>(1.0) - fresnel) * (vec3<f32>(1.0) - reflectance) *
    (1.0 - clamp(primitive.emissive.w, 0.0, 1.0)) * sheenWeight * coatWeight;
}

const TRANSMISSIVE_SHADOWS = /* TRANSMISSIVE_SHADOWS */ false;

const MATERIAL_HAS_INDEX_MATCHED_TRANSMISSION = /* MATERIAL_HAS_INDEX_MATCHED_TRANSMISSION */ false;
const OVERLAPPING_SHADOW_MEDIA = 0xfffffffeu;

// Both camera and shadow paths use the same Beer–Lambert material convention.
fn getVolumeTransmission(attenuation: vec4<f32>, distance: f32) -> vec3<f32> {
  if (attenuation.w <= 0.0 || distance <= 0.0) { return vec3<f32>(1.0); }
  return pow(clamp(attenuation.rgb, vec3<f32>(0.0), vec3<f32>(1.0)),
    vec3<f32>(distance / attenuation.w));
}

// A point query against the same TLAS finds a sphere enclosing the shadow origin,
// even when the light is inside it and visibility never intersects the boundary.
fn findInitialShadowMedium(origin: vec3<f32>) -> u32 {
  let pointRay = makeRay(origin, vec3<f32>(0.0));
  if (uniforms.dimensions.z == 0u ||
      intersectNodeBounds(pointRay, vec3<f32>(0.0), 0u, 1.0) >= 1.0) {
    return 0xffffffffu;
  }
  var pendingNodes: array<u32, BVH_STACK_CAPACITY>;
  var pendingCount = 1u;
  pendingNodes[0] = 0u;
  var medium = 0xffffffffu;
  while (pendingCount > 0u) {
    pendingCount--;
    let node = pendingNodes[pendingCount];
    if (node < uniforms.acceleration.x) {
      let left = node * 2u + 1u;
      for (var child = left; child <= left + 1u; child++) {
        if (intersectNodeBounds(pointRay, vec3<f32>(0.0), child, 1.0) < 1.0) {
          pendingNodes[pendingCount] = child;
          pendingCount++;
        }
      }
      continue;
    }
    let primitiveIndex = leafPrimitiveIds[node - uniforms.acceleration.x];
    if (primitiveIndex >= uniforms.dimensions.z) { continue; }
    let primitive = primitives[primitiveIndex];
    if (primitive.properties.y <= 0.0 || primitive.material.x != OPAQUE_ALPHA_MODE || primitive.materialFlags.x > 0.0 ||
        primitive.material.z != 1.0 || primitive.material.y <= 0.0) { continue; }
    let localOrigin = (primitive.inverseTransform * vec4<f32>(origin, 1.0)).xyz;
    if (dot(localOrigin, localOrigin) < primitive.properties.y * primitive.properties.y) {
      if (medium != 0xffffffffu) { return OVERLAPPING_SHADOW_MEDIA; }
      medium = primitiveIndex;
    }
  }
  return medium;
}

// Analytic connections remain straight. Index matching allows closed analytic
// spheres to transmit without bending the ray. Nested media remain opaque.
fn getAnalyticShadowTransmission(ray: Ray, maximumDistance: f32) -> vec3<f32> {
  if (uniforms.settings.w <= 0.5 || maximumDistance <= RAY_EPSILON) { return vec3<f32>(1.0); }
  if (!TRANSMISSIVE_SHADOWS || !usePBRTransport() ||
      (!MATERIAL_HAS_DIFFUSE_TRANSMISSION && !MATERIAL_HAS_INDEX_MATCHED_TRANSMISSION)) {
    return vec3<f32>(select(1.0, 0.0, intersectsScene(ray, maximumDistance)));
  }
  var segment = ray;
  var traveled = 0.0;
  var transmission = vec3<f32>(1.0);
  var medium = 0xffffffffu;
  if (MATERIAL_HAS_INDEX_MATCHED_TRANSMISSION) {
    medium = findInitialShadowMedium(ray.origin);
    if (medium == OVERLAPPING_SHADOW_MEDIA) { return vec3<f32>(0.0); }
  }
  var mediumStart = 0.0;
  for (var interfaceIndex = 0u; interfaceIndex <= 8u; interfaceIndex++) {
    let remaining = maximumDistance - traveled;
    if (SAMPLE_TRAVERSAL && traversalSampled) { rayCounts.z++; }
    let blocker = intersectScene(segment, remaining);
    if (blocker.distance >= remaining) {
      if (medium == 0xffffffffu) { return transmission; }
      if (maximumDistance >= RAY_INFINITY) { return vec3<f32>(0.0); }
      return transmission * getVolumeTransmission(primitives[medium].attenuation, maximumDistance - mediumStart);
    }
    if (interfaceIndex == 8u) { return vec3<f32>(0.0); }

    var materialHit = blocker;
    materialHit.footprint = 0.0;
    let material = getShadedPrimitive(materialHit);
    if (material.materialFlags.x > 0.0) { return vec3<f32>(0.0); }
    let distance = traveled + blocker.distance;
    if (MATERIAL_HAS_INDEX_MATCHED_TRANSMISSION && material.properties.y > 0.0 &&
        material.material.x == OPAQUE_ALPHA_MODE && material.material.z == 1.0 && material.material.y > 0.0) {
      if (blocker.entering && medium == 0xffffffffu) {
        medium = blocker.primitiveIndex;
        mediumStart = distance;
      } else if (!blocker.entering && medium == blocker.primitiveIndex) {
        transmission *= getVolumeTransmission(material.attenuation, distance - mediumStart);
        medium = 0xffffffffu;
      } else {
        return vec3<f32>(0.0);
      }
      transmission *= clamp(material.material.y, 0.0, 1.0) *
        (1.0 - clamp(material.emissive.w, 0.0, 1.0)) *
        clamp(material.baseColor.rgb, vec3<f32>(0.0), vec3<f32>(1.0));
    } else {
      let fraction = getDiffuseTransmission(material);
      if (medium != 0xffffffffu || fraction <= 0.0 || material.material.y > 0.0) {
        return vec3<f32>(0.0);
      }
      let cosine = abs(dot(getFaceNormal(blocker, segment), segment.direction));
      transmission *= fraction * getDiffuseTransmissionTint(
        material, materialHit, -segment.direction, cosine, cosine);
    }
    if (all(transmission <= vec3<f32>(0.0))) { return vec3<f32>(0.0); }
    let advance = blocker.distance + RAY_EPSILON;
    traveled += advance;
    segment = makeSurfaceRay(segment, advance, segment.origin + segment.direction * advance, segment.direction);
  }
  return vec3<f32>(0.0);
}

// Aim finite-light visibility from the biased origin to the actual light position.
fn evaluateAnalyticLightVisibility(ray: Ray, hit: RayHit, origin: vec3<f32>, direction: vec3<f32>,
    light: RayLight, lightType: u32) -> vec3<f32> {
  var shadowDirection = direction;
  var shadowDistance = RAY_INFINITY;
  if (lightType >= 2u) {
    let offset = light.positionInnerCone.xyz - origin;
    shadowDistance = length(offset);
    shadowDirection = offset / max(shadowDistance, RAY_EPSILON);
    shadowDistance -= RAY_EPSILON;
  }
  let shadowRay = makeSurfaceRay(ray, hit.distance, origin, shadowDirection);
  return getAnalyticShadowTransmission(shadowRay, shadowDistance);
}

// Analytic lights are delta proposals, so they need no continuation MIS weight.
fn evaluateRoughDielectricLight(ray: Ray, hit: RayHit, primitive: RayPrimitive,
    direction: vec3<f32>, faceCosine: f32) -> vec3<f32> {
  let roughness = clamp(primitive.properties.x, 0.0, 1.0);
  let index = primitive.material.z;
  let transmission = clamp(primitive.material.y, 0.0, 1.0) *
    (1.0 - clamp(primitive.emissive.w, 0.0, 1.0));
  if (transmission <= 0.0 || roughness <= 0.04 || index <= 1.0 ||
      primitive.materialFlags.y > 0.0 || !hit.entering) { return vec3<f32>(0.0); }
  let view = -ray.direction;
  let normal = faceForward(hit.normal, ray.direction, hit.normal);
  let incidentCosine = dot(normal, view);
  let outgoingCosine = dot(normal, direction);
  if (incidentCosine <= RAY_EPSILON || outgoingCosine * faceCosine <= 0.0) {
    return vec3<f32>(0.0);
  }

  let reflected = outgoingCosine > 0.0;
  let ratio = 1.0 / index;
  let halfVector = select(ratio * view + direction, view + direction, reflected);
  if (dot(halfVector, halfVector) <= 1e-12) { return vec3<f32>(0.0); }
  var facet = normalize(halfVector);
  if (dot(normal, facet) < 0.0) { facet = -facet; }
  let viewFacet = dot(view, facet);
  let lightFacet = dot(direction, facet);
  if (viewFacet <= 0.0 || select(-lightFacet, lightFacet, reflected) <= 0.0) {
    return vec3<f32>(0.0);
  }
  let transmittedCosine = sqrt(max(0.0, 1.0 - ratio * ratio * (1.0 - viewFacet * viewFacet)));
  let perpendicular = (ratio * viewFacet - transmittedCosine) / max(ratio * viewFacet + transmittedCosine, 0.000001);
  let parallel = (viewFacet - ratio * transmittedCosine) / max(viewFacet + ratio * transmittedCosine, 0.000001);
  let fresnel = 0.5 * (perpendicular * perpendicular + parallel * parallel);
  let roughnessSquared = roughness * roughness;
  let alphaSquared = roughnessSquared * roughnessSquared;
  let normalFacet = dot(normal, facet);
  let denominator = 1.0 + (alphaSquared - 1.0) * normalFacet * normalFacet;
  let distribution = alphaSquared / (PI * denominator * denominator);
  let masking = smithDielectricMask(incidentCosine, alphaSquared) *
    smithDielectricMask(abs(outgoingCosine), alphaSquared);
  let weightedDistribution = transmission * distribution * masking / incidentCosine;
  if (reflected) { return vec3<f32>(weightedDistribution * fresnel * 0.25); }

  let refractionJacobian = ratio * viewFacet + lightFacet;
  return clamp(primitive.baseColor.rgb, vec3<f32>(0.0), vec3<f32>(1.0)) *
    (weightedDistribution * (1.0 - fresnel) * ratio * ratio * abs(viewFacet * lightFacet) /
      max(refractionJacobian * refractionJacobian, 1e-12));
}

fn evaluateDirectLighting(ray: Ray, hit: RayHit, includeEmission: bool, exterior: bool, split: bool, specularRadiance: ptr<function, vec3<f32>>) -> vec3<f32> {
  let primitive = getShadedPrimitive(hit);
  let hitPosition = ray.origin + ray.direction * hit.distance;
  let normal = getShadingNormal(hit);
  let faceNormal = select(getFaceNormal(hit, ray), hit.normal, hit.triangleIndex == 0xffffffffu);
  let viewDirection = -ray.direction;
  let baseColor = primitive.baseColor.rgb;
  let metallic = clamp(primitive.emissive.w, 0.0, 1.0);
  let roughness = clamp(primitive.properties.x, 0.04, 1.0);
  let dielectricReflectance = getDielectricReflectance(primitive);
  let reflectance = mix(dielectricReflectance, baseColor, metallic);
  let grazingReflectance = getGrazingReflectance(primitive, reflectance, metallic);
  let alphaRoughness = roughness * roughness;
  let alphaRoughnessSquared = alphaRoughness * alphaRoughness;
  let diffuseTransmission = getDiffuseTransmission(primitive);
  let transmissionNormal = faceForward(faceNormal, ray.direction, faceNormal);
  let diffuse = (1.0 - diffuseTransmission) * baseColor * (vec3<f32>(1.0) - dielectricReflectance) *
    (1.0 - metallic) / PI;
  let normalView = clamp(abs(dot(normal, viewDirection)), 0.001, 1.0);
  let opaqueWeight = select(1.0, 1.0 - clamp(primitive.material.y, 0.0, 1.0) * (1.0 - metallic), usePBRTransport() && PATH_BOUNCES_ENABLED && uniforms.sampling.y > 0u);
  var result = vec3<f32>(0.0);
  if (includeEmission) { result = getMaterialEmission(hit); }
  let directLightCount = u32(max(uniforms.temporal.y, 0.0));
  let boundedDirectLightCount = max(directLightCount, 1u);
  let requestedShadowSamples = u32(max(uniforms.temporal.z, 0.0));
  let shadowSampleCount = select(
    min(requestedShadowSamples, directLightCount),
    directLightCount,
    requestedShadowSamples == 0u || uniforms.settings.w <= 0.5
  );
  let rotatingLightOffset = uniforms.acceleration.w % boundedDirectLightCount;
  let lightSampleWeight = f32(directLightCount) / f32(max(shadowSampleCount, 1u));
  var directLightIndex = 0u;

  let anisotropic = getAnisotropicGGX(hit, primitive, normal, alphaRoughness);
  for (var lightIndex = 0u; lightIndex < uniforms.dimensions.w; lightIndex++) {
    let light = lights[lightIndex];
    let lightType = u32(light.directionType.w);
    let lightColor = light.colorIntensity.rgb * light.colorIntensity.w;
    if (lightType == 0u) {
      let occlusion = mix(1.0, clamp(primitive.clearcoatOcclusion.w, 0.0, 1.0),
        clamp(primitive.clearcoatOcclusion.z, 0.0, 1.0));
      result += baseColor * lightColor * opaqueWeight * occlusion * (1.0 - diffuseTransmission);
      if (diffuseTransmission > 0.0) {
        let tint = getDiffuseTransmissionTint(primitive, hit, viewDirection,
          abs(dot(transmissionNormal, viewDirection)), 2.0 / 3.0);
        result += tint * lightColor * opaqueWeight * occlusion * diffuseTransmission;
      }
      continue;
    }

    let rotatingLightIndex = (directLightIndex + directLightCount - rotatingLightOffset) %
      boundedDirectLightCount;
    directLightIndex++;
    if (rotatingLightIndex >= shadowSampleCount) {
      continue;
    }

    var lightDirection = vec3<f32>(0.0);
    var lightDistance = RAY_INFINITY;
    var attenuation = 1.0;
    if (lightType >= 2u) {
      let offset = light.positionInnerCone.xyz - hitPosition;
      lightDistance = length(offset);
      lightDirection = offset / max(lightDistance, RAY_EPSILON);
      let factors = light.attenuationOuterCone.xyz;
      attenuation = 1.0 / max(factors.x + factors.y * lightDistance +
        factors.z * lightDistance * lightDistance, 0.0001);
      if (lightType == 3u) {
        let angle = dot(-lightDirection, normalize(light.directionType.xyz));
        let innerCone = light.positionInnerCone.w;
        let outerCone = light.attenuationOuterCone.w;
        attenuation *= smoothstep(outerCone, innerCone, angle);
      }
    } else {
      lightDirection = normalize(-light.directionType.xyz);
    }

    let faceLight = dot(transmissionNormal, lightDirection);
    if (exterior && uniforms.visibility.z != 0u && usePBRTransport() &&
        PATH_BOUNCES_ENABLED && uniforms.sampling.y > 0u && attenuation > 0.0) {
      let dielectricResponse = evaluateRoughDielectricLight(ray, hit, primitive, lightDirection, faceLight);
      if (any(dielectricResponse > vec3<f32>(0.0))) {
        let connectionOrigin = hitPosition + transmissionNormal * select(-0.002, 0.002, faceLight > 0.0);
        let visibility = evaluateAnalyticLightVisibility(ray, hit, connectionOrigin, lightDirection, light, lightType);
        let dielectricLight = dielectricResponse * lightColor * visibility * attenuation * lightSampleWeight;
        result += dielectricLight;
        if (SPLIT_HISTORY && split) { *specularRadiance += dielectricLight; }
      }
    }
    if (diffuseTransmission > 0.0 && faceLight < 0.0 && attenuation > 0.0) {
      let shadowTransmission = evaluateAnalyticLightVisibility(ray, hit,
      hitPosition - transmissionNormal * 0.002, lightDirection, light, lightType);
      if (any(shadowTransmission > vec3<f32>(0.0))) {
        let tint = getDiffuseTransmissionTint(primitive, hit, viewDirection, abs(dot(transmissionNormal, viewDirection)), -faceLight);
        result += tint * lightColor * shadowTransmission * (-faceLight / PI) * diffuseTransmission *
          attenuation * lightSampleWeight * opaqueWeight;
      }
      continue;
    }
    let normalLight = max(dot(normal, lightDirection), 0.0);
    if ((normalLight <= 0.0 && primitive.clearcoatOcclusion.x <= 0.0) ||
        dot(faceNormal, lightDirection) <= 0.0 || attenuation <= 0.0) {
      continue;
    }
    let shadowTransmission = evaluateAnalyticLightVisibility(ray, hit,
      hitPosition + faceNormal * 0.002, lightDirection, light, lightType);
    if (all(shadowTransmission <= vec3<f32>(0.0))) { continue; }

    let halfDirection = normalize(lightDirection + viewDirection);
    let normalHalf = max(dot(normal, halfDirection), 0.0);
    let viewHalf = max(dot(viewDirection, halfDirection), 0.0);
    let fresnel = evaluateBaseFresnel(primitive, reflectance, grazingReflectance, viewHalf);
    let distributionDenominator =
      (normalHalf * alphaRoughnessSquared - normalHalf) * normalHalf + 1.0;
    let distribution = alphaRoughnessSquared /
      (PI * distributionDenominator * distributionDenominator);
    let lightVisibility = 2.0 * normalLight /
      (normalLight + sqrt(alphaRoughnessSquared +
        (1.0 - alphaRoughnessSquared) * normalLight * normalLight));
    let viewVisibility = 2.0 * normalView /
      (normalView + sqrt(alphaRoughnessSquared +
        (1.0 - alphaRoughnessSquared) * normalView * normalView));
    let baseDistribution = getGGXDistribution(anisotropic, halfDirection, normalHalf, distribution);
    let baseVisibility = getGGXVisibility(anisotropic, lightDirection, normalLight, lightVisibility) *
      getGGXVisibility(anisotropic, viewDirection, normalView, viewVisibility);
    let diffuseContribution = (vec3<f32>(1.0) - fresnel) * diffuse;
    let specular = fresnel * baseVisibility * baseDistribution /
      (4.0 * max(normalLight, 0.000001) * normalView);
    let layeredResponse = applySheen((diffuseContribution + specular) * normalLight,
      primitive.sheen, normalHalf, normalView, normalLight, true);
    let response = applyClearcoat(layeredResponse,
      primitive.clearcoatOcclusion.xy, hit, viewDirection, lightDirection, halfDirection, viewHalf, true);
    let lightWeight = lightColor * shadowTransmission * attenuation * lightSampleWeight * opaqueWeight;
    result += response * lightWeight;
    if (SPLIT_HISTORY && split) {
      let layeredDiffuse = applySheen(diffuseContribution * normalLight, primitive.sheen,
        normalHalf, normalView, normalLight, false);
      let diffuseResponse = applyClearcoat(layeredDiffuse, primitive.clearcoatOcclusion.xy, hit,
        viewDirection, lightDirection, halfDirection, viewHalf, false);
      *specularRadiance += (response - diffuseResponse) * lightWeight;
    }
  }

  if (uniforms.fog.w > 0.0) {
    let visibility = exp(-uniforms.fog.w * hit.distance);
    result = mix(uniforms.fog.rgb, result, visibility);
    if (SPLIT_HISTORY && split) { *specularRadiance *= visibility; }
  }
  return result;
}

fn rejectHistoricalRaySample() -> HistoricalRaySample {
  return HistoricalRaySample(vec3<f32>(0.0), 0.0, false, vec2<f32>(0.0));
}

fn signNotZero(value: f32) -> f32 {
  return select(-1.0, 1.0, value >= 0.0);
}

fn encodeRayNormal(normal: vec3<f32>) -> vec2<f32> {
  let normalizedNormal = normal / max(
    abs(normal.x) + abs(normal.y) + abs(normal.z),
    RAY_EPSILON
  );
  var encodedNormal = normalizedNormal.xy;
  if (normalizedNormal.z < 0.0) {
    encodedNormal = (vec2<f32>(1.0) - abs(encodedNormal.yx)) * vec2<f32>(
      signNotZero(encodedNormal.x),
      signNotZero(encodedNormal.y)
    );
  }
  return encodedNormal * 0.5 + vec2<f32>(0.5);
}

fn decodeRayNormal(encodedNormal: vec2<f32>) -> vec3<f32> {
  let signedNormal = encodedNormal * 2.0 - vec2<f32>(1.0);
  var normal = vec3<f32>(
    signedNormal,
    1.0 - abs(signedNormal.x) - abs(signedNormal.y)
  );
  let fold = max(-normal.z, 0.0);
  normal.x += select(-fold, fold, normal.x < 0.0);
  normal.y += select(-fold, fold, normal.y < 0.0);
  return normalize(normal);
}

fn encodeRayPrimitiveIdentifier(primitiveIndex: u32) -> f32 {
  return select(
    OVERFLOW_HISTORY_PRIMITIVE_IDENTIFIER,
    f32(primitiveIndex + 1u),
    primitiveIndex <= MAXIMUM_EXACT_HISTORY_PRIMITIVE_INDEX
  );
}

fn isHistoricalRayMetadataValid(
  historicalMetadata: vec4<f32>,
  hit: RayHit,
  previousDistance: f32
) -> bool {
  if (hit.distance >= RAY_INFINITY) {
    return historicalMetadata.a <= RAY_EPSILON;
  }

  let expectedPrimitiveIdentifier = encodeRayPrimitiveIdentifier(hit.primitiveIndex);
  let primitiveIdentifierOverflow =
    expectedPrimitiveIdentifier == OVERFLOW_HISTORY_PRIMITIVE_IDENTIFIER ||
    historicalMetadata.a == OVERFLOW_HISTORY_PRIMITIVE_IDENTIFIER;
  let primitiveIdentifierMatches =
    abs(historicalMetadata.a - expectedPrimitiveIdentifier) <= 0.5;
  if (historicalMetadata.a <= RAY_EPSILON ||
      primitiveIdentifierOverflow ||
      !primitiveIdentifierMatches ||
      dot(decodeRayNormal(historicalMetadata.xy), hit.normal) <
        MINIMUM_HISTORY_NORMAL_ALIGNMENT) {
    return false;
  }
  let relativeDepthDifference = abs(historicalMetadata.z - previousDistance) /
    max(previousDistance, RAY_EPSILON);
  return relativeDepthDifference <= MAXIMUM_HISTORY_RELATIVE_DEPTH_DIFFERENCE;
}

fn loadHistoryColor(pixel: vec2<i32>, layer: i32) -> vec4<f32> {
  return textureLoad(historyImage, pixel, 0);
}

fn clampHistoricalRayColor(
  historyPixel: vec2<i32>,
  historicalColor: vec3<f32>,
  currentColor: vec3<f32>,
  hit: RayHit,
  previousDistance: f32,
  layer: i32
) -> vec3<f32> {
  let maximumPixel = vec2<i32>(uniforms.dimensions.xy) - vec2<i32>(1);
  var minimumColor = currentColor;
  var maximumColor = currentColor;
  for (var verticalOffset = -1; verticalOffset <= 1; verticalOffset++) {
    for (var horizontalOffset = -1; horizontalOffset <= 1; horizontalOffset++) {
      let neighborhoodPixel = clamp(
        historyPixel + vec2<i32>(horizontalOffset, verticalOffset),
        vec2<i32>(0),
        maximumPixel
      );
      let neighborhoodMetadata = textureLoad(historyMetadata, neighborhoodPixel, 0);
      if (!isHistoricalRayMetadataValid(neighborhoodMetadata, hit, previousDistance)) { continue; }
      let neighborhoodColor = loadHistoryColor(neighborhoodPixel, layer);
      if (neighborhoodColor.a > 0.0) {
        minimumColor = min(minimumColor, neighborhoodColor.rgb);
        maximumColor = max(maximumColor, neighborhoodColor.rgb);
      }
    }
  }
  let neighborhoodRadius = max((maximumColor - minimumColor) * 0.5, vec3<f32>(0.04));
  return clamp(historicalColor, currentColor - neighborhoodRadius, currentColor + neighborhoodRadius);
}

fn loadHistoricalRaySample(
  historyPixel: vec2<i32>,
  hit: RayHit,
  previousDistance: f32,
  layer: i32
) -> HistoricalRaySample {
  let historicalMetadata = textureLoad(historyMetadata, historyPixel, 0);
  if (!isHistoricalRayMetadataValid(historicalMetadata, hit, previousDistance)) {
    return rejectHistoricalRaySample();
  }

  let historicalColor = loadHistoryColor(historyPixel, layer);
  if (historicalColor.a <= 0.0) {
    return rejectHistoricalRaySample();
  }
  return HistoricalRaySample(
    historicalColor.rgb,
    min(historicalColor.a, getHistorySampleLimit()),
    true,
    loadHistoryMoments(historyPixel)
  );
}

fn getHistoricalRaySample(
  pixel: vec2<u32>,
  ray: Ray,
  hit: RayHit,
  currentColor: vec3<f32>,
  layer: i32
) -> HistoricalRaySample {
  if (uniforms.settings.y <= 0.0) {
    return rejectHistoricalRaySample();
  }

  // A stationary PBR path traces the same integral each frame. Clipping it
  // around the latest noisy sample biases bright glossy paths even after motion stops.
  let pbrPaths = usePBRTransport() && uniforms.sampling.y > 0u;
  if (uniforms.temporal.w <= 0.5 || ((pbrPaths || SPLIT_HISTORY) && uniforms.visibility.w != 0u)) {
    let previous = loadHistoryColor(vec2<i32>(pixel), layer);
    return HistoricalRaySample(previous.rgb, previous.a, previous.a > 0.0, loadHistoryMoments(vec2<i32>(pixel)));
  }

  // Primary hit metadata cannot validate view-dependent secondary paths.
  if (SPLIT_HISTORY && layer == 1) { return rejectHistoricalRaySample(); }

  var historySamplePosition = vec2<f32>(pixel);
  var previousDistance = distance(
    ray.origin + ray.direction * min(hit.distance, 65504.0),
    uniforms.cameraPosition.xyz
  );
  if (hit.distance < RAY_INFINITY && uniforms.temporal.w > 0.5) {
    let primitive = primitives[hit.primitiveIndex];
    // Primary identity does not identify the reflected or refracted surface.
    // Reject history for shiny guides during camera motion.
    if (pbrPaths && !SPLIT_HISTORY) {
      let material = getShadedPrimitive(hit);
      if (material.material.y > 0.0 ||
          (material.emissive.w >= 0.5 && material.properties.x < 0.4) ||
          (material.clearcoatOcclusion.x > 0.0 && material.clearcoatOcclusion.y < 0.4)) {
        return rejectHistoricalRaySample();
      }
    }
    let hitPosition = ray.origin + ray.direction * hit.distance;
    let localHitPosition = primitive.inverseTransform * vec4<f32>(hitPosition, 1.0);
    let previousHitPosition = (primitive.previousTransform * localHitPosition).xyz;
    let previousClipPosition = uniforms.previousViewProjection *
      vec4<f32>(previousHitPosition, 1.0);
    if (previousClipPosition.w <= RAY_EPSILON) {
      return rejectHistoricalRaySample();
    }

    let previousNormalizedPosition = previousClipPosition.xy / previousClipPosition.w;
    let previousTextureCoordinates = vec2<f32>(
      previousNormalizedPosition.x * 0.5 + 0.5,
      0.5 - previousNormalizedPosition.y * 0.5
    );
    if (any(previousTextureCoordinates < vec2<f32>(0.0)) ||
        any(previousTextureCoordinates >= vec2<f32>(1.0))) {
      return rejectHistoricalRaySample();
    }

    historySamplePosition = previousTextureCoordinates *
      vec2<f32>(uniforms.dimensions.xy) - vec2<f32>(0.5);
    previousDistance = distance(previousHitPosition, uniforms.previousCameraPosition.xyz);
  }

  let maximumPixel = vec2<i32>(uniforms.dimensions.xy) - vec2<i32>(1);
  let clampedHistorySamplePosition = clamp(
    historySamplePosition,
    vec2<f32>(0.0),
    vec2<f32>(maximumPixel)
  );
  let firstHistoryPixel = vec2<i32>(floor(clampedHistorySamplePosition));
  let secondHistoryPixel = min(firstHistoryPixel + vec2<i32>(1), maximumPixel);
  let historyFraction = fract(clampedHistorySamplePosition);
  let topLeftWeight = (1.0 - historyFraction.x) * (1.0 - historyFraction.y);
  let topRightWeight = historyFraction.x * (1.0 - historyFraction.y);
  let bottomLeftWeight = (1.0 - historyFraction.x) * historyFraction.y;
  let bottomRightWeight = historyFraction.x * historyFraction.y;
  var historicalColor = vec3<f32>(0.0);
  var historicalMoments = vec2<f32>(0.0);
  var historicalSampleCount = 0.0;
  var totalWeight = 0.0;
  if (topLeftWeight > 0.0) {
    let topLeftSample = loadHistoricalRaySample(firstHistoryPixel, hit, previousDistance, layer);
    if (topLeftSample.valid) {
      historicalColor += topLeftSample.color * topLeftWeight;
      historicalMoments += topLeftSample.moments * topLeftWeight;
      historicalSampleCount += topLeftSample.sampleCount * topLeftWeight;
      totalWeight += topLeftWeight;
    }
  }
  if (topRightWeight > 0.0) {
    let topRightSample = loadHistoricalRaySample(
      vec2<i32>(secondHistoryPixel.x, firstHistoryPixel.y),
      hit,
      previousDistance,
      layer
    );
    if (topRightSample.valid) {
      historicalColor += topRightSample.color * topRightWeight;
      historicalMoments += topRightSample.moments * topRightWeight;
      historicalSampleCount += topRightSample.sampleCount * topRightWeight;
      totalWeight += topRightWeight;
    }
  }
  if (bottomLeftWeight > 0.0) {
    let bottomLeftSample = loadHistoricalRaySample(
      vec2<i32>(firstHistoryPixel.x, secondHistoryPixel.y),
      hit,
      previousDistance,
      layer
    );
    if (bottomLeftSample.valid) {
      historicalColor += bottomLeftSample.color * bottomLeftWeight;
      historicalMoments += bottomLeftSample.moments * bottomLeftWeight;
      historicalSampleCount += bottomLeftSample.sampleCount * bottomLeftWeight;
      totalWeight += bottomLeftWeight;
    }
  }
  if (bottomRightWeight > 0.0) {
    let bottomRightSample = loadHistoricalRaySample(secondHistoryPixel, hit, previousDistance, layer);
    if (bottomRightSample.valid) {
      historicalColor += bottomRightSample.color * bottomRightWeight;
      historicalMoments += bottomRightSample.moments * bottomRightWeight;
      historicalSampleCount += bottomRightSample.sampleCount * bottomRightWeight;
      totalWeight += bottomRightWeight;
    }
  }

  if (totalWeight <= 0.0) {
    return rejectHistoricalRaySample();
  }
  let nearestHistoryPixel = clamp(
    vec2<i32>(round(clampedHistorySamplePosition)),
    vec2<i32>(0),
    maximumPixel
  );
  return HistoricalRaySample(
    clampHistoricalRayColor(nearestHistoryPixel, historicalColor / totalWeight, currentColor,
      hit, previousDistance, layer),
    // Normalize radiance, but discount confidence when part of the footprint was occluded.
    min(historicalSampleCount, getHistorySampleLimit()),
    true,
    historicalMoments / totalWeight
  );
}


const CONTINUOUS_MATERIAL_EVENT = 0u;
const SMOOTH_DIELECTRIC_EVENT = 1u;
const ROUGH_DIELECTRIC_EVENT = 2u;

struct RayMaterialSample {
  direction: vec3<f32>,
  weight: vec3<f32>,
  // Dielectric events are continuation-only and have no competing light proposal.
  eventKind: u32,
  crossesInterface: bool,
  density: f32,
  specularWeight: vec3<f32>,
};

// Sample the projected GGX distribution about the unperturbed shading normal.
fn sampleDielectricFacet(normal: vec3<f32>, alphaSquared: f32, seed: u32) -> vec3<f32> {
  let reference = select(vec3<f32>(0.0, 0.0, 1.0), vec3<f32>(0.0, 1.0, 0.0), abs(normal.z) > 0.999);
  let tangent = normalize(cross(reference, normal));
  let radial = makeRandom(seed ^ 0x7ac6a925u);
  let angle = 2.0 * PI * makeRandom(seed ^ 0xe0b6351fu);
  let cosine = sqrt((1.0 - radial) / (1.0 - radial + alphaSquared * radial));
  let sine = sqrt(max(1.0 - cosine * cosine, 0.0));
  return normal * cosine + sine * (tangent * cos(angle) + cross(normal, tangent) * sin(angle));
}

fn smithDielectricMask(cosine: f32, alphaSquared: f32) -> f32 {
  return 2.0 * cosine /
    max(cosine + sqrt(alphaSquared + (1.0 - alphaSquared) * cosine * cosine), 0.000001);
}

const NO_PATH_MEDIUM = 0xffffffffu;

fn getPathMediumIndex(primitiveIndex: u32, spectralChannel: u32) -> f32 {
  if (primitiveIndex == NO_PATH_MEDIUM) { return 1.0; }
  let medium = primitives[primitiveIndex];
  let index = max(1.0, medium.material.z);
  if (spectralChannel >= 3u) { return index; }
  // glTF stores 20 / Abbe number. Red and blue sit on either side of green.
  let offset = f32(spectralChannel) - 1.0;
  return max(1.0, index + offset * ((index - 1.0) * medium.materialFlags.y / 40.0));
}

fn isAbsorbingPathMedium(primitiveIndex: u32) -> bool {
  if (primitiveIndex == NO_PATH_MEDIUM) { return false; }
  let attenuation = primitives[primitiveIndex].attenuation;
  return attenuation.w > 0.0 && any(attenuation.rgb < vec3<f32>(1.0));
}

// Sample a cosine/GGX-NDF mixture, then evaluate both lobes with the combined PDF.
// Specular half-vector density D(N.H)*(N.H) becomes direction density / (4*V.H).
fn samplePBRMaterial(ray: Ray, hit: RayHit, randomSeed: u32,
    spectralChannel: ptr<function, u32>, incidentMedium: u32, transmittedMedium: u32, split: bool) -> RayMaterialSample {
  let primitive = getShadedPrimitive(hit);
  let baseColor = clamp(primitive.baseColor.rgb, vec3<f32>(0.0), vec3<f32>(1.0));
  let metallic = clamp(primitive.emissive.w, 0.0, 1.0);
  let transmission = clamp(primitive.material.y, 0.0, 1.0) * (1.0 - metallic);
  if (makeRandom(randomSeed ^ 541u) < transmission) {
    let normal = faceForward(hit.normal, ray.direction, hit.normal);
    var spectralWeight = vec3<f32>(1.0);
    if (*spectralChannel == 3u &&
        (primitives[hit.primitiveIndex].materialFlags.y > 0.0 ||
         (incidentMedium != NO_PATH_MEDIUM && primitives[incidentMedium].materialFlags.y > 0.0) ||
         (transmittedMedium != NO_PATH_MEDIUM && primitives[transmittedMedium].materialFlags.y > 0.0))) {
      *spectralChannel = hashRaySample(randomSeed ^ 0x24a184f7u) % 3u;
      spectralWeight = vec3<f32>(0.0);
      spectralWeight[*spectralChannel] = 3.0;
    }
    let incidentIndex = getPathMediumIndex(incidentMedium, *spectralChannel);
    let transmittedIndex = getPathMediumIndex(transmittedMedium, *spectralChannel);
    let ratio = incidentIndex / transmittedIndex;
    let roughness = clamp(primitive.properties.x, 0.0, 1.0);
    let useRoughInterface = uniforms.visibility.z != 0u && roughness > 0.04 && ratio != 1.0;
    let alpha = roughness * roughness;
    let alphaSquared = alpha * alpha;
    var facet = normal;
    if (useRoughInterface) {
      facet = sampleDielectricFacet(normal, alphaSquared, randomSeed);
    }
    let cosineIncident = clamp(dot(-ray.direction, facet), 0.0, 1.0);
    if (useRoughInterface && cosineIncident <= 0.0) {
      return RayMaterialSample(ray.direction, vec3<f32>(0.0), ROUGH_DIELECTRIC_EVENT, false, 0.0, vec3<f32>(0.0));
    }
    let sineTransmittedSquared = ratio * ratio * (1.0 - cosineIncident * cosineIncident);
    var reflected = sineTransmittedSquared >= 1.0;
    if (!reflected) {
      let cosineTransmitted = sqrt(1.0 - sineTransmittedSquared);
      let perpendicular = (ratio * cosineIncident - cosineTransmitted) /
        max(ratio * cosineIncident + cosineTransmitted, 0.000001);
      let parallel = (cosineIncident - ratio * cosineTransmitted) /
        max(cosineIncident + ratio * cosineTransmitted, 0.000001);
      let fresnel = 0.5 * (perpendicular * perpendicular + parallel * parallel);
      reflected = makeRandom(randomSeed ^ 947u) < fresnel;
    }
    var direction: vec3<f32>;
    var weight = spectralWeight;
    if (reflected) {
      direction = reflect(ray.direction, facet);
    } else {
      direction = refract(ray.direction, facet, ratio);
      weight *= baseColor * ratio * ratio;
    }
    if (useRoughInterface) {
      let outgoingCosine = dot(normal, direction);
      let geometricCosine = dot(getFaceNormal(hit, ray), direction);
      if (select(-outgoingCosine, outgoingCosine, reflected) <= 0.0 ||
          select(-geometricCosine, geometricCosine, reflected) <= 0.0) {
        return RayMaterialSample(direction, vec3<f32>(0.0), ROUGH_DIELECTRIC_EVENT, false, 0.0, vec3<f32>(0.0));
      }
      let incomingCosine = dot(normal, -ray.direction);
      // Fresnel, GGX D, and the direction Jacobian cancel against the proposal.
      // The remaining ratio uses separable Smith masking.
      let masking = smithDielectricMask(incomingCosine, alphaSquared) *
        smithDielectricMask(abs(outgoingCosine), alphaSquared);
      weight *= masking * cosineIncident / max(incomingCosine * dot(normal, facet), 0.000001);
    }
    return RayMaterialSample(direction, weight, select(SMOOTH_DIELECTRIC_EVENT, ROUGH_DIELECTRIC_EVENT, useRoughInterface), !reflected, 0.0, weight);
  }

  let roughness = clamp(primitive.properties.x, 0.04, 1.0);
  let alphaRoughness = roughness * roughness;
  let alphaSquared = alphaRoughness * alphaRoughness;
  let shadingNormal = getShadingNormal(hit);
  let normal = select(shadingNormal, -shadingNormal, dot(hit.normal, ray.direction) > 0.0);
  let viewDirection = -ray.direction;
  let normalView = clamp(dot(normal, viewDirection), 0.001, 1.0);
  let reference = select(vec3<f32>(0.0, 0.0, 1.0), vec3<f32>(0.0, 1.0, 0.0), abs(normal.z) > 0.999);
  let tangent = normalize(cross(reference, normal));
  let bitangent = cross(normal, tangent);
  let radialSample = makeRandom(randomSeed ^ 17u);
  let angle = 2.0 * PI * makeRandom(randomSeed ^ 101u);
  let specularProbability = mix(0.25, 1.0, metallic);
  let diffuseTransmission = getDiffuseTransmission(primitive);
  let anisotropic = getAnisotropicGGX(hit, primitive, normal, alphaRoughness);
  var direction: vec3<f32>;
  if (specularProbability >= 1.0 || makeRandom(randomSeed ^ 263u) < specularProbability) {
    let normalHalf = sqrt((1.0 - radialSample) /
      ((1.0 - radialSample) + alphaSquared * radialSample));
    let tangentHalf = sqrt(max(1.0 - normalHalf * normalHalf, 0.0));
    var halfDirection = tangent * (tangentHalf * cos(angle)) +
      bitangent * (tangentHalf * sin(angle)) + normal * normalHalf;
    if (MATERIAL_HAS_ANISOTROPY && anisotropic.alpha.x != anisotropic.alpha.y) {
      // Stretch isotropic GGX slopes along the two principal roughness axes.
      let radius = sqrt(radialSample);
      halfDirection = normalize(
        anisotropic.tangent * (anisotropic.alpha.x * radius * cos(angle)) +
        anisotropic.bitangent * (anisotropic.alpha.y * radius * sin(angle)) +
        normal * sqrt(max(1.0 - radialSample, 0.0)));
    }
    direction = normalize(reflect(ray.direction, halfDirection));
  } else {
    let radius = sqrt(radialSample);
    if (diffuseTransmission > 0.0 && makeRandom(randomSeed ^ 409u) < diffuseTransmission) {
      let face = getFaceNormal(hit, ray);
      let axis = select(vec3<f32>(0.0, 0.0, 1.0), vec3<f32>(0.0, 1.0, 0.0), abs(face.z) > 0.999);
      let across = normalize(cross(axis, face));
      let transmittedDirection = across * (radius * cos(angle)) +
        cross(face, across) * (radius * sin(angle)) - face * sqrt(max(1.0 - radialSample, 0.0));
      // The cosine density and diffuse branch probability cancel the BTDF and its weight.
      let tint = getDiffuseTransmissionTint(primitive, hit, viewDirection, abs(dot(face, viewDirection)), -dot(face, transmittedDirection));
      let density = (1.0 - transmission) * (1.0 - specularProbability) *
        diffuseTransmission * max(-dot(face, transmittedDirection), 0.0) / PI;
      return RayMaterialSample(transmittedDirection, tint / (1.0 - specularProbability), CONTINUOUS_MATERIAL_EVENT, false, density, vec3<f32>(0.0));
    }
    direction = normalize(tangent * (radius * cos(angle)) + bitangent * (radius * sin(angle)) +
      normal * sqrt(max(1.0 - radialSample, 0.0)));
  }
  let normalLight = dot(normal, direction);
  if (normalLight <= 0.0 || dot(getFaceNormal(hit, ray), direction) <= 0.0) {
    return RayMaterialSample(direction, vec3<f32>(0.0), CONTINUOUS_MATERIAL_EVENT, false, 0.0, vec3<f32>(0.0));
  }
  let sampleDensity = getPBRReflectionDensity(direction, normal, viewDirection,
    anisotropic, alphaSquared, specularProbability, diffuseTransmission);
  if (sampleDensity <= 0.0) {
    return RayMaterialSample(direction, vec3<f32>(0.0), CONTINUOUS_MATERIAL_EVENT, false, 0.0, vec3<f32>(0.0));
  }
  let response = evaluatePBRResponse(ray, hit, direction, primitive, normal, true);
  var specularWeight = vec3<f32>(0.0);
  if (SPLIT_HISTORY && split) {
    let diffuse = evaluatePBRResponse(ray, hit, direction, primitive, normal, false);
    specularWeight = (response - diffuse) / sampleDensity;
  }
  return RayMaterialSample(direction, response / sampleDensity, CONTINUOUS_MATERIAL_EVENT, false,
    (1.0 - transmission) * sampleDensity, specularWeight);
}

// Conditional on selecting a continuous material event.
fn getPBRReflectionDensity(direction: vec3<f32>, normal: vec3<f32>, viewDirection: vec3<f32>,
    anisotropic: AnisotropicGGX, alphaSquared: f32, specularProbability: f32,
    diffuseTransmission: f32) -> f32 {
  let normalLight = dot(normal, direction);
  if (normalLight <= 0.0) { return 0.0; }
  let halfDirection = normalize(viewDirection + direction);
  let normalHalf = max(dot(normal, halfDirection), 0.0);
  let viewHalf = max(dot(viewDirection, halfDirection), 0.000001);
  let normalHalfSquared = normalHalf * normalHalf;
  let distributionDenominator = (1.0 - normalHalfSquared) + alphaSquared * normalHalfSquared;
  let distribution = alphaSquared / (PI * distributionDenominator * distributionDenominator);
  let baseDistribution = getGGXDistribution(anisotropic, halfDirection, normalHalf, distribution);
  let specularDensity = baseDistribution * normalHalf / (4.0 * viewHalf);
  return specularProbability * specularDensity +
    (1.0 - specularProbability) * (1.0 - diffuseTransmission) * normalLight / PI;
}

fn getPBRDirectionDensity(ray: Ray, hit: RayHit, primitive: RayPrimitive,
    normal: vec3<f32>, direction: vec3<f32>, faceLight: f32) -> f32 {
  let metallic = clamp(primitive.emissive.w, 0.0, 1.0);
  let continuousProbability = 1.0 - clamp(primitive.material.y, 0.0, 1.0) * (1.0 - metallic);
  let specularProbability = mix(0.25, 1.0, metallic);
  let diffuseTransmission = getDiffuseTransmission(primitive);
  if (faceLight <= 0.0) {
    return continuousProbability * (1.0 - specularProbability) * diffuseTransmission *
      (-faceLight / PI);
  }
  let roughness = clamp(primitive.properties.x, 0.04, 1.0);
  let alpha = roughness * roughness;
  let anisotropic = getAnisotropicGGX(hit, primitive, normal, alpha);
  return continuousProbability * getPBRReflectionDensity(direction, normal, -ray.direction,
    anisotropic, alpha * alpha, specularProbability, diffuseTransmission);
}

fn evaluatePBRResponse(ray: Ray, hit: RayHit, direction: vec3<f32>,
    primitive: RayPrimitive, normal: vec3<f32>, includeReflection: bool) -> vec3<f32> {
  let baseColor = clamp(primitive.baseColor.rgb, vec3<f32>(0.0), vec3<f32>(1.0));
  let metallic = clamp(primitive.emissive.w, 0.0, 1.0);
  let roughness = clamp(primitive.properties.x, 0.04, 1.0);
  let alphaRoughness = roughness * roughness;
  let alphaSquared = alphaRoughness * alphaRoughness;
  let viewDirection = -ray.direction;
  let normalView = clamp(dot(normal, viewDirection), 0.001, 1.0);
  let normalLight = max(dot(normal, direction), 0.0);
  if ((normalLight <= 0.0 && primitive.clearcoatOcclusion.x <= 0.0) || dot(getFaceNormal(hit, ray), direction) <= 0.0) { return vec3<f32>(0.0); }
  let halfDirection = normalize(viewDirection + direction);
  let normalHalf = max(dot(normal, halfDirection), 0.0);
  let viewHalf = max(dot(viewDirection, halfDirection), 0.000001);
  let normalHalfSquared = normalHalf * normalHalf;
  let distributionDenominator = (1.0 - normalHalfSquared) + alphaSquared * normalHalfSquared;
  let distribution = alphaSquared / (PI * distributionDenominator * distributionDenominator);
  let dielectricReflectance = getDielectricReflectance(primitive);
  let reflectance = mix(dielectricReflectance, baseColor, metallic);
  let grazingReflectance = getGrazingReflectance(primitive, reflectance, metallic);
  let fresnel = evaluateBaseFresnel(primitive, reflectance, grazingReflectance, viewHalf);
  let lightVisibility = 2.0 * normalLight / (normalLight + sqrt(alphaSquared +
    (1.0 - alphaSquared) * normalLight * normalLight));
  let viewVisibility = 2.0 * normalView / (normalView + sqrt(alphaSquared +
    (1.0 - alphaSquared) * normalView * normalView));
  // Match the scalar direct-light BRDF; cancel N.L before dividing by the PDF.
  let diffuse = (1.0 - getDiffuseTransmission(primitive)) * (vec3<f32>(1.0) - fresnel) * baseColor * (vec3<f32>(1.0) - dielectricReflectance) * (1.0 - metallic) * normalLight / PI;
  let anisotropic = getAnisotropicGGX(hit, primitive, normal, alphaRoughness);
  let baseDistribution = getGGXDistribution(anisotropic, halfDirection, normalHalf, distribution);
  let baseVisibility = getGGXVisibility(anisotropic, direction, normalLight, lightVisibility) *
    getGGXVisibility(anisotropic, viewDirection, normalView, viewVisibility);
  let specular = fresnel * baseVisibility * baseDistribution / (4.0 * normalView);
  let layeredResponse = applySheen(diffuse + select(vec3<f32>(0.0), specular, includeReflection),
    primitive.sheen, normalHalf, normalView, normalLight, includeReflection);
  return applyClearcoat(layeredResponse, primitive.clearcoatOcclusion.xy, hit, viewDirection, direction, halfDirection, viewHalf, includeReflection);
}

const EMITTER_SAMPLING_ENABLED = /* EMITTER_SAMPLING_ENABLED */ true;
const EMITTER_MIS_ENABLED = /* EMITTER_MIS_ENABLED */ true;

// CDF emitter selection, uniform triangle selection and conditional area sampling. Visibility rejects far sides of spheres.
// The sphere Jacobian supports nonuniform scales and general affine instance transforms.
fn evaluateEmitterLighting(ray: Ray, hit: RayHit, randomSeed: u32, compareContinuation: bool, split: bool,
    specularRadiance: ptr<function, vec3<f32>>) -> vec3<f32> {
  let emitterCount = uniforms.emitters.x;
  if (!EMITTER_SAMPLING_ENABLED || uniforms.emitters.y == 0u || emitterCount == 0u) { return vec3<f32>(0.0); }
  let emitterSample = makeRandom(randomSeed ^ 701u);
  var emitterIndex = min(u32(emitterSample * f32(emitterCount)), emitterCount - 1u);
  var inverseSelectionProbability = f32(emitterCount);
  if (uniforms.emitters.z == 1u) {
    var lower = 0u;
    var upper = emitterCount;
    while (lower < upper) {
      let middle = lower + (upper - lower) / 2u;
      if (emitterSample < lights[uniforms.dimensions.w + middle].colorIntensity.z) {
        upper = middle;
      } else {
        lower = middle + 1u;
      }
    }
    emitterIndex = min(lower, emitterCount - 1u);
    inverseSelectionProbability = 1.0 / lights[uniforms.dimensions.w + emitterIndex].colorIntensity.y;
  }
  let primitiveIndex = u32(lights[uniforms.dimensions.w + emitterIndex].colorIntensity.x);
  let emitter = primitives[primitiveIndex];
  var emitterTriangleIndex = 0xffffffffu;
  var emitterVertexColor = vec4<f32>(1.0);
  var emitterCoordinates = vec2<f32>(0.0);
  var emitterSecondaryCoordinates = vec2<f32>(0.0);
  var lightPosition: vec3<f32>;
  var lightNormal: vec3<f32>;
  var inverseAreaDensity: f32;
  let firstSample = makeRandom(randomSeed ^ 911u);
  let secondSample = makeRandom(randomSeed ^ 1301u);
  if (emitter.properties.y > 0.0) {
    let height = 1.0 - 2.0 * firstSample;
    let radius = sqrt(max(1.0 - height * height, 0.0));
    let angle = 2.0 * PI * secondSample;
    let localNormal = vec3<f32>(radius * cos(angle), height, radius * sin(angle));
    emitterCoordinates = vec2<f32>(atan2(localNormal.z, localNormal.x) / (2.0 * PI) + 0.5, acos(clamp(localNormal.y, -1.0, 1.0)) / PI);
    lightPosition = (emitter.transform * vec4<f32>(localNormal * emitter.properties.y, 1.0)).xyz;
    let transformedNormal = (transpose(emitter.inverseTransform) * vec4<f32>(localNormal, 0.0)).xyz;
    lightNormal = normalize(transformedNormal);
    let linearTransform = mat3x3<f32>(emitter.transform[0].xyz, emitter.transform[1].xyz, emitter.transform[2].xyz);
    inverseAreaDensity = 4.0 * PI * emitter.properties.y * emitter.properties.y *
      abs(determinant(linearTransform)) * length(transformedNormal) * inverseSelectionProbability;
  } else {
    let triangleCount = u32(emitter.properties.w);
    if (triangleCount == 0u) { return vec3<f32>(0.0); }
    let triangleIndex = min(u32(makeRandom(randomSeed ^ 1571u) * f32(triangleCount)), triangleCount - 1u);
    emitterTriangleIndex = u32(emitter.properties.z) + triangleIndex;
    let triangle = triangles[emitterTriangleIndex];
    let firstPosition = (emitter.transform * vec4<f32>(triangle.firstPosition.xyz, 1.0)).xyz;
    let secondPosition = (emitter.transform * vec4<f32>(triangle.secondPosition.xyz, 1.0)).xyz;
    let thirdPosition = (emitter.transform * vec4<f32>(triangle.thirdPosition.xyz, 1.0)).xyz;
    let rootSample = sqrt(firstSample);
    let weights = vec3<f32>(1.0 - rootSample, rootSample * (1.0 - secondSample), rootSample * secondSample);
    emitterVertexColor = triangle.colors[0] * weights.x + triangle.colors[1] * weights.y + triangle.colors[2] * weights.z;
    emitterCoordinates = vec2<f32>(triangle.firstPosition.w, triangle.firstNormal.w) * weights.x +
      vec2<f32>(triangle.secondPosition.w, triangle.secondNormal.w) * weights.y +
      vec2<f32>(triangle.thirdPosition.w, triangle.thirdNormal.w) * weights.z;
    emitterSecondaryCoordinates = triangle.secondaryCoordinates[0].xy * weights.x +
      triangle.secondaryCoordinates[0].zw * weights.y + triangle.secondaryCoordinates[1].xy * weights.z;
    lightPosition = firstPosition * (1.0 - rootSample) + secondPosition * (rootSample * (1.0 - secondSample)) + thirdPosition * (rootSample * secondSample);
    let areaNormal = cross(secondPosition - firstPosition, thirdPosition - firstPosition);
    let twiceArea = length(areaNormal);
    if (twiceArea <= 0.00000001) { return vec3<f32>(0.0); }
    // A mirrored glTF instance reverses front winding. Transform the local
    // geometric normal like traversal does, while keeping the world-space area.
    if (isOneSidedTriangle(emitter)) {
      let localAreaNormal = cross(triangle.secondPosition.xyz - triangle.firstPosition.xyz,
        triangle.thirdPosition.xyz - triangle.firstPosition.xyz);
      lightNormal = normalize((transpose(emitter.inverseTransform) * vec4<f32>(localAreaNormal, 0.0)).xyz);
    } else {
      lightNormal = areaNormal / twiceArea;
    }
    inverseAreaDensity = 0.5 * twiceArea * f32(triangleCount) * inverseSelectionProbability;
  }
  let position = ray.origin + ray.direction * hit.distance;
  let shadingNormal = getShadingNormal(hit);
  let normal = select(shadingNormal, -shadingNormal, dot(hit.normal, ray.direction) > 0.0);
  let offset = lightPosition - position;
  let distanceSquared = dot(offset, offset);
  if (distanceSquared <= RAY_EPSILON * RAY_EPSILON) { return vec3<f32>(0.0); }
  let direction = offset / sqrt(distanceSquared);
  let normalLight = max(dot(normal, direction), 0.0);
  let face = getFaceNormal(hit, ray);
  let faceLight = dot(face, direction);
  let receiver = getShadedPrimitive(hit);
  let diffuseTransmission = getDiffuseTransmission(receiver);
  if ((normalLight <= 0.0 && !usePBRTransport()) ||
      (faceLight <= 0.0 && diffuseTransmission <= 0.0)) { return vec3<f32>(0.0); }
  let shadowOrigin = position + face * select(-0.002, 0.002, faceLight > 0.0);
  let shadowOffset = lightPosition - shadowOrigin;
  let shadowDistance = length(shadowOffset);
  let shadowRay = makeSurfaceRay(ray, hit.distance, shadowOrigin, shadowOffset / max(shadowDistance, RAY_EPSILON));
  if (uniforms.settings.w > 0.5 && intersectsScene(shadowRay, shadowDistance - 0.002)) { return vec3<f32>(0.0); }
  var specularResponse = vec3<f32>(0.0);
  var response = clamp(receiver.baseColor.rgb, vec3<f32>(0.0), vec3<f32>(1.0)) * 0.96 *
    (1.0 - clamp(receiver.emissive.w, 0.0, 1.0)) * normalLight / PI;
  if (usePBRTransport()) {
    if (faceLight < 0.0) {
      response = getDiffuseTransmissionTint(receiver, hit, -ray.direction, abs(dot(face, ray.direction)), -faceLight) *
        (-faceLight / PI) * diffuseTransmission;
    } else {
      response = evaluatePBRResponse(ray, hit, direction, receiver, normal, true);
      if (SPLIT_HISTORY && split) {
        specularResponse = response - evaluatePBRResponse(ray, hit, direction, receiver, normal, false);
      }
    }
    let opaqueWeight = select(1.0,
      1.0 - clamp(receiver.material.y, 0.0, 1.0) * (1.0 - clamp(receiver.emissive.w, 0.0, 1.0)),
      uniforms.sampling.y > 0u);
    response *= opaqueWeight;
    specularResponse *= opaqueWeight;
  }
  let visibility = exp(-max(uniforms.fog.w, 0.0) * hit.distance);
  var emitterHit = RayHit(shadowDistance, lightNormal, primitiveIndex, true,
    emitterCoordinates, emitterSecondaryCoordinates, emitterTriangleIndex, 0.0, emitterVertexColor, vec2<f32>(0.0));
  var emitterCoverage = 1.0;
  if (emitter.material.x != OPAQUE_ALPHA_MODE) {
    emitterHit.footprint = getCutoutFootprint(shadowRay, emitterHit);
    if (emitter.material.x == BLEND_ALPHA_MODE) {
      // Continuation rays reach this emitter with the same coverage probability.
      emitterCoverage = clamp(getMaterialOpacity(emitterHit), 0.0, 1.0);
    } else if (!isMaterialVisible(emitterHit, 0u)) { return vec3<f32>(0.0); }
    // Both emitter estimators evaluate emission at mip zero.
    emitterHit.footprint = 0.0;
  }
  let signedLightCosine = dot(lightNormal, -direction);
  if (isOneSidedTriangle(emitter) && signedLightCosine <= 0.0) { return vec3<f32>(0.0); }
  let lightCosine = abs(signedLightCosine);
  if (lightCosine <= 0.0) { return vec3<f32>(0.0); }
  let lightDensity = distanceSquared / (lightCosine * inverseAreaDensity);
  var weight = 1.0;
  if (EMITTER_MIS_ENABLED && compareContinuation) {
    var materialDensity = select(0.0, normalLight / PI, faceLight > 0.0);
    if (usePBRTransport()) {
      materialDensity = getPBRDirectionDensity(ray, hit, receiver, normal, direction, faceLight);
    }
    weight = getMISWeight(lightDensity, materialDensity);
  }
  let emission = getMaterialEmission(emitterHit);
  let lightWeight = (emitterCoverage * weight / lightDensity) * visibility;
  if (SPLIT_HISTORY && split) { *specularRadiance += specularResponse * emission * lightWeight; }
  return response * emission * lightWeight;
}

// Scale before squaring to keep the power heuristic finite for grazing connections.
fn getMISWeight(sampledDensity: f32, otherDensity: f32) -> f32 {
  let ratio = otherDensity / max(sampledDensity, 1e-20);
  return 1.0 / (1.0 + ratio * ratio);
}

fn getEmitterHitDensity(ray: Ray, hit: RayHit, sourcePosition: vec3<f32>) -> f32 {
  let primitive = primitives[hit.primitiveIndex];
  let position = ray.origin + ray.direction * hit.distance;
  var inverseArea: f32;
  if (hit.triangleIndex == 0xffffffffu) {
    let localPosition = (primitive.inverseTransform * vec4<f32>(position, 1.0)).xyz;
    let localNormal = normalize(localPosition);
    let transformedNormal = (transpose(primitive.inverseTransform) * vec4<f32>(localNormal, 0.0)).xyz;
    let linearTransform = mat3x3<f32>(primitive.transform[0].xyz, primitive.transform[1].xyz, primitive.transform[2].xyz);
    inverseArea = 4.0 * PI * primitive.properties.y * primitive.properties.y *
      abs(determinant(linearTransform)) * length(transformedNormal);
  } else {
    let triangle = triangles[hit.triangleIndex];
    let firstEdge = (primitive.transform * vec4<f32>(triangle.secondPosition.xyz - triangle.firstPosition.xyz, 0.0)).xyz;
    let secondEdge = (primitive.transform * vec4<f32>(triangle.thirdPosition.xyz - triangle.firstPosition.xyz, 0.0)).xyz;
    inverseArea = 0.5 * length(cross(firstEdge, secondEdge)) * primitive.properties.w;
  }
  let offset = position - sourcePosition;
  let cosine = abs(dot(getFaceNormal(hit, ray), normalize(offset)));
  if (inverseArea <= 0.0 || cosine <= 0.0) { return 0.0; }
  for (var index = 0u; index < uniforms.emitters.x; index++) {
    let entry = lights[uniforms.dimensions.w + index].colorIntensity;
    if (u32(entry.x) == hit.primitiveIndex) {
      let probability = select(1.0 / f32(uniforms.emitters.x), entry.y, uniforms.emitters.z > 0u);
      return probability * dot(offset, offset) / (inverseArea * cosine);
    }
  }
  return 0.0;
}

// Carry the camera pixel cone through secondary paths using total travel distance.
const MATERIAL_HAS_MIPMAPS = /* MATERIAL_HAS_MIPMAPS */ false;

fn getSecondaryFootprint(ray: Ray, hit: RayHit, coneWidth: f32) -> f32 {
  if (!MATERIAL_HAS_MIPMAPS || coneWidth <= 0.0 || hit.triangleIndex == 0xffffffffu) {
    return 0.0;
  }
  return coneWidth / max(abs(dot(getFaceNormal(hit, ray), ray.direction)), 0.05);
}

const ENVIRONMENT_LIGHTING_ENABLED = /* ENVIRONMENT_LIGHTING_ENABLED */ false;
const ENVIRONMENT_DIRECTION_DENSITY = 1.0 / (4.0 * PI);

const DIRECTIONAL_ENVIRONMENT_ENABLED = /* DIRECTIONAL_ENVIRONMENT_ENABLED */ false;
const ENVIRONMENT_UNIFORM_FRACTION = 0.05;

fn getEnvironmentMapOffset() -> u32 {
  return uniforms.dimensions.w + uniforms.emitters.x;
}

fn getEnvironmentTexel(direction: vec3<f32>) -> vec4<f32> {
  let dimensions = uniforms.environmentMap.xy;
  let longitude = fract(atan2(direction.z, direction.x) / (2.0 * PI));
  let latitude = acos(clamp(direction.y, -1.0, 1.0)) / PI;
  let texel = min(vec2<u32>(vec2<f32>(longitude, latitude) * vec2<f32>(dimensions)), dimensions - vec2<u32>(1u));
  return lights[getEnvironmentMapOffset() + texel.y * dimensions.x + texel.x].colorIntensity;
}

fn sampleEnvironmentDirection(seed: u32) -> vec3<f32> {
  let vertical = makeRandom(seed ^ 1231u);
  let horizontal = makeRandom(seed ^ 1597u);
  var height = 1.0 - 2.0 * vertical;
  var azimuth = 2.0 * PI * horizontal;
  // The uniform component gives every direction support, even when adjacent CDF entries round together.
  if (DIRECTIONAL_ENVIRONMENT_ENABLED && makeRandom(seed ^ 1879u) >= ENVIRONMENT_UNIFORM_FRACTION) {
    let dimensions = uniforms.environmentMap.xy;
    let tableOffset = getEnvironmentMapOffset();
    let selection = min(makeRandom(seed ^ 2137u), 0.99999994);
    var lower = 0u;
    var upper = dimensions.x * dimensions.y - 1u;
    while (lower < upper) {
      let middle = lower + (upper - lower) / 2u;
      if (selection < lights[tableOffset + middle].positionInnerCone.x) {
        upper = middle;
      } else {
        lower = middle + 1u;
      }
    }
    let column = lower % dimensions.x;
    let row = lower / dimensions.x;
    let north = cos(PI * f32(row) / f32(dimensions.y));
    let south = cos(PI * f32(row + 1u) / f32(dimensions.y));
    height = mix(north, south, vertical);
    azimuth = 2.0 * PI * (f32(column) + horizontal) / f32(dimensions.x);
  }
  let radius = sqrt(max(1.0 - height * height, 0.0));
  return vec3<f32>(radius * cos(azimuth), height, radius * sin(azimuth));
}

fn evaluateEnvironmentLighting(ray: Ray, hit: RayHit, seed: u32, compareContinuation: bool, split: bool,
    specularRadiance: ptr<function, vec3<f32>>) -> vec3<f32> {
  if (!ENVIRONMENT_LIGHTING_ENABLED) { return vec3<f32>(0.0); }
  let direction = sampleEnvironmentDirection(seed);
  let face = getFaceNormal(hit, ray);
  let faceLight = dot(face, direction);
  let shadingNormal = getShadingNormal(hit);
  let normal = select(shadingNormal, -shadingNormal, dot(hit.normal, ray.direction) > 0.0);
  let normalLight = max(dot(normal, direction), 0.0);
  let primitive = getShadedPrimitive(hit);
  let diffuseTransmission = getDiffuseTransmission(primitive);
  if (faceLight <= 0.0 && diffuseTransmission <= 0.0) { return vec3<f32>(0.0); }
  let position = ray.origin + ray.direction * hit.distance;
  let origin = position + face * select(-0.002, 0.002, faceLight > 0.0);
  if (intersectsScene(makeSurfaceRay(ray, hit.distance, origin, direction), RAY_INFINITY)) { return vec3<f32>(0.0); }
  var specularResponse = vec3<f32>(0.0);
  var response = clamp(primitive.baseColor.rgb, vec3<f32>(0.0), vec3<f32>(1.0)) *
    0.96 * (1.0 - clamp(primitive.emissive.w, 0.0, 1.0)) * normalLight / PI;
  var materialDensity = normalLight / PI;
  if (usePBRTransport()) {
    if (faceLight < 0.0) {
      response = getDiffuseTransmissionTint(primitive, hit, -ray.direction, abs(dot(face, ray.direction)), -faceLight) *
        (-faceLight / PI) * diffuseTransmission;
    } else {
      response = evaluatePBRResponse(ray, hit, direction, primitive, normal, true);
      if (SPLIT_HISTORY && split) {
        specularResponse = response - evaluatePBRResponse(ray, hit, direction, primitive, normal, false);
      }
    }
    if (PATH_BOUNCES_ENABLED && uniforms.sampling.y > 0u) {
      let opaqueWeight = 1.0 - clamp(primitive.material.y, 0.0, 1.0) * (1.0 - clamp(primitive.emissive.w, 0.0, 1.0));
      response *= opaqueWeight;
      specularResponse *= opaqueWeight;
    }
    if (compareContinuation) {
      materialDensity = getPBRDirectionDensity(ray, hit, primitive, normal, direction, faceLight);
    }
  }
  let environment = evaluateEnvironmentRadiance(direction, hit.distance);
  let weight = getMISWeight(environment.w, select(0.0, materialDensity, compareContinuation));
  let lightWeight = weight / environment.w;
  if (SPLIT_HISTORY && split) { *specularRadiance += specularResponse * environment.rgb * lightWeight; }
  return response * environment.rgb * lightWeight;
}

// The fourth component is the solid-angle density used by both estimators.
fn evaluateEnvironmentRadiance(direction: vec3<f32>, receiverDistance: f32) -> vec4<f32> {
  var radiance = uniforms.environmentRadiance.rgb;
  var density = ENVIRONMENT_DIRECTION_DENSITY;
  if (DIRECTIONAL_ENVIRONMENT_ENABLED) {
    let texel = getEnvironmentTexel(direction);
    radiance += texel.rgb;
    density = mix(texel.w, density, ENVIRONMENT_UNIFORM_FRACTION);
  }
  return vec4<f32>(radiance * exp(-max(uniforms.fog.w, 0.0) * receiverDistance), density);
}

// Unlit surfaces are terminal visibility hits, with no light sampling or bounce.
fn getUnlitRadiance(hit: RayHit) -> vec3<f32> {
  let color = getShadedPrimitive(hit).baseColor.rgb;
  let visibility = exp(-max(uniforms.fog.w, 0.0) * hit.distance);
  return mix(uniforms.fog.rgb, color, visibility);
}

fn evaluatePBRTransport(primaryRay: Ray, primaryHit: RayHit, pixel: vec2<u32>, sampleIndex: u32,
    specularRadiance: ptr<function, vec3<f32>>) -> vec3<f32> {
  if (primitives[primaryHit.primitiveIndex].materialFlags.x > 0.0) {
    return getUnlitRadiance(primaryHit);
  }
  var ray = primaryRay;
  var hit = primaryHit;
  var coneWidth = 0.0;
  var coneSpread = 0.0;
  if (MATERIAL_HAS_MIPMAPS && hit.footprint > 0.0) {
    coneWidth = hit.footprint * max(abs(dot(getFaceNormal(hit, ray), ray.direction)), 0.05);
    if (uniforms.cameraPosition.w < 0.5) {
      coneSpread = coneWidth / max(hit.distance, RAY_EPSILON);
    }
  }
  var radiance = evaluateDirectLighting(ray, hit, true, true, true, specularRadiance);
  var specularThroughput = vec3<f32>(0.0);
  var unusedSpecular = vec3<f32>(0.0);
  var throughput = vec3<f32>(1.0);
  var dielectricOnly = true;
  var spectralChannel = 3u;
  // One push per bounce at most. The path budget below is also eight.
  var mediumStack: array<u32, 8>;
  var mediumCount = 0u;
  var medium = NO_PATH_MEDIUM;
  let pixelIndex = getSamplingPixelIndex(pixel);
  let sequenceIndex = uniforms.acceleration.w * 16u + sampleIndex;
  let pathSeed = uniforms.sampling.x ^ (pixelIndex * 1973u) ^ (sequenceIndex * 26699u);
  // An unshadowed connection and an occlusion-tested continuation estimate different integrals.
  let allowEmitterMIS = EMITTER_MIS_ENABLED && uniforms.settings.w > 0.5 && uniforms.emitters.y != 0u;
  radiance += evaluateEmitterLighting(ray, hit, pathSeed, allowEmitterMIS && uniforms.sampling.y > 0u, true, specularRadiance);
  radiance += evaluateEnvironmentLighting(ray, hit, pathSeed, PATH_BOUNCES_ENABLED && uniforms.sampling.y > 0u, true, specularRadiance);
  for (var bounceIndex = 0u; PATH_BOUNCES_ENABLED && bounceIndex < min(uniforms.sampling.y, 8u); bounceIndex++) {
    var incidentMedium = medium;
    var transmittedMedium = hit.primitiveIndex;
    if (!hit.entering) {
      // A back-facing first hit can originate inside one dielectric.
      if (mediumCount == 0u) { incidentMedium = hit.primitiveIndex; }
      transmittedMedium = NO_PATH_MEDIUM;
      if (mediumCount > 1u) { transmittedMedium = mediumStack[mediumCount - 2u]; }
    }
    let sample = samplePBRMaterial(ray, hit, pathSeed ^ (bounceIndex * 104729u),
      &spectralChannel, incidentMedium, transmittedMedium, bounceIndex == 0u);
    let dielectric = sample.eventKind != CONTINUOUS_MATERIAL_EVENT;
    dielectricOnly = dielectricOnly && dielectric;
    throughput *= sample.weight;
    if (SPLIT_HISTORY) {
      specularThroughput = select(specularThroughput * sample.weight, sample.specularWeight, bounceIndex == 0u);
    }
    if (max(throughput.r, max(throughput.g, throughput.b)) <= 0.0) { break; }
    let normal = select(getFaceNormal(hit, ray), faceForward(hit.normal, ray.direction, hit.normal), sample.eventKind == SMOOTH_DIELECTRIC_EVENT);
    let receiverDistance = hit.distance;
    let position = ray.origin + ray.direction * receiverDistance;
    let pairEmission = allowEmitterMIS && !isAbsorbingPathMedium(medium) && !dielectric;
    if (sample.crossesInterface) {
      if (hit.entering) {
        mediumStack[mediumCount] = hit.primitiveIndex;
        mediumCount++;
      } else if (mediumCount > 0u) {
        mediumCount--;
      }
      medium = transmittedMedium;
    }
    ray = makeSurfaceRay(ray, receiverDistance,
      position + normal * select(-0.002, 0.002, dot(normal, sample.direction) >= 0.0), sample.direction);
    if (SAMPLE_TRAVERSAL && traversalSampled) { rayCounts.w++; }
    hit = intersectScene(ray, RAY_INFINITY);
    if (hit.distance >= RAY_INFINITY) {
      // A camera backdrop remains visible through dielectric paths without
      // turning it into diffuse environment illumination.
      if (!isAbsorbingPathMedium(medium)) {
        if (ENVIRONMENT_LIGHTING_ENABLED) {
          let environment = evaluateEnvironmentRadiance(ray.direction, receiverDistance);
          let weight = select(getMISWeight(sample.density, environment.w), 1.0, dielectric);
          radiance += throughput * weight * environment.rgb;
      if (SPLIT_HISTORY) { *specularRadiance += specularThroughput * weight * environment.rgb; }
        } else if (dielectricOnly) {
          radiance += throughput * uniforms.background.rgb;
      if (SPLIT_HISTORY) { *specularRadiance += specularThroughput * uniforms.background.rgb; }
        }
      }
      break;
    }
    if (isAbsorbingPathMedium(medium)) {
      let attenuation = primitives[medium].attenuation;
      let segmentLength = length(ray.origin + ray.direction * hit.distance - position);
      let transmission = getVolumeTransmission(attenuation, segmentLength);
      throughput *= transmission;
      if (SPLIT_HISTORY) { specularThroughput *= transmission; }
    }
    if (MATERIAL_HAS_MIPMAPS) {
      coneWidth += coneSpread * hit.distance;
      hit.footprint = getSecondaryFootprint(ray, hit, coneWidth);
    }
    if (primitives[hit.primitiveIndex].materialFlags.x > 0.0) {
      radiance += throughput * getUnlitRadiance(hit);
      if (SPLIT_HISTORY) { *specularRadiance += specularThroughput * getUnlitRadiance(hit); }
      break;
    }
    var illumination = evaluateDirectLighting(ray, hit, dielectric || !EMITTER_SAMPLING_ENABLED || uniforms.emitters.y == 0u, mediumCount == 0u, false, &unusedSpecular);
    if (pairEmission && any(primitives[hit.primitiveIndex].emissive.rgb > vec3<f32>(0.0))) {
      let emitterDensity = getEmitterHitDensity(ray, hit, position);
      let weight = getMISWeight(sample.density, emitterDensity);
      var emissionHit = hit;
      if (emitterDensity > 0.0) { emissionHit.footprint = 0.0; }
      let emission = getMaterialEmission(emissionHit);
      let fogDistance = select(hit.distance, receiverDistance, emitterDensity > 0.0);
      illumination += emission * (weight * exp(-max(uniforms.fog.w, 0.0) * fogDistance));
    }
    illumination += evaluateEmitterLighting(ray, hit, pathSeed ^ ((bounceIndex + 1u) * 1987u),
      allowEmitterMIS && !isAbsorbingPathMedium(medium) && bounceIndex + 1u < min(uniforms.sampling.y, 8u), false, &unusedSpecular);
    if (ENVIRONMENT_LIGHTING_ENABLED && !isAbsorbingPathMedium(medium)) {
      illumination += evaluateEnvironmentLighting(ray, hit, pathSeed ^ ((bounceIndex + 1u) * 1987u),
        bounceIndex + 1u < min(uniforms.sampling.y, 8u), false, &unusedSpecular);
    }
    radiance += throughput * illumination;
      if (SPLIT_HISTORY) { *specularRadiance += specularThroughput * illumination; }
  }
  return radiance;
}

// Cosine-weighted Lambertian transport. The BRDF cosine and sampling PDF cancel.
fn evaluateDiffuseTransport(primaryRay: Ray, primaryHit: RayHit, pixel: vec2<u32>, sampleIndex: u32) -> vec3<f32> {
  if (primitives[primaryHit.primitiveIndex].materialFlags.x > 0.0) {
    return getUnlitRadiance(primaryHit);
  }
  var ray = primaryRay;
  var hit = primaryHit;
  var coneWidth = 0.0;
  var coneSpread = 0.0;
  if (MATERIAL_HAS_MIPMAPS && hit.footprint > 0.0) {
    coneWidth = hit.footprint * max(abs(dot(getFaceNormal(hit, ray), ray.direction)), 0.05);
    if (uniforms.cameraPosition.w < 0.5) {
      coneSpread = coneWidth / max(hit.distance, RAY_EPSILON);
    }
  }
  var unusedSpecular = vec3<f32>(0.0);
  var radiance = evaluateDirectLighting(ray, hit, true, false, false, &unusedSpecular);
  var throughput = vec3<f32>(1.0);
  let pixelIndex = getSamplingPixelIndex(pixel);
  let sequenceIndex = uniforms.acceleration.w * 16u + sampleIndex;
  let pathSeed = uniforms.sampling.x ^ (pixelIndex * 1973u) ^ (sequenceIndex * 26699u);
  radiance += evaluateEmitterLighting(ray, hit, pathSeed, uniforms.sampling.y > 0u, false, &unusedSpecular);
  radiance += evaluateEnvironmentLighting(ray, hit, pathSeed, PATH_BOUNCES_ENABLED && uniforms.sampling.y > 0u, false, &unusedSpecular);
  for (var bounceIndex = 0u; PATH_BOUNCES_ENABLED && bounceIndex < min(uniforms.sampling.y, 8u); bounceIndex++) {
    let primitive = getShadedPrimitive(hit);
    throughput *= clamp(primitive.baseColor.rgb, vec3<f32>(0.0), vec3<f32>(1.0)) *
      0.96 * (1.0 - clamp(primitive.emissive.w, 0.0, 1.0));
    if (max(throughput.r, max(throughput.g, throughput.b)) <= 0.0) {
      break;
    }
    let shadingNormal = getShadingNormal(hit);
    let normal = select(shadingNormal, -shadingNormal, dot(hit.normal, ray.direction) > 0.0);
    let reference = select(vec3<f32>(0.0, 0.0, 1.0), vec3<f32>(0.0, 1.0, 0.0), abs(normal.z) > 0.999);
    let tangent = normalize(cross(reference, normal));
    let bitangent = cross(normal, tangent);
    let radialSample = makeRandom(pathSeed ^ (bounceIndex * 104729u + 17u));
    let angle = 2.0 * PI * makeRandom(pathSeed ^ (bounceIndex * 130363u + 101u));
    let radius = sqrt(radialSample);
    let direction = tangent * (radius * cos(angle)) + bitangent * (radius * sin(angle)) +
      normal * sqrt(max(1.0 - radialSample, 0.0));
    let receiverDistance = hit.distance;
    let position = ray.origin + ray.direction * receiverDistance;
    let surfaceNormal = getFaceNormal(hit, ray);
    if (dot(surfaceNormal, direction) <= 0.0) { break; }
    ray = makeSurfaceRay(ray, receiverDistance, position + surfaceNormal * 0.002, normalize(direction));
    if (SAMPLE_TRAVERSAL && traversalSampled) { rayCounts.w++; }
    hit = intersectScene(ray, RAY_INFINITY);
    if (hit.distance >= RAY_INFINITY) {
      if (ENVIRONMENT_LIGHTING_ENABLED) {
        let density = max(dot(normal, ray.direction), 0.0) / PI;
        let environment = evaluateEnvironmentRadiance(ray.direction, receiverDistance);
        let weight = getMISWeight(density, environment.w);
        radiance += throughput * weight * environment.rgb;
      }
      break;
    }
    if (MATERIAL_HAS_MIPMAPS) {
      coneWidth += coneSpread * hit.distance;
      hit.footprint = getSecondaryFootprint(ray, hit, coneWidth);
    }
    if (primitives[hit.primitiveIndex].materialFlags.x > 0.0) {
      radiance += throughput * getUnlitRadiance(hit);
      break;
    }
    var illumination = evaluateDirectLighting(ray, hit, true, false, false, &unusedSpecular);
    if (EMITTER_SAMPLING_ENABLED && uniforms.emitters.y != 0u && uniforms.emitters.x > 0u) {
      if (EMITTER_MIS_ENABLED && any(primitives[hit.primitiveIndex].emissive.rgb > vec3<f32>(0.0))) {
        let density = max(dot(normal, ray.direction), 0.0) / PI;
        let emitterDensity = getEmitterHitDensity(ray, hit, position);
        if (emitterDensity > 0.0) {
          let weight = getMISWeight(density, emitterDensity);
          let fogDensity = max(uniforms.fog.w, 0.0);
          // Explicit connections use the incoming receiver segment and mip zero.
          let receiverVisibility = exp(-fogDensity * receiverDistance);
          let hitVisibility = exp(-fogDensity * hit.distance);
          var emissionHit = hit;
          emissionHit.footprint = 0.0;
          illumination += getMaterialEmission(emissionHit) * (weight * receiverVisibility) -
            getMaterialEmission(hit) * hitVisibility;
        }
      }
      illumination += evaluateEmitterLighting(ray, hit, pathSeed ^ ((bounceIndex + 1u) * 1987u),
        bounceIndex + 1u < min(uniforms.sampling.y, 8u), false, &unusedSpecular);
    }
    illumination += evaluateEnvironmentLighting(ray, hit, pathSeed ^ ((bounceIndex + 1u) * 1987u),
      bounceIndex + 1u < min(uniforms.sampling.y, 8u), false, &unusedSpecular);
    radiance += throughput * illumination;
  }
  return radiance;
}

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let phaseCount = max(uniforms.displayPhase.w, 1u);
  let phaseOffset = (uniforms.displayPhase.z + invocation.y) % phaseCount;
  let pixel = vec2<u32>(invocation.x * phaseCount + phaseOffset, invocation.y);
  /* TRAVERSAL_SAMPLE */
  if (pixel.x >= uniforms.dimensions.x || pixel.y >= uniforms.dimensions.y) {
    /* TRAVERSAL_EMPTY */
    return;
  }

  let sampleCount = clamp(u32(uniforms.settings.z), 1u, 16u);
  let guideMode = uniforms.environmentMap.z;
  var guideRay: Ray;
  var guideHit: RayHit;
  if (guideMode == 1u) {
    if (SAMPLE_TRAVERSAL && traversalSampled) { rayCounts.y++; }
    guideRay = makeGuideCameraRay(pixel);
    guideHit = intersectScene(guideRay, RAY_INFINITY);
  }
  var accumulatedColor = vec3<f32>(0.0);
  var accumulatedSpecular = vec3<f32>(0.0);
  /* MOMENT_INITIALIZE */
  for (var sampleIndex = 0u; sampleIndex < sampleCount; sampleIndex++) {
    let sampleOffset = makeRadianceSampleOffset(pixel, sampleIndex);
    let ray = makeCameraRay(pixel, sampleIndex);
    if (SAMPLE_TRAVERSAL && traversalSampled) { rayCounts.x++; }
    var hit = intersectScene(ray, RAY_INFINITY);
    var color = uniforms.background.rgb;
    var specular = vec3<f32>(0.0);
    if (hit.distance < RAY_INFINITY) {
      if (hit.triangleIndex != 0xffffffffu) {
        /* MATERIAL_PRIMARY_FOOTPRINT */
      }
      if (usePBRTransport()) {
        color = evaluatePBRTransport(ray, hit, pixel, sampleIndex, &specular);
      } else {
        color = evaluateDiffuseTransport(ray, hit, pixel, sampleIndex);
      }
    }
    accumulatedColor += color;
    if (SPLIT_HISTORY) { accumulatedSpecular += specular; }
    /* MOMENT_SAMPLE */
  }

  var color = accumulatedColor / f32(sampleCount) * uniforms.settings.x;
  var specular = accumulatedSpecular / f32(sampleCount) * uniforms.settings.x;
  if (SPLIT_HISTORY) { color -= specular; }
  let historicalSample = getHistoricalRaySample(pixel, guideRay, guideHit, color, 0);
  var specularHistory = rejectHistoricalRaySample();
  if (SPLIT_HISTORY) {
    specularHistory = getHistoricalRaySample(pixel, guideRay, guideHit, specular, 1);
  }
  /* MOMENT_AVERAGE */
  var totalSampleCount = min(f32(sampleCount), getHistorySampleLimit());
  if (historicalSample.valid) {
    totalSampleCount = min(
      historicalSample.sampleCount + f32(sampleCount),
      getHistorySampleLimit()
    );
    let currentWeight = min(f32(sampleCount) / totalSampleCount, 1.0);
    color = mix(historicalSample.color, color, currentWeight);
    /* MOMENT_BLEND */
  }
  var specularSampleCount = min(f32(sampleCount), getHistorySampleLimit());
  if (SPLIT_HISTORY && specularHistory.valid) {
    specularSampleCount = min(specularHistory.sampleCount + f32(sampleCount), getHistorySampleLimit());
    specular = mix(specularHistory.color, specular, min(f32(sampleCount) / specularSampleCount, 1.0));
  }
  textureStore(outputImage, vec2<i32>(pixel), vec4<f32>(color, totalSampleCount));
  if (guideMode == 2u) {
    textureStore(outputMetadata, vec2<i32>(pixel), textureLoad(historyMetadata, vec2<i32>(pixel), 0));
  } else if (guideMode == 1u) {
    let guideHitPosition = guideRay.origin +
      guideRay.direction * min(guideHit.distance, 65504.0);
    let metadata = select(
      vec4<f32>(0.0),
      vec4<f32>(
        encodeRayNormal(guideHit.normal),
        min(distance(guideHitPosition, uniforms.cameraPosition.xyz), 65504.0),
        encodeRayPrimitiveIdentifier(guideHit.primitiveIndex)
      ),
      guideHit.distance < RAY_INFINITY
    );
    textureStore(outputMetadata, vec2<i32>(pixel), metadata);
  }
  /* MOMENT_STORE */
  /* TRAVERSAL_STORE */
}
`;

/** Adds one pair of counter texels per 8×8 dispatch tile, without a storage buffer binding. */
export function getSampledRayTraversalShader(source: string): string {
  return source
    .replace('/* SAMPLE_TRAVERSAL */ false', 'true')
    .replace(
      '/* TRAVERSAL_COUNTER_BINDING */',
      '@group(0) @binding(15) var traversalOutput: texture_storage_2d<rgba32uint, write>;'
    )
    .replace(
      '/* TRAVERSAL_SAMPLE */',
      `traversalSampled = all(invocation.xy % 8u == vec2<u32>(0u));
  let counterPixel = vec2<i32>(invocation.xy / 8u) * vec2<i32>(2, 1);`
    )
    .replace(
      '/* TRAVERSAL_EMPTY */',
      `if (traversalSampled) {
      textureStore(traversalOutput, counterPixel, vec4<u32>(0u));
      textureStore(traversalOutput, counterPixel + vec2<i32>(1, 0), vec4<u32>(0u));
    }`
    )
    .replace(
      '/* TRAVERSAL_STORE */',
      `if (traversalSampled) {
    textureStore(traversalOutput, counterPixel, rayCounts);
    textureStore(traversalOutput, counterPixel + vec2<i32>(1, 0), vec4<u32>(traversalCounts, 1u));
  }`
    );
}

/** Packs diffuse, specular, and composed radiance into one sampled/storage binding. */
export function getSplitRayTracingHistoryShader(source: string): string {
  return source
    .replace('/* SPLIT_HISTORY */ false', 'true')
    .replace('var historyImage: texture_2d<f32>', 'var historyImage: texture_2d_array<f32>')
    .replace('var outputImage: texture_storage_2d<', 'var outputImage: texture_storage_2d_array<')
    .replace(
      'return textureLoad(historyImage, pixel, 0);',
      'return textureLoad(historyImage, pixel, layer, 0);'
    )
    .replace(
      'textureStore(outputImage, pixel, textureLoad(historyImage, pixel, 0));',
      `for (var layer = 0; layer < 3; layer++) {
    textureStore(outputImage, pixel, layer, textureLoad(historyImage, pixel, layer, 0));
  }`
    )
    .replace(
      'textureStore(outputImage, vec2<i32>(pixel), vec4<f32>(color, totalSampleCount));',
      `textureStore(outputImage, vec2<i32>(pixel), 0, vec4<f32>(color, totalSampleCount));
  textureStore(outputImage, vec2<i32>(pixel), 1, vec4<f32>(specular, specularSampleCount));
  textureStore(outputImage, vec2<i32>(pixel), 2,
    vec4<f32>(color + specular, min(totalSampleCount, specularSampleCount)));`
    );
}

/** Adds moment history to the trace or sparse carry shader when requested. */
export function getRayTracingMomentShader(source: string, carry = false): string {
  const historyLocation = carry ? 5 : 13;
  return source
    .replace(
      '/* MOMENT_BINDINGS */',
      `@group(0) @binding(${historyLocation}) var historyMoments: texture_2d<f32>;
@group(0) @binding(${historyLocation + 1}) var outputMoments: texture_storage_2d<rg32float, write>;`
    )
    .replace(
      '/* MOMENT_CARRY */',
      'textureStore(outputMoments, pixel, textureLoad(historyMoments, pixel, 0));'
    )
    .replace(
      '/* MOMENT_LOAD */\n  return vec2<f32>(0.0);',
      'return textureLoad(historyMoments, pixel, 0).xy;'
    )
    .replace('/* MOMENT_INITIALIZE */', 'var moments = vec2<f32>(0.0);')
    .replace(
      '/* MOMENT_SAMPLE */',
      `let luminance = dot(color, vec3<f32>(0.2126, 0.7152, 0.0722)) * uniforms.settings.x;
    let logLuminance = log2(1.0 + clamp(luminance, 0.0, 65504.0));
    moments += vec2<f32>(logLuminance, logLuminance * logLuminance);`
    )
    .replace('/* MOMENT_AVERAGE */', 'moments /= f32(sampleCount);')
    .replace(
      '/* MOMENT_BLEND */',
      `if (SPLIT_HISTORY) {
      // Moments describe the composite, so use the smaller retained confidence.
      if (specularHistory.valid) {
        let confidence = min(totalSampleCount, specularHistory.sampleCount + f32(sampleCount));
        moments = mix(historicalSample.moments, moments, min(f32(sampleCount) / confidence, 1.0));
      }
    } else {
      moments = mix(historicalSample.moments, moments, currentWeight);
    }`
    )
    .replace(
      '/* MOMENT_STORE */',
      'textureStore(outputMoments, vec2<i32>(pixel), vec4<f32>(moments, 0.0, 0.0));'
    );
}

/** On-demand full-resolution picking reuses the exact primary-ray traversal. */
export const RAY_TRACING_PICK_SHADER = /* wgsl */ `
${RAY_TRACING_SCENE_SHADER}

struct RayPickResult {
  positionDistance: vec4<f32>,
  normal: vec3<f32>,
  primitiveIdentifier: u32,
};

@group(0) @binding(13) var<storage, read_write> pickResult: RayPickResult;
@group(0) @binding(14) var<uniform> pickCoordinates: vec4<f32>;

@compute @workgroup_size(1)
fn pick() {
  let ray = makeCameraRayAtCoordinates(pickCoordinates.xy);
  let hit = intersectScene(ray, RAY_INFINITY);
  pickResult.primitiveIdentifier = 0u;
  if (hit.distance < RAY_INFINITY) {
    pickResult.positionDistance = vec4<f32>(ray.origin + ray.direction * hit.distance, hit.distance);
    pickResult.normal = hit.normal;
    pickResult.primitiveIdentifier = hit.primitiveIndex + 1u;
  }
}
`;

/** Full display-resolution primary-hit channels, independent of temporal radiance history. */
export const RAY_TRACING_CHANNEL_SHADER = /* wgsl */ `
${RAY_TRACING_SCENE_SHADER}

@group(0) @binding(13) var identifierImage: texture_storage_2d<r32uint, write>;
@group(0) @binding(14) var distanceImage: texture_storage_2d<r32float, write>;
@group(0) @binding(15) var normalImage: texture_storage_2d<rgba32float, write>;
@group(0) @binding(16) var projectedDepthImage: texture_storage_2d<r32float, write>;
@group(0) @binding(17) var<uniform> channelViewProjection: mat4x4<f32>;

@compute @workgroup_size(8, 8)
fn captureChannels(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let dimensions = textureDimensions(identifierImage);
  if (any(invocation.xy >= dimensions)) { return; }
  let pixel = vec2<i32>(invocation.xy);
  let coordinates = (vec2<f32>(invocation.xy) + vec2<f32>(0.5)) / vec2<f32>(dimensions);
  let ray = makeCameraRayAtCoordinates(coordinates);
  let hit = intersectScene(ray, RAY_INFINITY);
  var identifier = 0u;
  var distance = 0.0;
  var normal = vec4<f32>(0.0);
  var projectedDepth = 1.0;
  if (hit.distance < RAY_INFINITY) {
    identifier = hit.primitiveIndex + 1u;
    distance = hit.distance;
    normal = vec4<f32>(hit.normal, 1.0);
    let position = ray.origin + ray.direction * hit.distance;
    let clipPosition = channelViewProjection * vec4<f32>(position, 1.0);
    // Camera matrices use OpenGL clip depth; WebGPU attachments use zero to one.
    projectedDepth = clamp(clipPosition.z / clipPosition.w * 0.5 + 0.5, 0.0, 1.0);
  }
  textureStore(projectedDepthImage, pixel, vec4<f32>(projectedDepth));
  textureStore(identifierImage, pixel, vec4<u32>(identifier));
  textureStore(distanceImage, pixel, vec4<f32>(distance));
  textureStore(normalImage, pixel, normal);
}
`;

/** Compile-time presentation controls shared with the canonical forward PBR renderer. */
export type RayTracingPresentationOptions = {
  /** Zero disables tone mapping; one selects Reinhard, two Khronos Neutral, three ACES. */
  toneMapMode: number;
  /** Zero preserves linear color; one applies the exact sRGB transfer function. */
  outputEncoding: number;
  denoiseRadius?: 0 | 1 | 2;
  /** Uses retained log-luminance variance to guide spatial filtering. */
  varianceGuidance?: boolean;
  debugView?: RayTracingDebugView;
};

/** Resolves retained ray radiance with attachment-aware, canonical PBR color management. */
export function rayTracingPresentationUsesGuides(
  denoiseRadius: number,
  debugView: RayTracingDebugView
): boolean {
  return (
    denoiseRadius > 0 ||
    debugView === 'normal' ||
    debugView === 'cameraDistance' ||
    debugView === 'identity'
  );
}

export function getRayTracingScenePresentationShader(
  options: RayTracingPresentationOptions | boolean
): string {
  const toneMapMode = typeof options === 'boolean' ? (options ? 0 : 2) : options.toneMapMode;
  const outputEncoding = typeof options === 'boolean' ? (options ? 0 : 1) : options.outputEncoding;

  const denoiseRadius = typeof options === 'boolean' ? 0 : (options.denoiseRadius ?? 0);
  const debugView = typeof options === 'boolean' ? 'color' : (options.debugView ?? 'color');
  const useMetadata = rayTracingPresentationUsesGuides(denoiseRadius, debugView);
  const useMoments =
    debugView === 'variance' ||
    (typeof options !== 'boolean' && options.varianceGuidance && denoiseRadius > 0);

  return /* wgsl */ `
@group(0) @binding(0) var image: texture_2d<f32>;
${
  useMoments
    ? `@group(0) @binding(2) var momentsImage: texture_2d<f32>;
fn loadLogLuminanceVariance(pixel: vec2<i32>) -> f32 {
  let moments = textureLoad(momentsImage, pixel, 0).xy;
  return max(moments.y - moments.x * moments.x, 0.0);
}`
    : ''
}
${
  useMetadata
    ? `@group(0) @binding(1) var metadata: texture_2d<f32>;
fn decodeGuidanceNormal(encoded: vec2<f32>) -> vec3<f32> {
  let signedNormal = encoded * 2.0 - vec2<f32>(1.0);
  var normal = vec3<f32>(signedNormal, 1.0 - abs(signedNormal.x) - abs(signedNormal.y));
  let fold = clamp(-normal.z, 0.0, 1.0);
  normal.x += select(-fold, fold, normal.x < 0.0);
  normal.y += select(-fold, fold, normal.y < 0.0);
  return normalize(normal);
}
fn loadGuidedColor(pixel: vec2<i32>) -> vec3<f32> {
  let center = textureLoad(metadata, pixel, 0);
  let centerSample = textureLoad(image, pixel, 0);
  if (center.a <= 0.0 || center.a >= 65504.0 || centerSample.a <= 0.0) { return centerSample.rgb; }
  // Preserve detail as the retained estimate accumulates samples.
  let filterStrength = 1.0 - smoothstep(8.0, 64.0, centerSample.a);
  ${
    useMoments
      ? `let estimatedError = loadLogLuminanceVariance(pixel) / max(centerSample.a, 1.0);
  // A single sample cannot estimate variance.
  let varianceWeight = select(1.0, smoothstep(0.0, 0.0025, estimatedError), centerSample.a >= 2.0);`
      : 'let varianceWeight = 1.0;'
  }
  if (filterStrength * varianceWeight <= 0.0) { return centerSample.rgb; }
  let normal = decodeGuidanceNormal(center.xy);
  var color = vec3<f32>(0.0);
  var totalWeight = 0.0;
  let maximumPixel = vec2<i32>(textureDimensions(image)) - vec2<i32>(1);
  for (var vertical = -${denoiseRadius}; vertical <= ${denoiseRadius}; vertical++) {
    for (var horizontal = -${denoiseRadius}; horizontal <= ${denoiseRadius}; horizontal++) {
      let offset = vec2<i32>(horizontal, vertical);
      let neighborPixel = pixel + offset;
      if (any(neighborPixel < vec2<i32>(0)) || any(neighborPixel > maximumPixel)) { continue; }
      let neighbor = textureLoad(metadata, neighborPixel, 0);
      let normalAgreement = dot(normal, decodeGuidanceNormal(neighbor.xy));
      let depthDifference = abs(center.z - neighbor.z) / max(center.z, 0.0001);
      if (neighbor.a != center.a || normalAgreement < 0.9 || depthDifference > 0.02) { continue; }
      let neighborSample = textureLoad(image, neighborPixel, 0);
      let confidence = min(neighborSample.a / centerSample.a, 1.0);
      let weight = exp(-0.5 * f32(dot(offset, offset))) * pow(max(normalAgreement, 0.0), 16.0)
        * exp(-100.0 * depthDifference) * confidence;
      color += neighborSample.rgb * weight;
      totalWeight += weight;
    }
  }
  return mix(centerSample.rgb, color / max(totalWeight, 0.0001), filterStrength * varianceWeight);
}`
    : ''
}

struct PresentationVertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) textureCoordinates: vec2<f32>,
};

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> PresentationVertexOutput {
  let positions = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(3.0, -1.0),
    vec2<f32>(-1.0, 3.0)
  );
  let position = positions[vertexIndex];
  var output: PresentationVertexOutput;
  output.position = vec4<f32>(position, 0.0, 1.0);
  output.textureCoordinates = vec2<f32>(position.x * 0.5 + 0.5, 0.5 - position.y * 0.5);
  return output;
}

fn sampleRayTracingImage(textureCoordinates: vec2<f32>) -> vec3<f32> {
  let dimensions = textureDimensions(image);
  let maximumPixel = vec2<i32>(dimensions) - vec2<i32>(1);
  let samplePosition = clamp(
    textureCoordinates * vec2<f32>(dimensions) - vec2<f32>(0.5),
    vec2<f32>(0.0),
    vec2<f32>(maximumPixel)
  );
  let firstPixel = vec2<i32>(floor(samplePosition));
  let secondPixel = min(firstPixel + vec2<i32>(1), maximumPixel);
  let fraction = fract(samplePosition);
  let topLeft = ${denoiseRadius ? 'loadGuidedColor(firstPixel)' : 'textureLoad(image, firstPixel, 0).rgb'};
  let topRight = ${denoiseRadius ? 'loadGuidedColor(vec2<i32>(secondPixel.x, firstPixel.y))' : 'textureLoad(image, vec2<i32>(secondPixel.x, firstPixel.y), 0).rgb'};
  let bottomLeft = ${denoiseRadius ? 'loadGuidedColor(vec2<i32>(firstPixel.x, secondPixel.y))' : 'textureLoad(image, vec2<i32>(firstPixel.x, secondPixel.y), 0).rgb'};
  let bottomRight = ${denoiseRadius ? 'loadGuidedColor(secondPixel)' : 'textureLoad(image, secondPixel, 0).rgb'};
  return mix(mix(topLeft, topRight, fraction.x), mix(bottomLeft, bottomRight, fraction.x), fraction.y);
}

fn encodeRayTracingLinearSRGB(linearColor: vec3<f32>) -> vec3<f32> {
  let positiveColor = max(linearColor, vec3<f32>(0.0));
  return select(
    positiveColor * 12.92,
    1.055 * pow(positiveColor, vec3<f32>(1.0 / 2.4)) - 0.055,
    positiveColor > vec3<f32>(0.0031308)
  );
}

fn toneMapRayTracingKhronosPBRNeutral(inputColor: vec3<f32>) -> vec3<f32> {
  let startCompression = 0.76;
  let darkestChannel = min(inputColor.r, min(inputColor.g, inputColor.b));
  let offset = select(
    0.04,
    darkestChannel - 6.25 * darkestChannel * darkestChannel,
    darkestChannel < 0.08
  );
  var color = inputColor - vec3<f32>(offset);
  let peak = max(color.r, max(color.g, color.b));
  if (peak < startCompression) {
    return color;
  }

  let compressionRange = 1.0 - startCompression;
  let compressedPeak = 1.0 - compressionRange * compressionRange /
    (peak + compressionRange - startCompression);
  color *= compressedPeak / max(peak, 0.0001);
  let desaturation = 1.0 - 1.0 / (0.15 * (peak - compressedPeak) + 1.0);
  return mix(color, vec3<f32>(compressedPeak), desaturation);
}

@fragment
fn fragmentMain(@location(0) textureCoordinates: vec2<f32>) -> @location(0) vec4<f32> {
  ${
    debugView === 'color'
      ? `
  let radiance = sampleRayTracingImage(textureCoordinates);
  var color = max(radiance, vec3<f32>(0.0));
  if (${toneMapMode} == 1) {
    color /= vec3<f32>(1.0) + color;
  } else if (${toneMapMode} == 2) {
    color = toneMapRayTracingKhronosPBRNeutral(color);
  } else if (${toneMapMode} == 3) {
    color = clamp(
      (color * (2.51 * color + 0.03)) / (color * (2.43 * color + 0.59) + 0.14),
      vec3<f32>(0.0),
      vec3<f32>(1.0)
    );
  }
  if (${outputEncoding} == 0) {
    return vec4<f32>(color, 1.0);
  }
  return vec4<f32>(encodeRayTracingLinearSRGB(color), 1.0);
  `
      : getRayTracingDebugFragmentShader(debugView)
  }
}
`;
}

function getRayTracingDebugFragmentShader(debugView: RayTracingDebugView): string {
  const pixelShader = `let pixel = clamp(vec2<i32>(textureCoordinates * vec2<f32>(textureDimensions(image))),
    vec2<i32>(0), vec2<i32>(textureDimensions(image)) - vec2<i32>(1));`;
  if (debugView === 'variance') {
    return `${pixelShader}
      let deviation = sqrt(loadLogLuminanceVariance(pixel));
      return vec4<f32>(vec3<f32>(deviation / (1.0 + deviation)), 1.0);`;
  }
  if (debugView === 'history') {
    return `${pixelShader}
      let confidence = log2(1.0 + textureLoad(image, pixel, 0).a) / log2(257.0);
      return vec4<f32>(vec3<f32>(clamp(confidence, 0.0, 1.0)), 1.0);`;
  }
  const guidanceShader = `${pixelShader}
    let guidance = textureLoad(metadata, pixel, 0);
    if (guidance.a <= 0.0) { return vec4<f32>(0.0, 0.0, 0.0, 1.0); }`;
  switch (debugView) {
    case 'normal':
      return `${guidanceShader}
        return vec4<f32>(decodeGuidanceNormal(guidance.xy) * 0.5 + vec3<f32>(0.5), 1.0);`;
    case 'cameraDistance':
      return `${guidanceShader}
        return vec4<f32>(vec3<f32>(guidance.z / (1.0 + guidance.z)), 1.0);`;
    case 'identity':
      return `${guidanceShader}
        if (guidance.a >= 65504.0) { return vec4<f32>(1.0, 0.0, 1.0, 1.0); }
        let identifier = u32(guidance.a);
        let hashed = identifier * 747796405u + 2891336453u;
        return vec4<f32>(vec3<f32>(f32(hashed & 255u), f32((hashed >> 8u) & 255u), f32((hashed >> 16u) & 255u)) / 255.0, 1.0);`;
    default:
      return '';
  }
}

/** UV receivers supply world positions and normals; camera presentation is bypassed. */
export const RAY_TRACING_IRRADIANCE_SHADER = /* wgsl */ `
${RAY_TRACING_SCENE_SHADER}
@group(0) @binding(13) var receiverPositions: texture_2d<f32>;
@group(0) @binding(14) var receiverNormals: texture_2d<f32>;

@compute @workgroup_size(8, 8)
fn bakeIrradiance(@builtin(global_invocation_id) invocation: vec3u) {
  let pixel = invocation.xy;
  let dimensions = textureDimensions(receiverPositions);
  if (any(pixel >= dimensions)) { return; }
  let position = textureLoad(receiverPositions, vec2i(pixel), 0);
  if (position.w <= 0.0) { textureStore(outputImage, vec2i(pixel), vec4f(0.0)); return; }
  let normal = normalize(textureLoad(receiverNormals, vec2i(pixel), 0).xyz);
  let atlasWidth = select(dimensions.x, uniforms.imageRegion.z, uniforms.imageRegion.z > 0u);
  let atlasPixel = pixel + uniforms.imageRegion.xy;
  let atlasIndex = atlasPixel.x + atlasPixel.y * atlasWidth;
  let seed = uniforms.sampling.x ^ (atlasIndex * 1973u);
  let radial = fract(makeRandom(seed ^ 17u) + f32(uniforms.acceleration.w) * 0.754877666);
  let angle = 2.0 * PI * fract(makeRandom(seed ^ 101u) + f32(uniforms.acceleration.w) * 0.569840291);
  let reference = select(vec3f(0,0,1), vec3f(0,1,0), abs(normal.z) > 0.999);
  let tangent = normalize(cross(reference, normal));
  let direction = tangent * (sqrt(radial) * cos(angle)) + cross(normal,tangent) * (sqrt(radial) * sin(angle)) + normal * sqrt(1.0-radial);
  var ray = makeRay(position.xyz + normal * 0.002, direction);
  if (uniforms.visibility.y != 0u) {
    ray.coverageSeed = hashRaySample(seed ^ 0xa11faceu ^ (uniforms.acceleration.w * 26699u)) | 1u;
  }
  let hit = intersectScene(ray, RAY_INFINITY);
  var irradiance = vec3f(0.0);
  if (hit.distance < RAY_INFINITY) {
    irradiance = PI * evaluateDiffuseTransport(ray, hit, vec2u(atlasIndex - uniforms.imageRegion.x - uniforms.imageRegion.y * atlasWidth, 0u), 0u);
  }
  textureStore(outputImage, vec2i(pixel), vec4f(irradiance, position.w));
}
`;
