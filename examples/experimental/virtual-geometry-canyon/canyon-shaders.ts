// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  CANYON_CLUSTER_GRID_SEGMENTS,
  CANYON_GEOMETRIC_ERROR_SCALE,
  CANYON_REFINEMENT_DEPTH,
  CANYON_ROOT_GRID_SIZE,
  CANYON_ROOT_WORLD_SIZE
} from './canyon-data';

const TERRAIN_HALF_EXTENT = (CANYON_ROOT_GRID_SIZE * CANYON_ROOT_WORLD_SIZE) / 2;

const CANYON_UNIFORMS = /* wgsl */ `
struct CanyonUniforms {
  viewProjectionMatrix: mat4x4f,
  cameraAndProjectionScale: vec4f,
  forwardAndAspect: vec4f,
  rightAndTanHalfFieldOfView: vec4f,
  upAndMaximumScreenSpaceError: vec4f,
  options: vec4f,
};
@group(0) @binding(3) var<uniform> uniforms: CanyonUniforms;
`;

const CANYON_TERRAIN_FUNCTIONS = /* wgsl */ `
fn canyonCenterX(worldZ: f32) -> f32 {
  return 280.0 * sin(worldZ * 0.0011) + 95.0 * sin(worldZ * 0.0037);
}

fn canyonNoiseHash(cell: vec2f) -> f32 {
  return fract(sin(dot(cell, vec2f(127.1, 311.7))) * 43758.5453);
}

fn canyonNoise(position: vec2f) -> f32 {
  let cell = floor(position);
  let amount = fract(position);
  let smoothAmount = amount * amount * (3.0 - 2.0 * amount);
  return mix(
    mix(canyonNoiseHash(cell), canyonNoiseHash(cell + vec2f(1.0, 0.0)), smoothAmount.x),
    mix(canyonNoiseHash(cell + vec2f(0.0, 1.0)), canyonNoiseHash(cell + vec2f(1.0)), smoothAmount.x),
    smoothAmount.y
  );
}

fn canyonRockDisplacement(worldX: f32, worldZ: f32, canyonCoordinate: f32) -> f32 {
  let wallDistance = abs(canyonCoordinate) - 0.74;
  let wallDetailAmount = 0.18 + 0.82 * exp(-wallDistance * wallDistance * 4.6);
  let warpX = (canyonNoise(vec2f(worldX, worldZ) * 0.009 + vec2f(17.3, -43.1)) - 0.5) * 42.0;
  let warpZ = (canyonNoise(vec2f(worldX, worldZ) * 0.009 + vec2f(-29.7, 11.8)) - 0.5) * 42.0;
  let detailPosition = vec2f(worldX + warpX, worldZ + warpZ);
  let broadCrags = (canyonNoise(detailPosition * 0.016) - 0.5) * 12.0;
  let mediumCrags = (canyonNoise(detailPosition * 0.041 + vec2f(31.4, -7.2)) - 0.5) * 5.6;
  let leafCrags = (canyonNoise(detailPosition * 0.105 + vec2f(-19.6, 53.7)) - 0.5) * 2.1;
  let microCrags = (canyonNoise(detailPosition * 0.22 + vec2f(73.2, 14.9)) - 0.5) * 0.6;
  let ribSignal = 1.0 - abs(canyonNoise(detailPosition * 0.028 + vec2f(9.7, -27.6)) * 2.0 - 1.0);
  let rockRibs = 3.2 * (pow(ribSignal, 4.0) - 0.2);
  let channelSignal = 1.0 - abs(canyonNoise(detailPosition * 0.052 + vec2f(-42.1, 38.5)) * 2.0 - 1.0);
  let erosionChannels = -2.6 * pow(channelSignal, 7.0);
  return wallDetailAmount *
    (broadCrags + mediumCrags + leafCrags + microCrags + rockRibs + erosionChannels);
}

fn terrainHeight(worldPosition: vec2f) -> f32 {
  let worldX = worldPosition.x;
  let worldZ = worldPosition.y;
  let center = canyonCenterX(worldZ);
  let width = 185.0 + 34.0 * sin(worldZ * 0.0023) + 18.0 * sin(worldZ * 0.0071 + 0.8);
  let canyonCoordinate = (worldX - center) / width;
  let canyonCut = 205.0 * exp(-canyonCoordinate * canyonCoordinate * 1.15);
  let innerGorge = 62.0 * exp(-canyonCoordinate * canyonCoordinate * 8.0);
  let plateau = 18.0 * sin(worldX * 0.0032 + sin(worldZ * 0.0021) * 1.4) *
    cos(worldZ * 0.0038);
  let mesaSweep = 10.0 * sin((worldX + worldZ) * 0.0075);
  let rockFold = 6.0 * cos((worldX - worldZ) * 0.013);
  let wallRoughness = 11.0 * sin(worldZ * 0.018 + worldX * 0.006) *
    exp(-abs(canyonCoordinate) * 0.72);
  let terraceWallAmount = exp(-pow(abs(canyonCoordinate) - 0.78, 2.0) * 5.5);
  let erosionTerraces = 6.5 * sin(canyonCut * 0.11 + worldZ * 0.006) * terraceWallAmount;
  let rockDetail = canyonRockDisplacement(worldX, worldZ, canyonCoordinate);
  let longWave = 8.0 * sin(worldZ * 0.0015);
  return 215.0 - canyonCut - innerGorge + plateau + mesaSweep + rockFold + wallRoughness +
    erosionTerraces + rockDetail + longWave;
}

fn parentTriangleHeight(worldPosition: vec2f, childHalfSize: f32) -> f32 {
  let parentWorldSize = childHalfSize * 4.0;
  let terrainOrigin = vec2f(-${TERRAIN_HALF_EXTENT.toFixed(1)});
  let parentCellMaximum = vec2f(${(TERRAIN_HALF_EXTENT * 2).toFixed(1)} / parentWorldSize - 1.0);
  let parentCell = clamp(
    floor((worldPosition - terrainOrigin) / parentWorldSize),
    vec2f(0.0),
    parentCellMaximum
  );
  let parentMinimum = terrainOrigin + parentCell * parentWorldSize;
  let gridPosition = clamp(
    (worldPosition - parentMinimum) / parentWorldSize * ${CANYON_CLUSTER_GRID_SEGMENTS.toFixed(1)},
    vec2f(0.0),
    vec2f(${(CANYON_CLUSTER_GRID_SEGMENTS - 0.0001).toFixed(4)})
  );
  let gridCell = floor(gridPosition);
  let cellAmount = fract(gridPosition);
  let cellSize = parentWorldSize / ${CANYON_CLUSTER_GRID_SEGMENTS.toFixed(1)};
  let bottomLeftPosition = parentMinimum + gridCell * cellSize;
  let bottomLeft = terrainHeight(bottomLeftPosition);
  let bottomRight = terrainHeight(bottomLeftPosition + vec2f(cellSize, 0.0));
  let topLeft = terrainHeight(bottomLeftPosition + vec2f(0.0, cellSize));
  let topRight = terrainHeight(bottomLeftPosition + vec2f(cellSize));
  if (cellAmount.x + cellAmount.y <= 1.0) {
    return bottomLeft + cellAmount.x * (bottomRight - bottomLeft) +
      cellAmount.y * (topLeft - bottomLeft);
  }
  return topRight + (1.0 - cellAmount.x) * (topLeft - topRight) +
    (1.0 - cellAmount.y) * (bottomRight - topRight);
}
`;

