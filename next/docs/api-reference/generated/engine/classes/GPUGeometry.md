# Class: GPUGeometry

Defined in: [modules/engine/src/geometry/gpu-geometry.ts:39](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/gpu-geometry.ts#L39)

GPU-backed geometry container.

`GPUGeometry` owns already-created vertex and index buffers plus the `bufferLayout` metadata needed to bind those buffers to shader attributes.

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new GPUGeometry**(`props`): `GPUGeometry`

Defined in: [modules/engine/src/geometry/gpu-geometry.ts:62](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/gpu-geometry.ts#L62)

Creates GPU-backed geometry from existing buffers.

#### Parameters[​](#parameters "Direct link to Parameters")

##### props[​](#props "Direct link to props")

[`GPUGeometryProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/GPUGeometryProps.md)

#### Returns[​](#returns "Direct link to Returns")

`GPUGeometry`

## Properties[​](#properties "Direct link to Properties")

### attributes[​](#attributes "Direct link to attributes")

> `readonly` **attributes**: `Record`<`string`, `Buffer`>

Defined in: [modules/engine/src/geometry/gpu-geometry.ts:59](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/gpu-geometry.ts#L59)

GPU vertex buffers, keyed by buffer layout name.

***

### bufferLayout[​](#bufferlayout "Direct link to bufferLayout")

> `readonly` **bufferLayout**: `BufferLayout`\[] = `[]`

Defined in: [modules/engine/src/geometry/gpu-geometry.ts:50](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/gpu-geometry.ts#L50)

Buffer layout matching [GPUGeometry.attributes](#attributes).

***

### id[​](#id "Direct link to id")

> `readonly` **id**: `string`

Defined in: [modules/engine/src/geometry/gpu-geometry.ts:41](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/gpu-geometry.ts#L41)

Application-provided or generated identifier.

***

### indices?[​](#indices "Direct link to indices?")

> `readonly` `optional` **indices?**: `Buffer` | `null`

Defined in: [modules/engine/src/geometry/gpu-geometry.ts:56](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/gpu-geometry.ts#L56)

Optional GPU index buffer.

***

### topology?[​](#topology "Direct link to topology?")

> `readonly` `optional` **topology?**: `PrimitiveTopology`

Defined in: [modules/engine/src/geometry/gpu-geometry.ts:47](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/gpu-geometry.ts#L47)

Determines how vertices are assembled into primitives.

***

### userData[​](#userdata "Direct link to userData")

> **userData**: `Record`<`string`, `unknown`> = `{}`

Defined in: [modules/engine/src/geometry/gpu-geometry.ts:44](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/gpu-geometry.ts#L44)

Application-owned metadata.

***

### vertexCount[​](#vertexcount "Direct link to vertexCount")

> `readonly` **vertexCount**: `number`

Defined in: [modules/engine/src/geometry/gpu-geometry.ts:53](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/gpu-geometry.ts#L53)

Resolved draw vertex count.

## Methods[​](#methods "Direct link to Methods")

### \_calculateVertexCount()[​](#_calculatevertexcount "Direct link to _calculateVertexCount()")

> **\_calculateVertexCount**(`positions`): `number`

Defined in: [modules/engine/src/geometry/gpu-geometry.ts:102](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/gpu-geometry.ts#L102)

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### positions[​](#positions "Direct link to positions")

`Buffer`

#### Returns[​](#returns-1 "Direct link to Returns")

`number`

***

### destroy()[​](#destroy "Direct link to destroy()")

> **destroy**(): `void`

Defined in: [modules/engine/src/geometry/gpu-geometry.ts:80](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/gpu-geometry.ts#L80)

Destroys the owned index and vertex buffers.

#### Returns[​](#returns-2 "Direct link to Returns")

`void`

***

### getAttributes()[​](#getattributes "Direct link to getAttributes()")

> **getAttributes**(): `Record`<`string`, `Buffer`>

Defined in: [modules/engine/src/geometry/gpu-geometry.ts:93](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/gpu-geometry.ts#L93)

Returns the GPU vertex buffers.

#### Returns[​](#returns-3 "Direct link to Returns")

`Record`<`string`, `Buffer`>

***

### getIndexes()[​](#getindexes "Direct link to getIndexes()")

> **getIndexes**(): `Buffer` | `null`

Defined in: [modules/engine/src/geometry/gpu-geometry.ts:98](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/gpu-geometry.ts#L98)

Returns the GPU index buffer, or `null` for non-indexed geometry.

#### Returns[​](#returns-4 "Direct link to Returns")

`Buffer` | `null`

***

### getVertexCount()[​](#getvertexcount "Direct link to getVertexCount()")

> **getVertexCount**(): `number`

Defined in: [modules/engine/src/geometry/gpu-geometry.ts:88](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/gpu-geometry.ts#L88)

Returns the draw vertex count.

#### Returns[​](#returns-5 "Direct link to Returns")

`number`
