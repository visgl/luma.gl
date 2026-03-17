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
