// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {Geometry} from '@luma.gl/engine';

export const BAKING_SCENES = [
  {value: 'courtyard', label: 'Courtyard & Arcade'},
  {value: 'rooms', label: 'Two Rooms'},
  {value: 'gallery', label: 'Sculpture Gallery'},
  {value: 'wells', label: 'Architectural Light Wells'},
  {value: 'workshop', label: 'Workshop'},
  {value: 'pavilion', label: 'Material Pavilion'}
] as const;
export type BakingScene = (typeof BAKING_SCENES)[number]['value'];
type Point = [number, number, number];

/** Static, closed architectural solids. Geometry stays independent of atlas allocation. */
export function makeBakingScene(scene: Exclude<BakingScene, 'rooms'>): Geometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const stone: Point = [0.72, 0.69, 0.61];
  const clay: Point = [0.72, 0.19, 0.08];
  const blue: Point = [0.04, 0.22, 0.65];
  function face(points: Point[], color: Point, vertexNormals?: Point[]) {
    const first = points[1].map((value, index) => value - points[0][index]);
    const second = points[2].map((value, index) => value - points[0][index]);
    const normal = [
      first[1] * second[2] - first[2] * second[1],
      first[2] * second[0] - first[0] * second[2],
      first[0] * second[1] - first[1] * second[0]
    ];
    const length = Math.hypot(...normal);
    for (const index of [0, 1, 2, 0, 2, 3]) {
      positions.push(...points[index]);
      normals.push(...(vertexNormals?.[index] ?? normal.map(value => value / length)));
      colors.push(...color, 1);
    }
  }
  function box(center: Point, size: Point, color = stone) {
    const [left, bottom, back] = center.map((value, index) => value - size[index] / 2);
    const [right, top, front] = center.map((value, index) => value + size[index] / 2);
    face(
      [
        [left, bottom, front],
        [right, bottom, front],
        [right, top, front],
        [left, top, front]
      ],
      color
    );
    face(
      [
        [right, bottom, back],
        [left, bottom, back],
        [left, top, back],
        [right, top, back]
      ],
      color
    );
    face(
      [
        [left, bottom, back],
        [left, bottom, front],
        [left, top, front],
        [left, top, back]
      ],
      color
    );
    face(
      [
        [right, bottom, front],
        [right, bottom, back],
        [right, top, back],
        [right, top, front]
      ],
      color
    );
    face(
      [
        [left, top, front],
        [right, top, front],
        [right, top, back],
        [left, top, back]
      ],
      color
    );
    face(
      [
        [left, bottom, back],
        [right, bottom, back],
        [right, bottom, front],
        [left, bottom, front]
      ],
      color
    );
  }
  box([0, -0.1, 0], [6.4, 0.2, 5]);
  if (scene === 'courtyard') {
    box([0, 1.5, -2.3], [6.4, 3, 0.2], clay);
    box([0, 2.95, -1.55], [6.4, 0.2, 1.5]);
    for (const center of [-2, 0, 2]) {
      for (const side of [-1, 1]) box([center + side * 0.9, 0.85, -0.8], [0.2, 1.7, 0.3]);
      // Voussoirs form real open arches, with radial faces and closed depth caps.
      for (let segment = 0; segment < 32; segment++) {
        const angles = [segment, segment + 1].map(value => (value * Math.PI) / 32);
        const ring = (radius: number, angle: number, depth: number): Point => [
          center + radius * Math.cos(angle),
          1.7 + radius * Math.sin(angle),
          depth
        ];
        const front = [
          ring(0.8, angles[0], -0.65),
          ring(1, angles[0], -0.65),
          ring(1, angles[1], -0.65),
          ring(0.8, angles[1], -0.65)
        ];
        const back = front.map(point => [point[0], point[1], -0.95] as Point);
        face(front, stone);
        face([...back].reverse(), stone);
        for (const index of [1, 3]) {
          const corners = [
            front[index],
            back[index],
            back[(index + 1) % 4],
            front[(index + 1) % 4]
          ];
          const sign = index === 1 ? 1 : -1;
          const smoothNormals = corners.map(point => {
            const horizontal = point[0] - center;
            const vertical = point[1] - 1.7;
            const radius = Math.hypot(horizontal, vertical);
            return [(sign * horizontal) / radius, (sign * vertical) / radius, 0] as Point;
          });
          face(corners, stone, smoothNormals);
        }
        if (segment === 0) face([front[0], back[0], back[1], front[1]], stone);
        if (segment === 31) face([front[2], back[2], back[3], front[3]], stone);
      }
    }
    box([1.5, 0.3, 0.7], [0.9, 0.6, 0.9]);
    box([1.5, 1.05, 0.7], [0.45, 0.9, 0.45], blue);
  } else if (scene === 'gallery') {
    box([0, 1.5, -2.3], [6, 3, 0.2]);
    for (const horizontal of [-2, 0, 2]) {
      box([horizontal, 0.35, 0], [0.8, 0.7, 0.8]);
      box([horizontal, 1.1, 0], [0.45, 0.8, 0.45], horizontal === 0 ? clay : blue);
    }
    box([-0.8, 1.2, -1.2], [0.15, 2.4, 1.7]);
  } else if (scene === 'wells') {
    for (const horizontal of [-2, 0, 2]) {
      box([horizontal - 0.8, 1.5, 0], [0.2, 3, 4]);
      box(
        [horizontal, 0.35 + (horizontal + 2) * 0.2, -0.8],
        [1.4, 0.3, 2],
        horizontal === 0 ? clay : stone
      );
      box([horizontal, 2.9, -1.5], [1.4, 0.2, 1]);
    }
  } else if (scene === 'workshop') {
    box([0, 1.5, -2.3], [6, 3, 0.2]);
    for (const horizontal of [-2, 0, 2]) {
      box([horizontal, 0.7, -1], [1.5, 1.4, 1], horizontal === 0 ? blue : clay);
      box([horizontal, 1.5, -1], [1.7, 0.15, 1.2]);
      box([horizontal, 2.3, -1.9], [1.7, 0.12, 0.7]);
    }
  } else {
    box([0, 2.7, 0], [4.8, 0.2, 3.2]);
    for (const horizontal of [-2, 2])
      for (const depth of [-1.2, 1.2]) box([horizontal, 1.3, depth], [0.2, 2.6, 0.2]);
    for (let segment = 0; segment < 7; segment++) {
      const angle = (segment * Math.PI) / 6;
      box(
        [1.3 * Math.cos(angle), 0.7, 1.3 * Math.sin(angle) - 0.5],
        [0.4, 1.4, 0.4],
        segment < 3 ? clay : blue
      );
    }
  }
  return new Geometry({
    topology: 'triangle-list',
    attributes: {
      POSITION: {size: 3, value: new Float32Array(positions)},
      NORMAL: {size: 3, value: new Float32Array(normals)},
      COLOR_0: {size: 4, value: new Float32Array(colors)}
    }
  });
}
