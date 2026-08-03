# Type Alias: AttributeShaderTypeInfo

> **AttributeShaderTypeInfo** = `object`

Defined in: [modules/core/src/shadertypes/shader-types/shader-type-decoder.ts:20](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/shader-types/shader-type-decoder.ts#L20)

Information extracted from a AttributeShaderType constant

## Properties[​](#properties "Direct link to Properties")

### byteLength?[​](#bytelength "Direct link to byteLength?")

> `optional` **byteLength?**: `number`

Defined in: [modules/core/src/shadertypes/shader-types/shader-type-decoder.ts:26](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/shader-types/shader-type-decoder.ts#L26)

Length in bytes of the data for one vertex

***

### components[​](#components "Direct link to components")

> **components**: `1` | `2` | `3` | `4`

Defined in: [modules/core/src/shadertypes/shader-types/shader-type-decoder.ts:24](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/shader-types/shader-type-decoder.ts#L24)

Whether this is a normalized integer (that must be used as float)

***

### integer[​](#integer "Direct link to integer")

> **integer**: `boolean`

Defined in: [modules/core/src/shadertypes/shader-types/shader-type-decoder.ts:28](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/shader-types/shader-type-decoder.ts#L28)

Whether this is for integer or float vert

***

### primitiveType[​](#primitivetype "Direct link to primitiveType")

> **primitiveType**: [`PrimitiveDataType`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/PrimitiveDataType.md)

Defined in: [modules/core/src/shadertypes/shader-types/shader-type-decoder.ts:22](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/shader-types/shader-type-decoder.ts#L22)

WGSL-style primitive data type, f32, i32, u32

***

### signed[​](#signed "Direct link to signed")

> **signed**: `boolean`

Defined in: [modules/core/src/shadertypes/shader-types/shader-type-decoder.ts:30](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/shader-types/shader-type-decoder.ts#L30)

Whether this data type is signed
