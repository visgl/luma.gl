# Type Alias: StorageBufferBindingLayout

> **StorageBufferBindingLayout** = `object`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:113](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L113)

## Properties[​](#properties "Direct link to Properties")

### group[​](#group "Direct link to group")

> **group**: `number`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:118](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L118)

Bind group index. Always 0 in WebGL

***

### hasDynamicOffset?[​](#hasdynamicoffset "Direct link to hasDynamicOffset?")

> `optional` **hasDynamicOffset?**: `boolean`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:123](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L123)

***

### location[​](#location "Direct link to location")

> **location**: `number`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:120](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L120)

Binding index within the bind group

***

### minBindingSize?[​](#minbindingsize "Direct link to minBindingSize?")

> `optional` **minBindingSize?**: `number`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:124](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L124)

***

### name[​](#name "Direct link to name")

> **name**: `string`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:116](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L116)

Name of the binding. Used by luma to map bindings by name

***

### type[​](#type "Direct link to type")

> **type**: `"storage"` | `"read-only-storage"`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:114](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L114)

***

### visibility?[​](#visibility "Direct link to visibility?")

> `optional` **visibility?**: `number`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:122](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L122)

Which shader stages can access this binding
