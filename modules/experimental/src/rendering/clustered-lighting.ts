// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CommandEncoder, Device} from '@luma.gl/core';
import {Buffer} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import type {Matrix4Like, NumberArray3, NumberArray16} from '@math.gl/core';
import type {ShaderPass, ShaderPassPipeline} from '@luma.gl/shadertools';

export const MAX_CLUSTERED_POINT_LIGHTS = 512;
export const DEFAULT_CLUSTER_DIMENSIONS = [16, 9, 24] as const;
export const DEFAULT_MAX_LIGHTS_PER_CLUSTER = 64;

const CLUSTER_WORKGROUP_SIZE = 64;
const CLUSTERED_LIGHT_GRID_UNIFORM_BYTE_LENGTH = 80;
const IDENTITY_MATRIX: NumberArray16 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

/** Construction props for the fixed-capacity WebGPU light-cluster grid. */
export type ClusteredLightGridProps = {
  /** Optional debug-resource prefix. */
  id?: string;
  /** Screen-x, screen-y, and logarithmic depth-slice counts. */
  clusterDimensions?: readonly [number, number, number];
  /** Maximum retained light indices in one cluster. */
  maxLightsPerCluster?: number;
  /** Maximum point-light records accepted by encode(). */
  maxLightCount?: number;
};

/** Per-frame camera and light inputs used to rebuild the cluster lists. */
export type ClusteredLightGridEncodeOptions = {
  /** Fixed-size view-space DeferredPointLight storage buffer. */
  pointLights: Buffer;
  /** Active prefix length in pointLights. */
  pointLightCount: number;
  /** Camera projection used to conservatively project light spheres into screen tiles. */
  projectionMatrix: Readonly<Matrix4Like>;
  /** Positive view-space near plane. */
  nearPlane: number;
  /** Positive view-space far plane. */
  farPlane: number;
};

/** Storage bindings consumed by clusteredDeferredLighting. */
export type ClusteredLightGridBindings = {
  clusterLightCounts: Buffer;
  clusterLightIndices: Buffer;
};

/** Uniform values consumed by clusteredDeferredLighting to locate one pixel's cluster. */
export type ClusteredLightGridShaderPassUniforms = {
  clusterCountX: number;
  clusterCountY: number;
  clusterCountZ: number;
  maxLightsPerCluster: number;
  clusterNearPlane: number;
  clusterFarPlane: number;
};

/**
 * Builds fixed-capacity screen/depth light lists entirely on WebGPU.
 *
 * One compute invocation projects each view-space point-light sphere into the overlapping
 * x/y/z cluster range and atomically marks its light bit. A second compute dispatch compacts
 * each bit mask in stable light-index order. Indices beyond maxLightsPerCluster are
 * intentionally dropped so the fullscreen lighting pass has a predictable loop bound without
 * nondeterministic overflow shimmer.
 */
export class ClusteredLightGrid {
  readonly device: Device;
  readonly id: string;
  readonly clusterDimensions: readonly [number, number, number];
  readonly maxLightsPerCluster: number;
  readonly maxLightCount: number;
  readonly clusterCount: number;
  readonly clusterLightCounts: Buffer;
  readonly clusterLightIndices: Buffer;

  private readonly clusterLightBitMask: Buffer;
  private readonly uniformBuffer: Buffer;
  private readonly clearComputation: Computation;
  private readonly binningComputation: Computation;
  private readonly compactComputation: Computation;

