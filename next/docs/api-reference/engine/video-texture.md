# VideoTexture

[DynamicBuffer](https://luma.gl/next/docs/api-reference/engine/dynamic-buffer.md)[DynamicTexture](https://luma.gl/next/docs/api-reference/engine/dynamic-texture.md)[VideoTexture](https://luma.gl/next/docs/api-reference/engine/video-texture.md)[loadImageBitmap](https://luma.gl/next/docs/api-reference/engine/load-image-bitmap.md)

![From-v9.4](https://img.shields.io/badge/From-v9.4-blue.svg?style=flat-square)

`VideoTexture` is the engine-level live video binding source. It accepts a caller-owned `HTMLVideoElement` or `VideoFrame` and resolves the concrete core binding that matches the shader slot used by the current draw.

Use [`Texture`](https://luma.gl/next/docs/api-reference/core/resources/texture.md) for one uploaded image or when the shader needs ordinary texture features such as mipmaps, repeat addressing, render-target usage, or storage usage. Use `VideoTexture` when a `Model` or `Material` should follow a live video source across draws.

For the copied-versus-external texture tradeoff, see [Working With Video Textures](https://luma.gl/next/docs/api-guide/gpu/video-textures.md).

## Usage[​](#usage "Direct link to Usage")

```
import {Model, VideoTexture} from '@luma.gl/engine';

const videoTexture = new VideoTexture(device, {source: video});

const model = new Model(device, {
  source,
  bindings: {videoTexture}
});
```

The shader declaration selects the concrete representation:

```
uniform sampler2D videoTexture;
vec4 color = texture(videoTexture, uv);
```

```
@group(0) @binding(auto) var videoTexture: texture_2d<f32>;
@group(0) @binding(auto) var videoTextureSampler: sampler;
let color = textureSample(videoTexture, videoTextureSampler, uv);
```

Both declarations above use the portable copied texture path. WebGPU callers may opt into native external-video sampling with:

```
@group(0) @binding(auto) var videoTexture: texture_external;
@group(0) @binding(auto) var videoTextureSampler: sampler;
let color = textureSampleBaseClampToEdge(videoTexture, videoTextureSampler, uv);
```

## Types[​](#types "Direct link to Types")

### `VideoTextureProps`[​](#videotextureprops "Direct link to videotextureprops")

```
export type VideoTextureProps = Pick<ResourceProps, 'id'> & {
  source: HTMLVideoElement | VideoFrame;
  colorSpace?: 'srgb';
  sampler?: Sampler | SamplerProps;
};
```

* `source` is required and remains caller-owned.
* `colorSpace` defaults to `'srgb'` for copied and imported video data.
* `sampler` supplies the default sampler for copied and native external bindings.

## Properties[​](#properties "Direct link to Properties")

### `device`, `id`[​](#device-id "Direct link to device-id")

The device that resolves bindings and the application-provided or generated resource identifier.

### `source: HTMLVideoElement | VideoFrame`[​](#source-htmlvideoelement--videoframe "Direct link to source-htmlvideoelement--videoframe")

The current caller-owned source. Replace it with `setSource()`.

### `isReady: boolean`[​](#isready-boolean "Direct link to isready-boolean")

`HTMLVideoElement` sources become ready after exposing nonzero `videoWidth` and `videoHeight` plus current frame data (`readyState >= HAVE_CURRENT_DATA`). `VideoFrame` sources with positive display dimensions are ready immediately.

### `generation: number`[​](#generation-number "Direct link to generation-number")

Advances when concrete binding identity may change, such as source replacement, sampler replacement, copied texture resize, or native external texture reacquisition. Engine bind-group caches use it to decide when to rebind.

### `updateTimestamp: number`[​](#updatetimestamp-number "Direct link to updatetimestamp-number")

Tracks observed readiness, frame, source, sampler, and binding changes. `VideoTexture` observes HTML video advancement while its readiness or binding is queried during draw preparation.

### `destroyed: boolean`[​](#destroyed-boolean "Direct link to destroyed-boolean")

Indicates whether `destroy()` has released owned copied and external bindings.

## Methods[​](#methods "Direct link to Methods")

### `constructor(device: Device, props: VideoTextureProps)`[​](#constructordevice-device-props-videotextureprops "Direct link to constructordevice-device-props-videotextureprops")

Creates a live binding source. A lightweight assertion guards unsupported runtime source values.

### `setSource(source: HTMLVideoElement | VideoFrame): void`[​](#setsourcesource-htmlvideoelement--videoframe-void "Direct link to setsourcesource-htmlvideoelement--videoframe-void")

Replaces the source and invalidates resolved bindings. Same-size copied sources reuse the existing texture; a new source size recreates it.

### `setSampler(sampler: Sampler | SamplerProps): void`[​](#setsamplersampler-sampler--samplerprops-void "Direct link to setsamplersampler-sampler--samplerprops-void")

Replaces the default sampler for existing and future copied or native external bindings.

### `resolveTextureBinding(bindingLayout: TextureBindingLayout): Texture | ExternalTexture | null`[​](#resolvetexturebindingbindinglayout-texturebindinglayout-texture--externaltexture--null "Direct link to resolvetexturebindingbindinglayout-texturebindinglayout-texture--externaltexture--null")

Resolves the current source for one reflected shader texture slot. Returns `null` while the source is not ready or after destruction.

### `destroy(): void`[​](#destroy-void "Direct link to destroy-void")

Idempotently releases the copied `Texture` and any acquired `ExternalTexture`. It never pauses an `HTMLVideoElement`, stops a `MediaStream`, or calls `VideoFrame.close()`.

## Binding Behavior[​](#binding-behavior "Direct link to Binding Behavior")

| Shader slot             | Resolution                                                                |
| ----------------------- | ------------------------------------------------------------------------- |
| WebGL `sampler2D`       | Copies the current frame into a one-mip `rgba8unorm` luma `Texture`.      |
| WGSL `texture_2d<f32>`  | Copies the current frame into the same portable luma `Texture` path.      |
| WGSL `texture_external` | Acquires a fresh native WebGPU `GPUExternalTexture` for the current draw. |

The copied texture is uploaded only after the observed frame token changes. A native external texture is deliberately reacquired because WebGPU external textures are short-lived bindings. There is no copied fallback for a `texture_external` slot: use `texture_2d<f32>` when copied texture semantics are required.

## Ownership and Errors[​](#ownership-and-errors "Direct link to Ownership and Errors")

* The caller owns every source. Keep a `VideoFrame` open until the draw that resolves it has completed binding preparation; close replaced frames only after they can no longer be resolved.
* The caller owns video playback, autoplay handling, camera permission prompts, and stopping `MediaStream` tracks.
* Copied uploads can fail when a video is not ready, a cross-origin video is not CORS-accessible, or a `VideoFrame` was closed too early. The underlying browser error surfaces directly.
* Native WebGPU import failures surface from the device. Switch the shader slot to `texture_2d<f32>` for the copied path when the browser cannot import the source.

## Related APIs[​](#related-apis "Direct link to Related APIs")

* [`DynamicTexture`](https://luma.gl/next/docs/api-reference/engine/dynamic-texture.md) wraps asynchronous or replaceable ordinary texture data.
* [`ExternalTexture`](https://luma.gl/next/docs/api-reference/core/resources/external-texture.md) is the low-level concrete one-shot WebGPU external binding.
* Experimental [`WebXRCameraTexture`](https://luma.gl/next/docs/api-reference/experimental/webxr/webxr-camera-texture.md) handles WebXR Raw Camera Access without making WebXR part of `VideoTexture`.
