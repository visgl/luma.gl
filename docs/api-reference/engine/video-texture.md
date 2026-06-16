# VideoTexture

`VideoTexture` is the engine-level live video binding source. It accepts an `HTMLVideoElement` or `VideoFrame` and resolves the concrete core binding that matches the shader slot used by the current draw.

For the copied-vs-external texture tradeoff, see [Working With Video Textures](/docs/api-guide/gpu/video-textures).

## Usage

```typescript
import {Model, VideoTexture} from '@luma.gl/engine';

const videoTexture = new VideoTexture(device, {source: video});

const model = new Model(device, {
  source,
  bindings: {videoTexture}
});
```

For WebGL, bind through a normal GLSL sampler:

```glsl
uniform sampler2D videoTexture;
vec4 color = texture(videoTexture, uv);
```

For copied WebGPU sampling, use a normal WGSL texture:

```wgsl
@group(0) @binding(auto) var videoTexture: texture_2d<f32>;
@group(0) @binding(auto) var videoTextureSampler: sampler;
let color = textureSample(videoTexture, videoTextureSampler, uv);
```

For native WebGPU video sampling, opt into `texture_external`:

```wgsl
@group(0) @binding(auto) var videoTexture: texture_external;
@group(0) @binding(auto) var videoTextureSampler: sampler;
let color = textureSampleBaseClampToEdge(videoTexture, videoTextureSampler, uv);
```

## Behavior

- WebGL `sampler2D` and WebGPU `texture_2d` resolve to copied luma `Texture` resources.
- WebGPU `texture_external` resolves to a native `GPUExternalTexture` when the browser accepts the import. A copied `Texture` cannot satisfy that WebGPU slot; use a `texture_2d<f32>` shader binding for the copied path.
- `HTMLVideoElement` sources are ready only after they expose nonzero video dimensions and current frame data.
- `VideoFrame` sources are ready immediately. Frames are caller-owned; `VideoTexture` never calls `VideoFrame.close()`.
- `setSource()` replaces the current source. Same-size copied frames reuse the same texture identity; size changes recreate the copied texture and invalidate bind-group identity.

## Remarks

- Shader binding type selects the representation. There is no single native external-texture shader declaration shared by GLSL and WGSL.
- `texture_external` is for base-level clamp-style external sampling. Use a normal texture binding when the shader needs mipmaps, repeat addressing, or ordinary `textureSample` semantics.
- WebGL copied `VideoTexture` bindings can generate mipmaps after frame uploads. WebGPU `VideoTexture` rejects `mipmaps: true` because WebGPU mipmap generation must be recorded before the render pass; upload into an ordinary `Texture` before `beginRenderPass()` when that path is required.
- Future copied DOM sources such as HTML-in-Canvas textures and future WebXR camera helpers can use the same `TextureBindingSource` framework without making `VideoTexture` their public API.
