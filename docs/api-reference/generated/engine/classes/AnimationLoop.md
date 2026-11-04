# Class: AnimationLoop

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:65](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L65)

Convenient animation loop

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new AnimationLoop**(`props`): `AnimationLoop`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:114](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L114)

#### Parameters[​](#parameters "Direct link to Parameters")

##### props[​](#props "Direct link to props")

[`AnimationLoopProps`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/AnimationLoopProps.md)

#### Returns[​](#returns "Direct link to Returns")

`AnimationLoop`

## Properties[​](#properties "Direct link to Properties")

### \_animationFrameId[​](#_animationframeid "Direct link to _animationFrameId")

> **\_animationFrameId**: `any` = `null`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:104](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L104)

***

### \_cpuStartTime[​](#_cpustarttime "Direct link to _cpuStartTime")

> **\_cpuStartTime**: `number` = `0`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:107](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L107)

***

### \_error[​](#_error "Direct link to _error")

> **\_error**: `Error` | `null` = `null`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:108](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L108)

***

### \_initialized[​](#_initialized "Direct link to _initialized")

> **\_initialized**: `boolean` = `false`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:102](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L102)

***

### \_lastFrameTime[​](#_lastframetime "Direct link to _lastFrameTime")

> **\_lastFrameTime**: `number` = `0`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:109](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L109)

***

### \_nextFramePromise[​](#_nextframepromise "Direct link to _nextFramePromise")

> **\_nextFramePromise**: `Promise`<`AnimationLoop`> | `null` = `null`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:105](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L105)

***

### \_resolveNextFrame[​](#_resolvenextframe "Direct link to _resolveNextFrame")

> **\_resolveNextFrame**: ((`animationLoop`) => `void`) | `null` = `null`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:106](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L106)

***

### \_running[​](#_running "Direct link to _running")

> **\_running**: `boolean` = `false`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:103](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L103)

***

### animationProps[​](#animationprops "Direct link to animationProps")

> **animationProps**: [`AnimationProps`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/AnimationProps.md) | `null` = `null`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:90](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L90)

***

### canvas[​](#canvas "Direct link to canvas")

> **canvas**: `OffscreenCanvas` | `HTMLCanvasElement` | `null` = `null`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:87](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L87)

***

### cpuTime[​](#cputime "Direct link to cpuTime")

> **cpuTime**: `Stat`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:94](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L94)

***

### device[​](#device "Direct link to device")

> **device**: `Device` | `null` = `null`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:86](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L86)

***

### display[​](#display "Direct link to display")

> **display**: `any`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:98](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L98)

***

### frameRate[​](#framerate "Direct link to frameRate")

> **frameRate**: `Stat`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:96](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L96)

***

### gpuTime[​](#gputime "Direct link to gpuTime")

> **gpuTime**: `Stat`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:95](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L95)

***

### props[​](#props-1 "Direct link to props")

> **props**: `ResolvedAnimationLoopProps`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:89](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L89)

***

### sharedStats[​](#sharedstats "Direct link to sharedStats")

> **sharedStats**: `Stats`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:93](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L93)

***

### stats[​](#stats "Direct link to stats")

> **stats**: `Stats`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:92](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L92)

***

### timeline[​](#timeline "Direct link to timeline")

> **timeline**: [`Timeline`](https://luma.gl/docs/api-reference/generated/engine/classes/Timeline.md) | `null` = `null`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:91](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L91)

***

### defaultAnimationLoopProps[​](#defaultanimationloopprops "Direct link to defaultAnimationLoopProps")

> `static` **defaultAnimationLoopProps**: `object`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:66](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L66)

#### animationFrameProvider[​](#animationframeprovider "Direct link to animationFrameProvider")

