# Type Alias: TextureBindingLayout

> **TextureBindingLayout** = `object`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:97

## Properties[​](#properties "Direct link to Properties")

### group[​](#group "Direct link to group")

> **group**: `number`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:102

Bind group index. Always 0 in WebGL

***

### location[​](#location "Direct link to location")

> **location**: `number`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:104

Binding index within the bind group

***

### multisampled?[​](#multisampled "Direct link to multisampled?")

> `optional` **multisampled?**: `boolean`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:109

***

### name[​](#name "Direct link to name")

> **name**: `string`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:100

Name of the binding. Used by luma to map bindings by name

***

### sampleType?[​](#sampletype "Direct link to sampleType?")

> `optional` **sampleType?**: `"float"` | `"unfilterable-float"` | `"depth"` | `"sint"` | `"uint"`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:108

***

### type[​](#type "Direct link to type")

> **type**: `"texture"`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:98

***

### viewDimension?[​](#viewdimension "Direct link to viewDimension?")

> `optional` **viewDimension?**: `"1d"` | `"2d"` | `"2d-array"` | `"cube"` | `"cube-array"` | `"3d"`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:107

***

### visibility?[​](#visibility "Direct link to visibility?")

> `optional` **visibility?**: `number`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:106

Which shader stages can access this binding
