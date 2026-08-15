// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {getWebXRGamepadStates} from '../../src/webxr/webxr-gamepad';
import {
  getWebXRLocomotionAxes,
  getWebXRLocomotionAxisValue,
  getWebXRLocomotionGamepadState,
  getWebXRLocomotionState
} from '../../src/webxr/webxr-locomotion';
import type {WebXRInputState} from '../../src/webxr/webxr-manager';

test('webxr#getWebXRLocomotionState resolves default thumbstick movement and turning', testCase => {
  const leftInputState = makeWebXRInputState('left', [0, 0, 0.575, -1]);
  const rightInputState = makeWebXRInputState('right', [0, 0, 0.7875, 0]);

  const locomotionState = getWebXRLocomotionState([leftInputState, rightInputState], {
    deadzone: 0.15,
    snapTurnThreshold: 0.7
  });

  testCase.equal(locomotionState.moveInputState, leftInputState, 'uses left input for movement');
  testCase.equal(locomotionState.turnInputState, rightInputState, 'uses right input for turning');
  testCase.deepEqual(
    locomotionState.move,
    [0.49999999999999994, 1],
    'returns strafe and forward movement'
  );
  testCase.equal(locomotionState.turn, 0.75, 'returns normalized turn input');
  testCase.equal(locomotionState.snapTurn, 1, 'reports positive snap-turn intent');
  testCase.equal(locomotionState.moveActive, true, 'movement is active');
  testCase.equal(locomotionState.turnActive, true, 'turning is active');
  testCase.equal(locomotionState.axis, 'thumbstick', 'defaults to thumbstick axes');
  testCase.end();
});

test('webxr#getWebXRLocomotionState supports touchpads and inverted conventions', testCase => {
  const inputState = makeWebXRInputState('right', [-1, 0.5, 0, 0]);

  const locomotionState = getWebXRLocomotionState([inputState], {
    axis: 'touchpad',
    moveHandedness: 'any',
    turnHandedness: 'right',
    deadzone: 0,
    snapTurnThreshold: 1,
    invertMoveY: false,
    invertTurnX: true
  });

  testCase.equal(
    locomotionState.moveInputState,
    inputState,
    'uses any matching input for movement'
  );
  testCase.equal(locomotionState.turnInputState, inputState, 'uses matching input for turn');
  testCase.deepEqual(locomotionState.move, [-1, 0.5], 'can keep Y movement sign');
  testCase.equal(locomotionState.turn, 1, 'can invert turn sign');
  testCase.equal(locomotionState.snapTurn, 1, 'snap threshold includes the edge value');
  testCase.deepEqual(locomotionState.gamepadStates.length, 1, 'keeps gamepad snapshots');
  testCase.end();
});

test('webxr#locomotion helpers handle dead zones and missing axes', testCase => {
  const inputState = makeWebXRInputState('none', [0.2, -0.2]);
  const gamepadState = getWebXRGamepadStates([inputState])[0]!;

  testCase.equal(getWebXRLocomotionAxisValue(0.2, 0.2), 0, 'dead-zone edge returns zero');
  testCase.equal(
    getWebXRLocomotionAxisValue(0.6, 0.2),
    0.49999999999999994,
    'values outside the dead zone are rescaled'
  );
  testCase.equal(getWebXRLocomotionAxisValue(-1, 1), 0, 'dead zone clamps to one');
  testCase.equal(
    getWebXRLocomotionGamepadState([gamepadState], 'left'),
    null,
    'handedness mismatches return null'
  );
  testCase.equal(
    getWebXRLocomotionGamepadState([gamepadState], 'any', 'touchpad'),
    gamepadState,
    'any handedness can select a matching touchpad'
  );
  testCase.deepEqual(
    getWebXRLocomotionAxes(gamepadState, 'touchpad'),
    [0.2, -0.2],
    'returns touchpad axes'
  );
  testCase.equal(
    getWebXRLocomotionAxes(gamepadState, 'thumbstick'),
    null,
    'missing axis pairs return null'
  );

  const locomotionState = getWebXRLocomotionState(null);
  testCase.deepEqual(locomotionState.inputStates, [], 'null inputs become an empty list');
  testCase.deepEqual(locomotionState.gamepadStates, [], 'null inputs have no gamepad states');
  testCase.deepEqual(locomotionState.move, [0, 0], 'missing gamepads have no movement');
  testCase.equal(locomotionState.snapTurn, 0, 'missing gamepads have no snap turn');
  testCase.end();
});

function makeWebXRInputState(handedness: XRHandedness, axes: number[]): WebXRInputState {
  const inputSource = {
    handedness,
    targetRayMode: 'tracked-pointer',
    targetRaySpace: new EventTarget() as XRSpace,
    gripSpace: new EventTarget() as XRSpace,
    profiles: ['generic-trigger-squeeze-thumbstick']
  } as XRInputSource;

  return {
    inputSource,
    index: 0,
    handedness,
    targetRayMode: 'tracked-pointer',
    profiles: inputSource.profiles,
    gamepad: makeGamepad(axes),
    hand: null,
    targetRayPose: null,
    targetRayMatrix: null,
    gripPose: null,
    gripMatrix: null,
    selectActive: false,
    squeezeActive: false
  };
}

function makeGamepad(axes: number[]): Gamepad {
  return {
    axes,
    buttons: [],
    connected: true,
    hapticActuators: [],
    id: '',
    index: -1,
    mapping: 'xr-standard',
    timestamp: 0,
    vibrationActuator: null
  } as Gamepad;
}