  constructor(device: Device, props: ClusteredLightGridProps = {}) {
    if (device.type !== 'webgpu') {
      throw new Error('ClusteredLightGrid requires WebGPU.');
    }

    this.device = device;
    this.id = props.id || 'clustered-light-grid';
    this.clusterDimensions = props.clusterDimensions ?? DEFAULT_CLUSTER_DIMENSIONS;
    this.maxLightsPerCluster = props.maxLightsPerCluster ?? DEFAULT_MAX_LIGHTS_PER_CLUSTER;
    this.maxLightCount = props.maxLightCount ?? MAX_CLUSTERED_POINT_LIGHTS;
    validateClusteredLightGridProps(
      this.clusterDimensions,
      this.maxLightsPerCluster,
      this.maxLightCount
    );
    this.clusterCount =
      this.clusterDimensions[0] * this.clusterDimensions[1] * this.clusterDimensions[2];

    this.clusterLightCounts = device.createBuffer({
      id: `${this.id}-counts`,
      byteLength: this.clusterCount * Uint32Array.BYTES_PER_ELEMENT,
      usage: Buffer.STORAGE | Buffer.COPY_SRC
    });
    this.clusterLightIndices = device.createBuffer({
      id: `${this.id}-indices`,
      byteLength: this.clusterCount * this.maxLightsPerCluster * Uint32Array.BYTES_PER_ELEMENT,
      usage: Buffer.STORAGE | Buffer.COPY_SRC
    });
    const lightWordCount = getLightWordCount(this.maxLightCount);
    this.clusterLightBitMask = device.createBuffer({
      id: `${this.id}-light-mask`,
      byteLength: this.clusterCount * lightWordCount * Uint32Array.BYTES_PER_ELEMENT,
      usage: Buffer.STORAGE
    });
    this.uniformBuffer = device.createBuffer({
      id: `${this.id}-uniforms`,
      byteLength: CLUSTERED_LIGHT_GRID_UNIFORM_BYTE_LENGTH,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });

    this.clearComputation = new Computation(device, {
      id: `${this.id}-clear`,
      source: getClearClusterLightBitMaskSource(this.clusterCount, lightWordCount),
      shaderLayout: {
        bindings: [{name: 'clusterLightBitMask', type: 'storage', group: 0, location: 0}]
      }
    });
    this.clearComputation.setBindings({clusterLightBitMask: this.clusterLightBitMask});

    this.binningComputation = new Computation(device, {
      id: `${this.id}-bin`,
      source: getClusterBinningSource(this.clusterDimensions, this.maxLightCount),
      shaderLayout: {
        bindings: [
          {name: 'pointLights', type: 'read-only-storage', group: 0, location: 0},
          {name: 'clusterLightBitMask', type: 'storage', group: 0, location: 1},
          {name: 'clusteredLightGrid', type: 'uniform', group: 0, location: 2}
        ]
      }
    });
    this.compactComputation = new Computation(device, {
      id: `${this.id}-compact`,
      source: getCompactClusterLightListsSource(
        this.clusterCount,
        lightWordCount,
        this.maxLightsPerCluster,
        this.maxLightCount
      ),
      shaderLayout: {
        bindings: [
          {name: 'clusterLightBitMask', type: 'storage', group: 0, location: 0},
          {name: 'clusterLightCounts', type: 'storage', group: 0, location: 1},
          {name: 'clusterLightIndices', type: 'storage', group: 0, location: 2}
        ]
      }
    });
  }

  /** Rebuilds cluster counts and light-index lists on the supplied command encoder. */
  encode(commandEncoder: CommandEncoder, options: ClusteredLightGridEncodeOptions): void {
    validateClusteredLightGridEncodeOptions(options, this.maxLightCount);
    this.uniformBuffer.write(makeClusteredLightGridUniformData(options));
    this.binningComputation.setBindings({
      pointLights: options.pointLights,
      clusterLightBitMask: this.clusterLightBitMask,
      clusteredLightGrid: this.uniformBuffer
    });
    this.compactComputation.setBindings({
      clusterLightBitMask: this.clusterLightBitMask,
      clusterLightCounts: this.clusterLightCounts,
      clusterLightIndices: this.clusterLightIndices
    });
    this.clearComputation.predraw(commandEncoder);
    this.binningComputation.predraw(commandEncoder);
    this.compactComputation.predraw(commandEncoder);

    const computePass = commandEncoder.beginComputePass({id: `${this.id}-build`});
    this.clearComputation.dispatch(
      computePass,
      Math.ceil(
        (this.clusterCount * getLightWordCount(this.maxLightCount)) / CLUSTER_WORKGROUP_SIZE
      )
    );
    this.binningComputation.dispatch(
      computePass,
      Math.max(1, Math.ceil(options.pointLightCount / CLUSTER_WORKGROUP_SIZE))
    );
    this.compactComputation.dispatch(
      computePass,
      Math.ceil(this.clusterCount / CLUSTER_WORKGROUP_SIZE)
    );
    computePass.end();
  }

