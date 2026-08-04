# DeviceLimits

[luma](https://luma.gl/next/docs/api-reference/core/luma.md)[Adapter](https://luma.gl/next/docs/api-reference/core/adapter.md)[Device](https://luma.gl/next/docs/api-reference/core/device.md)[DeviceInfo](https://luma.gl/next/docs/api-reference/core/device-info.md)[DeviceLimits](https://luma.gl/next/docs/api-reference/core/device-limits.md)[DeviceFeatures](https://luma.gl/next/docs/api-reference/core/device-features.md)

The `device.limits` field contains limits object that indicates what the current platform supports.

## Background[​](#background "Direct link to Background")

Each platform (GPU, driver, browser etc) has different limitations. To avoid limiting applications to a common minimal set of limits, the device limits API lets the application discover what the current platform supports.

## Usage[​](#usage "Direct link to Usage")

Access the current `Device` limits using the `device.limits` field

```
import type {DeviceLimits} from '@luma.gl/core';

import {Device} from '@luma.gl/core';



const limits: DeviceLimits = device.limits;

console.log(limits);

if (limits.maxTextureDimension2D > 2048) {

   ...

}
```

## DeviceLimits[​](#devicelimits-1 "Direct link to DeviceLimits")

The stage-specific storage limits matter when an application wants to read storage resources from a vertex or fragment shader. A WebGPU core device can report `0` for vertex-stage storage buffers, so storage-backed vertex rendering should check `maxStorageBuffersInVertexStage` before choosing that path. For assembled WGSL, see the [WGSL Support](https://luma.gl/next/docs/api-reference/shadertools/wgsl-support.md) platform define for the same decision in shader source.

| Limit                                       | WebGPU<br />max | WebGPU<br />core | WebGPU<br />compat | WebGL2 | WebGL parameter                                                                                               |
| ------------------------------------------- | --------------- | ---------------- | ------------------ | ------ | ------------------------------------------------------------------------------------------------------------- |
| `maxTextureDimension1D`                     | `N/A`           | `N/A`            | `N/A`              | `N/A`  | WebGL2 does not support 1D textures                                                                           |
| `maxTextureDimension2D`                     | `N/A`           | `N/A`            | `N/A`              | `N/A`  | `GL.MAX_TEXTURE_SIZE`                                                                                         |
| `maxTextureDimension3D`                     | `N/A`           | `N/A`            | `N/A`              | `N/A`  | `GL.MAX_3D_TEXTURE_SIZE`                                                                                      |
| `maxTextureArrayLayers`                     | `N/A`           | `N/A`            | `N/A`              | `N/A`  | `GL.MAX_ARRAY_TEXTURE_LAYERS`                                                                                 |
| `maxBindGroups`                             | `N/A`           | `N/A`            | `N/A`              | `N/A`  | WebGL2 has no bind groups                                                                                     |
| `maxBindGroupsPlusVertexBuffers`            | `N/A`           | `N/A`            | `N/A`              | `N/A`  | WebGPU only                                                                                                   |
| `maxBindingsPerBindGroup`                   | `N/A`           | `N/A`            | `N/A`              | `N/A`  | WebGPU only                                                                                                   |
| `maxDynamicUniformBuffersPerPipelineLayout` | `N/A`           | `N/A`            | `N/A`              | `N/A`  | WebGPU only                                                                                                   |
| `maxDynamicStorageBuffersPerPipelineLayout` | `N/A`           | `N/A`            | `N/A`              | `N/A`  | WebGL2 has no storage buffers                                                                                 |
| `maxSampledTexturesPerShaderStage`          | `N/A`           | `N/A`            | `N/A`              | `N/A`  | `GL.MAX_VERTEX_TEXTURE_IMAGE_UNITS`                                                                           |
| `maxSamplersPerShaderStage`                 | `N/A`           | `N/A`            | `N/A`              | `N/A`  | `GL.MAX_COMBINED_TEXTURE_IMAGE_UNITS`                                                                         |
| `maxStorageBuffersPerShaderStage`           | `N/A`           | `N/A`            | `N/A`              | `N/A`  | WebGL2 has no storage buffers                                                                                 |
| `maxStorageBuffersInVertexStage`            | `N/A`           | `N/A`            | `N/A`              | `N/A`  | WebGL2 has no storage buffers                                                                                 |
| `maxStorageBuffersInFragmentStage`          | `N/A`           | `N/A`            | `N/A`              | `N/A`  | WebGL2 has no storage buffers                                                                                 |
| `maxStorageTexturesPerShaderStage`          | `N/A`           | `N/A`            | `N/A`              | `N/A`  | WebGL2 has no storage buffers                                                                                 |
| `maxStorageTexturesInVertexStage`           | `N/A`           | `N/A`            | `N/A`              | `N/A`  | WebGL2 has no storage textures                                                                                |
| `maxStorageTexturesInFragmentStage`         | `N/A`           | `N/A`            | `N/A`              | `N/A`  | WebGL2 has no storage textures                                                                                |
| `maxUniformBuffersPerShaderStage`           | `N/A`           | `N/A`            | `N/A`              | `N/A`  | `GL.MAX_UNIFORM_BUFFER_BINDINGS`                                                                              |
| `maxUniformBufferBindingSize`               | `N/A`           | `N/A`            | `N/A`              | `N/A`  | `GL.MAX_UNIFORM_BLOCK_SIZE`                                                                                   |
| `maxStorageBufferBindingSize`               | `N/A`           | `N/A`            | `N/A`              | `N/A`  | WebGL2 has no storage buffers                                                                                 |
| `maxBufferSize`                             | `N/A`           | `N/A`            | `N/A`              | `N/A`  | WebGPU reports the requested device limit; WebGL2 uses `Number.MAX_SAFE_INTEGER` as an unknown-limit sentinel |
| `minUniformBufferOffsetAlignment`           | `N/A`           | `N/A`            | `N/A`              | `N/A`  | `GL.UNIFORM_BUFFER_OFFSET_ALIGNMENT`                                                                          |
| `minStorageBufferOffsetAlignment`           | `N/A`           | `N/A`            | `N/A`              | `N/A`  | WebGPU only                                                                                                   |
| `maxVertexBuffers`                          | `N/A`           | `N/A`            | `N/A`              | `N/A`  | See [WebGPU issue](https://github.com/gpuweb/gpuweb/issues/4284)                                              |
| `maxVertexAttributes`                       | `N/A`           | `N/A`            | `N/A`              | `N/A`  | `GL.MAX_VERTEX_ATTRIBS`                                                                                       |
| `maxVertexBufferArrayStride`                | `N/A`           | `N/A`            | `N/A`              | `N/A`  | Can't be reliably determined on WebGL                                                                         |
| `maxInterStageShaderVariables`              | `N/A`           | `N/A`            | `N/A`              | `N/A`  | `GL.MAX_VARYING_COMPONENTS`                                                                                   |
| `maxColorAttachments`                       | `N/A`           | `N/A`            | `N/A`              | `N/A`  | `GL.MAX_COLOR_ATTACHMENTS`                                                                                    |
| `maxColorAttachmentBytesPerSample`          | `N/A`           | `N/A`            | `N/A`              | `N/A`  | WebGPU only                                                                                                   |
| `maxComputeWorkgroupStorageSize`            | `N/A`           | `N/A`            | `N/A`              | `N/A`  | WebGL2 has no compute shaders                                                                                 |
| `maxComputeInvocationsPerWorkgroup`         | `N/A`           | `N/A`            | `N/A`              | `N/A`  | WebGL2 has no compute shaders                                                                                 |
| `maxComputeWorkgroupSizeX`                  | `N/A`           | `N/A`            | `N/A`              | `N/A`  | WebGL2 has no compute shaders                                                                                 |
| `maxComputeWorkgroupSizeY`                  | `N/A`           | `N/A`            | `N/A`              | `N/A`  | WebGL2 has no compute shaders                                                                                 |
| `maxComputeWorkgroupSizeZ`                  | `N/A`           | `N/A`            | `N/A`              | `N/A`  | WebGL2 has no compute shaders                                                                                 |
| `maxComputeWorkgroupsPerDimension`          | `N/A`           | `N/A`            | `N/A`              | `N/A`  | WebGL2 has no compute shaders                                                                                 |

* Given that queries to driver and GPU are typically expensive in WebGL, the Device will cache any queried limits.
