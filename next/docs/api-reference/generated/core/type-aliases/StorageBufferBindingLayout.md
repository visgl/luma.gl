# Type Alias: StorageBufferBindingLayout

> **StorageBufferBindingLayout** = `object`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:84

## Properties[​](#properties "Direct link to Properties")

### group[​](#group "Direct link to group")

> **group**: `number`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:89

Bind group index. Always 0 in WebGL

***

### hasDynamicOffset?[​](#hasdynamicoffset "Direct link to hasDynamicOffset?")

> `optional` **hasDynamicOffset?**: `boolean`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:94

***

### location[​](#location "Direct link to location")

> **location**: `number`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:91

Binding index within the bind group

***

### minBindingSize?[​](#minbindingsize "Direct link to minBindingSize?")

> `optional` **minBindingSize?**: `number`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:95

***

### name[​](#name "Direct link to name")

> **name**: `string`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:87

Name of the binding. Used by luma to map bindings by name

***

### type[​](#type "Direct link to type")

> **type**: `"storage"` | `"read-only-storage"`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:85

***

### visibility?[​](#visibility "Direct link to visibility?")

> `optional` **visibility?**: `number`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:93

Which shader stages can access this binding
