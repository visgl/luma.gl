// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {
  CANYON_CLUSTER_GRID_SEGMENTS,
  CANYON_REFINEMENT_DEPTH,
  CANYON_ROOT_GRID_SIZE,
  getCanyonTerrainHeight,
  makeCanyonClusterMeshData,
  makeVirtualGeometryCanyonHierarchy
} from '../../examples/experimental/virtual-geometry-canyon/canyon-data';
import {
  getCanyonFrustumPlanes,
  getCanyonGuidedCameraSample,
  getConstrainedCanyonCameraSample,
  makeCanyonCameraRoute
} from '../../examples/experimental/virtual-geometry-canyon/canyon-camera';
import {CANYON_SHADER_CONSTANTS} from '../../examples/experimental/virtual-geometry-canyon/canyon-shaders';

describe('Virtual Geometry Canyon hierarchy', () => {
  test('builds the full breadth-ordered forest and honest potential geometry counts', () => {
    const hierarchy = makeVirtualGeometryCanyonHierarchy();

    expect(hierarchy.rootGridSize).toBe(CANYON_ROOT_GRID_SIZE);
    expect(hierarchy.refinementDepth).toBe(CANYON_REFINEMENT_DEPTH);
    expect(hierarchy.levelOffsets).toEqual([0, 16, 80, 336, 1360, 5456, 21840, 87376]);
    expect(hierarchy.nodeCount).toBe(87_376);
    expect(hierarchy.leafClusterCount).toBe(65_536);
    expect(hierarchy.clusterTriangleCount).toBe(640);
    expect(hierarchy.potentialTriangleCount).toBe(41_943_040);
    expect(hierarchy.sphereBounds).toHaveLength(hierarchy.nodeCount * 4);
    expect(hierarchy.geometricErrors).toHaveLength(hierarchy.nodeCount);
    expect(hierarchy.children).toHaveLength(hierarchy.nodeCount * 2);
    expect(hierarchy.clusterIds).toHaveLength(hierarchy.nodeCount);
    expect(hierarchy.clusterMetadata).toHaveLength(hierarchy.nodeCount * 4);

    for (let nodeIndex = 0; nodeIndex < hierarchy.nodeCount; nodeIndex += 977) {
      expect(hierarchy.clusterIds[nodeIndex]).toBe(nodeIndex);
      const boundOffset = nodeIndex * 4;
      expect(hierarchy.sphereBounds[boundOffset + 3]).toBeGreaterThan(0);
      expect(
        Array.from(hierarchy.sphereBounds.subarray(boundOffset, boundOffset + 4)).every(
          Number.isFinite
        )
      ).toBe(true);
    }

    expect(Array.from(hierarchy.children.subarray(0, 6))).toEqual([16, 4, 20, 4, 24, 4]);
    const firstLeaf = hierarchy.levelOffsets[CANYON_REFINEMENT_DEPTH];
    expect(Array.from(hierarchy.children.subarray(firstLeaf * 2, firstLeaf * 2 + 2))).toEqual([
      0, 0
    ]);
    expect(hierarchy.geometricErrors[firstLeaf]).toBe(0);
  });

  test('creates one indexed 17x17 grid with four crack-hiding skirts', () => {
    const mesh = makeCanyonClusterMeshData();

    expect(mesh.gridSegments).toBe(CANYON_CLUSTER_GRID_SEGMENTS);
    expect(mesh.vertices).toHaveLength(425 * 4);
    expect(mesh.indices).toHaveLength(640 * 3);
    expect(mesh.topTriangleCount).toBe(512);
    expect(mesh.skirtTriangleCount).toBe(128);
    expect(mesh.triangleCount).toBe(640);
    expect(Math.max(...mesh.indices)).toBeLessThan(mesh.vertices.length / 4);

    const skirtVertices = Array.from(
      {length: mesh.vertices.length / 4},
      (_, vertexIndex) => mesh.vertices[vertexIndex * 4 + 2]
    ).filter(value => value === 1);
    expect(skirtVertices).toHaveLength(68);
  });

  test('keeps CPU terrain and shader topology constants in lockstep', () => {
    expect(CANYON_SHADER_CONSTANTS).toEqual({
      clusterGridSegments: CANYON_CLUSTER_GRID_SEGMENTS,
      refinementDepth: CANYON_REFINEMENT_DEPTH,
      terrainHalfExtent: 2048
    });
    for (const [worldX, worldZ] of [
      [0, 0],
      [420, -710],
      [-1330, 1820]
    ]) {
      expect(Number.isFinite(getCanyonTerrainHeight(worldX, worldZ))).toBe(true);
    }
  });
});

describe('Virtual Geometry Canyon camera', () => {
  test('follows a closed canyon-to-rim route and constrains manual look', () => {
    const route = makeCanyonCameraRoute();
    expect(route.poses).toHaveLength(9);
    expect(route.duration).toBeGreaterThan(40);
    expect(route.poses.some(pose => pose.shot === 'rim climb')).toBe(true);
    expect(route.poses.some(pose => pose.shot === 'great canyon reveal')).toBe(true);
    for (const pose of route.poses) {
      expect(pose.eye[1] - getCanyonTerrainHeight(pose.eye[0], pose.eye[2])).toBeGreaterThanOrEqual(
        70
      );
    }

    const wrapped = getCanyonGuidedCameraSample(route, route.duration + 1.25);
    const direct = getCanyonGuidedCameraSample(route, 1.25);
    expect(wrapped.eye).toEqual(direct.eye);
    expect(wrapped.target).toEqual(direct.target);

    const constrained = getConstrainedCanyonCameraSample(route, 0.32, 100, -100);
    expect(constrained.progress).toBeCloseTo(0.32);
    expect(constrained.shot).toBe('manual canyon track');
    expect(constrained.eye.every(Number.isFinite)).toBe(true);
    expect(constrained.target.every(Number.isFinite)).toBe(true);
  });

  test('produces six normalized inward frustum planes', () => {
    const eye: [number, number, number] = [0, 80, -300];
    const target: [number, number, number] = [0, 20, 0];
    const planes = getCanyonFrustumPlanes(eye, target, 16 / 9);
    expect(planes).toHaveLength(24);

    const inside = [0, 50, -150] as const;
    for (let planeIndex = 0; planeIndex < 6; planeIndex++) {
      const offset = planeIndex * 4;
      const normalLength = Math.hypot(planes[offset], planes[offset + 1], planes[offset + 2]);
      expect(normalLength).toBeCloseTo(1, 5);
      expect(
        planes[offset] * inside[0] +
          planes[offset + 1] * inside[1] +
          planes[offset + 2] * inside[2] +
          planes[offset + 3]
      ).toBeGreaterThanOrEqual(-1e-4);
    }
  });
});
