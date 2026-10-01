// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert} from '@luma.gl/core';
import {Geometry} from './geometry';

export type StrokePosition = readonly [number, number, number?];
export type StrokeGeometryOptions = {
  width?: number;
  cap?: 'butt' | 'square' | 'round';
  join?: 'miter' | 'bevel' | 'round';
  miterLimit?: number;
  /** Number of triangles used for a semicircle. */
  roundSegments?: number;
  closed?: boolean;
  id?: string;
};

type Position = [number, number, number];
type Direction = [number, number];
type StrokeVertex = {position: Position; distance: number; across: number};
type Segment = {direction: Direction; length: number};
type Corners = {
  incomingLeft: StrokeVertex;
  incomingRight: StrokeVertex;
  outgoingLeft: StrokeVertex;
  outgoingRight: StrokeVertex;
};

/** Triangulates a local XY stroke; optional source elevations are preserved at each path vertex. */
export function makeStrokeGeometry(
  path: readonly StrokePosition[],
  options: StrokeGeometryOptions = {}
): Geometry {
  const {width = 1, cap = 'butt', join = 'miter', miterLimit = 4, roundSegments = 16} = options;
  // Stroke dimensions must be finite; resolution and miter limits bound generated geometry.
  assert(Number.isFinite(width) && width >= 0 && Number.isFinite(miterLimit) && miterLimit >= 1);
  assert(Number.isInteger(roundSegments) && roundSegments >= 2 && roundSegments <= 256);
  const points: Position[] = [];
  for (const position of path) {
    assert(
      Number.isFinite(position[0]) &&
        Number.isFinite(position[1]) &&
        Number.isFinite(position[2] ?? 0)
    );
    const previous = points.at(-1);
    if (!previous || previous[0] !== position[0] || previous[1] !== position[1])
      points.push([position[0], position[1], position[2] ?? 0]);
  }
  if (
    options.closed &&
    points.length > 1 &&
    points[0][0] === points.at(-1)![0] &&
    points[0][1] === points.at(-1)![1]
  )
    points.pop();
  const closed = Boolean(options.closed && points.length > 2);
  const positions: number[] = [];
  const coordinates: number[] = [];
  const halfWidth = width / 2;
  if (points.length > 1 && width > 0) {
    const segments: Segment[] = [];
    const distances = [0];
    for (let index = 0; index < points.length - (closed ? 0 : 1); index++) {
      const start = points[index];
      const end = points[(index + 1) % points.length];
      const horizontal = end[0] - start[0];
      const vertical = end[1] - start[1];
      const length = Math.hypot(horizontal, vertical);
      segments.push({direction: [horizontal / length, vertical / length], length});
      distances.push(distances.at(-1)! + length);
    }
    const corners = points.map((point, index): Corners => {
      const previous = segments[(index - 1 + segments.length) % segments.length];
      const next = segments[index % segments.length];
      const distance = distances[index];
      if (!closed && (index === 0 || index === points.length - 1)) {
        const direction = index === 0 ? next.direction : previous.direction;
        const extension = cap === 'square' ? (index === 0 ? -halfWidth : halfWidth) : 0;
        const left = createVertex(point, direction, halfWidth, extension, distance + extension);
        const right = createVertex(point, direction, -halfWidth, extension, distance + extension);
        if (cap === 'round') appendCap(point, direction, distance, index === 0);
        return {incomingLeft: left, outgoingLeft: left, incomingRight: right, outgoingRight: right};
      }
      const incoming = previous.direction;
      const outgoing = next.direction;
      const turn = incoming[0] * outgoing[1] - incoming[1] * outgoing[0];
      const cosine = incoming[0] * outgoing[0] + incoming[1] * outgoing[1];
      const result = {
        incomingLeft: createVertex(point, incoming, halfWidth, 0, distance),
        incomingRight: createVertex(point, incoming, -halfWidth, 0, distance),
        outgoingLeft: createVertex(point, outgoing, halfWidth, 0, distance),
        outgoingRight: createVertex(point, outgoing, -halfWidth, 0, distance)
      };
      if (1 + cosine < 1e-8) {
        // Exact reversals are split strokes; retraced geometry may overlap.
        if (join === 'round') {
          appendCap(point, incoming, distance, false);
          appendCap(point, outgoing, distance, true);
        }
        return result;
      }
      const miter: Direction = [
        (-(incoming[1] + outgoing[1]) * halfWidth) / (1 + cosine),
        ((incoming[0] + outgoing[0]) * halfWidth) / (1 + cosine)
      ];
      const miterLength = Math.hypot(...miter);
      if (Math.abs(turn) < 1e-8 || (join === 'miter' && miterLength <= miterLimit * halfWidth)) {
        const left = offsetVertex(point, miter, distance, halfWidth);
        const right = offsetVertex(point, [-miter[0], -miter[1]], distance, -halfWidth);
        return {incomingLeft: left, outgoingLeft: left, incomingRight: right, outgoingRight: right};
      }
      const innerSide = Math.sign(turn);
      // Short hairpins cannot accommodate an unbounded inner intersection.
      const innerScale = Math.min(1, Math.min(previous.length, next.length) / (2 * miterLength));
      const inner = offsetVertex(
        point,
        [miter[0] * innerSide * innerScale, miter[1] * innerSide * innerScale],
        distance,
        halfWidth * innerSide
      );
      if (innerSide > 0) {
        result.incomingLeft = inner;
        result.outgoingLeft = inner;
      } else {
        result.incomingRight = inner;
        result.outgoingRight = inner;
      }
      const outerStart = innerSide > 0 ? result.incomingRight : result.incomingLeft;
      const outerEnd = innerSide > 0 ? result.outgoingRight : result.outgoingLeft;
      if (join === 'round') {
        const sweep = Math.atan2(turn, cosine);
        const startAngle = Math.atan2(
          outerStart.position[1] - point[1],
          outerStart.position[0] - point[0]
        );
        const steps = Math.max(1, Math.ceil((Math.abs(sweep) / Math.PI) * roundSegments));
        let previousOuter = outerStart;
        for (let step = 1; step <= steps; step++) {
          const angle = startAngle + (sweep * step) / steps;
          const currentOuter =
            step === steps
              ? outerEnd
              : offsetVertex(
                  point,
                  [Math.cos(angle) * halfWidth, Math.sin(angle) * halfWidth],
                  distance,
                  -halfWidth * innerSide
                );
          appendTriangle(inner, previousOuter, currentOuter);
          previousOuter = currentOuter;
        }
      } else appendTriangle(inner, outerStart, outerEnd);
      return result;
    });
    segments.forEach((_segment, index) => {
      const start = corners[index];
      const end = corners[(index + 1) % corners.length];
      // Duplicate the closing seam with total distance to keep interpolation continuous.
      const closing = closed && index === segments.length - 1;
      const endLeft = closing
        ? {...end.incomingLeft, distance: distances.at(-1)!}
        : end.incomingLeft;
      const endRight = closing
        ? {...end.incomingRight, distance: distances.at(-1)!}
        : end.incomingRight;
      appendTriangle(start.outgoingLeft, start.outgoingRight, endLeft);
      appendTriangle(start.outgoingRight, endRight, endLeft);
    });
  }
  return new Geometry({
    id: options.id,
    topology: 'triangle-list',
    attributes: {
      POSITION: {size: 3, value: new Float32Array(positions)},
      TEXCOORD_0: {size: 2, value: new Float32Array(coordinates)}
    }
  });

  function appendTriangle(first: StrokeVertex, second: StrokeVertex, third: StrokeVertex): void {
    const area =
      (second.position[0] - first.position[0]) * (third.position[1] - first.position[1]) -
      (second.position[1] - first.position[1]) * (third.position[0] - first.position[0]);
    if (area === 0) return;
    for (const vertex of area > 0 ? [first, second, third] : [first, third, second]) {
      positions.push(...vertex.position);
      coordinates.push(vertex.distance, vertex.across);
    }
  }
  function offsetVertex(
    point: Position,
    offset: Direction,
    distance: number,
    across: number
  ): StrokeVertex {
    return {position: [point[0] + offset[0], point[1] + offset[1], point[2]], distance, across};
  }
  function createVertex(
    point: Position,
    direction: Direction,
    across: number,
    along: number,
    distance: number
  ): StrokeVertex {
    return offsetVertex(
      point,
      [-direction[1] * across + direction[0] * along, direction[0] * across + direction[1] * along],
      distance,
      across
    );
  }
  function appendCap(
    point: Position,
    direction: Direction,
    distance: number,
    start: boolean
  ): void {
    const center: StrokeVertex = {position: point, distance, across: 0};
    const startAngle =
      Math.atan2(direction[1], direction[0]) + (start ? -Math.PI / 2 : Math.PI / 2);
    let previous: StrokeVertex | undefined;
    for (let step = 0; step <= roundSegments; step++) {
      const angle = startAngle - (Math.PI * step) / roundSegments;
      const offset: Direction = [Math.cos(angle) * halfWidth, Math.sin(angle) * halfWidth];
      const current = offsetVertex(
        point,
        offset,
        distance + offset[0] * direction[0] + offset[1] * direction[1],
        -offset[0] * direction[1] + offset[1] * direction[0]
      );
      if (previous) appendTriangle(center, previous, current);
      previous = current;
    }
  }
}
