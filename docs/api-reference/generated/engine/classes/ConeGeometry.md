# Class: ConeGeometry

Defined in: [modules/engine/src/geometry/geometry-primitives.ts:129](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/geometry-primitives.ts#L129)

Compatibility adapter for math.gl CPU geometry with engine shader layout metadata.

## Extends[​](#extends "Direct link to Extends")

* [`TruncatedConeGeometry`](https://luma.gl/docs/api-reference/generated/engine/classes/TruncatedConeGeometry.md)

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new ConeGeometry**(`props?`): `ConeGeometry`

Defined in: [modules/engine/src/geometry/geometry-primitives.ts:130](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/geometry-primitives.ts#L130)

#### Parameters[​](#parameters "Direct link to Parameters")

##### props?[​](#props "Direct link to props?")

[`ConeGeometryProps`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/ConeGeometryProps.md) = `{}`

#### Returns[​](#returns "Direct link to Returns")

`ConeGeometry`

#### Overrides[​](#overrides "Direct link to Overrides")

[`TruncatedConeGeometry`](https://luma.gl/docs/api-reference/generated/engine/classes/TruncatedConeGeometry.md).[`constructor`](https://luma.gl/docs/api-reference/generated/engine/classes/TruncatedConeGeometry.md#constructor)

## Properties[​](#properties "Direct link to Properties")

### attributes[​](#attributes "Direct link to attributes")

> `readonly` **attributes**: `Record`<`string`, [`GeometryAttribute`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/GeometryAttribute.md)>

Defined in: node\_modules/@math.gl/geometry/dist/lib/geometry.d.ts:30

#### Inherited from[​](#inherited-from "Direct link to Inherited from")

[`TruncatedConeGeometry`](https://luma.gl/docs/api-reference/generated/engine/classes/TruncatedConeGeometry.md).[`attributes`](https://luma.gl/docs/api-reference/generated/engine/classes/TruncatedConeGeometry.md#attributes)

***

### bufferLayout[​](#bufferlayout "Direct link to bufferLayout")

> `readonly` **bufferLayout**: `BufferLayout`\[]

Defined in: [modules/engine/src/geometry/geometry.ts:21](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/geometry.ts#L21)

#### Inherited from[​](#inherited-from-1 "Direct link to Inherited from")

[`TruncatedConeGeometry`](https://luma.gl/docs/api-reference/generated/engine/classes/TruncatedConeGeometry.md).[`bufferLayout`](https://luma.gl/docs/api-reference/generated/engine/classes/TruncatedConeGeometry.md#bufferlayout)

***

### id[​](#id "Direct link to id")

> `readonly` **id**: `string`

Defined in: node\_modules/@math.gl/geometry/dist/lib/geometry.d.ts:26

#### Inherited from[​](#inherited-from-2 "Direct link to Inherited from")

[`TruncatedConeGeometry`](https://luma.gl/docs/api-reference/generated/engine/classes/TruncatedConeGeometry.md).[`id`](https://luma.gl/docs/api-reference/generated/engine/classes/TruncatedConeGeometry.md#id)

***

### indices?[​](#indices "Direct link to indices?")

> `readonly` `optional` **indices?**: [`GeometryAttribute`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/GeometryAttribute.md)

Defined in: node\_modules/@math.gl/geometry/dist/lib/geometry.d.ts:29

#### Inherited from[​](#inherited-from-3 "Direct link to Inherited from")

[`TruncatedConeGeometry`](https://luma.gl/docs/api-reference/generated/engine/classes/TruncatedConeGeometry.md).[`indices`](https://luma.gl/docs/api-reference/generated/engine/classes/TruncatedConeGeometry.md#indices)

***

### topology[​](#topology "Direct link to topology")

> `readonly` **topology**: `PrimitiveTopology`

Defined in: node\_modules/@math.gl/geometry/dist/lib/geometry.d.ts:27

#### Inherited from[​](#inherited-from-4 "Direct link to Inherited from")

[`TruncatedConeGeometry`](https://luma.gl/docs/api-reference/generated/engine/classes/TruncatedConeGeometry.md).[`topology`](https://luma.gl/docs/api-reference/generated/engine/classes/TruncatedConeGeometry.md#topology)

***

### userData[​](#userdata "Direct link to userData")

> **userData**: `Record`<`string`, `unknown`>

Defined in: node\_modules/@math.gl/geometry/dist/lib/geometry.d.ts:31

#### Inherited from[​](#inherited-from-5 "Direct link to Inherited from")

[`TruncatedConeGeometry`](https://luma.gl/docs/api-reference/generated/engine/classes/TruncatedConeGeometry.md).[`userData`](https://luma.gl/docs/api-reference/generated/engine/classes/TruncatedConeGeometry.md#userdata)

***

### vertexCount[​](#vertexcount "Direct link to vertexCount")

> `readonly` **vertexCount**: `number`

Defined in: node\_modules/@math.gl/geometry/dist/lib/geometry.d.ts:28

#### Inherited from[​](#inherited-from-6 "Direct link to Inherited from")

[`TruncatedConeGeometry`](https://luma.gl/docs/api-reference/generated/engine/classes/TruncatedConeGeometry.md).[`vertexCount`](https://luma.gl/docs/api-reference/generated/engine/classes/TruncatedConeGeometry.md#vertexcount)

## Methods[​](#methods "Direct link to Methods")

### getAttributes()[​](#getattributes "Direct link to getAttributes()")

> **getAttributes**(): `GeometryAttributes`

Defined in: node\_modules/@math.gl/geometry/dist/lib/geometry.d.ts:34

#### Returns[​](#returns-1 "Direct link to Returns")

`GeometryAttributes`

#### Inherited from[​](#inherited-from-7 "Direct link to Inherited from")

[`TruncatedConeGeometry`](https://luma.gl/docs/api-reference/generated/engine/classes/TruncatedConeGeometry.md).[`getAttributes`](https://luma.gl/docs/api-reference/generated/engine/classes/TruncatedConeGeometry.md#getattributes)

***

### getVertexCount()[​](#getvertexcount "Direct link to getVertexCount()")

> **getVertexCount**(): `number`

Defined in: node\_modules/@math.gl/geometry/dist/lib/geometry.d.ts:33

#### Returns[​](#returns-2 "Direct link to Returns")

`number`

#### Inherited from[​](#inherited-from-8 "Direct link to Inherited from")

[`TruncatedConeGeometry`](https://luma.gl/docs/api-reference/generated/engine/classes/TruncatedConeGeometry.md).[`getVertexCount`](https://luma.gl/docs/api-reference/generated/engine/classes/TruncatedConeGeometry.md#getvertexcount)
