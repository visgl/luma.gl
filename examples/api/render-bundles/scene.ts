// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Matrix4} from '@math.gl/core';

export const CAMERA_DISTANCE = Math.hypot(38, 12);
export const CAMERA_PITCH = Math.atan2(12, 38);
export const CAMERA_YAW = Math.PI / 2;

const OBJECT_UNIFORM_FLOAT_COUNT = 20;

export function makeObjectUniforms(index: number, drawCount: number): Float32Array {
  const objectUniforms = new Float32Array(OBJECT_UNIFORM_FLOAT_COUNT);
  const modelMatrix = makeModelMatrix(index, drawCount);
  objectUniforms.set(modelMatrix.toArray(), 0);
  objectUniforms.set(makeObjectColor(index), 16);
  return objectUniforms;
}

function makeModelMatrix(index: number, drawCount: number): Matrix4 {
  if (index === 0) return new Matrix4().scale([5, 5, 5]);

  const normalizedIndex = index / Math.max(drawCount - 1, 1);
  const angle = normalizedIndex * Math.PI * 96 + index * 0.013;
  const radius = 10 + (index % 64) * 0.14;
  const height = Math.sin(index * 0.73) * 2.4;
  const scale = 0.08 + ((index * 17) % 23) / 110;

  return new Matrix4()
    .translate([Math.cos(angle) * radius, height, Math.sin(angle) * radius])
    .rotateXYZ([index * 0.09, index * 0.13, index * 0.17])
    .scale([scale, scale, scale]);
}

function makeObjectColor(index: number): [number, number, number, number] {
  if (index === 0) return [0.86, 0.76, 0.5, 1];

  const colorBand = index % 7;
  return [
    0.28 + colorBand * 0.055,
    0.24 + ((index * 3) % 7) * 0.045,
    0.3 + ((index * 5) % 7) * 0.05,
    1
  ];
}
