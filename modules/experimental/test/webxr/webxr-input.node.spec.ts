// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {getWebXRInputRay, getWebXRInputRayPlaneIntersection} from '../../src/webxr/webxr-input';
import type {WebXRInputState} from '../../src/webxr/webxr-manager';

test('webxr#getWebXRInputRay resolves origin and normalized target-ray direction', testCase => {
  const matrix = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, -3, 4, 0, 2, 5, 7, 1]);
  const inputState = makeMockWebXRInputState(matrix);
  const ray = getWebXRInputRay(inputState);

  testCase.equal(ray?.inputState, inputState, 'retains source input state');
  testCase.equal(ray?.matrix, matrix, 'retains source target-ray matrix');
  testCase.deepEqual(ray?.origin, [2, 5, 7], 'uses matrix translation as origin');
  testCase.deepEqual(ray?.direction, [0, 0.6, -0.8], 'normalizes negative local z');
  testCase.end();
});

test('webxr#getWebXRInputRay handles missing and degenerate target rays', testCase => {
  testCase.equal(
    getWebXRInputRay(makeMockWebXRInputState(null)),
    null,
    'missing target ray matrices do not produce rays'
  );

  const ray = getWebXRInputRay(
    makeMockWebXRInputState(new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 3, 4, 5, 1]))
  );
  testCase.deepEqual(ray?.origin, [3, 4, 5], 'still resolves origin');
  testCase.deepEqual(ray?.direction, [0, 0, -1], 'falls back to forward direction');
  testCase.end();
});

test('webxr#getWebXRInputRayPlaneIntersection resolves floor hits and custom planes', testCase => {
  const floorRay = {
    inputState: makeMockWebXRInputState(null),
    origin: [0, 1.6, 0],
    direction: [0, -0.8, -0.6],
    matrix: new Float32Array(16)
  };
  const floorHit = getWebXRInputRayPlaneIntersection(floorRay);

  testCase.equal(floorHit?.ray, floorRay, 'retains source ray');
  testCase.equal(floorHit?.distance, 2, 'returns normalized ray distance');
  testCase.deepEqual(floorHit?.point, [0, 0, -1.2], 'intersects default y=0 floor plane');

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

  testCase.equal(wallHit?.distance, 2, 'normalizes custom plane normals');
  testCase.deepEqual(wallHit?.point, [1, 2, 1], 'intersects custom plane');
  testCase.end();
});

test('webxr#getWebXRInputRayPlaneIntersection rejects unusable hits', testCase => {
  const ray = {
    inputState: makeMockWebXRInputState(null),
    origin: [0, 1, 0],
    direction: [0, -1, 0],
    matrix: new Float32Array(16)
  };

  testCase.equal(
    getWebXRInputRayPlaneIntersection(ray, {minDistance: 1.5}),
    null,
    'rejects hits before minDistance'
  );
  testCase.equal(
    getWebXRInputRayPlaneIntersection(ray, {maxDistance: 0.5}),
    null,
    'rejects hits after maxDistance'
  );
  testCase.equal(
    getWebXRInputRayPlaneIntersection({...ray, direction: [0, 1, 0]}),
    null,
    'rejects intersections behind the ray origin'
  );
  testCase.equal(
    getWebXRInputRayPlaneIntersection({...ray, direction: [1, 0, 0]}),
    null,
    'rejects rays parallel to the plane'
  );
  testCase.equal(
    getWebXRInputRayPlaneIntersection(ray, {planeNormal: [0, 0, 0]}),
    null,
    'rejects degenerate plane normals'
  );
  testCase.end();
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
    selectActive: false
  };
}
