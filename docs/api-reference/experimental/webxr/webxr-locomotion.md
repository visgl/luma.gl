# WebXR Locomotion

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From-v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`getWebXRLocomotionState` derives app-level movement and turn intent from WebXR gamepad axes. It is intentionally low-level: apps decide whether to use the returned values for smooth locomotion, snap turning, teleport targeting, scrolling, or UI navigation.

The default convention uses the left thumbstick for movement and the right thumbstick for turning. Movement is returned as `[strafe, forward]`, with forward positive by default. Turning is a normalized horizontal value, and `snapTurn` is `-1`, `0`, or `1` once the turn axis reaches the configured threshold.

## Usage

```typescript
import {getWebXRLocomotionState} from '@luma.gl/experimental';

const inputStates = webXRManager.getInputState(xrFrame);
const locomotion = getWebXRLocomotionState(inputStates, {
  deadzone: 0.2,
  snapTurnThreshold: 0.8
});

if (locomotion.moveActive) {
  const [strafe, forward] = locomotion.move;
  // Apply smooth locomotion or move a teleport reticle.
}

if (locomotion.snapTurn) {
  // Rotate the viewer rig by one snap increment.
}
```

## Types

### `WebXRLocomotionAxis`

```ts
export type WebXRLocomotionAxis = 'thumbstick' | 'touchpad';
```

### `WebXRLocomotionHandedness`

```ts
export type WebXRLocomotionHandedness = XRHandedness | 'any';
```

### `WebXRLocomotionProps`

```ts
export type WebXRLocomotionProps = {
  moveHandedness?: WebXRLocomotionHandedness;
  turnHandedness?: WebXRLocomotionHandedness;
  axis?: WebXRLocomotionAxis;
  deadzone?: number;
  snapTurnThreshold?: number;
  invertMoveY?: boolean;
  invertTurnX?: boolean;
};
```

### `WebXRLocomotionState`

```ts
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
```

## Functions

### `getWebXRLocomotionState(inputStates, props?): WebXRLocomotionState`

Returns movement and turn intent from all current input states with gamepads.

### `getWebXRLocomotionGamepadState(gamepadStates, handedness, axis?): WebXRGamepadState | null`

Returns the first gamepad state that matches the handedness and exposes the requested axis pair.

### `getWebXRLocomotionAxes(gamepadState, axis?): readonly [x: number, y: number] | null`

Returns the requested `thumbstick` or `touchpad` axis pair.

### `getWebXRLocomotionAxisValue(value, deadzone?): number`

Applies a clamped dead zone and rescales the remaining axis range to `[-1, 1]`.