> `readonly` **animationFrameProvider**: [`AnimationFrameProvider`](https://luma.gl/docs/api-reference/generated/engine/interfaces/AnimationFrameProvider.md) = `defaultAnimationFrameProvider`

#### autoResizeViewport[​](#autoresizeviewport "Direct link to autoResizeViewport")

> `readonly` **autoResizeViewport**: `false` = `false`

#### device[​](#device-1 "Direct link to device")

> `readonly` **device**: `never`

#### mobileQuality[​](#mobilequality "Direct link to mobileQuality")

> `readonly` **mobileQuality**: `undefined` = `undefined`

#### onAddHTML[​](#onaddhtml "Direct link to onAddHTML")

> `readonly` **onAddHTML**: () => `string`

##### Returns[​](#returns-1 "Direct link to Returns")

`string`

#### onError[​](#onerror "Direct link to onError")

> `readonly` **onError**: (`error`) => `void`

##### Parameters[​](#parameters-1 "Direct link to Parameters")

###### error[​](#error "Direct link to error")

`Error`

##### Returns[​](#returns-2 "Direct link to Returns")

`void`

#### onFinalize[​](#onfinalize "Direct link to onFinalize")

> `readonly` **onFinalize**: () => `void`

##### Returns[​](#returns-3 "Direct link to Returns")

`void`

#### onInitialize[​](#oninitialize "Direct link to onInitialize")

> `readonly` **onInitialize**: () => `Promise`<`null`>

##### Returns[​](#returns-4 "Direct link to Returns")

`Promise`<`null`>

#### onRender[​](#onrender "Direct link to onRender")

> `readonly` **onRender**: () => `void`

##### Returns[​](#returns-5 "Direct link to Returns")

`void`

#### stats[​](#stats-1 "Direct link to stats")

> `readonly` **stats**: `never`

## Methods[​](#methods "Direct link to Methods")

### \_animationFrame()[​](#_animationframe "Direct link to _animationFrame()")

> **\_animationFrame**(`time`, `animationFrame?`): `void`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:373](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L373)

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### time[​](#time "Direct link to time")

`number`

##### animationFrame?[​](#animationframe "Direct link to animationFrame?")

`unknown`

#### Returns[​](#returns-6 "Direct link to Returns")

`void`

***

### \_beginFrameTimers()[​](#_beginframetimers "Direct link to _beginFrameTimers()")

> **\_beginFrameTimers**(`time?`): `void`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:561](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L561)

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### time?[​](#time-1 "Direct link to time?")

`number`

#### Returns[​](#returns-7 "Direct link to Returns")

`void`

***

### \_cancelAnimationFrame()[​](#_cancelanimationframe "Direct link to _cancelAnimationFrame()")

> **\_cancelAnimationFrame**(): `void`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:364](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L364)

#### Returns[​](#returns-8 "Direct link to Returns")

`void`

***

### \_clearNeedsRedraw()[​](#_clearneedsredraw "Direct link to _clearNeedsRedraw()")

> **\_clearNeedsRedraw**(): `void`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:406](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L406)

#### Returns[​](#returns-9 "Direct link to Returns")

`void`

***

### \_consumeEncodedGpuTime()[​](#_consumeencodedgputime "Direct link to _consumeEncodedGpuTime()")

> **\_consumeEncodedGpuTime**(): `void`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:587](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L587)

#### Returns[​](#returns-10 "Direct link to Returns")

`void`

***

### \_createInfoDiv()[​](#_createinfodiv "Direct link to _createInfoDiv()")

> **\_createInfoDiv**(): `void`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:510](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L510)

#### Returns[​](#returns-11 "Direct link to Returns")

`void`

***

### \_endFrameTimers()[​](#_endframetimers "Direct link to _endFrameTimers()")

> **\_endFrameTimers**(): `void`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:578](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L578)

#### Returns[​](#returns-12 "Direct link to Returns")

`void`

***

### \_getAnimationProps()[​](#_getanimationprops "Direct link to _getAnimationProps()")

> **\_getAnimationProps**(): [`AnimationProps`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/AnimationProps.md)

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:456](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L456)

#### Returns[​](#returns-13 "Direct link to Returns")

[`AnimationProps`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/AnimationProps.md)

***

### \_getSizeAndAspect()[​](#_getsizeandaspect "Direct link to _getSizeAndAspect()")

> **\_getSizeAndAspect**(): `object`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:532](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L532)

#### Returns[​](#returns-14 "Direct link to Returns")

`object`

##### aspect[​](#aspect "Direct link to aspect")

> **aspect**: `number`

##### height[​](#height "Direct link to height")

> **height**: `number`

##### width[​](#width "Direct link to width")

> **width**: `number`

***

