# Type Alias: ScenegraphTransformFrame

> **ScenegraphTransformFrame** = `object`

Defined in: [modules/engine/src/scenegraph/transform-source.ts:18](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/transform-source.ts#L18)

An accepted GPU publication. Buffers are borrowed, never owned by a renderer.

## Properties[​](#properties "Direct link to Properties")

### bindings[​](#bindings "Direct link to bindings")

> **bindings**: `ReadonlyMap`<[`ScenegraphNode`](https://luma.gl/docs/api-reference/generated/engine/classes/ScenegraphNode.md), [`ScenegraphTransformBinding`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/ScenegraphTransformBinding.md)>

Defined in: [modules/engine/src/scenegraph/transform-source.ts:24](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/transform-source.ts#L24)

***

### matrices[​](#matrices "Direct link to matrices")

> **matrices**: `Buffer`

Defined in: [modules/engine/src/scenegraph/transform-source.ts:20](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/transform-source.ts#L20)

Column-major float32 mat4 array, with STORAGE usage.

***

### matrixCount[​](#matrixcount "Direct link to matrixCount")

> **matrixCount**: `number`

Defined in: [modules/engine/src/scenegraph/transform-source.ts:21](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/transform-source.ts#L21)

***

### revision[​](#revision "Direct link to revision")

> **revision**: `number`

Defined in: [modules/engine/src/scenegraph/transform-source.ts:23](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/transform-source.ts#L23)

Changes when the producer replaces its buffers or index mapping.
