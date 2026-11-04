# Type Alias: BaseLightModelProps

> **BaseLightModelProps** = `Omit`<[`ModelProps`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/ModelProps.md), `"geometry"` | `"modules"` | `"shaderInputs"` | `"source"` | `"vs"` | `"fs"` | `"instanceCount"`> & `object`

Defined in: [modules/engine/src/models/light-model-utils.ts:27](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/models/light-model-utils.ts#L27)

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### bounds?[​](#bounds "Direct link to bounds?")

> `optional` **bounds?**: `LightModelBounds`

### lights[​](#lights "Direct link to lights")

> **lights**: `ReadonlyArray`<`Light`>

### markerScale?[​](#markerscale "Direct link to markerScale?")

> `optional` **markerScale?**: `number`

### projectionMatrix[​](#projectionmatrix "Direct link to projectionMatrix")

> **projectionMatrix**: `NumericArray`

### viewMatrix[​](#viewmatrix "Direct link to viewMatrix")

> **viewMatrix**: `NumericArray`
