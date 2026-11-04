# Type Alias: MaterialProps\<TModuleProps, TBindings>

> **MaterialProps**<`TModuleProps`, `TBindings`> = `object`

Defined in: [modules/engine/src/material/material.ts:47](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/material/material.ts#L47)

Construction props for one typed [Material](https://luma.gl/docs/api-reference/generated/engine/classes/Material.md).

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### TModuleProps[​](#tmoduleprops "Direct link to TModuleProps")

`TModuleProps` *extends* `MaterialModuleProps` = `MaterialModuleProps`

### TBindings[​](#tbindings "Direct link to TBindings")

`TBindings` *extends* `MaterialBindings` = `MaterialBindings`

## Properties[​](#properties "Direct link to Properties")

### bindings?[​](#bindings "Direct link to bindings?")

> `optional` **bindings?**: `Partial`<`TBindings`>

Defined in: [modules/engine/src/material/material.ts:60](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/material/material.ts#L60)

Initial material-owned resource bindings.

***

### factory?[​](#factory "Direct link to factory?")

> `optional` **factory?**: [`MaterialFactory`](https://luma.gl/docs/api-reference/generated/engine/classes/MaterialFactory.md)<`TModuleProps`, `TBindings`>

Defined in: [modules/engine/src/material/material.ts:54](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/material/material.ts#L54)

Factory that owns the material schema.

***

### id?[​](#id "Direct link to id?")

> `optional` **id?**: `string`

Defined in: [modules/engine/src/material/material.ts:52](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/material/material.ts#L52)

Optional application-provided identifier.

***

### modules?[​](#modules "Direct link to modules?")

> `optional` **modules?**: `ShaderModule`\[]

Defined in: [modules/engine/src/material/material.ts:58](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/material/material.ts#L58)

Shader modules used when a factory is not supplied.

***

### shaderInputs?[​](#shaderinputs "Direct link to shaderInputs?")

> `optional` **shaderInputs?**: [`ShaderInputs`](https://luma.gl/docs/api-reference/generated/engine/classes/ShaderInputs.md)<`TModuleProps`>

Defined in: [modules/engine/src/material/material.ts:56](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/material/material.ts#L56)

Optional pre-created shader inputs for the material modules.
