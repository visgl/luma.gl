# Class: BillboardController

Defined in: [modules/engine/src/scenegraph/controllers/billboard-controller.ts:40](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/billboard-controller.ts#L40)

Camera-facing traversal over resolved scenegraph bindings.

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new BillboardController**(`props`): `BillboardController`

Defined in: [modules/engine/src/scenegraph/controllers/billboard-controller.ts:45](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/billboard-controller.ts#L45)

#### Parameters[​](#parameters "Direct link to Parameters")

##### props[​](#props "Direct link to props")

[`BillboardControllerProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/BillboardControllerProps.md)

#### Returns[​](#returns "Direct link to Returns")

`BillboardController`

## Methods[​](#methods "Direct link to Methods")

### destroy()[​](#destroy "Direct link to destroy()")

> **destroy**(): `void`

Defined in: [modules/engine/src/scenegraph/controllers/billboard-controller.ts:176](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/billboard-controller.ts#L176)

#### Returns[​](#returns-1 "Direct link to Returns")

`void`

***

### getDrawEntries()[​](#getdrawentries "Direct link to getDrawEntries()")

> **getDrawEntries**(`options`): [`BillboardDrawEntry`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/BillboardDrawEntry.md)\[]

Defined in: [modules/engine/src/scenegraph/controllers/billboard-controller.ts:61](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/billboard-controller.ts#L61)

Derive transforms after animation, without mutating source or runtime node matrices.

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### options[​](#options "Direct link to options")

###### cameraId?[​](#cameraid "Direct link to cameraId?")

`string`

###### sceneIndex?[​](#sceneindex "Direct link to sceneIndex?")

`number`

###### viewMatrix[​](#viewmatrix "Direct link to viewMatrix")

`NumericArray`

#### Returns[​](#returns-2 "Direct link to Returns")

[`BillboardDrawEntry`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/BillboardDrawEntry.md)\[]

***

### resetCamera()[​](#resetcamera "Direct link to resetCamera()")

> **resetCamera**(`cameraId?`): `void`

Defined in: [modules/engine/src/scenegraph/controllers/billboard-controller.ts:172](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/billboard-controller.ts#L172)

Reset reference depths when replacing a camera or detaching/re-attaching a scene.

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### cameraId?[​](#cameraid-1 "Direct link to cameraId?")

`string` = `'default'`

#### Returns[​](#returns-3 "Direct link to Returns")

`void`
