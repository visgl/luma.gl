# WebXR Gamepad

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From-v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`getWebXRGamepadState` snapshots the live `Gamepad` attached to one `WebXRInputState`. XR gamepads are updated in place by the browser each frame, so callers that want change detection or stable render data should copy button and axis values for the frame they are handling.

For `xr-standard` mappings, the helper names the reserved indices: trigger, squeeze, touchpad, thumbstick, touchpad axes, and thumbstick axes. Nonstandard mappings keep generic `button-N` and `axis-N` names because their layout is runtime specific.

## Usage

```typescript
import {getWebXRGamepadState} from '@luma.gl/experimental';

const inputStates = webXRManager.getInputState(xrFrame);
for (const inputState of inputStates || []) {
  const gamepadState = getWebXRGamepadState(inputState);
  const trigger = gamepadState?.primaryTrigger?.value || 0;
  if (trigger > 0.25) {
    // Use analog trigger input for selection, locomotion, or UI.
  }
}
```

## Types

### `WebXRGamepadButtonName`

```ts
export type WebXRGamepadButtonName =
  | 'trigger'
  | 'squeeze'
  | 'touchpad'
  | 'thumbstick'
  | `button-${number}`;
```

### `WebXRGamepadAxisName`

```ts
export type WebXRGamepadAxisName =
  | 'touchpad-x'
  | 'touchpad-y'
  | 'thumbstick-x'
  | 'thumbstick-y'
  | `axis-${number}`;
```

### `WebXRGamepadButtonState`

```ts
export type WebXRGamepadButtonState = {
  index: number;
  name: WebXRGamepadButtonName;
  value: number;
  pressed: boolean;
  touched: boolean;
};
```

### `WebXRGamepadAxisState`

```ts
export type WebXRGamepadAxisState = {
  index: number;
  name: WebXRGamepadAxisName;
  value: number;
};
```

### `WebXRGamepadState`

```ts
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
```

## Functions

### `getWebXRGamepadState(inputState: WebXRInputState): WebXRGamepadState | null`

Returns a per-frame snapshot for the input state's gamepad, or `null` when the input source does not expose gamepad data.

### `getWebXRGamepadStates(inputStates: readonly WebXRInputState[] | null): readonly WebXRGamepadState[]`

Returns snapshots for all input states with gamepads.