### \_initDevice()[​](#_initdevice "Direct link to _initDevice()")

> **\_initDevice**(): `Promise`<`void`>

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:501](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L501)

Wait for supplied device

#### Returns[​](#returns-15 "Direct link to Returns")

`Promise`<`void`>

***

### \_initialize()[​](#_initialize "Direct link to _initialize()")

> **\_initialize**(): `void`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:327](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L327)

#### Returns[​](#returns-16 "Direct link to Returns")

`void`

***

### \_initializeAnimationProps()[​](#_initializeanimationprops "Direct link to _initializeAnimationProps()")

> **\_initializeAnimationProps**(): `void`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:415](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L415)

#### Returns[​](#returns-17 "Direct link to Returns")

`void`

***

### \_onMouseleave()[​](#_onmouseleave "Direct link to _onMouseleave()")

> **\_onMouseleave**(`event`): `void`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:648](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L648)

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### event[​](#event "Direct link to event")

`Event`

#### Returns[​](#returns-18 "Direct link to Returns")

`void`

***

### \_onMousemove()[​](#_onmousemove "Direct link to _onMousemove()")

> **\_onMousemove**(`event`): `void`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:642](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L642)

#### Parameters[​](#parameters-5 "Direct link to Parameters")

##### event[​](#event-1 "Direct link to event")

`Event`

#### Returns[​](#returns-19 "Direct link to Returns")

`void`

***

### \_renderFrame()[​](#_renderframe "Direct link to _renderFrame()")

> **\_renderFrame**(`animationProps`): `void`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:389](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L389)

#### Parameters[​](#parameters-6 "Direct link to Parameters")

##### animationProps[​](#animationprops-1 "Direct link to animationProps")

[`AnimationProps`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/AnimationProps.md)

#### Returns[​](#returns-20 "Direct link to Returns")

`void`

***

### \_requestAnimationFrame()[​](#_requestanimationframe "Direct link to _requestAnimationFrame()")

> **\_requestAnimationFrame**(): `void`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:354](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L354)

#### Returns[​](#returns-21 "Direct link to Returns")

`void`

***

### ~~\_resizeViewport()~~[​](#_resizeviewport "Direct link to _resizeviewport")

> **\_resizeViewport**(): `void`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:545](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L545)

#### Returns[​](#returns-22 "Direct link to Returns")

`void`

#### Deprecated[​](#deprecated "Direct link to Deprecated")

Default viewport setup

***

### \_setDisplay()[​](#_setdisplay "Direct link to _setDisplay()")

> **\_setDisplay**(`display`): `void`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:340](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L340)

#### Parameters[​](#parameters-7 "Direct link to Parameters")

##### display[​](#display-1 "Direct link to display")

`any`

#### Returns[​](#returns-23 "Direct link to Returns")

`void`

***

### \_setupFrame()[​](#_setupframe "Direct link to _setupFrame()")

> **\_setupFrame**(): `void`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:410](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L410)

#### Returns[​](#returns-24 "Direct link to Returns")

`void`

***

### \_startEventHandling()[​](#_starteventhandling "Direct link to _startEventHandling()")

> **\_startEventHandling**(): `void`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:629](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L629)

#### Returns[​](#returns-25 "Direct link to Returns")

`void`

***

### \_stopEventHandling()[​](#_stopeventhandling "Direct link to _stopEventHandling()")

> **\_stopEventHandling**(): `void`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:636](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L636)

#### Returns[​](#returns-26 "Direct link to Returns")

`void`

***

### \_updateAnimationProps()[​](#_updateanimationprops "Direct link to _updateAnimationProps()")

> **\_updateAnimationProps**(): `void`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:464](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L464)

#### Returns[​](#returns-27 "Direct link to Returns")

`void`

***

### \_updateSharedStats()[​](#_updatesharedstats "Direct link to _updateSharedStats()")

> **\_updateSharedStats**(): `void`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:599](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L599)

#### Returns[​](#returns-28 "Direct link to Returns")

`void`

***

### attachTimeline()[​](#attachtimeline "Direct link to attachTimeline()")

> **attachTimeline**(`timeline`): [`Timeline`](https://luma.gl/docs/api-reference/generated/engine/classes/Timeline.md)

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:293](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L293)

