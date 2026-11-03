# Function: createAreaLightLTCTextures()

> **createAreaLightLTCTextures**(`device`): `object`

Defined in: [modules/engine/src/lighting/ltc-textures.ts:10](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/lighting/ltc-textures.ts#L10)

Creates caller-owned GGX LTC tables. Destroy once all models using the bindings are destroyed.

## Parameters[​](#parameters "Direct link to Parameters")

### device[​](#device "Direct link to device")

`Device`

## Returns[​](#returns "Direct link to Returns")

`object`

### bindings[​](#bindings "Direct link to bindings")

> **bindings**: `object`

#### bindings.areaLTCAmplitude[​](#bindingsarealtcamplitude "Direct link to bindings.areaLTCAmplitude")

> **areaLTCAmplitude**: `Texture` = `amplitude`

#### bindings.areaLTCMatrix[​](#bindingsarealtcmatrix "Direct link to bindings.areaLTCMatrix")

> **areaLTCMatrix**: `Texture` = `matrix`

### destroy()[​](#destroy "Direct link to destroy()")

> **destroy**(): `void`

#### Returns[​](#returns-1 "Direct link to Returns")

`void`
