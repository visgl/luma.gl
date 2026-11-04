# Type Alias: SkinBinding

> **SkinBinding** = `object`

Defined in: [modules/engine/src/scenegraph/controllers/skin-controller.ts:12](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/skin-controller.ts#L12)

Resolved mesh, joint nodes, and owned GPU palette storage.

## Properties[​](#properties "Direct link to Properties")

### inverseBindMatrices?[​](#inversebindmatrices "Direct link to inverseBindMatrices?")

> `optional` **inverseBindMatrices?**: `Float32Array`

Defined in: [modules/engine/src/scenegraph/controllers/skin-controller.ts:18](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/skin-controller.ts#L18)

Optional authored inverse bind matrices.

***

### jointMatrices[​](#jointmatrices "Direct link to jointMatrices")

> **jointMatrices**: `Float32Array`

Defined in: [modules/engine/src/scenegraph/controllers/skin-controller.ts:20](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/skin-controller.ts#L20)

Reused, mesh-local joint palette supplied to the existing skin shader.

***

### joints[​](#joints "Direct link to joints")

> **joints**: readonly [`GroupNode`](https://luma.gl/docs/api-reference/generated/engine/classes/GroupNode.md)\[]

Defined in: [modules/engine/src/scenegraph/controllers/skin-controller.ts:16](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/skin-controller.ts#L16)

Animated joint nodes in their source palette order.

***

### models[​](#models "Direct link to models")

> **models**: readonly [`ModelNode`](https://luma.gl/docs/api-reference/generated/engine/classes/ModelNode.md)\[]

Defined in: [modules/engine/src/scenegraph/controllers/skin-controller.ts:24](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/skin-controller.ts#L24)

Existing primitive models that share this skin binding.

***

### node[​](#node "Direct link to node")

> **node**: [`GroupNode`](https://luma.gl/docs/api-reference/generated/engine/classes/GroupNode.md)

Defined in: [modules/engine/src/scenegraph/controllers/skin-controller.ts:14](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/skin-controller.ts#L14)

Animated scenegraph node that owns the skinned mesh.

***

### skinJointMatrices?[​](#skinjointmatrices "Direct link to skinJointMatrices?")

> `optional` **skinJointMatrices?**: `Buffer` | `Texture`

Defined in: [modules/engine/src/scenegraph/controllers/skin-controller.ts:22](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/skin-controller.ts#L22)

WebGPU storage buffer or WebGL float texture for a palette that exceeds uniform limits.
