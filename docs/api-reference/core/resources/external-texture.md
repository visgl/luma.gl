import {CoreDocsTabs} from '@site/src/components/docs/core-docs-tabs';

# ExternalTexture

<CoreDocsTabs group="textures" active="external-texture" />

<p className="badges">
  <img src="https://img.shields.io/badge/WebGPU-yes-brightgreen.svg?style=flat-square" alt="WebGPU supported" />
  <img src="https://img.shields.io/badge/WebGL2-no-red.svg?style=flat-square" alt="WebGL2 not supported" />
</p>

`ExternalTexture` is the low-level concrete WebGPU `GPUExternalTexture` binding for browser-owned texture data. It is a one-shot resource, not the engine-level live video helper. Use [`VideoTexture`](/docs/api-reference/engine/video-texture) when a model or material should follow a playing video across frames.

Since WebGPU external textures are acquired per frame, bindings that use them must be prepared again for each draw:

```typescript
function onFrame() {
  requestAnimationFrame(onFrame);

  const externalTexture = device.createExternalTexture({source: video});

  model.setBindings({videoTexture: externalTexture});

  model.draw(renderPass);
}
requestAnimationFrame(onFrame);
```

`ExternalTextureProps` accepts `source?: HTMLVideoElement | VideoFrame`, `colorSpace?: 'srgb'`, an optional default `sampler`, and normal `ResourceProps`. Handle-backed opaque WebGPU external textures also require `width` and `height` when luma cannot infer them from a source.