  /** Returns the storage bindings consumed by clusteredDeferredLighting. */
  getShaderPassBindings(): ClusteredLightGridBindings {
    return {
      clusterLightCounts: this.clusterLightCounts,
      clusterLightIndices: this.clusterLightIndices
    };
  }

  /** Returns the scalar uniforms consumed by clusteredDeferredLighting. */
  getShaderPassUniforms(nearPlane: number, farPlane: number): ClusteredLightGridShaderPassUniforms {
    validateDepthRange(nearPlane, farPlane);
    return {
      clusterCountX: this.clusterDimensions[0],
      clusterCountY: this.clusterDimensions[1],
      clusterCountZ: this.clusterDimensions[2],
      maxLightsPerCluster: this.maxLightsPerCluster,
      clusterNearPlane: nearPlane,
      clusterFarPlane: farPlane
    };
  }

  destroy(): void {
    this.clearComputation.destroy();
    this.binningComputation.destroy();
    this.compactComputation.destroy();
    this.uniformBuffer.destroy();
    this.clusterLightBitMask.destroy();
    this.clusterLightCounts.destroy();
    this.clusterLightIndices.destroy();
  }
}

type ClusteredDeferredLightingUniforms = ClusteredLightGridShaderPassUniforms & {
  inverseProjectionMatrix: Readonly<NumberArray16>;
  ambientColor: Readonly<NumberArray3>;
  directionalLightDirectionView: Readonly<NumberArray3>;
  directionalLightColor: Readonly<NumberArray3>;
  directionalLightIntensity: number;
};

type ClusteredDeferredLightingBindings = ClusteredLightGridBindings & {
  depthTexture?: import('@luma.gl/core').Texture;
  normalTexture?: import('@luma.gl/core').Texture;
  baseColorMetallicTexture?: import('@luma.gl/core').Texture;
  emissiveOcclusionTexture?: import('@luma.gl/core').Texture;
  pointLights?: Buffer;
};

/** CPU-side uniforms and resource bindings consumed by clusteredDeferredLighting. */
export type ClusteredDeferredLightingProps = Partial<ClusteredDeferredLightingUniforms> &
  ClusteredDeferredLightingBindings;

