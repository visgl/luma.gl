# Function: decomposePhysicsTransform()

> **decomposePhysicsTransform**(`matrix`): `object`

Defined in: [modules/engine/src/scenegraph/physics-transforms.ts:33](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/physics-transforms.ts#L33)

Resolve affine TRS; reflection stays in signed scale and shear is rejected.

## Parameters[​](#parameters "Direct link to Parameters")

### matrix[​](#matrix "Direct link to matrix")

`Matrix4`

## Returns[​](#returns "Direct link to Returns")

`object`

### position[​](#position "Direct link to position")

> **position**: [`PhysicsVector`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/PhysicsVector.md)

### rotation[​](#rotation "Direct link to rotation")

> **rotation**: [`PhysicsRotation`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/PhysicsRotation.md)

### scale[​](#scale "Direct link to scale")

> **scale**: [`PhysicsVector`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/PhysicsVector.md)
