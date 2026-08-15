// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {NumberArray2} from '@math.gl/core';
import {getWebXRGamepadStates, type WebXRGamepadState} from './webxr-gamepad';
import type {WebXRInputState} from './webxr-manager';

export type WebXRLocomotionAxis = 'thumbstick' | 'touchpad';
export type WebXRLocomotionHandedness = XRHandedness | 'any';

export type WebXRLocomotionProps = {
  moveHandedness?: WebXRLocomotionHandedness;
  turnHandedness?: WebXRLocomotionHandedness;
  axis?: WebXRLocomotionAxis;
  deadzone?: number;
  snapTurnThreshold?: number;
  invertMoveY?: boolean;
  invertTurnX?: boolean;
};

export type WebXRLocomotionState = {
  inputStates: readonly WebXRInputState[];
  gamepadStates: readonly WebXRGamepadState[];
  moveInputState: WebXRInputState | null;
  turnInputState: WebXRInputState | null;
  move: NumberArray2;
  turn: number;
  snapTurn: -1 | 0 | 1;
  moveActive: boolean;
  turnActive: boolean;
  axis: WebXRLocomotionAxis;
  deadzone: number;
  snapTurnThreshold: number;
};

const DEFAULT_DEADZONE = 0.15;
const DEFAULT_SNAP_TURN_THRESHOLD = 0.75;

/** Derives app-level movement and turn intent from WebXR gamepad axes. */
export function getWebXRLocomotionState(
  inputStates: readonly WebXRInputState[] | null,
  props: WebXRLocomotionProps = {}
): WebXRLocomotionState {
  const resolvedInputStates = inputStates || [];
  const gamepadStates = getWebXRGamepadStates(resolvedInputStates);
  const axis = props.axis || 'thumbstick';
  const deadzone = getNormalizedThreshold(props.deadzone, DEFAULT_DEADZONE);
  const snapTurnThreshold = getNormalizedThreshold(
    props.snapTurnThreshold,
    DEFAULT_SNAP_TURN_THRESHOLD
  );
  const moveGamepadState = getWebXRLocomotionGamepadState(
    gamepadStates,
    props.moveHandedness || 'left',
    axis
  );
  const turnGamepadState = getWebXRLocomotionGamepadState(
    gamepadStates,
    props.turnHandedness || 'right',
    axis
  );
  const moveAxis = moveGamepadState ? getWebXRLocomotionAxes(moveGamepadState, axis) : null;
  const turnAxis = turnGamepadState ? getWebXRLocomotionAxes(turnGamepadState, axis) : null;
  const moveX = getWebXRLocomotionAxisValue(moveAxis?.[0] || 0, deadzone);
  const moveY = getWebXRLocomotionAxisValue(moveAxis?.[1] || 0, deadzone);
  const turnX = getWebXRLocomotionAxisValue(turnAxis?.[0] || 0, deadzone);
  const move: NumberArray2 = [moveX || 0, (props.invertMoveY === false ? moveY : -moveY) || 0];
  const turn = (props.invertTurnX ? -turnX : turnX) || 0;
  const snapTurn: -1 | 0 | 1 = Math.abs(turn) >= snapTurnThreshold ? (turn > 0 ? 1 : -1) : 0;

  return {
    inputStates: resolvedInputStates,
    gamepadStates,
    moveInputState: moveGamepadState?.inputState || null,
    turnInputState: turnGamepadState?.inputState || null,
    move,
    turn,
    snapTurn,
    moveActive: moveX !== 0 || moveY !== 0,
    turnActive: turn !== 0,
    axis,
    deadzone,
    snapTurnThreshold
  };
}

export function getWebXRLocomotionGamepadState(
  gamepadStates: readonly WebXRGamepadState[],
  handedness: WebXRLocomotionHandedness,
  axis: WebXRLocomotionAxis = 'thumbstick'
): WebXRGamepadState | null {
  return (
    gamepadStates.find(
      gamepadState =>
        (handedness === 'any' || gamepadState.inputState.handedness === handedness) &&
        Boolean(getWebXRLocomotionAxes(gamepadState, axis))
    ) || null
  );
}

export function getWebXRLocomotionAxes(
  gamepadState: WebXRGamepadState,
  axis: WebXRLocomotionAxis = 'thumbstick'
): readonly [x: number, y: number] | null {
  return axis === 'thumbstick' ? gamepadState.thumbstick : gamepadState.touchpad;
}

export function getWebXRLocomotionAxisValue(value: number, deadzone = DEFAULT_DEADZONE): number {
  const normalizedDeadzone = getNormalizedThreshold(deadzone, DEFAULT_DEADZONE);
  const magnitude = Math.abs(value);
  if (magnitude <= normalizedDeadzone) {
    return 0;
  }
  if (normalizedDeadzone >= 1) {
    return value > 0 ? 1 : -1;
  }
  const normalizedValue = (magnitude - normalizedDeadzone) / (1 - normalizedDeadzone);
  return (value > 0 ? normalizedValue : -normalizedValue) || 0;
}

function getNormalizedThreshold(value: number | undefined, defaultValue: number): number {
  return Math.max(0, Math.min(1, value ?? defaultValue));
}
