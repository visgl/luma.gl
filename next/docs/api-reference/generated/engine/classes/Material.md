# Class: Material\<TModuleProps, TBindings>

Defined in: [modules/engine/src/material/material.ts:84](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/material/material.ts#L84)

Material owns bind group `3` resources and uniforms for one material instance.

`setProps()` mutates uniform values in place. Structural resource changes are expressed through `clone({...})`, which creates a new material identity.

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### TModuleProps[​](#tmoduleprops "Direct link to TModuleProps")

`TModuleProps` *extends* `MaterialModuleProps` = `MaterialModuleProps`

### TBindings[​](#tbindings "Direct link to TBindings")

`TBindings` *extends* `MaterialBindings` = `MaterialBindings`

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new Material**<`TModuleProps`, `TBindings`>(`device`, `props?`): `Material`<`TModuleProps`, `TBindings`>

Defined in: [modules/engine/src/material/material.ts:103](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/material/material.ts#L103)

#### Parameters[​](#parameters "Direct link to Parameters")

##### device[​](#device "Direct link to device")

`Device`

##### props?[​](#props "Direct link to props?")

[`MaterialProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/MaterialProps.md)<`TModuleProps`, `TBindings`> = `{}`

#### Returns[​](#returns "Direct link to Returns")

`Material`<`TModuleProps`, `TBindings`>

## Properties[​](#properties "Direct link to Properties")

### bindings[​](#bindings "Direct link to bindings")

> `readonly` **bindings**: `Record`<`string`, `MaterialBinding`> = `{}`

Defined in: [modules/engine/src/material/material.ts:97](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/material/material.ts#L97)

Internal binding store including uniform buffers and resource bindings.

***

### device[​](#device-1 "Direct link to device")

> `readonly` **device**: `Device`

Defined in: [modules/engine/src/material/material.ts:91](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/material/material.ts#L91)

Device that owns the material resources.

***

### factory[​](#factory "Direct link to factory")

> `readonly` **factory**: [`MaterialFactory`](https://luma.gl/next/docs/api-reference/generated/engine/classes/MaterialFactory.md)<`TModuleProps`, `TBindings`>

Defined in: [modules/engine/src/material/material.ts:93](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/material/material.ts#L93)

Factory that defines the material schema.

***

### id[​](#id "Direct link to id")

> `readonly` **id**: `string`

Defined in: [modules/engine/src/material/material.ts:89](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/material/material.ts#L89)

Application-provided identifier.

***

### shaderInputs[​](#shaderinputs "Direct link to shaderInputs")

> `readonly` **shaderInputs**: [`ShaderInputs`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderInputs.md)<`TModuleProps`>

Defined in: [modules/engine/src/material/material.ts:95](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/material/material.ts#L95)

Shader inputs for the material-owned modules.

## Methods[​](#methods "Direct link to Methods")

### clone()[​](#clone "Direct link to clone()")

> **clone**(`props?`): `Material`<`TModuleProps`, `TBindings`>

Defined in: [modules/engine/src/material/material.ts:141](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/material/material.ts#L141)

Creates a new material variant with optional structural and uniform overrides.

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### props?[​](#props-1 "Direct link to props?")

`MaterialCloneProps`<`TModuleProps`, `TBindings`> = `{}`

#### Returns[​](#returns-1 "Direct link to Returns")

`Material`<`TModuleProps`, `TBindings`>

***

### destroy()[​](#destroy "Direct link to destroy()")

> **destroy**(): `void`

Defined in: [modules/engine/src/material/material.ts:136](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/material/material.ts#L136)

Destroys managed uniform-buffer resources owned by this material.

#### Returns[​](#returns-2 "Direct link to Returns")

`void`

***

### getBindGroupCacheKey()[​](#getbindgroupcachekey "Direct link to getBindGroupCacheKey()")

> **getBindGroupCacheKey**(`group`): `object` | `null`

Defined in: [modules/engine/src/material/material.ts:248](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/material/material.ts#L248)

Returns the stable bind-group cache token for the requested bind group.

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### group[​](#group "Direct link to group")

`number`

#### Returns[​](#returns-3 "Direct link to Returns")

`object` | `null`

***

### getBindings()[​](#getbindings "Direct link to getBindings()")

> **getBindings**(`shaderLayout?`): `Partial`<{ \[K in string | number | symbol]: Binding }> & `Record`<`string`, `Binding`>

Defined in: [modules/engine/src/material/material.ts:209](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/material/material.ts#L209)

Returns resolved bindings, including internal uniform buffers and ready texture sources.

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### shaderLayout?[​](#shaderlayout "Direct link to shaderLayout?")

`AnyShaderLayout` = `...`

Reflected bindings used to select copied or external texture resolution.

#### Returns[​](#returns-4 "Direct link to Returns")

`Partial`<{ \[K in string | number | symbol]: Binding }> & `Record`<`string`, `Binding`>

***

### getBindingsByGroup()[​](#getbindingsbygroup "Direct link to getBindingsByGroup()")

> **getBindingsByGroup**(`shaderLayout?`): `BindingsByGroup`

Defined in: [modules/engine/src/material/material.ts:243](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/material/material.ts#L243)

Packages resolved material bindings into logical bind group `3`.

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### shaderLayout?[​](#shaderlayout-1 "Direct link to shaderLayout?")

`AnyShaderLayout` = `...`

Reflected bindings used to select copied or external texture resolution.

#### Returns[​](#returns-5 "Direct link to Returns")

`BindingsByGroup`

***

### getBindingsUpdateTimestamp()[​](#getbindingsupdatetimestamp "Direct link to getBindingsUpdateTimestamp()")

> **getBindingsUpdateTimestamp**(): `number`

Defined in: [modules/engine/src/material/material.ts:254](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/material/material.ts#L254)

Returns the latest update timestamp across material-owned resources.

#### Returns[​](#returns-6 "Direct link to Returns")

`number`

***

### getResourceBindings()[​](#getresourcebindings "Direct link to getResourceBindings()")

> **getResourceBindings**(): `Partial`<`TBindings`>

Defined in: [modules/engine/src/material/material.ts:193](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/material/material.ts#L193)

Returns the material-owned resource bindings without internal uniform buffers.

#### Returns[​](#returns-7 "Direct link to Returns")

`Partial`<`TBindings`>

***

### ownsBinding()[​](#ownsbinding "Direct link to ownsBinding()")

> **ownsBinding**(`bindingName`): `boolean`

Defined in: [modules/engine/src/material/material.ts:164](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/material/material.ts#L164)

Returns `true` if this material owns the supplied binding name.

#### Parameters[​](#parameters-5 "Direct link to Parameters")

##### bindingName[​](#bindingname "Direct link to bindingName")

`string`

#### Returns[​](#returns-8 "Direct link to Returns")

`boolean`

***

### ownsModule()[​](#ownsmodule "Direct link to ownsModule()")

> **ownsModule**(`moduleName`): `boolean`

Defined in: [modules/engine/src/material/material.ts:169](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/material/material.ts#L169)

Returns `true` if this material owns the supplied shader module.

#### Parameters[​](#parameters-6 "Direct link to Parameters")

##### moduleName[​](#modulename "Direct link to moduleName")

`string`

#### Returns[​](#returns-9 "Direct link to Returns")

`boolean`

***

### setProps()[​](#setprops "Direct link to setProps()")

> **setProps**(`props`): `void`

Defined in: [modules/engine/src/material/material.ts:174](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/material/material.ts#L174)

Updates material uniform/module props in place without changing material identity.

#### Parameters[​](#parameters-7 "Direct link to Parameters")

##### props[​](#props-2 "Direct link to props")

`MaterialPropsUpdate`<`TModuleProps`>

#### Returns[​](#returns-10 "Direct link to Returns")

`void`

***

### updateShaderInputs()[​](#updateshaderinputs "Direct link to updateShaderInputs()")

> **updateShaderInputs**(`commandEncoder?`): `void`

Defined in: [modules/engine/src/material/material.ts:184](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/material/material.ts#L184)

Updates managed uniform buffers and shader-input-owned bindings.

#### Parameters[​](#parameters-8 "Direct link to Parameters")

##### commandEncoder?[​](#commandencoder "Direct link to commandEncoder?")

`CommandEncoder`

Optional encoder used to order material uniform uploads with subsequent draw commands.

#### Returns[​](#returns-11 "Direct link to Returns")

`void`
