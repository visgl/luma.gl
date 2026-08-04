# Type Alias: ShaderLayout

> **ShaderLayout** = `object`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:38](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L38)

Describes all shader binding points for a `RenderPipeline` or `ComputePipeline` A ShaderLayout describes the static structure of a shader pipeline. It also allows the numeric locations in the shader to accessed with the same variable names used in the shader.

## Note[​](#note "Direct link to Note")

A ShaderLayout needs to be complemented by a BufferLayout that describes the actual memory layout of the buffers that will be used with the pipeline.

## Example[​](#example "Direct link to Example")

```
 device.createRenderPipeline({

   shaderLayout: [

     attributes: [

       {name: 'instancePositions', location: 0, format: 'vec3<f32>', stepMode: 'instance'},

       {name: 'instanceVelocities', location: 1, format: 'vec3<f32>', stepMode: 'instance'},

       {name: 'vertexPositions', location: 2, format: 'vec3<f32>', stepMode: 'vertex'}

     ],

     bindings: [...]

   ]

 })
```

## Properties[​](#properties "Direct link to Properties")

### attributes[​](#attributes "Direct link to attributes")

> **attributes**: [`AttributeDeclaration`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/AttributeDeclaration.md)\[]

Defined in: [modules/core/src/adapter/types/shader-layout.ts:40](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L40)

All attributes, their locations, and basic type information. Also an auto-deduced step mode

***

### bindings[​](#bindings "Direct link to bindings")

> **bindings**: [`BindingDeclaration`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/BindingDeclaration.md)\[]

Defined in: [modules/core/src/adapter/types/shader-layout.ts:42](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L42)

All binding points (textures, samplers, uniform buffers) with their locations and type

***

### uniforms?[​](#uniforms "Direct link to uniforms?")

> `optional` **uniforms?**: `any`\[]

Defined in: [modules/core/src/adapter/types/shader-layout.ts:44](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L44)

WebGL only (WebGPU use bindings and uniform buffers)

***

### varyings?[​](#varyings "Direct link to varyings?")

> `optional` **varyings?**: [`VaryingBinding`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/VaryingBinding.md)\[]

Defined in: [modules/core/src/adapter/types/shader-layout.ts:46](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L46)

WebGL2 only (WebGPU use compute shaders)
