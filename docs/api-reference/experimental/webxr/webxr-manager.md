# WebXRManager

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From-v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`WebXRManager` is the experimental WebGPU and WebGL session and per-view render-state helper for luma.gl. It prepares a native WebGPU projection layer or an `XRWebGLLayer`, requests a reference space, and resolves framebuffers, viewports, projection matrices, and view matrices for one active `XRFrame`.

## Usage

```typescript
import type {Framebuffer} from '@luma.gl/core';
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

    const renderedFramebuffers = new Set<Framebuffer>();
    for (const view of frameState.views) {
      const framebuffer = view.framebuffer;
      const clearFramebuffer = !renderedFramebuffers.has(framebuffer);
      renderedFramebuffers.add(framebuffer);
      // Encode view.projectionMatrix/view.viewMatrix uniform uploads before the pass.
      const renderPass = device.beginRenderPass({
        framebuffer,
        clearColor: clearFramebuffer ? [0, 0, 0, 0] : false,
        clearDepth: clearFramebuffer ? 1 : false,
        clearStencil: false
      });
      renderPass.setParameters({viewport: view.viewport});
      // Draw the prepared model.
      renderPass.end();
    }
  }
});
```

## Behavior

- Supports immersive WebGPU and WebGL sessions through the same manager and frame-state API.
- Calls `gl.makeXRCompatible()` before creating a shared WebGL `XRWebGLLayer` framebuffer.
- Creates a WebGPU `XRGPUBinding` projection layer and installs it with `session.updateRenderState({layers: [layer]})`.
- Wraps WebGPU compositor color and optional depth textures as borrowed per-view attachments, preserving browser-provided texture-array slices and viewports.
- Shares a framebuffer when multiple eyes target the same texture slice; otherwise each eye receives an independently clearable framebuffer.
- Uses `XRSession.requestReferenceSpace()` with `local` by default.
- Treats `XRViewerPose.views` as an arbitrary per-frame view list, not a fixed stereo pair.
- Exposes `projectionMatrix` from `XRView.projectionMatrix` and `viewMatrix` from `XRView.transform.inverse.matrix`.
- Resolves per-frame input-source target-ray and grip poses in the same reference space as rendering.
- Tracks active `selectstart`/`selectend` and `squeezestart`/`squeezeend` state per input source so examples can build controller rays, pointer selection, grab, and locomotion helpers without subscribing to raw session events.
- Provides `getWebXRInputRay(inputState)` for normalized world-space target-ray origin and direction extraction.
- Provides `getWebXRInputRayPlaneIntersection(ray, props)` for floor, wall, and placement plane hits used by teleport and pointer-selection examples.
- Never destroys browser-owned WebGL framebuffers or WebGPU compositor textures.
- Raw AR camera textures remain WebGL-only; WebGPU AR can use an application-provided procedural or video fallback.

### WebGPU session requirements

Request an XR-compatible WebGPU adapter while creating the luma device, then negotiate the WebXR `webgpu` feature when starting an immersive session:

```typescript
const device = await luma.createDevice({type: 'webgpu', xrCompatible: true});
const session = await navigator.xr.requestSession('immersive-vr', {
  requiredFeatures: ['webgpu'],
  optionalFeatures: ['local-floor']
});
```

Browser support for native WebGPU WebXR is still emerging. Keep a WebGL2 fallback for browsers and headsets that do not expose `XRGPUBinding`.

## Types

### `WebXRManagerProps`

```ts
export type WebXRManagerProps = {
  referenceSpaceType?: XRReferenceSpaceType;
  layerInit?: XRWebGLLayerInit;
  projectionLayerInit?: XRProjectionLayerInit;
};
```

### `WebXRViewState`

```ts
export type WebXRViewState = {
  xrView: XRView;
  eye: XREye;
  index: number;
  framebuffer: Framebuffer;
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
  // Shared WebGL framebuffer or first WebGPU eye framebuffer.
  framebuffer: Framebuffer;
  views: readonly WebXRViewState[];
};
```

### `WebXRInputState`

```ts
export type WebXRInputState = {
  inputSource: XRInputSource;
  index: number;
  handedness: XRHandedness;
  targetRayMode: XRTargetRayMode;
  profiles: readonly string[];
  gamepad: Gamepad | null;
  hand: XRHand | null;
  targetRayPose: XRPose | null;
  targetRayMatrix: Float32Array | null;
  gripPose: XRPose | null;
  gripMatrix: Float32Array | null;
  selectActive: boolean;
  squeezeActive: boolean;
};
```

### `WebXRInputRay`

```ts
export type WebXRInputRay = {
  inputState: WebXRInputState;
  origin: NumberArray3;
  direction: NumberArray3;
  matrix: Float32Array;
};
```

### `WebXRInputRayPlaneIntersection`

```ts
export type WebXRInputRayPlaneIntersection = {
  ray: WebXRInputRay;
  point: NumberArray3;
  distance: number;
};
```

## Methods

### `constructor(device: Device, props?: WebXRManagerProps)`

Creates an experimental WebGPU or WebGL WebXR manager.

### `setSession(session: XRSession | null, props?: WebXRManagerProps): Promise<this>`

Attaches or clears the current XR session.

### `getFrameState(xrFrame: XRFrame): WebXRFrameState | null`

Resolves frame state for an active XR frame. Returns `null` when no viewer pose is available.

### `getInputState(xrFrame: XRFrame): readonly WebXRInputState[] | null`

Resolves input source state for an active XR frame. Returns `null` when no session is attached.

### `getWebXRInputRay(inputState: WebXRInputState): WebXRInputRay | null`

Returns a normalized world-space target ray for an input state, or `null` when the input source has no target-ray pose for the frame.

### `getWebXRInputRayPlaneIntersection(ray: WebXRInputRay, props?: WebXRInputRayPlaneIntersectionProps): WebXRInputRayPlaneIntersection | null`

Returns the forward intersection between an input ray and a plane. The default plane is `y=0`, suitable for simple floor reticles and teleport candidates.

### `clearSession(): void`

Releases luma wrappers for the current session without ending the browser XR session.

### `destroy(): void`

Clears the current session wrappers.
