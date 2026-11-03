# Class: AreaLightController

Defined in: [modules/engine/src/scenegraph/controllers/area-light-controller.ts:31](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/area-light-controller.ts#L31)

Resolves visible area-light instances from the current scenegraph transforms.

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new AreaLightController**(`__namedParameters`): `AreaLightController`

Defined in: [modules/engine/src/scenegraph/controllers/area-light-controller.ts:36](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/area-light-controller.ts#L36)

#### Parameters[​](#parameters "Direct link to Parameters")

##### \_\_namedParameters[​](#__namedparameters "Direct link to __namedParameters")

[`AreaLightControllerProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/AreaLightControllerProps.md)

#### Returns[​](#returns "Direct link to Returns")

`AreaLightController`

## Methods[​](#methods "Direct link to Methods")

### destroy()[​](#destroy "Direct link to destroy()")

> **destroy**(): `void`

Defined in: [modules/engine/src/scenegraph/controllers/area-light-controller.ts:109](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/area-light-controller.ts#L109)

#### Returns[​](#returns-1 "Direct link to Returns")

`void`

***

### getLights()[​](#getlights "Direct link to getLights()")

> **getLights**(`sceneIndex?`): `AreaLight`\[]

Defined in: [modules/engine/src/scenegraph/controllers/area-light-controller.ts:56](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/area-light-controller.ts#L56)

Recompute after animation. Scale controls size uniformly and does not change emitting rotation.

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### sceneIndex?[​](#sceneindex "Direct link to sceneIndex?")

`number` = `0`

#### Returns[​](#returns-2 "Direct link to Returns")

`AreaLight`\[]
