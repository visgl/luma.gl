# WebXRCompositionLayerManager

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From-v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`WebXRCompositionLayerManager` is the experimental WebXR Layers API helper for WebGL composition layers. It creates quad, cylinder, equirect, and cube layers through `XRWebGLBinding`, resolves `XRWebGLSubImage` objects during an active XR animation frame, and exposes borrowed luma.gl texture and framebuffer wrappers for rendering into those browser-owned opaque textures.

Use this manager for high-fidelity XR panels, HUDs, and curved UI surfaces that should be composited by the XR runtime instead of drawn into the main projection layer.

## Usage

Request the WebXR `layers` feature when starting the immersive session:

```typescript
import {
  WebXRCompositionLayerManager,
  getWebXRLayersSessionInit
} from '@luma.gl/experimental';

const session = await navigator.xr.requestSession('immersive-vr', {
  ...getWebXRLayersSessionInit(),
  optionalFeatures: ['layers', 'local-floor']
});
```

Create a layer after the session and reference space are ready:

```typescript
const layerManager = new WebXRCompositionLayerManager(device);
await layerManager.setSession(session);

const quadLayer = layerManager.createQuadLayer({
  space: referenceSpace,
  viewPixelWidth: 1024,
  viewPixelHeight: 512,
  width: 1.2,
  height: 0.6,
  layout: 'mono'
});

await layerManager.updateRenderState([quadLayer]);
```

During an XR animation frame, resolve a framebuffer and draw into it:

```typescript
const layerState = layerManager.getLayerState(xrFrame, quadLayer);
if (layerState && layerState.needsRedraw) {
  device.submitPass({
    framebuffer: layerState.framebuffer,
    parameters: {
      viewport: layerState.viewport
    }
  });
}
```

The returned textures wrap opaque browser-owned `WebGLTexture` handles. They are only valid while the browser reports them through `XRWebGLBinding.getSubImage()` and should not be destroyed directly.

## Types

### `WebXRCompositionLayerManagerProps`

```ts
export type WebXRCompositionLayerManagerProps = {
  colorTextureFormat?: TextureFormat;
  depthStencilTextureFormat?: TextureFormat;
  textureUsage?: number;
};
```

### `WebXRLayersSessionInitProps`

```ts
export type WebXRLayersSessionInitProps = {
  required?: boolean;
};
```

### `WebXRCompositionLayerState`

```ts
export type WebXRCompositionLayerState = {
  xrFrame: XRFrame;
  session: XRSession;
  layer: XRCompositionLayer;
  subImage: XRWebGLSubImage;
  framebuffer: Framebuffer;
  colorTexture: Texture;
  depthStencilTexture: Texture | null;
  viewport: [x: number, y: number, width: number, height: number];
  eye: XREye;
  layout: XRLayerLayout;
  needsRedraw: boolean;
  imageIndex: number | null;
};
```

## Methods

### `constructor(device: Device, props?: WebXRCompositionLayerManagerProps)`

Creates a WebGL composition-layer manager. This helper is for renderable WebGL layers created through `XRWebGLBinding`. Use `WebXRMediaLayerManager` for video-backed layers created through `XRMediaBinding`.

### `setSession(session: XRSession | null): Promise<this>`

Attaches or clears the current XR session. The manager calls `makeXRCompatible()` before creating its `XRWebGLBinding`.

### `createQuadLayer(init: XRQuadLayerInit): XRQuadLayer`

Creates and tracks an `XRQuadLayer`.

### `createCylinderLayer(init: XRCylinderLayerInit): XRCylinderLayer`

Creates and tracks an `XRCylinderLayer`.

### `createEquirectLayer(init: XREquirectLayerInit): XREquirectLayer`

Creates and tracks an `XREquirectLayer`.

### `createCubeLayer(init: XRCubeLayerInit): XRCubeLayer`

Creates and tracks an `XRCubeLayer`.

### `updateRenderState(layers: readonly XRLayer[]): Promise<void>`

Updates the session render state with the supplied WebXR layers.

### `getLayerState(xrFrame: XRFrame, layer: XRCompositionLayer, eye?: XREye): WebXRCompositionLayerState | null`

Resolves the current `XRWebGLSubImage`, borrowed luma texture wrappers, and framebuffer for a composition layer during an active XR animation frame.

### `clearSession(): void`

Releases borrowed luma wrappers, removes event listeners, and clears session references without ending the browser XR session.

### `destroy(): void`

Clears the current session wrappers.

## Functions

### `getWebXRLayersSessionInit(props?: WebXRLayersSessionInitProps): XRSessionInit`

Builds a minimal `XRSessionInit` fragment for requesting the `layers` feature.
