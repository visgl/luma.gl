# Type Alias: AttributeDeclaration

> **AttributeDeclaration** = `object`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:58](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L58)

Declares one for attributes

## Properties[​](#properties "Direct link to Properties")

### location[​](#location "Direct link to location")

> **location**: `number`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:62](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L62)

The index into the GPU's vertex array buffer bank (usually between 0-15)

***

### name[​](#name "Direct link to name")

> **name**: `string`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:60](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L60)

The name of this attribute in the shader

***

### stepMode?[​](#stepmode "Direct link to stepMode?")

> `optional` **stepMode?**: `"vertex"` | `"instance"`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:66](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L66)

Inferred from attribute name.

#### Note[​](#note "Direct link to Note")

Technically not part of static structure of shader

***

### type[​](#type "Direct link to type")

> **type**: [`AttributeShaderType`](https://luma.gl/docs/api-reference/generated/core/type-aliases/AttributeShaderType.md)

Defined in: [modules/core/src/adapter/types/shader-layout.ts:64](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L64)

WebGPU-style shader type. The declared format of the attribute in the shader code. Buffer's vertex format needs to map to this.
