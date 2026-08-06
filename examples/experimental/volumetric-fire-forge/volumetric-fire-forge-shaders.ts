// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Sampler, Texture} from '@luma.gl/core';
import type {ShaderModule, ShaderPass, ShaderPassPipeline} from '@luma.gl/shadertools';
import {Matrix4, type NumberArray3} from '@math.gl/core';

export type ForgeSceneUniforms = {
  viewProjectionMatrix: Matrix4;
  cameraPosition: Readonly<NumberArray3>;
  emitterPosition: Readonly<NumberArray3>;
  burnerFlareIntensities: readonly [number, number, number, number];
  time: number;
};

export const forgeSceneUniforms = {
  name: 'forgeScene',
  uniformTypes: {
    viewProjectionMatrix: 'mat4x4<f32>',
    cameraPosition: 'vec3<f32>',
    emitterPosition: 'vec3<f32>',
    burnerFlareIntensities: 'vec4<f32>',
    time: 'f32'
  }
} as const satisfies ShaderModule<ForgeSceneUniforms>;

/** Instanced opaque forge surfaces with fixed cinematic key and fill lighting. */
export const FORGE_SCENE_SHADER = /* wgsl */ `\
struct ForgeSceneUniforms {
  viewProjectionMatrix: mat4x4f,
  cameraPosition: vec3f,
  emitterPosition: vec3f,
  burnerFlareIntensities: vec4f,
  time: f32,
};

@group(0) @binding(auto) var<uniform> forgeScene: ForgeSceneUniforms;

struct VertexInputs {
  @location(0) positions: vec3f,
  @location(1) normals: vec3f,
  @location(2) instancePositions: vec3f,
  @location(3) instanceHalfSizes: vec3f,
  @location(4) instanceBaseColors: vec3f,
  @location(5) instanceMaterials: vec4f,
  @location(6) instanceEmissiveColors: vec3f,
};

struct FragmentInputs {
  @builtin(position) position: vec4f,
  @location(0) worldPosition: vec3f,
  @location(1) worldNormal: vec3f,
  @location(2) baseColor: vec3f,
  @location(3) material: vec4f,
  @location(4) emissiveColor: vec3f,
};

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  let worldPosition = inputs.positions * inputs.instanceHalfSizes + inputs.instancePositions;
  let worldNormal = normalize(inputs.normals / max(inputs.instanceHalfSizes, vec3f(0.0001)));

  var outputs: FragmentInputs;
  outputs.position = forgeScene.viewProjectionMatrix * vec4f(worldPosition, 1.0);
  outputs.worldPosition = worldPosition;
  outputs.worldNormal = worldNormal;
  outputs.baseColor = inputs.instanceBaseColors;
  outputs.material = inputs.instanceMaterials;
  outputs.emissiveColor = inputs.instanceEmissiveColors;
  return outputs;
}

fn forgeScene_getMasonryCoordinates(worldPosition: vec3f, normal: vec3f) -> vec2f {
  let absoluteNormal = abs(normal);
  var masonryCoordinates = worldPosition.xy;
  if (absoluteNormal.x > max(absoluteNormal.y, absoluteNormal.z)) {
    masonryCoordinates = vec2f(worldPosition.z, worldPosition.y);
  } else if (absoluteNormal.y > absoluteNormal.z) {
    masonryCoordinates = vec2f(worldPosition.x, worldPosition.z);
  }
  return masonryCoordinates;
}

fn forgeScene_hash21(value: vec2f) -> f32 {
  return fract(sin(dot(value, vec2f(127.1, 311.7))) * 43758.5453);
}

fn forgeScene_getMasonrySurface(
  worldPosition: vec3f,
  normal: vec3f,
  baseColor: vec3f
) -> vec4f {
  let masonryCoordinates = forgeScene_getMasonryCoordinates(worldPosition, normal);
  let brickSize = vec2f(1.22, 0.52);
  let courseIndex = floor(masonryCoordinates.y / brickSize.y);
  let courseOffset = fract(courseIndex * 0.5);
  let brickGrid = vec2f(
    masonryCoordinates.x / brickSize.x + courseOffset,
    masonryCoordinates.y / brickSize.y
  );
  let brickIndex = floor(brickGrid);
  let brickCoordinates = fract(brickGrid);
  let verticalJointDistance = min(brickCoordinates.x, 1.0 - brickCoordinates.x) * brickSize.x;
  let horizontalJointDistance = min(brickCoordinates.y, 1.0 - brickCoordinates.y) * brickSize.y;
  let mortarDistance = min(verticalJointDistance, horizontalJointDistance);
  let mortarHalfWidth = 0.035;
  let mortarFilterWidth = max(fwidth(mortarDistance), 0.0015);
  let brickMask = smoothstep(
    mortarHalfWidth - mortarFilterWidth,
    mortarHalfWidth + mortarFilterWidth,
    mortarDistance
  );

  let brickVariation = forgeScene_hash21(brickIndex);
  let mineralVariation = forgeScene_hash21(brickIndex * 1.73 + vec2f(19.1, 7.7));
  let sootVariation = forgeScene_hash21(
    floor(masonryCoordinates * vec2f(0.72, 1.45)) + vec2f(43.0, 17.0)
  );
  let upperSoot = smoothstep(1.45, 3.35, worldPosition.y);
  let soot = clamp(0.025 + upperSoot * (0.12 + sootVariation * 0.12), 0.0, 0.28);
  let heatCoordinates = (worldPosition.xz - vec2f(0.0, 0.25)) * vec2f(0.16, 0.22);
  let heatWash = exp(-dot(heatCoordinates, heatCoordinates)) *
    (1.0 - smoothstep(1.1, 3.5, worldPosition.y));

  let refractoryColor = mix(
    baseColor * vec3f(1.08, 0.98, 0.9),
    vec3f(0.135, 0.053, 0.023),
    0.42
  );
  var brickColor = mix(refractoryColor, vec3f(0.18, 0.06, 0.015), heatWash * 0.28);
  brickColor *= mix(0.8, 1.13, brickVariation) * mix(0.96, 1.04, mineralVariation);
  brickColor = mix(brickColor, vec3f(0.012, 0.014, 0.016), soot);
  let bevel = smoothstep(mortarHalfWidth, mortarHalfWidth + 0.065, mortarDistance);
  brickColor *= mix(0.86, 1.0, bevel);

  let mortarBase = vec3f(0.044, 0.04, 0.035) * mix(0.9, 1.08, mineralVariation);
  let mortarColor = mix(mortarBase, vec3f(0.012, 0.014, 0.016), soot * 0.72);
  let surfaceColor = mix(mortarColor, brickColor, brickMask);
  let surfaceRoughness = mix(0.99, mix(0.84, 0.93, mineralVariation), brickMask);
  return vec4f(surfaceColor, surfaceRoughness);
}

fn forgeScene_fresnelSchlick(cosine: f32, baseReflectance: vec3f) -> vec3f {
  return baseReflectance + (vec3f(1.0) - baseReflectance) * pow(1.0 - cosine, 5.0);
}

fn forgeScene_getBurnerLight(
  worldPosition: vec3f,
  normal: vec3f,
  viewDirection: vec3f,
  baseColor: vec3f,
  baseReflectance: vec3f,
  roughness: f32,
  metallic: f32,
  firePosition: vec3f,
  phase: f32,
  flareIntensity: f32
) -> vec3f {
  let toFire = firePosition - worldPosition;
  let fireDistance = max(length(toFire), 0.08);
  let fireDirection = toFire / fireDistance;
  let fireFlicker = 0.9 + 0.1 * sin(forgeScene.time * 7.1 + phase) *
    sin(forgeScene.time * 3.7 + 1.4 + phase * 0.63);
  let flareRadiance = 1.0 + 4.8 * pow(max(flareIntensity, 0.0), 1.15);
  let fireAttenuation = fireFlicker * flareRadiance * 28.0 /
    (1.0 + fireDistance * fireDistance * 1.6);
  let fireDiffuse = max(dot(normal, fireDirection), 0.0);
  let fireHalfDirection = normalize(fireDirection + viewDirection);
  let fireSpecular = pow(
    max(dot(normal, fireHalfDirection), 0.0),
    mix(5.0, 96.0, 1.0 - roughness)
  );
  let fireFresnel = forgeScene_fresnelSchlick(
    max(dot(fireHalfDirection, viewDirection), 0.0),
    baseReflectance
  );
  let fireColor = vec3f(1.0, 0.56, 0.2) * fireAttenuation;
  let fireLighting = baseColor * (1.0 - metallic) * fireDiffuse * fireColor;
  let fireHighlight = fireFresnel * fireSpecular * fireColor * mix(0.18, 1.0, metallic);
  let contactFade = 1.0 - smoothstep(3.2, 5.0, fireDistance);
  let contactBounce = vec3f(1.45, 0.48, 0.095) * fireFlicker * flareRadiance *
    (0.16 + fireDiffuse * 0.84) * contactFade /
    (1.0 + fireDistance * fireDistance * 1.15);
  return fireLighting + fireHighlight + contactBounce;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  let normal = normalize(inputs.worldNormal);
  let viewDirection = normalize(forgeScene.cameraPosition - inputs.worldPosition);
  let masonrySurface = forgeScene_getMasonrySurface(
    inputs.worldPosition,
    normal,
    inputs.baseColor
  );
  let masonryMask = clamp(inputs.material.w, 0.0, 1.0);
  let surfaceColor = mix(inputs.baseColor, masonrySurface.rgb, masonryMask);
  let roughness = mix(clamp(inputs.material.x, 0.06, 1.0), masonrySurface.a, masonryMask);
  let metallic = mix(clamp(inputs.material.y, 0.0, 1.0), 0.025, masonryMask);
  let baseReflectance = mix(vec3f(0.035), surfaceColor, metallic);

  let frontLeftFire = forgeScene.emitterPosition + vec3f(-1.7, 0.0, -1.15);
  let frontRightFire = forgeScene.emitterPosition + vec3f(1.7, 0.0, -1.15);
  let rearLeftFire = forgeScene.emitterPosition + vec3f(-1.3, 0.0, 0.85);
  let rearRightFire = forgeScene.emitterPosition + vec3f(1.3, 0.0, 0.85);
  let fireLighting =
    forgeScene_getBurnerLight(
      inputs.worldPosition, normal, viewDirection, surfaceColor, baseReflectance,
      roughness, metallic, frontLeftFire, 0.0, forgeScene.burnerFlareIntensities.x
    ) +
    forgeScene_getBurnerLight(
      inputs.worldPosition, normal, viewDirection, surfaceColor, baseReflectance,
      roughness, metallic, frontRightFire, 1.7, forgeScene.burnerFlareIntensities.y
    ) +
    forgeScene_getBurnerLight(
      inputs.worldPosition, normal, viewDirection, surfaceColor, baseReflectance,
      roughness, metallic, rearLeftFire, 3.1, forgeScene.burnerFlareIntensities.z
    ) +
    forgeScene_getBurnerLight(
      inputs.worldPosition, normal, viewDirection, surfaceColor, baseReflectance,
      roughness, metallic, rearRightFire, 4.6, forgeScene.burnerFlareIntensities.w
    );

  let fillDirection = normalize(vec3f(-0.38, 0.82, 0.42));
  let fillDiffuse = max(dot(normal, fillDirection), 0.0);
  let fillColor = vec3f(0.18, 0.26, 0.4) * (0.32 + fillDiffuse * 0.6);
  let ambient = surfaceColor * (0.12 + max(normal.y, 0.0) * 0.05);
  let emissiveTopMask = mix(1.0, smoothstep(0.45, 0.82, normal.y), inputs.material.z);
  let emissive = inputs.emissiveColor * emissiveTopMask *
    (0.9 + 0.1 * sin(forgeScene.time * 5.3 + inputs.worldPosition.x * 2.1));
  let color = ambient + surfaceColor * fillColor + fireLighting + emissive;
  return vec4f(max(color, vec3f(0.0)), 1.0);
}
`;

