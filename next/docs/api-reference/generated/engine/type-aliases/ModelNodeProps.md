# Type Alias: ModelNodeProps

> **ModelNodeProps** = `ScenegraphNodeProps` & `object`

Defined in: [modules/engine/src/scenegraph/model-node.ts:16](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/model-node.ts#L16)

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### bounds?[​](#bounds "Direct link to bounds?")

> `optional` **bounds?**: [`ScenegraphBounds`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/ScenegraphBounds.md)

Bounds of one model instance before instance and node transforms.

### instanceMatrices?[​](#instancematrices "Direct link to instanceMatrices?")

> `optional` **instanceMatrices?**: readonly `NumericArray`\[]

Optional per-instance transforms used to calculate aggregate local bounds.

### managedResources?[​](#managedresources "Direct link to managedResources?")

> `optional` **managedResources?**: `any`\[]

### model[​](#model "Direct link to model")

> **model**: [`Model`](https://luma.gl/next/docs/api-reference/generated/engine/classes/Model.md)
