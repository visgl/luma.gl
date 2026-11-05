# Type Alias: GPUVectorModelProps

> **GPUVectorModelProps** = `Omit`<`RenderPipelineProps`, `"vs"` | `"fs"` | `"bindings"`> & `object`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:128](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L128)

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### attributes?[​](#attributes "Direct link to attributes?")

> `optional` **attributes?**: `Record`<`string`, `ModelBuffer`>

Buffer-valued attributes. Dynamic buffers are rebound when resized.

### attributeVectors?[​](#attributevectors "Direct link to attributeVectors?")

> `optional` **attributeVectors?**: [`GPUVectorModelAttributes`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/GPUVectorModelAttributes.md)

Supplemental vertex or instance vectors and constants.

### bindings?[​](#bindings "Direct link to bindings?")

> `optional` **bindings?**: `Record`<`string`, `ModelBinding`>

Shader resource bindings, including dynamic buffers and dynamic textures.

### constantAttributes?[​](#constantattributes "Direct link to constantAttributes?")

> `optional` **constantAttributes?**: `Record`<`string`, `TypedArray`>

### debugShaders?[​](#debugshaders "Direct link to debugShaders?")

> `optional` **debugShaders?**: `"never"` | `"errors"` | `"warnings"` | `"always"`

Show shader source in browser?

### defines?[​](#defines "Direct link to defines?")

> `optional` **defines?**: `Record`<`string`, `boolean` | `number`>

Shader boolean or numeric preprocessor defines that configure shader code.

### disableWarnings?[​](#disablewarnings "Direct link to disableWarnings?")

> `optional` **disableWarnings?**: `boolean`

Some applications intentionally supply unused attributes and bindings, and want to disable warnings

### enforceMatchingVectorLengths?[​](#enforcematchingvectorlengths "Direct link to enforceMatchingVectorLengths?")

> `optional` **enforceMatchingVectorLengths?**: `boolean`

Require aligned lengths and chunks. False requires inferDrawCount: 'no' and single chunks.

### firstIndex?[​](#firstindex "Direct link to firstIndex?")

> `optional` **firstIndex?**: `number`

First index element for WebGPU indexed draws.

### firstVertex?[​](#firstvertex "Direct link to firstVertex?")

> `optional` **firstVertex?**: `number`

First vertex byte offset for WebGL indexed draws or first vertex for non-indexed draws.

### fs?[​](#fs "Direct link to fs?")

> `optional` **fs?**: `string` | `null`

### geometry?[​](#geometry "Direct link to geometry?")

> `optional` **geometry?**: [`GPUVectorGeometry`](https://luma.gl/next/docs/api-reference/generated/engine/classes/GPUVectorGeometry.md) | `null`

GPU-only mesh inputs, indices, and topology.

### indexBuffer?[​](#indexbuffer "Direct link to indexBuffer?")

> `optional` **indexBuffer?**: `ModelBuffer` | `null`

Optional index buffer. Dynamic buffers are rebound when resized.

### indexCount?[​](#indexcount "Direct link to indexCount?")

> `optional` **indexCount?**: `number`

Optional indexed draw count. Defaults to vertexCount, then the full bound index buffer length.

### inferDrawCount?[​](#inferdrawcount "Direct link to inferDrawCount?")

> `optional` **inferDrawCount?**: `"instance"` | `"vertex"` | `"no"`

Count inferred from vector rows or each explicit batch. `no` preserves both counts.

#### Default[​](#default "Direct link to Default")

```
'no'
```

### instanceCount?[​](#instancecount "Direct link to instanceCount?")

> `optional` **instanceCount?**: `number`

instance count

### ~~isInstanced?~~[​](#isinstanced "Direct link to isinstanced")

> `optional` **isInstanced?**: `boolean`

#### Deprecated[​](#deprecated "Direct link to Deprecated")

Use instanced rendering? Will be auto-detected in 9.1

### modules?[​](#modules "Direct link to modules?")

> `optional` **modules?**: `ShaderModule`<`any`, `any`, `any`>\[]

Shader modules added to shader code.

### parameters?[​](#parameters "Direct link to parameters?")

> `optional` **parameters?**: `RenderPipelineParameters`

Parameters that are built into the pipeline

### pipelineFactory?[​](#pipelinefactory "Direct link to pipelineFactory?")

> `optional` **pipelineFactory?**: `PipelineFactory`

Factory used to create a RenderPipeline. Defaults to Device default factory.

### plugins?[​](#plugins "Direct link to plugins?")

> `optional` **plugins?**: `ShaderPlugin`\[]

Reusable shader assembly plugins resolved for the active GLSL or WGSL backend.

### shaderAssembler?[​](#shaderassembler "Direct link to shaderAssembler?")

> `optional` **shaderAssembler?**: `ShaderAssembler`

Shader assembler. Defaults to the shared assembler for the device's shader language.

### shaderFactory?[​](#shaderfactory "Direct link to shaderFactory?")

> `optional` **shaderFactory?**: `ShaderFactory`

Factory used to create a Shader. Defaults to Device default factory.

### shaderInputs?[​](#shaderinputs "Direct link to shaderInputs?")

> `optional` **shaderInputs?**: [`ShaderInputs`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderInputs.md)

Shader inputs, used to generate uniform buffers and bindings.

### source?[​](#source "Direct link to source?")

> `optional` **source?**: `string`

### sourceLanguage?[​](#sourcelanguage "Direct link to sourceLanguage?")

> `optional` **sourceLanguage?**: `string`

Input language compiled by the application-registered shader assembler transpiler.

### transformFeedback?[​](#transformfeedback "Direct link to transformFeedback?")

> `optional` **transformFeedback?**: `TransformFeedback`

### uniforms?[​](#uniforms "Direct link to uniforms?")

> `optional` **uniforms?**: `Record`<`string`, `unknown`>

WebGL-only uniforms

### vertexCount?[​](#vertexcount "Direct link to vertexCount?")

> `optional` **vertexCount?**: `number`

Vertex count

### vs?[​](#vs "Direct link to vs?")

> `optional` **vs?**: `string` | `null`
