# Function: deformPositions()

> **deformPositions**(`props`): `Float32Array`

Defined in: [modules/engine/src/animation/deform-positions.ts:8](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/deform-positions.ts#L8)

Explicit CPU snapshot for collision cooking/export. Rendering remains GPU driven.

## Parameters[​](#parameters "Direct link to Parameters")

### props[​](#props "Direct link to props")

#### influences?[​](#influences "Direct link to influences?")

readonly `object`\[]

#### jointMatrices?[​](#jointmatrices "Direct link to jointMatrices?")

readonly `Matrix4`\[]

#### positions[​](#positions "Direct link to positions")

`Float32Array`

#### targets?[​](#targets "Direct link to targets?")

readonly `Float32Array`<`ArrayBufferLike`>\[]

#### weights?[​](#weights "Direct link to weights?")

readonly `number`\[]

## Returns[​](#returns "Direct link to Returns")

`Float32Array`
