# Type Alias: DeviceInfo

> **DeviceInfo** = `object`

Defined in: [modules/core/src/adapter/device.ts:49](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L49)

Identifies the GPU vendor and driver.

## Note[​](#note "Direct link to Note")

Chrome WebGPU does not provide much information, though more can be enabled with

## See[​](#see "Direct link to See")

<https://developer.chrome.com/blog/new-in-webgpu-120#adapter_information_updates> chrome://flags/#enable-webgpu-developer-features

## Properties[​](#properties "Direct link to Properties")

### fallback?[​](#fallback "Direct link to fallback?")

> `optional` **fallback?**: `boolean`

Defined in: [modules/core/src/adapter/device.ts:67](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L67)

If this is a fallback adapter

***

### featureLevel?[​](#featurelevel "Direct link to featureLevel?")

> `optional` **featureLevel?**: [`WebGPUDeviceFeatureLevel`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/WebGPUDeviceFeatureLevel.md)

Defined in: [modules/core/src/adapter/device.ts:69](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L69)

Effective WebGPU feature level used to create this device. Undefined for non-WebGPU devices.

***

### gpu[​](#gpu "Direct link to gpu")

> **gpu**: `"nvidia"` | `"amd"` | `"intel"` | `"apple"` | `"software"` | `"unknown"`

Defined in: [modules/core/src/adapter/device.ts:59](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L59)

family of GPU

***

### gpuArchitecture?[​](#gpuarchitecture "Direct link to gpuArchitecture?")

> `optional` **gpuArchitecture?**: `string`

Defined in: [modules/core/src/adapter/device.ts:63](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L63)

GPU architecture

***

### gpuBackend?[​](#gpubackend "Direct link to gpuBackend?")

> `optional` **gpuBackend?**: `"opengl"` | `"opengles"` | `"metal"` | `"d3d11"` | `"d3d12"` | `"vulkan"` | `"unknown"`

Defined in: [modules/core/src/adapter/device.ts:65](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L65)

GPU driver backend. Can sometimes be sniffed

***

### gpuType[​](#gputype "Direct link to gpuType")

> **gpuType**: `"discrete"` | `"integrated"` | `"cpu"` | `"unknown"`

Defined in: [modules/core/src/adapter/device.ts:61](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L61)

Type of GPU ()

***

### renderer[​](#renderer "Direct link to renderer")

> **renderer**: `string`

Defined in: [modules/core/src/adapter/device.ts:55](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L55)

Renderer (usually driver name)

***

### shadingLanguage[​](#shadinglanguage "Direct link to shadingLanguage")

> **shadingLanguage**: `"wgsl"` | `"glsl"`

Defined in: [modules/core/src/adapter/device.ts:71](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L71)

Shader language supported by device.createShader()

***

### shadingLanguageVersion[​](#shadinglanguageversion "Direct link to shadingLanguageVersion")

> **shadingLanguageVersion**: `number`

Defined in: [modules/core/src/adapter/device.ts:73](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L73)

Highest supported shader language version: GLSL 3.00 = 300, WGSL 1.00 = 100

***

### type[​](#type "Direct link to type")

> **type**: `"webgl"` | `"webgpu"` | `"null"` | `"unknown"`

Defined in: [modules/core/src/adapter/device.ts:51](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L51)

Type of device

***

### vendor[​](#vendor "Direct link to vendor")

> **vendor**: `string`

Defined in: [modules/core/src/adapter/device.ts:53](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L53)

Vendor (name of GPU vendor, Apple, nVidia etc

***

### version[​](#version "Direct link to version")

> **version**: `string`

Defined in: [modules/core/src/adapter/device.ts:57](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L57)

version of driver
