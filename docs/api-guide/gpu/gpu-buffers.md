# Using GPU Buffers


## Buffer Operations

The ability to copy memory between CPU, buffers and textures

| Dimension             | WebGPU | WebGL2 | Description                                           |
| --------------------- | ------- | ------- | ----------------------------------------------------- |
| `writeBuffer`         | ✅      | ✅      | Read a buffer synchronously                           |
| `readBuffer (sync)`   | ❌      | ✅      | Read a buffer synchronously                           |
| `readBuffer (async)`  | ✅      | ❌ \*   | Read a buffer asynchronously                          |
| `copyBufferToBuffer`  | ✅      | ✅      | Copy a buffer to another buffer without CPU roundtrip |
| `copyBufferToTexture` | ✅      | ✅      | Copy a buffer to a texture without CPU roundtrip      |
| `copyTextureToBuffer` | ✅      | ✅      | Copy a buffer to a texture without CPU roundtrip      |

Remarks:
- A WebGL extension does exist that enables asynchronous buffer reads, but it is not implemented on MacOS which is the primary development environment for luma.gl.
- Asynchronous reads are emulated by luma.gl by providing a Promise style API. The actual reads are still asynchronous though.