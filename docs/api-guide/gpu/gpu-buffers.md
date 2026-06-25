import {Limit as L} from '@site/src/react-luma';
import {GpuMemoryDocsTabs} from '@site/src/components/docs/gpu-memory-docs-tabs';

# Using GPU Buffers

<GpuMemoryDocsTabs active="gpu-buffers" />

See also [Issuing GPU Commands](/docs/api-guide/gpu/gpu-commands) for guidance on when buffer operations should use immediate resource helpers versus explicit command encoding.

## Buffer-Relevant Limits

`device.limits` exposes the main caps that influence buffer sizing, GPU data
representation, and binding pressure.

| Limit | WebGPU<br />max | WebGPU<br />core | WebGPU<br />compat | WebGL2 | Why it matters |
| --- | --- | --- | --- | --- | --- |
| `maxBufferSize` | <L d="webgpu-max" f="maxBufferSize" /> | <L d="webgpu-core" f="maxBufferSize" /> | <L d="webgpu-compatibility" f="maxBufferSize" /> | <L d="webgl" f="maxBufferSize" /> | Upper bound for one GPU buffer allocation. |
| `maxUniformBufferBindingSize` | <L d="webgpu-max" f="maxUniformBufferBindingSize" /> | <L d="webgpu-core" f="maxUniformBufferBindingSize" /> | <L d="webgpu-compatibility" f="maxUniformBufferBindingSize" /> | <L d="webgl" f="maxUniformBufferBindingSize" /> | Maximum bytes visible through one uniform-buffer binding. |
| `maxStorageBufferBindingSize` | <L d="webgpu-max" f="maxStorageBufferBindingSize" /> | <L d="webgpu-core" f="maxStorageBufferBindingSize" /> | <L d="webgpu-compatibility" f="maxStorageBufferBindingSize" /> | <L d="webgl" f="maxStorageBufferBindingSize" /> | Maximum bytes visible through one storage-buffer binding. |
| `maxVertexBuffers` | <L d="webgpu-max" f="maxVertexBuffers" /> | <L d="webgpu-core" f="maxVertexBuffers" /> | <L d="webgpu-compatibility" f="maxVertexBuffers" /> | <L d="webgl" f="maxVertexBuffers" /> | Total vertex-buffer bindings available to a render pipeline. |
| `maxVertexAttributes` | <L d="webgpu-max" f="maxVertexAttributes" /> | <L d="webgpu-core" f="maxVertexAttributes" /> | <L d="webgpu-compatibility" f="maxVertexAttributes" /> | <L d="webgl" f="maxVertexAttributes" /> | Total shader vertex attributes available. |
| `maxUniformBuffersPerShaderStage` | <L d="webgpu-max" f="maxUniformBuffersPerShaderStage" /> | <L d="webgpu-core" f="maxUniformBuffersPerShaderStage" /> | <L d="webgpu-compatibility" f="maxUniformBuffersPerShaderStage" /> | <L d="webgl" f="maxUniformBuffersPerShaderStage" /> | Uniform-buffer binding pressure within one shader stage. |
| `maxStorageBuffersPerShaderStage` | <L d="webgpu-max" f="maxStorageBuffersPerShaderStage" /> | <L d="webgpu-core" f="maxStorageBuffersPerShaderStage" /> | <L d="webgpu-compatibility" f="maxStorageBuffersPerShaderStage" /> | <L d="webgl" f="maxStorageBuffersPerShaderStage" /> | Storage-buffer binding pressure within one shader stage. |
| `maxStorageBuffersInVertexStage` | <L d="webgpu-max" f="maxStorageBuffersInVertexStage" /> | <L d="webgpu-core" f="maxStorageBuffersInVertexStage" /> | <L d="webgpu-compatibility" f="maxStorageBuffersInVertexStage" /> | <L d="webgl" f="maxStorageBuffersInVertexStage" /> | Storage-buffer binding pressure available to vertex shaders. |
| `maxBindingsPerBindGroup` | <L d="webgpu-max" f="maxBindingsPerBindGroup" /> | <L d="webgpu-core" f="maxBindingsPerBindGroup" /> | <L d="webgpu-compatibility" f="maxBindingsPerBindGroup" /> | <L d="webgl" f="maxBindingsPerBindGroup" /> | Total bindings available inside one WebGPU bind group. |
| `maxBindGroupsPlusVertexBuffers` | <L d="webgpu-max" f="maxBindGroupsPlusVertexBuffers" /> | <L d="webgpu-core" f="maxBindGroupsPlusVertexBuffers" /> | <L d="webgpu-compatibility" f="maxBindGroupsPlusVertexBuffers" /> | <L d="webgl" f="maxBindGroupsPlusVertexBuffers" /> | Combined WebGPU pressure across bind groups and vertex buffers. |

See [Device Limits](/docs/api-reference/core/device-limits) for the complete
portable limit surface.

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
