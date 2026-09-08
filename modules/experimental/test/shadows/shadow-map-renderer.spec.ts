// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {Matrix4, radians} from '@math.gl/core';
import {ShadowMapRenderer} from '../../src/shadows/shadow-map-renderer';
import {
  getDirectionalCascadeViews,
  getPointShadowViews,
  getPracticalCascadeSplits,
  getSpotShadowView
} from '../../src/shadows/shadow-map-renderer';

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
  for (let cascadeIndex = 0; cascadeIndex < 4; cascadeIndex++) {
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
  expect(
    new Set(pointViews.map(view => Array.from(view.viewProjectionMatrix).join(','))).size,
    'all face orientations are distinct'
  ).toBe(6);
  void 0;
});

it('ShadowMapRenderer reuses, reconstructs and destroys resources', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }
  const renderer = new ShadowMapRenderer(device, {
    quality: 'low',
    directionalMapSize: 16,
    spotMapSize: 16,
    pointMapSize: 16
  });
  const callbackOrder: string[] = [];
  const options = {
    camera: CAMERA,
    directionalLights: [{direction: [0.45, 0.82, 0.35] as [number, number, number]}],
    spotLights: [
      {
        position: [0, 8, 0] as [number, number, number],
        direction: [0, -1, 0] as [number, number, number],
        range: 20,
        outerConeAngle: 0.4
      }
    ],
    pointLights: [{position: [0, 3, 0] as [number, number, number], range: 12}],
    drawShadowCasters: view =>
      callbackOrder.push(
        view.type === 'directional'
          ? `directional-${view.cascadeIndex}`
          : view.type === 'point'
            ? `point-${view.pointFace}`
            : 'spot-0'
      )
  };
  const firstProps = renderer.render(options);
  const secondProps = renderer.render(options);
  expect(firstProps.directionalShadowTexture, 'reuses maps').toBe(
    secondProps.directionalShadowTexture
  );
  expect(
    callbackOrder.slice(0, 10),
    'invokes views in deterministic cascade, spot and cube-face order'
  ).toEqual([
    'directional-0',
    'directional-1',
    'directional-2',
    'spot-0',
    'point-+X',
    'point--X',
    'point-+Y',
    'point--Y',
    'point-+Z',
    'point--Z'
  ]);

  renderer.setProps({quality: 'cinematic'});
  const rebuiltProps = renderer.render(options);
  expect(rebuiltProps.directionalShadowTexture, 'quality cascade change rebuilds maps').not.toBe(
    firstProps.directionalShadowTexture
  );
  expect(firstProps.directionalShadowTexture.destroyed, 'destroys replaced maps').toBe(true);
  expect(
    () =>
      renderer.render({...options, pointLights: [...options.pointLights, ...options.pointLights]}),
    'rejects active lights above capacity'
  ).toThrow(/exceeds configured capacity/);
  renderer.destroy();
  renderer.destroy();
  expect(rebuiltProps.pointShadowTexture.destroyed, 'destroy is idempotent').toBe(true);
  device.submit();
  void 0;
});
