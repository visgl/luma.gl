# Function: selectAudioEnvironmentZone()

> **selectAudioEnvironmentZone**(`zones`, `position`): { `environment`: `number`; `outsideEnvironment?`: `number`; `weight`: `number`; } | `undefined`

Defined in: [modules/engine/src/audio/audio-environment.ts:17](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/audio/audio-environment.ts#L17)

Select the listener's zone; equal priority favors the smallest transformed volume.

## Parameters[​](#parameters "Direct link to Parameters")

### zones[​](#zones "Direct link to zones")

readonly [`AudioEnvironmentZone`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/AudioEnvironmentZone.md)\[]

### position[​](#position "Direct link to position")

`ArrayLike`<`number`>

## Returns[​](#returns "Direct link to Returns")

{ `environment`: `number`; `outsideEnvironment?`: `number`; `weight`: `number`; } | `undefined`
