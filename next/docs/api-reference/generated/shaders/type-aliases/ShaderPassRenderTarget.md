# Type Alias: ShaderPassRenderTarget

> **ShaderPassRenderTarget** = `object`

Defined in: [lib/shader-module/shader-pass.ts:9](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-pass.ts#L9)

## Properties[​](#properties "Direct link to Properties")

### aliasFor?[​](#aliasfor "Direct link to aliasFor?")

> `optional` **aliasFor?**: `string`

Defined in: [lib/shader-module/shader-pass.ts:17](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-pass.ts#L17)

Reuse an earlier transient target with an identical size, format, and sampler.

***

### format?[​](#format "Direct link to format?")

> `optional` **format?**: `TextureFormat`

Defined in: [lib/shader-module/shader-pass.ts:13](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-pass.ts#L13)

Render target format. Defaults to the device preferred color format.

***

### initialize?[​](#initialize "Direct link to initialize?")

> `optional` **initialize?**: `"original"` | { `clearColor`: \[`number`, `number`, `number`, `number`]; }

Defined in: [lib/shader-module/shader-pass.ts:23](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-pass.ts#L23)

Initial value used after construction, resize, or an explicit history reset.

***

### lifetime?[​](#lifetime "Direct link to lifetime?")

> `optional` **lifetime?**: `"transient"` | `"history"`

Defined in: [lib/shader-module/shader-pass.ts:21](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-pass.ts#L21)

Resource lifetime. History targets retain their last successfully rendered value.

***

### sampler?[​](#sampler "Direct link to sampler?")

> `optional` **sampler?**: `SamplerProps`

Defined in: [lib/shader-module/shader-pass.ts:15](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-pass.ts#L15)

Optional sampling behavior when later passes read this target.

***

### scale?[​](#scale "Direct link to scale?")

> `optional` **scale?**: \[`number`, `number`]

Defined in: [lib/shader-module/shader-pass.ts:11](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-pass.ts#L11)

Width and height scale relative to the renderer output size.

***

### storage?[​](#storage "Direct link to storage?")

> `optional` **storage?**: `boolean`

Defined in: [lib/shader-module/shader-pass.ts:19](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-pass.ts#L19)

Allow WebGPU compute shaders to write this target as a storage texture.
