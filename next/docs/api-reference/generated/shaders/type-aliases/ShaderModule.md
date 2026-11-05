# Type Alias: ShaderModule\<PropsT, UniformsT, BindingsT>

> **ShaderModule**<`PropsT`, `UniformsT`, `BindingsT`> = `object`

Defined in: [lib/shader-module/shader-module.ts:41](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-module.ts#L41)

A shader module definition object

## Note[​](#note "Direct link to Note")

Needs to be initialized with `initializeShaderModules`

## Note[​](#note-1 "Direct link to Note")

`UniformsT` & `BindingsT` are deduced from `PropsT` by default. If a custom type for `UniformsT` is used, `BindingsT` should be also be provided.

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### PropsT[​](#propst "Direct link to PropsT")

`PropsT` *extends* `Record`<`string`, `any`> = `Record`<`string`, `any`>

### UniformsT[​](#uniformst "Direct link to UniformsT")

`UniformsT` *extends* `Record`<`string`, [`ShaderModuleUniformValue`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderModuleUniformValue.md)> = `PickUniforms`<`PropsT`>

### BindingsT[​](#bindingst "Direct link to BindingsT")

`BindingsT` *extends* `Record`<`string`, `Binding`> = `PickBindings`<`PropsT`>

## Properties[​](#properties "Direct link to Properties")

### bindingLayout?[​](#bindinglayout "Direct link to bindingLayout?")

> `optional` **bindingLayout?**: readonly `ShaderModuleBindingLayout`\[]

Defined in: [lib/shader-module/shader-module.ts:53](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-module.ts#L53)

Logical bind-group assignment for bindings declared by this module

***

### bindings?[​](#bindings "Direct link to bindings?")

> `optional` **bindings?**: `BindingsT`

Defined in: [lib/shader-module/shader-module.ts:51](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-module.ts#L51)

Used for type inference, not currently used for values

***

### defaultUniforms?[​](#defaultuniforms "Direct link to defaultUniforms?")

> `optional` **defaultUniforms?**: `Required`<`UniformsT`>

Defined in: [lib/shader-module/shader-module.ts:76](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-module.ts#L76)

Default uniform values

***

### defines?[​](#defines "Direct link to defines?")

> `optional` **defines?**: `Record`<`string`, `boolean` | `number`>

Defined in: [lib/shader-module/shader-module.ts:85](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-module.ts#L85)

Boolean or numeric preprocessor defines contributed by this shader module.

***

### dependencies?[​](#dependencies "Direct link to dependencies?")

> `optional` **dependencies?**: `ShaderModule`<`any`, `any`>\[]

Defined in: [lib/shader-module/shader-module.ts:86](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-module.ts#L86)

***

### deprecations?[​](#deprecations "Direct link to deprecations?")

> `optional` **deprecations?**: `ShaderModuleDeprecation`\[]

Defined in: [lib/shader-module/shader-module.ts:88](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-module.ts#L88)

Information on deprecated properties

***

### firstBindingSlot?[​](#firstbindingslot "Direct link to firstBindingSlot?")

> `optional` **firstBindingSlot?**: `number`

Defined in: [lib/shader-module/shader-module.ts:55](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-module.ts#L55)

Preferred starting binding slot for this module's WGSL `@binding(auto)` declarations.

***

### fs?[​](#fs "Direct link to fs?")

> `optional` **fs?**: `string`

Defined in: [lib/shader-module/shader-module.ts:67](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-module.ts#L67)

GLSL fragment shader code

***

### getUniforms?[​](#getuniforms "Direct link to getUniforms?")

> `optional` **getUniforms?**: (`props`, `prevUniforms?`) => `Partial`<`UniformsT` & `BindingsT`>

Defined in: [lib/shader-module/shader-module.ts:79](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-module.ts#L79)

Function that maps props to uniforms & bindings

#### Parameters[​](#parameters "Direct link to Parameters")

##### props[​](#props "Direct link to props")

`Partial`<`PropsT`>

##### prevUniforms?[​](#prevuniforms "Direct link to prevUniforms?")

`UniformsT`

#### Returns[​](#returns "Direct link to Returns")

`Partial`<`UniformsT` & `BindingsT`>

***

### implements?[​](#implements "Direct link to implements?")

> `optional` **implements?**: `string`

Defined in: [lib/shader-module/shader-module.ts:60](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-module.ts#L60)

Exclusive named shader interface provided by this module.

***

### instance?[​](#instance "Direct link to instance?")

> `optional` **instance?**: `object`

Defined in: [lib/shader-module/shader-module.ts:91](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-module.ts#L91)

The instance field contains information that is generated at run-time

#### normalizedInjections[​](#normalizedinjections "Direct link to normalizedInjections")

> **normalizedInjections**: `object`

Empty compatibility value for consumers using older shadertools assembly.

##### normalizedInjections.fragment[​](#normalizedinjectionsfragment "Direct link to normalizedInjections.fragment")

> **fragment**: `Record`<`string`, [`ResolvedShaderInjection`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ResolvedShaderInjection.md)>

##### normalizedInjections.vertex[​](#normalizedinjectionsvertex "Direct link to normalizedInjections.vertex")

> **vertex**: `Record`<`string`, [`ResolvedShaderInjection`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ResolvedShaderInjection.md)>

#### parsedDeprecations[​](#parseddeprecations "Direct link to parsedDeprecations")

> **parsedDeprecations**: `ShaderModuleDeprecation`\[]

#### propValidators?[​](#propvalidators "Direct link to propValidators?")

> `optional` **propValidators?**: `Record`<`string`, `PropValidator`>

***

### name[​](#name "Direct link to name")

> **name**: `string`

Defined in: [lib/shader-module/shader-module.ts:57](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-module.ts#L57)

***

### props?[​](#props-1 "Direct link to props?")

> `optional` **props?**: `PropsT`

Defined in: [lib/shader-module/shader-module.ts:47](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-module.ts#L47)

Used for type inference not for values

***

### propTypes?[​](#proptypes "Direct link to propTypes?")

> `optional` **propTypes?**: `Record`\<keyof `UniformsT`, `UniformInfo`>

Defined in: [lib/shader-module/shader-module.ts:74](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-module.ts#L74)

Uniform JS prop types

***

### source?[​](#source "Direct link to source?")

> `optional` **source?**: `string`

Defined in: [lib/shader-module/shader-module.ts:65](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-module.ts#L65)

WGSL code, or reusable code in sourceLanguage combined with the application source.

***

### sourceLanguage?[​](#sourcelanguage "Direct link to sourceLanguage?")

> `optional` **sourceLanguage?**: `string`

Defined in: [lib/shader-module/shader-module.ts:63](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-module.ts#L63)

Language of source when an application-owned transpiler is required.

***

### uniforms?[​](#uniforms "Direct link to uniforms?")

> `optional` **uniforms?**: `UniformsT`

Defined in: [lib/shader-module/shader-module.ts:49](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-module.ts#L49)

Used for type inference, not currently used for values

***

### uniformTypes?[​](#uniformtypes "Direct link to uniformTypes?")

> `optional` **uniformTypes?**: `Required`<[`UniformTypes`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/UniformTypes.md)<`UniformsT`>>

Defined in: [lib/shader-module/shader-module.ts:72](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-module.ts#L72)

Uniform shader types @note: Both order and types MUST match uniform block declarations in shader

***

### vs?[​](#vs "Direct link to vs?")

> `optional` **vs?**: `string`

Defined in: [lib/shader-module/shader-module.ts:69](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-module.ts#L69)

GLSL vertex shader code
