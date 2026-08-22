# Working With Video Textures

[Bindings](https://luma.gl/docs/api-guide/gpu/gpu-bindings.md)[Attributes](https://luma.gl/docs/api-guide/gpu/gpu-attributes.md)[Uniforms](https://luma.gl/docs/api-guide/gpu/gpu-uniforms.md)[Textures](https://luma.gl/docs/api-guide/gpu/gpu-textures.md)[Video textures](https://luma.gl/docs/api-guide/gpu/video-textures.md)[Tabular data](https://luma.gl/docs/api-guide/gpu/tabular-data-in-wgsl.md)

From v9.4

Video can enter a shader through more than one texture path. Start with the portable copied path unless the shader can accept WebGPU's more restricted native external-video sampling.

The example starts with a generated video source. Camera access remains optional and is requested only from the button:

### Video Texture

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/api/video-texture)Info

InfoSource

Use camera

```
// Loading source…
```

Scroll page · Ctrl/⌘ + scroll to interact

## Choose The Binding Path[​](#choose-the-binding-path "Direct link to Choose The Binding Path")

| Need                                                    | luma.gl API                                                                                | Shader binding                           | Notes                                                              |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------- | ------------------------------------------------------------------ |
| One uploaded image or one copied video frame            | [`Texture`](https://luma.gl/docs/api-reference/core/resources/texture.md)                  | GLSL `sampler2D`, WGSL `texture_2d<f32>` | Concrete GPU allocation with ordinary texture sampling.            |
| Async or replaceable copied texture data                | [`DynamicTexture`](https://luma.gl/docs/api-reference/engine/dynamic-texture.md)           | GLSL `sampler2D`, WGSL `texture_2d<f32>` | Engine wrapper around a concrete luma `Texture`.                   |
| Playing `HTMLVideoElement` or caller-owned `VideoFrame` | [`VideoTexture`](https://luma.gl/docs/api-reference/engine/video-texture.md)               | Depends on shader declaration            | Live engine binding source that resolves per draw.                 |
| Native WebGPU direct-video sampling                     | [`ExternalTexture`](https://luma.gl/docs/api-reference/core/resources/external-texture.md) | WGSL `texture_external`                  | Concrete, short-lived WebGPU binding acquired from a video source. |

Use an ordinary `Texture` when the shader needs normal texture features: `textureSample`, repeat address modes, mipmaps, render-target usage, storage usage, or one shader shape shared with non-video textures. A single video frame can be copied into such a texture with `Texture.copyExternalImage()`.

Use `VideoTexture` when the application owns a live video source and wants luma.gl to update the binding as frames are observed:

```
import {Model, VideoTexture} from '@luma.gl/engine';



const videoTexture = new VideoTexture(device, {source: video});



const model = new Model(device, {

  source,

  bindings: {videoTexture}

});
```

The shader declaration selects how `VideoTexture` resolves.

## Portable Copied Sampling[​](#portable-copied-sampling "Direct link to Portable Copied Sampling")

WebGL always uses the copied path:

```
uniform sampler2D videoTexture;

vec4 color = texture(videoTexture, uv);
```

WebGPU uses the same copied path when the shader asks for a normal texture:

```
@group(0) @binding(auto) var videoTexture: texture_2d<f32>;

@group(0) @binding(auto) var videoTextureSampler: sampler;

let color = textureSample(videoTexture, videoTextureSampler, uv);
```

The copied path reuses one one-mip `rgba8unorm` texture while the video dimensions are stable and uploads only when the observed frame changes. A dimension change creates a new copied texture and invalidates the binding identity.

## Native WebGPU External Sampling[​](#native-webgpu-external-sampling "Direct link to Native WebGPU External Sampling")

WebGPU can sample a native external texture:

```
@group(0) @binding(auto) var videoTexture: texture_external;

@group(0) @binding(auto) var videoTextureSampler: sampler;

let color = textureSampleBaseClampToEdge(videoTexture, videoTextureSampler, uv);
```

When a `VideoTexture` resolves against `texture_external`, luma.gl acquires a native WebGPU [`GPUExternalTexture`](https://gpuweb.github.io/gpuweb/#gpu-external-texture). This can let the browser sample decoded video without first expanding every frame into an application-owned RGBA texture.

This path is an optimization, not a more general texture type:

* The shader must use WGSL `texture_external` and `textureSampleBaseClampToEdge`.
* The binding is base-level and clamp-style; it does not provide mipmaps, repeat addressing, or ordinary `textureSample` semantics.
* A WebGPU external texture is short-lived, so luma.gl reacquires it during draw binding resolution and may invalidate the bind group.
* A copied `Texture` cannot satisfy a `texture_external` slot. Use `texture_2d<f32>` when native import is unavailable or copied texture behavior is required.

Use the copied path for portable rendering and texture flexibility. Use `texture_external` only when the shader can accept its restrictions and direct-video sampling is worth the tradeoff.

## Camera Video[​](#camera-video "Direct link to Camera Video")

Camera streams use the same `HTMLVideoElement` path:

```
const stream = await navigator.mediaDevices.getUserMedia({video: true});

video.srcObject = stream;

await video.play();



const videoTexture = new VideoTexture(device, {source: video});
```

Request camera permission from a user gesture. Wait until the video exposes a current frame before expecting `VideoTexture` to draw; `requestVideoFrameCallback()` is the preferred browser signal when available. Stop the `MediaStream` tracks when the application no longer needs the camera. If the camera should look mirror-like, flip the U texture coordinate in the shader or model UVs.

For URL-backed videos, configure the media element's `crossOrigin` value before assigning `src` and serve compatible CORS headers. Otherwise the copied texture upload can be blocked by browser security rules. Autoplay policies often require muted video or an explicit user gesture.

## Caller-Owned VideoFrame Sources[​](#caller-owned-videoframe-sources "Direct link to Caller-Owned VideoFrame Sources")

`VideoTexture` also accepts caller-owned `VideoFrame` objects, which is useful for decoded or timeline-selected frames:

```
let currentFrame: VideoFrame | null = null;



function showFrame(nextFrame: VideoFrame) {

  const previousFrame = currentFrame;

  currentFrame = nextFrame;

  videoTexture.setSource(nextFrame);

  previousFrame?.close();

}



// Keep currentFrame open while VideoTexture can still resolve it.

videoTexture.destroy();

currentFrame?.close();
```

Do not close the current frame immediately after `setSource()`. The frame must stay open through draw binding resolution; `VideoTexture` deliberately never calls `VideoFrame.close()` for you.

## Related APIs[​](#related-apis "Direct link to Related APIs")

Experimental [`WebXRCameraTexture`](https://luma.gl/docs/api-reference/experimental/webxr/webxr-camera-texture.md) handles WebXR Raw Camera Access. It is not a `VideoTexture`: WebXR exposes a browser-owned WebGL texture for one `XRView`, so the experimental helper wraps that borrowed texture as a normal read-only binding.

## Practical Rule[​](#practical-rule "Direct link to Practical Rule")

Start with `VideoTexture` and a normal texture binding when writing portable rendering code. Change the WebGPU shader binding to `texture_external` only for draws that can accept external-texture sampling semantics and benefit from the direct-video optimization.
