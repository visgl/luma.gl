# WebXRHitTestManager

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From-v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`WebXRHitTestManager` is the experimental AR hit-test source helper for luma.gl. It requests a viewer-space `XRHitTestSource`, resolves per-frame hit poses in the app reference space, and cancels the source when the session ends or is cleared.

## Usage

```typescript
import {WebXRHitTestManager} from '@luma.gl/experimental';

const hitTestManager = new WebXRHitTestManager({entityTypes: ['plane', 'point']});
await hitTestManager.setSession(session, webXRManager.referenceSpace);

const hitTestState = hitTestManager.getHitTestState(xrFrame);
const firstHitMatrix = hitTestState?.hits[0]?.matrix;
```

Request the WebXR `hit-test` feature when starting an AR session:

```typescript
const session = await navigator.xr.requestSession('immersive-ar', {
  requiredFeatures: ['hit-test'],
  optionalFeatures: ['local-floor']
});
```

## Types

### `WebXRHitTestManagerProps`

```ts
export type WebXRHitTestManagerProps = {
  entityTypes?: XRHitTestTrackableType[];
  offsetRay?: XRRay;
};
```

### `WebXRHitTestResult`

```ts
export type WebXRHitTestResult = {
  xrHitTestResult: XRHitTestResult;
  pose: XRPose;
  matrix: Float32Array;
};
```

### `WebXRHitTestState`

```ts
export type WebXRHitTestState = {
  xrFrame: XRFrame;
  hits: readonly WebXRHitTestResult[];
};
```

## Methods

### `constructor(props?: WebXRHitTestManagerProps)`

Creates an experimental hit-test manager.

### `setSession(session: XRSession | null, referenceSpace: XRReferenceSpace | null, props?: WebXRHitTestManagerProps): Promise<this>`

Attaches or clears the current XR session. When a session is attached, the manager requests `viewer` reference space and then calls `session.requestHitTestSource()`.

### `getHitTestState(xrFrame: XRFrame): WebXRHitTestState | null`

Resolves hit-test results for an active XR frame. Results without poses in the app reference space are filtered out. Returns `null` when no source is attached or when the browser does not expose `XRFrame.getHitTestResults()`.

### `clearSession(): void`

Cancels the current hit-test source and releases session references without ending the browser XR session.

### `destroy(): void`

Clears the current session wrappers.
