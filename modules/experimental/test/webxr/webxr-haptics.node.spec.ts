// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {
  getWebXRInputHapticActuator,
  pulseWebXRInputHaptics,
  type WebXRGamepadHapticActuator
} from '../../src/webxr/webxr-haptics';
import type {WebXRInputState} from '../../src/webxr/webxr-manager';

test('webxr#pulseWebXRInputHaptics pulses the first gamepad haptic actuator', async testCase => {
  const actuator = makeMockHapticActuator();
  const inputState = makeMockWebXRInputState({
    hapticActuators: [{} as WebXRGamepadHapticActuator, actuator]
  });

  const result = await pulseWebXRInputHaptics(inputState, {
    intensity: 1.7,
    duration: 25
  });

  testCase.equal(getWebXRInputHapticActuator(inputState), actuator, 'uses first pulse actuator');
  testCase.equal(result?.inputState, inputState, 'retains source input state');
  testCase.equal(result?.actuator, actuator, 'retains selected actuator');
  testCase.equal(result?.intensity, 1, 'clamps intensity');
  testCase.equal(result?.duration, 25, 'keeps supplied duration');
  testCase.equal(result?.value, 'ok', 'returns actuator pulse result');
  testCase.deepEqual(actuator.pulses, [{intensity: 1, duration: 25}], 'pulses actuator');
  testCase.end();
});

test('webxr#pulseWebXRInputHaptics handles fallbacks and unsupported inputs', async testCase => {
  const vibrationActuator = makeMockHapticActuator();
  const fallbackInputState = makeMockWebXRInputState({vibrationActuator});
  const emptyInputState = makeMockWebXRInputState({});
  const noGamepadInputState = makeMockWebXRInputState(null);

  const fallbackResult = await pulseWebXRInputHaptics(fallbackInputState, {
    intensity: -1,
    duration: -4
  });

  testCase.equal(
    getWebXRInputHapticActuator(fallbackInputState),
    vibrationActuator,
    'falls back to vibrationActuator'
  );
  testCase.equal(fallbackResult?.intensity, 0, 'clamps low intensity');
  testCase.equal(fallbackResult?.duration, 0, 'clamps low duration');
  testCase.deepEqual(
    vibrationActuator.pulses,
    [{intensity: 0, duration: 0}],
    'pulses fallback actuator'
  );
  testCase.equal(
    await pulseWebXRInputHaptics(emptyInputState),
    null,
    'returns null without actuator'
  );
  testCase.equal(
    await pulseWebXRInputHaptics(noGamepadInputState),
    null,
    'returns null without gamepad'
  );
  testCase.end();
});

function makeMockHapticActuator(): WebXRGamepadHapticActuator & {
  pulses: {intensity: number; duration: number}[];
} {
  return {
    pulses: [],
    pulse(intensity: number, duration: number): string {
      this.pulses.push({intensity, duration});
      return 'ok';
    }
  };
}

function makeMockWebXRInputState(
  gamepad:
    | (Partial<Gamepad> & {
        hapticActuators?: readonly WebXRGamepadHapticActuator[];
        vibrationActuator?: WebXRGamepadHapticActuator;
      })
    | null
): WebXRInputState {
  return {
    inputSource: {} as XRInputSource,
    index: 0,
    handedness: 'right',
    targetRayMode: 'tracked-pointer',
    profiles: [],
    gamepad: gamepad as Gamepad | null,
    hand: null,
    targetRayPose: null,
    targetRayMatrix: null,
    gripPose: null,
    gripMatrix: null,
    selectActive: false,
    squeezeActive: false
  };
}
