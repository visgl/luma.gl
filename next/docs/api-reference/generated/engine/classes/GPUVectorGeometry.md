# Class: GPUVectorGeometry

Defined in: [modules/engine/src/geometry/gpu-vector-geometry.ts:19](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/gpu-vector-geometry.ts#L19)

Reusable GPU-only geometry. Input vectors remain caller-owned.

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new GPUVectorGeometry**(`props`): `GPUVectorGeometry`

Defined in: [modules/engine/src/geometry/gpu-vector-geometry.ts:29](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/gpu-vector-geometry.ts#L29)

#### Parameters[​](#parameters "Direct link to Parameters")

##### props[​](#props "Direct link to props")

[`GPUVectorGeometryProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/GPUVectorGeometryProps.md)

#### Returns[​](#returns "Direct link to Returns")

`GPUVectorGeometry`

## Properties[​](#properties "Direct link to Properties")

### attributes[​](#attributes "Direct link to attributes")

> `readonly` **attributes**: [`GPUVectorModelAttributes`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/GPUVectorModelAttributes.md)

Defined in: [modules/engine/src/geometry/gpu-vector-geometry.ts:20](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/gpu-vector-geometry.ts#L20)

***

### bufferLayout?[​](#bufferlayout "Direct link to bufferLayout?")

> `readonly` `optional` **bufferLayout?**: `BufferLayout`\[]

Defined in: [modules/engine/src/geometry/gpu-vector-geometry.ts:24](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/gpu-vector-geometry.ts#L24)

***

### indices[​](#indices "Direct link to indices")

> `readonly` **indices**: [`GPUVectorModelInput`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/GPUVectorModelInput.md) | `null`

Defined in: [modules/engine/src/geometry/gpu-vector-geometry.ts:21](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/gpu-vector-geometry.ts#L21)

***

### topology[​](#topology "Direct link to topology")

> `readonly` **topology**: `PrimitiveTopology`

Defined in: [modules/engine/src/geometry/gpu-vector-geometry.ts:22](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/gpu-vector-geometry.ts#L22)

***

### vertexCount?[​](#vertexcount "Direct link to vertexCount?")

> `readonly` `optional` **vertexCount?**: `number`

Defined in: [modules/engine/src/geometry/gpu-vector-geometry.ts:23](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/gpu-vector-geometry.ts#L23)

## Methods[​](#methods "Direct link to Methods")

### destroy()[​](#destroy "Direct link to destroy()")

> **destroy**(): `void`

Defined in: [modules/engine/src/geometry/gpu-vector-geometry.ts:27](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/gpu-vector-geometry.ts#L27)

Releases resources owned by uploaded geometry; borrowed vectors remain caller-owned.

#### Returns[​](#returns-1 "Direct link to Returns")

`void`
