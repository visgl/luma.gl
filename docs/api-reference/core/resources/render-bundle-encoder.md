import {CoreDocsTabs} from '@site/src/components/docs/core-docs-tabs';
import {RenderBundlesExample} from '@site/src/examples';

# RenderBundleEncoder

<CoreDocsTabs group="commands" active="render-bundle-encoder" />

<p className="badges">
  <img src="https://img.shields.io/badge/From-v9.4-blue.svg?style=flat-square" alt="From-v9.4" />
  <img src="https://img.shields.io/badge/WebGPU-yes-brightgreen.svg?style=flat-square" alt="WebGPU supported" />
  <img src="https://img.shields.io/badge/WebGL2-no-red.svg?style=flat-square" alt="WebGL2 not supported" />
</p>

<RenderBundlesExample embedded />

Render bundles allow expensive CPU-side command recording and validation to be performed once and reused, improving performance when many identical draw calls are repeated frame after frame. A `RenderBundleEncoder` records these reusable commands without beginning a render pass. Calling `finish()` creates an immutable `RenderBundle`, and a normal `RenderPass` replays it with `executeBundles()`.

Use render bundles when the same draw commands execute every frame and only the contents of already-bound buffers or textures change. Rebuild the bundle when the command list, bound resources, pipeline, or attachment compatibility changes.

## Usage

### Recording and replaying

```ts
const renderBundleEncoder = device.createRenderBundleEncoder({
  colorAttachmentFormats: [device.preferredColorFormat]
});

model.draw(renderBundleEncoder);
const renderBundle = renderBundleEncoder.finish();

const renderPass = device.beginRenderPass({
  clearColor: [0, 0, 0, 1],
  clearDepth: 1
});
renderPass.executeBundles([renderBundle]);
renderPass.end();
device.submit();
```

The bundle attachment formats and sample count must match the render pass that executes it. `RenderBundleEncoder` behaves like a partial render pass for draw recording, so render-pass setup and dynamic pass controls such as clears, framebuffer selection, viewport, scissor rectangle, blend constant, stencil reference, and occlusion queries are not available while recording a bundle.

### Updating resources and splitting bundles

A render bundle records draw commands and resource bindings, not the current contents of bound buffers and textures. Update dynamic resource contents separately before executing the bundle; these content updates do not require rebuilding it. Changing which resource is bound, its binding offset, the pipeline, or the draw sequence does require new commands and therefore a rebuilt bundle.

For scenes with both stable and frequently changing draws, split the work into multiple bundles. Keep stable draws in long-lived bundles, rebuild only smaller volatile bundles, and record highly dynamic draws directly in the surrounding `RenderPass`. Execute the bundles and direct draws in the order required by the scene.

## Types

### `RenderBundleEncoderProps`

`RenderBundleEncoderProps` extends [`ResourceProps`](resource.md#resourceprops). It includes only resource metadata and the attachment compatibility fields required to record a bundle; render-pass setup properties are not accepted.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `colorAttachmentFormats?` | `(TextureFormatColor \| null)[]` | `[device.preferredColorFormat]` | Color attachment formats expected by the bundle. |
| `depthStencilAttachmentFormat?` | `TextureFormatDepthStencil \| false` | `device.preferredDepthFormat` | Depth/stencil attachment format expected by the bundle. Set `false` for a color-only bundle. |
| `sampleCount?` | `number` | `1` | Sample count expected by the bundle. Currently only `1` is supported; multisampled render bundles require multisample pipeline support. |
| `depthReadOnly?` | `boolean` | `false` | Marks the expected depth attachment as read-only. |
| `stencilReadOnly?` | `boolean` | `false` | Marks the expected stencil attachment as read-only. |

## Members

- `device`: `Device` - holds a reference to the `Device` that created this resource.
- `handle`: `unknown` - holds the underlying WebGPU encoder handle.
- `props`: normalized creation properties.

## Methods

### `renderBundleEncoder.finish(): RenderBundle`

Completes recording and returns an immutable reusable bundle. The bundle inherits the encoder's `id` and `userData`.

## See also

### `device.createRenderBundleEncoder(props?: RenderBundleEncoderProps): RenderBundleEncoder`

Creates an encoder for reusable WebGPU render commands.

### `renderPass.executeBundles(bundles: Iterable<RenderBundle>): void`

Replays previously recorded bundles in the current WebGPU render pass.
