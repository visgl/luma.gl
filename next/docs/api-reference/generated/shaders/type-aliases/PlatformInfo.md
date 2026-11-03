# Type Alias: PlatformInfo

> **PlatformInfo** = `object`

Defined in: [lib/shader-assembly/platform-info.ts:10](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/platform-info.ts#L10)

PlatformInfo

## Note[​](#note "Direct link to Note")

Designed so that it can be easily created from a luma.gl Device instance Without having any actual dependency on `@luma.gl/core`

## Properties[​](#properties "Direct link to Properties")

### features[​](#features "Direct link to features")

> **features**: `Set`<`string`>

Defined in: [lib/shader-assembly/platform-info.ts:22](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/platform-info.ts#L22)

Feature strings for feature detection

***

### gpu[​](#gpu "Direct link to gpu")

> **gpu**: `string`

Defined in: [lib/shader-assembly/platform-info.ts:18](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/platform-info.ts#L18)

string identifying current GPU

***

### limits?[​](#limits "Direct link to limits?")

> `optional` **limits?**: `Record`<`string`, `number` | `undefined`>

Defined in: [lib/shader-assembly/platform-info.ts:20](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/platform-info.ts#L20)

Device limits exposed to shader preprocessing decisions such as platform capability defines.

***

### shaderLanguage[​](#shaderlanguage "Direct link to shaderLanguage")

> **shaderLanguage**: `"glsl"` | `"wgsl"`

Defined in: [lib/shader-assembly/platform-info.ts:14](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/platform-info.ts#L14)

Which shader language is supported

***

### shaderLanguageVersion[​](#shaderlanguageversion "Direct link to shaderLanguageVersion")

> **shaderLanguageVersion**: `100` | `300`

Defined in: [lib/shader-assembly/platform-info.ts:16](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/platform-info.ts#L16)

Which shader language version is preferred

***

### type[​](#type "Direct link to type")

> **type**: `"webgl"` | `"webgpu"` | `"null"` | `"unknown"`

Defined in: [lib/shader-assembly/platform-info.ts:12](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/platform-info.ts#L12)

Current Web GPU API backend