export type VolumetricFireDebugView =
  | 'Final'
  | 'Density'
  | 'Temperature'
  | 'Fuel'
  | 'Age'
  | 'Velocity'
  | 'Obstacles'
  | 'Transmittance';

export const VOLUMETRIC_FIRE_DEBUG_VIEWS: readonly VolumetricFireDebugView[] = [
  'Final',
  'Density',
  'Temperature',
  'Fuel',
  'Age',
  'Velocity',
  'Obstacles',
  'Transmittance'
] as const;

export function getVolumetricFireDebugMode(debugView: VolumetricFireDebugView): number {
  return VOLUMETRIC_FIRE_DEBUG_VIEWS.indexOf(debugView);
}

const VOLUMETRIC_FIRE_MAXIMUM_SAMPLE_COUNT = 192;

type VolumetricFireCompositeUniforms = {
  inverseViewProjectionMatrix: Matrix4;
  worldToVolumeMatrix: Matrix4;
  volumeDimensions: Readonly<NumberArray3>;
  lightDirectionWorld: Readonly<NumberArray3>;
  sampleCount: number;
  densityAbsorption: number;
  emissionStrength: number;
  smokeScattering: number;
  shadowStrength: number;
  frameIndex: number;
  time: number;
  debugMode: number;
};

type VolumetricFireCompositeBindings = {
  combustionTexture?: Texture;
  velocityTexture?: Texture;
  obstacleTexture?: Texture;
  depthTexture?: Texture;
  volumeSampler?: Sampler;
};

