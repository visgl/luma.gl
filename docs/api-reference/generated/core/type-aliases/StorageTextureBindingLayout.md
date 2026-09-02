# Type Alias: StorageTextureBindingLayout

> **StorageTextureBindingLayout** = `object`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:168](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L168)

## Properties[​](#properties "Direct link to Properties")

### access?[​](#access "Direct link to access?")

> `optional` **access?**: `"write-only"` | `"read-only"` | `"read-write"`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:178](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L178)

***

### format[​](#format "Direct link to format")

> **format**: [`TextureFormat`](https://luma.gl/docs/api-reference/generated/core/type-aliases/TextureFormat.md)

Defined in: [modules/core/src/adapter/types/shader-layout.ts:179](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L179)

***

### group[​](#group "Direct link to group")

> **group**: `number`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:173](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L173)

Bind group index. Always 0 in WebGL

***

### location[​](#location "Direct link to location")

> **location**: `number`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:175](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L175)

Binding index within the bind group

***

### name[​](#name "Direct link to name")

> **name**: `string`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:171](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L171)

Name of the binding. Used by luma to map bindings by name

***

### type[​](#type "Direct link to type")

> **type**: `"storage"`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:169](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L169)

***

### viewDimension?[​](#viewdimension "Direct link to viewDimension?")

> `optional` **viewDimension?**: `"1d"` | `"2d"` | `"2d-array"` | `"cube"` | `"cube-array"` | `"3d"`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:180](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L180)

***

### visibility?[​](#visibility "Direct link to visibility?")

> `optional` **visibility?**: `number`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:177](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L177)

Which shader stages can access this binding
