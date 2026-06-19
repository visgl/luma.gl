import {CoreDocsTabs} from '@site/src/components/docs/core-docs-tabs';
import {CommandEncodingGraphic} from '@site/src/components/docs/command-encoding-graphic';

# Issuing GPU Commands

<CoreDocsTabs group="commands" active="command-encoding" />

GPU work happens when your application records commands and submits them to a `Device`. A command can draw, dispatch compute work, copy data, write a timestamp, or replay previously recorded draws.

luma.gl gives you a small set of command objects. Start with the one that matches the work you want to describe:

| Start with | Use it for |
| --- | --- |
| [`CommandEncoder`](/docs/api-reference/core/resources/command-encoder) | Records an ordered stream of buffer and texture writes and reads, render and compute operations. |
| [`ComputePass`](/docs/api-reference/core/resources/compute-pass) | Records dispatches of WebGPU compute pipelines. |
| [`RenderPass`](/docs/api-reference/core/resources/render-pass) | Records draw calls into a framebuffer or the current canvas frame. |
| [`RenderBundleEncoder`](/docs/api-reference/core/resources/render-bundle-encoder) | Records reusable WebGPU draw commands once for replay from a later `RenderPass`. |

## Typical Usage

The usual command path is:

1. Get a `CommandEncoder`.
2. Begin one or more passes or record copy/query commands on that encoder.
3. End each pass.
4. Finish the encoder into a `CommandBuffer`.
5. Submit the finished work to the `Device`.

For the common single-pass rendering case, `device.beginRenderPass()` and `device.submit()` use the device's default command encoder for you:

```ts
const renderPass = device.beginRenderPass({
  clearColor: [0, 0, 0, 1],
  clearDepth: 1
});

model.draw(renderPass);
renderPass.end();
device.submit();
```

Use an explicit `CommandEncoder` when you need one visible submission boundary around several operations:

```ts
const commandEncoder = device.createCommandEncoder();

const renderPass = commandEncoder.beginRenderPass({
  framebuffer,
  clearColor: [0, 0, 0, 1]
});
model.draw(renderPass);
renderPass.end();

const commandBuffer = commandEncoder.finish();
device.submit(commandBuffer);
```

### Outputs and Reuse

`CommandBuffer` and `RenderBundle` are the two finished command artifacts. Passes contribute commands to their parent `CommandEncoder`; they do not produce standalone objects.

| Output | Produced by | How obtained | Reusable |
| --- | --- | --- | --- |
| `CommandBuffer` | `CommandEncoder` | `RenderPass.end()`, `ComputePass.end()`, `CommandEncoder.finish()` | ❌ |
| `RenderBundle` | `RenderBundleEncoder` | Call `RenderBundleEncoder.finish()` | ✅ |

## Passes

A pass groups commands that share one kind of GPU work.

### RenderPass

Use a `RenderPass` when you are drawing. It chooses the render target, applies clear/load behavior, and receives draw calls from a `Model` or `RenderPipeline`.

```ts
const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1]});
model.draw(renderPass);
renderPass.end();
device.submit();
```

### ComputePass

<p className="badges">
  <img src="https://img.shields.io/badge/WebGPU-yes-brightgreen.svg?style=flat-square" alt="WebGPU supported" />
  <img src="https://img.shields.io/badge/WebGL2-no-red.svg?style=flat-square" alt="WebGL2 not supported" />
</p>

Use a `ComputePass` when you are dispatching a compute pipeline.

```ts
const computePass = webgpuDevice.beginComputePass();
computePass.setPipeline(computePipeline);
computePass.dispatch(workgroupCount);
computePass.end();
webgpuDevice.submit();
```

## How the Pieces Fit Together

Render and compute passes contribute commands to a `CommandEncoder`. Render bundles take a separate reusable path and are replayed from a later render pass.

<CommandEncodingGraphic />

## Reusable Draw Commands

