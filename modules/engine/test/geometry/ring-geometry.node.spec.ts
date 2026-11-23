// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {RingGeometry} from '@luma.gl/engine';
import {expect, it} from 'vitest';

it('ring surfaces close full and partial annuli with outward winding and hard corner normals', () => {
  for (const innerRadius of [0, 0.5]) {
    for (const angle of [Math.PI * 1.5, Math.PI * 2]) {
      const segments = 24;
      const mesh = new RingGeometry({
        innerRadius,
        outerRadius: 1,
        height: 0.4,
        startAngle: 0.3,
        angle,
        segments
      });
      const positions = mesh.attributes.POSITION.value;
      const normals = mesh.attributes.NORMAL.value;
      const indices = mesh.indices!.value;
      const edges = new Map<string, number>();
      let volume = 0;
      const vertex = (index: number) => Array.from(positions.slice(index * 3, index * 3 + 3));
      const subtract = (first: number[], second: number[]) =>
        first.map((value, axis) => value - second[axis]);
      const cross = (first: number[], second: number[]) => [
        first[1] * second[2] - first[2] * second[1],
        first[2] * second[0] - first[0] * second[2],
        first[0] * second[1] - first[1] * second[0]
      ];
      const dot = (first: number[], second: number[]) =>
        first.reduce((sum, value, axis) => sum + value * second[axis], 0);
      const key = (position: number[]) =>
        position.map(value => Math.round(value * 1000000)).join(',');
      for (let index = 0; index < indices.length; index += 3) {
        const triangleIndices = [indices[index], indices[index + 1], indices[index + 2]];
        const points = triangleIndices.map(vertex);
        const areaNormal = cross(subtract(points[1], points[0]), subtract(points[2], points[0]));
        if (Math.hypot(...areaNormal) < 0.00000001) continue;
        const normal = Array.from(
          normals.slice(triangleIndices[0] * 3, triangleIndices[0] * 3 + 3)
        );
        expect(dot(areaNormal, normal)).toBeGreaterThan(0);
        volume += dot(points[0], cross(points[1], points[2])) / 6;
        for (let edge = 0; edge < 3; edge++) {
          const edgeKey = [key(points[edge]), key(points[(edge + 1) % 3])].sort().join('|');
          edges.set(edgeKey, (edges.get(edgeKey) ?? 0) + 1);
        }
      }
      expect(Array.from(edges.values()).every(count => count === 2)).toBe(true);
      const expectedVolume =
        (segments * Math.sin(angle / segments) * (1 - innerRadius * innerRadius) * 0.4) / 2;
      expect(volume).toBeCloseTo(expectedVolume, 5);
      expect(mesh.attributes.TEXCOORD_0.value.length).toBe((positions.length / 3) * 2);
    }
  }
});

it('ring boundaries reject invalid dimensions and preserve caller attribute names', () => {
  for (const props of [
    {innerRadius: -1},
    {innerRadius: 1},
    {outerRadius: 0},
    {height: 0},
    {segments: 2.5},
    {angle: 0},
    {angle: 7},
    {startAngle: Infinity}
  ])
    expect(() => new RingGeometry(props)).toThrow();
  const custom = new Float32Array([1, 2, 3]);
  const mesh = new RingGeometry({attributes: {_CUSTOM: {size: 1, value: custom, constant: true}}});
  expect(mesh.attributes._CUSTOM.value).toBe(custom);
  expect(mesh.attributes).not.toHaveProperty('positions');
});