export type CanyonVisualizationOptions = {
  timeSeconds: number;
  debugLOD: boolean;
  wireframe: boolean;
  terrainHalfExtent: number;
};

/** Packs the CPU visualization state into the shader's `options` uniform. */
export function makeCanyonVisualizationOptions({
  timeSeconds,
  debugLOD,
  wireframe,
  terrainHalfExtent
}: CanyonVisualizationOptions): [number, number, number, number] {
  return [timeSeconds, debugLOD ? 1 : 0, wireframe ? 1 : 0, terrainHalfExtent];
}

export const CANYON_RENDER_SHADER = /* wgsl */ `
${CANYON_UNIFORMS}
${CANYON_TERRAIN_FUNCTIONS}

@group(0) @binding(0) var<storage, read> selectedClusterIds: array<u32>;
@group(0) @binding(1) var<storage, read> clusterMetadata: array<vec4f>;
@group(0) @binding(2) var<storage, read> clusterBounds: array<vec4f>;

struct VertexInputs {
  @location(0) localCoordinates: vec4f,
};

struct FragmentInputs {
  @builtin(position) position: vec4f,
  @location(0) worldPosition: vec3f,
  @location(1) worldNormal: vec3f,
  @location(2) localPosition: vec2f,
  @location(3) @interpolate(flat) level: f32,
  @location(4) skirt: f32,
  @location(5) @interpolate(flat) morphAmount: f32,
  @location(6) @interpolate(flat) edgeCode: f32,
};

fn getMorphAmount(metadata: vec4f, bounds: vec4f) -> f32 {
  if (metadata.w < 0.5) {
    return 1.0;
  }
  let cameraPosition = uniforms.cameraAndProjectionScale.xyz;
  let projectionScale = uniforms.cameraAndProjectionScale.w;
  let maximumError = max(uniforms.upAndMaximumScreenSpaceError.w, 0.001);
  let parentError = metadata.z * 2.0 * ${CANYON_GEOMETRIC_ERROR_SCALE.toFixed(4)};
  let approximateParentRadius = bounds.w + metadata.z * 1.45;
  let distanceToSurface = max(distance(cameraPosition, bounds.xyz) - approximateParentRadius, 1.0);
  let parentProjectedError = parentError * projectionScale / distanceToSurface;
  return smoothstep(maximumError, maximumError * 1.8, parentProjectedError);
}

@vertex fn vertexMain(
  inputs: VertexInputs,
  @builtin(instance_index) instanceIndex: u32
) -> FragmentInputs {
  let clusterId = selectedClusterIds[instanceIndex];
  let metadata = clusterMetadata[clusterId];
  let bounds = clusterBounds[clusterId];
  let worldXZ = metadata.xy + inputs.localCoordinates.xy * metadata.z;
  let fullHeight = terrainHeight(worldXZ);
  let morphAmount = getMorphAmount(metadata, bounds);
  let parentHeight = select(fullHeight, parentTriangleHeight(worldXZ, metadata.z), metadata.w > 0.5);
  var worldY = mix(parentHeight, fullHeight, morphAmount);
  let skirt = inputs.localCoordinates.z;
  worldY -= skirt * max(2.5, metadata.z * 0.11);

  let normalSampleDistance = max(0.45, metadata.z / ${CANYON_CLUSTER_GRID_SEGMENTS.toFixed(1)} * 0.16);
  let heightLeft = terrainHeight(worldXZ - vec2f(normalSampleDistance, 0.0));
  let heightRight = terrainHeight(worldXZ + vec2f(normalSampleDistance, 0.0));
  let heightBack = terrainHeight(worldXZ - vec2f(0.0, normalSampleDistance));
  let heightFront = terrainHeight(worldXZ + vec2f(0.0, normalSampleDistance));
  var normal = normalize(vec3f(heightLeft - heightRight, normalSampleDistance * 2.0, heightBack - heightFront));
  let edgeCode = inputs.localCoordinates.w;
  if (skirt > 0.5 || abs(edgeCode) > 0.5) {
    if (abs(edgeCode) < 1.5) {
      normal = vec3f(sign(edgeCode), 0.0, 0.0);
    } else {
      normal = vec3f(0.0, 0.0, sign(edgeCode));
    }
  }

  let worldPosition = vec3f(worldXZ.x, worldY, worldXZ.y);
  var output: FragmentInputs;
  output.position = uniforms.viewProjectionMatrix * vec4f(worldPosition, 1.0);
  output.worldPosition = worldPosition;
  output.worldNormal = normal;
  output.localPosition = inputs.localCoordinates.xy;
  output.level = metadata.w;
  output.skirt = skirt;
  output.morphAmount = morphAmount;
  output.edgeCode = edgeCode;
  return output;
}

fn levelColor(level: f32) -> vec3f {
  let phase = level * 1.31;
  return 0.55 + 0.45 * cos(vec3f(phase, phase + 2.1, phase + 4.2));
}

fn acesToneMap(color: vec3f) -> vec3f {
  let mapped = (color * (2.51 * color + 0.03)) / (color * (2.43 * color + 0.59) + 0.14);
  return clamp(mapped, vec3f(0.0), vec3f(1.0));
}

fn antialiasedLineCoverage(distanceToLine: f32, coordinateWidth: f32) -> f32 {
  let width = max(coordinateWidth, 0.0001);
  return 1.0 - smoothstep(width * 0.18, width * 0.72, distanceToLine);
}

fn cellWireframeCoverage(cellPosition: vec2f, coordinateWidth: vec2f) -> f32 {
  let cellEdgeDistance = min(cellPosition, vec2f(1.0) - cellPosition);
  let cellEdgeCoverage = max(
    antialiasedLineCoverage(cellEdgeDistance.x, coordinateWidth.x),
    antialiasedLineCoverage(cellEdgeDistance.y, coordinateWidth.y)
  );
  // The indexed grid splits every cell from bottom-right to top-left.
  let diagonalDistance = abs(cellPosition.x + cellPosition.y - 1.0);
  let diagonalCoverage = antialiasedLineCoverage(
    diagonalDistance,
    max(coordinateWidth.x + coordinateWidth.y, 0.0001)
  );
  return max(cellEdgeCoverage, diagonalCoverage);
}

fn triangleWireframeCoverage(inputs: FragmentInputs) -> vec2f {
  let gridPosition =
    (inputs.localPosition * 0.5 + vec2f(0.5)) * ${CANYON_CLUSTER_GRID_SEGMENTS.toFixed(1)};
  let gridCoordinateWidth = fwidth(gridPosition);
  let localCoordinateWidth = fwidth(inputs.localPosition);
  var edgeProgress = select(
    inputs.localPosition.x * 0.5 + 0.5,
    inputs.localPosition.y * 0.5 + 0.5,
    abs(inputs.edgeCode) < 1.5
  );
  // Right and bottom skirts were authored in descending local-coordinate order.
  if (inputs.edgeCode == 1.0 || inputs.edgeCode == -2.0) {
    edgeProgress = 1.0 - edgeProgress;
  }
  let skirtGridPosition = vec2f(
    edgeProgress * ${CANYON_CLUSTER_GRID_SEGMENTS.toFixed(1)},
    inputs.skirt
  );
  let skirtCoordinateWidth = fwidth(skirtGridPosition);

  if (abs(inputs.edgeCode) < 0.5) {
    let triangleCoverage = cellWireframeCoverage(fract(gridPosition), gridCoordinateWidth);
    let triangleVisibility = 1.0 - smoothstep(
      0.25,
      0.8,
      max(gridCoordinateWidth.x, gridCoordinateWidth.y)
    );
    let clusterEdgeDistance = min(
      1.0 - abs(inputs.localPosition.x),
      1.0 - abs(inputs.localPosition.y)
    );
    let clusterCoverage = antialiasedLineCoverage(
      max(clusterEdgeDistance, 0.0),
      max(localCoordinateWidth.x, localCoordinateWidth.y) * 1.35
    );
    let clusterVisibility = 1.0 - smoothstep(
      0.08,
      0.38,
      max(localCoordinateWidth.x, localCoordinateWidth.y)
    );
    return vec2f(
      triangleCoverage * triangleVisibility,
      clusterCoverage * clusterVisibility
    );
  }

  let skirtCellPosition = vec2f(fract(skirtGridPosition.x), clamp(inputs.skirt, 0.0, 1.0));
  let skirtTriangleVisibility = 1.0 - smoothstep(
    0.25,
    0.8,
    max(skirtCoordinateWidth.x, skirtCoordinateWidth.y)
  );
  return vec2f(
    cellWireframeCoverage(skirtCellPosition, skirtCoordinateWidth) * skirtTriangleVisibility,
    0.0
  );
}

@fragment fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  let normal = normalize(inputs.worldNormal);
  let cameraPosition = uniforms.cameraAndProjectionScale.xyz;
  let viewDirection = normalize(cameraPosition - inputs.worldPosition);
  let sunDirection = normalize(vec3f(-0.34, 0.82, -0.45));
  let halfDirection = normalize(sunDirection + viewDirection);
  let directLight = max(dot(normal, sunDirection), 0.0);
  let specular = pow(max(dot(normal, halfDirection), 0.0), 18.0);
  let broadVariation = 0.5 + 0.5 * sin(inputs.worldPosition.x * 0.004 + inputs.worldPosition.z * 0.006);
  let strataBand = 0.5 + 0.5 * sin(
    inputs.worldPosition.y * 0.132 + inputs.worldPosition.x * 0.004 + inputs.worldPosition.z * 0.003
  );
  let strataLedge = pow(strataBand, 13.0);
  let wallAmount = smoothstep(0.18, 0.65, clamp(1.0 - normal.y, 0.0, 1.0));
  let heightAmount = clamp((inputs.worldPosition.y + 80.0) / 340.0, 0.0, 1.0);
  let rockDark = vec3f(0.065, 0.014, 0.01);
  let rockWarm = vec3f(0.61, 0.145, 0.04);
  let rockPale = vec3f(1.04, 0.46, 0.14);
  var albedo = mix(rockDark, rockWarm, 0.28 + heightAmount * 0.34 + broadVariation * 0.12);
  let strataCrevice = pow(1.0 - strataBand, 9.0);
  albedo = mix(albedo, rockPale, strataLedge * wallAmount * 0.5);
  albedo = mix(albedo, rockDark, strataCrevice * wallAmount * 0.52);
  let stoneVariation = canyonNoise(inputs.worldPosition.xz * 0.018) * 0.68 +
    canyonNoise(inputs.worldPosition.xz * 0.061) * 0.32;
  albedo *= 0.82 + stoneVariation * 0.28;
  let grainCoordinates = vec2f(
    inputs.worldPosition.x + inputs.worldPosition.y * 0.43,
    inputs.worldPosition.z - inputs.worldPosition.y * 0.21
  );
  albedo *= 0.92 + canyonNoise(grainCoordinates * 0.052) * 0.14;
  let canyonDistance = abs(inputs.worldPosition.x - canyonCenterX(inputs.worldPosition.z));
  let canyonOcclusion = mix(0.55, 1.0, smoothstep(70.0, 430.0, canyonDistance));
  let skyFill = 0.17 + max(normal.y, 0.0) * 0.25 + wallAmount * 0.09;
  let backScatter = pow(max(dot(viewDirection, -sunDirection), 0.0), 4.0) * 0.12;
  var color = albedo * (skyFill + directLight * 1.75 * canyonOcclusion + backScatter);
  color += vec3f(0.032, 0.055, 0.105) * (0.35 + max(normal.y, 0.0) * 0.65);
  color += vec3f(1.1, 0.33, 0.08) * specular * 0.035;
  color *= mix(1.0, 0.46, inputs.skirt);

  if (uniforms.options.y > 0.5) {
    let gridPosition = (inputs.localPosition * 0.5 + vec2f(0.5)) * ${CANYON_CLUSTER_GRID_SEGMENTS.toFixed(1)};
    let gridDistance = min(fract(gridPosition), vec2f(1.0) - fract(gridPosition));
    let derivativeWidth = max(fwidth(gridPosition), vec2f(0.001));
    let gridLine = 1.0 - smoothstep(0.0, max(derivativeWidth.x, derivativeWidth.y) * 1.25, min(gridDistance.x, gridDistance.y));
    let debugColor = levelColor(inputs.level);
    color = mix(debugColor * (0.42 + directLight * 0.75), vec3f(0.02), gridLine * 0.8);
    color = mix(color, vec3f(1.0, 0.96, 0.28), (1.0 - inputs.morphAmount) * 0.22);
  }

  if (uniforms.options.z > 0.5) {
    let wireframeCoverage = triangleWireframeCoverage(inputs);
    let triangleColor = vec3f(0.34, 0.055, 0.012);
    let clusterColor = vec3f(0.02, 0.36, 0.55);
    let wireColor = mix(triangleColor, clusterColor, wireframeCoverage.y);
    color *= 0.08;
    color = mix(color, wireColor, max(wireframeCoverage.x * 0.92, wireframeCoverage.y));
  }

  let viewDistance = distance(cameraPosition, inputs.worldPosition);
  let fogAmount = 1.0 - exp(-viewDistance * 0.00036);
  let fogColor = mix(vec3f(0.24, 0.17, 0.18), vec3f(0.61, 0.28, 0.14), clamp(normal.y, 0.0, 1.0));
  color = mix(color, fogColor, clamp(fogAmount, 0.0, 0.78));
  return vec4f(acesToneMap(color), 1.0);
}
`;

