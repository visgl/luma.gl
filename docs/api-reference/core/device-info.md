# DeviceInfo

[luma](https://luma.gl/docs/api-reference/core/luma.md)[Adapter](https://luma.gl/docs/api-reference/core/adapter.md)[Device](https://luma.gl/docs/api-reference/core/device.md)[DeviceInfo](https://luma.gl/docs/api-reference/core/device-info.md)[DeviceLimits](https://luma.gl/docs/api-reference/core/device-limits.md)[DeviceFeatures](https://luma.gl/docs/api-reference/core/device-features.md)

The `device.info` field holds a small `DeviceInfo` object that provides information about the device, such as driver, GPU, shading language etc.

## Usage[​](#usage "Direct link to Usage")

```
import {Device} from '@luma.gl/core';



const device: Device = ...;

console.log(device.info);

if (device.info.gpu === 'nvidia') {

   ...

}
```

## Device[​](#device "Direct link to Device")

| Field                    | WebGPU<br />max | WebGPU<br />core | WebGPU<br />compat | WebGL2 | Description                                                |
| ------------------------ | --------------- | ---------------- | ------------------ | ------ | ---------------------------------------------------------- |
| `type`                   | `N/A`           | `N/A`            | `N/A`              | `N/A`  | Device type `webgpu`, `webgl`, `null` or `unknown`         |
| `featureLevel`           | `N/A`           | `N/A`            | `N/A`              | `N/A`  | Effective WebGPU feature level                             |
| `vendor`                 | `N/A`           | `N/A`            | `N/A`              | `N/A`  | GPU vendor                                                 |
| `renderer`               | `N/A`           | `N/A`            | `N/A`              | `N/A`  | GPU Driver                                                 |
| `version`                | `N/A`           | `N/A`            | `N/A`              | `N/A`  | Driver version                                             |
| `gpu`                    | `N/A`           | `N/A`            | `N/A`              | `N/A`  | `apple`, `intel`, `nvidia`, `amd`, `software` or `unknown` |
| `gpuType`                | `N/A`           | `N/A`            | `N/A`              | `N/A`  | `discrete`, `integrated`, `cpu` or `unknown`               |
| `gpuBackend`             | `N/A`           | `N/A`            | `N/A`              | `N/A`  | `metal`, `opengl`, `vulkan`, `d3d12`, ... or `unknown`     |
| `gpuArchitecture`        | `N/A`           | `N/A`            | `N/A`              | `N/A`  | `common-3` on Apple                                        |
| `subgroupMinSize`        | `N/A`           | `N/A`            | `N/A`              | `N/A`  | Minimum WebGPU subgroup size, when reported                |
| `subgroupMaxSize`        | `N/A`           | `N/A`            | `N/A`              | `N/A`  | Maximum WebGPU subgroup size, when reported                |
| `shadingLanguage`        | `N/A`           | `N/A`            | `N/A`              | `N/A`  | Shading language `wgsl`, `glsl`                            |
| `shadingLanguageVersion` | `N/A`           | `N/A`            | `N/A`              | `N/A`  | Shading language version GLSL 3.00 = 300, WGSL 1.00 = 100) |

* Note that the Chrome browser only exposes limited device information by default. Set the <chrome://flags/#enable-webgpu-developer-features> flag to see more WebGPU info.
