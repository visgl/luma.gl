// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {NumberArray3} from '@math.gl/core';
import {getWebXRGamepadState} from './webxr-gamepad';
import type {WebXRInputState} from './webxr-manager';

/** Experimental v10 world-space target ray derived from one WebXR input source. */
export type WebXRInputRay = {
  inputState: WebXRInputState;
  origin: NumberArray3;
  direction: NumberArray3;
  matrix: Float32Array;
};

/** Experimental v10 world-space grip pose derived from one tracked WebXR input source. */
export type WebXRInputGrip = {
  inputState: WebXRInputState;
  position: NumberArray3;
  matrix: Float32Array;
};

export type WebXRInputSourceKind = 'controller' | 'hand' | 'screen' | 'gaze' | 'unknown';

export type WebXRInputSourceState = {
  inputState: WebXRInputState;
  kind: WebXRInputSourceKind;
  primaryProfile: string | null;
  targetRayMode: XRTargetRayMode;
  handedness: XRHandedness;
  isController: boolean;
  isHand: boolean;
  isScreen: boolean;
  isGaze: boolean;
  usesTrackedPointer: boolean;
  hasTargetRay: boolean;
  hasGrip: boolean;
  hasGamepad: boolean;
};

/** Experimental v10 normalized select/squeeze activation for one WebXR input source. */
export type WebXRInputActivationProps = {
  activationThreshold?: number;
};

export type WebXRInputActivationState = {
  inputState: WebXRInputState;
  inputSource: XRInputSource;
  selectActive: boolean;
  squeezeActive: boolean;
  triggerValue: number;
  squeezeValue: number;
  primaryAction: number;
  squeezeAction: number;
  activationThreshold: number;
  isPrimaryActive: boolean;
  isSqueezeActive: boolean;
};

export type WebXRInputPreviousActionState = {
  primaryAction: number;
  squeezeAction: number;
  isPrimaryActive: boolean;
  isSqueezeActive: boolean;
};

/** Experimental v10 per-frame action transition state for one WebXR input source. */
export type WebXRInputActionState = WebXRInputActivationState & {
  previousPrimaryAction: number;
  previousSqueezeAction: number;
  primaryActionDelta: number;
  squeezeActionDelta: number;
  wasPrimaryActive: boolean;
  wasSqueezeActive: boolean;
  primaryActionStarted: boolean;
  primaryActionEnded: boolean;
  squeezeActionStarted: boolean;
  squeezeActionEnded: boolean;
};

/** Experimental v10 consolidated state for one tracked-pointer WebXR controller. */
export type WebXRControllerState = {
  inputState: WebXRInputState;
  inputSource: XRInputSource;
  sourceState: WebXRInputSourceState;
  activationState: WebXRInputActivationState;
  primaryProfile: string | null;
  handedness: XRHandedness;
  ray: WebXRInputRay | null;
  grip: WebXRInputGrip | null;
  primaryAction: number;
  squeezeAction: number;
  isPrimaryActive: boolean;
  isSqueezeActive: boolean;
};

export type WebXRInputRayPlaneIntersectionProps = {
  planePoint?: NumberArray3;
  planeNormal?: NumberArray3;
  minDistance?: number;
  maxDistance?: number;
};

/** Experimental v10 world-space hit derived from one input ray and plane. */
export type WebXRInputRayPlaneIntersection = {
  ray: WebXRInputRay;
  point: NumberArray3;
  distance: number;
};

const DEFAULT_INPUT_ACTION_THRESHOLD = 0.05;

/** Tracks per-frame select/squeeze transitions across WebXR input sources. */
export class WebXRInputActionManager {
  private _previousActionsByInputSource = new Map<XRInputSource, WebXRInputPreviousActionState>();

