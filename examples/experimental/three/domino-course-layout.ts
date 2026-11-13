// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPURigidBody} from '@luma.gl/graph/gpu-physics';

export const TILE_HEIGHT = 1.35;
export const TILE_WIDTH = 0.64;
export const TILE_DEPTH = 0.22;
export const COURSE_COLORS = ['#e9e5d8', '#008b81', '#d63713', '#cf9000'];
export const FLOOR_HALF_EXTENTS = [13, 0.25, 13] as const;

/** Y-up course, travelling in +X. The split tile straddles both branch entrances. */
export function makeDominoCourse() {
  const bodies: GPURigidBody[] = [
    {mass: 0, position: [0, -0.25, 0], shape: {type: 'box', halfExtents: FLOOR_HALF_EXTENTS}}
  ];
  const tiles: {body: number; width: number; color: string}[] = [];
  function addTile(x: number, z: number, heading: number, group: number) {
    const yaw = Math.PI / 2 - heading;
    tiles.push({body: bodies.length, width: TILE_WIDTH, color: COURSE_COLORS[group]});
    bodies.push({
      position: [x, TILE_HEIGHT / 2, z],
      orientation: [0, Math.sin(yaw / 2), 0, Math.cos(yaw / 2)],
      mass: 1,
      friction: 0.65,
      restitution: 0.02,
      shape: {type: 'box', halfExtents: [TILE_WIDTH / 2, TILE_HEIGHT / 2, TILE_DEPTH / 2]}
    });
  }
  for (let index = 0; index < 7; index++) addTile(-11.2 + index * 0.62, 0, 0, 0);
  addTile(-6.86, 0, 0, 0);

  // Smooth branches separate gently, then come back parallel at the receiver.
  const branches: number[][] = [];
  for (const [index, side] of [-1, 1].entries()) {
    const branch: number[] = [];
    for (let tile = 0; tile <= 19; tile++) {
      const progress = tile / 19;
      const x = -6.24 + 11.78 * progress;
      const z = side * (0.34 + 2.65 * Math.sin(Math.PI * progress) ** 2);
      const slope = (side * 2.65 * Math.PI * Math.sin(2 * Math.PI * progress)) / 11.78;
      branch.push(bodies.length);
      addTile(x, z, Math.atan(slope), index + 1);
    }
    branches.push(branch);
  }
  const join = bodies.length;
  addTile(6.16, 0, 0, 3);
  for (let index = 1; index <= 8; index++) addTile(6.16 + index * 0.62, 0, 0, 3);
  return {bodies, tiles, branches, join, finish: bodies.length - 1};
}
