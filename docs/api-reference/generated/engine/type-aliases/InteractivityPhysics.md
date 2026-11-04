# Type Alias: InteractivityPhysics

> **InteractivityPhysics** = `object`

Defined in: [modules/engine/src/interactivity/physics.ts:6](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/interactivity/physics.ts#L6)

Host physics contract for behavior graphs; independent of asset format and GPU backend.

## Methods[​](#methods "Direct link to Methods")

### applyImpulse()[​](#applyimpulse "Direct link to applyImpulse()")

> **applyImpulse**(`node`, `linear`, `angular`): `void`

Defined in: [modules/engine/src/interactivity/physics.ts:7](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/interactivity/physics.ts#L7)

#### Parameters[​](#parameters "Direct link to Parameters")

##### node[​](#node "Direct link to node")

`number`

##### linear[​](#linear "Direct link to linear")

readonly `number`\[]

##### angular[​](#angular "Direct link to angular")

readonly `number`\[]

#### Returns[​](#returns "Direct link to Returns")

`void`

***

### applyPointImpulse()[​](#applypointimpulse "Direct link to applyPointImpulse()")

> **applyPointImpulse**(`node`, `impulse`, `position`): `void`

Defined in: [modules/engine/src/interactivity/physics.ts:8](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/interactivity/physics.ts#L8)

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### node[​](#node-1 "Direct link to node")

`number`

##### impulse[​](#impulse "Direct link to impulse")

readonly `number`\[]

##### position[​](#position "Direct link to position")

readonly `number`\[]

#### Returns[​](#returns-1 "Direct link to Returns")

`void`

***

### isTriggerNode()[​](#istriggernode "Direct link to isTriggerNode()")

> **isTriggerNode**(`node`): `boolean`

Defined in: [modules/engine/src/interactivity/physics.ts:18](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/interactivity/physics.ts#L18)

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### node[​](#node-2 "Direct link to node")

`number`

#### Returns[​](#returns-2 "Direct link to Returns")

`boolean`

***

### rayCast()[​](#raycast "Direct link to rayCast()")

> **rayCast**(`start`, `end`, `filter`): `Promise`<{ `fraction`: `number`; `node`: `number`; `normal`: readonly `number`\[]; } | `null`>

Defined in: [modules/engine/src/interactivity/physics.ts:9](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/interactivity/physics.ts#L9)

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### start[​](#start "Direct link to start")

readonly `number`\[]

##### end[​](#end "Direct link to end")

readonly `number`\[]

##### filter[​](#filter "Direct link to filter")

`number`

#### Returns[​](#returns-3 "Direct link to Returns")

`Promise`<{ `fraction`: `number`; `node`: `number`; `normal`: readonly `number`\[]; } | `null`>
