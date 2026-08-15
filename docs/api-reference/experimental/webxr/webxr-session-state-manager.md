# WebXRSessionStateManager

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From-v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`WebXRSessionStateManager` is an experimental helper for tracking XR session visibility and refresh-rate state. It snapshots `XRSession.visibilityState`, `frameRate`, `supportedFrameRates`, and system-keyboard availability, and can request a target frame rate when the browser exposes `XRSession.updateTargetFrameRate()`.

## Usage

```typescript
import {WebXRSessionStateManager} from '@luma.gl/experimental';

const sessionStateManager = new WebXRSessionStateManager({
  targetFrameRate: 'highest'
});

await sessionStateManager.setSession(session);

const sessionState = sessionStateManager.getSessionState();
if (sessionState?.isVisible) {
  // Keep rendering or running visibility-dependent app logic.
}
```

## Types

### `WebXRTargetFrameRate`

```ts
export type WebXRTargetFrameRate = number | 'highest' | 'lowest';
```

### `WebXRSessionStateManagerProps`

```ts
export type WebXRSessionStateManagerProps = {
  targetFrameRate?: WebXRTargetFrameRate | null;
};
```

### `WebXRSessionState`

```ts
export type WebXRSessionState = {
  session: XRSession;
  visibilityState: XRVisibilityState;
  frameRate: number | null;
  supportedFrameRates: readonly number[];
  isVisible: boolean;
  isFocused: boolean;
  isSystemKeyboardSupported: boolean | null;
};
```

## Methods

### `constructor(props?: WebXRSessionStateManagerProps)`

Creates an inactive session-state manager.

### `setSession(session: XRSession | null, props?: WebXRSessionStateManagerProps): Promise<this>`

Attaches or clears the current XR session. When a session is attached, the manager listens for `visibilitychange`, `frameratechange`, and `end` events, and optionally requests the configured target frame rate.

### `getSessionState(): WebXRSessionState | null`

Returns the current session-state snapshot, or `null` when no session is attached.

### `updateTargetFrameRate(targetFrameRate: WebXRTargetFrameRate): Promise<number | null>`

Requests an explicit, highest, or lowest supported target frame rate. Returns the requested numeric rate, or `null` when no session is active, no matching supported rate exists, or the browser does not expose `updateTargetFrameRate()`.

### `clearSession(): void`

Removes event listeners and releases the active session reference without ending the browser XR session.

### `destroy(): void`

Clears the current session wrapper.

## Functions

### `makeWebXRSessionState(session: XRSession): WebXRSessionState`

Creates a session-state snapshot from an `XRSession`.

### `getWebXRSupportedFrameRates(session: XRSession): readonly number[]`

Returns `XRSession.supportedFrameRates` as a regular number array, or an empty array when unsupported.

### `getWebXRTargetFrameRate(session: XRSession, targetFrameRate: WebXRTargetFrameRate): number | null`

Resolves `'highest'`, `'lowest'`, or an explicit frame rate against `XRSession.supportedFrameRates`.
