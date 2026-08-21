# Type Alias: RenderPipelineProps

> **RenderPipelineProps** = [`ResourceProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/ResourceProps.md) & `object`

Defined in: [modules/core/src/adapter/resources/render-pipeline.ts:20](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pipeline.ts#L20)

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### \_sharedRenderPipeline?[​](#_sharedrenderpipeline "Direct link to _sharedRenderPipeline?")

> `optional` **\_sharedRenderPipeline?**: [`SharedRenderPipeline`](https://luma.gl/docs/api-reference/generated/core/classes/SharedRenderPipeline.md)

Internal hook for backend-specific shared pipeline implementations.

### ~~bindGroups?~~[​](#bindgroups "Direct link to bindgroups")

> `optional` **bindGroups?**: [`BindingsByGroup`](https://luma.gl/docs/api-reference/generated/core/type-aliases/BindingsByGroup.md)

#### Deprecated[​](#deprecated "Direct link to Deprecated")

Set bindings on RenderPass instead. Will be removed in the next major release.

### ~~bindings?~~[​](#bindings "Direct link to bindings")

> `optional` **bindings?**: [`Bindings`](https://luma.gl/docs/api-reference/generated/core/type-aliases/Bindings.md)

#### Deprecated[​](#deprecated-1 "Direct link to Deprecated")

Set bindings on RenderPass instead. Will be removed in the next major release.

### bufferLayout?[​](#bufferlayout "Direct link to bufferLayout?")

> `optional` **bufferLayout?**: [`BufferLayout`](https://luma.gl/docs/api-reference/generated/core/type-aliases/BufferLayout.md)\[]

Describes the buffers accepted by this pipeline and how they are mapped to shader attributes.

### bufferMode?[​](#buffermode "Direct link to bufferMode?")

> `optional` **bufferMode?**: `number`

Transform feedback buffer mode used when linking a WebGL render pipeline. WebGL only.

### colorAttachmentFormats?[​](#colorattachmentformats "Direct link to colorAttachmentFormats?")

> `optional` **colorAttachmentFormats?**: ([`TextureFormatColor`](https://luma.gl/docs/api-reference/generated/core/type-aliases/TextureFormatColor.md) | `null`)\[]

Color attachments expected by this pipeline. Defaults to \[device.preferredColorFormat]. Array needs not be contiguous.

### depthStencilAttachmentFormat?[​](#depthstencilattachmentformat "Direct link to depthStencilAttachmentFormat?")

> `optional` **depthStencilAttachmentFormat?**: [`TextureFormatDepthStencil`](https://luma.gl/docs/api-reference/generated/core/type-aliases/TextureFormatDepthStencil.md)

Depth attachment expected by this pipeline. Defaults to device.preferredDepthFormat, if depthWriteEnables parameter is set

### disableWarnings?[​](#disablewarnings "Direct link to disableWarnings?")

> `optional` **disableWarnings?**: `boolean`

Some applications intentionally supply unused attributes and bindings, and want to disable warnings

### fragmentEntryPoint?[​](#fragmententrypoint "Direct link to fragmentEntryPoint?")

> `optional` **fragmentEntryPoint?**: `string`

Name of fragment shader stage main function (defaults to 'main'). WGSL only

### fs?[​](#fs "Direct link to fs?")

> `optional` **fs?**: [`Shader`](https://luma.gl/docs/api-reference/generated/core/classes/Shader.md) | `null`

Compiled fragment shader

### fsConstants?[​](#fsconstants "Direct link to fsConstants?")

> `optional` **fsConstants?**: `Record`<`string`, `number`>

Constant values to apply to compiled fragment shader. Do not require re-compilation. (WGSL only)

### parameters?[​](#parameters "Direct link to parameters?")

> `optional` **parameters?**: [`RenderPipelineParameters`](https://luma.gl/docs/api-reference/generated/core/type-aliases/RenderPipelineParameters.md)

Parameters that are controlled by pipeline

### shaderLayout?[​](#shaderlayout "Direct link to shaderLayout?")

> `optional` **shaderLayout?**: [`ShaderLayout`](https://luma.gl/docs/api-reference/generated/core/type-aliases/ShaderLayout.md) | `null`

Describes the attributes and bindings exposed by the pipeline shader(s).

### topology?[​](#topology "Direct link to topology?")

> `optional` **topology?**: [`PrimitiveTopology`](https://luma.gl/docs/api-reference/generated/core/type-aliases/PrimitiveTopology.md)

Determines how vertices are read from the 'vertex' attributes

### varyings?[​](#varyings "Direct link to varyings?")

> `optional` **varyings?**: `string`\[]

Transform feedback varyings captured when linking a WebGL render pipeline. WebGL only.

### vertexEntryPoint?[​](#vertexentrypoint "Direct link to vertexEntryPoint?")

> `optional` **vertexEntryPoint?**: `string`

Name of vertex shader stage main function (defaults to 'main'). WGSL only

### vs?[​](#vs "Direct link to vs?")

> `optional` **vs?**: [`Shader`](https://luma.gl/docs/api-reference/generated/core/classes/Shader.md) | `null`

Compiled vertex shader

### vsConstants?[​](#vsconstants "Direct link to vsConstants?")

> `optional` **vsConstants?**: `Record`<`string`, `number`>

Constant values to apply to compiled vertex shader. Do not require re-compilation. (WGSL only)
