# Type Alias: AnimationBinding

> **AnimationBinding** = `object`

Defined in: [modules/engine/src/animation/animation-track.ts:13](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-track.ts#L13)

Read/write connection between an animation track and an application property.

## Properties[​](#properties "Direct link to Properties")

### getValue?[​](#getvalue "Direct link to getValue?")

> `optional` **getValue?**: () => readonly `number`\[]

Defined in: [modules/engine/src/animation/animation-track.ts:17](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-track.ts#L17)

Reads the unanimated property value when an action has less than full influence.

#### Returns[​](#returns "Direct link to Returns")

readonly `number`\[]

***

### id?[​](#id "Direct link to id?")

> `optional` **id?**: `string`

Defined in: [modules/engine/src/animation/animation-track.ts:15](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-track.ts#L15)

Stable identity used to blend tracks that address the same property.

***

### setValue[​](#setvalue "Direct link to setValue")

> **setValue**: (`value`) => `void`

Defined in: [modules/engine/src/animation/animation-track.ts:19](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animation-track.ts#L19)

Applies an interpolated or blended property value.

#### Parameters[​](#parameters "Direct link to Parameters")

##### value[​](#value "Direct link to value")

`number`\[]

#### Returns[​](#returns-1 "Direct link to Returns")

`void`
