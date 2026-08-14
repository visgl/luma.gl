# Type Alias: DeviceInfo

> **DeviceInfo** = `object`

Defined in: [modules/core/src/adapter/device.ts:52](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L52)

Identifies the GPU vendor and driver.

## Note[​](#note "Direct link to Note")

Chrome WebGPU does not provide much information, though more can be enabled with

## See[​](#see "Direct link to See")

<https://developer.chrome.com/blog/new-in-webgpu-120#adapter_information_updates> chrome://flags/#enable-webgpu-developer-features

## Properties[​](#properties "Direct link to Properties")

### fallback?[​](#fallback "Direct link to fallback?")

> `optional` **fallback?**: `boolean`

Defined in: [modules/core/src/adapter/device.ts:70](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L70)

If this is a fallback adapter

***

### featureLevel?[​](#featurelevel "Direct link to featureLevel?")

> `optional` **featureLevel?**: [`WebGPUDeviceFeatureLevel`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/WebGPUDeviceFeatureLevel.md)

Defined in: [modules/core/src/adapter/device.ts:72](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L72)

Effective WebGPU feature level used to create this device. Undefined for non-WebGPU devices.

***

### gpu[​](#gpu "Direct link to gpu")

> **gpu**: `"nvidia"` | `"amd"` | `"intel"` | `"apple"` | `"software"` | `"unknown"`

Defined in: [modules/core/src/adapter/device.ts:62](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L62)

family of GPU

***

### gpuArchitecture?[​](#gpuarchitecture "Direct link to gpuArchitecture?")

> `optional` **gpuArchitecture?**: `string`

Defined in: [modules/core/src/adapter/device.ts:66](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L66)

GPU architecture

***

### gpuBackend?[​](#gpubackend "Direct link to gpuBackend?")

> `optional` **gpuBackend?**: `"opengl"` | `"opengles"` | `"metal"` | `"d3d11"` | `"d3d12"` | `"vulkan"` | `"unknown"`

Defined in: [modules/core/src/adapter/device.ts:68](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L68)

GPU driver backend. Can sometimes be sniffed

***

### gpuType[​](#gputype "Direct link to gpuType")

> **gpuType**: `"discrete"` | `"integrated"` | `"cpu"` | `"unknown"`

Defined in: [modules/core/src/adapter/device.ts:64](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L64)

Type of GPU ()

***

### renderer[​](#renderer "Direct link to renderer")

> **renderer**: `string`

Defined in: [modules/core/src/adapter/device.ts:58](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L58)

Renderer (usually driver name)

***

### shadingLanguage[​](#shadinglanguage "Direct link to shadingLanguage")

> **shadingLanguage**: `"wgsl"` | `"glsl"`

Defined in: [modules/core/src/adapter/device.ts:78](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L78)

Shader language supported by device.createShader()

***

### shadingLanguageVersion[​](#shadinglanguageversion "Direct link to shadingLanguageVersion")

> **shadingLanguageVersion**: `number`

Defined in: [modules/core/src/adapter/device.ts:80](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L80)

Highest supported shader language version: GLSL 3.00 = 300, WGSL 1.00 = 100

***

### subgroupMaxSize?[​](#subgroupmaxsize "Direct link to subgroupMaxSize?")

> `optional` **subgroupMaxSize?**: `number`

Defined in: [modules/core/src/adapter/device.ts:76](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L76)

Maximum subgroup size reported by a WebGPU adapter, when available.

***

### subgroupMinSize?[​](#subgroupminsize "Direct link to subgroupMinSize?")

> `optional` **subgroupMinSize?**: `number`

Defined in: [modules/core/src/adapter/device.ts:74](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L74)

Minimum subgroup size reported by a WebGPU adapter, when available.

***

### type[​](#type "Direct link to type")

> **type**: `"webgl"` | `"webgpu"` | `"null"` | `"unknown"`

Defined in: [modules/core/src/adapter/device.ts:54](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L54)

Type of device

***

### vendor[​](#vendor "Direct link to vendor")

> **vendor**: `string`

Defined in: [modules/core/src/adapter/device.ts:56](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L56)

Vendor (name of GPU vendor, Apple, nVidia etc

***

### version[​](#version "Direct link to version")

> **version**: `string`

Defined in: [modules/core/src/adapter/device.ts:60](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L60)

version of driver
