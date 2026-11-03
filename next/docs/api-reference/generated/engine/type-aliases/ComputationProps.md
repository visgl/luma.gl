# Type Alias: ComputationProps

> **ComputationProps** = `Omit`<`ComputePipelineProps`, `"shader"`> & `object`

Defined in: [modules/engine/src/compute/computation.ts:44](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/computation.ts#L44)

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### bindings?[​](#bindings "Direct link to bindings?")

> `optional` **bindings?**: `Record`<`string`, `Binding`>

Bindings

### debugShaders?[​](#debugshaders "Direct link to debugShaders?")

> `optional` **debugShaders?**: `"never"` | `"errors"` | `"warnings"` | `"always"`

Show shader source in browser?

### defines?[​](#defines "Direct link to defines?")

> `optional` **defines?**: `Record`<`string`, `boolean` | `number`>

Shader boolean or numeric preprocessor defines that configure shader code.

### modules?[​](#modules "Direct link to modules?")

> `optional` **modules?**: `ShaderModule`\[]

Shader modules added to shader code.

### pipelineFactory?[​](#pipelinefactory "Direct link to pipelineFactory?")

> `optional` **pipelineFactory?**: `PipelineFactory`

Factory used to create a ComputePipeline. Defaults to Device default factory.

### plugins?[​](#plugins "Direct link to plugins?")

> `optional` **plugins?**: `ShaderPlugin`\[]

Reusable shader assembly plugins resolved for WGSL compute assembly.

### shaderAssembler?[​](#shaderassembler "Direct link to shaderAssembler?")

> `optional` **shaderAssembler?**: `ShaderAssembler`

WGSL shader assembler. Defaults to the shared WGSL shader assembler.

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
