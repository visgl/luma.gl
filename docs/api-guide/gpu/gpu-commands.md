# GPU Commands

Most luma.gl applications spend most of their time doing one of two things:

- calling immediate convenience methods such as `Buffer.write()` or `Texture.writeData()`
- recording explicit GPU work through `CommandEncoder`, `RenderPass`, and `ComputePass`

Both styles are valid. The right choice depends on whether you need simple data transfer, explicit ordering, or predictable batching.

## Two command styles in luma.gl

### Immediate convenience methods

These methods perform a complete operation from the call site:

- `Buffer.write()`
- `Buffer.mapAndWriteAsync()`
- `Texture.copyExternalImage()`
- `Texture.writeData()`
- `Texture.readBuffer()`
- `Texture.readDataAsync()` (deprecated convenience wrapper)
- `Texture.writeBuffer()`

These APIs are convenient because they do not require you to create a `CommandEncoder`, finish it, or submit it yourself.

They are best when:

- your source data is on the CPU
- you are doing a one-off upload or readback
- you do not need to tightly coordinate the copy with render or compute work in the same command stream

### Recorded command streams

Recorded command streams are built explicitly:

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

This style is best when:

- the source and destination are already on the GPU
- multiple copies, passes, and query operations must happen in one ordered stream
- you want to control exactly when work is submitted

The main recorded-copy methods are:

- `copyBufferToBuffer()`
- `copyBufferToTexture()`
- `copyTextureToBuffer()`
- `copyTextureToTexture()`
- `resolveQuerySet()`
- `writeTimestamp()`

## WebGL vs WebGPU

The `CommandEncoder` API is portable, but the backend behavior is not identical.

### WebGPU

On WebGPU, command encoding is truly deferred:

- commands record onto a specific `CommandEncoder`
- `finish()` seals that encoder into one `CommandBuffer`
- `submit()` sends that finished work to the queue

This gives WebGPU applications a real command-stream abstraction. Ordering, batching, and pass ownership all follow the encoder you recorded into.

### WebGL

On WebGL, luma.gl provides a best-effort compatibility layer.

- copy commands are recorded and replayed when you submit the command buffer
- render passes are still effectively immediate-mode
- state changes and clears happen as the pass is used, not as a native deferred GPU command stream

So the portable rule is:

- use `CommandEncoder` when you want a cross-backend way to express copy work and pass structure
- do not assume WebGL has the same deferred execution model as WebGPU

For rendering, WebGL is still conceptually immediate even though luma.gl exposes the same surface API.

## Immediate APIs on WebGPU

Some luma.gl methods intentionally map to WebGPU's queue-style immediate operations rather than command-buffer recording.

### Queue-style upload paths

- `Buffer.write()` is the luma.gl equivalent of queue-driven buffer upload
- `Texture.writeData()` closely matches `GPUQueue.writeTexture()`
- `Texture.copyExternalImage()` closely matches `GPUQueue.copyExternalImageToTexture()`

Use these when your source data starts on the CPU or in browser image objects.

### Command-encoder copy paths

- `Texture.writeBuffer()`
- `Texture.readBuffer()`
- `CommandEncoder.copyBufferToTexture()`
- `CommandEncoder.copyTextureToBuffer()`

These use GPU buffer-copy semantics instead of queue-style CPU upload semantics.

This matters on WebGPU because buffer-copy layout rules are stricter:

- row pitch must follow buffer-copy alignment rules
- in practice `bytesPerRow` usually needs to be a multiple of `256`

If your data is tightly packed on the CPU, `Texture.writeData()` is usually the better upload path.

## Choosing an approach

### Recommended defaults

Use `Buffer.write()` when:

- you are updating a buffer from CPU memory
- you do not need to batch that upload with other GPU commands

Use `Texture.writeData()` when:

- you are uploading texels from a typed array
- the source is tightly packed CPU memory
- you want to avoid WebGPU buffer-copy row-alignment requirements

Use `Texture.copyExternalImage()` when:

- the source is an `ImageBitmap`, `ImageData`, canvas, image, or video

Use `CommandEncoder` copy methods when:

- the source already lives in a GPU `Buffer` or `Texture`
- multiple copies and passes must execute in a specific order
- you want one explicit submission boundary for a group of operations

Use `Texture.readBuffer()` when:

- you want a simple standalone readback helper with an explicit destination buffer
- you do not need that readback to be manually integrated into a larger command stream
- the source texture was created with `Texture.COPY_SRC`

Use engine `DynamicTexture.readAsync()` when:

- you want a convenience readback helper that allocates a temporary buffer and returns CPU bytes directly

## Performance guidance

### Prefer immediate resource methods for CPU-to-GPU uploads

If your source data originates on the CPU, the immediate methods are usually the simplest and best first choice:

- `Buffer.write()`
- `Texture.writeData()`
- `Texture.copyExternalImage()`

These avoid extra staging logic in application code and map well to the native fast paths of each backend.

### Prefer command encoding for GPU-to-GPU work

If both ends of the operation already live on the GPU, command encoding is typically the better fit:

- buffer-to-buffer copies
- texture-to-buffer staging
- buffer-to-texture staging from reusable upload buffers
- texture-to-texture copies
- render + compute + copy pipelines in one ordered sequence

This is especially true on WebGPU, where the encoder is the real unit of command recording.

### Avoid unnecessary buffer staging for texture uploads

On WebGPU, buffer-copy texture uploads are not the same as `writeTexture()` style uploads.

Use `Texture.writeData()` instead of `writeBuffer()` or `copyBufferToTexture()` when:

- the source data is a CPU typed array
- rows are tightly packed
- you do not already have the data in a reusable GPU buffer

Use `writeBuffer()` or `copyBufferToTexture()` when:

- the source is already in a GPU buffer
- you want to reuse a staging/upload buffer across many updates
- the extra layout control is intentional

### WebGL recommendations

On WebGL, prefer the simpler API unless you specifically need the portable command surface:

- use resource methods for straightforward uploads and readbacks
- use `CommandEncoder` for copy operations and portable code structure
- do not treat WebGL command encoding as a promise of native deferred execution

## Related pages

- [Using GPU Buffers](/docs/api-guide/gpu/gpu-buffers)
- [Using GPU Textures](/docs/api-guide/gpu/gpu-textures)
- [How GPU Rendering Works](/docs/api-guide/gpu/gpu-rendering)
- [CommandEncoder](/docs/api-reference/core/resources/command-encoder)
