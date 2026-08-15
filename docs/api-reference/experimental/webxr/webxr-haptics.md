# WebXR Haptics

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From-v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`pulseWebXRInputHaptics` sends a short pulse to the first haptic actuator exposed by a WebXR input source gamepad. It is a small compatibility helper around browser `Gamepad` haptics, including the older `vibrationActuator` fallback used by some XR runtimes.

## Usage

```typescript
import {pulseWebXRInputHaptics} from '@luma.gl/experimental';

const inputStates = webXRManager.getInputState(xrFrame);
for (const inputState of inputStates || []) {
  if (inputState.selectActive) {
    await pulseWebXRInputHaptics(inputState, {intensity: 0.5, duration: 40});
  }
}
```

## Types

### `WebXRHapticPulseProps`

```ts
export type WebXRHapticPulseProps = {
  intensity?: number;
  duration?: number;
};
```

### `WebXRHapticPulseResult`

```ts
export type WebXRHapticPulseResult = {
  inputState: WebXRInputState;
  actuator: WebXRGamepadHapticActuator;
  intensity: number;
  duration: number;
  value: unknown;
};
```

### `WebXRGamepadHapticActuator`

```ts
export type WebXRGamepadHapticActuator = {
  pulse?(intensity: number, duration: number): Promise<unknown> | unknown;
};
```

## Functions

### `pulseWebXRInputHaptics(inputState: WebXRInputState, props?: WebXRHapticPulseProps): Promise<WebXRHapticPulseResult | null>`

Pulses the first available haptic actuator on `inputState.gamepad`. Returns `null` when the input has no haptic actuator.

### `getWebXRInputHapticActuator(inputState: WebXRInputState): WebXRGamepadHapticActuator | null`

Returns the first available gamepad haptic actuator, or `null` when no compatible actuator is exposed.
