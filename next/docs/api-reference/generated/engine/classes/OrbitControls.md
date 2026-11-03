# Class: OrbitControls

Defined in: [modules/engine/src/controls/orbit-controls.ts:66](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/controls/orbit-controls.ts#L66)

Pointer orbit, optional pinch roll, wheel and pinch zoom, and automatic rotation controls.

Call [update](#update) once per frame with an animation-loop timestamp in milliseconds before reading [getEyePosition](#geteyeposition). Manual dragging temporarily pauses automatic rotation and resumes it from the new angle when the pointer is released.

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new OrbitControls**(`canvas`, `props?`): `OrbitControls`

Defined in: [modules/engine/src/controls/orbit-controls.ts:83](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/controls/orbit-controls.ts#L83)

#### Parameters[​](#parameters "Direct link to Parameters")

##### canvas[​](#canvas "Direct link to canvas")

`HTMLCanvasElement`

##### props?[​](#props "Direct link to props?")

[`OrbitControlsProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/OrbitControlsProps.md) = `{}`

#### Returns[​](#returns "Direct link to Returns")

`OrbitControls`

## Properties[​](#properties "Direct link to Properties")

### canvas[​](#canvas-1 "Direct link to canvas")

> `readonly` **canvas**: `HTMLCanvasElement`

Defined in: [modules/engine/src/controls/orbit-controls.ts:67](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/controls/orbit-controls.ts#L67)

***

### distance[​](#distance "Direct link to distance")

> **distance**: `number`

Defined in: [modules/engine/src/controls/orbit-controls.ts:72](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/controls/orbit-controls.ts#L72)

***

### pitch[​](#pitch "Direct link to pitch")

> **pitch**: `number`

Defined in: [modules/engine/src/controls/orbit-controls.ts:70](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/controls/orbit-controls.ts#L70)

***

### props[​](#props-1 "Direct link to props")

> `readonly` **props**: `ResolvedOrbitControlsProps`

Defined in: [modules/engine/src/controls/orbit-controls.ts:68](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/controls/orbit-controls.ts#L68)

***

### roll[​](#roll "Direct link to roll")

> **roll**: `number`

Defined in: [modules/engine/src/controls/orbit-controls.ts:71](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/controls/orbit-controls.ts#L71)

***

### yaw[​](#yaw "Direct link to yaw")

> **yaw**: `number`

Defined in: [modules/engine/src/controls/orbit-controls.ts:69](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/controls/orbit-controls.ts#L69)

## Methods[​](#methods "Direct link to Methods")

### destroy()[​](#destroy "Direct link to destroy()")

> **destroy**(): `void`

Defined in: [modules/engine/src/controls/orbit-controls.ts:209](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/controls/orbit-controls.ts#L209)

#### Returns[​](#returns-1 "Direct link to Returns")

`void`

***

### getEyePosition()[​](#geteyeposition "Direct link to getEyePosition()")

> **getEyePosition**(): [`OrbitPosition`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/OrbitPosition.md)

Defined in: [modules/engine/src/controls/orbit-controls.ts:124](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/controls/orbit-controls.ts#L124)

Returns the current camera eye around the configured target.

#### Returns[​](#returns-2 "Direct link to Returns")

[`OrbitPosition`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/OrbitPosition.md)

***

### getUpDirection()[​](#getupdirection "Direct link to getUpDirection()")

> **getUpDirection**(): [`OrbitPosition`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/OrbitPosition.md)

Defined in: [modules/engine/src/controls/orbit-controls.ts:134](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/controls/orbit-controls.ts#L134)

Returns the camera up direction after applying pitch and optional two-finger roll.

#### Returns[​](#returns-3 "Direct link to Returns")

[`OrbitPosition`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/OrbitPosition.md)

***

### reset()[​](#reset "Direct link to reset()")

> **reset**(): `void`

Defined in: [modules/engine/src/controls/orbit-controls.ts:198](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/controls/orbit-controls.ts#L198)

Restores the configured starting orbit, roll, and zoom.

#### Returns[​](#returns-4 "Direct link to Returns")

`void`

***

### setAutoRotate()[​](#setautorotate "Direct link to setAutoRotate()")

> **setAutoRotate**(`autoRotate`): `void`

Defined in: [modules/engine/src/controls/orbit-controls.ts:162](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/controls/orbit-controls.ts#L162)

Enables or pauses automatic rotation without losing the current manual angle.

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### autoRotate[​](#autorotate "Direct link to autoRotate")

`boolean`

#### Returns[​](#returns-5 "Direct link to Returns")

`void`

***

### setProps()[​](#setprops "Direct link to setProps()")

> **setProps**(`props`): `void`

Defined in: [modules/engine/src/controls/orbit-controls.ts:167](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/controls/orbit-controls.ts#L167)

Updates orbit configuration and applies supplied camera state immediately.

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### props[​](#props-2 "Direct link to props")

[`OrbitControlsProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/OrbitControlsProps.md)

#### Returns[​](#returns-6 "Direct link to Returns")

`void`

***

### update()[​](#update "Direct link to update()")

> **update**(`timeMilliseconds`): `void`

Defined in: [modules/engine/src/controls/orbit-controls.ts:107](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/controls/orbit-controls.ts#L107)

Advances optional auto-rotation using an animation-loop timestamp in milliseconds.

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### timeMilliseconds[​](#timemilliseconds "Direct link to timeMilliseconds")

`number`

#### Returns[​](#returns-7 "Direct link to Returns")

`void`
