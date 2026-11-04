# Type Alias: InteractivityOptions

> **InteractivityOptions** = `object`

Defined in: [modules/engine/src/interactivity/interactivity.ts:37](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/interactivity/interactivity.ts#L37)

## Properties[​](#properties "Direct link to Properties")

### graph?[​](#graph "Direct link to graph?")

> `optional` **graph?**: `number`

Defined in: [modules/engine/src/interactivity/interactivity.ts:39](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/interactivity/interactivity.ts#L39)

***

### maxSteps?[​](#maxsteps "Direct link to maxSteps?")

> `optional` **maxSteps?**: `number`

Defined in: [modules/engine/src/interactivity/interactivity.ts:46](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/interactivity/interactivity.ts#L46)

Maximum flow activations per dispatch, protecting against unbounded cycles.

***

### onEvent?[​](#onevent "Direct link to onEvent?")

> `optional` **onEvent?**: (`eventId`, `values`) => `void`

Defined in: [modules/engine/src/interactivity/interactivity.ts:41](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/interactivity/interactivity.ts#L41)

Receives custom events sent by the graph to its host.

#### Parameters[​](#parameters "Direct link to Parameters")

##### eventId[​](#eventid "Direct link to eventId")

`string`

##### values[​](#values "Direct link to values")

`Record`<`string`, `unknown`\[]>

#### Returns[​](#returns "Direct link to Returns")

`void`

***

### onLog?[​](#onlog "Direct link to onLog?")

> `optional` **onLog?**: (`message`, `severity`) => `void`

Defined in: [modules/engine/src/interactivity/interactivity.ts:43](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/interactivity/interactivity.ts#L43)

Receives formatted graph diagnostics and their severity.

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### message[​](#message "Direct link to message")

`string`

##### severity[​](#severity "Direct link to severity")

`number`

#### Returns[​](#returns-1 "Direct link to Returns")

`void`

***

### physics?[​](#physics "Direct link to physics?")

> `optional` **physics?**: [`InteractivityPhysics`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/InteractivityPhysics.md)

Defined in: [modules/engine/src/interactivity/interactivity.ts:38](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/interactivity/interactivity.ts#L38)

***

### properties?[​](#properties-1 "Direct link to properties?")

> `optional` **properties?**: [`InteractivityPropertyAdapter`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/InteractivityPropertyAdapter.md)

Defined in: [modules/engine/src/interactivity/interactivity.ts:44](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/interactivity/interactivity.ts#L44)
