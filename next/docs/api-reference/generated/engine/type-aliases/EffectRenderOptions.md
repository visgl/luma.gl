# Type Alias: EffectRenderOptions

> **EffectRenderOptions** = [`ShaderPassRendererRenderOptions`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/ShaderPassRendererRenderOptions.md) & `object`

Defined in: [modules/engine/src/passes/effect-renderer.ts:183](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/effect-renderer.ts#L183)

Inputs and destination for a single effects frame.

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### commandEncoder?[​](#commandencoder "Direct link to commandEncoder?")

> `optional` **commandEncoder?**: `CommandEncoder`

Defaults to the device encoder. The renderer records work without submitting it.

### target?[​](#target "Direct link to target?")

> `optional` **target?**: `Framebuffer` | `null`

Omit to return the texture, pass null to present, or supply a borrowed framebuffer.
