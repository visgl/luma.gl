// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export const CANYON_ROOT_GRID_SIZE = 4;
export const CANYON_REFINEMENT_DEPTH = 6;
export const CANYON_ROOT_WORLD_SIZE = 1024;
export const CANYON_CLUSTER_GRID_SEGMENTS = 16;
export const CANYON_GEOMETRIC_ERROR_SCALE = 0.72;
export const CANYON_MINIMUM_HEIGHT = -112;
export const CANYON_MAXIMUM_HEIGHT = 297;

const CANYON_MAXIMUM_TERRAIN_SLOPE = 9.5;
const CANYON_BOUND_SAMPLE_SEGMENTS = 3;

export type VirtualGeometryCanyonHierarchyOptions = {
  rootGridSize?: number;
  refinementDepth?: number;
  rootWorldSize?: number;
  clusterGridSegments?: number;
};

export type VirtualGeometryCanyonHierarchy = {
  sphereBounds: Float32Array;
  geometricErrors: Float32Array;
  children: Uint32Array;
  clusterIds: Uint32Array;
  clusterMetadata: Float32Array;
  levelOffsets: readonly number[];
  rootGridSize: number;
  refinementDepth: number;
  rootWorldSize: number;
  terrainHalfExtent: number;
  nodeCount: number;
  leafClusterCount: number;
  clusterTriangleCount: number;
  potentialTriangleCount: number;
};

export type CanyonClusterMeshData = {
  vertices: Float32Array;
  indices: Uint32Array;
  gridSegments: number;
  topTriangleCount: number;
  skirtTriangleCount: number;
  triangleCount: number;
};

type CanyonNodeSeed = {
  centerX: number;
  centerZ: number;
  halfSize: number;
};

/** Winding center line shared by terrain generation and the guided camera. */
export function getCanyonCenterX(worldZ: number): number {
  return 280 * Math.sin(worldZ * 0.0011) + 95 * Math.sin(worldZ * 0.0037);
}

/** Continuous procedural terrain function mirrored by the WebGPU vertex shader. */
export function getCanyonTerrainHeight(worldX: number, worldZ: number): number {
  const canyonCenter = getCanyonCenterX(worldZ);
  const canyonWidth = 185 + 34 * Math.sin(worldZ * 0.0023) + 18 * Math.sin(worldZ * 0.0071 + 0.8);
  const canyonCoordinate = (worldX - canyonCenter) / canyonWidth;
  const canyonCut = 205 * Math.exp(-canyonCoordinate * canyonCoordinate * 1.15);
  const innerGorge = 62 * Math.exp(-canyonCoordinate * canyonCoordinate * 8);
  const plateau =
    18 * Math.sin(worldX * 0.0032 + Math.sin(worldZ * 0.0021) * 1.4) * Math.cos(worldZ * 0.0038);
  const mesaSweep = 10 * Math.sin((worldX + worldZ) * 0.0075);
  const rockFold = 6 * Math.cos((worldX - worldZ) * 0.013);
  const wallRoughness =
    11 * Math.sin(worldZ * 0.018 + worldX * 0.006) * Math.exp(-Math.abs(canyonCoordinate) * 0.72);
  const terraceWallAmount = Math.exp(-Math.pow(Math.abs(canyonCoordinate) - 0.78, 2) * 5.5);
  const erosionTerraces = 6.5 * Math.sin(canyonCut * 0.11 + worldZ * 0.006) * terraceWallAmount;
  const rockDetail = getCanyonRockDisplacement(worldX, worldZ, canyonCoordinate);
  const longWave = 8 * Math.sin(worldZ * 0.0015);
  return (
    215 -
    canyonCut -
    innerGorge +
    plateau +
    mesaSweep +
    rockFold +
    wallRoughness +
    erosionTerraces +
    rockDetail +
    longWave
  );
}