  update(
    inputStates: readonly WebXRInputState[] | null,
    props: WebXRInputActivationProps = {}
  ): readonly WebXRInputActionState[] {
    const activeInputSources = new Set<XRInputSource>();
    const actionStates: WebXRInputActionState[] = [];

    for (const inputState of inputStates || []) {
      activeInputSources.add(inputState.inputSource);
      const actionState = getWebXRInputActionState(inputState, {
        ...props,
        previousAction: this._previousActionsByInputSource.get(inputState.inputSource)
      });
      actionStates.push(actionState);
      this._previousActionsByInputSource.set(inputState.inputSource, {
        primaryAction: actionState.primaryAction,
        squeezeAction: actionState.squeezeAction,
        isPrimaryActive: actionState.isPrimaryActive,
        isSqueezeActive: actionState.isSqueezeActive
      });
    }

    for (const inputSource of this._previousActionsByInputSource.keys()) {
      if (!activeInputSources.has(inputSource)) {
        this._previousActionsByInputSource.delete(inputSource);
      }
    }

    return actionStates;
  }

  reset(inputSource?: XRInputSource): void {
    if (inputSource) {
      this._previousActionsByInputSource.delete(inputSource);
    } else {
      this._previousActionsByInputSource.clear();
    }
  }
}

export function getWebXRInputRay(inputState: WebXRInputState): WebXRInputRay | null {
  const matrix = inputState.targetRayMatrix;
  if (!matrix) {
    return null;
  }

  const direction: NumberArray3 = [-matrix[8], -matrix[9], -matrix[10]];
  normalizeVector3(direction);

  return {
    inputState,
    origin: [matrix[12], matrix[13], matrix[14]],
    direction,
    matrix
  };
}

export function getWebXRInputGrip(inputState: WebXRInputState): WebXRInputGrip | null {
  const matrix = inputState.gripMatrix;
  if (!matrix) {
    return null;
  }

  return {
    inputState,
    position: [matrix[12], matrix[13], matrix[14]],
    matrix
  };
}

export function getWebXRInputSourceState(inputState: WebXRInputState): WebXRInputSourceState {
  const primaryProfile = inputState.profiles[0] ?? null;
  const isHand = Boolean(inputState.hand);
  const isScreen = inputState.targetRayMode === 'screen';
  const isGaze = inputState.targetRayMode === 'gaze';
  const usesTrackedPointer = inputState.targetRayMode === 'tracked-pointer';
  const isController = usesTrackedPointer && !isHand;
  const kind: WebXRInputSourceKind = isHand
    ? 'hand'
    : isController
      ? 'controller'
      : isScreen
        ? 'screen'
        : isGaze
          ? 'gaze'
          : 'unknown';

  return {
    inputState,
    kind,
    primaryProfile,
    targetRayMode: inputState.targetRayMode,
    handedness: inputState.handedness,
    isController,
    isHand,
    isScreen,
    isGaze,
    usesTrackedPointer,
    hasTargetRay: Boolean(inputState.targetRayMatrix),
    hasGrip: Boolean(inputState.gripMatrix),
    hasGamepad: Boolean(inputState.gamepad)
  };
}

export function getWebXRInputActivationState(
  inputState: WebXRInputState,
  props: WebXRInputActivationProps = {}
): WebXRInputActivationState {
  const activationThreshold = clampActionValue(props.activationThreshold ?? 0);
  const gamepadState = getWebXRGamepadState(inputState);
  const triggerValue = clampActionValue(gamepadState?.primaryTrigger?.value ?? 0);
  const squeezeValue = clampActionValue(gamepadState?.primarySqueeze?.value ?? 0);
  const primaryAction = Math.max(inputState.selectActive ? 1 : 0, triggerValue);
  const squeezeAction = Math.max(inputState.squeezeActive ? 1 : 0, squeezeValue);

  return {
    inputState,
    inputSource: inputState.inputSource,
    selectActive: inputState.selectActive,
    squeezeActive: inputState.squeezeActive,
    triggerValue,
    squeezeValue,
    primaryAction,
    squeezeAction,
    activationThreshold,
    isPrimaryActive: primaryAction > activationThreshold,
    isSqueezeActive: squeezeAction > activationThreshold
  };
}

