// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {CommandEncoder, Device} from '@luma.gl/core';
import {assert, Buffer} from '@luma.gl/core';
import {Computation} from '../compute/computation';
import type {Matrix4Like} from '@math.gl/core';

/** Byte layout of each point-light record. The grid ignores the consumer payload. */
export const CLUSTERED_POINT_LIGHT_LAYOUT = Object.freeze({
  byteStride: 32,
  positionByteOffset: 0,
  radiusByteOffset: 12,
  payloadByteOffset: 16
});

/** Compatibility name for the renderer-independent uniform snapshot. */
export type ClusteredLightGridShaderPassUniforms = ClusteredLightGridUniforms;

export const MAX_CLUSTERED_POINT_LIGHTS = 512;
export const DEFAULT_CLUSTER_DIMENSIONS = [16, 9, 24] as const;
export const DEFAULT_MAX_LIGHTS_PER_CLUSTER = 64;

const CLUSTER_WORKGROUP_SIZE = 64;
const CLUSTERED_LIGHT_GRID_UNIFORM_BYTE_LENGTH = 80;

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
  /** View-space point-light records following CLUSTERED_POINT_LIGHT_LAYOUT. */
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

/** Storage bindings available to lighting consumers. */
export type ClusteredLightGridBindings = {
  clusterLightCounts: Buffer;
  clusterLightIndices: Buffer;
};

/** Uniform values available to lighting consumers to locate one pixel's cluster. */
export type ClusteredLightGridUniforms = {
  clusterCountX: number;
  clusterCountY: number;
  clusterCountZ: number;
  maxLightsPerCluster: number;
  pointLightCount: number;
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
  private activePointLightCount = 0;
  private depthRange: readonly [number, number] | null = null;
  private destroyed = false;

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
    // Resources and encoder must be live and belong to this grid's device.
    assert(!this.destroyed && !options.pointLights.destroyed && !commandEncoder.destroyed);
    assert(options.pointLights.device === this.device && commandEncoder.device === this.device);
    validateClusteredLightGridEncodeOptions(options, this.maxLightCount);
    // The active prefix must fit in a storage buffer of complete point-light records.
    assert(Boolean(options.pointLights.usage & Buffer.STORAGE));
    assert(
      options.pointLights.byteLength >=
        Math.max(1, options.pointLightCount) * CLUSTERED_POINT_LIGHT_LAYOUT.byteStride
    );
    this.depthRange = [options.nearPlane, options.farPlane];
    this.activePointLightCount = options.pointLightCount;
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

  /** Returns the storage bindings available to lighting consumers. */
  getBindings(): ClusteredLightGridBindings {
    assert(!this.destroyed);
    return {
      clusterLightCounts: this.clusterLightCounts,
      clusterLightIndices: this.clusterLightIndices
    };
  }

  /** Compatibility accessor for shader-pass consumers. */
  getShaderPassBindings(): ClusteredLightGridBindings {
    return this.getBindings();
  }

  /** Returns a snapshot matching the latest encode. Encode before requesting uniforms. */
  getUniforms(): ClusteredLightGridUniforms {
    // A grid must be encoded before its camera/depth metadata can be consumed.
    assert(!this.destroyed && this.depthRange);
    return this.getShaderPassUniforms(this.depthRange[0], this.depthRange[1]);
  }

  /** Returns the scalar uniforms available to lighting consumers. */
  getShaderPassUniforms(nearPlane: number, farPlane: number): ClusteredLightGridUniforms {
    assert(!this.destroyed);
    validateDepthRange(nearPlane, farPlane);
    return {
      clusterCountX: this.clusterDimensions[0],
      clusterCountY: this.clusterDimensions[1],
      clusterCountZ: this.clusterDimensions[2],
      maxLightsPerCluster: this.maxLightsPerCluster,
      pointLightCount: this.activePointLightCount,
      clusterNearPlane: nearPlane,
      clusterFarPlane: farPlane
    };
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.clearComputation.destroy();
    this.binningComputation.destroy();
    this.compactComputation.destroy();
    this.uniformBuffer.destroy();
    this.clusterLightBitMask.destroy();
    this.clusterLightCounts.destroy();
    this.clusterLightIndices.destroy();
  }
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
  payload: vec4f,
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

  let isOrthographicProjection = abs(clusteredLightGrid.projectionMatrix[3][3]) > 0.5;
  var minimumUv = vec2f(0.0);
  var maximumUv = vec2f(0.999999);
  // A sphere crossing the camera plane conservatively covers the viewport.
  if (isOrthographicProjection || viewDepth > light.positionRange.w) {
    let projectionScale = vec2f(clusteredLightGrid.projectionMatrix[0][0], clusteredLightGrid.projectionMatrix[1][1]);
    let lower = projectionScale * (light.positionRange.xy - vec2f(light.positionRange.w));
    let upper = projectionScale * (light.positionRange.xy + vec2f(light.positionRange.w));
    var minimumNdc = min(lower, upper) + clusteredLightGrid.projectionMatrix[3].xy;
    var maximumNdc = max(lower, upper) + clusteredLightGrid.projectionMatrix[3].xy;
    if (!isOrthographicProjection) {
      // Project the enclosing box at both depth extremes, including off-axis centers.
      let nearestDepth = max(minimumDepth, clusteredLightGrid.depthRange.x);
      let farthestDepth = max(maximumDepth, nearestDepth);
      minimumNdc = min(min(lower / nearestDepth, upper / nearestDepth), min(lower / farthestDepth, upper / farthestDepth)) - clusteredLightGrid.projectionMatrix[2].xy;
      maximumNdc = max(max(lower / nearestDepth, upper / nearestDepth), max(lower / farthestDepth, upper / farthestDepth)) - clusteredLightGrid.projectionMatrix[2].xy;
    }
    let unclampedMinimumUv = vec2f(minimumNdc.x * 0.5 + 0.5, 0.5 - maximumNdc.y * 0.5);
    let unclampedMaximumUv = vec2f(maximumNdc.x * 0.5 + 0.5, 0.5 - minimumNdc.y * 0.5);
    if (unclampedMaximumUv.x < 0.0 || unclampedMinimumUv.x > 1.0 ||
        unclampedMaximumUv.y < 0.0 || unclampedMinimumUv.y > 1.0) {
      return;
    }

    minimumUv = clamp(unclampedMinimumUv, vec2f(0.0), vec2f(0.999999));
    maximumUv = clamp(unclampedMaximumUv, vec2f(0.0), vec2f(0.999999));
  }
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
