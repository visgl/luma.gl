# Type Alias: StorageBufferBindingLayout

> **StorageBufferBindingLayout** = `object`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:104](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L104)

## Properties[​](#properties "Direct link to Properties")

### group[​](#group "Direct link to group")

> **group**: `number`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:109](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L109)

Bind group index. Always 0 in WebGL

***

### hasDynamicOffset?[​](#hasdynamicoffset "Direct link to hasDynamicOffset?")

> `optional` **hasDynamicOffset?**: `boolean`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:114](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L114)

***

### location[​](#location "Direct link to location")

> **location**: `number`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:111](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L111)

Binding index within the bind group

***

### minBindingSize?[​](#minbindingsize "Direct link to minBindingSize?")

> `optional` **minBindingSize?**: `number`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:115](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L115)

***

### name[​](#name "Direct link to name")

> **name**: `string`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:107](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L107)

Name of the binding. Used by luma to map bindings by name

***

### type[​](#type "Direct link to type")

> **type**: `"storage"` | `"read-only-storage"`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:105](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L105)

***

### visibility?[​](#visibility "Direct link to visibility?")

> `optional` **visibility?**: `number`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:113](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L113)

Which shader stages can access this binding
