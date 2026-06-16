import {CoreDocsTabs} from '@site/src/components/docs/core-docs-tabs';

# ExternalTexture

<CoreDocsTabs group="textures" active="external-texture" />

:::info
WebGPU only.
:::

`ExternalTexture` is the low-level concrete WebGPU `GPUExternalTexture` binding for browser-owned texture data. It is a one-shot resource, not a long-lived video object.

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
