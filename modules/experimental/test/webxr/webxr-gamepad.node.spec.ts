// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {
  WebXRGamepadActionManager,
  getWebXRGamepadButtonActionState,
  getWebXRGamepadState,
  getWebXRGamepadStates
} from '../../src/webxr/webxr-gamepad';
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

test('webxr#WebXRGamepadActionManager reports button transitions', testCase => {
  const inputState = makeWebXRInputState({
    mapping: 'xr-standard',
    buttons: [
      {value: 0, pressed: false, touched: false},
      {value: 0, pressed: false, touched: false}
    ],
    axes: []
  });
  const manager = new WebXRGamepadActionManager();

  const firstActions = manager.update([inputState]);
  testCase.equal(firstActions.length, 2, 'returns one action per current button');
  testCase.deepEqual(
    pickAction(firstActions[0]!),
    {
      name: 'trigger',
      value: 0,
      previousValue: 0,
      valueDelta: 0,
      pressed: false,
      wasPressed: false,
      pressStarted: false,
      pressEnded: false,
      touched: false,
      wasTouched: false,
      touchStarted: false,
      touchEnded: false
    },
    'starts from neutral previous state'
  );

  inputState.gamepad!.buttons[0] = {value: 1, pressed: true, touched: true} as GamepadButton;
  inputState.gamepad!.buttons[1] = {value: 0.4, pressed: false, touched: true} as GamepadButton;
  const secondActions = manager.update([inputState]);
  testCase.deepEqual(
    pickAction(secondActions[0]!),
    {
      name: 'trigger',
      value: 1,
      previousValue: 0,
      valueDelta: 1,
      pressed: true,
      wasPressed: false,
      pressStarted: true,
      pressEnded: false,
      touched: true,
      wasTouched: false,
      touchStarted: true,
      touchEnded: false
    },
    'reports press and touch starts'
  );
  testCase.deepEqual(
    pickAction(secondActions[1]!),
    {
      name: 'squeeze',
      value: 0.4,
      previousValue: 0,
      valueDelta: 0.4,
      pressed: false,
      wasPressed: false,
      pressStarted: false,
      pressEnded: false,
      touched: true,
      wasTouched: false,
      touchStarted: true,
      touchEnded: false
    },
    'tracks touch-only actions'
  );

  inputState.gamepad!.buttons[0] = {value: 0.25, pressed: false, touched: false} as GamepadButton;
  inputState.gamepad!.buttons[1] = {value: 0, pressed: false, touched: false} as GamepadButton;
  const thirdActions = manager.update([inputState]);
  testCase.deepEqual(
    pickAction(thirdActions[0]!),
    {
      name: 'trigger',
      value: 0.25,
      previousValue: 1,
      valueDelta: -0.75,
      pressed: false,
      wasPressed: true,
      pressStarted: false,
      pressEnded: true,
      touched: false,
      wasTouched: true,
      touchStarted: false,
      touchEnded: true
    },
    'reports press and touch ends'
  );

  manager.reset(inputState.inputSource);
  inputState.gamepad!.buttons[0] = {value: 0.5, pressed: true, touched: true} as GamepadButton;
  testCase.equal(
    manager.update([inputState])[0]?.wasPressed,
    false,
    'reset clears previous state for one input source'
  );
  testCase.end();
});

test('webxr#WebXRGamepadActionManager trims inactive input sources', testCase => {
  const firstInputState = makeWebXRInputState({
    mapping: 'xr-standard',
    buttons: [{value: 1, pressed: true, touched: true}],
    axes: []
  });
  const secondInputState = makeWebXRInputState({
    mapping: 'xr-standard',
    buttons: [{value: 0.2, pressed: false, touched: true}],
    axes: []
  });
  const manager = new WebXRGamepadActionManager();

  manager.update([firstInputState, secondInputState]);
  manager.update([secondInputState]);

  firstInputState.gamepad!.buttons[0] = {value: 0, pressed: false, touched: false} as GamepadButton;
  const firstActionAfterTrim = manager.update([firstInputState])[0];
  testCase.equal(firstActionAfterTrim?.wasPressed, false, 'inactive input source state is trimmed');
  testCase.equal(
    firstActionAfterTrim?.pressStarted,
    false,
    'trimmed source does not report stale release'
  );

  manager.reset();
  secondInputState.gamepad!.buttons[0] = {value: 1, pressed: true, touched: true} as GamepadButton;
  testCase.equal(
    manager.update([secondInputState])[0]?.pressStarted,
    true,
    'global reset clears every input source'
  );
  testCase.end();
});

test('webxr#getWebXRGamepadButtonActionState compares standalone states', testCase => {
  const inputState = makeWebXRInputState({
    mapping: 'xr-standard',
    buttons: [{value: 0.25, pressed: false, touched: false}],
    axes: []
  });
  const gamepadState = getWebXRGamepadState(inputState)!;

  const actionState = getWebXRGamepadButtonActionState(gamepadState, gamepadState.buttons[0]!, {
    value: 0.75,
    pressed: true,
    touched: true
  });

  testCase.equal(actionState.inputState, inputState, 'keeps input-state identity');
  testCase.equal(actionState.inputSource, inputState.inputSource, 'keeps input-source identity');
  testCase.equal(actionState.gamepadState, gamepadState, 'keeps gamepad-state identity');
  testCase.equal(actionState.button, gamepadState.buttons[0], 'keeps button-state identity');
  testCase.deepEqual(
    pickAction(actionState),
    {
      name: 'trigger',
      value: 0.25,
      previousValue: 0.75,
      valueDelta: -0.5,
      pressed: false,
      wasPressed: true,
      pressStarted: false,
      pressEnded: true,
      touched: false,
      wasTouched: true,
      touchStarted: false,
      touchEnded: true
    },
    'compares standalone previous button state'
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

function pickAction(actionState: {
  name: unknown;
  value: unknown;
  previousValue: unknown;
  valueDelta: unknown;
  pressed: unknown;
  wasPressed: unknown;
  pressStarted: unknown;
  pressEnded: unknown;
  touched: unknown;
  wasTouched: unknown;
  touchStarted: unknown;
  touchEnded: unknown;
}): object {
  return {
    name: actionState.name,
    value: actionState.value,
    previousValue: actionState.previousValue,
    valueDelta: actionState.valueDelta,
    pressed: actionState.pressed,
    wasPressed: actionState.wasPressed,
    pressStarted: actionState.pressStarted,
    pressEnded: actionState.pressEnded,
    touched: actionState.touched,
    wasTouched: actionState.wasTouched,
    touchStarted: actionState.touchStarted,
    touchEnded: actionState.touchEnded
  };
}
