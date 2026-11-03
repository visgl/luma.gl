# Type Alias: ShaderTranspiler

> **ShaderTranspiler** = `object`

Defined in: [lib/shader-transpiler/shader-transpiler.ts:30](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-transpiler/shader-transpiler.ts#L30)

Application-owned compiler. Shaders has no dependency on its implementation.

## Properties[​](#properties "Direct link to Properties")

### name[​](#name "Direct link to name")

> **name**: `string`

Defined in: [lib/shader-transpiler/shader-transpiler.ts:31](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-transpiler/shader-transpiler.ts#L31)

***

### sourceLanguage[​](#sourcelanguage "Direct link to sourceLanguage")

> **sourceLanguage**: `string`

Defined in: [lib/shader-transpiler/shader-transpiler.ts:32](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-transpiler/shader-transpiler.ts#L32)

***

### transpile[​](#transpile "Direct link to transpile")

> **transpile**: (`props`) => [`ShaderTranspileResult`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderTranspileResult.md)

Defined in: [lib/shader-transpiler/shader-transpiler.ts:33](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-transpiler/shader-transpiler.ts#L33)

#### Parameters[​](#parameters "Direct link to Parameters")

##### props[​](#props "Direct link to props")

[`ShaderTranspileProps`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderTranspileProps.md)

#### Returns[​](#returns "Direct link to Returns")

[`ShaderTranspileResult`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderTranspileResult.md)
