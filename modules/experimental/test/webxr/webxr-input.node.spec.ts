// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebXRInputRay, getWebXRInputRayPlaneIntersection} from '../../src/webxr/webxr-input';
import type {WebXRInputState} from '../../src/webxr/webxr-manager';

it('webxr#getWebXRInputRay resolves origin and normalized target-ray direction', () => {
  const matrix = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, -3, 4, 0, 2, 5, 7, 1]);
  const inputState = makeMockWebXRInputState(matrix);
  const ray = getWebXRInputRay(inputState);

  expect(ray?.inputState, 'retains source input state').toBe(inputState);
  expect(ray?.matrix, 'retains source target-ray matrix').toBe(matrix);
  expect(ray?.origin, 'uses matrix translation as origin').toEqual([2, 5, 7]);
  expect(ray?.direction, 'normalizes negative local z').toEqual([0, 0.6, -0.8]);
  void 0;
});

it('webxr#getWebXRInputRay handles missing and degenerate target rays', () => {
  expect(
    getWebXRInputRay(makeMockWebXRInputState(null)),
    'missing target ray matrices do not produce rays'
  ).toBe(null);

  const ray = getWebXRInputRay(
    makeMockWebXRInputState(new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 3, 4, 5, 1]))
  );
  expect(ray?.origin, 'still resolves origin').toEqual([3, 4, 5]);
  expect(ray?.direction, 'falls back to forward direction').toEqual([0, 0, -1]);
  void 0;
});

it('webxr#getWebXRInputRayPlaneIntersection resolves floor hits and custom planes', () => {
  const floorRay = {
    inputState: makeMockWebXRInputState(null),
    origin: [0, 1.6, 0],
    direction: [0, -0.8, -0.6],
    matrix: new Float32Array(16)
  };
  const floorHit = getWebXRInputRayPlaneIntersection(floorRay);

  expect(floorHit?.ray, 'retains source ray').toBe(floorRay);
  expect(floorHit?.distance, 'returns normalized ray distance').toBe(2);
  expect(floorHit?.point, 'intersects default y=0 floor plane').toEqual([0, 0, -1.2]);

  const wallRay = {
    inputState: makeMockWebXRInputState(null),
    origin: [1, 2, 3],
    direction: [0, 0, -1],
    matrix: new Float32Array(16)
  };
  const wallHit = getWebXRInputRayPlaneIntersection(wallRay, {
    planePoint: [0, 0, 1],
    planeNormal: [0, 0, 2]
  });

  expect(wallHit?.distance, 'normalizes custom plane normals').toBe(2);
  expect(wallHit?.point, 'intersects custom plane').toEqual([1, 2, 1]);
  void 0;
});

it('webxr#getWebXRInputRayPlaneIntersection rejects unusable hits', () => {
  const ray = {
    inputState: makeMockWebXRInputState(null),
    origin: [0, 1, 0],
    direction: [0, -1, 0],
    matrix: new Float32Array(16)
  };

  expect(
    getWebXRInputRayPlaneIntersection(ray, {minDistance: 1.5}),
    'rejects hits before minDistance'
  ).toBe(null);
  expect(
    getWebXRInputRayPlaneIntersection(ray, {maxDistance: 0.5}),
    'rejects hits after maxDistance'
  ).toBe(null);
  expect(
    getWebXRInputRayPlaneIntersection({...ray, direction: [0, 1, 0]}),
    'rejects intersections behind the ray origin'
  ).toBe(null);
  expect(
    getWebXRInputRayPlaneIntersection({...ray, direction: [1, 0, 0]}),
    'rejects rays parallel to the plane'
  ).toBe(null);
  expect(
    getWebXRInputRayPlaneIntersection(ray, {planeNormal: [0, 0, 0]}),
    'rejects degenerate plane normals'
  ).toBe(null);
  void 0;
});

function makeMockWebXRInputState(targetRayMatrix: Float32Array | null): WebXRInputState {
  return {
    inputSource: {} as XRInputSource,
    index: 0,
    handedness: 'right',
    targetRayMode: 'tracked-pointer',
    profiles: [],
    gamepad: null,
    targetRayPose: null,
    targetRayMatrix,
    gripPose: null,
    gripMatrix: null,
    selectActive: false,
    squeezeActive: false
  };
}
