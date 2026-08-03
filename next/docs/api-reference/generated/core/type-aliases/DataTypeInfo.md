# Type Alias: DataTypeInfo\<T>

> **DataTypeInfo**<`T`> = `object`

Defined in: [modules/core/src/shadertypes/data-types/data-types.ts:37](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/data-types/data-types.ts#L37)

Returns information about a signed or normalized DataType

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### T[​](#t "Direct link to T")

`T` *extends* [`NormalizedDataType`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/NormalizedDataType.md) = [`NormalizedDataType`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/NormalizedDataType.md)

## Properties[​](#properties "Direct link to Properties")

### byteLength[​](#bytelength "Direct link to byteLength")

> **byteLength**: `DataTypeByteLengthT`<`T`>

Defined in: [modules/core/src/shadertypes/data-types/data-types.ts:43](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/data-types/data-types.ts#L43)

***

### integer[​](#integer "Direct link to integer")

> **integer**: `DataTypeIsIntegerT`<`T`>

Defined in: [modules/core/src/shadertypes/data-types/data-types.ts:47](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/data-types/data-types.ts#L47)

***

### normalized[​](#normalized "Direct link to normalized")

> **normalized**: `DataTypeIsNormalizedT`<`T`>

Defined in: [modules/core/src/shadertypes/data-types/data-types.ts:45](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/data-types/data-types.ts#L45)

***

### primitiveType[​](#primitivetype "Direct link to primitiveType")

> **primitiveType**: [`PrimitiveDataTypeT`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/PrimitiveDataTypeT.md)<`T`>

Defined in: [modules/core/src/shadertypes/data-types/data-types.ts:41](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/data-types/data-types.ts#L41)

The primitive data type (what the shader sees)

***

### signed[​](#signed "Direct link to signed")

> **signed**: `DataTypeIsSignedT`<`T`>

Defined in: [modules/core/src/shadertypes/data-types/data-types.ts:49](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/data-types/data-types.ts#L49)

***

### signedType[​](#signedtype "Direct link to signedType")

> **signedType**: [`SignedDataTypeT`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/SignedDataTypeT.md)<`T`>

Defined in: [modules/core/src/shadertypes/data-types/data-types.ts:39](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/data-types/data-types.ts#L39)

The corresponding data type without normalization
