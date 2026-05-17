# Using GPU Buffers

See also [GPU Commands](/docs/api-guide/gpu/gpu-commands) for guidance on when buffer operations should use immediate resource helpers versus explicit command encoding.

## Buffer-Relevant Limits

`device.limits` exposes the main caps that influence buffer sizing, GPU data
representation, and binding pressure.

| Limit | Current device value | Why it matters |
| --- | --- | --- |
| `maxBufferSize` | `device.limits.maxBufferSize` | Upper bound for one GPU buffer allocation. |
| `maxUniformBufferBindingSize` | `device.limits.maxUniformBufferBindingSize` | Maximum bytes visible through one uniform-buffer binding. |
| `maxStorageBufferBindingSize` | `device.limits.maxStorageBufferBindingSize` | Maximum bytes visible through one storage-buffer binding. |
| `maxVertexBuffers` | `device.limits.maxVertexBuffers` | Total vertex-buffer bindings available to a render pipeline. |
| `maxVertexAttributes` | `device.limits.maxVertexAttributes` | Total shader vertex attributes available. |
| `maxUniformBuffersPerShaderStage` | `device.limits.maxUniformBuffersPerShaderStage` | Uniform-buffer binding pressure within one shader stage. |
| `maxStorageBuffersPerShaderStage` | `device.limits.maxStorageBuffersPerShaderStage` | Storage-buffer binding pressure within one shader stage. |
| `maxBindingsPerBindGroup` | `device.limits.maxBindingsPerBindGroup` | Total bindings available inside one WebGPU bind group. |
| `maxBindGroupsPlusVertexBuffers` | `device.limits.maxBindGroupsPlusVertexBuffers` | Combined WebGPU pressure across bind groups and vertex buffers. |

See [Device Limits](/docs/api-reference/core/device-limits) for the live
platform value table and the complete portable limit surface.

## Buffer Operations

The ability to copy memory between CPU, buffers and textures

| Dimension                   | WebGPU | WebGL2 | Description                                           |
| --------------------------- | ------ | ------ | ----------------------------------------------------- |
| `Buffer.write()`            | ✅     | ✅     | Write a buffer synchronously                          |
| `Buffer.mapAndWriteAsync()` | ✅     | ✅ \*     | Write a buffer synchronously                          |
| `Buffer.readAsync()`        | ✅     | ✅ \*  | Read a buffer asynchronously without copy.            |
| `Buffer.mapAndReadAsync()`  | ✅     | ✅ \*  | Read a buffer asynchronously                          |
| `Buffer.readSyncWebGL()`    | ❌     | ✅     | Read a buffer synchronously                           |
| `copyBufferToBuffer`        | ✅     | ✅     | Copy a buffer to another buffer without CPU roundtrip |
| `copyBufferToTexture`       | ✅     | ✅ \*  | Copy a buffer to a texture without CPU roundtrip      |
| `copyTextureToBuffer`       | ✅     | ✅ \*  | Copy a buffer to a texture without CPU roundtrip      |

Remarks:

- The `mapAndWriteAsync()` API is available on WebGL2, however a temporary buffer is created. For optimal performance, applications may want to use `write()` on WebGL2.
- The `mapAndReadAsync()` API is available on WebGL2, however the data is actually copied. The `lifetime` callback parameter indicates whether the `ArrayBuffer` can be retained.
- Asynchronous buffer reads are emulated on WebGL2. The actual reads are still synchronous under the hood.
- A WebGL extension does exist that enables asynchronous buffer reads, but it is not implemented on MacOS which is the primary development environment for luma.gl.
- On WebGPU, buffer-to-texture and texture-to-buffer copies use linear buffer layouts, so `bytesPerRow` must satisfy WebGPU's row-alignment rules (typically a multiple of `256`). Packed CPU-side data should use `Texture.writeData()` instead of a buffer copy path.
- On WebGL, copy commands are best-effort compatibility operations. They are portable, but they do not imply WebGPU-style deferred command recording for rendering.