/** Depth-aware HDR emission/absorption compositor over the simulated 3D fields. */
export const volumetricFireComposite = {
  name: 'volumetricFireComposite',
  source: /* wgsl */ `\
const VOLUMETRIC_FIRE_MAXIMUM_SAMPLE_COUNT: u32 = 192u;
const VOLUMETRIC_FIRE_SHADOW_SAMPLE_COUNT: u32 = 6u;

struct VolumetricFireCompositeUniforms {
  inverseViewProjectionMatrix: mat4x4f,
  worldToVolumeMatrix: mat4x4f,
  volumeDimensions: vec3f,
  lightDirectionWorld: vec3f,
  sampleCount: u32,
  densityAbsorption: f32,
  emissionStrength: f32,
  smokeScattering: f32,
  shadowStrength: f32,
  frameIndex: u32,
  time: f32,
  debugMode: u32,
};

@group(0) @binding(auto) var<uniform> volumetricFireComposite: VolumetricFireCompositeUniforms;
@group(0) @binding(auto) var combustionTexture: texture_3d<f32>;
@group(0) @binding(auto) var velocityTexture: texture_3d<f32>;
@group(0) @binding(auto) var obstacleTexture: texture_3d<f32>;
@group(0) @binding(auto) var volumeSampler: sampler;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;

fn volumetricFireComposite_unproject(textureCoordinate: vec2f, depth: f32) -> vec3f {
  let clipPosition = vec4f(
    textureCoordinate.x * 2.0 - 1.0,
    1.0 - textureCoordinate.y * 2.0,
    depth,
    1.0
  );
  let worldPosition = volumetricFireComposite.inverseViewProjectionMatrix * clipPosition;
  return worldPosition.xyz / max(abs(worldPosition.w), 0.000001) * sign(worldPosition.w);
}

fn volumetricFireComposite_intersectSlab(
  origin: f32,
  direction: f32,
  minimumValue: f32,
  maximumValue: f32
) -> vec2f {
  if (abs(direction) < 0.000001) {
    if (origin < minimumValue || origin > maximumValue) {
      return vec2f(1e20, -1e20);
    }
    return vec2f(-1e20, 1e20);
  }
  let firstDistance = (minimumValue - origin) / direction;
  let secondDistance = (maximumValue - origin) / direction;
  return vec2f(min(firstDistance, secondDistance), max(firstDistance, secondDistance));
}

fn volumetricFireComposite_intersectUnitBox(origin: vec3f, direction: vec3f) -> vec2f {
  let xDistances = volumetricFireComposite_intersectSlab(origin.x, direction.x, 0.0, 1.0);
  let yDistances = volumetricFireComposite_intersectSlab(origin.y, direction.y, 0.0, 1.0);
  let zDistances = volumetricFireComposite_intersectSlab(origin.z, direction.z, 0.0, 1.0);
  return vec2f(
    max(xDistances.x, max(yDistances.x, zDistances.x)),
    min(xDistances.y, min(yDistances.y, zDistances.y))
  );
}

fn volumetricFireComposite_hash(pixel: vec2f, frameIndex: u32) -> f32 {
  let phase = dot(pixel, vec2f(12.9898, 78.233)) + f32(frameIndex) * 37.719;
  return fract(sin(phase) * 43758.5453);
}

fn volumetricFireComposite_blackbody(temperature: f32) -> vec3f {
  let ember = vec3f(1.35, 0.018, 0.0015);
  let orange = vec3f(3.7, 0.31, 0.012);
  let gold = vec3f(5.4, 1.45, 0.17);
  let whiteHot = vec3f(7.2, 4.9, 1.85);
  let warmColor = mix(ember, orange, smoothstep(0.04, 0.42, temperature));
  let hotColor = mix(gold, whiteHot, smoothstep(0.9, 2.1, temperature));
  return mix(warmColor, hotColor, smoothstep(0.38, 1.25, temperature));
}

fn volumetricFireComposite_getFlameEmission(
  reactiveHeat: f32,
  density: f32
) -> vec3f {
  // Simulation heat is intentionally open-ended. Compress it before choosing chromaticity so
  // a hot source retains gradients instead of sending every display channel into the white clip.
  let visualHeat = 1.0 - exp(-max(reactiveHeat, 0.0) * 0.42);
  let visualDensity = 1.0 - exp(-max(density, 0.0) * 1.25);
  let ember = vec3f(1.0, 0.012, 0.0005);
  let orange = vec3f(1.0, 0.115, 0.004);
  let gold = vec3f(1.0, 0.34, 0.018);
  let paleGold = vec3f(1.0, 0.72, 0.24);
  let warmColor = mix(ember, orange, smoothstep(0.02, 0.35, visualHeat));
  let hotColor = mix(gold, paleGold, smoothstep(0.82, 0.98, visualHeat));
  let flameColor = mix(warmColor, hotColor, smoothstep(0.38, 0.82, visualHeat));
  // The bounded envelope still exceeds one after the authored emission scale, preserving HDR
  // energy while keeping the cooler channels below the red core's peak luminance.
  let emissionIntensity = 0.35 + 3.65 * visualHeat * visualHeat;
  return flameColor * emissionIntensity * visualDensity;
}

fn volumetricFireComposite_heatMap(value: f32) -> vec3f {
  let blueToCyan = mix(vec3f(0.015, 0.035, 0.2), vec3f(0.0, 0.75, 1.0), smoothstep(0.0, 0.4, value));
  let yellowToRed = mix(vec3f(1.0, 0.9, 0.08), vec3f(1.0, 0.04, 0.01), smoothstep(0.7, 1.0, value));
  return mix(blueToCyan, yellowToRed, smoothstep(0.35, 0.78, value));
}

fn volumetricFireComposite_getShadowTransmittance(
  volumePosition: vec3f,
  lightDirectionVolume: vec3f
) -> f32 {
  let voxelStep = 2.3 / max(
    volumetricFireComposite.volumeDimensions.x,
    max(volumetricFireComposite.volumeDimensions.y, volumetricFireComposite.volumeDimensions.z)
  );
  var opticalDepth = 0.0;
  var shadowPosition = volumePosition;
  for (var shadowIndex = 0u; shadowIndex < VOLUMETRIC_FIRE_SHADOW_SAMPLE_COUNT; shadowIndex++) {
    shadowPosition += lightDirectionVolume * voxelStep * (1.0 + f32(shadowIndex) * 0.18);
    if (any(shadowPosition <= vec3f(0.0)) || any(shadowPosition >= vec3f(1.0))) {
      break;
    }
    let density = textureSampleLevel(
      combustionTexture,
      volumeSampler,
      shadowPosition,
      0
    ).x;
    opticalDepth += max(density, 0.0);
  }
  return exp(
    -opticalDepth * volumetricFireComposite.densityAbsorption *
    volumetricFireComposite.shadowStrength * voxelStep * 4.0
  );
}

fn volumetricFireComposite_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let sceneColor = textureSampleLevel(sourceTexture, sourceTextureSampler, texCoord, 0).rgb;
  let nearWorld = volumetricFireComposite_unproject(texCoord, 0.0);
  let farWorld = volumetricFireComposite_unproject(texCoord, 1.0);
  let rayDirectionWorld = normalize(farWorld - nearWorld);
  let volumeOrigin = (
    volumetricFireComposite.worldToVolumeMatrix * vec4f(nearWorld, 1.0)
  ).xyz;
  let volumeDirection = (
    volumetricFireComposite.worldToVolumeMatrix * vec4f(rayDirectionWorld, 0.0)
  ).xyz;
  let hitDistances = volumetricFireComposite_intersectUnitBox(volumeOrigin, volumeDirection);
  var startDistance = max(hitDistances.x, 0.0);
  var endDistance = hitDistances.y;

  let sceneDepth = textureSampleLevel(depthTexture, depthTextureSampler, texCoord, 0);
  if (sceneDepth < 0.999999 && volumetricFireComposite.debugMode != 6u) {
    let sceneWorld = volumetricFireComposite_unproject(texCoord, sceneDepth);
    let sceneDistance = dot(sceneWorld - nearWorld, rayDirectionWorld);
    endDistance = min(endDistance, sceneDistance);
  }
  if (endDistance <= startDistance) {
    return vec4f(sceneColor, 1.0);
  }

  let sampleCount = clamp(
    volumetricFireComposite.sampleCount,
    1u,
    VOLUMETRIC_FIRE_MAXIMUM_SAMPLE_COUNT
  );
  let stepLength = (endDistance - startDistance) / f32(sampleCount);
  let jitter = volumetricFireComposite_hash(texCoord * texSize, volumetricFireComposite.frameIndex);
  let lightDirectionVolume = normalize((
    volumetricFireComposite.worldToVolumeMatrix *
    vec4f(normalize(volumetricFireComposite.lightDirectionWorld), 0.0)
  ).xyz);

  var transmittance = 1.0;
  var integratedRadiance = vec3f(0.0);
  var maximumDensity = 0.0;
  var maximumTemperature = 0.0;
  var maximumFuel = 0.0;
  var maximumAge = 0.0;
  var maximumVelocity = 0.0;
  var maximumObstacle = 0.0;

  for (var sampleIndex = 0u; sampleIndex < VOLUMETRIC_FIRE_MAXIMUM_SAMPLE_COUNT; sampleIndex++) {
    if (sampleIndex >= sampleCount || transmittance < 0.008) {
      break;
    }
    let sampleDistance = startDistance + (f32(sampleIndex) + jitter) * stepLength;
    let worldPosition = nearWorld + rayDirectionWorld * sampleDistance;
    let volumePosition = (
      volumetricFireComposite.worldToVolumeMatrix * vec4f(worldPosition, 1.0)
    ).xyz;
    let obstacleDimensions = vec3i(textureDimensions(obstacleTexture));
    let obstacleCoordinate = clamp(
      vec3i(floor(volumePosition * vec3f(obstacleDimensions))),
      vec3i(0),
      obstacleDimensions - vec3i(1)
    );
    let obstacle = textureLoad(obstacleTexture, obstacleCoordinate, 0).x;
    if (volumetricFireComposite.debugMode == 6u) {
      maximumObstacle = max(maximumObstacle, obstacle);
      continue;
    }
    if (obstacle >= 0.5) {
      continue;
    }

    let combustion = textureSampleLevel(
      combustionTexture,
      volumeSampler,
      volumePosition,
      0
    );
    let density = max(combustion.x, 0.0);
    let temperature = max(combustion.y, 0.0);
    let fuel = max(combustion.z, 0.0);
    let age = max(combustion.w, 0.0);
    maximumDensity = max(maximumDensity, density);
    maximumTemperature = max(maximumTemperature, temperature);
    maximumFuel = max(maximumFuel, fuel);
    maximumAge = max(maximumAge, age);
    if (volumetricFireComposite.debugMode == 5u) {
      let velocity = textureSampleLevel(
        velocityTexture,
        volumeSampler,
        volumePosition,
        0
      ).xyz;
      maximumVelocity = max(maximumVelocity, length(velocity));
    }

    if (volumetricFireComposite.debugMode != 0u && volumetricFireComposite.debugMode != 7u) {
      continue;
    }

    let reactiveHeat = temperature + fuel * 0.36;
    if (density < 0.0005 && reactiveHeat < 0.001) {
      continue;
    }
    let extinction = density * volumetricFireComposite.densityAbsorption;
    let segmentTransmittance = exp(-extinction * stepLength);
    var segmentIntegral = stepLength;
    if (extinction > 0.00001) {
      segmentIntegral = (1.0 - segmentTransmittance) / extinction;
    }
    let sampleOpacity = 1.0 - segmentTransmittance;
    if (volumetricFireComposite.debugMode == 7u) {
      transmittance *= segmentTransmittance;
      continue;
    }
    var shadowTransmittance = 1.0;
    if (density > 0.012 && volumetricFireComposite.shadowStrength > 0.001) {
      shadowTransmittance = volumetricFireComposite_getShadowTransmittance(
        volumePosition,
        lightDirectionVolume
      );
    }
    let emission = volumetricFireComposite_getFlameEmission(reactiveHeat, density) *
      volumetricFireComposite.emissionStrength;
    let smokeLight = mix(vec3f(0.016, 0.024, 0.04), vec3f(0.14, 0.085, 0.04), shadowTransmittance) *
      density * volumetricFireComposite.smokeScattering;
    integratedRadiance += transmittance * (emission * segmentIntegral + smokeLight * sampleOpacity);
    transmittance *= segmentTransmittance;
  }

  if (volumetricFireComposite.debugMode == 1u) {
    return vec4f(volumetricFireComposite_heatMap(clamp(maximumDensity, 0.0, 1.0)), 1.0);
  }
  if (volumetricFireComposite.debugMode == 2u) {
    return vec4f(volumetricFireComposite_blackbody(maximumTemperature) / 7.2, 1.0);
  }
  if (volumetricFireComposite.debugMode == 3u) {
    let fuelValue = clamp(maximumFuel, 0.0, 1.0);
    return vec4f(mix(vec3f(0.015, 0.01, 0.035), vec3f(0.82, 0.18, 1.0), fuelValue), 1.0);
  }
  if (volumetricFireComposite.debugMode == 4u) {
    return vec4f(volumetricFireComposite_heatMap(clamp(maximumAge / 12.0, 0.0, 1.0)), 1.0);
  }
  if (volumetricFireComposite.debugMode == 5u) {
    return vec4f(volumetricFireComposite_heatMap(clamp(maximumVelocity / 6.0, 0.0, 1.0)), 1.0);
  }
  if (volumetricFireComposite.debugMode == 6u) {
    return vec4f(vec3f(maximumObstacle), 1.0);
  }
  if (volumetricFireComposite.debugMode == 7u) {
    return vec4f(vec3f(transmittance), 1.0);
  }
  return vec4f(integratedRadiance + sceneColor * transmittance, 1.0);
}`,
  bindingLayout: [
    {name: 'combustionTexture', group: 0},
    {name: 'velocityTexture', group: 0},
    {name: 'obstacleTexture', group: 0},
    {name: 'depthTexture', group: 0},
    {name: 'volumeSampler', group: 0}
  ],
  props: {} as Partial<VolumetricFireCompositeUniforms> & VolumetricFireCompositeBindings,
  uniforms: {} as VolumetricFireCompositeUniforms,
  bindings: {} as VolumetricFireCompositeBindings,
  uniformTypes: {
    inverseViewProjectionMatrix: 'mat4x4<f32>',
    worldToVolumeMatrix: 'mat4x4<f32>',
    volumeDimensions: 'vec3<f32>',
    lightDirectionWorld: 'vec3<f32>',
    sampleCount: 'u32',
    densityAbsorption: 'f32',
    emissionStrength: 'f32',
    smokeScattering: 'f32',
    shadowStrength: 'f32',
    frameIndex: 'u32',
    time: 'f32',
    debugMode: 'u32'
  },
  propTypes: {
    inverseViewProjectionMatrix: {value: new Matrix4(), private: true},
    worldToVolumeMatrix: {value: new Matrix4(), private: true},
    volumeDimensions: {value: [64, 96, 64], private: true},
    lightDirectionWorld: {value: [0.4, 0.85, 0.24], private: true},
    sampleCount: {value: 80, min: 8, max: VOLUMETRIC_FIRE_MAXIMUM_SAMPLE_COUNT},
    densityAbsorption: {value: 2.35, min: 0, softMax: 8},
    emissionStrength: {value: 3.2, min: 0, softMax: 8},
    smokeScattering: {value: 0.72, min: 0, softMax: 3},
    shadowStrength: {value: 0.85, min: 0, max: 1},
    frameIndex: {value: 0, private: true},
    time: {value: 0, private: true},
    debugMode: {value: 0, private: true}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass<
  Partial<VolumetricFireCompositeUniforms> & VolumetricFireCompositeBindings,
  VolumetricFireCompositeUniforms,
  VolumetricFireCompositeBindings
>;

export function createVolumetricFireCompositeShaderPassPipeline(): ShaderPassPipeline {
  return {
    name: 'volumetricFireCompositeShaderPassPipeline',
    steps: [
      {
        shaderPass: volumetricFireComposite,
        inputs: {sourceTexture: 'previous'},
        output: 'previous'
      }
    ]
  };
}
