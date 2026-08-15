# WebXRRenderStateManager

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From-v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`WebXRRenderStateManager` is an experimental helper for updating and reading WebXR render state. It focuses on clip planes and inline field of view, complementing `WebXRManager` which installs the base WebGL layer or WebGPU projection layer.

## Usage

```typescript
import {WebXRRenderStateManager} from '@luma.gl/experimental';

const renderStateManager = new WebXRRenderStateManager({
  depthNear: 0.05,
  depthFar: 100
});

await renderStateManager.setSession(session);

const renderState = renderStateManager.getRenderState();
```

## Types

### `WebXRRenderStateManagerProps`

```ts
export type WebXRRenderStateManagerProps = {
  depthNear?: number | null;
  depthFar?: number | null;
  inlineVerticalFieldOfView?: number | null;
};
```

### `WebXRRenderState`

```ts
export type WebXRRenderState = {
  session: XRSession;
  depthNear: number | null;
  depthFar: number | null;
  inlineVerticalFieldOfView: number | null;
  baseLayer: XRWebGLLayer | null;
  layers: readonly XRLayer[];
};
```

## Methods

### `constructor(props?: WebXRRenderStateManagerProps)`

Creates an inactive render-state manager.

### `setSession(session: XRSession | null, props?: WebXRRenderStateManagerProps): Promise<this>`

Attaches or clears the current XR session. When a session is attached, the configured render-state values are queued with `XRSession.updateRenderState()`.

### `getRenderState(): WebXRRenderState | null`

Returns the current render-state snapshot, or `null` when no session is attached.

### `updateRenderState(props?: WebXRRenderStateManagerProps): Promise<WebXRRenderState | null>`

Queues a render-state update for defined clip-plane and inline-FOV values, then returns the latest snapshot. Returns `null` when no session is attached.

### `clearSession(): void`

Removes event listeners and releases the active session reference without ending the browser XR session.

### `destroy(): void`

Clears the current session wrapper.

## Functions

### `makeWebXRRenderState(session: XRSession): WebXRRenderState`

Creates a render-state snapshot from `XRSession.renderState`.

### `getWebXRRenderStateInit(props?: WebXRRenderStateManagerProps): XRRenderStateInit`

Creates an `XRRenderStateInit` containing only defined clip-plane and inline-FOV values.
