# Using GPU Buffers

See also [GPU Commands](/docs/api-guide/gpu/gpu-commands) for guidance on when buffer operations should use immediate resource helpers versus explicit command encoding.

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