/** Continuous multi-scale ribs and erosion that remain deterministic across every LOD cluster. */
function getCanyonRockDisplacement(
  worldX: number,
  worldZ: number,
  canyonCoordinate: number
): number {
  const wallDistance = Math.abs(canyonCoordinate) - 0.74;
  const wallDetailAmount = 0.18 + 0.82 * Math.exp(-wallDistance * wallDistance * 4.6);
  const warpX = (getCanyonNoise(worldX * 0.009 + 17.3, worldZ * 0.009 - 43.1) - 0.5) * 42;
  const warpZ = (getCanyonNoise(worldX * 0.009 - 29.7, worldZ * 0.009 + 11.8) - 0.5) * 42;
  const detailX = worldX + warpX;
  const detailZ = worldZ + warpZ;
  const broadCrags = (getCanyonNoise(detailX * 0.016, detailZ * 0.016) - 0.5) * 12;
  const mediumCrags = (getCanyonNoise(detailX * 0.041 + 31.4, detailZ * 0.041 - 7.2) - 0.5) * 5.6;
  const leafCrags = (getCanyonNoise(detailX * 0.105 - 19.6, detailZ * 0.105 + 53.7) - 0.5) * 2.1;
  const microCrags = (getCanyonNoise(detailX * 0.22 + 73.2, detailZ * 0.22 + 14.9) - 0.5) * 0.6;
  const ribSignal =
    1 - Math.abs(getCanyonNoise(detailX * 0.028 + 9.7, detailZ * 0.028 - 27.6) * 2 - 1);
  const rockRibs = 3.2 * (Math.pow(ribSignal, 4) - 0.2);
  const channelSignal =
    1 - Math.abs(getCanyonNoise(detailX * 0.052 - 42.1, detailZ * 0.052 + 38.5) * 2 - 1);
  const erosionChannels = -2.6 * Math.pow(channelSignal, 7);
  return (
    wallDetailAmount *
    (broadCrags + mediumCrags + leafCrags + microCrags + rockRibs + erosionChannels)
  );
}

function getCanyonNoise(worldX: number, worldZ: number): number {
  const cellX = Math.floor(worldX);
  const cellZ = Math.floor(worldZ);
  const amountX = worldX - cellX;
  const amountZ = worldZ - cellZ;
  const smoothX = amountX * amountX * (3 - 2 * amountX);
  const smoothZ = amountZ * amountZ * (3 - 2 * amountZ);
  const bottom = interpolate(
    getCanyonNoiseHash(cellX, cellZ),
    getCanyonNoiseHash(cellX + 1, cellZ),
    smoothX
  );
  const top = interpolate(
    getCanyonNoiseHash(cellX, cellZ + 1),
    getCanyonNoiseHash(cellX + 1, cellZ + 1),
    smoothX
  );
  return interpolate(bottom, top, smoothZ);
}

function getCanyonNoiseHash(cellX: number, cellZ: number): number {
  const value = Math.sin(cellX * 127.1 + cellZ * 311.7) * 43_758.5453;
  return value - Math.floor(value);
}

