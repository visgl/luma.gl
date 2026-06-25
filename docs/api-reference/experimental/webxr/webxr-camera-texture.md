# WebXRCameraTexture

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From-v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`WebXRCameraTexture` is the experimental `@luma.gl/experimental` binding source for WebXR Raw Camera Access. It wraps the browser-owned camera `WebGLTexture` for one `XRView` as a borrowed read-only luma [`Texture`](/docs/api-reference/core/resources/texture).

## Usage

```typescript
import {WebXRCameraTexture} from '@luma.gl/experimental';

const cameraTexture = new WebXRCameraTexture(device, xrWebGLBinding);

session.requestAnimationFrame((time, xrFrame) => {
  const pose = xrFrame.getViewerPose(referenceSpace);
  const xrView = pose?.views[0] ?? null;

  cameraTexture.setView(xrView);
  model.shaderInputs.setProps({
    bindings: {uTexture: cameraTexture}
  });
});
```

Use it through an ordinary GLSL sampler:

```glsl
uniform sampler2D uTexture;
vec4 color = texture(uTexture, uv);
```

## Behavior

- WebGL-only in v10 work in progress.
- Resolves only ordinary texture bindings such as GLSL `sampler2D`.
- `setView(view)` selects `view.camera` and advances the source generation for the next draw.
- `resolveTextureBinding()` calls `XRWebGLBinding.getCameraImage(camera)` at most once per source generation.
- The returned browser texture is borrowed and read-only. luma.gl does not upload, resize, generate mipmaps, mutate sampler state, or delete the underlying handle.
- `external-texture` bindings are unsupported for WebXR camera textures in this experimental pass.

## Types

### `WebXRCameraTextureProps`

`WebXRCameraTextureProps` accepts normal texture metadata that does not imply ownership or mutation: `id`, `format`, `usage`, `view`, and `userData`. `sampler`, `data`, size, mip, and handle props are intentionally not accepted.

## Methods

### `constructor(device: Device, xrWebGLBinding: XRWebGLBinding, props?: WebXRCameraTextureProps)`

Creates a WebGL-only WebXR camera binding source.

### `setView(view: XRView | null): void`

Selects the XR view whose raw camera image should be resolved for the next draw. Pass `null` when no raw camera view is available.

### `resolveTextureBinding(bindingLayout: TextureBindingLayout): Texture | null`

Resolves a borrowed normal texture binding for the current camera view. Returns `null` until a camera-backed view is selected.

### `destroy(): void`

Destroys only the luma wrapper. The browser-owned WebXR camera texture remains browser-owned.
