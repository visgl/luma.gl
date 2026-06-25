# WebXRManager

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From-v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`WebXRManager` is the experimental WebGL-only session and per-view render-state helper for luma.gl. It prepares an `XRWebGLLayer`, requests a reference space, and resolves the framebuffer, viewports, projection matrices, and view matrices for one active `XRFrame`.

## Usage

```typescript
import {AnimationLoop} from '@luma.gl/engine';
import {WebXRAnimationFrameProvider, WebXRManager} from '@luma.gl/experimental';

const webXRManager = new WebXRManager(device);
await webXRManager.setSession(session);

const animationLoop = new AnimationLoop({
  device,
  animationFrameProvider: new WebXRAnimationFrameProvider(session),
  onRender({animationFrame}) {
    const xrFrame = animationFrame as XRFrame | null;
    const frameState = xrFrame && webXRManager.getFrameState(xrFrame);
    if (!frameState) {
      return;
    }

    for (const [viewIndex, view] of frameState.views.entries()) {
      const renderPass = device.beginRenderPass({
        framebuffer: frameState.framebuffer,
        parameters: {viewport: view.viewport},
        clearColor: viewIndex === 0 ? [0, 0, 0, 0] : false,
        clearDepth: viewIndex === 0 ? 1 : false,
        clearStencil: false
      });
      // Set view.projectionMatrix and view.viewMatrix uniforms, then draw.
      renderPass.end();
    }
  }
});
```

## Behavior

- WebGL-only in v10 work in progress.
- Calls `gl.makeXRCompatible()` before creating the base `XRWebGLLayer`.
- Uses `XRSession.requestReferenceSpace()` with `local` by default.
- Treats `XRViewerPose.views` as an arbitrary per-frame view list, not a fixed stereo pair.
- Exposes `projectionMatrix` from `XRView.projectionMatrix` and `viewMatrix` from `XRView.transform.inverse.matrix`.
- Wraps `XRWebGLLayer.framebuffer` as a borrowed luma [`Framebuffer`](/docs/api-reference/core/resources/framebuffer) and never deletes the browser-owned framebuffer handle.

## Types

### `WebXRManagerProps`

```ts
export type WebXRManagerProps = {
  referenceSpaceType?: XRReferenceSpaceType;
  layerInit?: XRWebGLLayerInit;
};
```

### `WebXRViewState`

```ts
export type WebXRViewState = {
  xrView: XRView;
  eye: XREye;
  index: number;
  viewport: [number, number, number, number];
  projectionMatrix: Float32Array;
  viewMatrix: Float32Array;
  camera: XRCamera | null;
};
```

### `WebXRFrameState`

```ts
export type WebXRFrameState = {
  xrFrame: XRFrame;
  framebuffer: Framebuffer;
  views: readonly WebXRViewState[];
};
```

## Methods

### `constructor(device: Device, props?: WebXRManagerProps)`

Creates an experimental WebGL-only WebXR manager.

### `setSession(session: XRSession | null, props?: WebXRManagerProps): Promise<this>`

Attaches or clears the current XR session.

### `getFrameState(xrFrame: XRFrame): WebXRFrameState | null`

Resolves frame state for an active XR frame. Returns `null` when no viewer pose is available.

### `clearSession(): void`

Releases luma wrappers for the current session without ending the browser XR session.

### `destroy(): void`

Clears the current session wrappers.
