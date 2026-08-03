# Type Alias: AttributeDeclaration

> **AttributeDeclaration** = `object`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:57](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L57)

Declares one for attributes

## Properties[​](#properties "Direct link to Properties")

### location[​](#location "Direct link to location")

> **location**: `number`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:61](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L61)

The index into the GPU's vertex array buffer bank (usually between 0-15)

***

### name[​](#name "Direct link to name")

> **name**: `string`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:59](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L59)

The name of this attribute in the shader

***

### stepMode?[​](#stepmode "Direct link to stepMode?")

> `optional` **stepMode?**: `"vertex"` | `"instance"`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:65](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L65)

Inferred from attribute name.

#### Note[​](#note "Direct link to Note")

Technically not part of static structure of shader

***

### type[​](#type "Direct link to type")

> **type**: [`AttributeShaderType`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/AttributeShaderType.md)

Defined in: [modules/core/src/adapter/types/shader-layout.ts:63](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L63)

WebGPU-style shader type. The declared format of the attribute in the shader code. Buffer's vertex format needs to map to this.
