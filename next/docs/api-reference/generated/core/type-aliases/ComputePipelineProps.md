# Type Alias: ComputePipelineProps

> **ComputePipelineProps** = [`ResourceProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ResourceProps.md) & `object`

Defined in: [modules/core/src/adapter/resources/compute-pipeline.ts:13](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/compute-pipeline.ts#L13)

Properties for a compute pipeline

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### constants?[​](#constants "Direct link to constants?")

> `optional` **constants?**: `Record`<`string`, `number`>

These are WGSL constant values - different from GLSL defines in that shader does not need to be recompiled

### entryPoint?[​](#entrypoint "Direct link to entryPoint?")

> `optional` **entryPoint?**: `string`

The entry point, defaults to main

### handle?[​](#handle "Direct link to handle?")

> `optional` **handle?**: `unknown`

### shader[​](#shader "Direct link to shader")

> **shader**: [`Shader`](https://luma.gl/next/docs/api-reference/generated/core/classes/Shader.md)

Compiled shader object

### shaderLayout?[​](#shaderlayout "Direct link to shaderLayout?")

> `optional` **shaderLayout?**: [`ComputeShaderLayout`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ComputeShaderLayout.md) | `null`

Describes the attributes and bindings exposed by the pipeline shader(s).
