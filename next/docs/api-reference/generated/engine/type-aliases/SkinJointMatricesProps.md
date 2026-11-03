# Type Alias: SkinJointMatricesProps

> **SkinJointMatricesProps** = `object`

Defined in: [modules/engine/src/animation/skin.ts:10](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/skin.ts#L10)

Format-independent inputs for evaluating a skinned mesh's joint palette.

## Properties[​](#properties "Direct link to Properties")

### inverseBindMatrices?[​](#inversebindmatrices "Direct link to inverseBindMatrices?")

> `optional` **inverseBindMatrices?**: `ArrayLike`<`number`>

Defined in: [modules/engine/src/animation/skin.ts:18](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/skin.ts#L18)

Optional column-major inverse bind matrix for each joint.

***

### joints[​](#joints "Direct link to joints")

> **joints**: readonly [`GroupNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/GroupNode.md)\[]

Defined in: [modules/engine/src/animation/skin.ts:12](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/skin.ts#L12)

Joints in their authored palette order.

***

### meshNode?[​](#meshnode "Direct link to meshNode?")

> `optional` **meshNode?**: [`GroupNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/GroupNode.md)

Defined in: [modules/engine/src/animation/skin.ts:14](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/skin.ts#L14)

Animated scenegraph node that owns the skinned mesh.

***

### target?[​](#target "Direct link to target?")

> `optional` **target?**: `Float32Array`

Defined in: [modules/engine/src/animation/skin.ts:20](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/skin.ts#L20)

Existing output storage that can be reused across animation frames.

***

### worldMatrices[​](#worldmatrices "Direct link to worldMatrices")

> **worldMatrices**: `ReadonlyMap`<[`GroupNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/GroupNode.md), `Readonly`<`NumericArray`>>

Defined in: [modules/engine/src/animation/skin.ts:16](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/skin.ts#L16)

World transforms collected once for the animated scene hierarchy.
