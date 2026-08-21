# ShaderInputs

[Model](https://luma.gl/docs/api-reference/engine/model.md)[Inputs workflow](https://luma.gl/docs/api-guide/engine/shader-inputs.md)[ShaderInputs](https://luma.gl/docs/api-reference/engine/shader-inputs.md)[Materials](https://luma.gl/docs/api-guide/engine/materials.md)

`ShaderInputs` stores per-module uniform values and binding values for shader modules. It is the glue between engine classes like [`Model`](https://luma.gl/docs/api-reference/engine/model.md) and [`Computation`](https://luma.gl/docs/api-reference/engine/compute/computation.md) and the uniform layouts defined by `@luma.gl/shadertools` modules.

**ShaderInputs**

* Role

  Bridge shader-module props to uniform and binding values

* Construction

  A module map plus optional warning policy

* Updates

  setProps() merges values by declared module schema

* Ownership

  Does not take ownership of externally supplied GPU resources

* Portability

  Uses shared module descriptors across WGSL and GLSL

* Performance

  Update changed props; reuse the manager across draws

## Usage[​](#usage "Direct link to Usage")

```
import {ShaderInputs} from '@luma.gl/engine';

import {picking} from '@luma.gl/shadertools';



const shaderInputs = new ShaderInputs({picking});

shaderInputs.setProps({

  picking: {

    isActive: true,

    highlightedObjectIndex: 5

  }

});
```

For the `uniformTypes` descriptor syntax that drives nested uniform handling, see [Core Shader Types](https://luma.gl/docs/api-reference/core/shader-types.md).

## Types[​](#types "Direct link to Types")

### `ShaderInputsOptions`[​](#shaderinputsoptions "Direct link to shaderinputsoptions")

```
export type ShaderInputsOptions = {

  disableWarnings?: boolean;

};
```

## Properties[​](#properties "Direct link to Properties")

### `modules`[​](#modules "Direct link to modules")

Resolved shader modules, including module dependencies.

### `moduleUniforms`[​](#moduleuniforms "Direct link to moduleuniforms")

Per-module uniform values.

### `moduleBindings`[​](#modulebindings "Direct link to modulebindings")

Per-module binding values.

## Methods[​](#methods "Direct link to Methods")

### `constructor(modules, options?)`[​](#constructormodules-options "Direct link to constructormodules-options")

Creates a `ShaderInputs` instance for one or more shader modules.

### `destroy(): void`[​](#destroy-void "Direct link to destroy-void")

Currently a no-op placeholder for symmetry with other engine resource managers.

### `setProps(props): void`[​](#setpropsprops-void "Direct link to setpropsprops-void")

Updates one or more modules by calling each module's `getUniforms()` function and splitting the result into uniforms and bindings.

From v9.3

If a module declares composite `uniformTypes`, `setProps()` preserves nested struct and array shapes at the module boundary and merges partial updates by the declared schema.

### `getModules(): ShaderModule[]`[​](#getmodules-shadermodule "Direct link to getmodules-shadermodule")

Returns the registered modules, including resolved dependencies.

### `addModules(modules: ShaderModule[]): void`[​](#addmodulesmodules-shadermodule-void "Direct link to addmodulesmodules-shadermodule-void")

Registers modules after construction and resolves their dependencies before initializing uniform and binding state. Use this when the full module set is not known when the `ShaderInputs` instance is created; subsequent `setProps()`, `getUniformValues()`, and `getBindingValues()` calls include the added modules.

### `getUniformValues(): Partial<Record<string, Record<string, UniformValue>>>`[​](#getuniformvalues-partialrecordstring-recordstring-uniformvalue "Direct link to getuniformvalues-partialrecordstring-recordstring-uniformvalue")

Returns the current uniform values grouped by module.

### `getBindingValues(): Record<string, Binding | TextureBindingSource>`[​](#getbindingvalues-recordstring-binding--texturebindingsource "Direct link to getbindingvalues-recordstring-binding--texturebindingsource")

Merges all module bindings into a single binding map suitable for a `Model` or `Computation`, including engine texture binding sources such as `DynamicTexture` and `VideoTexture`.

### `getDebugTable(): Record<string, Record<string, unknown>>`[​](#getdebugtable-recordstring-recordstring-unknown "Direct link to getdebugtable-recordstring-recordstring-unknown")

Returns a table-like object that is useful with `console.table()` or luma logging.

## Remarks[​](#remarks "Direct link to Remarks")

* `ShaderInputs` does not upload GPU buffers by itself. Engine classes use it together with an internal `UniformStore`.
* Unknown module names are ignored and warn by default unless `disableWarnings` is enabled.
* Composite uniform values stay nested in `ShaderInputs`, while `UniformStore` and `ShaderBlockWriter` flatten them internally for packing.
