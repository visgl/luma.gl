// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {
  getWebXRInputGrip,
  getWebXRInputRay,
  getWebXRInputRayPlaneIntersection,
  getWebXRInputSourceState
} from '../../src/webxr/webxr-input';
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

test('webxr#getWebXRInputGrip resolves tracked controller grip poses', testCase => {
  const matrix = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -0.25, 1.125, -0.75, 1]);
  const inputState = makeMockWebXRInputState(null, matrix);
  const grip = getWebXRInputGrip(inputState);

  testCase.equal(grip?.inputState, inputState, 'retains source input state');
  testCase.equal(grip?.matrix, matrix, 'retains source grip matrix');
  testCase.deepEqual(grip?.position, [-0.25, 1.125, -0.75], 'uses matrix translation as position');
  testCase.equal(
    getWebXRInputGrip(makeMockWebXRInputState(null, null)),
    null,
    'missing grip matrices do not produce grips'
  );
  testCase.end();
});

test('webxr#getWebXRInputSourceState classifies input source capabilities', testCase => {
  const targetRayMatrix = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 2, 3, 1]);
  const gripMatrix = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 3, 2, 1, 1]);
  const controllerState = getWebXRInputSourceState(
    makeMockWebXRInputState(targetRayMatrix, gripMatrix, {
      gamepad: {} as Gamepad,
      profiles: ['oculus-touch-v3', 'generic-trigger-squeeze-thumbstick']
    })
  );

  testCase.equal(controllerState.kind, 'controller', 'tracked pointer without hand is controller');
  testCase.equal(controllerState.primaryProfile, 'oculus-touch-v3', 'keeps primary profile');
  testCase.equal(controllerState.isController, true, 'marks controllers');
  testCase.equal(controllerState.usesTrackedPointer, true, 'marks tracked pointers');
  testCase.equal(controllerState.hasTargetRay, true, 'detects target ray matrices');
  testCase.equal(controllerState.hasGrip, true, 'detects grip matrices');
  testCase.equal(controllerState.hasGamepad, true, 'detects gamepads');

  const handState = getWebXRInputSourceState(
    makeMockWebXRInputState(targetRayMatrix, null, {
      hand: {} as XRHand,
      profiles: ['generic-hand-select']
    })
  );
  testCase.equal(handState.kind, 'hand', 'hand sources take precedence over tracked pointers');
  testCase.equal(handState.isHand, true, 'marks hands');
  testCase.equal(handState.isController, false, 'hands are not classified as controllers');

  const screenState = getWebXRInputSourceState(
    makeMockWebXRInputState(null, null, {
      handedness: 'none',
      targetRayMode: 'screen',
      profiles: ['generic-touchscreen']
    })
  );
  testCase.equal(screenState.kind, 'screen', 'screen target rays classify as screen input');
  testCase.equal(screenState.isScreen, true, 'marks screen input');
  testCase.equal(screenState.hasTargetRay, false, 'missing target rays are reflected');

  const gazeState = getWebXRInputSourceState(
    makeMockWebXRInputState(null, null, {
      targetRayMode: 'gaze',
      profiles: []
    })
  );
  testCase.equal(gazeState.kind, 'gaze', 'gaze target rays classify as gaze input');
  testCase.equal(gazeState.primaryProfile, null, 'empty profile lists return null');
  testCase.equal(gazeState.isGaze, true, 'marks gaze input');
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

function makeMockWebXRInputState(
  targetRayMatrix: Float32Array | null,
  gripMatrix: Float32Array | null = null,
  props: Partial<WebXRInputState> = {}
): WebXRInputState {
  return {
    inputSource: {} as XRInputSource,
    index: 0,
    handedness: props.handedness ?? 'right',
    targetRayMode: props.targetRayMode ?? 'tracked-pointer',
    profiles: props.profiles ?? [],
    gamepad: props.gamepad ?? null,
    hand: props.hand ?? null,
    targetRayPose: null,
    targetRayMatrix,
    gripPose: null,
    gripMatrix,
    selectActive: false,
    squeezeActive: false
  };
}