Add a timeline, it will be automatically updated by the animation loop.

#### Parameters[​](#parameters-8 "Direct link to Parameters")

##### timeline[​](#timeline-1 "Direct link to timeline")

[`Timeline`](https://luma.gl/docs/api-reference/generated/engine/classes/Timeline.md)

#### Returns[​](#returns-29 "Direct link to Returns")

[`Timeline`](https://luma.gl/docs/api-reference/generated/engine/classes/Timeline.md)

***

### ~~delete()~~[​](#delete "Direct link to delete")

> **delete**(): `void`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:151](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L151)

#### Returns[​](#returns-30 "Direct link to Returns")

`void`

#### Deprecated[​](#deprecated-1 "Direct link to Deprecated")

Use .destroy()

***

### destroy()[​](#destroy "Direct link to destroy()")

> **destroy**(): `void`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:143](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L143)

#### Returns[​](#returns-31 "Direct link to Returns")

`void`

***

### detachTimeline()[​](#detachtimeline "Direct link to detachTimeline()")

> **detachTimeline**(): `void`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:299](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L299)

Remove a timeline

#### Returns[​](#returns-32 "Direct link to Returns")

`void`

***

### needsRedraw()[​](#needsredraw "Direct link to needsRedraw()")

> **needsRedraw**(): `string` | `false`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:174](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L174)

Query redraw status. Clears the flag.

#### Returns[​](#returns-33 "Direct link to Returns")

`string` | `false`

***

### redraw()[​](#redraw "Direct link to redraw()")

> **redraw**(`time?`, `animationFrame?`): `this`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:263](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L263)

Explicitly draw a frame

#### Parameters[​](#parameters-9 "Direct link to Parameters")

##### time?[​](#time-2 "Direct link to time?")

`number`

##### animationFrame?[​](#animationframe-1 "Direct link to animationFrame?")

`unknown` = `null`

#### Returns[​](#returns-34 "Direct link to Returns")

`this`

***

### reportError()[​](#reporterror "Direct link to reportError()")

> **reportError**(`error`): `void`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:155](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L155)

#### Parameters[​](#parameters-10 "Direct link to Parameters")

##### error[​](#error-1 "Direct link to error")

`Error`

#### Returns[​](#returns-35 "Direct link to Returns")

`void`

***

### setNeedsRedraw()[​](#setneedsredraw "Direct link to setNeedsRedraw()")

> **setNeedsRedraw**(`reason`): `this`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:168](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L168)

Flags this animation loop as needing redraw

#### Parameters[​](#parameters-11 "Direct link to Parameters")

##### reason[​](#reason "Direct link to reason")

`string`

#### Returns[​](#returns-36 "Direct link to Returns")

`this`

***

### setProps()[​](#setprops "Direct link to setProps()")

> **setProps**(`props`): `this`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:180](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L180)

#### Parameters[​](#parameters-12 "Direct link to Parameters")

##### props[​](#props-2 "Direct link to props")

`MutableAnimationLoopProps`

#### Returns[​](#returns-37 "Direct link to Returns")

`this`

***

### start()[​](#start "Direct link to start()")

> **start**(): `Promise`<`AnimationLoop` | `null`>

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:201](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L201)

Starts a render loop if not already running

#### Returns[​](#returns-38 "Direct link to Returns")

`Promise`<`AnimationLoop` | `null`>

***

### stop()[​](#stop "Direct link to stop()")

> **stop**(): `AnimationLoop`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:244](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L244)

Stops a render loop if already running, finalizing

#### Returns[​](#returns-39 "Direct link to Returns")

`AnimationLoop`

***

### toDataURL()[​](#todataurl "Direct link to toDataURL()")

> **toDataURL**(): `Promise`<`string`>

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:316](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L316)

TODO - should use device.deviceContext

#### Returns[​](#returns-40 "Direct link to Returns")

`Promise`<`string`>

***

### waitForRender()[​](#waitforrender "Direct link to waitForRender()")

> **waitForRender**(): `Promise`<`AnimationLoop`>

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:304](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L304)

Wait until a render completes

#### Returns[​](#returns-41 "Direct link to Returns")

`Promise`<`AnimationLoop`>
