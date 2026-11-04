# Class: Geometry

Defined in: [modules/engine/src/geometry/geometry.ts:20](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/geometry.ts#L20)

Compatibility adapter for math.gl CPU geometry with engine shader layout metadata.

## Extends[​](#extends "Direct link to Extends")

* `Geometry`

## Extended by[​](#extended-by "Direct link to Extended by")

* [`CubeGeometry`](https://luma.gl/docs/api-reference/generated/engine/classes/CubeGeometry.md)
* [`TorusGeometry`](https://luma.gl/docs/api-reference/generated/engine/classes/TorusGeometry.md)
* [`IcoSphereGeometry`](https://luma.gl/docs/api-reference/generated/engine/classes/IcoSphereGeometry.md)
* [`PlaneGeometry`](https://luma.gl/docs/api-reference/generated/engine/classes/PlaneGeometry.md)
* [`SphereGeometry`](https://luma.gl/docs/api-reference/generated/engine/classes/SphereGeometry.md)
* [`TruncatedConeGeometry`](https://luma.gl/docs/api-reference/generated/engine/classes/TruncatedConeGeometry.md)
* [`RingGeometry`](https://luma.gl/docs/api-reference/generated/engine/classes/RingGeometry.md)

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new Geometry**(`props`): `Geometry`

Defined in: [modules/engine/src/geometry/geometry.ts:23](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/geometry.ts#L23)

#### Parameters[​](#parameters "Direct link to Parameters")

##### props[​](#props "Direct link to props")

[`GeometryProps`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/GeometryProps.md)

#### Returns[​](#returns "Direct link to Returns")

`Geometry`

#### Overrides[​](#overrides "Direct link to Overrides")

`MathGeometry.constructor`

## Properties[​](#properties "Direct link to Properties")

### attributes[​](#attributes "Direct link to attributes")

> `readonly` **attributes**: `Record`<`string`, [`GeometryAttribute`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/GeometryAttribute.md)>

Defined in: node\_modules/@math.gl/geometry/dist/lib/geometry.d.ts:30

#### Inherited from[​](#inherited-from "Direct link to Inherited from")

`MathGeometry.attributes`

***

### bufferLayout[​](#bufferlayout "Direct link to bufferLayout")

> `readonly` **bufferLayout**: `BufferLayout`\[]

Defined in: [modules/engine/src/geometry/geometry.ts:21](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/geometry.ts#L21)

***

### id[​](#id "Direct link to id")

> `readonly` **id**: `string`

Defined in: node\_modules/@math.gl/geometry/dist/lib/geometry.d.ts:26

#### Inherited from[​](#inherited-from-1 "Direct link to Inherited from")

`MathGeometry.id`

***

### indices?[​](#indices "Direct link to indices?")

> `readonly` `optional` **indices?**: [`GeometryAttribute`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/GeometryAttribute.md)

Defined in: node\_modules/@math.gl/geometry/dist/lib/geometry.d.ts:29

#### Inherited from[​](#inherited-from-2 "Direct link to Inherited from")

`MathGeometry.indices`

***

### topology[​](#topology "Direct link to topology")

> `readonly` **topology**: `PrimitiveTopology`

Defined in: node\_modules/@math.gl/geometry/dist/lib/geometry.d.ts:27

#### Inherited from[​](#inherited-from-3 "Direct link to Inherited from")

`MathGeometry.topology`

***

### userData[​](#userdata "Direct link to userData")

> **userData**: `Record`<`string`, `unknown`>

Defined in: node\_modules/@math.gl/geometry/dist/lib/geometry.d.ts:31

#### Inherited from[​](#inherited-from-4 "Direct link to Inherited from")

`MathGeometry.userData`

***

### vertexCount[​](#vertexcount "Direct link to vertexCount")

> `readonly` **vertexCount**: `number`

Defined in: node\_modules/@math.gl/geometry/dist/lib/geometry.d.ts:28

#### Inherited from[​](#inherited-from-5 "Direct link to Inherited from")

`MathGeometry.vertexCount`

## Methods[​](#methods "Direct link to Methods")

### getAttributes()[​](#getattributes "Direct link to getAttributes()")

> **getAttributes**(): `GeometryAttributes`

Defined in: node\_modules/@math.gl/geometry/dist/lib/geometry.d.ts:34

#### Returns[​](#returns-1 "Direct link to Returns")

`GeometryAttributes`

#### Inherited from[​](#inherited-from-6 "Direct link to Inherited from")

`MathGeometry.getAttributes`

***

### getVertexCount()[​](#getvertexcount "Direct link to getVertexCount()")

> **getVertexCount**(): `number`

Defined in: node\_modules/@math.gl/geometry/dist/lib/geometry.d.ts:33

#### Returns[​](#returns-2 "Direct link to Returns")

`number`

#### Inherited from[​](#inherited-from-7 "Direct link to Inherited from")

`MathGeometry.getVertexCount`