function interpolate(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

/** Builds a breadth-ordered quadtree forest and conservative per-node sphere bounds. */
export function makeVirtualGeometryCanyonHierarchy(
  options: VirtualGeometryCanyonHierarchyOptions = {}
): VirtualGeometryCanyonHierarchy {
  const rootGridSize = options.rootGridSize ?? CANYON_ROOT_GRID_SIZE;
  const refinementDepth = options.refinementDepth ?? CANYON_REFINEMENT_DEPTH;
  const rootWorldSize = options.rootWorldSize ?? CANYON_ROOT_WORLD_SIZE;
  const clusterGridSegments = options.clusterGridSegments ?? CANYON_CLUSTER_GRID_SEGMENTS;
  validateHierarchyOptions(rootGridSize, refinementDepth, rootWorldSize, clusterGridSegments);

  const rootCount = rootGridSize * rootGridSize;
  const levelCounts = Array.from(
    {length: refinementDepth + 1},
    (_, level) => rootCount * 4 ** level
  );
  const levelOffsets: number[] = [0];
  for (const levelCount of levelCounts) {
    levelOffsets.push(levelOffsets[levelOffsets.length - 1] + levelCount);
  }
  const nodeCount = levelOffsets[levelOffsets.length - 1];
  const leafClusterCount = levelCounts[levelCounts.length - 1];
  const clusterTriangleCount = getClusterTriangleCount(clusterGridSegments);

  const sphereBounds = new Float32Array(nodeCount * 4);
  const geometricErrors = new Float32Array(nodeCount);
  const children = new Uint32Array(nodeCount * 2);
  const clusterIds = new Uint32Array(nodeCount);
  const clusterMetadata = new Float32Array(nodeCount * 4);
  const terrainHalfExtent = (rootGridSize * rootWorldSize) / 2;

  let currentLevel = makeRootSeeds(rootGridSize, rootWorldSize);
  for (let level = 0; level <= refinementDepth; level++) {
    const levelOffset = levelOffsets[level];
    const nextLevelOffset = levelOffsets[level + 1];
    const nextLevel: CanyonNodeSeed[] = [];
    for (let localIndex = 0; localIndex < currentLevel.length; localIndex++) {
      const nodeIndex = levelOffset + localIndex;
      const node = currentLevel[localIndex];
      const bounds = getConservativeNodeBounds(node);
      sphereBounds.set(bounds, nodeIndex * 4);
      geometricErrors[nodeIndex] =
        level === refinementDepth ? 0 : node.halfSize * CANYON_GEOMETRIC_ERROR_SCALE;
      clusterIds[nodeIndex] = nodeIndex;
      clusterMetadata.set([node.centerX, node.centerZ, node.halfSize, level], nodeIndex * 4);

      if (level < refinementDepth) {
        const firstChild = nextLevelOffset + localIndex * 4;
        children[nodeIndex * 2] = firstChild;
        children[nodeIndex * 2 + 1] = 4;
        appendChildSeeds(nextLevel, node);
      }
    }
    currentLevel = nextLevel;
  }

  return {
    sphereBounds,
    geometricErrors,
    children,
    clusterIds,
    clusterMetadata,
    levelOffsets: Object.freeze(levelOffsets),
    rootGridSize,
    refinementDepth,
    rootWorldSize,
    terrainHalfExtent,
    nodeCount,
    leafClusterCount,
    clusterTriangleCount,
    potentialTriangleCount: leafClusterCount * clusterTriangleCount
  };
}

/** Creates one indexed 17x17 terrain grid plus four independently shaded skirts. */
export function makeCanyonClusterMeshData(
  gridSegments = CANYON_CLUSTER_GRID_SEGMENTS
): CanyonClusterMeshData {
  if (!Number.isSafeInteger(gridSegments) || gridSegments < 2) {
    throw new Error('Canyon cluster gridSegments must be an integer of at least two');
  }
  const vertices: number[] = [];
  const indices: number[] = [];
  const rowLength = gridSegments + 1;

  for (let zIndex = 0; zIndex <= gridSegments; zIndex++) {
    for (let xIndex = 0; xIndex <= gridSegments; xIndex++) {
      vertices.push((xIndex / gridSegments) * 2 - 1, (zIndex / gridSegments) * 2 - 1, 0, 0);
    }
  }
  for (let zIndex = 0; zIndex < gridSegments; zIndex++) {
    for (let xIndex = 0; xIndex < gridSegments; xIndex++) {
      const bottomLeft = zIndex * rowLength + xIndex;
      const bottomRight = bottomLeft + 1;
      const topLeft = bottomLeft + rowLength;
      const topRight = topLeft + 1;
      indices.push(bottomLeft, topLeft, bottomRight, bottomRight, topLeft, topRight);
    }
  }

  appendSkirt(vertices, indices, makeEdgePoints(gridSegments, 'left'), -1);
  appendSkirt(vertices, indices, makeEdgePoints(gridSegments, 'right'), 1);
  appendSkirt(vertices, indices, makeEdgePoints(gridSegments, 'bottom'), -2);
  appendSkirt(vertices, indices, makeEdgePoints(gridSegments, 'top'), 2);

  const topTriangleCount = gridSegments * gridSegments * 2;
  const skirtTriangleCount = gridSegments * 2 * 4;
  return {
    vertices: new Float32Array(vertices),
    indices: new Uint32Array(indices),
    gridSegments,
    topTriangleCount,
    skirtTriangleCount,
    triangleCount: topTriangleCount + skirtTriangleCount
  };
}

function validateHierarchyOptions(
  rootGridSize: number,
  refinementDepth: number,
  rootWorldSize: number,
  clusterGridSegments: number
): void {
  if (!Number.isSafeInteger(rootGridSize) || rootGridSize < 1) {
    throw new Error('Canyon rootGridSize must be a positive integer');
  }
  if (!Number.isSafeInteger(refinementDepth) || refinementDepth < 0 || refinementDepth > 8) {
    throw new Error('Canyon refinementDepth must be an integer from zero through eight');
  }
  if (!Number.isFinite(rootWorldSize) || rootWorldSize <= 0) {
    throw new Error('Canyon rootWorldSize must be positive');
  }
  if (!Number.isSafeInteger(clusterGridSegments) || clusterGridSegments < 2) {
    throw new Error('Canyon clusterGridSegments must be an integer of at least two');
  }
}

function makeRootSeeds(rootGridSize: number, rootWorldSize: number): CanyonNodeSeed[] {
  const seeds: CanyonNodeSeed[] = [];
  const halfExtent = (rootGridSize * rootWorldSize) / 2;
  for (let zIndex = 0; zIndex < rootGridSize; zIndex++) {
    for (let xIndex = 0; xIndex < rootGridSize; xIndex++) {
      seeds.push({
        centerX: -halfExtent + (xIndex + 0.5) * rootWorldSize,
        centerZ: -halfExtent + (zIndex + 0.5) * rootWorldSize,
        halfSize: rootWorldSize / 2
      });
    }
  }
  return seeds;
}

function appendChildSeeds(output: CanyonNodeSeed[], parent: CanyonNodeSeed): void {
  const childHalfSize = parent.halfSize / 2;
  for (const zDirection of [-1, 1]) {
    for (const xDirection of [-1, 1]) {
      output.push({
        centerX: parent.centerX + xDirection * childHalfSize,
        centerZ: parent.centerZ + zDirection * childHalfSize,
        halfSize: childHalfSize
      });
    }
  }
}

function getConservativeNodeBounds(node: CanyonNodeSeed): [number, number, number, number] {
  let sampledMinimum = Infinity;
  let sampledMaximum = -Infinity;
  for (let zIndex = 0; zIndex <= CANYON_BOUND_SAMPLE_SEGMENTS; zIndex++) {
    for (let xIndex = 0; xIndex <= CANYON_BOUND_SAMPLE_SEGMENTS; xIndex++) {
      const worldX =
        node.centerX + (xIndex / CANYON_BOUND_SAMPLE_SEGMENTS) * node.halfSize * 2 - node.halfSize;
      const worldZ =
        node.centerZ + (zIndex / CANYON_BOUND_SAMPLE_SEGMENTS) * node.halfSize * 2 - node.halfSize;
      const height = getCanyonTerrainHeight(worldX, worldZ);
      sampledMinimum = Math.min(sampledMinimum, height);
      sampledMaximum = Math.max(sampledMaximum, height);
    }
  }
  const sampleCellSize = (node.halfSize * 2) / CANYON_BOUND_SAMPLE_SEGMENTS;
  const maximumDistanceToSample = sampleCellSize / Math.SQRT2;
  const heightMargin = maximumDistanceToSample * CANYON_MAXIMUM_TERRAIN_SLOPE + 0.25;
  const minimumHeight = Math.max(CANYON_MINIMUM_HEIGHT, sampledMinimum - heightMargin);
  const maximumHeight = Math.min(CANYON_MAXIMUM_HEIGHT, sampledMaximum + heightMargin);
  const centerY = (minimumHeight + maximumHeight) / 2;
  const verticalHalfExtent = (maximumHeight - minimumHeight) / 2;
  const radius = Math.hypot(node.halfSize, node.halfSize, verticalHalfExtent);
  return [node.centerX, centerY, node.centerZ, radius];
}

function getClusterTriangleCount(gridSegments: number): number {
  return gridSegments * gridSegments * 2 + gridSegments * 2 * 4;
}

type CanyonEdge = 'left' | 'right' | 'bottom' | 'top';

function makeEdgePoints(gridSegments: number, edge: CanyonEdge): [number, number][] {
  const points: [number, number][] = [];
  for (let index = 0; index <= gridSegments; index++) {
    const amount = index / gridSegments;
    if (edge === 'left') points.push([-1, amount * 2 - 1]);
    if (edge === 'right') points.push([1, 1 - amount * 2]);
    if (edge === 'bottom') points.push([1 - amount * 2, -1]);
    if (edge === 'top') points.push([amount * 2 - 1, 1]);
  }
  return points;
}

function appendSkirt(
  vertices: number[],
  indices: number[],
  points: readonly [number, number][],
  edgeCode: number
): void {
  const firstVertex = vertices.length / 4;
  for (const [localX, localZ] of points) {
    vertices.push(localX, localZ, 0, edgeCode, localX, localZ, 1, edgeCode);
  }
  for (let pointIndex = 0; pointIndex + 1 < points.length; pointIndex++) {
    const topStart = firstVertex + pointIndex * 2;
    const bottomStart = topStart + 1;
    const topEnd = topStart + 2;
    const bottomEnd = topStart + 3;
    indices.push(topStart, bottomStart, topEnd, topEnd, bottomStart, bottomEnd);
  }
}
