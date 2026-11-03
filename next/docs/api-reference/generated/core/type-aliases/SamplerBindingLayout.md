# Type Alias: SamplerBindingLayout

> **SamplerBindingLayout** = `object`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:123

## Properties[​](#properties "Direct link to Properties")

### group[​](#group "Direct link to group")

> **group**: `number`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:128

Bind group index. Always 0 in WebGL

***

### location[​](#location "Direct link to location")

> **location**: `number`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:130

Binding index within the bind group

***

### name[​](#name "Direct link to name")

> **name**: `string`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:126

Name of the binding. Used by luma to map bindings by name

***

### samplerType?[​](#samplertype "Direct link to samplerType?")

> `optional` **samplerType?**: `"filtering"` | `"non-filtering"` | `"comparison"`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:133

***

### type[​](#type "Direct link to type")

> **type**: `"sampler"`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:124

***

### visibility?[​](#visibility "Direct link to visibility?")

> `optional` **visibility?**: `number`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:132

Which shader stages can access this binding