/** Fullscreen Cook-Torrance lighting resolve over per-cluster point-light lists. */
export const clusteredDeferredLighting = {
  name: 'clusteredDeferredLighting',
  source: `\
const CLUSTERED_DEFERRED_LIGHTING_PI: f32 = 3.141592653589793;

struct ClusteredDeferredLightingUniforms {
  inverseProjectionMatrix: mat4x4f,
  ambientColor: vec3f,
  directionalLightDirectionView: vec3f,
  directionalLightColor: vec3f,
  directionalLightIntensity: f32,
  clusterCountX: u32,
  clusterCountY: u32,
  clusterCountZ: u32,
  maxLightsPerCluster: u32,
  clusterNearPlane: f32,
  clusterFarPlane: f32,
};

struct ClusteredDeferredPointLight {
  positionRange: vec4f,
  colorIntensity: vec4f,
};

@group(0) @binding(auto) var<uniform> clusteredDeferredLighting: ClusteredDeferredLightingUniforms;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
@group(0) @binding(auto) var normalTexture: texture_2d<f32>;
@group(0) @binding(auto) var normalTextureSampler: sampler;
@group(0) @binding(auto) var baseColorMetallicTexture: texture_2d<f32>;
@group(0) @binding(auto) var baseColorMetallicTextureSampler: sampler;
@group(0) @binding(auto) var emissiveOcclusionTexture: texture_2d<u32>;
@group(0) @binding(auto) var<storage, read> pointLights: array<ClusteredDeferredPointLight>;
@group(0) @binding(auto) var<storage, read> clusterLightCounts: array<u32>;
@group(0) @binding(auto) var<storage, read> clusterLightIndices: array<u32>;

fn clusteredDeferredLighting_reconstructViewPosition(uv: vec2f, depth: f32) -> vec3f {
  let clip = vec4f(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, depth, 1.0);
  let viewPosition = clusteredDeferredLighting.inverseProjectionMatrix * clip;
  return viewPosition.xyz / max(viewPosition.w, 0.00001);
}

fn clusteredDeferredLighting_distributionGGX(
  normal: vec3f,
  halfVector: vec3f,
  roughness: f32
) -> f32 {
  let alpha = roughness * roughness;
  let alphaSquared = alpha * alpha;
  let normalDotHalf = max(dot(normal, halfVector), 0.0);
  let normalDotHalfSquared = normalDotHalf * normalDotHalf;
  let denominator = normalDotHalfSquared * (alphaSquared - 1.0) + 1.0;
  return alphaSquared /
    max(CLUSTERED_DEFERRED_LIGHTING_PI * denominator * denominator, 0.0001);
}

fn clusteredDeferredLighting_geometrySchlickGGX(
  normalDotDirection: f32,
  roughness: f32
) -> f32 {
  let radius = roughness + 1.0;
  let k = radius * radius / 8.0;
  return normalDotDirection / max(normalDotDirection * (1.0 - k) + k, 0.0001);
}

fn clusteredDeferredLighting_geometrySmith(
  normal: vec3f,
  viewDirection: vec3f,
  lightDirection: vec3f,
  roughness: f32
) -> f32 {
  let normalDotView = max(dot(normal, viewDirection), 0.0);
  let normalDotLight = max(dot(normal, lightDirection), 0.0);
  return clusteredDeferredLighting_geometrySchlickGGX(normalDotView, roughness) *
    clusteredDeferredLighting_geometrySchlickGGX(normalDotLight, roughness);
}

fn clusteredDeferredLighting_fresnelSchlick(cosine: f32, baseReflectance: vec3f) -> vec3f {
  return baseReflectance + (vec3f(1.0) - baseReflectance) * pow(1.0 - cosine, 5.0);
}

fn clusteredDeferredLighting_evaluateLight(
  normal: vec3f,
  viewDirection: vec3f,
  lightDirection: vec3f,
  radiance: vec3f,
  baseColor: vec3f,
  metallic: f32,
  roughness: f32
) -> vec3f {
  let normalDotLight = max(dot(normal, lightDirection), 0.0);
  if (normalDotLight <= 0.0) {
    return vec3f(0.0);
  }
  let halfVector = normalize(viewDirection + lightDirection);
  let baseReflectance = mix(vec3f(0.04), baseColor, metallic);
  let fresnel = clusteredDeferredLighting_fresnelSchlick(
    max(dot(halfVector, viewDirection), 0.0),
    baseReflectance
  );
  let distribution = clusteredDeferredLighting_distributionGGX(normal, halfVector, roughness);
  let geometry = clusteredDeferredLighting_geometrySmith(
    normal,
    viewDirection,
    lightDirection,
    roughness
  );
  let normalDotView = max(dot(normal, viewDirection), 0.0);
  let specular = distribution * geometry * fresnel /
    max(4.0 * normalDotView * normalDotLight, 0.0001);
  let diffuseWeight = (vec3f(1.0) - fresnel) * (1.0 - metallic);
  let diffuse = diffuseWeight * baseColor / CLUSTERED_DEFERRED_LIGHTING_PI;
  return (diffuse + specular) * radiance * normalDotLight;
}

fn clusteredDeferredLighting_evaluatePointLight(
  light: ClusteredDeferredPointLight,
  viewPosition: vec3f,
  normal: vec3f,
  viewDirection: vec3f,
  baseColor: vec3f,
  metallic: f32,
  roughness: f32
) -> vec3f {
  let toLight = light.positionRange.xyz - viewPosition;
  let distance = length(toLight);
  if (distance >= light.positionRange.w || distance <= 0.0001) {
    return vec3f(0.0);
  }
  let lightDirection = toLight / distance;
  let rangeFade = pow(clamp(1.0 - distance / light.positionRange.w, 0.0, 1.0), 2.0);
  let attenuation = rangeFade / max(1.0, distance * distance * 0.06);
  let radiance = light.colorIntensity.rgb * light.colorIntensity.a * attenuation;
  return clusteredDeferredLighting_evaluateLight(
    normal,
    viewDirection,
    lightDirection,
    radiance,
    baseColor,
    metallic,
    roughness
  );
}

fn clusteredDeferredLighting_getClusterIndex(texCoord: vec2f, viewPosition: vec3f) -> u32 {
  let tileX = min(
    u32(clamp(texCoord.x, 0.0, 0.999999) * f32(clusteredDeferredLighting.clusterCountX)),
    clusteredDeferredLighting.clusterCountX - 1u
  );
  let tileY = min(
    u32(clamp(texCoord.y, 0.0, 0.999999) * f32(clusteredDeferredLighting.clusterCountY)),
    clusteredDeferredLighting.clusterCountY - 1u
  );
  let viewDepth = clamp(
    -viewPosition.z,
    clusteredDeferredLighting.clusterNearPlane,
    clusteredDeferredLighting.clusterFarPlane
  );
  let normalizedDepth = clamp(
    log(viewDepth / clusteredDeferredLighting.clusterNearPlane) /
      log(clusteredDeferredLighting.clusterFarPlane / clusteredDeferredLighting.clusterNearPlane),
    0.0,
    0.999999
  );
  let depthSlice = min(
    u32(normalizedDepth * f32(clusteredDeferredLighting.clusterCountZ)),
    clusteredDeferredLighting.clusterCountZ - 1u
  );
  return (depthSlice * clusteredDeferredLighting.clusterCountY + tileY) *
    clusteredDeferredLighting.clusterCountX + tileX;
}

fn clusteredDeferredLighting_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let sceneCoord = texCoord;
  let depth = textureSampleLevel(depthTexture, depthTextureSampler, sceneCoord, 0);
  if (depth >= 0.99999) {
    return textureSampleLevel(sourceTexture, sourceTextureSampler, texCoord, 0);
  }

  let normalRoughness = textureSampleLevel(normalTexture, normalTextureSampler, sceneCoord, 0);
  let normal = normalize(normalRoughness.rgb * 2.0 - 1.0);
  let roughness = clamp(normalRoughness.a, 0.045, 1.0);
  let baseColorMetallic = textureSampleLevel(
    baseColorMetallicTexture,
    baseColorMetallicTextureSampler,
    sceneCoord,
    0
  );
  let baseColor = max(baseColorMetallic.rgb, vec3f(0.0));
  let metallic = clamp(baseColorMetallic.a, 0.0, 1.0);
  let emissiveOcclusionCoordinates = vec2i(
    clamp(sceneCoord * texSize, vec2f(0.0), texSize - vec2f(1.0))
  );
  let emissiveOcclusion = vec4f(
    textureLoad(emissiveOcclusionTexture, emissiveOcclusionCoordinates, 0)
  ) / 255.0;
  let emissive = max(emissiveOcclusion.rgb, vec3f(0.0));
  let occlusion = clamp(emissiveOcclusion.a, 0.0, 1.0);
  let viewPosition = clusteredDeferredLighting_reconstructViewPosition(sceneCoord, depth);
  let viewDirection = normalize(-viewPosition);

  var color = baseColor * clusteredDeferredLighting.ambientColor * occlusion + emissive;
  let directionalLightDirection = normalize(
    clusteredDeferredLighting.directionalLightDirectionView
  );
  color += clusteredDeferredLighting_evaluateLight(
    normal,
    viewDirection,
    directionalLightDirection,
    clusteredDeferredLighting.directionalLightColor *
      clusteredDeferredLighting.directionalLightIntensity,
    baseColor,
    metallic,
    roughness
  );

  let clusterIndex = clusteredDeferredLighting_getClusterIndex(sceneCoord, viewPosition);
  let candidateLightCount = clusterLightCounts[clusterIndex];
  if (candidateLightCount > clusteredDeferredLighting.maxLightsPerCluster) {
    for (var lightIndex = 0u; lightIndex < arrayLength(&pointLights); lightIndex++) {
      color += clusteredDeferredLighting_evaluatePointLight(
        pointLights[lightIndex],
        viewPosition,
        normal,
        viewDirection,
        baseColor,
        metallic,
        roughness
      );
    }
  } else {
    let indexOffset = clusterIndex * clusteredDeferredLighting.maxLightsPerCluster;
    for (var clusterLightIndex = 0u; clusterLightIndex < candidateLightCount; clusterLightIndex++) {
      let lightIndex = clusterLightIndices[indexOffset + clusterLightIndex];
      if (lightIndex >= arrayLength(&pointLights)) {
        continue;
      }
      color += clusteredDeferredLighting_evaluatePointLight(
        pointLights[lightIndex],
        viewPosition,
        normal,
        viewDirection,
        baseColor,
        metallic,
        roughness
      );
    }
  }

  return vec4f(color, 1.0);
}`,
  bindingLayout: [
    {name: 'depthTexture', group: 0},
    {name: 'normalTexture', group: 0},
    {name: 'baseColorMetallicTexture', group: 0},
    {name: 'emissiveOcclusionTexture', group: 0},
    {name: 'pointLights', group: 0},
    {name: 'clusterLightCounts', group: 0},
    {name: 'clusterLightIndices', group: 0}
  ],
  props: {} as ClusteredDeferredLightingProps,
  uniforms: {} as ClusteredDeferredLightingUniforms,
  bindings: {} as ClusteredDeferredLightingBindings,
  uniformTypes: {
    inverseProjectionMatrix: 'mat4x4<f32>',
    ambientColor: 'vec3<f32>',
    directionalLightDirectionView: 'vec3<f32>',
    directionalLightColor: 'vec3<f32>',
    directionalLightIntensity: 'f32',
    clusterCountX: 'u32',
    clusterCountY: 'u32',
    clusterCountZ: 'u32',
    maxLightsPerCluster: 'u32',
    clusterNearPlane: 'f32',
    clusterFarPlane: 'f32'
  },
  propTypes: {
    inverseProjectionMatrix: {value: IDENTITY_MATRIX, private: true},
    ambientColor: {value: [0.04, 0.04, 0.05], private: true},
    directionalLightDirectionView: {value: [0.3, 0.75, 0.55], private: true},
    directionalLightColor: {value: [1, 0.95, 0.86], private: true},
    directionalLightIntensity: {value: 2.5, min: 0, softMax: 8},
    clusterCountX: {value: DEFAULT_CLUSTER_DIMENSIONS[0], private: true},
    clusterCountY: {value: DEFAULT_CLUSTER_DIMENSIONS[1], private: true},
    clusterCountZ: {value: DEFAULT_CLUSTER_DIMENSIONS[2], private: true},
    maxLightsPerCluster: {value: DEFAULT_MAX_LIGHTS_PER_CLUSTER, private: true},
    clusterNearPlane: {value: 0.1, private: true},
    clusterFarPlane: {value: 100, private: true}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass<
  ClusteredDeferredLightingProps,
  ClusteredDeferredLightingUniforms,
  ClusteredDeferredLightingBindings
>;

/** Creates a fullscreen clustered deferred-lighting step for the previous color chain. */
export function createClusteredDeferredLightingShaderPassPipeline(): ShaderPassPipeline {
  return {
    name: 'clusteredDeferredLightingShaderPassPipeline',
    steps: [
      {
        shaderPass: clusteredDeferredLighting,
        inputs: {sourceTexture: 'previous'},
        output: 'previous'
      }
    ]
  };
}

function getClearClusterLightBitMaskSource(clusterCount: number, lightWordCount: number): string {
  return `\
const CLUSTER_LIGHT_MASK_WORD_COUNT: u32 = ${clusterCount * lightWordCount}u;
@group(0) @binding(0) var<storage, read_write> clusterLightBitMask: array<atomic<u32>>;
@compute @workgroup_size(${CLUSTER_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>
) {
  if (globalId.x < CLUSTER_LIGHT_MASK_WORD_COUNT) {
    atomicStore(&clusterLightBitMask[globalId.x], 0u);
  }
}`;
}

function getClusterBinningSource(
  clusterDimensions: readonly [number, number, number],
  maxLightCount: number
): string {
  return `\
const CLUSTER_COUNT_X: u32 = ${clusterDimensions[0]}u;
const CLUSTER_COUNT_Y: u32 = ${clusterDimensions[1]}u;
const CLUSTER_COUNT_Z: u32 = ${clusterDimensions[2]}u;
const MAX_LIGHT_COUNT: u32 = ${maxLightCount}u;
const LIGHT_WORD_COUNT: u32 = ${getLightWordCount(maxLightCount)}u;

struct ClusteredLightGridUniforms {
  projectionMatrix: mat4x4f,
  depthRange: vec2f,
  lightCount: u32,
  padding: u32,
};

struct ClusteredLightGridPointLight {
  positionRange: vec4f,
  colorIntensity: vec4f,
};

@group(0) @binding(0) var<storage, read> pointLights: array<ClusteredLightGridPointLight>;
@group(0) @binding(1) var<storage, read_write> clusterLightBitMask: array<atomic<u32>>;
@group(0) @binding(2) var<uniform> clusteredLightGrid: ClusteredLightGridUniforms;

fn clusteredLightGrid_getCoordinate(value: f32, size: u32) -> u32 {
  return min(u32(clamp(value, 0.0, 0.999999) * f32(size)), size - 1u);
}

fn clusteredLightGrid_getDepthSlice(distance: f32) -> u32 {
  let normalizedDepth = clamp(
    log(distance / clusteredLightGrid.depthRange.x) /
      log(clusteredLightGrid.depthRange.y / clusteredLightGrid.depthRange.x),
    0.0,
    0.999999
  );
  return min(u32(normalizedDepth * f32(CLUSTER_COUNT_Z)), CLUSTER_COUNT_Z - 1u);
}

@compute @workgroup_size(${CLUSTER_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>
) {
  let lightIndex = globalId.x;
  let lightCount = min(clusteredLightGrid.lightCount, min(MAX_LIGHT_COUNT, arrayLength(&pointLights)));
  if (lightIndex >= lightCount) {
    return;
  }

  let light = pointLights[lightIndex];
  let viewDepth = -light.positionRange.z;
  let minimumDepth = max(clusteredLightGrid.depthRange.x, viewDepth - light.positionRange.w);
  let maximumDepth = min(clusteredLightGrid.depthRange.y, viewDepth + light.positionRange.w);
  if (maximumDepth < clusteredLightGrid.depthRange.x ||
      minimumDepth > clusteredLightGrid.depthRange.y ||
      maximumDepth < minimumDepth) {
    return;
  }

  let centerClip = clusteredLightGrid.projectionMatrix * vec4f(light.positionRange.xyz, 1.0);
  if (centerClip.w <= 0.0) {
    return;
  }
  let centerNdc = centerClip.xy / centerClip.w;
  let radiusNdc = vec2f(
    abs(clusteredLightGrid.projectionMatrix[0][0]) * light.positionRange.w /
      max(minimumDepth, clusteredLightGrid.depthRange.x),
    abs(clusteredLightGrid.projectionMatrix[1][1]) * light.positionRange.w /
      max(minimumDepth, clusteredLightGrid.depthRange.x)
  );
  let centerUv = vec2f(centerNdc.x * 0.5 + 0.5, 0.5 - centerNdc.y * 0.5);
  let radiusUv = radiusNdc * 0.5;
  let unclampedMinimumUv = centerUv - radiusUv;
  let unclampedMaximumUv = centerUv + radiusUv;
  if (unclampedMaximumUv.x < 0.0 || unclampedMinimumUv.x > 1.0 ||
      unclampedMaximumUv.y < 0.0 || unclampedMinimumUv.y > 1.0) {
    return;
  }

  let minimumUv = clamp(unclampedMinimumUv, vec2f(0.0), vec2f(0.999999));
  let maximumUv = clamp(unclampedMaximumUv, vec2f(0.0), vec2f(0.999999));
  let minimumX = clusteredLightGrid_getCoordinate(minimumUv.x, CLUSTER_COUNT_X);
  let maximumX = clusteredLightGrid_getCoordinate(maximumUv.x, CLUSTER_COUNT_X);
  let minimumY = clusteredLightGrid_getCoordinate(minimumUv.y, CLUSTER_COUNT_Y);
  let maximumY = clusteredLightGrid_getCoordinate(maximumUv.y, CLUSTER_COUNT_Y);
  let minimumZ = clusteredLightGrid_getDepthSlice(minimumDepth);
  let maximumZ = clusteredLightGrid_getDepthSlice(maximumDepth);
  let lightWordIndex = lightIndex / 32u;
  let lightBit = 1u << (lightIndex % 32u);

  for (var depthSlice = minimumZ; depthSlice <= maximumZ; depthSlice++) {
    for (var tileY = minimumY; tileY <= maximumY; tileY++) {
      for (var tileX = minimumX; tileX <= maximumX; tileX++) {
        let clusterIndex = (depthSlice * CLUSTER_COUNT_Y + tileY) * CLUSTER_COUNT_X + tileX;
        atomicOr(&clusterLightBitMask[clusterIndex * LIGHT_WORD_COUNT + lightWordIndex], lightBit);
      }
    }
  }
}`;
}

function getCompactClusterLightListsSource(
  clusterCount: number,
  lightWordCount: number,
  maxLightsPerCluster: number,
  maxLightCount: number
): string {
  return `\
const CLUSTER_COUNT: u32 = ${clusterCount}u;
const LIGHT_WORD_COUNT: u32 = ${lightWordCount}u;
const MAX_LIGHTS_PER_CLUSTER: u32 = ${maxLightsPerCluster}u;
const MAX_LIGHT_COUNT: u32 = ${maxLightCount}u;

@group(0) @binding(0) var<storage, read_write> clusterLightBitMask: array<atomic<u32>>;
@group(0) @binding(1) var<storage, read_write> clusterLightCounts: array<u32>;
@group(0) @binding(2) var<storage, read_write> clusterLightIndices: array<u32>;

@compute @workgroup_size(${CLUSTER_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>
) {
  let clusterIndex = globalId.x;
  if (clusterIndex >= CLUSTER_COUNT) {
    return;
  }

  let maskOffset = clusterIndex * LIGHT_WORD_COUNT;
  let indexOffset = clusterIndex * MAX_LIGHTS_PER_CLUSTER;
  var lightCount = 0u;
  for (var lightIndex = 0u; lightIndex < MAX_LIGHT_COUNT; lightIndex++) {
    let lightWord = atomicLoad(&clusterLightBitMask[maskOffset + lightIndex / 32u]);
    let lightBit = 1u << (lightIndex % 32u);
    if ((lightWord & lightBit) != 0u) {
      if (lightCount < MAX_LIGHTS_PER_CLUSTER) {
        clusterLightIndices[indexOffset + lightCount] = lightIndex;
      }
      lightCount += 1u;
    }
  }
  clusterLightCounts[clusterIndex] = lightCount;
}`;
}

function getLightWordCount(maxLightCount: number): number {
  return Math.ceil(maxLightCount / 32);
}

function makeClusteredLightGridUniformData(options: ClusteredLightGridEncodeOptions): ArrayBuffer {
  const data = new ArrayBuffer(CLUSTERED_LIGHT_GRID_UNIFORM_BYTE_LENGTH);
  const floatValues = new Float32Array(data);
  floatValues.set(options.projectionMatrix, 0);
  floatValues[16] = options.nearPlane;
  floatValues[17] = options.farPlane;
  new Uint32Array(data)[18] = options.pointLightCount;
  return data;
}

function validateClusteredLightGridProps(
  clusterDimensions: readonly [number, number, number],
  maxLightsPerCluster: number,
  maxLightCount: number
): void {
  if (
    clusterDimensions.some(dimension => !Number.isSafeInteger(dimension) || dimension < 1) ||
    !Number.isSafeInteger(maxLightsPerCluster) ||
    maxLightsPerCluster < 1 ||
    !Number.isSafeInteger(maxLightCount) ||
    maxLightCount < 1
  ) {
    throw new Error('Cluster dimensions and capacities must be positive safe integers.');
  }
}

function validateClusteredLightGridEncodeOptions(
  options: ClusteredLightGridEncodeOptions,
  maxLightCount: number
): void {
  if (!Number.isSafeInteger(options.pointLightCount) || options.pointLightCount < 0) {
    throw new Error('Point light count must be a non-negative safe integer.');
  }
  if (options.pointLightCount > maxLightCount) {
    throw new Error('Point light count exceeds ClusteredLightGrid capacity.');
  }
  validateDepthRange(options.nearPlane, options.farPlane);
}

function validateDepthRange(nearPlane: number, farPlane: number): void {
  if (!(nearPlane > 0) || !(farPlane > nearPlane)) {
    throw new Error('Cluster depth range requires 0 < nearPlane < farPlane.');
  }
}
