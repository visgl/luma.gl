# ExternalTexture

[Texture](https://luma.gl/next/docs/api-reference/core/resources/texture.md)[TextureView](https://luma.gl/next/docs/api-reference/core/resources/texture-view.md)[Sampler](https://luma.gl/next/docs/api-reference/core/resources/sampler.md)[ExternalTexture](https://luma.gl/next/docs/api-reference/core/resources/external-texture.md)

![WebGPU supported](https://img.shields.io/badge/WebGPU-yes-brightgreen.svg?style=flat-square)![WebGL2 not supported](https://img.shields.io/badge/WebGL2-no-red.svg?style=flat-square)

`ExternalTexture` is the low-level concrete WebGPU `GPUExternalTexture` binding for browser-owned texture data. It is a one-shot resource, not the engine-level live video helper. Use [`VideoTexture`](https://luma.gl/next/docs/api-reference/engine/video-texture.md) when a model or material should follow a playing video across frames.

Since WebGPU external textures are acquired per frame, bindings that use them must be prepared again for each draw:

```
function onFrame() {

  requestAnimationFrame(onFrame);



  const externalTexture = device.createExternalTexture({source: video});



  model.setBindings({videoTexture: externalTexture});



  model.draw(renderPass);

}

requestAnimationFrame(onFrame);
```

`ExternalTextureProps` accepts `source?: HTMLVideoElement | VideoFrame`, `colorSpace?: 'srgb'`, an optional default `sampler`, and normal `ResourceProps`. Handle-backed opaque WebGPU external textures also require `width` and `height` when luma cannot infer them from a source.
