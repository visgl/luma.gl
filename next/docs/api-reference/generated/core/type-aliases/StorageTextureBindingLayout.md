# Type Alias: StorageTextureBindingLayout

> **StorageTextureBindingLayout** = `object`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:135

## Properties[​](#properties "Direct link to Properties")

### access?[​](#access "Direct link to access?")

> `optional` **access?**: `"write-only"` | `"read-only"` | `"read-write"`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:145

***

### format[​](#format "Direct link to format")

> **format**: [`TextureFormat`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/TextureFormat.md)

Defined in: modules/shaders/dist/types/shader-layout.d.ts:146

***

### group[​](#group "Direct link to group")

> **group**: `number`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:140

Bind group index. Always 0 in WebGL

***

### location[​](#location "Direct link to location")

> **location**: `number`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:142

Binding index within the bind group

***

### name[​](#name "Direct link to name")

> **name**: `string`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:138

Name of the binding. Used by luma to map bindings by name

***

### type[​](#type "Direct link to type")

> **type**: `"storage"`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:136

***

### viewDimension?[​](#viewdimension "Direct link to viewDimension?")

> `optional` **viewDimension?**: `"1d"` | `"2d"` | `"2d-array"` | `"cube"` | `"cube-array"` | `"3d"`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:147

***

### visibility?[​](#visibility "Direct link to visibility?")

> `optional` **visibility?**: `number`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:144

Which shader stages can access this binding
