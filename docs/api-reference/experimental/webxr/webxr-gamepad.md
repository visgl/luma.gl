# WebXR Gamepad

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From-v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`getWebXRGamepadState` snapshots the live `Gamepad` attached to one `WebXRInputState`. XR gamepads are updated in place by the browser each frame, so callers that want change detection or stable render data should copy button and axis values for the frame they are handling.

For `xr-standard` mappings, the helper names the reserved indices: trigger, squeeze, touchpad, thumbstick, touchpad axes, and thumbstick axes. Nonstandard mappings keep generic `button-N` and `axis-N` names because their layout is runtime specific.

`WebXRGamepadActionManager` keeps the previous frame's button states and reports transitions such as `pressStarted`, `pressEnded`, `touchStarted`, and `valueDelta`. `WebXRGamepadAxisManager` does the same for axis values, with a configurable dead zone for `activeStarted` and `activeEnded`.

## Usage

```typescript
import {
  WebXRGamepadActionManager,
  WebXRGamepadAxisManager,
  getWebXRGamepadState
} from '@luma.gl/experimental';

const gamepadActions = new WebXRGamepadActionManager();
const gamepadAxes = new WebXRGamepadAxisManager();

const inputStates = webXRManager.getInputState(xrFrame);
for (const inputState of inputStates || []) {
  const gamepadState = getWebXRGamepadState(inputState);
  const trigger = gamepadState?.primaryTrigger?.value || 0;
  if (trigger > 0.25) {
    // Use analog trigger input for selection, locomotion, or UI.
  }
}

for (const action of gamepadActions.update(inputStates)) {
  if (action.name === 'trigger' && action.pressStarted) {
    // Trigger was pressed this frame.
  }
}

for (const axis of gamepadAxes.update(inputStates, {deadzone: 0.2})) {
  if (axis.name === 'thumbstick-y' && axis.active) {
    // Use axis.value for locomotion or scrolling.
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

### `WebXRGamepadAxisActionProps`

```ts
export type WebXRGamepadAxisActionProps = {
  deadzone?: number;
};
```

### `WebXRGamepadPreviousAxisState`

```ts
export type WebXRGamepadPreviousAxisState = {
  value: number;
  active: boolean;
};
```

### `WebXRGamepadAxisActionState`

```ts
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
```

### `WebXRGamepadPreviousButtonState`

```ts
export type WebXRGamepadPreviousButtonState = {
  value: number;
  pressed: boolean;
  touched: boolean;
};
```

### `WebXRGamepadButtonActionState`

```ts
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

### `getWebXRGamepadButtonActionState(gamepadState, button, previousButton?): WebXRGamepadButtonActionState`

Returns one button action state by comparing the current snapshot with an optional previous button state.

### `getWebXRGamepadAxisActionState(gamepadState, axis, props?): WebXRGamepadAxisActionState`

Returns one axis action state by comparing the current snapshot with an optional previous axis state. The `deadzone` option is clamped to the `[0, 1]` range and defaults to `0.15`.

### `WebXRGamepadActionManager`

Tracks previous button state by `XRInputSource` identity.

### `update(inputStates: readonly WebXRInputState[] | null): readonly WebXRGamepadButtonActionState[]`

Snapshots all current gamepads and returns one action state per button. Input sources missing from the current frame are removed from the previous-state cache.

### `reset(inputSource?: XRInputSource): void`

Clears the previous-state cache for one input source, or for every tracked input source when omitted.

### `WebXRGamepadAxisManager`

Tracks previous axis state by `XRInputSource` identity.

### `update(inputStates: readonly WebXRInputState[] | null, props?: WebXRGamepadAxisActionProps): readonly WebXRGamepadAxisActionState[]`

Snapshots all current gamepad axes and returns one action state per axis. Input sources missing from the current frame are removed from the previous-state cache.

### `reset(inputSource?: XRInputSource): void`

Clears the previous-axis cache for one input source, or for every tracked input source when omitted.
