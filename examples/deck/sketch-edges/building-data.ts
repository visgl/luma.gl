// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type BuildingFeature = {
  id: number;
  name: string;
  center: [number, number, number];
  size: [number, number, number];
  color: [number, number, number];
};
export const ORIGIN: [number, number, number] = [-74.006, 40.7128, 0];
export function makeBuildings(): BuildingFeature[] {
  return Array.from({length: 12}, (_, index) => ({
    id: index,
    name: `Building ${index + 1}`,
    center: [(index % 4) * 115 - 172.5, Math.floor(index / 4) * 135 - 135, 0],
    size: [65, 76, 30 + ((index * 29) % 105)],
    color: [0.83, 0.82, 0.77]
  }));
}

/** Twelve architectural edges per cuboid; no triangulation diagonals. */
export function makeEdges(features: readonly BuildingFeature[]): Float32Array {
  const segments: number[] = [];
  features.forEach((feature, featureIndex) => {
    const [east, north, base] = feature.center;
    const [width, depth, height] = feature.size;
    const corners = Array.from({length: 8}, (_, index) => [
      east + ((index % 2) - 0.5) * width,
      north + ((Math.floor(index / 2) % 2) - 0.5) * depth,
      base + Math.floor(index / 4) * height
    ]);
    const edges = [
      [0, 1],
      [1, 3],
      [3, 2],
      [2, 0],
      [4, 5],
      [5, 7],
      [7, 6],
      [6, 4],
      [0, 4],
      [1, 5],
      [2, 6],
      [3, 7]
    ];
    edges.forEach(([start, end], edgeIndex) =>
      segments.push(
        ...corners[start],
        ...corners[end],
        featureIndex,
        feature.id * 12 + edgeIndex + 1
      )
    );
  });
  return new Float32Array(segments);
}

/** Interleaved position, normal, RGB color, and stable feature index for each triangle vertex. */
export function makeBuildingMesh(features: readonly BuildingFeature[]): Float32Array {
  const vertices: number[] = [];
  features.forEach((feature, featureIndex) => {
    const [centerEast, centerNorth, base] = feature.center;
    const [width, depth, height] = feature.size;
    const west = centerEast - width / 2;
    const east = centerEast + width / 2;
    const south = centerNorth - depth / 2;
    const north = centerNorth + depth / 2;
    const roof = base + height;
    appendFace(
      [
        [west, south, roof],
        [east, south, roof],
        [east, north, roof],
        [west, north, roof]
      ],
      [0, 0, 1]
    );
    if (height > 0) {
      appendFace(
        [
          [west, south, base],
          [east, south, base],
          [east, south, roof],
          [west, south, roof]
        ],
        [0, -1, 0]
      );
      appendFace(
        [
          [east, south, base],
          [east, north, base],
          [east, north, roof],
          [east, south, roof]
        ],
        [1, 0, 0]
      );
      appendFace(
        [
          [east, north, base],
          [west, north, base],
          [west, north, roof],
          [east, north, roof]
        ],
        [0, 1, 0]
      );
      appendFace(
        [
          [west, north, base],
          [west, south, base],
          [west, south, roof],
          [west, north, roof]
        ],
        [-1, 0, 0]
      );
    }
    function appendFace(corners: number[][], normal: number[]) {
      for (const cornerIndex of [0, 1, 2, 0, 2, 3]) {
        vertices.push(...corners[cornerIndex], ...normal, ...feature.color, featureIndex);
      }
    }
  });
  return new Float32Array(vertices);
}
