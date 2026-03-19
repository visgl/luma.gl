# ShaderInputs

`ShaderInputs` stores per-module uniform values and binding values for shader modules.
It is the glue between engine classes like [`Model`](/docs/api-reference/engine/model) and [`Computation`](/docs/api-reference/engine/compute/computation) and the uniform layouts defined by `@luma.gl/shadertools` modules.

## Usage

```typescript
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

For the `uniformTypes` descriptor syntax that drives nested uniform handling,
see [Core Shader Types](/docs/api-reference/core/shader-types).

## Types

### `ShaderInputsOptions`

```ts
export type ShaderInputsOptions = {
  disableWarnings?: boolean;
};
```

## Properties

### `modules`

Resolved shader modules, including module dependencies.

### `moduleUniforms`

Per-module uniform values.

### `moduleBindings`

Per-module binding values.

## Methods

### `constructor(modules, options?)`

Creates a `ShaderInputs` instance for one or more shader modules.

### `destroy(): void`

Currently a no-op placeholder for symmetry with other engine resource managers.

### `setProps(props): void`

Updates one or more modules by calling each module's `getUniforms()` function and splitting the result into uniforms and bindings.

<p class="badges">
  <img src="https://img.shields.io/badge/From-v9.3-blue.svg?style=flat-square" alt="From-v9.3" />
</p>

If a module declares composite `uniformTypes`, `setProps()` preserves nested
struct and array shapes at the module boundary and merges partial updates by the
declared schema.

### `getModules(): ShaderModule[]`

Returns the registered modules, including resolved dependencies.

### `getUniformValues(): Partial<Record<string, Record<string, UniformValue>>>`

Returns the current uniform values grouped by module.

### `getBindingValues(): Record<string, Binding>`

Merges all module bindings into a single binding map suitable for a `Model` or `Computation`.

### `getDebugTable(): Record<string, Record<string, unknown>>`

Returns a table-like object that is useful with `console.table()` or luma logging.

## Remarks

- `ShaderInputs` does not upload GPU buffers by itself. Engine classes use it together with an internal `UniformStore`.
- Unknown module names are ignored and warn by default unless `disableWarnings` is enabled.
- Composite uniform values stay nested in `ShaderInputs`, while `UniformStore`
  and `UniformBufferLayout` flatten them internally for packing.
