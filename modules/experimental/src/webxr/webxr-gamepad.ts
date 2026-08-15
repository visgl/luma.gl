// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {WebXRInputState} from './webxr-manager';

export type WebXRGamepadButtonName =
  | 'trigger'
  | 'squeeze'
  | 'touchpad'
  | 'thumbstick'
  | `button-${number}`;

export type WebXRGamepadAxisName =
  | 'touchpad-x'
  | 'touchpad-y'
  | 'thumbstick-x'
  | 'thumbstick-y'
  | `axis-${number}`;

export type WebXRGamepadButtonState = {
  index: number;
  name: WebXRGamepadButtonName;
  value: number;
  pressed: boolean;
  touched: boolean;
};

export type WebXRGamepadAxisState = {
  index: number;
  name: WebXRGamepadAxisName;
  value: number;
};

export type WebXRGamepadState = {
  inputState: WebXRInputState;
  inputSource: XRInputSource;
  gamepad: Gamepad;
  mapping: string;
  isXRStandardMapping: boolean;
  buttons: readonly WebXRGamepadButtonState[];
  axes: readonly WebXRGamepadAxisState[];
  primaryTrigger: WebXRGamepadButtonState | null;
  primarySqueeze: WebXRGamepadButtonState | null;
  primaryTouchpad: WebXRGamepadButtonState | null;
  primaryThumbstick: WebXRGamepadButtonState | null;
  touchpad: readonly [x: number, y: number] | null;
  thumbstick: readonly [x: number, y: number] | null;
  pressed: readonly WebXRGamepadButtonState[];
  touched: readonly WebXRGamepadButtonState[];
};

const XR_STANDARD_BUTTON_NAMES: readonly WebXRGamepadButtonName[] = [
  'trigger',
  'squeeze',
  'touchpad',
  'thumbstick'
];

const XR_STANDARD_AXIS_NAMES: readonly WebXRGamepadAxisName[] = [
  'touchpad-x',
  'touchpad-y',
  'thumbstick-x',
  'thumbstick-y'
];

/** Snapshots the live XR gamepad attached to one WebXR input state. */
export function getWebXRGamepadState(inputState: WebXRInputState): WebXRGamepadState | null {
  const gamepad = inputState.gamepad;
  if (!gamepad) {
    return null;
  }

  const isXRStandardMapping = gamepad.mapping === 'xr-standard';
  const buttons = Array.from(gamepad.buttons, (button, index) =>
    getWebXRGamepadButtonState(button, index, isXRStandardMapping)
  );
  const axes = Array.from(gamepad.axes, (value, index) =>
    getWebXRGamepadAxisState(value, index, isXRStandardMapping)
  );

  return {
    inputState,
    inputSource: inputState.inputSource,
    gamepad,
    mapping: gamepad.mapping,
    isXRStandardMapping,
    buttons,
    axes,
    primaryTrigger: isXRStandardMapping ? buttons[0] || null : null,
    primarySqueeze: isXRStandardMapping ? buttons[1] || null : null,
    primaryTouchpad: isXRStandardMapping ? buttons[2] || null : null,
    primaryThumbstick: isXRStandardMapping ? buttons[3] || null : null,
    touchpad: isXRStandardMapping ? getWebXRGamepadAxes(axes, 0) : null,
    thumbstick: isXRStandardMapping ? getWebXRGamepadAxes(axes, 2) : null,
    pressed: buttons.filter(button => button.pressed),
    touched: buttons.filter(button => button.touched)
  };
}

export function getWebXRGamepadStates(
  inputStates: readonly WebXRInputState[] | null
): readonly WebXRGamepadState[] {
  return (inputStates || [])
    .map(inputState => getWebXRGamepadState(inputState))
    .filter((gamepadState): gamepadState is WebXRGamepadState => Boolean(gamepadState));
}

function getWebXRGamepadButtonState(
  button: GamepadButton,
  index: number,
  isXRStandardMapping: boolean
): WebXRGamepadButtonState {
  return {
    index,
    name: isXRStandardMapping
      ? XR_STANDARD_BUTTON_NAMES[index] || `button-${index}`
      : `button-${index}`,
    value: button.value,
    pressed: button.pressed,
    touched: button.touched
  };
}

function getWebXRGamepadAxisState(
  value: number,
  index: number,
  isXRStandardMapping: boolean
): WebXRGamepadAxisState {
  return {
    index,
    name: isXRStandardMapping ? XR_STANDARD_AXIS_NAMES[index] || `axis-${index}` : `axis-${index}`,
    value
  };
}

function getWebXRGamepadAxes(
  axes: readonly WebXRGamepadAxisState[],
  startIndex: number
): readonly [x: number, y: number] | null {
  const xAxis = axes[startIndex];
  const yAxis = axes[startIndex + 1];
  return xAxis && yAxis ? [xAxis.value, yAxis.value] : null;
}
