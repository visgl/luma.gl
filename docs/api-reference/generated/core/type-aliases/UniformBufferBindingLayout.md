# Type Alias: UniformBufferBindingLayout

> **UniformBufferBindingLayout** = `object`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:54

## Properties[​](#properties "Direct link to Properties")

### group[​](#group "Direct link to group")

> **group**: `number`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:59

Bind group index. Always 0 in WebGL

***

### hasDynamicOffset?[​](#hasdynamicoffset "Direct link to hasDynamicOffset?")

> `optional` **hasDynamicOffset?**: `boolean`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:64

***

### location[​](#location "Direct link to location")

> **location**: `number`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:61

Binding index within the bind group

***

### minBindingSize?[​](#minbindingsize "Direct link to minBindingSize?")

> `optional` **minBindingSize?**: `number`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:65

***

### name[​](#name "Direct link to name")

> **name**: `string`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:57

Name of the binding. Used by luma to map bindings by name

***

### type[​](#type "Direct link to type")

> **type**: `"uniform"`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:55

***

### uniforms?[​](#uniforms "Direct link to uniforms?")

> `optional` **uniforms?**: [`UniformInfo`](https://luma.gl/docs/api-reference/generated/core/type-aliases/UniformInfo.md)\[]

Defined in: modules/shaders/dist/types/shader-layout.d.ts:67

The uniforms in this uniform buffer

***

### visibility?[​](#visibility "Direct link to visibility?")

> `optional` **visibility?**: `number`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:63

Which shader stages can access this binding
