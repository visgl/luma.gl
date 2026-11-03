# Class: Interactivity

Defined in: [modules/engine/src/interactivity/interactivity.ts:128](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/interactivity/interactivity.ts#L128)

Deterministic, GPU-independent interpreter for a defined subset of KHR\_interactivity. Unsupported operations fail during construction; no graph is silently partially executed. A host supplies application properties through the property adapter.

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new Interactivity**(`definition`, `options?`): `Interactivity`

Defined in: [modules/engine/src/interactivity/interactivity.ts:152](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/interactivity/interactivity.ts#L152)

#### Parameters[​](#parameters "Direct link to Parameters")

##### definition[​](#definition "Direct link to definition")

[`InteractivityDefinition`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/InteractivityDefinition.md)

##### options?[​](#options "Direct link to options?")

[`InteractivityOptions`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/InteractivityOptions.md) = `{}`

#### Returns[​](#returns "Direct link to Returns")

`Interactivity`

## Properties[​](#properties "Direct link to Properties")

### definition[​](#definition-1 "Direct link to definition")

> `readonly` **definition**: [`InteractivityDefinition`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/InteractivityDefinition.md)

Defined in: [modules/engine/src/interactivity/interactivity.ts:132](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/interactivity/interactivity.ts#L132)

***

### graph[​](#graph "Direct link to graph")

> `readonly` **graph**: [`InteractivityGraph`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/InteractivityGraph.md)

Defined in: [modules/engine/src/interactivity/interactivity.ts:133](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/interactivity/interactivity.ts#L133)

***

### maxSteps[​](#maxsteps "Direct link to maxSteps")

> `readonly` **maxSteps**: `number`

Defined in: [modules/engine/src/interactivity/interactivity.ts:136](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/interactivity/interactivity.ts#L136)

***

### properties?[​](#properties-1 "Direct link to properties?")

> `readonly` `optional` **properties?**: [`InteractivityPropertyAdapter`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/InteractivityPropertyAdapter.md)

Defined in: [modules/engine/src/interactivity/interactivity.ts:135](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/interactivity/interactivity.ts#L135)

***

### variables[​](#variables "Direct link to variables")

> `readonly` **variables**: `unknown`\[]\[]

Defined in: [modules/engine/src/interactivity/interactivity.ts:134](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/interactivity/interactivity.ts#L134)

## Accessors[​](#accessors "Direct link to Accessors")

### graphCount[​](#graphcount "Direct link to graphCount")

#### Get Signature[​](#get-signature "Direct link to Get Signature")

> **get** **graphCount**(): `number`

Defined in: [modules/engine/src/interactivity/interactivity.ts:200](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/interactivity/interactivity.ts#L200)

##### Returns[​](#returns-1 "Direct link to Returns")

`number`

## Methods[​](#methods "Direct link to Methods")

### evaluate()[​](#evaluate "Direct link to evaluate()")

> **evaluate**(`index`, `socket?`, `visiting?`): `unknown`\[]

Defined in: [modules/engine/src/interactivity/interactivity.ts:286](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/interactivity/interactivity.ts#L286)

Evaluate a pure value socket. Values are component arrays as defined by the extension.

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### index[​](#index "Direct link to index")

`number`

##### socket?[​](#socket "Direct link to socket?")

`string` = `'value'`

##### visiting?[​](#visiting "Direct link to visiting?")

`Set`<`number`> = `...`

#### Returns[​](#returns-2 "Direct link to Returns")

`unknown`\[]

***

### flushPhysics()[​](#flushphysics "Direct link to flushPhysics()")

> **flushPhysics**(): `Promise`<`void`>

Defined in: [modules/engine/src/interactivity/interactivity.ts:590](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/interactivity/interactivity.ts#L590)

Await asynchronous physics query continuations before advancing the next simulation tick.

#### Returns[​](#returns-3 "Direct link to Returns")

`Promise`<`void`>

***

### getGraph()[​](#getgraph "Direct link to getGraph()")

> **getGraph**(`index`): [`InteractivityGraph`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/InteractivityGraph.md)

Defined in: [modules/engine/src/interactivity/interactivity.ts:204](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/interactivity/interactivity.ts#L204)

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### index[​](#index-1 "Direct link to index")

`number`

#### Returns[​](#returns-4 "Direct link to Returns")

[`InteractivityGraph`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/InteractivityGraph.md)

***

### getOperation()[​](#getoperation "Direct link to getOperation()")

> **getOperation**(`graphIndex`, `nodeIndex`): `string`

Defined in: [modules/engine/src/interactivity/interactivity.ts:210](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/interactivity/interactivity.ts#L210)

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### graphIndex[​](#graphindex "Direct link to graphIndex")

`number`

##### nodeIndex[​](#nodeindex "Direct link to nodeIndex")

`number`

#### Returns[​](#returns-5 "Direct link to Returns")

`string`

***

### notifyPhysicsTrigger()[​](#notifyphysicstrigger "Direct link to notifyPhysicsTrigger()")

> **notifyPhysicsTrigger**(`phase`, `triggerNode`, `colliderNode`, `motionNode`): `void`

Defined in: [modules/engine/src/interactivity/interactivity.ts:600](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/interactivity/interactivity.ts#L600)

Deliver simulation-step sensor events, including multiple events between rendering ticks.

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### phase[​](#phase "Direct link to phase")

`"enter"` | `"exit"`

##### triggerNode[​](#triggernode "Direct link to triggerNode")

`number`

##### colliderNode[​](#collidernode "Direct link to colliderNode")

`number`

##### motionNode[​](#motionnode "Direct link to motionNode")

`number`

#### Returns[​](#returns-6 "Direct link to Returns")

`void`

***

### selectNode()[​](#selectnode "Direct link to selectNode()")

> **selectNode**(`nodeIndex`): `void`

Defined in: [modules/engine/src/interactivity/interactivity.ts:626](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/interactivity/interactivity.ts#L626)

Dispatch selection of one source node; the host owns hit testing and selectability.

#### Parameters[​](#parameters-5 "Direct link to Parameters")

##### nodeIndex[​](#nodeindex-1 "Direct link to nodeIndex")

`number`

#### Returns[​](#returns-7 "Direct link to Returns")

`void`

***

### start()[​](#start "Direct link to start()")

> **start**(): `void`

Defined in: [modules/engine/src/interactivity/interactivity.ts:619](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/interactivity/interactivity.ts#L619)

Call once after host properties and scene objects are ready.

#### Returns[​](#returns-8 "Direct link to Returns")

`void`

***

### tick()[​](#tick "Direct link to tick()")

> **tick**(`timeSeconds`): `void`

Defined in: [modules/engine/src/interactivity/interactivity.ts:642](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/interactivity/interactivity.ts#L642)

Tick with elapsed seconds; the first tick has timeSinceStart=0 and delta=NaN.

#### Parameters[​](#parameters-6 "Direct link to Parameters")

##### timeSeconds[​](#timeseconds "Direct link to timeSeconds")

`number`

#### Returns[​](#returns-9 "Direct link to Returns")

`void`
