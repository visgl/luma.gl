# Type Alias: ScenegraphInteractionEvent

> **ScenegraphInteractionEvent** = `object`

Defined in: [modules/engine/src/scenegraph/scenegraph-interaction.ts:41](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-interaction.ts#L41)

One bubbled host interaction event.

## Properties[​](#properties "Direct link to Properties")

### controllerIndex[​](#controllerindex "Direct link to controllerIndex")

> **controllerIndex**: `number`

Defined in: [modules/engine/src/scenegraph/scenegraph-interaction.ts:48](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-interaction.ts#L48)

Identifies the pointer or controller.

***

### currentTarget[​](#currenttarget "Direct link to currentTarget")

> **currentTarget**: [`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md)

Defined in: [modules/engine/src/scenegraph/scenegraph-interaction.ts:46](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-interaction.ts#L46)

Node receiving this step of the event's upward propagation.

***

### hit[​](#hit "Direct link to hit")

> **hit**: [`ScenegraphInteractionHit`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/ScenegraphInteractionHit.md)

Defined in: [modules/engine/src/scenegraph/scenegraph-interaction.ts:50](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-interaction.ts#L50)

The original host hit associated with this event.

***

### target[​](#target "Direct link to target")

> **target**: [`ScenegraphNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphNode.md)

Defined in: [modules/engine/src/scenegraph/scenegraph-interaction.ts:44](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-interaction.ts#L44)

Target object where the interaction began or ended.

***

### type[​](#type "Direct link to type")

> **type**: `"select"` | `"hover-in"` | `"hover-out"`

Defined in: [modules/engine/src/scenegraph/scenegraph-interaction.ts:42](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-interaction.ts#L42)
