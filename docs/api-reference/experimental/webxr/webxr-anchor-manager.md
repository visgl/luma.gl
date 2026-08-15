# WebXRAnchorManager

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From-v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`WebXRAnchorManager` is the experimental AR anchor lifecycle helper for luma.gl. It creates anchors from an active `XRFrame` or from AR hit-test results, tracks browser-owned anchors, resolves per-frame anchor poses in the app reference space, and deletes anchors when the session ends or is cleared.

## Usage

```typescript
import {WebXRAnchorManager} from '@luma.gl/experimental';

const anchorManager = new WebXRAnchorManager();
anchorManager.setSession(session, webXRManager.referenceSpace);

const anchor = await anchorManager.createAnchor(xrFrame, placementPose.transform);
const anchorState = anchorManager.getAnchorState(xrFrame);
const firstAnchorMatrix = anchorState?.anchors[0]?.matrix;

anchorManager.deleteAnchor(anchor);
```

Request the WebXR `anchors` feature when starting an AR session:

```typescript
const session = await navigator.xr.requestSession('immersive-ar', {
  optionalFeatures: ['anchors', 'hit-test', 'local-floor']
});
```

Anchors can also be created directly from hit-test results when the browser supports `XRHitTestResult.createAnchor()`:

```typescript
const hitTestState = webXRHitTestManager.getHitTestState(xrFrame);
const hit = hitTestState?.hits[0];
const anchor = hit && (await anchorManager.createAnchorFromHitTestResult(hit.xrHitTestResult));
```

## Types

### `WebXRAnchorPose`

```ts
export type WebXRAnchorPose = {
  anchor: XRAnchor;
  pose: XRPose;
  matrix: Float32Array;
};
```

### `WebXRAnchorState`

```ts
export type WebXRAnchorState = {
  xrFrame: XRFrame;
  anchors: readonly WebXRAnchorPose[];
};
```

## Methods

### `constructor()`

Creates an experimental anchor manager.

### `setSession(session: XRSession | null, referenceSpace: XRReferenceSpace | null): this`

Attaches or clears the current XR session. A reference space is required for active sessions because anchor poses are resolved into that app space.

### `createAnchor(xrFrame: XRFrame, pose: XRRigidTransform, space?: XRSpace): Promise<XRAnchor>`

Creates and tracks an anchor through `XRFrame.createAnchor()`. The manager uses the app reference space when `space` is not provided.

### `createAnchorFromHitTestResult(xrHitTestResult: XRHitTestResult): Promise<XRAnchor>`

Creates and tracks an anchor through `XRHitTestResult.createAnchor()`.

### `getAnchorState(xrFrame: XRFrame): WebXRAnchorState | null`

Resolves tracked anchor poses for the current XR frame. When the frame exposes `trackedAnchors`, anchors that are no longer tracked by the browser are removed from the manager.

### `deleteAnchor(anchor: XRAnchor): void`

Deletes a tracked anchor and removes it from the manager.

### `clearSession(): void`

Deletes tracked anchors and releases session references without ending the browser XR session.

### `destroy(): void`

Clears the current session wrappers.
