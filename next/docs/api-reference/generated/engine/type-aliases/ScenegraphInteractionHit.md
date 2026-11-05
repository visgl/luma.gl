# Type Alias: ScenegraphInteractionHit

> **ScenegraphInteractionHit** = `object`

Defined in: [modules/engine/src/scenegraph/scenegraph-interaction.ts:11](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-interaction.ts#L11)

A hit with its particular root-to-target path, ordered nearest to farthest by the caller.

## Properties[​](#properties "Direct link to Properties")

### data?[​](#data "Direct link to data?")

> `optional` **data?**: `unknown`

Defined in: [modules/engine/src/scenegraph/scenegraph-interaction.ts:19](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-interaction.ts#L19)

Application-specific picking information.

***

### path[​](#path "Direct link to path")

> **path**: readonly [`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md)\[]

Defined in: [modules/engine/src/scenegraph/scenegraph-interaction.ts:13](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-interaction.ts#L13)

Root-to-target path, including the hit node; distinguishes shared instances.

***

### point?[​](#point "Direct link to point?")

> `optional` **point?**: readonly \[`number`, `number`, `number`]

Defined in: [modules/engine/src/scenegraph/scenegraph-interaction.ts:15](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-interaction.ts#L15)

Optional intersection point in world coordinates.

***

### rayOrigin?[​](#rayorigin "Direct link to rayOrigin?")

> `optional` **rayOrigin?**: readonly \[`number`, `number`, `number`]

Defined in: [modules/engine/src/scenegraph/scenegraph-interaction.ts:17](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-interaction.ts#L17)

Optional world-space ray origin.
