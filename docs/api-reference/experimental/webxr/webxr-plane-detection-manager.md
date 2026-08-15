# WebXRPlaneDetectionManager

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From-v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`WebXRPlaneDetectionManager` is the experimental AR plane-detection helper for luma.gl. It reads `XRFrame.detectedPlanes`, resolves each plane pose in the app reference space, converts plane polygons to simple numeric coordinates, and reports added, updated, and removed planes between XR frames.

Request the WebXR `plane-detection` feature when starting the AR session:

```ts
import {
  getWebXRPlaneDetectionSessionInit,
  WebXRPlaneDetectionManager
} from '@luma.gl/experimental';

const session = await navigator.xr!.requestSession('immersive-ar', {
  optionalFeatures: ['local-floor', ...getWebXRPlaneDetectionSessionInit().optionalFeatures!]
});

const planeManager = new WebXRPlaneDetectionManager({
  orientations: ['horizontal']
});
planeManager.setSession(session, referenceSpace);
```

Then query detected planes from the active XR frame:

```ts
const planeState = planeManager.getPlaneDetectionState(xrFrame);

if (planeState) {
  for (const plane of planeState.planes) {
    const matrix = plane.matrix;
    const polygon = plane.polygon;
  }
}
```

## Types

### `WebXRPlaneDetectionManagerProps`

```ts
export type WebXRPlaneDetectionManagerProps = {
  orientations?: readonly XRPlaneOrientation[];
  semanticLabels?: readonly string[];
};
```

`orientations` filters planes by `'horizontal'` or `'vertical'`.

`semanticLabels` filters planes by browser-provided labels, when available.

### `WebXRPlaneDetectionState`

```ts
export type WebXRPlaneDetectionState = {
  xrFrame: XRFrame;
  session: XRSession;
  planes: readonly WebXRPlaneState[];
  added: readonly WebXRPlaneState[];
  updated: readonly WebXRPlaneState[];
  removed: readonly WebXRPlaneState[];
};
```

`added`, `updated`, and `removed` are derived from plane object identity and `XRPlane.lastChangedTime` compared with the previous successful call to `getPlaneDetectionState()`.

### `WebXRPlaneState`

```ts
export type WebXRPlaneState = {
  xrPlane: XRPlane;
  pose: XRPose;
  matrix: Float32Array;
  polygon: readonly [number, number, number][];
  orientation: XRPlaneOrientation | null;
  semanticLabel: string | null;
  lastChangedTime: DOMHighResTimeStamp;
};
```

`polygon` coordinates are relative to the plane pose, matching the WebXR Plane Detection API.

## Methods

### `constructor(props?: WebXRPlaneDetectionManagerProps)`

Creates an inactive manager. Call `setSession()` after the XR session and app reference space are available.

### `setSession(session: XRSession | null, referenceSpace: XRReferenceSpace | null, props?: WebXRPlaneDetectionManagerProps): this`

Sets the active session and reference space. Passing `null` clears the active session.

### `getPlaneDetectionState(xrFrame: XRFrame): WebXRPlaneDetectionState | null`

Returns detected plane state for the active session, or `null` when the browser did not enable or expose `XRFrame.detectedPlanes`.

### `initiateRoomCapture(): Promise<boolean>`

Calls `XRSession.initiateRoomCapture()` when the browser exposes it and returns `true`. Returns `false` when room capture is unavailable.

### `clearSession(): void`

Removes listeners and clears cached plane state.

### `destroy(): void`

Clears the active session.

## Helpers

### `getWebXRPlaneDetectionSessionInit(props?: WebXRPlaneDetectionSessionInitProps): XRSessionInit`

Builds a minimal `XRSessionInit` fragment for requesting the `plane-detection` feature.
