// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

const RAY_TRACING_SCENE_TYPES = /* wgsl */ `
struct RayTracingUniforms {
  inverseViewProjection: mat4x4<f32>,
  cameraPosition: vec4<f32>,
  background: vec4<f32>,
  dimensions: vec4<u32>,
  settings: vec4<f32>,
  fog: vec4<f32>,
  acceleration: vec4<u32>,
};

struct RayPrimitive {
  transform: mat4x4<f32>,
  inverseTransform: mat4x4<f32>,
  baseColor: vec4<f32>,
  emissive: vec4<f32>,
  properties: vec4<f32>,
  bounds: vec4<f32>,
};
`;

/** Publishes conservative world-space instance bounds for the graph-owned GPU BVH. */
export const RAY_TRACING_BOUNDS_SHADER = /* wgsl */ `
${RAY_TRACING_SCENE_TYPES}

@group(0) @binding(0) var<uniform> uniforms: RayTracingUniforms;
@group(0) @binding(1) var<storage, read> primitives: array<RayPrimitive>;
@group(0) @binding(2) var<storage, read_write> primitiveMinima: array<f32>;
@group(0) @binding(3) var<storage, read_write> primitiveMaxima: array<f32>;

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
  let center = (primitive.transform * vec4<f32>(primitive.bounds.xyz, 1.0)).xyz;
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
  let extent = vec3<f32>(length(firstRow), length(secondRow), length(thirdRow)) *
    max(primitive.bounds.w, 0.0);
  let minimum = center - extent;
  let maximum = center + extent;
  for (var axis = 0u; axis < 3u; axis++) {
    primitiveMinima[componentIndex + axis] = minimum[axis];
    primitiveMaxima[componentIndex + axis] = maximum[axis];
  }
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
};

@group(0) @binding(0) var<uniform> uniforms: RayTracingUniforms;
@group(0) @binding(1) var<storage, read> primitives: array<RayPrimitive>;
@group(0) @binding(2) var<storage, read> triangles: array<RayTriangle>;
@group(0) @binding(3) var<storage, read> lights: array<RayLight>;
@group(0) @binding(4) var<storage, read> nodeMinima: array<f32>;
@group(0) @binding(5) var<storage, read> nodeMaxima: array<f32>;
@group(0) @binding(6) var historyImage: texture_2d<f32>;
@group(0) @binding(7) var outputImage: texture_storage_2d<rgba16float, write>;

const RAY_EPSILON = 0.0005;
const RAY_INFINITY = 1.0e20;
const PI = 3.141592653589793;
const BVH_STACK_CAPACITY = 32u;

fn makeRandom(seed: u32) -> f32 {
  var value = seed * 747796405u + 2891336453u;
  value = ((value >> ((value >> 28u) + 4u)) ^ value) * 277803737u;
  value = (value >> 22u) ^ value;
  return f32(value) / 4294967295.0;
}

fn makeCameraRay(pixel: vec2<u32>, sampleIndex: u32) -> Ray {
  let frameIndex = u32(uniforms.settings.y);
  let pixelIndex = pixel.y * uniforms.dimensions.x + pixel.x;
  let seed = pixelIndex * 1973u + frameIndex * 9277u + sampleIndex * 26699u + 17u;
  let offset = vec2<f32>(makeRandom(seed), makeRandom(seed + 101u));
  let coordinates = (vec2<f32>(pixel) + offset) / vec2<f32>(uniforms.dimensions.xy);
  let clipCoordinates = vec2<f32>(coordinates.x * 2.0 - 1.0, 1.0 - coordinates.y * 2.0);
  let nearPoint = uniforms.inverseViewProjection * vec4<f32>(clipCoordinates, -1.0, 1.0);
  let farPoint = uniforms.inverseViewProjection * vec4<f32>(clipCoordinates, 1.0, 1.0);
  let nearPosition = nearPoint.xyz / nearPoint.w;
  let farPosition = farPoint.xyz / farPoint.w;
  let orthographic = uniforms.cameraPosition.w > 0.5;
  let origin = select(uniforms.cameraPosition.xyz, nearPosition, orthographic);
  return Ray(origin, normalize(farPosition - origin));
}

fn intersectsBounds(ray: Ray, center: vec3<f32>, radius: f32, maximumDistance: f32) -> bool {
  let relativeOrigin = ray.origin - center;
  let directionLength = dot(ray.direction, ray.direction);
  let halfProjection = dot(relativeOrigin, ray.direction);
  let discriminant = halfProjection * halfProjection -
    directionLength * (dot(relativeOrigin, relativeOrigin) - radius * radius);
  if (discriminant < 0.0) {
    return false;
  }
  let root = sqrt(discriminant);
  return (-halfProjection + root) / directionLength > RAY_EPSILON &&
    (-halfProjection - root) / directionLength < maximumDistance;
}

fn intersectSphere(ray: Ray, radius: f32, maximumDistance: f32) -> f32 {
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
  let distance = select(secondDistance, firstDistance, firstDistance > RAY_EPSILON);
  return select(RAY_INFINITY, distance, distance > RAY_EPSILON && distance < maximumDistance);
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

fn intersectNodeBounds(ray: Ray, nodeIndex: u32, maximumDistance: f32) -> f32 {
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
      let firstDistance = (minimum - origin) / direction;
      let secondDistance = (maximum - origin) / direction;
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
  var closestHit = RayHit(maximumDistance, vec3<f32>(0.0), 0u);
  let primitive = primitives[primitiveIndex];
  let localOrigin = (primitive.inverseTransform * vec4<f32>(ray.origin, 1.0)).xyz;
  let localDirection = (primitive.inverseTransform * vec4<f32>(ray.direction, 0.0)).xyz;
  let localRay = Ray(localOrigin, localDirection);
  if (!intersectsBounds(localRay, primitive.bounds.xyz, primitive.bounds.w, closestHit.distance)) {
    return closestHit;
  }

  let sphereRadius = primitive.properties.y;
  if (sphereRadius > 0.0) {
    let distance = intersectSphere(localRay, sphereRadius, closestHit.distance);
    if (distance < closestHit.distance) {
      let localNormal = normalize(localOrigin + localDirection * distance);
      let worldNormal = normalize((transpose(primitive.inverseTransform) *
        vec4<f32>(localNormal, 0.0)).xyz);
      closestHit = RayHit(distance, worldNormal, primitiveIndex);
    }
    return closestHit;
  }

  let triangleStart = u32(primitive.properties.z);
  let triangleEnd = triangleStart + u32(primitive.properties.w);
  for (var triangleIndex = triangleStart; triangleIndex < triangleEnd; triangleIndex++) {
    let triangle = triangles[triangleIndex];
    let intersection = intersectTriangle(localRay, triangle, closestHit.distance);
    if (intersection.x < closestHit.distance) {
      let normalWeight = 1.0 - intersection.y - intersection.z;
      var localNormal = normalize(triangle.firstNormal.xyz * normalWeight +
        triangle.secondNormal.xyz * intersection.y +
        triangle.thirdNormal.xyz * intersection.z);
      if (dot(localNormal, localDirection) > 0.0) {
        localNormal = -localNormal;
      }
      let worldNormal = normalize((transpose(primitive.inverseTransform) *
        vec4<f32>(localNormal, 0.0)).xyz);
      closestHit = RayHit(intersection.x, worldNormal, primitiveIndex);
    }
  }
  return closestHit;
}

fn intersectsPrimitive(ray: Ray, primitiveIndex: u32, maximumDistance: f32) -> bool {
  let primitive = primitives[primitiveIndex];
  let localOrigin = (primitive.inverseTransform * vec4<f32>(ray.origin, 1.0)).xyz;
  let localDirection = (primitive.inverseTransform * vec4<f32>(ray.direction, 0.0)).xyz;
  let localRay = Ray(localOrigin, localDirection);
  if (!intersectsBounds(localRay, primitive.bounds.xyz, primitive.bounds.w, maximumDistance)) {
    return false;
  }

  let sphereRadius = primitive.properties.y;
  if (sphereRadius > 0.0) {
    return intersectSphere(localRay, sphereRadius, maximumDistance) < maximumDistance;
  }

  let triangleStart = u32(primitive.properties.z);
  let triangleEnd = triangleStart + u32(primitive.properties.w);
  for (var triangleIndex = triangleStart; triangleIndex < triangleEnd; triangleIndex++) {
    if (intersectTriangle(localRay, triangles[triangleIndex], maximumDistance).x < maximumDistance) {
      return true;
    }
  }
  return false;
}

fn intersectScene(ray: Ray, maximumDistance: f32) -> RayHit {
  var closestHit = RayHit(maximumDistance, vec3<f32>(0.0), 0u);
  if (uniforms.dimensions.z == 0u) {
    return closestHit;
  }

  var pendingNodes: array<u32, BVH_STACK_CAPACITY>;
  var pendingCount = 1u;
  pendingNodes[0] = 0u;

  while (pendingCount > 0u) {
    pendingCount--;
    let nodeIndex = pendingNodes[pendingCount];
    if (intersectNodeBounds(ray, nodeIndex, closestHit.distance) >= closestHit.distance) {
      continue;
    }

    if (nodeIndex >= uniforms.acceleration.x) {
      let primitiveIndex = nodeIndex - uniforms.acceleration.x;
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
    let leftDistance = intersectNodeBounds(ray, leftNode, closestHit.distance);
    let rightDistance = intersectNodeBounds(ray, rightNode, closestHit.distance);
    let leftFirst = leftDistance <= rightDistance;
    let nearerNode = select(rightNode, leftNode, leftFirst);
    let fartherNode = select(leftNode, rightNode, leftFirst);
    let nearerDistance = min(leftDistance, rightDistance);
    let fartherDistance = max(leftDistance, rightDistance);

    if (fartherDistance < closestHit.distance) {
      pendingNodes[pendingCount] = fartherNode;
      pendingCount++;
    }
    if (nearerDistance < closestHit.distance) {
      pendingNodes[pendingCount] = nearerNode;
      pendingCount++;
    }
  }
  return closestHit;
}

fn intersectsScene(ray: Ray, maximumDistance: f32) -> bool {
  if (uniforms.dimensions.z == 0u || maximumDistance <= RAY_EPSILON) {
    return false;
  }

  var pendingNodes: array<u32, BVH_STACK_CAPACITY>;
  var pendingCount = 1u;
  pendingNodes[0] = 0u;

  while (pendingCount > 0u) {
    pendingCount--;
    let nodeIndex = pendingNodes[pendingCount];
    if (intersectNodeBounds(ray, nodeIndex, maximumDistance) >= maximumDistance) {
      continue;
    }

    if (nodeIndex >= uniforms.acceleration.x) {
      let primitiveIndex = nodeIndex - uniforms.acceleration.x;
      if (primitiveIndex < uniforms.dimensions.z &&
          intersectsPrimitive(ray, primitiveIndex, maximumDistance)) {
        return true;
      }
      continue;
    }

    let leftNode = nodeIndex * 2u + 1u;
    let rightNode = leftNode + 1u;
    let leftDistance = intersectNodeBounds(ray, leftNode, maximumDistance);
    let rightDistance = intersectNodeBounds(ray, rightNode, maximumDistance);
    let leftFirst = leftDistance <= rightDistance;
    let nearerNode = select(rightNode, leftNode, leftFirst);
    let fartherNode = select(leftNode, rightNode, leftFirst);
    let nearerDistance = min(leftDistance, rightDistance);
    let fartherDistance = max(leftDistance, rightDistance);

    if (fartherDistance < maximumDistance) {
      pendingNodes[pendingCount] = fartherNode;
      pendingCount++;
    }
    if (nearerDistance < maximumDistance) {
      pendingNodes[pendingCount] = nearerNode;
      pendingCount++;
    }
  }
  return false;
}

fn evaluateDirectLighting(ray: Ray, hit: RayHit) -> vec3<f32> {
  let primitive = primitives[hit.primitiveIndex];
  let hitPosition = ray.origin + ray.direction * hit.distance;
  let normal = hit.normal;
  let viewDirection = -ray.direction;
  let baseColor = primitive.baseColor.rgb;
  let metallic = clamp(primitive.emissive.w, 0.0, 1.0);
  let roughness = clamp(primitive.properties.x, 0.04, 1.0);
  let reflectance = mix(vec3<f32>(0.04), baseColor, metallic);
  var result = primitive.emissive.rgb;

  for (var lightIndex = 0u; lightIndex < uniforms.dimensions.w; lightIndex++) {
    let light = lights[lightIndex];
    let lightType = u32(light.directionType.w);
    let lightColor = light.colorIntensity.rgb * light.colorIntensity.w;
    if (lightType == 0u) {
      result += baseColor * lightColor;
      continue;
    }

    var lightDirection = normalize(-light.directionType.xyz);
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
    }

    let normalLight = max(dot(normal, lightDirection), 0.0);
    if (normalLight <= 0.0 || attenuation <= 0.0) {
      continue;
    }
    if (uniforms.settings.w > 0.5) {
      let shadowRay = Ray(hitPosition + normal * 0.002, lightDirection);
      let shadowDistance = select(lightDistance - 0.003, RAY_INFINITY, lightType == 1u);
      if (intersectsScene(shadowRay, shadowDistance)) {
        continue;
      }
    }

    let halfDirection = normalize(lightDirection + viewDirection);
    let normalHalf = max(dot(normal, halfDirection), 0.0);
    let viewHalf = max(dot(viewDirection, halfDirection), 0.0);
    let fresnel = reflectance + (vec3<f32>(1.0) - reflectance) * pow(1.0 - viewHalf, 5.0);
    let specularPower = mix(128.0, 4.0, roughness);
    let specular = fresnel * pow(normalHalf, specularPower) * (specularPower + 2.0) / (2.0 * PI);
    let diffuse = baseColor * (1.0 - metallic) / PI;
    result += (diffuse + specular) * lightColor * normalLight * attenuation;
  }

  if (uniforms.fog.w > 0.0) {
    let visibility = exp(-uniforms.fog.w * hit.distance);
    result = mix(uniforms.fog.rgb, result, visibility);
  }
  return result;
}

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let pixel = invocation.xy;
  if (pixel.x >= uniforms.dimensions.x || pixel.y >= uniforms.dimensions.y) {
    return;
  }

  let sampleCount = clamp(u32(uniforms.settings.z), 1u, 16u);
  var accumulatedColor = vec3<f32>(0.0);
  for (var sampleIndex = 0u; sampleIndex < sampleCount; sampleIndex++) {
    let ray = makeCameraRay(pixel, sampleIndex);
    let hit = intersectScene(ray, RAY_INFINITY);
    var color = uniforms.background.rgb;
    if (hit.distance < RAY_INFINITY) {
      color = evaluateDirectLighting(ray, hit);
    }
    accumulatedColor += color;
  }

  var color = accumulatedColor / f32(sampleCount) * uniforms.settings.x;
  let frameIndex = uniforms.settings.y;
  if (frameIndex > 0.0) {
    let historicalColor = textureLoad(historyImage, vec2<i32>(pixel), 0).rgb;
    color = (historicalColor * frameIndex + color) / (frameIndex + 1.0);
  }
  textureStore(outputImage, vec2<i32>(pixel), vec4<f32>(color, 1.0));
}
`;

/** Resolves accumulated ray colors while preserving linear HDR presentation. */
export function getRayTracingScenePresentationShader(highDynamicRange: boolean): string {
  return /* wgsl */ `
@group(0) @binding(0) var image: texture_2d<f32>;

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
  let positions = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(3.0, -1.0),
    vec2<f32>(-1.0, 3.0)
  );
  return vec4<f32>(positions[vertexIndex], 0.0, 1.0);
}

@fragment
fn fragmentMain(@builtin(position) position: vec4<f32>) -> @location(0) vec4<f32> {
  let radiance = textureLoad(image, vec2<i32>(position.xy), 0);
  if (${highDynamicRange}) {
    return radiance;
  }
  let mappedColor = vec3<f32>(1.0) - exp(-radiance.rgb);
  return vec4<f32>(pow(max(mappedColor, vec3<f32>(0.0)), vec3<f32>(1.0 / 2.2)), radiance.a);
}
`;
}
