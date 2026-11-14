// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {RayTracingDebugView} from './ray-tracing-scene-capabilities';

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
  textureStore(outputMetadata, pixel, textureLoad(historyMetadata, pixel, 0));
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
};

struct RayHit {
  distance: f32,
  normal: vec3<f32>,
  primitiveIndex: u32,
  entering: bool,
  coordinates: vec2<f32>,
  secondaryCoordinates: vec2<f32>,
  triangleIndex: u32,
  footprint: f32,
};

struct PendingRayNode {
  nodeIndex: u32,
  entryDistance: f32,
};

struct HistoricalRaySample {
  color: vec3<f32>,
  sampleCount: f32,
  valid: bool,
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

fn makeRandom(seed: u32) -> f32 {
  var value = seed * 747796405u + 2891336453u;
  value = ((value >> ((value >> 28u) + 4u)) ^ value) * 277803737u;
  value = (value >> 22u) ^ value;
  return f32(value) / 4294967295.0;
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
  return Ray(origin, normalize(farPosition - origin));
}

fn makeCameraRayAtCoordinates(coordinates: vec2<f32>) -> Ray {
  if (uniforms.imageRegion.z > 0u) {
    return makeCameraRayAtFullCoordinates((coordinates * vec2<f32>(uniforms.displayPhase.xy)
      + vec2<f32>(uniforms.imageRegion.xy)) / vec2<f32>(uniforms.imageRegion.zw));
  }
  return makeCameraRayAtFullCoordinates(coordinates);
}

fn makeCameraRayAtOffset(pixel: vec2<u32>, offset: vec2<f32>) -> Ray {
  if (uniforms.imageRegion.z > 0u) {
    return makeCameraRayAtFullCoordinates((vec2<f32>(pixel + uniforms.imageRegion.xy) + offset)
      / vec2<f32>(uniforms.imageRegion.zw));
  }
  return makeCameraRayAtFullCoordinates(
    (vec2<f32>(pixel) + offset) / vec2<f32>(uniforms.dimensions.xy)
  );
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
  return makeCameraRayAtOffset(pixel, makeRadianceSampleOffset(pixel, sampleIndex));
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

fn intersectTriangle(ray: Ray, triangle: RayTriangle, maximumDistance: f32) -> vec3<f32> {
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

fn intersectPrimitive(ray: Ray, primitiveIndex: u32, maximumDistance: f32) -> RayHit {
  var closestHit = RayHit(maximumDistance, vec3<f32>(0.0), 0u, true, vec2<f32>(0.0), vec2<f32>(0.0), 0xffffffffu, 0.0);
  let primitive = primitives[primitiveIndex];
  let localOrigin = (primitive.inverseTransform * vec4<f32>(ray.origin, 1.0)).xyz;
  let localDirection = (primitive.inverseTransform * vec4<f32>(ray.direction, 0.0)).xyz;
  let localRay = Ray(localOrigin, localDirection);
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
      let candidate = RayHit(distance, worldNormal, primitiveIndex, dot(worldNormal, ray.direction) < 0.0, vec2<f32>(atan2(localNormal.z, localNormal.x) / (2.0 * PI) + 0.5, acos(clamp(localNormal.y, -1.0, 1.0)) / PI), vec2<f32>(0.0), 0xffffffffu, 0.0);
      if (isMaterialVisible(candidate)) { return candidate; }
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
            if (dot(localNormal, localDirection) > 0.0) {
              localNormal = -localNormal;
            }
            let worldNormal = normalize((transpose(primitive.inverseTransform) *
              vec4<f32>(localNormal, 0.0)).xyz);
            let candidate = RayHit(intersection.x, worldNormal, primitiveIndex, entering,
              vec2<f32>(triangle.firstPosition.w, triangle.firstNormal.w) * normalWeight +
              vec2<f32>(triangle.secondPosition.w, triangle.secondNormal.w) * intersection.y +
              vec2<f32>(triangle.thirdPosition.w, triangle.thirdNormal.w) * intersection.z,
              triangle.secondaryCoordinates[0].xy * normalWeight + triangle.secondaryCoordinates[0].zw * intersection.y + triangle.secondaryCoordinates[1].xy * intersection.z, triangleIndex, 0.0);
            if (isMaterialVisible(candidate)) { closestHit = candidate; }
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
  // Share masked traversal with primary rays, including UVs and both sphere interfaces.
  if (primitive.material.x >= 0.0) {
    return intersectPrimitive(ray, primitiveIndex, maximumDistance).distance < maximumDistance;
  }
  let localOrigin = (primitive.inverseTransform * vec4<f32>(ray.origin, 1.0)).xyz;
  let localDirection = (primitive.inverseTransform * vec4<f32>(ray.direction, 0.0)).xyz;
  let localRay = Ray(localOrigin, localDirection);
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
  var closestHit = RayHit(maximumDistance, vec3<f32>(0.0), 0u, true, vec2<f32>(0.0), vec2<f32>(0.0), 0xffffffffu, 0.0);
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

fn isMaterialVisible(hit: RayHit) -> bool {
  let primitive = primitives[hit.primitiveIndex];
  if (primitive.material.x < 0.0) { return true; }
  return getMaterialOpacity(hit) >= primitive.material.x;
}
fn getMaterialOpacity(hit: RayHit) -> f32 {
  var opacity = primitives[hit.primitiveIndex].baseColor.a;
  switch u32(primitives[hit.primitiveIndex].material.w) {
    /* MATERIAL_OPACITY_CASES */
    default: {}
  }
  return opacity;
}
fn getShadedPrimitive(hit: RayHit) -> RayPrimitive {
  var primitive = primitives[hit.primitiveIndex];
  switch u32(primitive.material.w) {
    /* MATERIAL_SURFACE_CASES */
    default: {}
  }
  return primitive;
}

// Derive the frame from world-space triangle edges and the sampled UV chart.
fn getTriangleTangentFrame(hit: RayHit, normal: vec3<f32>, uvTransform: mat3x3<f32>,
    secondary: bool) -> mat2x3<f32> {
  if (hit.triangleIndex == 0xffffffffu) { return mat2x3<f32>(); }
  let triangle = triangles[hit.triangleIndex];
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

  let transform = primitives[hit.primitiveIndex].transform;
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
  if (strength <= 0.0) { return isotropic; }
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
  if (lobe.alpha.x == lobe.alpha.y) { return isotropicDistribution; }
  let projected = vec2<f32>(dot(lobe.tangent, halfDirection), dot(lobe.bitangent, halfDirection)) / lobe.alpha;
  let denominator = dot(projected, projected) + normalHalf * normalHalf;
  return 1.0 / (PI * lobe.alpha.x * lobe.alpha.y * denominator * denominator);
}

fn getGGXVisibility(lobe: AnisotropicGGX, direction: vec3<f32>, normalCosine: f32,
    isotropicVisibility: f32) -> f32 {
  if (lobe.alpha.x == lobe.alpha.y) { return isotropicVisibility; }
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

// Charlie distribution with a compact visibility and base attenuation approximation.
fn applySheen(baseResponse: vec3<f32>, sheen: vec4<f32>, normalHalf: f32,
    normalView: f32, normalLight: f32) -> vec3<f32> {
  let color = clamp(sheen.rgb, vec3<f32>(0.0), vec3<f32>(1.0));
  let strength = max(color.r, max(color.g, color.b));
  if (strength <= 0.0 || normalLight <= 0.0) { return baseResponse; }
  let roughness = clamp(sheen.w, 0.04, 1.0);
  let exponent = 1.0 / (roughness * roughness);
  let halfSineSquared = max(1.0 - normalHalf * normalHalf, 0.0);
  let distribution = (2.0 + exponent) * pow(halfSineSquared, 0.5 * exponent) / (2.0 * PI);
  let visibility = 0.25 / max(normalLight + normalView - normalLight * normalView, 0.000001);
  let enteringCosine = min(normalLight, normalView);
  let baseWeight = 1.0 - strength * mix(0.5, 0.157, enteringCosine) * (1.0 - 0.5 * roughness);
  return baseResponse * baseWeight + color * (distribution * visibility * normalLight);
}

// Apply the coat's Fresnel attenuation and reflection using its own normal.
fn applyClearcoat(baseResponse: vec3<f32>, clearcoat: vec2<f32>, hit: RayHit,
    viewDirection: vec3<f32>, lightDirection: vec3<f32>,
    halfDirection: vec3<f32>, viewHalf: f32) -> vec3<f32> {
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
  let fresnel = strength * (0.04 + 0.96 * pow(clamp(1.0 - viewHalf, 0.0, 1.0), 5.0));
  let coatResponse = fresnel * distribution * lightVisibility * viewVisibility / (4.0 * normalView);
  return baseResponse * (1.0 - fresnel) + vec3<f32>(coatResponse);
}

fn evaluateDirectLighting(ray: Ray, hit: RayHit, includeEmission: bool) -> vec3<f32> {
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
  let diffuse = baseColor * (vec3<f32>(1.0) - dielectricReflectance) *
    (1.0 - metallic) / PI;
  let normalView = clamp(abs(dot(normal, viewDirection)), 0.001, 1.0);
  let opaqueWeight = select(1.0, 1.0 - clamp(primitive.material.y, 0.0, 1.0) * (1.0 - metallic), uniforms.sampling.w > 0u && uniforms.sampling.y > 0u);
  var result = select(vec3<f32>(0.0), primitive.emissive.rgb, includeEmission);
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
      result += baseColor * lightColor * opaqueWeight * occlusion;
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

    let normalLight = max(dot(normal, lightDirection), 0.0);
    if ((normalLight <= 0.0 && primitive.clearcoatOcclusion.x <= 0.0) ||
        dot(faceNormal, lightDirection) <= 0.0 || attenuation <= 0.0) {
      continue;
    }
    if (uniforms.settings.w > 0.5) {
      let shadowRay = Ray(hitPosition + faceNormal * 0.002, lightDirection);
      let shadowDistance = select(lightDistance - 0.003, RAY_INFINITY, lightType == 1u);
      if (intersectsScene(shadowRay, shadowDistance)) {
        continue;
      }
    }

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
      primitive.sheen, normalHalf, normalView, normalLight);
    let response = applyClearcoat(layeredResponse,
      primitive.clearcoatOcclusion.xy, hit, viewDirection, lightDirection, halfDirection, viewHalf);
    result += response * lightColor *
      attenuation * lightSampleWeight * opaqueWeight;
  }

  if (uniforms.fog.w > 0.0) {
    let visibility = exp(-uniforms.fog.w * hit.distance);
    result = mix(uniforms.fog.rgb, result, visibility);
  }
  return result;
}

fn rejectHistoricalRaySample() -> HistoricalRaySample {
  return HistoricalRaySample(vec3<f32>(0.0), 0.0, false);
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

fn clampHistoricalRayColor(
  historyPixel: vec2<i32>,
  historicalColor: vec3<f32>,
  currentColor: vec3<f32>
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
      let neighborhoodColor = textureLoad(historyImage, neighborhoodPixel, 0);
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
  previousDistance: f32
) -> HistoricalRaySample {
  let historicalMetadata = textureLoad(historyMetadata, historyPixel, 0);
  if (!isHistoricalRayMetadataValid(historicalMetadata, hit, previousDistance)) {
    return rejectHistoricalRaySample();
  }

  let historicalColor = textureLoad(historyImage, historyPixel, 0);
  if (historicalColor.a <= 0.0) {
    return rejectHistoricalRaySample();
  }
  return HistoricalRaySample(
    historicalColor.rgb,
    min(historicalColor.a, getHistorySampleLimit()),
    true
  );
}

fn getHistoricalRaySample(
  pixel: vec2<u32>,
  ray: Ray,
  hit: RayHit,
  currentColor: vec3<f32>
) -> HistoricalRaySample {
  if (uniforms.settings.y <= 0.0) {
    return rejectHistoricalRaySample();
  }

  // Unchanged static progressive samples must average without per-sample clipping.
  if (uniforms.temporal.w <= 0.5) {
    let previous = textureLoad(historyImage, vec2<i32>(pixel), 0);
    return HistoricalRaySample(previous.rgb, previous.a, previous.a > 0.0);
  }

  var historySamplePosition = vec2<f32>(pixel);
  var previousDistance = distance(
    ray.origin + ray.direction * min(hit.distance, 65504.0),
    uniforms.cameraPosition.xyz
  );
  if (hit.distance < RAY_INFINITY && uniforms.temporal.w > 0.5) {
    let primitive = primitives[hit.primitiveIndex];
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
  var historicalSampleCount = 0.0;
  var totalWeight = 0.0;
  if (topLeftWeight > 0.0) {
    let topLeftSample = loadHistoricalRaySample(firstHistoryPixel, hit, previousDistance);
    if (topLeftSample.valid) {
      historicalColor += topLeftSample.color * topLeftWeight;
      historicalSampleCount += topLeftSample.sampleCount * topLeftWeight;
      totalWeight += topLeftWeight;
    }
  }
  if (topRightWeight > 0.0) {
    let topRightSample = loadHistoricalRaySample(
      vec2<i32>(secondHistoryPixel.x, firstHistoryPixel.y),
      hit,
      previousDistance
    );
    if (topRightSample.valid) {
      historicalColor += topRightSample.color * topRightWeight;
      historicalSampleCount += topRightSample.sampleCount * topRightWeight;
      totalWeight += topRightWeight;
    }
  }
  if (bottomLeftWeight > 0.0) {
    let bottomLeftSample = loadHistoricalRaySample(
      vec2<i32>(firstHistoryPixel.x, secondHistoryPixel.y),
      hit,
      previousDistance
    );
    if (bottomLeftSample.valid) {
      historicalColor += bottomLeftSample.color * bottomLeftWeight;
      historicalSampleCount += bottomLeftSample.sampleCount * bottomLeftWeight;
      totalWeight += bottomLeftWeight;
    }
  }
  if (bottomRightWeight > 0.0) {
    let bottomRightSample = loadHistoricalRaySample(secondHistoryPixel, hit, previousDistance);
    if (bottomRightSample.valid) {
      historicalColor += bottomRightSample.color * bottomRightWeight;
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
    clampHistoricalRayColor(nearestHistoryPixel, historicalColor / totalWeight, currentColor),
    min(historicalSampleCount / totalWeight, getHistorySampleLimit()),
    true
  );
}


struct RayMaterialSample {
  direction: vec3<f32>,
  weight: vec3<f32>,
  delta: bool,
  crossesInterface: bool,
};

// Sample a cosine/GGX-NDF mixture, then evaluate both lobes with the combined PDF.
// Specular half-vector density D(N.H)*(N.H) becomes direction density / (4*V.H).
fn samplePBRMaterial(ray: Ray, hit: RayHit, randomSeed: u32) -> RayMaterialSample {
  let primitive = getShadedPrimitive(hit);
  let baseColor = clamp(primitive.baseColor.rgb, vec3<f32>(0.0), vec3<f32>(1.0));
  let metallic = clamp(primitive.emissive.w, 0.0, 1.0);
  let transmission = clamp(primitive.material.y, 0.0, 1.0) * (1.0 - metallic);
  if (makeRandom(randomSeed ^ 541u) < transmission) {
    let normal = faceForward(hit.normal, ray.direction, hit.normal);
    let index = max(primitive.material.z, 1.0);
    let ratio = select(index, 1.0 / index, hit.entering);
    let cosineIncident = clamp(dot(-ray.direction, normal), 0.0, 1.0);
    let sineTransmittedSquared = ratio * ratio * (1.0 - cosineIncident * cosineIncident);
    if (sineTransmittedSquared >= 1.0) {
      return RayMaterialSample(reflect(ray.direction, normal), vec3<f32>(1.0), true, false);
    }
    let cosineTransmitted = sqrt(1.0 - sineTransmittedSquared);
    let perpendicular = (ratio * cosineIncident - cosineTransmitted) /
      max(ratio * cosineIncident + cosineTransmitted, 0.000001);
    let parallel = (cosineIncident - ratio * cosineTransmitted) /
      max(cosineIncident + ratio * cosineTransmitted, 0.000001);
    let fresnel = 0.5 * (perpendicular * perpendicular + parallel * parallel);
    if (makeRandom(randomSeed ^ 947u) < fresnel) {
      return RayMaterialSample(reflect(ray.direction, normal), vec3<f32>(1.0), true, false);
    }
    return RayMaterialSample(refract(ray.direction, normal, ratio), baseColor * ratio * ratio, true, true);
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
  let anisotropic = getAnisotropicGGX(hit, primitive, normal, alphaRoughness);
  var direction: vec3<f32>;
  if (specularProbability >= 1.0 || makeRandom(randomSeed ^ 263u) < specularProbability) {
    let normalHalf = sqrt((1.0 - radialSample) /
      ((1.0 - radialSample) + alphaSquared * radialSample));
    let tangentHalf = sqrt(max(1.0 - normalHalf * normalHalf, 0.0));
    var halfDirection = tangent * (tangentHalf * cos(angle)) +
      bitangent * (tangentHalf * sin(angle)) + normal * normalHalf;
    if (anisotropic.alpha.x != anisotropic.alpha.y) {
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
    direction = normalize(tangent * (radius * cos(angle)) + bitangent * (radius * sin(angle)) +
      normal * sqrt(max(1.0 - radialSample, 0.0)));
  }
  let normalLight = dot(normal, direction);
  if (normalLight <= 0.0 || dot(getFaceNormal(hit, ray), direction) <= 0.0) {
    return RayMaterialSample(direction, vec3<f32>(0.0), false, false);
  }
  let halfDirection = normalize(viewDirection + direction);
  let normalHalf = max(dot(normal, halfDirection), 0.0);
  let viewHalf = max(dot(viewDirection, halfDirection), 0.000001);
  let normalHalfSquared = normalHalf * normalHalf;
  let distributionDenominator = (1.0 - normalHalfSquared) + alphaSquared * normalHalfSquared;
  let distribution = alphaSquared / (PI * distributionDenominator * distributionDenominator);
  let baseDistribution = getGGXDistribution(anisotropic, halfDirection, normalHalf, distribution);
  let specularDensity = baseDistribution * normalHalf / (4.0 * viewHalf);
  let sampleDensity = specularProbability * specularDensity +
    (1.0 - specularProbability) * normalLight / PI;
  if (sampleDensity <= 0.0) {
    return RayMaterialSample(direction, vec3<f32>(0.0), false, false);
  }
  return RayMaterialSample(direction, evaluatePBRResponse(ray, hit, direction) / sampleDensity, false, false);
}

fn evaluatePBRResponse(ray: Ray, hit: RayHit, direction: vec3<f32>) -> vec3<f32> {
  let primitive = getShadedPrimitive(hit);
  let baseColor = clamp(primitive.baseColor.rgb, vec3<f32>(0.0), vec3<f32>(1.0));
  let metallic = clamp(primitive.emissive.w, 0.0, 1.0);
  let roughness = clamp(primitive.properties.x, 0.04, 1.0);
  let alphaRoughness = roughness * roughness;
  let alphaSquared = alphaRoughness * alphaRoughness;
  let shadingNormal = getShadingNormal(hit);
  let normal = select(shadingNormal, -shadingNormal, dot(hit.normal, ray.direction) > 0.0);
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
  let diffuse = (vec3<f32>(1.0) - fresnel) * baseColor * (vec3<f32>(1.0) - dielectricReflectance) * (1.0 - metallic) * normalLight / PI;
  let anisotropic = getAnisotropicGGX(hit, primitive, normal, alphaRoughness);
  let baseDistribution = getGGXDistribution(anisotropic, halfDirection, normalHalf, distribution);
  let baseVisibility = getGGXVisibility(anisotropic, direction, normalLight, lightVisibility) *
    getGGXVisibility(anisotropic, viewDirection, normalView, viewVisibility);
  let specular = fresnel * baseVisibility * baseDistribution / (4.0 * normalView);
  let layeredResponse = applySheen(diffuse + specular, primitive.sheen, normalHalf, normalView, normalLight);
  return applyClearcoat(layeredResponse, primitive.clearcoatOcclusion.xy, hit, viewDirection, direction, halfDirection, viewHalf);
}

// CDF emitter selection, uniform triangle selection and conditional area sampling. Visibility rejects far sides of spheres.
// The sphere Jacobian supports nonuniform scales and general affine instance transforms.
fn evaluateEmitterLighting(ray: Ray, hit: RayHit, randomSeed: u32) -> vec3<f32> {
  let emitterCount = uniforms.emitters.x;
  if (uniforms.emitters.y == 0u || emitterCount == 0u) { return vec3<f32>(0.0); }
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
    let triangle = triangles[u32(emitter.properties.z) + triangleIndex];
    let firstPosition = (emitter.transform * vec4<f32>(triangle.firstPosition.xyz, 1.0)).xyz;
    let secondPosition = (emitter.transform * vec4<f32>(triangle.secondPosition.xyz, 1.0)).xyz;
    let thirdPosition = (emitter.transform * vec4<f32>(triangle.thirdPosition.xyz, 1.0)).xyz;
    let rootSample = sqrt(firstSample);
    let weights = vec3<f32>(1.0 - rootSample, rootSample * (1.0 - secondSample), rootSample * secondSample);
    emitterCoordinates = vec2<f32>(triangle.firstPosition.w, triangle.firstNormal.w) * weights.x +
      vec2<f32>(triangle.secondPosition.w, triangle.secondNormal.w) * weights.y +
      vec2<f32>(triangle.thirdPosition.w, triangle.thirdNormal.w) * weights.z;
    emitterSecondaryCoordinates = triangle.secondaryCoordinates[0].xy * weights.x +
      triangle.secondaryCoordinates[0].zw * weights.y + triangle.secondaryCoordinates[1].xy * weights.z;
    lightPosition = firstPosition * (1.0 - rootSample) + secondPosition * (rootSample * (1.0 - secondSample)) + thirdPosition * (rootSample * secondSample);
    let areaNormal = cross(secondPosition - firstPosition, thirdPosition - firstPosition);
    let twiceArea = length(areaNormal);
    if (twiceArea <= 0.00000001) { return vec3<f32>(0.0); }
    lightNormal = areaNormal / twiceArea;
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
  if ((normalLight <= 0.0 && uniforms.sampling.w == 0u) || dot(getFaceNormal(hit, ray), direction) <= 0.0) { return vec3<f32>(0.0); }
  let shadowOrigin = position + getFaceNormal(hit, ray) * 0.002;
  let shadowOffset = lightPosition - shadowOrigin;
  let shadowDistance = length(shadowOffset);
  if (uniforms.settings.w > 0.5 && shadowDistance > RAY_EPSILON && intersectsScene(Ray(shadowOrigin, shadowOffset / shadowDistance), shadowDistance - 0.002)) { return vec3<f32>(0.0); }
  let receiver = getShadedPrimitive(hit);
  var response = clamp(receiver.baseColor.rgb, vec3<f32>(0.0), vec3<f32>(1.0)) * 0.96 *
    (1.0 - clamp(receiver.emissive.w, 0.0, 1.0)) * normalLight / PI;
  if (uniforms.sampling.w > 0u) {
    response = evaluatePBRResponse(ray, hit, direction) * select(1.0,
      1.0 - clamp(receiver.material.y, 0.0, 1.0) * (1.0 - clamp(receiver.emissive.w, 0.0, 1.0)),
      uniforms.sampling.y > 0u);
  }
  let visibility = exp(-max(uniforms.fog.w, 0.0) * hit.distance);
  let emitterHit = RayHit(0.0, lightNormal, primitiveIndex, true, emitterCoordinates, emitterSecondaryCoordinates, 0xffffffffu, 0.0);
  if (!isMaterialVisible(emitterHit)) { return vec3<f32>(0.0); }
  let shadedEmitter = getShadedPrimitive(emitterHit);
  return response * shadedEmitter.emissive.rgb * abs(dot(lightNormal, -direction)) * inverseAreaDensity / distanceSquared * visibility;
}

// Explicit connections replace secondary emission gathering to avoid double counting.
// Smooth dielectric delta paths gather secondary emission; opaque lobes use explicit connections.
fn evaluateSecondaryLighting(ray: Ray, hit: RayHit) -> vec3<f32> {
  return evaluateDirectLighting(ray, hit, uniforms.emitters.y == 0u);
}

fn evaluatePBRTransport(primaryRay: Ray, primaryHit: RayHit, pixel: vec2<u32>, sampleIndex: u32) -> vec3<f32> {
  var ray = primaryRay;
  var hit = primaryHit;
  var radiance = evaluateDirectLighting(ray, hit, true);
  var throughput = vec3<f32>(1.0);
  var dielectricOnly = true;
  var medium = 0xffffffffu;
  let pixelIndex = getSamplingPixelIndex(pixel);
  let sequenceIndex = uniforms.acceleration.w * 16u + sampleIndex;
  let pathSeed = uniforms.sampling.x ^ (pixelIndex * 1973u) ^ (sequenceIndex * 26699u);
  radiance += evaluateEmitterLighting(ray, hit, pathSeed);
  for (var bounceIndex = 0u; bounceIndex < min(uniforms.sampling.y, 8u); bounceIndex++) {
    let sample = samplePBRMaterial(ray, hit, pathSeed ^ (bounceIndex * 104729u));
    dielectricOnly = dielectricOnly && sample.delta;
    throughput *= sample.weight;
    if (max(throughput.r, max(throughput.g, throughput.b)) <= 0.0) { break; }
    let normal = select(getFaceNormal(hit, ray), faceForward(hit.normal, ray.direction, hit.normal), sample.delta);
    let position = ray.origin + ray.direction * hit.distance;
    if (sample.crossesInterface) {
      if (hit.entering && medium == 0xffffffffu) {
        let attenuation = primitives[hit.primitiveIndex].attenuation;
        if (attenuation.w > 0.0 && any(attenuation.rgb < vec3<f32>(1.0))) {
          medium = hit.primitiveIndex;
        }
      } else if (!hit.entering) {
        // A closed shell can span multiple scene surfaces. Nested media are unsupported.
        medium = 0xffffffffu;
      }
    }
    ray = Ray(position + normal * select(-0.002, 0.002, dot(normal, sample.direction) >= 0.0), sample.direction);
    hit = intersectScene(ray, RAY_INFINITY);
    if (hit.distance >= RAY_INFINITY) {
      // A camera backdrop remains visible through smooth dielectric paths without
      // turning it into diffuse environment illumination.
      if (dielectricOnly && medium == 0xffffffffu) { radiance += throughput * uniforms.background.rgb; }
      break;
    }
    if (medium != 0xffffffffu) {
      let attenuation = primitives[medium].attenuation;
      let segmentLength = length(ray.origin + ray.direction * hit.distance - position);
      throughput *= pow(clamp(attenuation.rgb, vec3<f32>(0.0), vec3<f32>(1.0)),
        vec3<f32>(segmentLength / attenuation.w));
    }
    radiance += throughput * (evaluateDirectLighting(ray, hit, sample.delta || uniforms.emitters.y == 0u) + evaluateEmitterLighting(ray, hit, pathSeed ^ ((bounceIndex + 1u) * 1987u)));
  }
  return radiance;
}

// Cosine-weighted Lambertian transport. The BRDF cosine and sampling PDF cancel.
fn evaluateDiffuseTransport(primaryRay: Ray, primaryHit: RayHit, pixel: vec2<u32>, sampleIndex: u32) -> vec3<f32> {
  var ray = primaryRay;
  var hit = primaryHit;
  var radiance = evaluateDirectLighting(ray, hit, true);
  var throughput = vec3<f32>(1.0);
  let pixelIndex = getSamplingPixelIndex(pixel);
  let sequenceIndex = uniforms.acceleration.w * 16u + sampleIndex;
  let pathSeed = uniforms.sampling.x ^ (pixelIndex * 1973u) ^ (sequenceIndex * 26699u);
  radiance += evaluateEmitterLighting(ray, hit, pathSeed);
  for (var bounceIndex = 0u; bounceIndex < min(uniforms.sampling.y, 8u); bounceIndex++) {
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
    let position = ray.origin + ray.direction * hit.distance;
    let surfaceNormal = getFaceNormal(hit, ray);
    if (dot(surfaceNormal, direction) <= 0.0) { break; }
    ray = Ray(position + surfaceNormal * 0.002, normalize(direction));
    hit = intersectScene(ray, RAY_INFINITY);
    if (hit.distance >= RAY_INFINITY) {
      break;
    }
    radiance += throughput * (evaluateSecondaryLighting(ray, hit) + evaluateEmitterLighting(ray, hit, pathSeed ^ ((bounceIndex + 1u) * 1987u)));
  }
  return radiance;
}

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let phaseCount = max(uniforms.displayPhase.w, 1u);
  let phaseOffset = (uniforms.displayPhase.z + invocation.y) % phaseCount;
  let pixel = vec2<u32>(invocation.x * phaseCount + phaseOffset, invocation.y);
  if (pixel.x >= uniforms.dimensions.x || pixel.y >= uniforms.dimensions.y) {
    return;
  }

  let sampleCount = clamp(u32(uniforms.settings.z), 1u, 16u);
  let guideRay = makeGuideCameraRay(pixel);
  let guideHit = intersectScene(guideRay, RAY_INFINITY);
  var accumulatedColor = vec3<f32>(0.0);
  for (var sampleIndex = 0u; sampleIndex < sampleCount; sampleIndex++) {
    let sampleOffset = makeRadianceSampleOffset(pixel, sampleIndex);
    let ray = makeCameraRay(pixel, sampleIndex);
    var hit = intersectScene(ray, RAY_INFINITY);
    var color = uniforms.background.rgb;
    if (hit.distance < RAY_INFINITY) {
      if (hit.triangleIndex != 0xffffffffu) {
        /* MATERIAL_PRIMARY_FOOTPRINT */
      }
      if (uniforms.sampling.w > 0u) {
        color = evaluatePBRTransport(ray, hit, pixel, sampleIndex);
      } else {
        color = evaluateDiffuseTransport(ray, hit, pixel, sampleIndex);
      }
    }
    accumulatedColor += color;
  }

  var color = accumulatedColor / f32(sampleCount) * uniforms.settings.x;
  let historicalSample = getHistoricalRaySample(pixel, guideRay, guideHit, color);
  var totalSampleCount = min(f32(sampleCount), getHistorySampleLimit());
  if (historicalSample.valid) {
    totalSampleCount = min(
      historicalSample.sampleCount + f32(sampleCount),
      getHistorySampleLimit()
    );
    let currentWeight = min(f32(sampleCount) / totalSampleCount, 1.0);
    color = mix(historicalSample.color, color, currentWeight);
  }
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
  textureStore(outputImage, vec2<i32>(pixel), vec4<f32>(color, totalSampleCount));
  textureStore(outputMetadata, vec2<i32>(pixel), metadata);
}
`;

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
  debugView?: RayTracingDebugView;
};

/** Resolves retained ray radiance with attachment-aware, canonical PBR color management. */
export function getRayTracingScenePresentationShader(
  options: RayTracingPresentationOptions | boolean
): string {
  const toneMapMode = typeof options === 'boolean' ? (options ? 0 : 2) : options.toneMapMode;
  const outputEncoding = typeof options === 'boolean' ? (options ? 0 : 1) : options.outputEncoding;

  const denoiseRadius = typeof options === 'boolean' ? 0 : (options.denoiseRadius ?? 0);
  const debugView = typeof options === 'boolean' ? 'color' : (options.debugView ?? 'color');
  const useMetadata = denoiseRadius > 0 || debugView !== 'color';

  return /* wgsl */ `
@group(0) @binding(0) var image: texture_2d<f32>;
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
  let centerColor = textureLoad(image, pixel, 0).rgb;
  if (center.a <= 0.0 || center.a >= 65504.0) { return centerColor; }
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
      let weight = exp(-0.5 * f32(dot(offset, offset))) * pow(max(normalAgreement, 0.0), 16.0)
        * exp(-100.0 * depthDifference);
      color += textureLoad(image, neighborPixel, 0).rgb * weight;
      totalWeight += weight;
    }
  }
  return color / max(totalWeight, 0.0001);
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
  let ray = Ray(position.xyz + normal * 0.002, direction);
  let hit = intersectScene(ray, RAY_INFINITY);
  var irradiance = vec3f(0.0);
  if (hit.distance < RAY_INFINITY) {
    irradiance = PI * evaluateDiffuseTransport(ray, hit, vec2u(atlasIndex - uniforms.imageRegion.x - uniforms.imageRegion.y * atlasWidth, 0u), 0u);
  }
  textureStore(outputImage, vec2i(pixel), vec4f(irradiance, position.w));
}
`;
