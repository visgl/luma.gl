// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {getWebXRGamepadState, getWebXRGamepadStates} from '../../src/webxr/webxr-gamepad';
import type {WebXRInputState} from '../../src/webxr/webxr-manager';

test('webxr#getWebXRGamepadState snapshots xr-standard buttons and axes', testCase => {
  const inputState = makeWebXRInputState({
    mapping: 'xr-standard',
    buttons: [
      {value: 0.75, pressed: true, touched: true},
      {value: 0.25, pressed: false, touched: true},
      {value: 0, pressed: false, touched: false},
      {value: 1, pressed: true, touched: true},
      {value: 0.5, pressed: false, touched: false}
    ],
    axes: [0.1, -0.2, 0.3, -0.4, 0.5]
  });

  const gamepadState = getWebXRGamepadState(inputState);

  testCase.ok(gamepadState, 'returns state when a gamepad is present');
  testCase.equal(gamepadState?.inputState, inputState, 'keeps input-state identity');
  testCase.equal(gamepadState?.inputSource, inputState.inputSource, 'keeps input-source identity');
  testCase.equal(gamepadState?.mapping, 'xr-standard', 'keeps gamepad mapping');
  testCase.equal(gamepadState?.isXRStandardMapping, true, 'detects xr-standard mapping');
  testCase.equal(gamepadState?.primaryTrigger?.name, 'trigger', 'names primary trigger');
  testCase.equal(gamepadState?.primaryTrigger?.value, 0.75, 'snapshots trigger value');
  testCase.equal(gamepadState?.primaryTrigger?.pressed, true, 'snapshots trigger press state');
  testCase.equal(gamepadState?.primarySqueeze?.name, 'squeeze', 'names primary squeeze');
  testCase.equal(gamepadState?.primaryTouchpad?.name, 'touchpad', 'names primary touchpad');
  testCase.equal(gamepadState?.primaryThumbstick?.name, 'thumbstick', 'names primary thumbstick');
  testCase.equal(gamepadState?.buttons[4]?.name, 'button-4', 'names extra buttons by index');
  testCase.deepEqual(gamepadState?.touchpad, [0.1, -0.2], 'snapshots touchpad axes');
  testCase.deepEqual(gamepadState?.thumbstick, [0.3, -0.4], 'snapshots thumbstick axes');
  testCase.equal(gamepadState?.axes[4]?.name, 'axis-4', 'names extra axes by index');
  testCase.deepEqual(
    gamepadState?.pressed.map(button => button.name),
    ['trigger', 'thumbstick'],
    'collects pressed buttons'
  );
  testCase.deepEqual(
    gamepadState?.touched.map(button => button.name),
    ['trigger', 'squeeze', 'thumbstick'],
    'collects touched buttons'
  );

  inputState.gamepad!.buttons[0] = {value: 0, pressed: false, touched: false} as GamepadButton;
  testCase.equal(
    gamepadState?.primaryTrigger?.value,
    0.75,
    'snapshot is stable when live gamepad object mutates'
  );
  testCase.end();
});

test('webxr#getWebXRGamepadStates filters missing gamepads', testCase => {
  const gamepadInputState = makeWebXRInputState({
    mapping: '',
    buttons: [{value: 0.5, pressed: false, touched: true}],
    axes: [0.25]
  });
  const emptyInputState = {...gamepadInputState, gamepad: null};

  const gamepadState = getWebXRGamepadState(emptyInputState);
  const gamepadStates = getWebXRGamepadStates([emptyInputState, gamepadInputState]);

  testCase.equal(gamepadState, null, 'missing gamepads return null');
  testCase.equal(gamepadStates.length, 1, 'batch helper filters missing gamepads');
  testCase.equal(
    gamepadStates[0]?.isXRStandardMapping,
    false,
    'empty mappings are not xr-standard'
  );
  testCase.equal(gamepadStates[0]?.buttons[0]?.name, 'button-0', 'nonstandard buttons are generic');
  testCase.equal(gamepadStates[0]?.axes[0]?.name, 'axis-0', 'nonstandard axes are generic');
  testCase.equal(gamepadStates[0]?.primaryTrigger, null, 'nonstandard mappings have no trigger');
  testCase.equal(gamepadStates[0]?.touchpad, null, 'incomplete axis pairs return null');
  testCase.equal(
    getWebXRGamepadStates(null).length,
    0,
    'null input-state arrays return empty arrays'
  );
  testCase.end();
});

function makeWebXRInputState(props: {
  mapping: GamepadMappingType | '';
  buttons: GamepadButtonInit[];
  axes: number[];
}): WebXRInputState {
  const inputSource = {
    handedness: 'right',
    targetRayMode: 'tracked-pointer',
    targetRaySpace: new EventTarget() as XRSpace,
    gripSpace: new EventTarget() as XRSpace,
    profiles: ['generic-trigger']
  } as XRInputSource;

  return {
    inputSource,
    index: 0,
    handedness: 'right',
    targetRayMode: 'tracked-pointer',
    profiles: inputSource.profiles,
    gamepad: makeGamepad(props),
    hand: null,
    targetRayPose: null,
    targetRayMatrix: null,
    gripPose: null,
    gripMatrix: null,
    selectActive: false,
    squeezeActive: false
  };
}

function makeGamepad(props: {
  mapping: GamepadMappingType | '';
  buttons: GamepadButtonInit[];
  axes: number[];
}): Gamepad {
  return {
    axes: props.axes,
    buttons: props.buttons.map(button => ({...button}) as GamepadButton),
    connected: true,
    hapticActuators: [],
    id: '',
    index: -1,
    mapping: props.mapping,
    timestamp: 0,
    vibrationActuator: null
  } as Gamepad;
}
