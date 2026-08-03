# Shader

[Shader](https://luma.gl/next/docs/api-reference/core/resources/shader.md)[RenderPipeline](https://luma.gl/next/docs/api-reference/core/resources/render-pipeline.md)[ComputePipeline](https://luma.gl/next/docs/api-reference/core/resources/compute-pipeline.md)[VertexArray](https://luma.gl/next/docs/api-reference/core/resources/vertex-array.md)[TransformFeedback](https://luma.gl/next/docs/api-reference/core/resources/transform-feedback.md)

The `Shader` class holds a compiled shader.

* It takes shader source code and compiles it during construction.
* Shaders are used as inputs when creating `RenderPipeline` and `ComputePipeline` objects.
* A `Shader` is immutable and the same compiled shader can safely be referenced by many pipelines.

## Usage[​](#usage "Direct link to Usage")

Create a pair of shaders

```
const vs = device.createShader({stage: 'vertex', source});
const fs = device.createShader({stage: 'fragment', source});
```

## Types[​](#types "Direct link to Types")

### ShaderProps[​](#shaderprops "Direct link to ShaderProps")

Properties for a Shader

| Field         | Type                                                   | Description                                    |
| ------------- | ------------------------------------------------------ | ---------------------------------------------- |
| `id`          | `string`                                               | name/identifier (for debugging)                |
| `stage`       | 'vertex' \| 'fragment' \| 'compute'                    | Required by WebGL                              |
| `source`      | `string`                                               | Shader source code                             |
| `sourceMap?`  | `string`                                               | WebGPU only                                    |
| `language?`   | 'glsl' \| 'wgsl'                                       | wgsl in WebGPU only                            |
| `entryPoint?` | `string`                                               | WGSL only, name of main function               |
| `debug`       | `'error'` (default) `'never' \| 'warnings' \| 'always` | Will show a popup in the canvas with error log |

## Members[​](#members "Direct link to Members")

* `device`: `Device` - holds a reference to the
* `handle`: `unknown` - holds the underlying WebGL or WebGPU shader object
* `props`: `ShaderProps` - holds a copy of the `ShaderProps` used to create this `Shader`.

## Methods[​](#methods "Direct link to Methods")

### `constructor(props: ShaderProps)`[​](#constructorprops-shaderprops "Direct link to constructorprops-shaderprops")

`Shader` is an abstract class and cannot be instantiated directly. Create with `device.createShader(...)`.

### `destroy(): void`[​](#destroy-void "Direct link to destroy-void")

Free up any GPU resources associated with this shader immediately (instead of waiting for garbage collection).

### `getInfoLog(): Promise<CompilerMessage[]>`[​](#getinfolog-promisecompilermessage "Direct link to getinfolog-promisecompilermessage")

Returns an array of CompilerMessage entries containing errors and warnings from the compilation.

### `getTranslatedSource(): string | null`[​](#gettranslatedsource-string--null "Direct link to gettranslatedsource-string--null")

On some WebGL 2 systems, it is possible to query the translated shader source in the host platform's native language (HLSL, GLSL, and even GLSL ES).

### `debugShader(trigger?: `'error' | 'never' | 'warnings' | 'always'`): void`[​](#debugshadertrigger-error--never--warnings--always-void "Direct link to debugshadertrigger-error--never--warnings--always-void")

Shows the shader log in a popup in the canvas if the debug condition is met `'error' |\ 'never' \| 'warnings' \| 'always'`. Shows errors inline with the source code. If translated source is available (`getTranslatedSource()`), shows the translated source after the original source. Note that translated source is only available if shader compilation succeeds.

## Performance[​](#performance "Direct link to Performance")

Compiling shaders is usually cheaper than creating complete pipelines, but applications that repeatedly request the same shader source should still prefer [`ShaderFactory`](https://luma.gl/next/docs/api-reference/core/shader-factory.md) over calling `device.createShader()` directly.

## Remarks[​](#remarks "Direct link to Remarks")

* Shader compilation is fairly fast, in particular compared to Pipeline linking.
* In WebGL, checking for shader compile status and pipeline link status is expensive as it forces a GPU sync.
* Therefore checking is not done unless `luma.log.level > 0`. If your program fails to render, please increase the level.
* If the `shader-async-status-webgl` feature is available, WebGL will use async shader compilation and pipeline linking.
