# Type Alias: ExternalTextureBindingLayout

> **ExternalTextureBindingLayout** = `object`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:112

Shader binding declaration for a WebGPU `texture_external` slot.

## Properties[​](#properties "Direct link to Properties")

### group[​](#group "Direct link to group")

> **group**: `number`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:117

Bind group index. Always 0 in WebGL

***

### location[​](#location "Direct link to location")

> **location**: `number`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:119

Binding index within the bind group

***

### name[​](#name "Direct link to name")

> **name**: `string`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:115

Name of the binding. Used by luma to map bindings by name

***

### type[​](#type "Direct link to type")

> **type**: `"external-texture"`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:113

***

### visibility?[​](#visibility "Direct link to visibility?")

> `optional` **visibility?**: `number`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:121

Which shader stages can access this binding