export function getWebXRInputActionState(
  inputState: WebXRInputState,
  props: WebXRInputActivationProps & {
    previousAction?: WebXRInputPreviousActionState | null;
  } = {}
): WebXRInputActionState {
  const activationState = getWebXRInputActivationState(inputState, {
    activationThreshold: props.activationThreshold ?? DEFAULT_INPUT_ACTION_THRESHOLD
  });
  const previousPrimaryAction = props.previousAction?.primaryAction ?? 0;
  const previousSqueezeAction = props.previousAction?.squeezeAction ?? 0;
  const wasPrimaryActive = props.previousAction?.isPrimaryActive ?? false;
  const wasSqueezeActive = props.previousAction?.isSqueezeActive ?? false;

  return {
    ...activationState,
    previousPrimaryAction,
    previousSqueezeAction,
    primaryActionDelta: activationState.primaryAction - previousPrimaryAction,
    squeezeActionDelta: activationState.squeezeAction - previousSqueezeAction,
    wasPrimaryActive,
    wasSqueezeActive,
    primaryActionStarted: activationState.isPrimaryActive && !wasPrimaryActive,
    primaryActionEnded: !activationState.isPrimaryActive && wasPrimaryActive,
    squeezeActionStarted: activationState.isSqueezeActive && !wasSqueezeActive,
    squeezeActionEnded: !activationState.isSqueezeActive && wasSqueezeActive
  };
}

export function getWebXRControllerState(
  inputState: WebXRInputState,
  props: WebXRInputActivationProps = {}
): WebXRControllerState | null {
  const sourceState = getWebXRInputSourceState(inputState);
  if (!sourceState.isController) {
    return null;
  }

  const activationState = getWebXRInputActivationState(inputState, props);
  return {
    inputState,
    inputSource: inputState.inputSource,
    sourceState,
    activationState,
    primaryProfile: sourceState.primaryProfile,
    handedness: sourceState.handedness,
    ray: getWebXRInputRay(inputState),
    grip: getWebXRInputGrip(inputState),
    primaryAction: activationState.primaryAction,
    squeezeAction: activationState.squeezeAction,
    isPrimaryActive: activationState.isPrimaryActive,
    isSqueezeActive: activationState.isSqueezeActive
  };
}

export function getWebXRInputRayPlaneIntersection(
  ray: WebXRInputRay,
  props: WebXRInputRayPlaneIntersectionProps = {}
): WebXRInputRayPlaneIntersection | null {
  const planePoint = props.planePoint || [0, 0, 0];
  const sourcePlaneNormal = props.planeNormal || [0, 1, 0];
  const planeNormal: NumberArray3 = [
    sourcePlaneNormal[0],
    sourcePlaneNormal[1],
    sourcePlaneNormal[2]
  ];
  if (!normalizeVector3(planeNormal, null)) {
    return null;
  }

  const denominator = dotVector3(ray.direction, planeNormal);
  if (Math.abs(denominator) < 1e-6) {
    return null;
  }

  const distance =
    dotVector3(
      [planePoint[0] - ray.origin[0], planePoint[1] - ray.origin[1], planePoint[2] - ray.origin[2]],
      planeNormal
    ) / denominator;

  if (
    distance < (props.minDistance ?? 0) ||
    (props.maxDistance !== undefined && distance > props.maxDistance)
  ) {
    return null;
  }

  return {
    ray,
    distance,
    point: [
      ray.origin[0] + ray.direction[0] * distance,
      ray.origin[1] + ray.direction[1] * distance,
      ray.origin[2] + ray.direction[2] * distance
    ]
  };
}

function clampActionValue(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function dotVector3(left: NumberArray3, right: NumberArray3): number {
  return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
}

function normalizeVector3(
  vector: NumberArray3,
  fallback: NumberArray3 | null = [0, 0, -1]
): boolean {
  const length = Math.hypot(vector[0], vector[1], vector[2]);
  if (length === 0) {
    if (!fallback) {
      return false;
    }
    vector[0] = fallback[0];
    vector[1] = fallback[1];
    vector[2] = fallback[2];
    return true;
  }

  vector[0] /= length;
  vector[1] /= length;
  vector[2] /= length;
  vector[0] ||= 0;
  vector[1] ||= 0;
  vector[2] ||= 0;
  return true;
}
