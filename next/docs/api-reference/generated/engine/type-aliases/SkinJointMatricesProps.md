# Type Alias: SkinJointMatricesProps

> **SkinJointMatricesProps** = `object`

Defined in: [modules/engine/src/animation/skin.ts:11](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/skin.ts#L11)

Format-independent inputs for evaluating a skinned mesh's joint palette.

## Properties[​](#properties "Direct link to Properties")

### inverseBindMatrices?[​](#inversebindmatrices "Direct link to inverseBindMatrices?")

> `optional` **inverseBindMatrices?**: `ArrayLike`<`number`>

Defined in: [modules/engine/src/animation/skin.ts:19](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/skin.ts#L19)

Optional column-major inverse bind matrix for each joint.

***

### joints[​](#joints "Direct link to joints")

> **joints**: readonly [`GroupNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/GroupNode.md)\[]

Defined in: [modules/engine/src/animation/skin.ts:13](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/skin.ts#L13)

Joints in their authored palette order.

***

### meshNode?[​](#meshnode "Direct link to meshNode?")

> `optional` **meshNode?**: [`GroupNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/GroupNode.md)

Defined in: [modules/engine/src/animation/skin.ts:15](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/skin.ts#L15)

Animated scenegraph node that owns the skinned mesh.

***

### target?[​](#target "Direct link to target?")

> `optional` **target?**: `Float32Array`

Defined in: [modules/engine/src/animation/skin.ts:21](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/skin.ts#L21)

Existing output storage that can be reused across animation frames.

***

### worldMatrices[​](#worldmatrices "Direct link to worldMatrices")

> **worldMatrices**: `ReadonlyMap`<[`GroupNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/GroupNode.md), `Readonly`<`NumericArray`>>

Defined in: [modules/engine/src/animation/skin.ts:17](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/skin.ts#L17)

World transforms collected once for the animated scene hierarchy.
