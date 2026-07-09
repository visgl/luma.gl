import {EngineDocsTabs} from '@site/src/components/docs/engine-docs-tabs';

# VideoTexture

<EngineDocsTabs group="dynamic-resources" active="video-texture" />

<p class="badges">
  <img src="https://img.shields.io/badge/From-v9.4-blue.svg?style=flat-square" alt="From-v9.4" />
</p>

`VideoTexture` is the engine-level live video binding source. It accepts a caller-owned
`HTMLVideoElement` or `VideoFrame` and resolves the concrete core binding that matches the shader
slot used by the current draw.

Use [`Texture`](/docs/api-reference/core/resources/texture) for one uploaded image or when the
shader needs ordinary texture features such as mipmaps, repeat addressing, render-target usage, or
storage usage. Use `VideoTexture` when a `Model` or `Material` should follow a live video source
across draws.

For the copied-versus-external texture tradeoff, see
[Working With Video Textures](/docs/api-guide/gpu/video-textures).

## Usage

```typescript
import {Model, VideoTexture} from '@luma.gl/engine';

const videoTexture = new VideoTexture(device, {source: video});

const model = new Model(device, {
  source,
  bindings: {videoTexture}
});
```

The shader declaration selects the concrete representation:

```glsl
uniform sampler2D videoTexture;
vec4 color = texture(videoTexture, uv);
```

```wgsl
@group(0) @binding(auto) var videoTexture: texture_2d<f32>;
@group(0) @binding(auto) var videoTextureSampler: sampler;
let color = textureSample(videoTexture, videoTextureSampler, uv);
```

Both declarations above use the portable copied texture path. WebGPU callers may opt into native
external-video sampling with:

```wgsl
@group(0) @binding(auto) var videoTexture: texture_external;
@group(0) @binding(auto) var videoTextureSampler: sampler;
let color = textureSampleBaseClampToEdge(videoTexture, videoTextureSampler, uv);
```

## Types

### `VideoTextureSource`

```ts
export type VideoTextureSource = HTMLVideoElement | VideoFrame;
```

### `VideoTextureProps`

```ts
export type VideoTextureProps = Pick<ResourceProps, 'id'> & {
  source: VideoTextureSource;
  colorSpace?: 'srgb';
  sampler?: Sampler | SamplerProps;
};
```

- `source` is required and remains caller-owned.
- `colorSpace` defaults to `'srgb'` for copied and imported video data.
- `sampler` supplies the default sampler for copied and native external bindings.

## Properties

### `device`, `id`

The device that resolves bindings and the application-provided or generated resource identifier.

### `source: VideoTextureSource`

The current caller-owned source. Replace it with `setSource()`.

### `isReady: boolean`

`HTMLVideoElement` sources become ready after exposing nonzero `videoWidth` and `videoHeight` plus
current frame data (`readyState >= HAVE_CURRENT_DATA`). `VideoFrame` sources with positive display
dimensions are ready immediately.

### `generation: number`

Advances when concrete binding identity may change, such as source replacement, sampler
replacement, copied texture resize, or native external texture reacquisition. Engine bind-group
caches use it to decide when to rebind.

### `updateTimestamp: number`

Tracks observed readiness, frame, source, sampler, and binding changes. `VideoTexture` observes
HTML video advancement while its readiness or binding is queried during draw preparation.

### `destroyed: boolean`

Indicates whether `destroy()` has released owned copied and external bindings.

## Methods

### `constructor(device: Device, props: VideoTextureProps)`

Creates a live binding source. Runtime callers must supply an `HTMLVideoElement` or `VideoFrame`;
unsupported values throw a `TypeError`.

### `setSource(source: VideoTextureSource): void`

Replaces the source and invalidates resolved bindings. Same-size copied sources reuse the existing
texture; a new source size recreates it.

### `setSampler(sampler: Sampler | SamplerProps): void`

Replaces the default sampler for existing and future copied or native external bindings.

### `resolveTextureBinding(bindingLayout: TextureBindingLayout): Texture | ExternalTexture | null`

Resolves the current source for one reflected shader texture slot. Returns `null` while the source
is not ready or after destruction.

### `destroy(): void`

Idempotently releases the copied `Texture` and any acquired `ExternalTexture`. It never pauses an
`HTMLVideoElement`, stops a `MediaStream`, or calls `VideoFrame.close()`.

## Binding Behavior

| Shader slot | Resolution |
| --- | --- |
| WebGL `sampler2D` | Copies the current frame into a one-mip `rgba8unorm` luma `Texture`. |
| WGSL `texture_2d<f32>` | Copies the current frame into the same portable luma `Texture` path. |
| WGSL `texture_external` | Acquires a fresh native WebGPU `GPUExternalTexture` for the current draw. |

The copied texture is uploaded only after the observed frame token changes. A native external
texture is deliberately reacquired because WebGPU external textures are short-lived bindings.
There is no copied fallback for a `texture_external` slot: use `texture_2d<f32>` when copied
texture semantics are required.

## Ownership and Errors

- The caller owns every source. Keep a `VideoFrame` open until the draw that resolves it has
  completed binding preparation; close replaced frames only after they can no longer be resolved.
- The caller owns video playback, autoplay handling, camera permission prompts, and stopping
  `MediaStream` tracks.
- Copied uploads can fail when a video is not ready, a cross-origin video is not CORS-accessible,
  or a `VideoFrame` was closed too early. `VideoTexture` reports these cases with source-oriented
  guidance while preserving the original error as its cause.
- Native WebGPU import failures are reported explicitly. Switch the shader slot to
  `texture_2d<f32>` for the copied path when the browser cannot import the source.

## Related APIs

- [`DynamicTexture`](/docs/api-reference/engine/dynamic-texture) wraps asynchronous or replaceable
  ordinary texture data.
- [`ExternalTexture`](/docs/api-reference/core/resources/external-texture) is the low-level concrete
  one-shot WebGPU external binding.
- Experimental [`WebXRCameraTexture`](/docs/api-reference/experimental/webxr/webxr-camera-texture)
  handles WebXR Raw Camera Access without making WebXR part of `VideoTexture`.