<p className="badges">
  <img src="https://img.shields.io/badge/WebGPU-yes-brightgreen.svg?style=flat-square" alt="WebGPU supported" />
  <img src="https://img.shields.io/badge/WebGL2-no-red.svg?style=flat-square" alt="WebGL2 not supported" />
</p>

Use a `RenderBundleEncoder` when the same WebGPU draw commands run repeatedly and only already-bound buffer or texture contents change. It records draw commands without starting a render pass. `finish()` returns an immutable `RenderBundle`, and a normal `RenderPass` replays that bundle.

```ts
const renderBundleEncoder = device.createRenderBundleEncoder({
  colorAttachmentFormats: [device.preferredColorFormat]
});

model.draw(renderBundleEncoder);
const renderBundle = renderBundleEncoder.finish();

const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1]});
renderPass.executeBundles([renderBundle]);
renderPass.end();
device.submit();
```

Rebuild a render bundle when its draw sequence, bound resources, pipeline compatibility, or attachment formats change. Multisampled render bundles are not currently supported.

## Commands Outside Passes

Not every command belongs inside a pass. `CommandEncoder` also records operations such as:

- `copyBufferToBuffer()`
- `copyBufferToTexture()`
- `copyTextureToBuffer()`
- `copyTextureToTexture()`
- `resolveQuerySet()`
- `writeTimestamp()`

Use these when the operation must be ordered with render or compute work in the same command stream. For simple CPU-driven uploads and readbacks, resource helpers such as `Buffer.write()` and `Texture.writeData()` are often simpler; see the buffer and texture guides for those choices.

## Optional Details: Backends and Data Transfers

:::note
The command model above is enough for most rendering and compute work. The details below are useful when you need to choose between resource helpers and explicit copy commands, or when backend execution differences matter.
:::

### WebGPU and WebGL execution

On WebGPU, command encoding is truly deferred. Commands are recorded onto a specific `CommandEncoder`, `finish()` seals that encoder into a `CommandBuffer`, and `submit()` sends the finished work to the queue.

On WebGL, luma.gl preserves the same API shape where practical, but rendering remains effectively immediate. Copy commands can be recorded and replayed at submission, while render-pass state changes and clears occur as the pass is used. WebGL does not support compute passes or render bundles.

### Resource helpers and explicit commands

Resource helpers perform a complete operation without requiring you to finish and submit a command encoder. They are usually the simplest choice when data starts on the CPU or in a browser image object:

- `Buffer.write()` for CPU-to-buffer uploads
- `Texture.writeData()` for typed-array texture uploads
- `Texture.copyExternalImage()` for image, canvas, or video sources
- `Texture.readBuffer()` for a standalone texture readback

Use `CommandEncoder` copy methods when the source and destination already live on the GPU, several operations must execute in a specific order, or you want one explicit submission boundary:

- `copyBufferToBuffer()`
- `copyBufferToTexture()`
- `copyTextureToBuffer()`
- `copyTextureToTexture()`

### Choosing a texture upload path

On WebGPU, buffer-to-texture copies follow stricter layout rules than queue-style CPU uploads. In particular, buffer-copy row pitches generally need to be aligned to 256 bytes.

Use `Texture.writeData()` for tightly packed CPU texels. Use `Texture.writeBuffer()` or `CommandEncoder.copyBufferToTexture()` when the source is already in a reusable GPU buffer and the extra layout control is intentional.

As a rule of thumb, prefer resource helpers for one-off CPU uploads and readbacks. Prefer explicit command encoding for ordered GPU-to-GPU work or mixed copy, render, and compute operations in one submission.

## Related pages

- [Using GPU Buffers](/docs/api-guide/gpu/gpu-buffers)
- [Using GPU Textures](/docs/api-guide/gpu/gpu-textures)
- [How GPU Rendering Works](/docs/api-guide/gpu/gpu-rendering)
- [CommandEncoder](/docs/api-reference/core/resources/command-encoder)
- [RenderBundleEncoder](/docs/api-reference/core/resources/render-bundle-encoder)
