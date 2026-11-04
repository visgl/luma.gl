# Type Alias: DataTypeInfo\<T>

> **DataTypeInfo**<`T`> = `object`

Defined in: [modules/core/src/shadertypes/data-types/data-types.ts:32](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/data-types/data-types.ts#L32)

Returns information about a signed or normalized DataType

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### T[​](#t "Direct link to T")

`T` *extends* [`NormalizedDataType`](https://luma.gl/docs/api-reference/generated/core/type-aliases/NormalizedDataType.md) = [`NormalizedDataType`](https://luma.gl/docs/api-reference/generated/core/type-aliases/NormalizedDataType.md)

## Properties[​](#properties "Direct link to Properties")

### byteLength[​](#bytelength "Direct link to byteLength")

> **byteLength**: `DataTypeByteLengthT`<`T`>

Defined in: [modules/core/src/shadertypes/data-types/data-types.ts:38](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/data-types/data-types.ts#L38)

***

### integer[​](#integer "Direct link to integer")

> **integer**: `DataTypeIsIntegerT`<`T`>

Defined in: [modules/core/src/shadertypes/data-types/data-types.ts:42](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/data-types/data-types.ts#L42)

***

### normalized[​](#normalized "Direct link to normalized")

> **normalized**: `DataTypeIsNormalizedT`<`T`>

Defined in: [modules/core/src/shadertypes/data-types/data-types.ts:40](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/data-types/data-types.ts#L40)

***

### primitiveType[​](#primitivetype "Direct link to primitiveType")

> **primitiveType**: [`PrimitiveDataTypeT`](https://luma.gl/docs/api-reference/generated/core/type-aliases/PrimitiveDataTypeT.md)<`T`>

Defined in: [modules/core/src/shadertypes/data-types/data-types.ts:36](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/data-types/data-types.ts#L36)

The primitive data type (what the shader sees)

***

### signed[​](#signed "Direct link to signed")

> **signed**: `DataTypeIsSignedT`<`T`>

Defined in: [modules/core/src/shadertypes/data-types/data-types.ts:44](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/data-types/data-types.ts#L44)

***

### signedType[​](#signedtype "Direct link to signedType")

> **signedType**: [`SignedDataTypeT`](https://luma.gl/docs/api-reference/generated/core/type-aliases/SignedDataTypeT.md)<`T`>

Defined in: [modules/core/src/shadertypes/data-types/data-types.ts:34](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/data-types/data-types.ts#L34)

The corresponding data type without normalization
