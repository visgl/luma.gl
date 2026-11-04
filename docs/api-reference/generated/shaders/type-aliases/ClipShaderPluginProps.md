# Type Alias: ClipShaderPluginProps

> **ClipShaderPluginProps** = `object`

Defined in: [modules/engine/clip/clip.ts:8](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/engine/clip/clip.ts#L8)

## Properties[​](#properties "Direct link to Properties")

### bounds?[​](#bounds "Direct link to bounds?")

> `optional` **bounds?**: readonly \[`number`, `number`, `number`, `number`]

Defined in: [modules/engine/clip/clip.ts:12](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/engine/clip/clip.ts#L12)

Inclusive lower and exclusive upper bounds. Defaults to \[0, 0, 1, 1].

***

### enabled?[​](#enabled "Direct link to enabled?")

> `optional` **enabled?**: `boolean`

Defined in: [modules/engine/clip/clip.ts:10](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/engine/clip/clip.ts#L10)

Enables clipping. Defaults to true.

***

### mode?[​](#mode "Direct link to mode?")

> `optional` **mode?**: `"instance"` | `"geometry"`

Defined in: [modules/engine/clip/clip.ts:14](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/engine/clip/clip.ts#L14)

Clips whole instances by their anchor or individual fragments. Defaults to geometry.
