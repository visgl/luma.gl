# WebXRMediaLayerManager

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From-v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`WebXRMediaLayerManager` is the experimental helper for WebXR video-backed composition layers. It creates quad, cylinder, and equirect layers through `XRMediaBinding` so the XR compositor can present video directly from an `HTMLVideoElement`.

Use this manager for immersive video panels, curved video surfaces, and 360-degree video. Media layers do not expose a luma.gl framebuffer; the browser displays the current video frame through the XR compositor.

## Usage

Request the WebXR `layers` feature when starting the immersive session:

```typescript
import {WebXRMediaLayerManager, getWebXRLayersSessionInit} from '@luma.gl/experimental';

const session = await navigator.xr.requestSession('immersive-vr', {
  ...getWebXRLayersSessionInit(),
  optionalFeatures: ['layers', 'local-floor']
});
```

Create a media layer after the session and reference space are ready:

```typescript
const video = document.querySelector('video');
const mediaLayerManager = new WebXRMediaLayerManager();
mediaLayerManager.setSession(session);

const videoLayer = mediaLayerManager.createEquirectLayer(video, {
  space: referenceSpace,
  layout: 'stereo-left-right',
  centralHorizontalAngle: Math.PI * 2,
  radius: 0
});

await mediaLayerManager.updateRenderState([videoLayer]);
```

## Types

### `WebXRMediaLayerType`

```ts
export type WebXRMediaLayerType = 'quad' | 'cylinder' | 'equirect';
```

### `WebXRMediaLayerState`

```ts
export type WebXRMediaLayerState = {
  session: XRSession;
  layer: XRCompositionLayer;
  video: HTMLVideoElement;
  type: WebXRMediaLayerType;
  layout: XRLayerLayout;
  invertStereo: boolean;
  needsRedraw: boolean;
};
```

## Methods

### `setSession(session: XRSession | null): this`

Attaches or clears the current XR session. The manager creates an `XRMediaBinding` for the active session.

### `createQuadLayer(video: HTMLVideoElement, init: XRMediaQuadLayerInit): XRQuadLayer`

Creates and tracks a flat video layer.

### `createCylinderLayer(video: HTMLVideoElement, init: XRMediaCylinderLayerInit): XRCylinderLayer`

Creates and tracks a curved video layer.

### `createEquirectLayer(video: HTMLVideoElement, init: XRMediaEquirectLayerInit): XREquirectLayer`

Creates and tracks a 360-degree equirect video layer.

### `updateRenderState(layers: readonly XRLayer[]): Promise<void>`

Updates the session render state with the supplied WebXR layers.

### `getLayerState(layer: XRCompositionLayer): WebXRMediaLayerState | null`

Returns the tracked video, type, layout, stereo inversion, and redraw state for a media layer.

### `clearSession(): void`

Removes event listeners and clears session references without ending the browser XR session.

### `destroy(): void`

Clears the current session wrappers.
