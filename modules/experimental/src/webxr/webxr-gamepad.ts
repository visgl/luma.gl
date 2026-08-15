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

export type WebXRGamepadButtonActionState = {
  inputState: WebXRInputState;
  inputSource: XRInputSource;
  gamepadState: WebXRGamepadState;
  button: WebXRGamepadButtonState;
  index: number;
  name: WebXRGamepadButtonName;
  value: number;
  previousValue: number;
  valueDelta: number;
  pressed: boolean;
  wasPressed: boolean;
  pressStarted: boolean;
  pressEnded: boolean;
  touched: boolean;
  wasTouched: boolean;
  touchStarted: boolean;
  touchEnded: boolean;
};

export type WebXRGamepadAxisActionProps = {
  deadzone?: number;
};

export type WebXRGamepadAxisActionState = {
  inputState: WebXRInputState;
  inputSource: XRInputSource;
  gamepadState: WebXRGamepadState;
  axis: WebXRGamepadAxisState;
  index: number;
  name: WebXRGamepadAxisName;
  value: number;
  previousValue: number;
  valueDelta: number;
  deadzone: number;
  active: boolean;
  wasActive: boolean;
  activeStarted: boolean;
  activeEnded: boolean;
};

export type WebXRGamepadPreviousButtonState = {
  value: number;
  pressed: boolean;
  touched: boolean;
};

export type WebXRGamepadPreviousAxisState = {
  value: number;
  active: boolean;
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

const DEFAULT_AXIS_DEADZONE = 0.15;

/** Tracks per-frame WebXR gamepad button action transitions. */
export class WebXRGamepadActionManager {
  private _previousButtonsByInputSource = new Map<
    XRInputSource,
    Map<number, WebXRGamepadPreviousButtonState>
  >();

  update(inputStates: readonly WebXRInputState[] | null): readonly WebXRGamepadButtonActionState[] {
    const gamepadStates = getWebXRGamepadStates(inputStates);
    const activeInputSources = new Set<XRInputSource>();
    const actionStates: WebXRGamepadButtonActionState[] = [];

    for (const gamepadState of gamepadStates) {
      activeInputSources.add(gamepadState.inputSource);
      const previousButtons =
        this._previousButtonsByInputSource.get(gamepadState.inputSource) || new Map();
      const nextButtons = new Map<number, WebXRGamepadPreviousButtonState>();

      for (const button of gamepadState.buttons) {
        const previousButton = previousButtons.get(button.index);
        actionStates.push(getWebXRGamepadButtonActionState(gamepadState, button, previousButton));
        nextButtons.set(button.index, {
          value: button.value,
          pressed: button.pressed,
          touched: button.touched
        });
      }

      this._previousButtonsByInputSource.set(gamepadState.inputSource, nextButtons);
    }

    for (const inputSource of this._previousButtonsByInputSource.keys()) {
      if (!activeInputSources.has(inputSource)) {
        this._previousButtonsByInputSource.delete(inputSource);
      }
    }

    return actionStates;
  }

  reset(inputSource?: XRInputSource): void {
    if (inputSource) {
      this._previousButtonsByInputSource.delete(inputSource);
    } else {
      this._previousButtonsByInputSource.clear();
    }
  }
}

/** Tracks per-frame WebXR gamepad axis value and dead-zone transitions. */
export class WebXRGamepadAxisManager {
  private _previousAxesByInputSource = new Map<
    XRInputSource,
    Map<number, WebXRGamepadPreviousAxisState>
  >();

  update(
    inputStates: readonly WebXRInputState[] | null,
    props: WebXRGamepadAxisActionProps = {}
  ): readonly WebXRGamepadAxisActionState[] {
    const gamepadStates = getWebXRGamepadStates(inputStates);
    const activeInputSources = new Set<XRInputSource>();
    const actionStates: WebXRGamepadAxisActionState[] = [];

    for (const gamepadState of gamepadStates) {
      activeInputSources.add(gamepadState.inputSource);
      const previousAxes =
        this._previousAxesByInputSource.get(gamepadState.inputSource) || new Map();
      const nextAxes = new Map<number, WebXRGamepadPreviousAxisState>();

      for (const axis of gamepadState.axes) {
        const previousAxis = previousAxes.get(axis.index);
        const actionState = getWebXRGamepadAxisActionState(gamepadState, axis, {
          ...props,
          previousAxis
        });
        actionStates.push(actionState);
        nextAxes.set(axis.index, {
          value: axis.value,
          active: actionState.active
        });
      }

      this._previousAxesByInputSource.set(gamepadState.inputSource, nextAxes);
    }

    for (const inputSource of this._previousAxesByInputSource.keys()) {
      if (!activeInputSources.has(inputSource)) {
        this._previousAxesByInputSource.delete(inputSource);
      }
    }

    return actionStates;
  }

  reset(inputSource?: XRInputSource): void {
    if (inputSource) {
      this._previousAxesByInputSource.delete(inputSource);
    } else {
      this._previousAxesByInputSource.clear();
    }
  }
}

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

export function getWebXRGamepadButtonActionState(
  gamepadState: WebXRGamepadState,
  button: WebXRGamepadButtonState,
  previousButton: WebXRGamepadPreviousButtonState | null = null
): WebXRGamepadButtonActionState {
  const previousValue = previousButton?.value ?? 0;
  const wasPressed = previousButton?.pressed ?? false;
  const wasTouched = previousButton?.touched ?? false;

  return {
    inputState: gamepadState.inputState,
    inputSource: gamepadState.inputSource,
    gamepadState,
    button,
    index: button.index,
    name: button.name,
    value: button.value,
    previousValue,
    valueDelta: button.value - previousValue,
    pressed: button.pressed,
    wasPressed,
    pressStarted: button.pressed && !wasPressed,
    pressEnded: !button.pressed && wasPressed,
    touched: button.touched,
    wasTouched,
    touchStarted: button.touched && !wasTouched,
    touchEnded: !button.touched && wasTouched
  };
}

export function getWebXRGamepadAxisActionState(
  gamepadState: WebXRGamepadState,
  axis: WebXRGamepadAxisState,
  props: WebXRGamepadAxisActionProps & {
    previousAxis?: WebXRGamepadPreviousAxisState | null;
  } = {}
): WebXRGamepadAxisActionState {
  const deadzone = getNormalizedAxisDeadzone(props.deadzone);
  const previousValue = props.previousAxis?.value ?? 0;
  const wasActive = props.previousAxis?.active ?? false;
  const active = Math.abs(axis.value) > deadzone;

  return {
    inputState: gamepadState.inputState,
    inputSource: gamepadState.inputSource,
    gamepadState,
    axis,
    index: axis.index,
    name: axis.name,
    value: axis.value,
    previousValue,
    valueDelta: axis.value - previousValue,
    deadzone,
    active,
    wasActive,
    activeStarted: active && !wasActive,
    activeEnded: !active && wasActive
  };
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

function getNormalizedAxisDeadzone(deadzone: number = DEFAULT_AXIS_DEADZONE): number {
  return Math.max(0, Math.min(1, deadzone));
}
