// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Matrix4, radians} from '@math.gl/core';
import {type ShadowCamera} from '@luma.gl/engine/lighting';
import {
  getDirectionalCascadeViews,
  getPointShadowViews,
  getPracticalCascadeSplits,
  getSpotShadowView
} from '@luma.gl/engine/lighting';

const CAMERA = {
  viewMatrix: new Matrix4().lookAt({eye: [6, 5, 8], center: [0, 0, 0], up: [0, 1, 0]}),
  projectionMatrix: new Matrix4().perspective({
    fovy: radians(55),
    aspect: 1.5,
    near: 0.1,
    far: 100
  }),
  near: 0.1,
  far: 100
};

it('shadow cascades use practical monotonic splits', () => {
  const splits = getPracticalCascadeSplits(0.1, 100, 4, 0.5);
  expect(splits.length, 'creates one far split per cascade').toBe(4);
  expect(
    Boolean(splits.every((split, index) => index === 0 || split > splits[index - 1])),
    'monotonic'
  ).toBe(true);
  expect(splits[3], 'last cascade reaches the requested distance').toBe(100);
  expect(() => getPracticalCascadeSplits(0, 100, 4), 'validates range').toThrow(/0 < near < far/);
  expect(() => getPracticalCascadeSplits(0.1, 100, 5), 'validates count').toThrow(/1 to 4/);
  void 0;
});

it('directional cascades are stable under sub-texel camera movement', () => {
  const light = {
    direction: [0.45, 0.82, 0.35] as [number, number, number],
    shadowDistance: 80,
    casterDistance: 80,
    sourceAngularRadius: 0.006,
    cascadeSplitLambda: 0.5,
    cascadeBlendFraction: 0.1,
    farFadeFraction: 0.1,
    normalBias: 0.04,
    depthBias: 2,
    depthBiasSlopeScale: 2,
    strength: 1
  };
  const splits = getPracticalCascadeSplits(CAMERA.near, light.shadowDistance, 4, 0.5);
  const first = getDirectionalCascadeViews(CAMERA, light, splits, 4, 1024);
  const movedCamera = {
    ...CAMERA,
    viewMatrix: new Matrix4().lookAt({
      eye: [6.000001, 5, 8],
      center: [0.000001, 0, 0],
      up: [0, 1, 0]
    })
  };
  const second = getDirectionalCascadeViews(movedCamera, light, splits, 4, 1024);
  const webGPUCamera: ShadowCamera = {
    ...CAMERA,
    projectionMatrix: new Matrix4([
      1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 1
    ]).multiplyRight(CAMERA.projectionMatrix),
    clipDepth: 'zero-to-one'
  };
  const webGPUViews = getDirectionalCascadeViews(webGPUCamera, light, splits, 4, 1024);

  for (let cascadeIndex = 0; cascadeIndex < 4; cascadeIndex++) {
    expectWebGPUClipDepth(first[cascadeIndex].camera);
    for (let elementIndex = 0; elementIndex < 16; elementIndex++) {
      expect(
        webGPUViews[cascadeIndex].viewProjectionMatrix[elementIndex],
        'input clip conventions fit equivalent cascades'
      ).toBeCloseTo(first[cascadeIndex].viewProjectionMatrix[elementIndex], 6);
    }
    const firstMatrix = first[cascadeIndex].viewProjectionMatrix;
    const secondMatrix = second[cascadeIndex].viewProjectionMatrix;
    expect(
      Boolean(
        Math.abs(firstMatrix[12] - secondMatrix[12]) < 1e-7 &&
          Math.abs(firstMatrix[13] - secondMatrix[13]) < 1e-7
      ),
      `cascade ${cascadeIndex} keeps snapped XY translation`
    ).toBe(true);
  }
  void 0;
});

it('spot and point shadow cameras cover their complete light volumes', () => {
  const spot = getSpotShadowView({
    position: [2, 8, 3],
    direction: [0, -1, 0],
    range: 30,
    outerConeAngle: 0.45,
    nearPlane: 0.1,
    sourceRadius: 0.2,
    normalBias: 0.02,
    depthBias: 2,
    depthBiasSlopeScale: 2,
    strength: 1
  });
  expect(spot.camera.far, 'spot projection reaches range').toBe(30);
  expectWebGPUClipDepth(spot.camera);

  const pointViews = getPointShadowViews({
    position: [0, 4, 0],
    range: 20,
    nearPlane: 0.1,
    sourceRadius: 0.2,
    normalBias: 0.02,
    depthBias: 2,
    depthBiasSlopeScale: 2,
    strength: 1
  });
  expect(pointViews.length, 'point shadow has six canonical faces').toBe(6);
  for (const view of pointViews) expectWebGPUClipDepth(view.camera);
  expect(
    new Set(pointViews.map(view => Array.from(view.viewProjectionMatrix).join(','))).size,
    'all face orientations are distinct'
  ).toBe(6);
  void 0;
});

function expectWebGPUClipDepth(camera: ShadowCamera): void {
  const projection = new Matrix4(camera.projectionMatrix);
  expect(
    projection.transformAsPoint([0, 0, -camera.near])[2],
    'near plane maps to WebGPU depth zero'
  ).toBeCloseTo(0, 6);
  expect(
    projection.transformAsPoint([0, 0, -camera.far])[2],
    'far plane maps to WebGPU depth one'
  ).toBeCloseTo(1, 6);
}

it('WebGPU cube projections align off-axis texels with cube sampling on all six faces', () => {
  const views = getPointShadowViews(
    {
      position: [0, 0, 0],
      range: 20,
      nearPlane: 0.1,
      sourceRadius: 0,
      normalBias: 0,
      depthBias: 0,
      depthBiasSlopeScale: 0,
      strength: 1
    },
    true
  );
  // Cube lookup face axes: +X(-Z,-Y), -X(+Z,-Y), +Y(+X,+Z), -Y(+X,-Z), +Z(+X,-Y), -Z(-X,-Y).
  const samples = [
    {position: [2, 0.5, -0.25], coordinates: [0.5625, 0.375]},
    {position: [-2, 0.5, 0.25], coordinates: [0.5625, 0.375]},
    {position: [0.25, 2, 0.5], coordinates: [0.5625, 0.625]},
    {position: [0.25, -2, -0.5], coordinates: [0.5625, 0.625]},
    {position: [0.25, 0.5, 2], coordinates: [0.5625, 0.375]},
    {position: [-0.25, 0.5, -2], coordinates: [0.5625, 0.375]}
  ];
  samples.forEach((sample, index) => {
    const projected = views[index].viewProjectionMatrix.transformAsPoint(sample.position);
    expect((projected[0] + 1) / 2).toBeCloseTo(sample.coordinates[0], 6);
    expect((1 - projected[1]) / 2).toBeCloseTo(sample.coordinates[1], 6);
  });
});
