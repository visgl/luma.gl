// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {getWebXRHandPinch} from '../../src/webxr/webxr-hand-gestures';
import type {
  WebXRHandJointState,
  WebXRHandTrackingState
} from '../../src/webxr/webxr-hand-tracking';

test('webxr#getWebXRHandPinch resolves active thumb-index pinches', testCase => {
  const inputSource = {} as XRInputSource;
  const handState = makeHandState({
    inputSource,
    handedness: 'left',
    joints: [makeJoint('thumb-tip', [0, 0, 0]), makeJoint('index-finger-tip', [0.01, 0, 0])]
  });
  const pinchState = getWebXRHandPinch(handState);

  testCase.equal(pinchState?.inputSource, inputSource, 'retains source input');
  testCase.equal(pinchState?.handedness, 'left', 'retains handedness');
  testCase.equal(pinchState?.thumbJoint.jointName, 'thumb-tip', 'uses thumb tip');
  testCase.equal(pinchState?.fingerJoint.jointName, 'index-finger-tip', 'uses index tip');
  testCase.equal(pinchState?.pinchActive, true, 'marks close tips active');
  testCase.ok(Math.abs((pinchState?.distance || 0) - 0.01) < 1e-6, 'reports tip distance');
  testCase.ok((pinchState?.strength || 0) > 0.9, 'reports strong pinch');
  testCase.ok(
    Math.abs((pinchState?.position[0] || 0) - 0.005) < 1e-6 &&
      pinchState?.position[1] === 0 &&
      pinchState?.position[2] === 0,
    'reports midpoint position'
  );
  testCase.end();
});

test('webxr#getWebXRHandPinch handles falloff, custom joints, and partial data', testCase => {
  const handState = makeHandState({
    handedness: 'right',
    joints: [
      makeJoint('thumb-tip', [0, 0, 0]),
      makeJoint('index-finger-tip', [0.05, 0, 0]),
      makeJoint('middle-finger-tip', [0.018, 0, 0])
    ]
  });
  const inactivePinch = getWebXRHandPinch(handState);
  const customPinch = getWebXRHandPinch(handState, {
    fingerJointName: 'middle-finger-tip',
    activeDistance: 0.02,
    strengthDistance: 0.04
  });
  const missingPinch = getWebXRHandPinch(
    makeHandState({
      handedness: 'right',
      joints: [makeJoint('thumb-tip', [0, 0, 0])]
    })
  );
  const untrackedPinch = getWebXRHandPinch(
    makeHandState({
      handedness: 'right',
      joints: [
        makeJoint('thumb-tip', [0, 0, 0]),
        {...makeJoint('index-finger-tip', [0.01, 0, 0]), matrix: null}
      ]
    })
  );

  testCase.equal(inactivePinch?.pinchActive, false, 'marks distant index tip inactive');
  testCase.ok(
    (inactivePinch?.strength || 0) > 0 && (inactivePinch?.strength || 0) < 1,
    'reports falloff strength before release distance'
  );
  testCase.equal(customPinch?.pinchActive, true, 'supports custom finger joint');
  testCase.equal(customPinch?.fingerJoint.jointName, 'middle-finger-tip', 'retains custom joint');
  testCase.equal(missingPinch, null, 'returns null for missing finger joint');
  testCase.equal(untrackedPinch, null, 'returns null for untracked finger matrix');
  testCase.end();
});

function makeHandState(options: {
  inputSource?: XRInputSource;
  handedness: XRHandedness;
  joints: WebXRHandJointState[];
}): WebXRHandTrackingState {
  return {
    xrFrame: {} as XRFrame,
    inputSource: options.inputSource || ({} as XRInputSource),
    handedness: options.handedness,
    hand: {} as XRHand,
    joints: options.joints,
    matrices: new Float32Array(0),
    radii: new Float32Array(0),
    allJointsTracked: true
  };
}

function makeJoint(
  jointName: XRHandJoint,
  position: [number, number, number]
): WebXRHandJointState {
  const matrix = new Float32Array(16);
  matrix[0] = 1;
  matrix[5] = 1;
  matrix[10] = 1;
  matrix[12] = position[0];
  matrix[13] = position[1];
  matrix[14] = position[2];
  matrix[15] = 1;

  return {
    jointName,
    jointSpace: {jointName} as XRJointSpace,
    pose: null,
    matrix,
    radius: 0.01
  };
}
