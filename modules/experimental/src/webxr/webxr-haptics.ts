// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {WebXRInputState} from './webxr-manager';

export type WebXRHapticPulseProps = {
  intensity?: number;
  duration?: number;
};

export type WebXRHapticPulseResult = {
  inputState: WebXRInputState;
  actuator: WebXRGamepadHapticActuator;
  intensity: number;
  duration: number;
  value: unknown;
};

export type WebXRGamepadHapticActuator = {
  pulse?(intensity: number, duration: number): Promise<unknown> | unknown;
};

type WebXRHapticGamepad = Gamepad & {
  hapticActuators?: readonly WebXRGamepadHapticActuator[];
  vibrationActuator?: WebXRGamepadHapticActuator;
};

/** Pulses the first available gamepad haptic actuator for one WebXR input source. */
export async function pulseWebXRInputHaptics(
  inputState: WebXRInputState,
  props: WebXRHapticPulseProps = {}
): Promise<WebXRHapticPulseResult | null> {
  const actuator = getWebXRInputHapticActuator(inputState);
  if (!actuator?.pulse) {
    return null;
  }

  const intensity = clamp(props.intensity ?? 0.45, 0, 1);
  const duration = Math.max(0, props.duration ?? 35);
  const value = await actuator.pulse(intensity, duration);

  return {inputState, actuator, intensity, duration, value};
}

export function getWebXRInputHapticActuator(
  inputState: WebXRInputState
): WebXRGamepadHapticActuator | null {
  const gamepad = inputState.gamepad as WebXRHapticGamepad | null;
  if (!gamepad) {
    return null;
  }

  return (
    gamepad.hapticActuators?.find(actuator => Boolean(actuator.pulse)) ||
    gamepad.vibrationActuator ||
    null
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
