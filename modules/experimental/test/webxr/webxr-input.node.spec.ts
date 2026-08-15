// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {getWebXRInputRay} from '../../src/webxr/webxr-input';
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
