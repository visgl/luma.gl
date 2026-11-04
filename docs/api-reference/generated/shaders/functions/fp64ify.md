# Function: fp64ify()

> **fp64ify**(`a`, `out?`, `startIndex?`): `NumericArray`

Defined in: [modules/math/fp64/fp64-utils.ts:14](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/math/fp64/fp64-utils.ts#L14)

Calculate WebGL 64 bit float

## Parameters[​](#parameters "Direct link to Parameters")

### a[​](#a "Direct link to a")

`number`

the input float number

### out?[​](#out "Direct link to out?")

`NumericArray` = `[]`

the output array. If not supplied, a new array is created.

### startIndex?[​](#startindex "Direct link to startIndex?")

`number` = `0`

the index in the output array to fill from. Default 0.

## Returns[​](#returns "Direct link to Returns")

`NumericArray`

* the fp64 representation of the input number
