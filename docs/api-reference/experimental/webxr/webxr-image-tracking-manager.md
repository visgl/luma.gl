# WebXRImageTrackingManager

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From-v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`WebXRImageTrackingManager` is the experimental AR image-tracking helper for luma.gl. It resolves `XRFrame.getImageTrackingResults()` in the app reference space, exposes tracking state and measured image width, and reports added, updated, and removed tracked images between XR frames.

Request the WebXR `image-tracking` feature with app-provided tracked images when starting the AR session:

```ts
import {
  getWebXRImageTrackingSessionInit,
  WebXRImageTrackingManager
} from '@luma.gl/experimental';

const trackedImages = [
  {
    image: await createImageBitmap(markerImage),
    widthInMeters: 0.24
  }
];

const session = await navigator.xr!.requestSession('immersive-ar', {
  optionalFeatures: ['local-floor', ...getWebXRImageTrackingSessionInit({trackedImages}).optionalFeatures!],
  trackedImages
});

const imageManager = new WebXRImageTrackingManager({trackedImages});
imageManager.setSession(session, referenceSpace);
```

Then query tracked image poses from the active XR frame:

```ts
const imageState = imageManager.getImageTrackingState(xrFrame);

if (imageState) {
  for (const image of imageState.images) {
    const matrix = image.matrix;
    const index = image.index;
    const trackingState = image.trackingState;
  }
}
```

## Types

### `WebXRImageTrackingManagerProps`

```ts
export type WebXRImageTrackingManagerProps = {
  trackedImages?: readonly XRTrackedImageInit[];
};
```

`trackedImages` mirrors `XRSessionInit.trackedImages`. Each entry contains an `ImageBitmap` and its known physical width in meters.

### `WebXRImageTrackingState`

```ts
export type WebXRImageTrackingState = {
  xrFrame: XRFrame;
  session: XRSession;
  images: readonly WebXRTrackedImageState[];
  added: readonly WebXRTrackedImageState[];
  updated: readonly WebXRTrackedImageState[];
  removed: readonly WebXRTrackedImageState[];
};
```

`added`, `updated`, and `removed` are derived from tracked image `index`, `trackingState`, and `measuredWidthInMeters` compared with the previous successful call to `getImageTrackingState()`.

### `WebXRTrackedImageState`

```ts
export type WebXRTrackedImageState = {
  result: XRImageTrackingResult;
  pose: XRPose;
  matrix: Float32Array;
  index: number;
  trackingState: XRImageTrackingState;
  measuredWidthInMeters: number;
};
```

`matrix` places `XRImageTrackingResult.imageSpace` in the app reference space.

## Methods

### `constructor(props?: WebXRImageTrackingManagerProps)`

Creates an inactive manager. Call `setSession()` after the XR session and app reference space are available.

### `setSession(session: XRSession | null, referenceSpace: XRReferenceSpace | null, props?: WebXRImageTrackingManagerProps): this`

Sets the active session and reference space. Passing `null` clears the active session.

### `getImageTrackability(): Promise<readonly XRImageTrackability[] | null>`

Forwards `XRSession.getImageTrackability()` when available. The returned array corresponds to the configured `trackedImages`.

### `getImageTrackingState(xrFrame: XRFrame): WebXRImageTrackingState | null`

Returns tracked image state for the active session, or `null` when the browser did not enable or expose `XRFrame.getImageTrackingResults()`.

### `clearSession(): void`

Removes listeners and clears cached tracked-image state.

### `destroy(): void`

Clears the active session.

## Helpers

### `getWebXRImageTrackingSessionInit(props?: WebXRImageTrackingSessionInitProps): XRSessionInit`

Builds a minimal `XRSessionInit` fragment for requesting the `image-tracking` feature and passing `trackedImages`.
