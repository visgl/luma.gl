# Using GPU Buffers

[GPU Memory](https://luma.gl/docs/api-guide/gpu/gpu-memory.md)[GPU Buffers](https://luma.gl/docs/api-guide/gpu/gpu-buffers.md)[Memory Layouts](https://luma.gl/docs/api-guide/gpu/gpu-memory-layouts.md)[Storage Buffers](https://luma.gl/docs/api-guide/gpu/gpu-storage-buffers.md)

See also [Issuing GPU Commands](https://luma.gl/docs/api-guide/gpu/gpu-commands.md) for guidance on when buffer operations should use immediate resource helpers versus explicit command encoding.

## Buffer-Relevant Limits[​](#buffer-relevant-limits "Direct link to Buffer-Relevant Limits")

`device.limits` exposes the main caps that influence buffer sizing, GPU data representation, and binding pressure.

| Limit                             | WebGPU<br />max | WebGPU<br />core | WebGPU<br />compat | WebGL2 | Why it matters                                                  |
| --------------------------------- | --------------- | ---------------- | ------------------ | ------ | --------------------------------------------------------------- |
| `maxBufferSize`                   | `N/A`           | `N/A`            | `N/A`              | `N/A`  | Upper bound for one GPU buffer allocation.                      |
| `maxUniformBufferBindingSize`     | `N/A`           | `N/A`            | `N/A`              | `N/A`  | Maximum bytes visible through one uniform-buffer binding.       |
| `maxStorageBufferBindingSize`     | `N/A`           | `N/A`            | `N/A`              | `N/A`  | Maximum bytes visible through one storage-buffer binding.       |
| `maxVertexBuffers`                | `N/A`           | `N/A`            | `N/A`              | `N/A`  | Total vertex-buffer bindings available to a render pipeline.    |
| `maxVertexAttributes`             | `N/A`           | `N/A`            | `N/A`              | `N/A`  | Total shader vertex attributes available.                       |
| `maxUniformBuffersPerShaderStage` | `N/A`           | `N/A`            | `N/A`              | `N/A`  | Uniform-buffer binding pressure within one shader stage.        |
| `maxStorageBuffersPerShaderStage` | `N/A`           | `N/A`            | `N/A`              | `N/A`  | Storage-buffer binding pressure within one shader stage.        |
| `maxStorageBuffersInVertexStage`  | `N/A`           | `N/A`            | `N/A`              | `N/A`  | Storage-buffer binding pressure available to vertex shaders.    |
| `maxBindingsPerBindGroup`         | `N/A`           | `N/A`            | `N/A`              | `N/A`  | Total bindings available inside one WebGPU bind group.          |
| `maxBindGroupsPlusVertexBuffers`  | `N/A`           | `N/A`            | `N/A`              | `N/A`  | Combined WebGPU pressure across bind groups and vertex buffers. |

See [Device Limits](https://luma.gl/docs/api-reference/core/device-limits.md) for the complete portable limit surface.

## Buffer Operations[​](#buffer-operations "Direct link to Buffer Operations")

The ability to copy memory between CPU, buffers and textures

| Dimension                   | WebGPU | WebGL2 | Description                                           |
| --------------------------- | ------ | ------ | ----------------------------------------------------- |
| `Buffer.write()`            | ✅     | ✅     | Write a buffer synchronously                          |
| `Buffer.mapAndWriteAsync()` | ✅     | ✅ \*  | Write a buffer synchronously                          |
| `Buffer.readAsync()`        | ✅     | ✅ \*  | Read a buffer asynchronously without copy.            |
| `Buffer.mapAndReadAsync()`  | ✅     | ✅ \*  | Read a buffer asynchronously                          |
| `Buffer.readSyncWebGL()`    | ❌     | ✅     | Read a buffer synchronously                           |
| `copyBufferToBuffer`        | ✅     | ✅     | Copy a buffer to another buffer without CPU roundtrip |
| `copyBufferToTexture`       | ✅     | ✅ \*  | Copy a buffer to a texture without CPU roundtrip      |
| `copyTextureToBuffer`       | ✅     | ✅ \*  | Copy a buffer to a texture without CPU roundtrip      |

Remarks:

* The `mapAndWriteAsync()` API is available on WebGL2, however a temporary buffer is created. For optimal performance, applications may want to use `write()` on WebGL2.
* The `mapAndReadAsync()` API is available on WebGL2, however the data is actually copied. The `lifetime` callback parameter indicates whether the `ArrayBuffer` can be retained.
* Asynchronous buffer reads are emulated on WebGL2. The actual reads are still synchronous under the hood.
* A WebGL extension does exist that enables asynchronous buffer reads, but it is not implemented on MacOS which is the primary development environment for luma.gl.
* On WebGPU, buffer-to-texture and texture-to-buffer copies use linear buffer layouts, so `bytesPerRow` must satisfy WebGPU's row-alignment rules (typically a multiple of `256`). Packed CPU-side data should use `Texture.writeData()` instead of a buffer copy path.
* On WebGL, copy commands are best-effort compatibility operations. They are portable, but they do not imply WebGPU-style deferred command recording for rendering.
