# Core GPU cookbook

[Overview](https://luma.gl/next/docs/api-reference/core.md)[Programming guide](https://luma.gl/next/docs/api-guide/gpu.md)[Cookbook](https://luma.gl/next/docs/api-guide/gpu/cookbook.md)

These recipes are intentionally small. Follow the linked guide for the mental model and the linked reference for exact options and ownership.

| Goal                 | Start with                             | Result                                     |
| -------------------- | -------------------------------------- | ------------------------------------------ |
| Open a portable GPU  | `luma.createDevice()`                  | A WebGPU or WebGL 2 `Device`               |
| Upload changing data | `Device.createBuffer()`                | A reusable GPU allocation                  |
| Draw a frame         | `RenderPass`                           | Commands targeting the current framebuffer |
| Run compute          | `ComputePass`                          | GPU-written storage buffers or textures    |
| Read a small result  | `Buffer.readAsync()`                   | A copied CPU-visible byte range            |
| Resize presentation  | `CanvasContext.setDrawingBufferSize()` | A correctly sized canvas and attachments   |
| Handle device loss   | `Device.lost`                          | A clear stop-and-recreate boundary         |

## Initialize a portable device[​](#initialize-a-portable-device "Direct link to Initialize a portable device")

```
const device = await luma.createDevice({

  type: 'best-available',

  adapters: [webgpuAdapter, webgl2Adapter],

  createCanvasContext: true

});

console.log(device.type); // 'webgpu' or 'webgl'
```

Import both adapters when both backends are acceptable. See [GPU initialization](https://luma.gl/next/docs/api-guide/gpu/gpu-initialization.md).

## Upload data[​](#upload-data "Direct link to Upload data")

```
const positions = device.createBuffer({

  data: new Float32Array([0, 0, 1, 0, 0, 1]),

  usage: Buffer.VERTEX | Buffer.COPY_DST

});

positions.write(nextPositions);
```

Declare every later use at creation. The owner eventually calls `positions.destroy()`.

## Render[​](#render "Direct link to Render")

```
const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1]});

renderPass.setPipeline(pipeline);

renderPass.setVertexArray(vertexArray);

renderPass.draw({vertexCount: 3});

renderPass.end();

device.submit();
```

Reuse the pipeline and vertex array; only encode the frame’s commands.

## Run compute[​](#run-compute "Direct link to Run compute")

```
computePipeline.setBindings({data: storageBuffer});

const computePass = device.beginComputePass();

computePass.setPipeline(computePipeline);

computePass.dispatch(Math.ceil(itemCount / 64));

computePass.end();

device.submit();
```

Compute is WebGPU-only. Use GPU Core when several stages need dependency scheduling.

## Read data back[​](#read-data-back "Direct link to Read data back")

```
const bytes = await resultBuffer.readAsync(0, Uint32Array.BYTES_PER_ELEMENT);

const result = new Uint32Array(bytes.buffer, bytes.byteOffset, 1)[0];
```

Read back only bounded results. Mapping or copying a large result introduces a synchronization boundary.

## Resize presentation[​](#resize-presentation "Direct link to Resize presentation")

```
device.canvasContext.setDrawingBufferSize(width, height);

depthTexture.destroy();

depthTexture = device.createTexture({width, height, format: 'depth24plus'});
```

Recreate size-dependent attachments, not static buffers, shaders, or pipelines.

## Recover from validation or device errors[​](#recover-from-validation-or-device-errors "Direct link to Recover from validation or device errors")

```
device.lost.then(({message}) => {

  stopRendering();

  reportDeviceFailure({backend: device.type, message});

  showRestartAction();

});
```

Never keep submitting against a lost device. Recreate all device-owned resources after obtaining a new one.

## Related pages[​](#related-pages "Direct link to Related pages")

* [Core GPU programming guide](https://luma.gl/next/docs/api-guide/gpu.md)
* [GPU commands](https://luma.gl/next/docs/api-guide/gpu/gpu-commands.md)
* [Buffer reference](https://luma.gl/next/docs/api-reference/core/resources/buffer.md)
* [Texture reference](https://luma.gl/next/docs/api-reference/core/resources/texture.md)
