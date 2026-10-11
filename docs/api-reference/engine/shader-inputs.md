import {DocumentationBadge, DocumentationBadges} from '@site/src/components/docs/documentation-badges';
import {EngineDocsTabs} from '@site/src/components/docs/engine-docs-tabs';
import {DocumentationContract} from '@site/src/components/docs/foundation-docs';

# ShaderInputs

<EngineDocsTabs group="model" active="shader-inputs" />

`ShaderInputs` stores per-module uniform values and binding values for shader modules.
It is the glue between engine classes like [`Model`](/docs/api-reference/engine/model) and [`Computation`](/docs/api-reference/engine/compute/computation) and the uniform layouts defined by `@luma.gl/shadertools` modules.

<DocumentationContract title="ShaderInputs" rows={[
  {label: 'Role', value: 'Bridge shader-module props to uniform and binding values'},
  {label: 'Construction', value: 'A module map plus optional warning policy'},
  {label: 'Updates', value: 'setProps() merges values by declared module schema'},
  {label: 'Ownership', value: 'Does not take ownership of externally supplied GPU resources'},
  {label: 'Portability', value: 'Uses shared module descriptors across WGSL and GLSL'},
  {label: 'Performance', value: 'Update changed props; reuse the manager across draws'}
]} />

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

Per-module uniform values. A module's uniforms object is replaced, not modified,
when `setProps()` changes one of its values, and is kept when nothing changes.

### `moduleUniformRevisions`

Per-module revision numbers, incremented whenever the module's uniform values change.

### `moduleBindings`

Per-module binding values.

## Methods

### `constructor(modules, options?)`

Creates a `ShaderInputs` instance for one or more shader modules.

### `destroy(): void`

Currently a no-op placeholder for symmetry with other engine resource managers.

### `setProps(props): void`

Updates one or more modules by calling each module's `getUniforms()` function and splitting the result into uniforms and bindings.

<DocumentationBadges>
  <DocumentationBadge tone="version">From v9.3</DocumentationBadge>
</DocumentationBadges>

If a module declares composite `uniformTypes`, `setProps()` preserves nested
struct and array shapes at the module boundary and merges partial updates by the
declared schema.

### `getModules(): ShaderModule[]`

Returns the registered modules, including resolved dependencies.

### `addModules(modules: ShaderModule[]): void`

Registers modules after construction and resolves their dependencies before
initializing uniform and binding state. Use this when the full module set is not
known when the `ShaderInputs` instance is created; subsequent `setProps()`,
`getUniformValues()`, and `getBindingValues()` calls include the added modules.

### `getUniformValues(): Partial<Record<string, Record<string, UniformValue>>>`

Returns the current uniform values grouped by module.

### `getChangedUniformValues(consumedRevisions): Partial<Record<string, Record<string, UniformValue>>>`

Returns the uniform values of the modules whose revision differs from the one in
`consumedRevisions`, and records their current revisions in `consumedRevisions`.
Each consumer keeps its own record (`Model` keeps one per uniform store), so that
consumers sharing a `ShaderInputs` instance each see every change. An empty record
returns all modules.

### `getBindingValues(): Record<string, Binding | TextureBindingSource>`

Merges all module bindings into a single binding map suitable for a `Model` or `Computation`, including engine texture binding sources such as `DynamicTexture` and `VideoTexture`.

### `getDebugTable(): Record<string, Record<string, unknown>>`

Returns a table-like object that is useful with `console.table()` or luma logging.

## Remarks

- `ShaderInputs` does not upload GPU buffers by itself. Engine classes use it together with an internal `UniformStore`.
- `setProps()` compares new values with the stored ones, so that unchanged modules
  are not written again by `Model`. Update uniform values through `setProps()`:
  values changed in place in the objects returned by `getUniformValues()` or
  passed to a module's `getUniforms()` are not detected.
- Unknown module names are ignored and warn by default unless `disableWarnings` is enabled.
- Composite uniform values stay nested in `ShaderInputs`, while `UniformStore`
  and `ShaderBlockWriter` flatten them internally for packing.
