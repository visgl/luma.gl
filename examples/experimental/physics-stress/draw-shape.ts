// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {GPURigidBodyShape} from '@luma.gl/gpu-graph/gpu-physics';

export function drawStressShape(
  context: CanvasRenderingContext2D,
  shape: GPURigidBodyShape,
  orientation: readonly number[],
  scale: number,
  depthFactor = 0
) {
  const project = (point: readonly number[]): [number, number] => {
    const [rotationX, rotationY, rotationZ, scalar] = orientation;
    const crossX = 2 * (rotationY * point[2] - rotationZ * point[1]);
    const crossY = 2 * (rotationZ * point[0] - rotationX * point[2]);
    const crossZ = 2 * (rotationX * point[1] - rotationY * point[0]);
    const horizontal = point[0] + scalar * crossX + rotationY * crossZ - rotationZ * crossY;
    const depth = point[1] + scalar * crossY + rotationZ * crossX - rotationX * crossZ;
    const vertical = point[2] + scalar * crossZ + rotationX * crossY - rotationY * crossX;
    return [
      (horizontal + depthFactor * depth) * scale,
      -(vertical + 0.7 * depthFactor * depth) * scale
    ];
  };
  if (shape.type === 'box') {
    const vertices = Array.from({length: 8}, (_, corner) =>
      project(shape.halfExtents.map((value, axis) => (corner & (1 << axis) ? value : -value)))
    );
    context.globalAlpha = 0.4;
    context.strokeStyle = '#8ea3b2';
    for (const face of [
      [0, 1, 3, 2],
      [4, 5, 7, 6],
      [0, 1, 5, 4],
      [2, 3, 7, 6],
      [0, 2, 6, 4],
      [1, 3, 7, 5]
    ]) {
      context.beginPath();
      face.forEach((index, corner) => {
        if (corner === 0) context.moveTo(...vertices[index]);
        else context.lineTo(...vertices[index]);
      });
      context.closePath();
      context.fill();
      context.stroke();
    }
  } else if (shape.type === 'convex-hull' || shape.type === 'triangle-mesh') {
    context.lineWidth = Math.max(1, scale * 0.015);
    context.strokeStyle = shape.type === 'triangle-mesh' ? '#e7b77c' : '#8ea3b2';
    context.globalAlpha = 0.9;
    for (let triangle = 0; triangle < shape.geometry.indices.length; triangle += 3) {
      context.beginPath();
      for (let corner = 0; corner < 3; corner++) {
        const index = shape.geometry.indices[triangle + corner] * 3;
        const point = project(shape.geometry.positions.slice(index, index + 3));
        if (corner === 0) context.moveTo(point[0], point[1]);
        else context.lineTo(point[0], point[1]);
      }
      context.closePath();
      if (shape.type === 'convex-hull') context.fill();
      context.stroke();
    }
  } else if (shape.type === 'capsule' || shape.type === 'cylinder') {
    // The diagnostic camera looks along +Y. Draw meridians to expose the axis and taper.
    for (let meridian = 0; meridian < 12; meridian++) {
      const angle = (meridian * Math.PI) / 6;
      const bottom = project([
        Math.cos(angle) * shape.radiusBottom,
        -shape.height / 2,
        Math.sin(angle) * shape.radiusBottom
      ]);
      const top = project([
        Math.cos(angle) * shape.radiusTop,
        shape.height / 2,
        Math.sin(angle) * shape.radiusTop
      ]);
      context.strokeStyle = '#8ea3b2';
      context.beginPath();
      context.moveTo(...bottom);
      context.lineTo(...top);
      context.stroke();
    }
    context.beginPath();
    context.arc(0, 0, Math.max(shape.radiusBottom, shape.radiusTop) * scale, 0, 2 * Math.PI);
    context.fill();
  }
}
