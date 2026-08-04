# WebXRManager

![From-v10](https://img.shields.io/badge/From-v10-blue.svg?style=flat-square)![Status: Work-In-Progress](https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square)

`WebXRManager` is the experimental WebGL-only session and per-view render-state helper for luma.gl. It prepares an `XRWebGLLayer`, requests a reference space, and resolves the framebuffer, viewports, projection matrices, and view matrices for one active `XRFrame`.

## Usage[​](#usage "Direct link to Usage")

```
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

## Behavior[​](#behavior "Direct link to Behavior")

* WebGL-only in v10 work in progress.
* Calls `gl.makeXRCompatible()` before creating the base `XRWebGLLayer`.
* Uses `XRSession.requestReferenceSpace()` with `local` by default.
* Treats `XRViewerPose.views` as an arbitrary per-frame view list, not a fixed stereo pair.
* Exposes `projectionMatrix` from `XRView.projectionMatrix` and `viewMatrix` from `XRView.transform.inverse.matrix`.
* Wraps `XRWebGLLayer.framebuffer` as a borrowed luma [`Framebuffer`](https://luma.gl/next/docs/api-reference/core/resources/framebuffer.md) and never deletes the browser-owned framebuffer handle.

## Types[​](#types "Direct link to Types")

### `WebXRManagerProps`[​](#webxrmanagerprops "Direct link to webxrmanagerprops")

```
export type WebXRManagerProps = {

  referenceSpaceType?: XRReferenceSpaceType;

  layerInit?: XRWebGLLayerInit;

};
```

### `WebXRViewState`[​](#webxrviewstate "Direct link to webxrviewstate")

```
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

### `WebXRFrameState`[​](#webxrframestate "Direct link to webxrframestate")

```
export type WebXRFrameState = {

  xrFrame: XRFrame;

  framebuffer: Framebuffer;

  views: readonly WebXRViewState[];

};
```

## Methods[​](#methods "Direct link to Methods")

### `constructor(device: Device, props?: WebXRManagerProps)`[​](#constructordevice-device-props-webxrmanagerprops "Direct link to constructordevice-device-props-webxrmanagerprops")

Creates an experimental WebGL-only WebXR manager.

### `setSession(session: XRSession | null, props?: WebXRManagerProps): Promise<this>`[​](#setsessionsession-xrsession--null-props-webxrmanagerprops-promisethis "Direct link to setsessionsession-xrsession--null-props-webxrmanagerprops-promisethis")

Attaches or clears the current XR session.

### `getFrameState(xrFrame: XRFrame): WebXRFrameState | null`[​](#getframestatexrframe-xrframe-webxrframestate--null "Direct link to getframestatexrframe-xrframe-webxrframestate--null")

Resolves frame state for an active XR frame. Returns `null` when no viewer pose is available.

### `clearSession(): void`[​](#clearsession-void "Direct link to clearsession-void")

Releases luma wrappers for the current session without ending the browser XR session.

### `destroy(): void`[​](#destroy-void "Direct link to destroy-void")

Clears the current session wrappers.