export const CANYON_SKY_SHADER = /* wgsl */ `
${CANYON_UNIFORMS}

struct SkyOutput {
  @builtin(position) position: vec4f,
  @location(0) clipPosition: vec2f,
};

@vertex fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> SkyOutput {
  let positions = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  var output: SkyOutput;
  output.position = vec4f(positions[vertexIndex], 0.9999, 1.0);
  output.clipPosition = positions[vertexIndex];
  return output;
}

@fragment fn fragmentMain(inputs: SkyOutput) -> @location(0) vec4f {
  let forward = uniforms.forwardAndAspect.xyz;
  let aspect = uniforms.forwardAndAspect.w;
  let right = uniforms.rightAndTanHalfFieldOfView.xyz;
  let tanHalfFieldOfView = uniforms.rightAndTanHalfFieldOfView.w;
  let up = uniforms.upAndMaximumScreenSpaceError.xyz;
  let rayDirection = normalize(
    forward + right * inputs.clipPosition.x * aspect * tanHalfFieldOfView +
      up * inputs.clipPosition.y * tanHalfFieldOfView
  );
  let horizonAmount = smoothstep(-0.16, 0.48, rayDirection.y);
  let zenith = vec3f(0.055, 0.12, 0.25);
  let horizon = vec3f(0.92, 0.38, 0.13);
  var color = mix(horizon, zenith, horizonAmount);
  let sunDirection = normalize(vec3f(-0.34, 0.82, -0.45));
  let sunAlignment = max(dot(rayDirection, sunDirection), 0.0);
  let sunDisc = smoothstep(0.99925, 0.99978, sunAlignment);
  let sunGlow = pow(sunAlignment, 72.0);
  color += vec3f(4.8, 2.1, 0.65) * sunDisc + vec3f(1.1, 0.34, 0.08) * sunGlow;
  let hazeCoordinate = rayDirection.x * 4.7 + rayDirection.z * 3.2 + uniforms.options.x * 0.018;
  let haze = pow(0.5 + 0.5 * sin(hazeCoordinate + sin(hazeCoordinate * 0.57) * 2.0), 8.0);
  color += vec3f(0.35, 0.18, 0.13) * haze * (1.0 - horizonAmount) * 0.14;
  let mapped = (color * (2.51 * color + 0.03)) / (color * (2.43 * color + 0.59) + 0.14);
  return vec4f(clamp(mapped, vec3f(0.0), vec3f(1.0)), 1.0);
}
`;

/** Shader-level public constants are exported for focused drift tests. */
export const CANYON_SHADER_CONSTANTS = Object.freeze({
  clusterGridSegments: CANYON_CLUSTER_GRID_SEGMENTS,
  refinementDepth: CANYON_REFINEMENT_DEPTH,
  terrainHalfExtent: TERRAIN_HALF_EXTENT
});
