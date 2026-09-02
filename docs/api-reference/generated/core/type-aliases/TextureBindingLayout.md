# Type Alias: TextureBindingLayout

> **TextureBindingLayout** = `object`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:127](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L127)

## Properties[​](#properties "Direct link to Properties")

### group[​](#group "Direct link to group")

> **group**: `number`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:132](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L132)

Bind group index. Always 0 in WebGL

***

### location[​](#location "Direct link to location")

> **location**: `number`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:134](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L134)

Binding index within the bind group

***

### multisampled?[​](#multisampled "Direct link to multisampled?")

> `optional` **multisampled?**: `boolean`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:139](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L139)

***

### name[​](#name "Direct link to name")

> **name**: `string`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:130](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L130)

Name of the binding. Used by luma to map bindings by name

***

### sampleType?[​](#sampletype "Direct link to sampleType?")

> `optional` **sampleType?**: `"float"` | `"unfilterable-float"` | `"depth"` | `"sint"` | `"uint"`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:138](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L138)

***

### type[​](#type "Direct link to type")

> **type**: `"texture"`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:128](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L128)

***

### viewDimension?[​](#viewdimension "Direct link to viewDimension?")

> `optional` **viewDimension?**: `"1d"` | `"2d"` | `"2d-array"` | `"cube"` | `"cube-array"` | `"3d"`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:137](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L137)

***

### visibility?[​](#visibility "Direct link to visibility?")

> `optional` **visibility?**: `number`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:136](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L136)

Which shader stages can access this binding
