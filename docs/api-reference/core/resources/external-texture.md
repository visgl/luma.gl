# ExternalTexture

:::info
WebGPU only.
:::

While it is possible to use a normal `Texture` for a video element, the `ExternalTexture`
class provides a way to create a cheap-to-construct, disposable view of the video.

The performance and memory savings can be significant.

Since a new external texture is created every frame, new bindings must be prepared:

```typescript
function onFrame() {
  requestAnimationFrame(onFrame);

  const externalTexture = device.createExternalTexture({source: video});

  model.setBindings([
    externalTexture,
    sampler
  ])

  model.draw(renderPass);
}
requestAnimationFrame(onFrame);
```
