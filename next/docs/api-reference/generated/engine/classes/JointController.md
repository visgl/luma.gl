# Class: JointController

Defined in: [modules/engine/src/scenegraph/controllers/joint-controller.ts:41](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/joint-controller.ts#L41)

Resolves authored attachment nodes independently of file format and physics backend.

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new JointController**(`joints`): `JointController`

Defined in: [modules/engine/src/scenegraph/controllers/joint-controller.ts:42](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/joint-controller.ts#L42)

#### Parameters[​](#parameters "Direct link to Parameters")

##### joints[​](#joints "Direct link to joints")

readonly [`ScenegraphJoint`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/ScenegraphJoint.md)\[]

#### Returns[​](#returns "Direct link to Returns")

`JointController`

## Properties[​](#properties "Direct link to Properties")

### joints[​](#joints-1 "Direct link to joints")

> `readonly` **joints**: readonly [`ScenegraphJoint`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/ScenegraphJoint.md)\[]

Defined in: [modules/engine/src/scenegraph/controllers/joint-controller.ts:42](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/joint-controller.ts#L42)

## Methods[​](#methods "Direct link to Methods")

### resolve()[​](#resolve "Direct link to resolve()")

> **resolve**(`roots`, `bodyNodes`): [`ResolvedScenegraphJoint`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/ResolvedScenegraphJoint.md)\[]

Defined in: [modules/engine/src/scenegraph/controllers/joint-controller.ts:44](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/joint-controller.ts#L44)

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### roots[​](#roots "Direct link to roots")

readonly [`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md)\[]

##### bodyNodes[​](#bodynodes "Direct link to bodyNodes")

`ReadonlySet`<[`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md)>

#### Returns[​](#returns-1 "Direct link to Returns")

[`ResolvedScenegraphJoint`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/ResolvedScenegraphJoint.md)\[]
