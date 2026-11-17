// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUSphereBodyState} from '@luma.gl/graph/gpu-physics';
import {BALL_RADIUS, POCKET_RADIUS, POCKETS, TABLE_PLANES} from './table';

type Point = [number, number];
const dot = (first: Point, second: Point) => first[0] * second[0] + first[1] * second[1];
const advance = (point: Point, direction: Point, length: number): Point => [
  point[0] + direction[0] * length,
  point[1] + direction[1] * length
];

function hitCircle(origin: Point, direction: Point, center: readonly number[], radius: number) {
  const offset: Point = [center[0] - origin[0], center[1] - origin[1]];
  const projection = dot(offset, direction);
  const discriminant = radius ** 2 - dot(offset, offset) + projection ** 2;
  return projection > 0 && discriminant >= 0 ? projection - Math.sqrt(discriminant) : Infinity;
}

function hitCushion(origin: Point, direction: Point) {
  let distance = Infinity;
  let normal: Point = [0, 0];
  for (const plane of TABLE_PLANES.slice(1)) {
    const [horizontal, vertical] = plane.normal!;
    const length = Math.hypot(horizontal, vertical);
    const inward: Point = [horizontal / length, vertical / length];
    const approach = dot(direction, inward);
    if (approach >= -1e-6) continue;
    const center = plane.center!;
    const offset: Point = [origin[0] - center[0], origin[1] - center[1]];
    const hit = (BALL_RADIUS - dot(offset, inward)) / approach;
    const contact = advance(offset, direction, hit);
    const tangent: Point = [-inward[1], inward[0]];
    if (hit > 1e-4 && hit < distance && Math.abs(dot(contact, tangent)) <= plane.halfExtents![1]) {
      distance = hit;
      normal = inward;
    }
  }
  return {distance, normal};
}

/** Trace up to two cushion rebounds and the first object-ball contact using table geometry. */
export function traceAimGuide(states: readonly GPUSphereBodyState[], angle: number) {
  const start: Point = [states[0].position[0], states[0].position[1]];
  let origin = start;
  let direction: Point = [Math.cos(angle), Math.sin(angle)];
  const path = [advance(start, direction, BALL_RADIUS)];
  let target: Point[] = [];
  let ghost: Point | undefined;
  for (let segment = 0; segment < 3; segment++) {
    const cushion = hitCushion(origin, direction);
    let distance = Math.min(cushion.distance, 18);
    let ball: GPUSphereBodyState | undefined;
    for (const pocket of POCKETS) {
      const hit = hitCircle(origin, direction, pocket, POCKET_RADIUS);
      if (hit >= 0 && hit < distance) distance = hit;
    }
    for (const candidate of states) {
      if (!candidate.enabled || candidate.index === 0) continue;
      const hit = hitCircle(origin, direction, candidate.position, BALL_RADIUS + candidate.radius);
      if (hit >= 0 && hit < distance) {
        distance = hit;
        ball = candidate;
      }
    }
    const impact = advance(origin, direction, distance);
    path.push(impact);
    if (ball) {
      const center: Point = [ball.position[0], ball.position[1]];
      const radius = BALL_RADIUS + ball.radius;
      const normal: Point = [(center[0] - impact[0]) / radius, (center[1] - impact[1]) / radius];
      let targetDistance = Math.min(2.6, hitCushion(center, normal).distance);
      for (const candidate of states) {
        if (!candidate.enabled || candidate.index === 0 || candidate.index === ball.index) continue;
        const hit = hitCircle(center, normal, candidate.position, ball.radius + candidate.radius);
        if (hit >= 0 && hit < targetDistance) targetDistance = hit;
      }
      target = [center, advance(center, normal, targetDistance)];
      ghost = impact;
      break;
    }
    if (distance !== cushion.distance) break;
    direction = advance(direction, cushion.normal, -2 * dot(direction, cushion.normal));
    origin = advance(impact, direction, 1e-4);
  }
  return {path, target, ghost};
}
