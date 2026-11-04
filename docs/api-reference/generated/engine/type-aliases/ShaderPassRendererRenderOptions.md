# Type Alias: ShaderPassRendererRenderOptions

> **ShaderPassRendererRenderOptions** = `object`

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:69](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L69)

Per-frame inputs accepted by [ShaderPassRenderer](https://luma.gl/docs/api-reference/generated/engine/classes/ShaderPassRenderer.md).

## Properties[​](#properties "Direct link to Properties")

### bindings?[​](#bindings "Direct link to bindings?")

> `optional` **bindings?**: `Record`<`string`, [`ShaderPassBinding`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/ShaderPassBinding.md)>

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:72](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L72)

***

### resetHistory?[​](#resethistory "Direct link to resetHistory?")

> `optional` **resetHistory?**: `boolean`

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:74](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L74)

Invalidates all persistent render targets before rendering this frame.

***

### sourceTexture[​](#sourcetexture "Direct link to sourceTexture")

> **sourceTexture**: [`ShaderPassSourceTexture`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/ShaderPassSourceTexture.md)

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:70](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L70)

***

### uniforms?[​](#uniforms "Direct link to uniforms?")

> `optional` **uniforms?**: `Record`<`string`, `Record`<`string`, `unknown`>>

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:71](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L71)
